/**
 * Chess engine — FEN parsing, legal-move computation, board utilities.
 * Pure functions, no side effects. Replaces chess.js.
 *
 * Board layout: 8×8 array, row 0 = rank 8 (black's back rank),
 *               col 0 = a-file.
 *
 * Piece shape:  { type: 'pawn'|'knight'|'bishop'|'rook'|'queen'|'king',
 *                 color: 'white'|'black',
 *                 hasMoved?: boolean }
 */


const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const PIECE_FROM_CHAR = {
  p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
};


/** row/col (0-based) → algebraic ("e2"). */
export function toAlgebraic(row, col) {
  return FILES[col] + RANKS[row];
}

/** algebraic ("e2") → { row, col }. */
export function fromAlgebraic(sq) {
  return { row: 8 - parseInt(sq[1]), col: FILES.indexOf(sq[0]) };
}


/**
 * Parse a FEN string into a GameState object.
 * @param {string} fen
 * @returns {object} GameState
 */
export function parseFEN(fen) {
  if (!fen || typeof fen !== 'string') return createEmptyState();

  const parts = fen.trim().split(/\s+/);
  if (parts.length < 4) return createEmptyState();

  const [boardStr, turnStr, castlingStr, enPassantStr] = parts;
  const halfMoveStr = parts[4] || '0';
  const fullMoveStr = parts[5] || '1';

  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const rows = boardStr.split('/');

  for (let r = 0; r < 8 && r < rows.length; r++) {
    let col = 0;
    for (const ch of rows[r]) {
      if (ch >= '1' && ch <= '8') {
        col += parseInt(ch);
      } else {
        const type = PIECE_FROM_CHAR[ch.toLowerCase()];
        if (type) {
          board[r][col] = {
            type,
            color: ch === ch.toUpperCase() ? 'white' : 'black',
          };
          col++;
        }
      }
    }
  }

  const ca = castlingStr || '-';

  const setFlags = (row, kingSide, queenSide) => {
    const king = board[row][4];
    if (king?.type === 'king') king.hasMoved = !kingSide && !queenSide;
    const kR = board[row][7];
    if (kR?.type === 'rook') kR.hasMoved = !kingSide;
    const qR = board[row][0];
    if (qR?.type === 'rook') qR.hasMoved = !queenSide;
  };

  setFlags(7, ca.includes('K'), ca.includes('Q')); 
  setFlags(0, ca.includes('k'), ca.includes('q'));

  let enPassantTarget;
  if (enPassantStr && enPassantStr !== '-') {
    enPassantTarget = fromAlgebraic(enPassantStr);
  }

  const currentTurn = turnStr === 'w' ? 'white' : 'black';

  const state = {
    board,
    currentTurn,
    enPassantTarget,
    halfMoveClock: parseInt(halfMoveStr) || 0,
    fullMoveNumber: parseInt(fullMoveStr) || 1,
    status: 'playing', 
  };

  if (isInCheck(board, currentTurn)) {
    state.status = 'check';
  }

  return state;
}

function createEmptyState() {
  return {
    board: Array.from({ length: 8 }, () => Array(8).fill(null)),
    currentTurn: 'white',
    status: 'playing',
    halfMoveClock: 0,
    fullMoveNumber: 1,
  };
}


function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}


export function getPseudoLegalMoves(board, sq, enPassantTarget) {
  const piece = board[sq.row][sq.col];
  if (!piece) return [];

  const moves = [];
  const { type, color } = piece;
  const dir = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;

  const addSliding = (directions) => {
    for (const [dr, dc] of directions) {
      let r = sq.row + dr;
      let c = sq.col + dc;
      while (inBounds(r, c)) {
        const target = board[r][c];
        if (!target) {
          moves.push({ row: r, col: c });
        } else {
          if (target.color !== color) moves.push({ row: r, col: c });
          break;
        }
        r += dr;
        c += dc;
      }
    }
  };

  switch (type) {
    case 'pawn': {
      const r1 = sq.row + dir;
      if (inBounds(r1, sq.col) && !board[r1][sq.col]) {
        moves.push({ row: r1, col: sq.col });
        const r2 = sq.row + dir * 2;
        if (sq.row === startRow && inBounds(r2, sq.col) && !board[r2][sq.col]) {
          moves.push({ row: r2, col: sq.col });
        }
      }
      for (const dc of [-1, 1]) {
        const c = sq.col + dc;
        if (inBounds(r1, c)) {
          if (board[r1][c] && board[r1][c].color !== color) {
            moves.push({ row: r1, col: c });
          }
          if (enPassantTarget?.row === r1 && enPassantTarget?.col === c) {
            moves.push({ row: r1, col: c });
          }
        }
      }
      break;
    }
    case 'knight': {
      const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr, dc] of offsets) {
        const r = sq.row + dr;
        const c = sq.col + dc;
        if (inBounds(r, c) && board[r][c]?.color !== color) {
          moves.push({ row: r, col: c });
        }
      }
      break;
    }
    case 'bishop':
      addSliding([[-1,-1],[-1,1],[1,-1],[1,1]]);
      break;
    case 'rook':
      addSliding([[-1,0],[1,0],[0,-1],[0,1]]);
      break;
    case 'queen':
      addSliding([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
      break;
    case 'king': {
      const offsets = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      for (const [dr, dc] of offsets) {
        const r = sq.row + dr;
        const c = sq.col + dc;
        if (inBounds(r, c) && board[r][c]?.color !== color) {
          moves.push({ row: r, col: c });
        }
      }
      break;
    }
  }

  return moves;
}


export function isSquareAttacked(board, sq, byColor) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece?.color === byColor) {
        const attacks = getPseudoLegalMoves(board, { row: r, col: c });
        if (attacks.some((m) => m.row === sq.row && m.col === sq.col)) return true;
      }
    }
  }
  return false;
}

export function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p?.type === 'king' && p.color === color) return { row: r, col: c };
    }
  }
  return null;
}

export function isInCheck(board, color) {
  const king = findKing(board, color);
  if (!king) return false;
  return isSquareAttacked(board, king, color === 'white' ? 'black' : 'white');
}


function applyMoveToBoard(board, from, to, enPassantTarget) {
  const newBoard = cloneBoard(board);
  const piece = { ...newBoard[from.row][from.col] };
  piece.hasMoved = true;

  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;

  if (
    piece.type === 'pawn' &&
    enPassantTarget?.row === to.row &&
    enPassantTarget?.col === to.col
  ) {
    newBoard[from.row][to.col] = null;
  }

  if (piece.type === 'king') {
    const colDiff = to.col - from.col;
    if (Math.abs(colDiff) === 2) {
      if (colDiff === 2) {
        const rook = { ...newBoard[from.row][7] };
        rook.hasMoved = true;
        newBoard[from.row][5] = rook;
        newBoard[from.row][7] = null;
      } else {
        const rook = { ...newBoard[from.row][0] };
        rook.hasMoved = true;
        newBoard[from.row][3] = rook;
        newBoard[from.row][0] = null;
      }
    }
  }

  return newBoard;
}


export function getLegalMoves(state, sq) {
  const piece = state.board[sq.row][sq.col];
  if (!piece || piece.color !== state.currentTurn) return [];

  const pseudo = getPseudoLegalMoves(state.board, sq, state.enPassantTarget);
  const legal = [];
  const enemy = piece.color === 'white' ? 'black' : 'white';

  for (const to of pseudo) {
    if (state.board[to.row][to.col]?.color === piece.color) continue;

    const testBoard = applyMoveToBoard(state.board, sq, to, state.enPassantTarget);
    if (!isInCheck(testBoard, piece.color)) {
      legal.push(to);
    }
  }

  if (piece.type === 'king' && !piece.hasMoved && !isInCheck(state.board, piece.color)) {
    const row = piece.color === 'white' ? 7 : 0;
    if (sq.row === row && sq.col === 4) {
      const kR = state.board[row][7];
      if (
        kR?.type === 'rook' && !kR.hasMoved &&
        !state.board[row][5] && !state.board[row][6] &&
        !isSquareAttacked(state.board, { row, col: 5 }, enemy) &&
        !isSquareAttacked(state.board, { row, col: 6 }, enemy)
      ) {
        legal.push({ row, col: 6 });
      }

      const qR = state.board[row][0];
      if (
        qR?.type === 'rook' && !qR.hasMoved &&
        !state.board[row][1] && !state.board[row][2] && !state.board[row][3] &&
        !isSquareAttacked(state.board, { row, col: 3 }, enemy) &&
        !isSquareAttacked(state.board, { row, col: 2 }, enemy)
      ) {
        legal.push({ row, col: 2 });
      }
    }
  }

  return legal;
}
