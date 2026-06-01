import { useNavigate, useLocation } from 'react-router-dom'
import { disconnectSocket } from '../services/socket'
import './Layout.css'

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/requests', label: 'Requests', icon: '📋' },
    { path: '/notes', label: 'Notes', icon: '📝' },
]

export default function Layout({ children, liveCount = 0 }) {
    const navigate = useNavigate()
    const location = useLocation()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    function logout() {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        disconnectSocket()
        navigate('/login')
    }

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-brand">🎧 SmartSupport</div>
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <a key={item.path} href={item.path}
                            onClick={(e) => { e.preventDefault(); navigate(item.path) }}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </a>
                    ))}
                </nav>
                {liveCount > 0 && (
                    <div className="live-badge">
                        <span className="live-dot" /> {liveCount} live update{liveCount > 1 ? 's' : ''}
                    </div>
                )}
                <div className="sidebar-user">
                    <div className="user-avatar">{user.name?.[0]?.toUpperCase() || 'A'}</div>
                    <div className="user-info">
                        <p className="user-name">{user.name || 'Admin'}</p>
                        <p className="user-role">{user.role || 'Agent'}</p>
                    </div>
                    <button className="logout-btn" onClick={logout} title="Logout">↩</button>
                </div>
            </aside>
            <main className="main-content">{children}</main>
        </div>
    )
}