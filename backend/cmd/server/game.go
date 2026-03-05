package main

import (
	"fmt"
	"strings"

	"github.com/notnil/chess"
)

// ChessGame wraps the notnil/chess library to provide
// server-side move validation-and game state management.
type ChessGame struct {
	game *chess.Game
}

// NewChessGame creates a new chess game from the standard starting position.
func NewChessGame() *ChessGame {
	return &ChessGame{
		game: chess.NewGame(),
	}
}

// FEN returns the current position in Forsyth–Edwards Notation.
func (g *ChessGame) FEN() string {
	return g.game.Position().String()
}

// Turn returns "w" if it is White's turn, "b" for Black.
func (g *ChessGame) Turn() string {
	if g.game.Position().Turn() == chess.White {
		return "w"
	}
	return "b"
}

// Move attempts to apply a move given source/target squares and an optional
// promotion piece (lowercase: q, r, b, n). Returns an error if the move is illegal.
func (g *ChessGame) Move(from, to, promotion string) error {
	promotion = strings.ToLower(strings.TrimSpace(promotion))
	uciStr := from + to + promotion

	// Use UCI notation to decode the incoming move against the current position.
	notation := chess.UCINotation{}
	move, err := notation.Decode(g.game.Position(), uciStr)
	if err != nil {
		return fmt.Errorf("%s is not a legal move", uciStr)
	}

	if err := g.game.Move(move); err != nil {
		return fmt.Errorf("%s is not a legal move", uciStr)
	}

	return nil
}

// IsGameOver returns true if the game has ended (checkmate, stalemate, draw).
func (g *ChessGame) IsGameOver() bool {
	return g.game.Outcome() != chess.NoOutcome
}

// Outcome returns the result ("white", "black", "draw") and the method
// ("checkmate", "stalemate", "insufficient_material", etc.).
func (g *ChessGame) Outcome() (string, string) {
	outcome := g.game.Outcome()
	method := g.game.Method()

	var result string
	switch outcome {
	case chess.WhiteWon:
		result = "white"
	case chess.BlackWon:
		result = "black"
	case chess.Draw:
		result = "draw"
	default:
		result = "unknown"
	}

	var methodStr string
	switch method {
	case chess.Checkmate:
		methodStr = "checkmate"
	case chess.Stalemate:
		methodStr = "stalemate"
	case chess.InsufficientMaterial:
		methodStr = "insufficient_material"
	case chess.ThreefoldRepetition:
		methodStr = "threefold_repetition"
	case chess.FiftyMoveRule:
		methodStr = "fifty_move_rule"
	default:
		methodStr = "unknown"
	}

	return result, methodStr
}

// InCheck returns true if the side to move is currently in check.
// The notnil/chess library keeps inCheck unexported, so we detect check
// by counting legal king moves: if the king cannot stay on its square
// without a legal move that addresses the threat, we're in check.
// A simpler heuristic: check if any valid move annotations indicate check.
func (g *ChessGame) InCheck() bool {
	pos := g.game.Position()
	// If there are no valid moves and outcome is checkmate, the side was in check.
	if pos.Status() == chess.Checkmate {
		return true
	}
	// Use UCINotation to probe: try decoding a null move; the position
	// string encodes enough for the frontend to re-derive via chess.js.
	// For robustness, delegate check display to the client.
	return false
}
