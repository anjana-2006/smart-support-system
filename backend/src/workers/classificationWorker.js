import { Worker } from 'bullmq'
import { prisma } from '../db/client.js'
import { classifyRequest } from '../ai/classifier.js'
import 'dotenv/config'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL, {
tls: {},
maxRetriesPerRequest: null
})
const worker = new Worker('ai-classification', async (job) => {
const { requestId } = job.data
console.log(`[Worker] Processing request ${requestId}`)

const request = await prisma.customerRequest.findUnique({ where: { id: requestId } })
if (!request) throw new Error(`Request ${requestId} not found`)

await prisma.customerRequest.update({
where: { id: requestId },
data: { status: 'PROCESSING' }
})

let aiResult
try {
aiResult = await classifyRequest(request.message)
} catch (aiErr) {
await prisma.aiClassification.upsert({
where: { requestId },
create: { requestId, provider: 'mock', errorState: aiErr.message },
update: { errorState: aiErr.message, retryCount: { increment: 1 } }
})
await prisma.customerRequest.update({
where: { id: requestId },
data: {
status: 'FAILED',
events: { create: { eventType: 'CLASSIFICATION_FAILED', newValue: aiErr.message } }
}
})
throw aiErr
}

await prisma.$transaction([
prisma.aiClassification.upsert({
where: { requestId },
create: {
requestId,
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
retryCount: { increment: 0 },
}
}),
prisma.customerRequest.update({
where: { id: requestId },
data: {
status: 'CLASSIFIED',
categorySnapshot: aiResult.category,
prioritySnapshot: aiResult.priority,
events: {
create: {
eventType: 'CLASSIFIED',
newValue: JSON.stringify({ category: aiResult.category, priority: aiResult.priority })
}
}
}
})
])

// Emit realtime update
try {
const { io } = await import('../index.js')
const updated = await prisma.customerRequest.findUnique({
where: { id: requestId },
include: { classification: true }
})
io.to('admins').emit('request:classified', updated)
} catch {}

console.log(`[Worker] Done: ${requestId} → ${aiResult.category} / ${aiResult.priority}`)
}, { connection: redis, concurrency: 5 }

worker.on('failed', (job, err) => {
console.error(`[Worker] Job ${job?.id} failed:`, err.message)
})

worker.on('completed', (job) => {
console.log(`[Worker] Job ${job.id} completed`)
})

console.log('[Worker] AI classification worker started')