const URGENCY_WORDS = ['urgent', 'asap', 'immediately', 'broken', 'down', 'critical', 'emergency', 'cannot', 'failed']
const SALES_WORDS = ['pricing', 'plan', 'upgrade', 'buy', 'purchase', 'trial', 'demo', 'subscription']
const BILLING_WORDS = ['invoice', 'payment', 'charge', 'refund', 'bill', 'receipt', 'transaction']
const SPAM_WORDS = ['free money', 'click here', 'winner', 'lottery', 'prize']

function mockClassify(message) {
const lower = message.toLowerCase()
const hasUrgency = URGENCY_WORDS.some(function(w) { return lower.includes(w) })
const hasSales = SALES_WORDS.some(function(w) { return lower.includes(w) })
const hasBilling = BILLING_WORDS.some(function(w) { return lower.includes(w) })
const hasSpam = SPAM_WORDS.some(function(w) { return lower.includes(w) })

let category = 'support'
let priority = 'medium'
let confidence = 0.72

if (hasSpam) { category = 'spam'; priority = 'low'; confidence = 0.91 }
else if (hasUrgency) { category = 'urgent'; priority = 'high'; confidence = 0.85 }
else if (hasBilling) { category = 'billing'; priority = 'medium'; confidence = 0.80 }
else if (hasSales) { category = 'sales'; priority = 'medium'; confidence = 0.78 }

const summary = {
support: 'Customer needs technical assistance.',
sales: 'Customer is inquiring about plans or pricing.',
urgent: 'High-urgency issue. Requires immediate attention.',
spam: 'Message flagged as likely spam.',
billing: 'Customer has a billing related query.',
other: 'Request needs manual review.',
}

const reason = {
support: 'No urgency or sales signals found.',
sales: 'Purchase intent signals detected.',
urgent: 'Urgency keywords detected.',
spam: 'Spam patterns found.',
billing: 'Billing keywords detected.',
other: 'No strong category signals.',
}

return {
category: category,
priority: priority,
summary: summary[category],
confidence: confidence,
reason: reason[category],
provider: 'mock',
}
}

export async function classifyRequest(message) {
await new Promise(function(r) { setTimeout(r, 500) })
return mockClassify(message)
}