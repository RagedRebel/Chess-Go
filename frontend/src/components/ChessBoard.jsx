import { useMemo, useState, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

export default function ChessBoard({
  fen,
  playerColor,
  onMove,
  isMyTurn,
  gameStarted,
  gameOver,
  showGuides,
  boardWrapperRef,
}) {
  // chess.js instance for client-side pre-validation and move highlighting
  const game = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  const boardOrientation = playerColor === 'black' ? 'black' : 'white';
  const canInteract = gameStarted && isMyTurn && !gameOver;

  // --- Move guidelines state ---
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);

  // Reset selection when FEN changes (after a move)
  useEffect(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [fen]);

  // Compute legal target squares for clicked/dragged piece
  const highlightMoves = useCallback(
    (square) => {
      if (!showGuides || !canInteract) {
        setLegalMoves([]);
        return;
      }

      const moves = game.moves({ square, verbose: true });
      if (moves.length === 0) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      setSelectedSquare(square);
      setLegalMoves(moves.map((m) => m.to));
    },
    [game, showGuides, canInteract]
  );

  // Build custom square styles for guidelines
  const guideStyles = useMemo(() => {
    const styles = {};
    if (!showGuides || legalMoves.length === 0) return styles;

    // Highlight selected square
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(212, 175, 55, 0.35)',
      };
    }

    // Dot indicators on legal target squares
    for (const sq of legalMoves) {
      const hasPiece = game.get(sq);
      if (hasPiece) {
        // Capture: ring around square
        styles[sq] = {
          background:
            'radial-gradient(circle, transparent 60%, rgba(212, 175, 55, 0.45) 61%)',
        };
      } else {
        // Empty: small dot
        styles[sq] = {
          background:
            'radial-gradient(circle, rgba(212, 175, 55, 0.5) 22%, transparent 23%)',
        };
      }
    }
    return styles;
  }, [showGuides, selectedSquare, legalMoves, game]);

  function onSquareClick(square) {
    if (!canInteract || !showGuides) return;

    // If clicking a legal target → make the move
    if (selectedSquare && legalMoves.includes(square)) {
      // Check promotion
      const piece = game.get(selectedSquare);
      const isPromotion =
        piece &&
        piece.type === 'p' &&
        ((piece.color === 'w' && square[1] === '8') ||
          (piece.color === 'b' && square[1] === '1'));

      if (!isPromotion) {
        try {
          const move = game.move({ from: selectedSquare, to: square });
          if (move) {
            onMove(selectedSquare, square, '');
          }
        } catch {
          // ignore
        }
      }
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // Otherwise, select the clicked square
    highlightMoves(square);
  }

  function onPieceDragBegin(_piece, sourceSquare) {
    highlightMoves(sourceSquare);
  }

  function onPieceDrop(sourceSquare, targetSquare, piece) {
    if (!canInteract) return false;

    // Promotion is handled by onPromotionPieceSelect
    const isPromotion =
      (piece === 'wP' && targetSquare[1] === '8') ||
      (piece === 'bP' && targetSquare[1] === '1');

    if (isPromotion) return true;

    // Pre-validate with chess.js
    try {
      const move = game.move({ from: sourceSquare, to: targetSquare });
      if (!move) return false;
    } catch {
      return false;
    }

    onMove(sourceSquare, targetSquare, '');
    setSelectedSquare(null);
    setLegalMoves([]);
    return true;
  }

  function onPromotionCheck(sourceSquare, targetSquare, piece) {
    if (!canInteract) return false;
    return (
      (piece === 'wP' && targetSquare[1] === '8') ||
      (piece === 'bP' && targetSquare[1] === '1')
    );
  }

  function onPromotionPieceSelect(piece, promoteFromSquare, promoteToSquare) {
    if (!piece || !promoteFromSquare || !promoteToSquare) return false;
    const promo = piece[1].toLowerCase();
    try {
      const move = game.move({
        from: promoteFromSquare,
        to: promoteToSquare,
        promotion: promo,
      });
      if (!move) return false;
    } catch {
      return false;
    }
    onMove(promoteFromSquare, promoteToSquare, promo);
    setSelectedSquare(null);
    setLegalMoves([]);
    return true;
  }

  // --- Board size: observe the wrapper div provided by GameRoom ---
  const [boardSize, setBoardSize] = useState(360);

  useEffect(() => {
    const el = boardWrapperRef?.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Use the smaller of the two dimensions, leave 20px for the frame padding
      const available = Math.min(width, height) - 20;
      setBoardSize(Math.max(Math.min(Math.floor(available), 520), 200));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [boardWrapperRef]);

  return (
    <div className="board-frame">
      <Chessboard
        id="main-board"
        position={fen}
        onPieceDrop={onPieceDrop}
        onSquareClick={onSquareClick}
        onPieceDragBegin={onPieceDragBegin}
        onPromotionCheck={onPromotionCheck}
        onPromotionPieceSelect={onPromotionPieceSelect}
        boardOrientation={boardOrientation}
        arePiecesDraggable={canInteract}
        animationDuration={200}
        boardWidth={boardSize}
        customSquareStyles={guideStyles}
        customBoardStyle={{
          borderRadius: '2px',
        }}
        customDarkSquareStyle={{
          backgroundColor: '#8B4513',
          backgroundImage:
            'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
        }}
        customLightSquareStyle={{
          backgroundColor: '#F0D9B5',
          backgroundImage:
            'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.03) 100%)',
        }}
        customDropSquareStyle={{
          boxShadow: 'inset 0 0 0 4px rgba(212,175,55,0.6)',
        }}
      />
    </div>
  );
}
