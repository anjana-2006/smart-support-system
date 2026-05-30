import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import requestRoutes from './routes/requests.js'

dotenv.config()

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/requests', requestRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
console.log(`🚀 Server running on port ${PORT}`)
})

export default app