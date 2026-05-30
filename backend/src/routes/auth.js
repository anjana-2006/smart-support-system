import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../db/client.js'

const router = express.Router()

router.post('/register', async (req, res) => {
try {
const { email, password } = req.body
const hashed = await bcrypt.hash(password, 10)
const user = await prisma.user.create({
data: { email, password: hashed }
})
res.status(201).json({ message: 'User created', userId: user.id })
} catch (err) {
res.status(400).json({ error: 'Email already exists' })
}
})

router.post('/login', async (req, res) => {
try {
const { email, password } = req.body
const user = await prisma.user.findUnique({ where: { email } })
if (!user) return res.status(401).json({ error: 'Invalid credentials' })

const valid = await bcrypt.compare(password, user.password)
if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

const token = jwt.sign(
{ userId: user.id, role: user.role },
process.env.JWT_SECRET,
{ expiresIn: process.env.JWT_EXPIRES_IN }
)
res.json({ token, role: user.role })
} catch (err) {
res.status(500).json({ error: 'Server error' })
}
})

export default router