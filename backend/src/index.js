import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server } from 'socket.io'
import rateLimit from 'express-rate-limit'
import 'dotenv/config'

import authRoutes from './routes/auth.js'
import requestRoutes from './routes/requests.js'
import webhookRoutes from './routes/webhooks.js'
import { authenticateToken } from './middleware/auth.js'

const app = express()
const httpServer = createServer(app)

export const io = new Server(httpServer, {
cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5174', credentials: true }
})

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5174', credentials: true }))
app.use(express.json({ limit: '10kb' }))

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Too many requests' } })
const strictLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many requests' } })

app.use('/api/auth', strictLimiter, authRoutes)
app.use('/api/requests', limiter, authenticateToken, requestRoutes)
app.use('/api/webhooks', limiter, webhookRoutes)

io.on('connection', (socket) => {
console.log('Admin connected:', socket.id)
socket.join('admins')
socket.on('disconnect', () => console.log('Admin disconnected:', socket.id))
})

app.use((err, req, res, next) => {
console.error(err)
res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))