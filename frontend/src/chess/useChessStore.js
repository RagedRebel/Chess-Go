import { create } from 'zustand';
import { parseFEN, getLegalMoves, toAlgebraic, fromAlgebraic } from './engine';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

// ── Session storage helpers ─────────────────────────────────────────────────
// Keeps room/colour info across a page reload so the player can auto-rejoin.
const SESSION_KEY = 'chessgo_session';

function saveSession(roomCode, playerColor, playerName) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ roomCode, playerColor, playerName }));
  } catch (_) {}
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.roomCode && s.playerColor) {
      return { roomCode: s.roomCode, color: s.playerColor, name: s.playerName || '' };
    }
  } catch (_) {}
  return null;
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (_) {}
}
// ───────────────────────────────────────────────────────────────────────────

export const useChessStore = create((set, get) => ({
  // ── View ─────────────────────────────────────────────────────
  screen: 'lobby', // 'lobby' | 'game'

  // ── Connection ───────────────────────────────────────────────
  ws: null,
  connected: false,
  reconnecting: false,         // true while auto-reconnect is in progress
  opponentDisconnected: false, // true while opponent is in their grace period
  error: null,
  // internal flags (not for UI consumption)
  _manualDisconnect: false,
  _awaitingRejoin: false,

  // ── Game state (from server) ─────────────────────────────────
  gameState: null, // parsed via parseFEN
  fen: '',
  turn: '',
  roomCode: '',
  playerColor: '',
  playerName: '',
  white: '',
  black: '',
  started: false,
  lastMove: null, // { from: {row,col}, to: {row,col} }

  // ── Board interaction ────────────────────────────────────────
  selectedSquare: null, // { row, col }
  legalMoves: [],       // [{ row, col }, …]
  promotionPending: null, // { from: {row,col}, to: {row,col} }

  // ── Result ───────────────────────────────────────────────────
  gameOver: null, // { result, method }

  // ── Draw offer state ─────────────────────────────────────────
  drawOffer: null, // null | 'sent' | 'received'
  drawDeclined: false, // true briefly when opponent declines our offer

  // ── Preferences ──────────────────────────────────────────────
  showGuides: true,

  // ═══════════════════════════════════════════════════════════════
  //  ACTIONS
  // ═══════════════════════════════════════════════════════════════

  setPlayerName: (name) => set({ playerName: name }),
  toggleGuides: (val) => set({ showGuides: val }),

  // ── WebSocket lifecycle ──────────────────────────────────────

  /**
   * Opens a WebSocket connection with automatic reconnection and keep-alive ping.
   * Returns a cleanup function (for React useEffect).
   */
  connect: () => {
    let cancelled = false;
    let ws = null;
    let reconnectTimer = null;
    let pingInterval = null;
    let attempt = 0;
    const MAX_ATTEMPTS = 15;

    const tryConnect = () => {
      if (cancelled) return;

      ws = new WebSocket(WS_URL);
      set({ ws });

      ws.onopen = () => {
        if (cancelled) { ws.close(); return; }
        attempt = 0;
        clearInterval(pingInterval);
        set({ connected: true, error: null, ws, reconnecting: false });

        // If we were in a game when the connection dropped, auto-rejoin
        const session = loadSession();
        if (session) {
          ws.send(JSON.stringify({ type: 'REJOIN_ROOM', payload: session }));
          set({ _awaitingRejoin: true });
        }

        // Keep-alive ping every 9 minutes to prevent Render from spinning down
        pingInterval = setInterval(() => {
          const currentWs = get().ws;
          if (currentWs && currentWs.readyState === WebSocket.OPEN) {
            currentWs.send(JSON.stringify({ type: 'PING', payload: {} }));
          }
        }, 9 * 60 * 1000);
      };

      ws.onclose = () => {
        if (cancelled) return;
        clearInterval(pingInterval);
        pingInterval = null;
        set({ connected: false, ws: null });

        // Don't reconnect when the disconnect was intentional
        if (get()._manualDisconnect) {
          set({ _manualDisconnect: false, reconnecting: false });
          return;
        }

        if (attempt < MAX_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          attempt++;
          set({
            reconnecting: true,
            error: `Connection lost. Reconnecting\u2026 (${attempt}/${MAX_ATTEMPTS})`,
          });
          reconnectTimer = setTimeout(tryConnect, delay);
        } else {
          set({ reconnecting: false, error: 'Could not reconnect. Please refresh the page.' });
        }
      };

      ws.onerror = () => { /* onclose fires after onerror; reconnect logic lives there */ };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(event.data);
          get()._handleMessage(msg);
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };
    };

    // setTimeout(0) avoids the React 19 StrictMode double-mount problem
    const initTimer = setTimeout(tryConnect, 0);

    return () => {
      cancelled = true;
      clearTimeout(initTimer);
      clearTimeout(reconnectTimer);
      clearInterval(pingInterval);
      if (ws) ws.close();
      set({ ws: null, connected: false, reconnecting: false });
    };
  },

  disconnect: () => {
    set({ _manualDisconnect: true });
    const { ws } = get();
    if (ws) ws.close();
    set({ ws: null, connected: false, reconnecting: false });
  },

  // ── Outgoing messages ────────────────────────────────────────

  _sendMessage: (type, payload = {}) => {
    const { ws } = get();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    } else {
      set({ error: 'Not connected to server' });
    }
  },

  createRoom: (name) => {
    set({ playerName: name || 'Player 1' });
    get()._sendMessage('CREATE_ROOM', { name: name || 'Player 1' });
  },

  joinRoom: (roomCode, name) => {
    set({ playerName: name || 'Player 2' });
    get()._sendMessage('JOIN_ROOM', {
      roomCode: roomCode.toUpperCase(),
      name: name || 'Player 2',
    });
  },

  // ── Incoming messages ────────────────────────────────────────

  _handleMessage: (msg) => {
    switch (msg.type) {
      case 'GAME_STATE': {
        const p = msg.payload;
        const gameState = parseFEN(p.fen);

        let lastMove = null;
        if (p.lastMove) {
          lastMove = {
            from: fromAlgebraic(p.lastMove.from),
            to: fromAlgebraic(p.lastMove.to),
          };
        }

        set({
          gameState,
          fen: p.fen,
          turn: p.turn,
          roomCode: p.roomCode,
          white: p.white,
          black: p.black,
          playerColor: p.playerColor,
          started: p.started,
          lastMove,
          screen: 'game',
          error: null,
          selectedSquare: null,
          legalMoves: [],
          promotionPending: null,
          opponentDisconnected: false,
          _awaitingRejoin: false,
        });

        // Persist session so we can auto-rejoin after a server restart
        if (p.started) {
          const myName = p.playerColor === 'white' ? p.white : p.black;
          saveSession(p.roomCode, p.playerColor, myName);
        }
        break;
      }
      case 'GAME_OVER': {
        clearSession();
        set({ gameOver: msg.payload, drawOffer: null, opponentDisconnected: false });
        break;
      }
      case 'ERROR': {
        // If we were awaiting a rejoin and get an error, the room no longer
        // exists on the server — clear the stale session and go back to lobby.
        if (get()._awaitingRejoin) {
          clearSession();
          set({
            _awaitingRejoin: false,
            screen: 'lobby',
            gameState: null,
            gameOver: null,
            roomCode: '',
            started: false,
            opponentDisconnected: false,
          });
        }
        set({ error: msg.payload.message });
        setTimeout(() => {
          set((s) => (s.error === msg.payload.message ? { error: null } : {}));
        }, 4000);
        break;
      }
      case 'DRAW_OFFERED': {
        set({ drawOffer: 'received' });
        break;
      }
      case 'DRAW_DECLINED': {
        const wasOfferer = get().drawOffer === 'sent';
        set({ drawOffer: null, drawDeclined: wasOfferer });
        break;
      }
      case 'OPPONENT_DISCONNECTED': {
        set({ opponentDisconnected: true });
        break;
      }
      case 'OPPONENT_RECONNECTED': {
        set({ opponentDisconnected: false, error: null });
        break;
      }
      case 'PONG': {
        // keep-alive response — nothing to do
        break;
      }
      default:
        break;
    }
  },

  // ── Board interaction ────────────────────────────────────────

  selectSquare: (sq) => {
    const {
      gameState, selectedSquare, legalMoves,
      playerColor, turn, started, gameOver, promotionPending,
    } = get();

    if (!gameState || promotionPending || gameOver || !started) return;

    // Not my turn?
    const myTurnChar = playerColor === 'white' ? 'w' : 'b';
    if (turn !== myTurnChar) return;

    const piece = gameState.board[sq.row][sq.col];

    // ── A piece is already selected ──
    if (selectedSquare) {
      const isLegal = legalMoves.some((m) => m.row === sq.row && m.col === sq.col);

      if (isLegal) {
        const movingPiece = gameState.board[selectedSquare.row][selectedSquare.col];

        // Pawn promotion?
        if (movingPiece?.type === 'pawn' && (sq.row === 0 || sq.row === 7)) {
          set({
            promotionPending: { from: selectedSquare, to: sq },
            selectedSquare: null,
            legalMoves: [],
          });
          return;
        }

        // Normal move → send to server
        get()._makeMove(selectedSquare, sq);
        return;
      }

      // Clicked another own piece → re-select
      if (piece && piece.color === gameState.currentTurn) {
        const moves = getLegalMoves(gameState, sq);
        set({ selectedSquare: sq, legalMoves: moves });
        return;
      }

      // Deselect
      set({ selectedSquare: null, legalMoves: [] });
      return;
    }

    // ── No selection yet ──
    if (piece && piece.color === gameState.currentTurn) {
      const moves = getLegalMoves(gameState, sq);
      set({ selectedSquare: sq, legalMoves: moves });
    }
  },

  _makeMove: (from, to, promotion = '') => {
    get()._sendMessage('MOVE', {
      from: toAlgebraic(from.row, from.col),
      to: toAlgebraic(to.row, to.col),
      promotion,
    });
    set({ selectedSquare: null, legalMoves: [] });
  },

  completePromotion: (notation) => {
    const { promotionPending } = get();
    if (!promotionPending) return;
    get()._makeMove(promotionPending.from, promotionPending.to, notation);
    set({ promotionPending: null });
  },

  // ── Resign / Draw ────────────────────────────────────────────

  resign: () => {
    get()._sendMessage('RESIGN');
  },

  offerDraw: () => {
    get()._sendMessage('DRAW_OFFER');
    set({ drawOffer: 'sent' });
  },

  acceptDraw: () => {
    get()._sendMessage('DRAW_ACCEPT');
    set({ drawOffer: null });
  },

  declineDraw: () => {
    get()._sendMessage('DRAW_DECLINE');
    set({ drawOffer: null });
  },

  clearDrawDeclined: () => set({ drawDeclined: false }),

  // ── Navigation ───────────────────────────────────────────────

  backToLobby: () => {
    clearSession();
    set({
      screen: 'lobby',
      gameState: null,
      gameOver: null,
      drawOffer: null,
      drawDeclined: false,
      selectedSquare: null,
      legalMoves: [],
      lastMove: null,
      promotionPending: null,
      roomCode: '',
      started: false,
      opponentDisconnected: false,
      reconnecting: false,
      fen: '',
      turn: '',
      white: '',
      black: '',
    });
  },
}));
