/**
 * NEONFALL — Multiplayer mini-service
 * -----------------------------------
 * Socket.io realtime backend for 1v1 Tetris-style matches.
 * Each room is identified by a unique 4-character uppercase code and holds at
 * most 2 players. Line clears are converted to garbage using the standard
 * Tetris formula ([0,0,1,2,4] for 0..4 cleared lines).
 *
 * Port: 3004 (3003 is used by examples/websocket)
 * Path: "/" (Caddy forwards to this path — DO NOT change)
 */

import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

const PORT = 3004

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Player {
  socketId: string
  playerName: string
}

interface Room {
  id: string
  players: Map<string, Player> // socketId -> Player
  createdAt: number
}

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------

const rooms = new Map<string, Room>()
// socketId -> roomId (quick lookup on disconnect)
const socketRoom = new Map<string, string>()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a unique 4-char uppercase room code (A-Z). */
function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (let attempt = 0; attempt < 1000; attempt++) {
    let code = ''
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    if (!rooms.has(code)) return code
  }
  // Astronomically unlikely fallback — but never return a duplicate.
  return 'ZZZZ'
}

/** Strict 4-char uppercase A-Z validation. */
function isValidRoomId(id: unknown): id is string {
  return typeof id === 'string' && /^[A-Z]{4}$/.test(id)
}

/** Player name 1-16 chars, strip whitespace. */
function sanitizePlayerName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (trimmed.length < 1 || trimmed.length > 16) return null
  return trimmed
}

/** Standard Tetris garbage formula. Only doubles/triples/tetrises send junk. */
const GARBAGE_TABLE = [0, 0, 1, 2, 4] as const
function linesToGarbage(cleared: number): number {
  if (cleared < 0 || cleared > 4) return 0
  return GARBAGE_TABLE[cleared]
}

/** Get the other player in a room (the opponent). */
function getOpponent(room: Room, socketId: string): Player | null {
  for (const [id, player] of room.players) {
    if (id !== socketId) return player
  }
  return null
}

/** Throttle helper — max `maxPerSec` calls/sec per socket. */
function makeThrottle(maxPerSec: number) {
  const lastEmit = new Map<string, number>()
  const minInterval = 1000 / maxPerSec
  return (socketId: string): boolean => {
    const now = Date.now()
    const last = lastEmit.get(socketId) ?? 0
    if (now - last < minInterval) return false
    lastEmit.set(socketId, now)
    return true
  }
}

const boardThrottle = makeThrottle(10)

// ---------------------------------------------------------------------------
// Room lifecycle helpers
// ---------------------------------------------------------------------------

function removeSocketFromRoom(io: Server, socket: Socket): Room | null {
  const roomId = socketRoom.get(socket.id)
  if (!roomId) return null
  const room = rooms.get(roomId)
  if (!room) {
    socketRoom.delete(socket.id)
    return null
  }

  room.players.delete(socket.id)
  socketRoom.delete(socket.id)
  console.log(`[${roomId}] player ${socket.id} removed (room size now ${room.players.size})`)

  // Notify remaining opponent that the other player left.
  if (room.players.size > 0) {
    const opponent = Array.from(room.players.values())[0]
    const opponentSocket = io.sockets.sockets.get(opponent.socketId)
    if (opponentSocket) {
      opponentSocket.emit('opponent:left')
      console.log(`[${roomId}] notified opponent ${opponent.socketId} of departure`)
    }
  } else {
    // Empty room → clean up
    rooms.delete(roomId)
    console.log(`[${roomId}] room deleted (empty)`)
  }
  return room
}

// ---------------------------------------------------------------------------
// Socket.io server
// ---------------------------------------------------------------------------

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path — Caddy uses it for routing.
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  // S8.5: WebSocket security hardening
  maxPayload: 50_000,     // 50KB max per message (board = ~2KB, plenty)
  connectTimeout: 10_000, // 10s to establish connection
})

// S8.5: Per-connection rate limiting (max 20 events/sec per socket)
const perSocketLimits = new Map<string, { count: number; resetAt: number }>()
const SOCKET_RATE_WINDOW = 1000  // 1 second
const SOCKET_RATE_MAX = 20       // 20 events per second

function socketRateLimited(socketId: string): boolean {
  const now = Date.now()
  const entry = perSocketLimits.get(socketId)
  if (!entry || now > entry.resetAt) {
    perSocketLimits.set(socketId, { count: 1, resetAt: now + SOCKET_RATE_WINDOW })
    return false
  }
  entry.count++
  return entry.count > SOCKET_RATE_MAX
}

// S8.5: Max concurrent connections (prevents connection flood)
const MAX_CONNECTIONS = 100
let activeConnections = 0

io.on('connection', (socket: Socket) => {
  // S8.5: Connection limit
  activeConnections++
  if (activeConnections > MAX_CONNECTIONS) {
    console.log(`[connect] ${socket.id} REJECTED — too many connections (${activeConnections})`)
    socket.emit('error', 'Server is full. Please try again later.')
    socket.disconnect()
    activeConnections--
    return
  }

  console.log(`[connect] ${socket.id} (${activeConnections} active)`)

  // S8.5: Rate-limit middleware — applies to all events
  socket.use((packet, next) => {
    if (socketRateLimited(socket.id)) {
      console.log(`[rate-limit] ${socket.id} rate-limited`)
      socket.emit('error', 'Too many messages. Slow down.')
      return
    }
    next()
  })

  // -------------------------------------------------------------------------
  // room:create { playerName }
  // -------------------------------------------------------------------------
  socket.on('room:create', (payload: { playerName?: unknown }, cb?: (res: unknown) => void) => {
    try {
      const playerName = sanitizePlayerName(payload?.playerName)
      if (!playerName) {
        cb?.({ ok: false, error: 'Invalid player name (1-16 chars)' })
        return
      }

      const roomId = generateRoomId()
      const room: Room = {
        id: roomId,
        players: new Map([[socket.id, { socketId: socket.id, playerName }]]),
        createdAt: Date.now(),
      }
      rooms.set(roomId, room)
      socketRoom.set(socket.id, roomId)

      console.log(`[${roomId}] room created by ${playerName} (${socket.id})`)
      cb?.({ ok: true, roomId, playerId: socket.id })
    } catch (err) {
      console.error('[room:create] error', err)
      cb?.({ ok: false, error: 'Server error creating room' })
    }
  })

  // -------------------------------------------------------------------------
  // room:join { roomId, playerName }
  // -------------------------------------------------------------------------
  socket.on(
    'room:join',
    (payload: { roomId?: unknown; playerName?: unknown }, cb?: (res: unknown) => void) => {
      try {
        const playerName = sanitizePlayerName(payload?.playerName)
        if (!playerName) {
          cb?.({ ok: false, error: 'Invalid player name (1-16 chars)' })
          return
        }
        if (!isValidRoomId(payload?.roomId)) {
          cb?.({ ok: false, error: 'Invalid room code (4 uppercase letters)' })
          return
        }

        const roomId = payload.roomId
        const room = rooms.get(roomId)
        if (!room) {
          cb?.({ ok: false, error: 'Room not found' })
          return
        }
        if (room.players.size >= 2) {
          cb?.({ ok: false, error: 'Room is full' })
          return
        }

        // If this socket is somehow already in another room, leave it first.
        if (socketRoom.has(socket.id)) {
          removeSocketFromRoom(io, socket)
        }

        room.players.set(socket.id, { socketId: socket.id, playerName })
        socketRoom.set(socket.id, roomId)

        console.log(`[${roomId}] ${playerName} (${socket.id}) joined — size now ${room.players.size}`)

        // Notify the existing player that an opponent joined.
        const opponent = getOpponent(room, socket.id)
        if (opponent) {
          const opponentSocket = io.sockets.sockets.get(opponent.socketId)
          opponentSocket?.emit('opponent:joined', { playerName: playerName })
        }

        cb?.({ ok: true, roomId, playerId: socket.id })

        // S8.24.3a-fix: Notify the JOINING player of the host's name.
        //   Sent AFTER the callback so the client has processed room:join
        //   response first. The client's opponent:joined handler will then
        //   set the host's name and transition to 'playing'.
        if (opponent) {
          socket.emit('opponent:joined', { playerName: opponent.playerName })
        }
      } catch (err) {
        console.error('[room:join] error', err)
        cb?.({ ok: false, error: 'Server error joining room' })
      }
    },
  )

  // -------------------------------------------------------------------------
  // room:leave
  // -------------------------------------------------------------------------
  socket.on('room:leave', () => {
    try {
      removeSocketFromRoom(io, socket)
    } catch (err) {
      console.error('[room:leave] error', err)
    }
  })

  // -------------------------------------------------------------------------
  // game:lines { cleared }
  // -------------------------------------------------------------------------
  socket.on('game:lines', (payload: { cleared?: unknown }) => {
    try {
      const roomId = socketRoom.get(socket.id)
      if (!roomId) return
      const room = rooms.get(roomId)
      if (!room) return

      const cleared = typeof payload?.cleared === 'number' ? payload.cleared : 0
      if (cleared < 2) return // singles & zero sends no garbage

      const count = linesToGarbage(cleared)
      if (count <= 0) return

      const opponent = getOpponent(room, socket.id)
      if (!opponent) return
      const opponentSocket = io.sockets.sockets.get(opponent.socketId)
      opponentSocket?.emit('opponent:garbage', { count })
      console.log(`[${roomId}] ${socket.id} sent ${count} garbage to ${opponent.socketId} (cleared=${cleared})`)
    } catch (err) {
      console.error('[game:lines] error', err)
    }
  })

  // -------------------------------------------------------------------------
  // game:board { board } — throttled to 10/sec per socket
  // -------------------------------------------------------------------------
  socket.on('game:board', (payload: { board?: unknown }) => {
    try {
      if (!boardThrottle(socket.id)) return
      const roomId = socketRoom.get(socket.id)
      if (!roomId) return
      const room = rooms.get(roomId)
      if (!room) return

      const board = payload?.board
      if (!Array.isArray(board)) return // basic shape check

      const opponent = getOpponent(room, socket.id)
      if (!opponent) return
      const opponentSocket = io.sockets.sockets.get(opponent.socketId)
      opponentSocket?.emit('opponent:board', { board })
    } catch (err) {
      console.error('[game:board] error', err)
    }
  })

  // -------------------------------------------------------------------------
  // game:over → opponent:win
  // -------------------------------------------------------------------------
  socket.on('game:over', () => {
    try {
      const roomId = socketRoom.get(socket.id)
      if (!roomId) return
      const room = rooms.get(roomId)
      if (!room) return

      const opponent = getOpponent(room, socket.id)
      if (!opponent) return
      const opponentSocket = io.sockets.sockets.get(opponent.socketId)
      opponentSocket?.emit('opponent:win')
      console.log(`[${roomId}] ${socket.id} topped out → ${opponent.socketId} wins`)
    } catch (err) {
      console.error('[game:over] error', err)
    }
  })

  // -------------------------------------------------------------------------
  // game:restart → opponent:restart
  // -------------------------------------------------------------------------
  socket.on('game:restart', () => {
    try {
      const roomId = socketRoom.get(socket.id)
      if (!roomId) return
      const room = rooms.get(roomId)
      if (!room) return

      const opponent = getOpponent(room, socket.id)
      if (!opponent) return
      const opponentSocket = io.sockets.sockets.get(opponent.socketId)
      opponentSocket?.emit('opponent:restart')
      console.log(`[${roomId}] ${socket.id} requested restart → ${opponent.socketId}`)
    } catch (err) {
      console.error('[game:restart] error', err)
    }
  })

  // -------------------------------------------------------------------------
  // disconnect — cleanup + notify opponent
  // -------------------------------------------------------------------------
  socket.on('disconnect', () => {
    try {
      removeSocketFromRoom(io, socket)
      activeConnections--
      perSocketLimits.delete(socket.id)
      console.log(`[disconnect] ${socket.id} (${activeConnections} active)`)
    } catch (err) {
      console.error('[disconnect] error', err)
    }
  })

  socket.on('error', (err: unknown) => {
    console.error(`[socket-error] ${socket.id}:`, err)
  })
})

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

httpServer.listen(PORT, () => {
  console.log(`NEONFALL multiplayer service listening on :${PORT} (path: /)`)
})

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down...`)
  io.disconnectSockets(true)
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
