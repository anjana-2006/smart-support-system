import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
const STATUSES = ['NEW', 'QUEUED', 'CLASSIFIED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'FAILED']

export default function RequestDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [request, setRequest] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [noteBody, setNoteBody] = useState('')
    const [addingNote, setAddingNote] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState('')
    const [updatingStatus, setUpdatingStatus] = useState(false)

    useEffect(() => {
        fetchRequest()
        connectSocket()
        socket.on('request:classified', (r) => {
            if (r.id === id) setRequest(prev => ({ ...prev, ...r }))
        })
        socket.on('note:added', ({ requestId, note }) => {
            if (requestId === id) setRequest(prev => ({ ...prev, notes: [...(prev.notes || []), note] }))
        })
        return () => {
            socket.off('request:classified')
            socket.off('note:added')
        }
    }, [id])

    async function fetchRequest() {
        try {
            const { data } = await requestsAPI.get(id)
            setRequest(data.request)
            setSelectedStatus(data.request.status)
        } catch {
            setError('Request not found.')
        } finally {
            setLoading(false)
        }
    }

    async function handleStatusUpdate() {
        if (selectedStatus === request.status) return
        setUpdatingStatus(true)
        try {
            const { data } = await requestsAPI.updateStatus(id, selectedStatus)
            setRequest(prev => ({ ...prev, status: data.request.status }))
        } catch {
            setError('Failed to update status.')
        } finally {
            setUpdatingStatus(false)
        }
    }

    async function handleAddNote(e) {
        e.preventDefault()
        if (!noteBody.trim()) return
        setAddingNote(true)
        try {
            const { data } = await requestsAPI.addNote(id, noteBody)
            setRequest(prev => ({ ...prev, notes: [...(prev.notes || []), data.note] }))
            setNoteBody('')
        } catch {
            setError('Failed to add note.')
        } finally {
            setAddingNote(false)
        }
    }

    async function handleRetry() {
        try {
            await requestsAPI.retryClassification(id)
            setRequest(prev => ({ ...prev, status: 'QUEUED' }))
        } catch {
            setError('Failed to retry.')
        }
    }

    if (loading) return <Layout><p className="loading">Loading request...</p></Layout>
    if (error && !request) return <Layout><div className="error-msg">{error}</div></Layout>

    const ai = request.classification

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <button onClick={() => navigate('/requests')}
                        style={{ background: 'none', border: 'none', color: '#8b8fa8', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                        Back to Requests
                    </button>
                    <h2>Request #{request.id.slice(0, 8)}</h2>
                    <p>From {request.customerName} via {request.sourceChannel}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {request.status === 'FAILED' && (
                        <button className="btn-secondary" onClick={handleRetry}>Retry AI</button>
                    )}
                    <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button className="btn-primary" onClick={handleStatusUpdate}
                        disabled={updatingStatus || selectedStatus === request.status}>
                        {updatingStatus ? 'Updating...' : 'Update Status'}
                    </button>
                </div>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div className="card">
                        <h3 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Customer Message</h3>
                        <p style={{ color: '#c4c7d9', lineHeight: 1.7, fontSize: '0.9rem' }}>{request.message}</p>
                        {request.customerEmail && (
                            <p style={{ color: '#8b8fa8', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                                Email: {request.customerEmail}
                            </p>
                        )}
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>AI Classification</h3>
                            {ai ? (
                                <span style={{ fontSize: '0.75rem', color: '#8b8fa8' }}>
                                    Provider: {ai.provider} · Confidence: {ai.confidence ? Math.round(ai.confidence * 100) + '%' : 'N/A'}
                                </span>
                            ) : (
                                <span className="badge" style={{ background: '#f59e0b22', color: '#f59e0b' }}>Pending</span>
                            )}
                        </div>
                        {ai ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <span className="badge" style={{ background: '#3b82f622', color: '#3b82f6' }}>{ai.category}</span>
                                    <span className="badge" style={{ background: PRIORITY_COLORS[ai.priority] + '22', color: PRIORITY_COLORS[ai.priority] }}>{ai.priority}</span>
                                </div>
                                <div style={{ background: '#0f1117', borderRadius: 8, padding: '0.75rem' }}>
                                    <p style={{ color: '#c4c7d9', fontSize: '0.875rem', lineHeight: 1.6 }}>{ai.summary}</p>
                                </div>
                                <p style={{ color: '#8b8fa8', fontSize: '0.8rem' }}>Reason: {ai.reason}</p>
                            </div>
                        ) : (
                            <p style={{ color: '#8b8fa8', fontSize: '0.875rem' }}>
                                Classification is queued. Page will update automatically.
                            </p>
                        )}
                    </div>

                    <div className="card">
                        <h3 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Internal Notes</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                            {(request.notes || []).length === 0 ? (
                                <p style={{ color: '#8b8fa8', fontSize: '0.875rem' }}>No notes yet.</p>
                            ) : request.notes.map(note => (
                                <div key={note.id} style={{ background: '#0f1117', borderRadius: 8, padding: '0.75rem' }}>
                                    <p style={{ color: '#c4c7d9', fontSize: '0.875rem', lineHeight: 1.6 }}>{note.body}</p>
                                    <p style={{ color: '#8b8fa8', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                                        {note.author?.name} · {new Date(note.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.5rem' }}>
                            <textarea rows={2} placeholder="Add internal note..."
                                value={noteBody} onChange={e => setNoteBody(e.target.value)}
                                style={{ flex: 1, resize: 'none' }} />
                            <button type="submit" className="btn-primary"
                                disabled={addingNote || !noteBody.trim()}
                                style={{ alignSelf: 'flex-end' }}>
                                {addingNote ? '...' : 'Add'}
                            </button>
                        </form>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card">
                        <h3 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Details</h3>
                        <table style={{ width: '100%', fontSize: '0.82rem' }}>
                            <tbody>
                                {[
                                    ['Status', <span className="badge" style={{ background: STATUS_COLORS[request.status] + '22', color: STATUS_COLORS[request.status] }}>{request.status}</span>],
                                    ['Priority', request.prioritySnapshot ? <span className="badge" style={{ background: PRIORITY_COLORS[request.prioritySnapshot] + '22', color: PRIORITY_COLORS[request.prioritySnapshot] }}>{request.prioritySnapshot}</span> : '—'],
                                    ['Category', request.categorySnapshot || '—'],
                                    ['Channel', request.sourceChannel],
                                    ['Created', new Date(request.createdAt).toLocaleString()],
                                    ['Updated', new Date(request.updatedAt).toLocaleString()],
                                ].map(([k, v]) => (
                                    <tr key={k}>
                                        <td style={{ color: '#8b8fa8', paddingBottom: '0.6rem', paddingRight: '0.75rem', verticalAlign: 'top' }}>{k}</td>
                                        <td style={{ color: '#c4c7d9', paddingBottom: '0.6rem' }}>{v}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="card">
                        <h3 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Event Timeline</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {(request.events || []).length === 0 ? (
                                <p style={{ color: '#8b8fa8', fontSize: '0.875rem' }}>No events yet.</p>
                            ) : [...request.events].reverse().map(ev => (
                                <div key={ev.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                                    <div style={{ width: 8, height: 8, minWidth: 8, background: '#6366f1', borderRadius: '50%', marginTop: 5 }} />
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: '#c4c7d9', fontWeight: 500 }}>
                                            {ev.eventType.replace(/_/g, ' ')}
                                        </p>
                                        {ev.oldValue && ev.newValue && (
                                            <p style={{ fontSize: '0.75rem', color: '#8b8fa8' }}>{ev.oldValue} → {ev.newValue}</p>
                                        )}
                                        <p style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                                            {new Date(ev.createdAt).toLocaleString()}{ev.actor ? ' · ' + ev.actor.name : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}