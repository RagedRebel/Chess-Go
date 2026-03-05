# ChessGo — Neoclassical Online Multiplayer Chess

A real-time, two-player chess web application with a neoclassical aesthetic.
Go WebSocket backend · React + Vite + Tailwind CSS frontend.

---

## Project Structure

```
ChessGo/
├── backend/
│   ├── go.mod
│   ├── go.sum
│   └── cmd/
│       └── server/
│           ├── main.go    # HTTP server entry point
│           ├── hub.go     # WebSocket hub, rooms, message routing
│           └── game.go    # Chess game logic (notnil/chess)
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css              # Tailwind + marble/stone styles
        ├── App.css
        ├── hooks/
        │   └── useWebSocket.js
        └── components/
            ├── Lobby.jsx
            ├── GameRoom.jsx
            ├── ChessBoard.jsx
            ├── PlayerInfo.jsx
            ├── GameOverModal.jsx
            ├── Column.jsx         # Decorative Ionic column SVG
            └── LaurelWreath.jsx   # Laurel wreath SVG
```

---

## Prerequisites

| Tool   | Version |
|--------|---------|
| Go     | 1.21+   |
| Node   | 18+     |
| npm    | 9+      |

---

## Quick Start

### 1. Start the backend

```bash
cd backend
go run ./cmd/server
```

The WebSocket server starts on **`ws://localhost:8080/ws`**.

### 2. Start the frontend

```bash
cd frontend
npm install      # first time only
npm run dev
```

Vite dev server starts on **`http://localhost:5173`** (default).

### 3. Play

1. Open **two** browser tabs at `http://localhost:5173`.
2. In tab 1, click **Create Room** — a 6-character room code appears.
3. In tab 2, click **Join Room** and enter the code.
4. Play chess! The board auto-orients so each player sees their pieces at the bottom.

---

## WebSocket Protocol

All messages are JSON with `{ "type": string, "payload": object }`.

| Type          | Direction       | Payload                                              |
|---------------|-----------------|------------------------------------------------------|
| `CREATE_ROOM` | client → server | `{}`                                                 |
| `JOIN_ROOM`   | client → server | `{ "roomCode": "A3K9Z2" }`                          |
| `MOVE`        | client → server | `{ "from": "e2", "to": "e4", "promotion": "" }`     |
| `GAME_STATE`  | server → client | FEN, turn, room code, player names, player color     |
| `GAME_OVER`   | server → client | `{ "result": "white", "method": "checkmate" }`      |
| `ERROR`       | server → client | `{ "message": "..." }`                               |

---

## Tech Stack

- **Backend:** Go, gorilla/websocket, notnil/chess
- **Frontend:** React 19, Vite, Tailwind CSS 3, react-chessboard, chess.js
- **Design:** Neoclassical UI — Cinzel & Playfair Display fonts, marble textures, Ionic columns, laurel wreaths

---

## License

MIT
