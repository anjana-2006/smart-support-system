import express from 'express'
import prisma from '../db/client.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Create request
router.post('/', authenticate, async (req, res) => {
try {
const { title, description } = req.body
const request = await prisma.request.create({
data: {
title,
description,
userId: req.user.userId
}
})
res.status(201).json(request)
} catch (err) {
res.status(500).json({ error: 'Server error' })
}
})

// Get all requests
router.get('/', authenticate, async (req, res) => {
try {
const requests = await prisma.request.findMany({
where: { userId: req.user.userId },
include: { notes: true },
orderBy: { createdAt: 'desc' }
})
res.json(requests)
} catch (err) {
res.status(500).json({ error: 'Server error' })
}
})

// Get single request
router.get('/:id', authenticate, async (req, res) => {
try {
const request = await prisma.request.findUnique({
where: { id: req.params.id },
include: { notes: true }
})
if (!request) return res.status(404).json({ error: 'Not found' })
res.json(request)
} catch (err) {
res.status(500).json({ error: 'Server error' })
}
})

// Update request
router.patch('/:id', authenticate, async (req, res) => {
try {
const request = await prisma.request.update({
where: { id: req.params.id },
data: req.body
})
res.json(request)
} catch (err) {
res.status(500).json({ error: 'Server error' })
}
})

export default router