import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes (will add in Phase 2)
// app.use('/api/auth', authRoutes)
// app.use('/api/requests', requestRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
console.log(`🚀 Server running on port ${PORT}`)
})

export default app