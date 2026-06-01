import 'dotenv/config'
import { Redis } from '@upstash/redis'

export const redis = new Redis({
url: process.env.UPSTASH_REDIS_REST_URL,
token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export const classificationQueue = {
add: async (name, data, opts) => {
const jobId = opts?.jobId || `job-${Date.now()}`
await redis.set(`job:${jobId}`, JSON.stringify({ name, data, status: 'waiting' }))
await redis.lpush('queue:ai-classification', jobId)
console.log(`[Queue] Job ${jobId} added`)
return { id: jobId }
}
}

export async function enqueueClassification(requestId, isRetry = false) {
const jobId = isRetry ? `retry-${requestId}-${Date.now()}` : requestId
await classificationQueue.add('classify', { requestId, isRetry }, { jobId })
}