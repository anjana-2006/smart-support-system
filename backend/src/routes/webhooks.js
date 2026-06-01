import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db/client.js'
import { enqueueClassification } from '../workers/queue.js'
import { io } from '../index.js'
import crypto from 'crypto'

const router = Router()

const inboundSchema = z.object({
message: z.string().min(1).max(5000),
customerName: z.string().min(1),
customerEmail: z.string().email().optional(),
channel: z.enum(['WHATSAPP', 'EMAIL', 'WEBSITE']).default('WEBSITE'),
idempotencyKey: z.string().optional(),
})

router.post('/inbound', async (req, res, next) => {
try {
const data = inboundSchema.parse(req.body)

if (data.idempotencyKey) {
const existing = await prisma.customerRequest.findUnique({
where: { idempotencyKey: data.idempotencyKey }
})
if (existing) return res.status(200).json({ request: existing, duplicate: true })
}

const request = await prisma.customerRequest.create({
data: {
message: data.message,
customerName: data.customerName,
customerEmail: data.customerEmail,
sourceChannel: data.channel,
status: 'QUEUED',
idempotencyKey: data.idempotencyKey || crypto.randomUUID(),
events: {
create: { eventType: 'WEBHOOK_RECEIVED', newValue: 'QUEUED' }
}
}
})

await enqueueClassification(request.id)
io.to('admins').emit('request:new', request)
res.status(201).json({ request })
} catch (err) {
if (err.name === 'ZodError') return res.status(400).json({ error: err.errors })
next(err)
}
})

export default router