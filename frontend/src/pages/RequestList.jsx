import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { requestsAPI } from '../services/api'
import socket, { connectSocket } from '../services/socket'
import '../components/Layout.css'

const STATUS_COLORS = { NEW: '#6366f1', QUEUED: '#8b5cf6', PROCESSING: '#f59e0b', CLASSIFIED: '#3b82f6', IN_PROGRESS: '#f59e0b', RESOLVED: '#10b981', CLOSED: '#6b7280', FAILED: '#ef4444' }
const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }
const STATUSES = ['NEW', 'QUEUED', 'PROCESSING', 'CLASSIFIED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'FAILED']

export default function RequestList() {
    const navigate = useNavigate()
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState({ status: '', priority: '', category: '' })
    const [showNew, setShowNew] = useState(false)
    const [newForm, setNewForm] = useState({ message: '', customerName: '', customerEmail: '', sourceChannel: 'API' })
    const [submitting, setSubmitting] = useState(false)
    const [liveCount, setLiveCount] = useState(0)

    useEffect(() => { fetchRequests() }, [page, filters])

    useEffect(() => {
        connectSocket()
        socket.on('request:new', (req) => { setRequests(prev => [req, ...prev]); setLiveCount(c => c + 1); setTimeout(() => setLiveCount(c => Math.max(0, c - 1)), 4000) })
        socket.on('request:classified', (req) => setRequests(prev => prev.map(r => r.id === req.id ? { ...r, ...req } : r)))
        socket.on('request:updated', (req) => setRequests(prev => prev.map(r => r.id === req.id ? { ...r, ...req } : r)))
        return () => { socket.off('request:new'); socket.off('request:classified'); socket.off('request:updated') }
    }, [])

    async function fetchRequests() {
        setLoading(true)
        try {
            const params = { page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }
            const { data } = await requestsAPI.list(params)
            setRequests(data.requests); setTotal(data.total)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    async function handleCreate(e) {
        e.preventDefault()
        if (!newForm.message || !newForm.customerName) return
        setSubmitting(true)
        try {
            await requestsAPI.create(newForm)
            setShowNew(false); setNewForm({ message: '', customerName: '', customerEmail: '', sourceChannel: 'API' }); fetchRequests()
        } catch (e) { console.error(e) }
        finally { setSubmitting(false) }
    }

    return (
        <Layout liveCount={liveCount}>
            <div className="page-header">
                <div><h2>Requests</h2><p>{total} total tickets</p></div>
                <button className="btn-primary" onClick={() => setShowNew(true)}>+ New Request</button>
            </div>

            {showNew && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1rem' }}>Create New Request</h3>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', color: '#c4c7d9', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Customer Name *</label>
                                <input type="text" placeholder="John Doe" value={newForm.customerName} onChange={e => setNewForm(p => ({ ...p, customerName: e.target.value }))} style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#c4c7d9', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Email</label>
                                <input type="text" placeholder="john@example.com" value={newForm.customerEmail} onChange={e => setNewForm(p => ({ ...p, customerEmail: e.target.value }))} style={{ width: '100%' }} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', color: '#c4c7d9', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Message *</label>
                            <textarea rows={3} placeholder="Describe the customer's request…" value={newForm.message} onChange={e => setNewForm(p => ({ ...p, message: e.target.value }))} style={{ width: '100%', resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <select value={newForm.sourceChannel} onChange={e => setNewForm(p => ({ ...p, sourceChannel: e.target.value }))}>
                                {['API', 'WEBSITE', 'EMAIL', 'WHATSAPP'].map(c => <option key={c}>{c}</option>)}
                            </select>
                            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Creating…' : 'Create & Classify'}</button>
                            <button type="button" className="btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <select value={filters.status} onChange={e => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1) }}>
                    <option value="">All Statuses</option>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <select value={filters.priority} onChange={e => { setFilters(p => ({ ...p, priority: e.target.value })); setPage(1) }}>
                    <option value="">All Priorities</option>
                    {['high', 'medium', 'low'].map(p => <option key={p}>{p}</option>)}
                </select>
                <select value={filters.category} onChange={e => { setFilters(p => ({ ...p, category: e.target.value })); setPage(1) }}>
                    <option value="">All Categories</option>
                    {['support', 'sales', 'urgent', 'spam', 'billing', 'other'].map(c => <option key={c}>{c}</option>)}
                </select>
                {(filters.status || filters.priority || filters.category) && (
                    <button className="btn-secondary" onClick={() => { setFilters({ status: '', priority: '', category: '' }); setPage(1) }}>Clear</button>
                )}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? <p className="loading">Loading…</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>{['ID', 'Customer', 'Message', 'Category', 'Priority', 'Status', 'Created'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#8b8fa8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid #2a2d3e', background: '#1a1d27' }}>{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody>
                            {requests.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#8b8fa8' }}>No requests found</td></tr>
                            ) : requests.map(r => (
                                <tr key={r.id} onClick={() => navigate(`/requests/${r.id}`)} style={{ cursor: 'pointer' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#20243a'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '0.75rem 1rem', color: '#6366f1', fontFamily: 'monospace', fontSize: '0.78rem', borderBottom: '1px solid #1e2130' }}>{r.id.slice(0, 8)}</td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', borderBottom: '1px solid #1e2130' }}>{r.customerName}</td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#8b8fa8', borderBottom: '1px solid #1e2130', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.message}</td>
                                    <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #1e2130' }}>{r.categorySnapshot && <span className="badge" style={{ background: '#3b82f622', color: '#3b82f6' }}>{r.categorySnapshot}</span>}</td>
                                    <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #1e2130' }}>{r.prioritySnapshot && <span className="badge" style={{ background: PRIORITY_COLORS[r.prioritySnapshot] + '22', color: PRIORITY_COLORS[r.prioritySnapshot] }}>{r.prioritySnapshot}</span>}</td>
                                    <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #1e2130' }}><span className="badge" style={{ background: STATUS_COLORS[r.status] + '22', color: STATUS_COLORS[r.status] }}>{r.status}</span></td>
                                    <td style={{ padding: '0.75rem 1rem', color: '#8b8fa8', fontSize: '0.78rem', borderBottom: '1px solid #1e2130', whiteSpace: 'nowrap' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {Math.ceil(total / 15) > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
                    <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    <span style={{ color: '#8b8fa8', fontSize: '0.875rem', alignSelf: 'center' }}>Page {page} of {Math.ceil(total / 15)}</span>
                    <button className="btn-secondary" disabled={page === Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
            )}
        </Layout>
    )
}