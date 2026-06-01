import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { requestsAPI } from '../services/api'
import socket, { connectSocket } from '../services/socket'
import '../components/Layout.css'

export default function Notes() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [allNotes, setAllNotes] = useState([])
    const [liveCount, setLiveCount] = useState(0)

    useEffect(() => {
        fetchAll()
        connectSocket()
        socket.on('note:added', ({ note, requestId }) => {
            setAllNotes(prev => [{ ...note, requestId }, ...prev])
            setLiveCount(c => c + 1)
            setTimeout(() => setLiveCount(c => Math.max(0, c - 1)), 4000)
        })
        return () => socket.off('note:added')
    }, [])

    async function fetchAll() {
        try {
            const { data } = await requestsAPI.list({ limit: 50 })
            const notes = []
            for (const req of data.requests) {
                if (req._count?.notes > 0) {
                    try {
                        const detail = await requestsAPI.get(req.id)
                        detail.data.request.notes.forEach(n => notes.push({ ...n, requestId: req.id, requestCustomer: req.customerName }))
                    } catch { }
                }
            }
            notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            setAllNotes(notes)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    return (
        <Layout liveCount={liveCount}>
            <div className="page-header">
                <div><h2>Internal Notes</h2><p>All notes across requests — most recent first</p></div>
            </div>
            {loading ? <p className="loading">Loading notes…</p> : allNotes.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: '#8b8fa8' }}>No notes yet. Open a request and add the first one.</p>
                    <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/requests')}>Go to Requests</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {allNotes.map(note => (
                        <div key={note.id} className="card" style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}
                            onClick={() => navigate(`/requests/${note.requestId}`)}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2d3e'}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#6366f1', fontSize: '0.78rem', fontFamily: 'monospace' }}>Request #{note.requestId?.slice(0, 8)} · {note.requestCustomer}</span>
                                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{new Date(note.createdAt).toLocaleString()}</span>
                            </div>
                            <p style={{ color: '#c4c7d9', fontSize: '0.9rem', lineHeight: 1.6 }}>{note.body}</p>
                            <p style={{ color: '#8b8fa8', fontSize: '0.78rem', marginTop: '0.4rem' }}>— {note.author?.name}</p>
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    )
}