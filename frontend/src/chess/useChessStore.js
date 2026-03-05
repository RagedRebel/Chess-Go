import { create } from 'zustand';
import { parseFEN, getLegalMoves, toAlgebraic, fromAlgebraic } from './engine';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

export const useChessStore = create((set, get) => ({
  // ── View ─────────────────────────────────────────────────────
  screen: 'lobby', // 'lobby' | 'game'

  // ── Connection ───────────────────────────────────────────────
  ws: null,
  connected: false,
  error: null,

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

  // ── Preferences ──────────────────────────────────────────────
  showGuides: true,

  // ═══════════════════════════════════════════════════════════════
  //  ACTIONS
  // ═══════════════════════════════════════════════════════════════

  setPlayerName: (name) => set({ playerName: name }),
  toggleGuides: (val) => set({ showGuides: val }),

  // ── WebSocket lifecycle ──────────────────────────────────────

  /**
   * Opens a WebSocket connection.
   * Returns a cleanup function (for React useEffect).
   */
  connect: () => {
    let cancelled = false;
    let ws = null;

    const timer = setTimeout(() => {
      if (cancelled) return;

      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        if (cancelled) return;
        set({ connected: true, error: null, ws });
      };

      ws.onclose = () => {
        if (cancelled) return;
        set({ connected: false, ws: null });
      };

      ws.onerror = () => {
        if (cancelled) return;
        set({ error: 'Connection lost. Please refresh the page.', connected: false });
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(event.data);
          get()._handleMessage(msg);
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      set({ ws });
    }, 0);

    // Cleanup (handles React 19 StrictMode double-mount)
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (ws) ws.close();
      set({ ws: null, connected: false });
    };
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) ws.close();
    set({ ws: null, connected: false });
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
        });
        break;
      }
      case 'GAME_OVER': {
        set({ gameOver: msg.payload, drawOffer: null });
        break;
      }
      case 'ERROR': {
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
        set({ drawOffer: null });
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

  // ── Navigation ───────────────────────────────────────────────

  backToLobby: () => {
    set({
      screen: 'lobby',
      gameState: null,
      gameOver: null,
      drawOffer: null,
      selectedSquare: null,
      legalMoves: [],
      lastMove: null,
      promotionPending: null,
      roomCode: '',
      started: false,
      fen: '',
      turn: '',
      white: '',
      black: '',
    });
  },
}));
