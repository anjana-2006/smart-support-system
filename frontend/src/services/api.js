import axios from 'axios'

const api = axios.create({
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
})

api.interceptors.request.use((config) => {
const token = localStorage.getItem('token')
if (token) config.headers.Authorization = `Bearer ${token}`
return config
})

api.interceptors.response.use(
(res) => res,
(err) => {
if (err.response?.status === 401 || err.response?.status === 403) {
localStorage.removeItem('token')
localStorage.removeItem('user')
window.location.href = '/login'
}
return Promise.reject(err)
}
)

export const authAPI = {
login: (email, password) => api.post('/auth/login', { email, password }),
register: (data) => api.post('/auth/register', data),
}

export const requestsAPI = {
list: (params) => api.get('/requests', { params }),
get: (id) => api.get(`/requests/${id}`),
create: (data) => api.post('/requests', data),
updateStatus: (id, status) => api.patch(`/requests/${id}/status`, { status }),
addNote: (id, body) => api.post(`/requests/${id}/notes`, { body }),
retryClassification: (id) => api.post(`/requests/${id}/retry-classification`),
}

export default api