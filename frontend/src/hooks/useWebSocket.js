import { useRef, useState, useCallback, useEffect } from 'react';

const WS_URL = 'ws://localhost:8080/ws';

export default function useWebSocket() {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [error, setError] = useState(null);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setConnected(true);
      setError(null);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      setError('Connection lost. Please refresh the page.');
      setConnected(false);
    };

    ws.onmessage = (event) => {
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
            // Clear error after a few seconds
            setTimeout(() => setError(null), 4000);
            break;
          default:
            break;
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

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
