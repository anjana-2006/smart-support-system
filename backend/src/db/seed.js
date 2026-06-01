import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
const passwordHash = await bcrypt.hash('admin123', 12)

const admin = await prisma.user.upsert({
where: { email: 'admin@smartsupport.com' },
update: {},
create: {
email: 'admin@smartsupport.com',
passwordHash,
name: 'Admin User',
role: 'ADMIN',
},
})

await prisma.user.upsert({
where: { email: 'agent@smartsupport.com' },
update: {},
create: {
email: 'agent@smartsupport.com',
passwordHash: await bcrypt.hash('agent123', 12),
name: 'Support Agent',
role: 'AGENT',
},
})

const messages = [
{ message: 'I cannot access my dashboard after payment.', customerName: 'Priya Krishnan', customerEmail:
'priya@example.com', sourceChannel: 'WEBSITE' },
{ message: 'I would like to know about your enterprise pricing plans.', customerName: 'Rahul Sharma', customerEmail:
'rahul@acme.com', sourceChannel: 'EMAIL' },
{ message: 'URGENT: Our entire team is locked out of the system!', customerName: 'Vikram Nair', customerEmail:
'vikram@startup.io', sourceChannel: 'WHATSAPP' },
{ message: 'I was charged twice for my subscription this month.', customerName: 'Sneha Menon', customerEmail:
'sneha@gmail.com', sourceChannel: 'WEBSITE' },
]

for (const msg of messages) {
await prisma.customerRequest.create({
data: {
message: msg.message,
customerName: msg.customerName,
customerEmail: msg.customerEmail,
sourceChannel: msg.sourceChannel,
status: 'NEW',
events: { create: { eventType: 'CREATED', newValue: 'NEW' } }
}
})
}

console.log('Seed complete!')
console.log('Admin: admin@smartsupport.com / admin123')
console.log('Agent: agent@smartsupport.com / agent123')
}

main().catch(console.error).finally(() => prisma.$disconnect())