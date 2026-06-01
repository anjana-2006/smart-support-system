import { useNavigate } from 'react-router-dom'

const STATUS_COLORS = {
    NEW: '#6366f1', QUEUED: '#8b5cf6', PROCESSING: '#f59e0b',
    CLASSIFIED: '#3b82f6', IN_PROGRESS: '#f59e0b',
    RESOLVED: '#10b981', CLOSED: '#6b7280', FAILED: '#ef4444'
}

const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }

export default function RequestCard({ request }) {
    const navigate = useNavigate()

    return (
        <div
            onClick={() => navigate(`/requests/${request.id}`)}
            style={{
                background: '#1a1d27',
                border: '1px solid #2a2d3e',
                borderRadius: 12,
                padding: '1rem 1.25rem',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2d3e'}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ color: '#6366f1', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                    #{request.id.slice(0, 8)}
                </span>
                <span style={{
                    background: STATUS_COLORS[request.status] + '22',
                    color: STATUS_COLORS[request.status],
                    padding: '0.2rem 0.6rem',
                    borderRadius: 20,
                    fontSize: '0.72rem',
                    fontWeight: 700
                }}>
                    {request.status}
                </span>
            </div>

            <p style={{ color: '#e2e4f0', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                {request.customerName}
            </p>

            <p style={{
                color: '#8b8fa8',
                fontSize: '0.82rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: '0.75rem'
            }}>
                {request.message}
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {request.categorySnapshot && (
                    <span style={{
                        background: '#3b82f622',
                        color: '#3b82f6',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 20,
                        fontSize: '0.72rem',
                        fontWeight: 700
                    }}>
                        {request.categorySnapshot}
                    </span>
                )}
                {request.prioritySnapshot && (
                    <span style={{
                        background: PRIORITY_COLORS[request.prioritySnapshot] + '22',
                        color: PRIORITY_COLORS[request.prioritySnapshot],
                        padding: '0.2rem 0.6rem',
                        borderRadius: 20,
                        fontSize: '0.72rem',
                        fontWeight: 700
                    }}>
                        {request.prioritySnapshot}
                    </span>
                )}
                <span style={{ color: '#6b7280', fontSize: '0.75rem', marginLeft: 'auto' }}>
                    {new Date(request.createdAt).toLocaleDateString()}
                </span>
            </div>
        </div>
    )
}