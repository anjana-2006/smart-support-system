import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db/client.js'
import { classifyRequest } from '../ai/classifier.js'
import { io } from '../index.js'

const router = Router()

const createSchema = z.object({
message: z.string().min(1).max(5000),
customerName: z.string().min(1),
customerEmail: z.string().email().optional().or(z.literal('')),
sourceChannel: z.enum(['API', 'WEBHOOK', 'WHATSAPP', 'EMAIL', 'WEBSITE']).optional(),
idempotencyKey: z.string().optional(),
})

const statusSchema = z.object({
status: z.enum(['NEW', 'QUEUED', 'PROCESSING', 'CLASSIFIED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'FAILED']),
})

const noteSchema = z.object({
body: z.string().min(1).max(10000),
})

// POST /api/requests
router.post('/', async (req, res, next) => {
try {
const data = createSchema.parse(req.body)

const request = await prisma.customerRequest.create({
data: {
message: data.message,
customerName: data.customerName,
customerEmail: data.customerEmail || null,
sourceChannel: data.sourceChannel || 'API',
status: 'QUEUED',
idempotencyKey: data.idempotencyKey,
events: {
create: { eventType: 'CREATED', newValue: 'QUEUED', actorId: req.user?.id }
}
},
include: { events: true }
})

io.to('admins').emit('request:new', request)

// Classify in background without blocking
classifyRequest(request.message).then(async (aiResult) => {
await prisma.aiClassification.create({
data: {
requestId: request.id,
provider: aiResult.provider || 'mock',
category: aiResult.category,
priority: aiResult.priority,
summary: aiResult.summary,
confidence: aiResult.confidence,
reason: aiResult.reason,
rawOutput: aiResult,
}
})
await prisma.customerRequest.update({
where: { id: request.id },
data: {
status: 'CLASSIFIED',
categorySnapshot: aiResult.category,
prioritySnapshot: aiResult.priority,
events: {
create: {
eventType: 'CLASSIFIED',
newValue: aiResult.category + '/' + aiResult.priority
}
}
}
})
const updated = await prisma.customerRequest.findUnique({
where: { id: request.id },
include: { classification: true }
})
io.to('admins').emit('request:classified', updated)
}).catch(console.error)

res.status(201).json({ request })
} catch (err) {
if (err.name === 'ZodError') return res.status(400).json({ error: err.errors })
next(err)
}
})

// GET /api/requests
router.get('/', async (req, res, next) => {
try {
const { status, priority, category, page = '1', limit = '20' } = req.query
const where = {}
if (status) where.status = status
if (priority) where.prioritySnapshot = priority
if (category) where.categorySnapshot = category

const skip = (parseInt(page) - 1) * parseInt(limit)
const [requests, total] = await Promise.all([
prisma.customerRequest.findMany({
where,
include: { classification: true, _count: { select: { notes: true } } },
orderBy: { createdAt: 'desc' },
skip,
take: parseInt(limit),
}),
prisma.customerRequest.count({ where })
])

res.json({ requests, total, page: parseInt(page), limit: parseInt(limit) })
} catch (err) { next(err) }
})

// GET /api/requests/:id
router.get('/:id', async (req, res, next) => {
try {
const request = await prisma.customerRequest.findUnique({
where: { id: req.params.id },
include: {
classification: true,
notes: { include: { author: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: 'asc' } },
events: { include: { actor: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' } },
}
})
if (!request) return res.status(404).json({ error: 'Request not found' })
res.json({ request })
} catch (err) { next(err) }
})

// PATCH /api/requests/:id/status
router.patch('/:id/status', async (req, res, next) => {
try {
const { status } = statusSchema.parse(req.body)
const existing = await prisma.customerRequest.findUnique({ where: { id: req.params.id } })
if (!existing) return res.status(404).json({ error: 'Request not found' })

const request = await prisma.customerRequest.update({
where: { id: req.params.id },
data: {
status,
events: {
create: { eventType: 'STATUS_CHANGED', oldValue: existing.status, newValue: status, actorId: req.user.id }
}
},
include: { classification: true }
})

io.to('admins').emit('request:updated', request)
res.json({ request })
} catch (err) {
if (err.name === 'ZodError') return res.status(400).json({ error: err.errors })
next(err)
}
})

// POST /api/requests/:id/notes
router.post('/:id/notes', async (req, res, next) => {
try {
const { body } = noteSchema.parse(req.body)
const exists = await prisma.customerRequest.findUnique({ where: { id: req.params.id } })
if (!exists) return res.status(404).json({ error: 'Request not found' })

const note = await prisma.note.create({
data: { requestId: req.params.id, authorId: req.user.id, body },
include: { author: { select: { id: true, name: true, role: true } } }
})

io.to('admins').emit('note:added', { requestId: req.params.id, note })
res.status(201).json({ note })
} catch (err) {
if (err.name === 'ZodError') return res.status(400).json({ error: err.errors })
next(err)
}
})

// POST /api/requests/:id/retry-classification
router.post('/:id/retry-classification', async (req, res, next) => {
try {
const request = await prisma.customerRequest.findUnique({ where: { id: req.params.id } })
if (!request) return res.status(404).json({ error: 'Request not found' })

classifyRequest(request.message).then(async (aiResult) => {
await prisma.aiClassification.upsert({
where: { requestId: req.params.id },
create: {
requestId: req.params.id,
provider: aiResult.provider || 'mock',
category: aiResult.category,
priority: aiResult.priority,
summary: aiResult.summary,
confidence: aiResult.confidence,
reason: aiResult.reason,
rawOutput: aiResult,
},
update: {
category: aiResult.category,
priority: aiResult.priority,
summary: aiResult.summary,
confidence: aiResult.confidence,
reason: aiResult.reason,
rawOutput: aiResult,
errorState: null,
}
})
await prisma.customerRequest.update({
where: { id: req.params.id },
data: {
status: 'CLASSIFIED',
categorySnapshot: aiResult.category,
prioritySnapshot: aiResult.priority,
}
})
const updated = await prisma.customerRequest.findUnique({
where: { id: req.params.id },
include: { classification: true }
})
io.to('admins').emit('request:classified', updated)
}).catch(console.error)

res.json({ message: 'Retry started' })
} catch (err) { next(err) }
})

export default router