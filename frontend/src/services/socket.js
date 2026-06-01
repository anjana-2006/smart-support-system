import { io } from 'socket.io-client'

const socket = io(
import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000',
{ autoConnect: false }
)

export function connectSocket() {
if (!socket.connected) socket.connect()
}

export function disconnectSocket() {
socket.disconnect()
}

export default socket