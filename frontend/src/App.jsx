import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RequestList from './pages/RequestList'
import RequestDetail from './pages/RequestDetail'
import Notes from './pages/Notes'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/requests" element={<PrivateRoute><RequestList /></PrivateRoute>} />
        <Route path="/requests/:id" element={<PrivateRoute><RequestDetail /></PrivateRoute>} />
        <Route path="/notes" element={<PrivateRoute><Notes /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App