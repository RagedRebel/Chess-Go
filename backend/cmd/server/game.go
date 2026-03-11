package main

import (
	"fmt"
	"strings"

	"github.com/notnil/chess"
)

type ChessGame struct {
	game *chess.Game
}

func NewChessGame() *ChessGame {
	return &ChessGame{
		game: chess.NewGame(),
	}
}

func (g *ChessGame) FEN() string {
	return g.game.Position().String()
}

func (g *ChessGame) Turn() string {
	if g.game.Position().Turn() == chess.White {
		return "w"
	}
	return "b"
}

func (g *ChessGame) Move(from, to, promotion string) error {
	promotion = strings.ToLower(strings.TrimSpace(promotion))
	uciStr := from + to + promotion

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

func (g *ChessGame) IsGameOver() bool {
	return g.game.Outcome() != chess.NoOutcome
}

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

func (g *ChessGame) InCheck() bool {
	pos := g.game.Position()
	if pos.Status() == chess.Checkmate {
		return true
	}
	return false
}
