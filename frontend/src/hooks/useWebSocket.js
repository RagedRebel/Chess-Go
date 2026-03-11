import { useRef, useState, useCallback, useEffect } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

export default function useWebSocket() {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let ws = null;

    const timer = setTimeout(() => {
      if (cancelled) return;

      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        if (cancelled) return;
        setConnected(true);
        setError(null);
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
      };

      ws.onerror = () => {
        if (cancelled) return;
        setError('Connection lost. Please refresh the page.');
        setConnected(false);
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'GAME_STATE':
              setGameState(msg.payload);
              setError(null);
              break;
            case 'GAME_OVER':
              setGameOver(msg.payload);
              break;
            case 'ERROR':
              setError(msg.payload.message);
              setTimeout(() => {
                if (!cancelled) setError(null);
              }, 4000);
              break;
            default:
              break;
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      wsRef.current = ws;
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (ws) ws.close();
      wsRef.current = null;
    };
  }, []);

  const sendMessage = useCallback((type, payload = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    } else {
      setError('Not connected to server');
    }
  }, []);

  const createRoom = useCallback(
    (name = '') => {
      sendMessage('CREATE_ROOM', { name: name || 'Player 1' });
    },
    [sendMessage]
  );

  const joinRoom = useCallback(
    (roomCode, name = '') => {
      sendMessage('JOIN_ROOM', {
        roomCode: roomCode.toUpperCase(),
        name: name || 'Player 2',
      });
    },
    [sendMessage]
  );

  const makeMove = useCallback(
    (from, to, promotion = '') => {
      sendMessage('MOVE', { from, to, promotion });
    },
    [sendMessage]
  );

  const resetGame = useCallback(() => {
    setGameOver(null);
    setGameState(null);
  }, []);

  return {
    connected,
    gameState,
    gameOver,
    error,
    createRoom,
    joinRoom,
    makeMove,
    resetGame,
  };
}
