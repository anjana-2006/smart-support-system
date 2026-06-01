import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { requestsAPI } from '../services/api'
import socket, { connectSocket } from '../services/socket'
import '../components/Layout.css'

const STATUS_COLORS = {
    NEW: '#6366f1', QUEUED: '#8b5cf6', PROCESSING: '#f59e0b',
    CLASSIFIED: '#3b82f6', IN_PROGRESS: '#f59e0b',
    RESOLVED: '#10b981', CLOSED: '#6b7280', FAILED: '#ef4444'
}

const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }

export default function Dashboard() {
    const navigate = useNavigate()
    const [requests, setRequests] = useState([])
    const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0, failed: 0 })
    const [loading, setLoading] = useState(true)
    const [liveCount, setLiveCount] = useState(0)

    useEffect(() => {
        fetchRequests()
        connectSocket()

        socket.on('request:new', (req) => {
            setRequests(prev => [req, ...prev.slice(0, 9)])
            setLiveCount(c => c + 1)
            setTimeout(() => setLiveCount(c => Math.max(0, c - 1)), 4000)
        })
        socket.on('request:classified', (req) => {
            setRequests(prev => prev.map(r => r.id === req.id ? req : r))
        })
        socket.on('request:updated', (req) => {
            setRequests(prev => prev.map(r => r.id === req.id ? req : r))
        })

        return () => {
            socket.off('request:new')
            socket.off('request:classified')
            socket.off('request:updated')
        }
    }, [])

    async function fetchRequests() {
        try {
            const { data } = await requestsAPI.list({ limit: 10 })
            setRequests(data.requests)
            const s = { open: 0, inProgress: 0, resolved: 0, failed: 0 }
            data.requests.forEach(r => {
                if (['NEW', 'QUEUED', 'CLASSIFIED'].includes(r.status)) s.open++
                if (r.status === 'IN_PROGRESS') s.inProgress++
                if (r.status === 'RESOLVED') s.resolved++
                if (r.status === 'FAILED') s.failed++
            })
            setStats(s)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const statCards = [
        { label: 'Open Tickets', value: stats.open, color: '#6366f1' },
        { label: 'In Progress', value: stats.inProgress, color: '#f59e0b' },
        { label: 'Resolved', value: stats.resolved, color: '#10b981' },
        { label: 'Failed', value: stats.failed, color: '#ef4444' },
    ]

    return (
        <Layout liveCount={liveCount}>
            <div className="page-header">
                <div>
                    <h2>Dashboard</h2>
                    <p>Welcome back! Here's a live overview.</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/requests')}>
                    + New Ticket
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {statCards.map(s => (
                    <div key={s.label} className="card">
                        <p style={{ color: '#8b8fa8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                            {s.label}
                        </p>
                        <p style={{ fontSize: '2rem', fontWeight: 700, color: s.color }}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="card">
                <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Recent Tickets
                </h3>
                {loading ? (
                    <p className="loading">Loading…</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['ID', 'Customer', 'Message', 'Priority', 'Status'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.75rem', color: '#8b8fa8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid #2a2d3e' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#8b8fa8' }}>
                                        No requests yet
                                    </td>
                                </tr>
                            ) : requests.map(r => (
                                <tr key={r.id}
                                    onClick={() => navigate(`/requests/${r.id}`)}
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#20243a'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '0.75rem', color: '#6366f1', fontFamily: 'monospace', fontSize: '0.8rem', borderBottom: '1px solid #1e2130' }}>
                                        {r.id.slice(0, 8)}
                                    </td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', borderBottom: '1px solid #1e2130' }}>
                                        {r.customerName}
                                    </td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#8b8fa8', borderBottom: '1px solid #1e2130', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {r.message}
                                    </td>
                                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #1e2130' }}>
                                        {r.prioritySnapshot && (
                                            <span className="badge" style={{ background: PRIORITY_COLORS[r.prioritySnapshot] + '22', color: PRIORITY_COLORS[r.prioritySnapshot] }}>
                                                {r.prioritySnapshot}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #1e2130' }}>
                                        <span className="badge" style={{ background: STATUS_COLORS[r.status] + '22', color: STATUS_COLORS[r.status] }}>
                                            {r.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <button className="btn-secondary" style={{ marginTop: '1rem', width: '100%' }} onClick={() => navigate('/requests')}>
                    View all requests →
                </button>
            </div>
        </Layout>
    )
}