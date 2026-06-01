import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../db/client.js'

const router = Router()

const loginSchema = z.object({
email: z.string().email(),
password: z.string().min(6),
})

const registerSchema = z.object({
email: z.string().email(),
password: z.string().min(6),
name: z.string().min(1),
role: z.enum(['ADMIN', 'AGENT']).optional(),
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
try {
const { email, password } = loginSchema.parse(req.body)
const user = await prisma.user.findUnique({ where: { email } })
if (!user) return res.status(401).json({ error: 'Invalid credentials' })

const valid = await bcrypt.compare(password, user.passwordHash)
if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

const token = jwt.sign(
{ id: user.id, email: user.email, role: user.role, name: user.name },
process.env.JWT_SECRET,
{ expiresIn: '24h' }
)
res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
} catch (err) {
if (err.name === 'ZodError') return res.status(400).json({ error: err.errors })
next(err)
}
})

// POST /api/auth/register (admin only in production, open for setup)
router.post('/register', async (req, res, next) => {
try {
const { email, password, name, role } = registerSchema.parse(req.body)
const exists = await prisma.user.findUnique({ where: { email } })
if (exists) return res.status(409).json({ error: 'Email already registered' })

const passwordHash = await bcrypt.hash(password, 12)
const user = await prisma.user.create({
data: { email, passwordHash, name, role: role || 'AGENT' },
select: { id: true, email: true, name: true, role: true, createdAt: true }
})
res.status(201).json({ user })
} catch (err) {
if (err.name === 'ZodError') return res.status(400).json({ error: err.errors })
next(err)
}
})

export default router