import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

const styles = {
    bg: { minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Segoe UI, sans-serif' },
    card: { background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 400 },
    brand: { textAlign: 'center', marginBottom: '2rem' },
    icon: { fontSize: '2.5rem' },
    h1: { color: '#fff', fontSize: '1.6rem', fontWeight: 700, margin: '0.5rem 0 0.25rem' },
    sub: { color: '#8b8fa8', fontSize: '0.9rem', margin: 0 },
    form: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
    error: { background: '#2d1a1a', border: '1px solid #6b2222', color: '#f87171', padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.875rem' },
    field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { color: '#c4c7d9', fontSize: '0.875rem', fontWeight: 500 },
    input: { background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: 8, color: '#fff', padding: '0.75rem 1rem', fontSize: '0.95rem', outline: 'none' },
    btn: { background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '0.85rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' },
    hint: { textAlign: 'center', color: '#8b8fa8', fontSize: '0.8rem', marginTop: '1.5rem' },
}

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        if (!email || !password) { setError('Please fill in all fields.'); return }
        setLoading(true)
        try {
            const { data } = await authAPI.login(email, password)
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.')
        } finally { setLoading(false) }
    }

    return (
        <div style={styles.bg}>
            <div style={styles.card}>
                <div style={styles.brand}>
                    <div style={styles.icon}>🎧</div>
                    <h1 style={styles.h1}>SmartSupport</h1>
                    <p style={styles.sub}>AI-powered customer request routing</p>
                </div>
                <form onSubmit={handleSubmit} style={styles.form}>
                    {error && <div style={styles.error}>{error}</div>}
                    <div style={styles.field}>
                        <label style={styles.label}>Email</label>
                        <input style={styles.input} type="email" placeholder="admin@smartsupport.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>Password</label>
                        <input style={styles.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <button style={styles.btn} type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
                </form>
                <p style={styles.hint}>Default: admin@smartsupport.com / admin123</p>
            </div>
        </div>
    )
}