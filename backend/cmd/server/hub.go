package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)


var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}


const (
	MsgCreateRoom  = "CREATE_ROOM"
	MsgJoinRoom    = "JOIN_ROOM"
	MsgMove        = "MOVE"
	MsgResign      = "RESIGN"
	MsgDrawOffer   = "DRAW_OFFER"
	MsgDrawAccept  = "DRAW_ACCEPT"
	MsgDrawDecline = "DRAW_DECLINE"
	MsgGameState   = "GAME_STATE"
	MsgGameOver    = "GAME_OVER"
	MsgDrawOffered = "DRAW_OFFERED"  
	MsgDrawDeclined         = "DRAW_DECLINED" 
	MsgError               = "ERROR"
	MsgRejoinRoom           = "REJOIN_ROOM"
	MsgPing                = "PING"
	MsgPong                = "PONG"
	MsgOpponentDisconnected = "OPPONENT_DISCONNECTED"
	MsgOpponentReconnected  = "OPPONENT_RECONNECTED"
)


type WSMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type CreateRoomPayload struct {
	Name string `json:"name"`
}

type JoinRoomPayload struct {
	RoomCode string `json:"roomCode"`
	Name     string `json:"name"`
}

type MovePayload struct {
	From      string `json:"from"`
	To        string `json:"to"`
	Promotion string `json:"promotion,omitempty"`
}

type GameStatePayload struct {
	FEN         string      `json:"fen"`
	Turn        string      `json:"turn"`
	RoomCode    string      `json:"roomCode"`
	White       string      `json:"white"`
	Black       string      `json:"black"`
	LastMove    *MovePayload `json:"lastMove,omitempty"`
	InCheck     bool        `json:"inCheck"`
	PlayerColor string      `json:"playerColor"`
	Started     bool        `json:"started"`
}

type GameOverPayload struct {
	Result string `json:"result"`
	Method string `json:"method"`
	FEN    string `json:"fen"`
}

type ErrorPayload struct {
	Message string `json:"message"`
}

type RejoinRoomPayload struct {
	RoomCode string `json:"roomCode"`
	Color    string `json:"color"`
	Name     string `json:"name"`
}


type Client struct {
	Hub      *Hub
	Conn     *websocket.Conn
	Send     chan []byte
	RoomCode string
	Color    string 
	ID       string
	Name     string
	mu       sync.Mutex
}


type Room struct {
	Code            string
	Game            *ChessGame
	White           *Client
	Black           *Client
	WhiteName       string 
	BlackName       string 
	Started         bool   
	DrawOfferedBy   string 
	mu              sync.Mutex
	whiteReconTimer *time.Timer
	blackReconTimer *time.Timer
}


type Hub struct {
	Rooms      map[string]*Room
	mu         sync.RWMutex
	Unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		Rooms:      make(map[string]*Room),
		Unregister: make(chan *Client),
	}
}

func stopTimer(t *time.Timer) {
	if t != nil {
		t.Stop()
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Unregister:
			h.mu.Lock()
			if room, ok := h.Rooms[client.RoomCode]; ok {
				room.mu.Lock()

				disconnectedColor := ""
				var opponent *Client
				if room.White == client {
					room.White = nil
					disconnectedColor = "white"
					opponent = room.Black
				} else if room.Black == client {
					room.Black = nil
					disconnectedColor = "black"
					opponent = room.White
				}

				if room.White == nil && room.Black == nil {
					stopTimer(room.whiteReconTimer)
					stopTimer(room.blackReconTimer)
					delete(h.Rooms, client.RoomCode)
					log.Printf("Room %s deleted (empty)", client.RoomCode)
				} else if opponent != nil && !room.Game.IsGameOver() {
					gameOverPayload := GameOverPayload{
						Result: opponent.Color,
						Method: "opponent_left",
						FEN:    room.Game.FEN(),
				}} else if disconnectedColor != "" && room.Started && !room.Game.IsGameOver() {
					roomCode := room.Code
					log.Printf("Room %s: %s disconnected, starting 60 s reconnect grace period", room.Code, disconnectedColor)

					if opponent != nil {
						opponent.sendJSON(MsgOpponentDisconnected, map[string]string{})
					}

					if disconnectedColor == "white" {
						stopTimer(room.whiteReconTimer)
					} else {
						stopTimer(room.blackReconTimer)
					}

					timer := time.AfterFunc(60*time.Second, func() {
						h.mu.Lock()
						defer h.mu.Unlock()
						r, exists := h.Rooms[roomCode]
						if !exists {
							return
						}
						r.mu.Lock()
						defer r.mu.Unlock()

						slotEmpty := (disconnectedColor == "white" && r.White == nil) ||
							(disconnectedColor == "black" && r.Black == nil)
						if slotEmpty && !r.Game.IsGameOver() {
							winnerColor := "black"
							if disconnectedColor == "black" {
								winnerColor = "white"
							}
							payload := GameOverPayload{
								Result: winnerColor,
								Method: "opponent_left",
								FEN:    r.Game.FEN(),
							}
							log.Printf("Room %s: %s wins — %s timed out reconnecting", r.Code, winnerColor, disconnectedColor)
							if r.White != nil {
								r.White.sendGameOver(payload)
							}
							if r.Black != nil {
								r.Black.sendGameOver(payload)
							}
							delete(h.Rooms, r.Code)
						}
					})

					if disconnectedColor == "white" {
						room.whiteReconTimer = timer
					} else {
						room.blackReconTimer = timer
					}
				} else {
					notifyRoomState(room)
				}
				room.mu.Unlock()
			}
			close(client.Send)
			h.mu.Unlock()
		}
	}
}


func generateRoomCode() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	code := make([]byte, 6)
	for i := range code {
		code[i] = chars[rand.Intn(len(chars))]
	}
	return string(code)
}


func ServeWS(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}

	client := &Client{
		Hub:  hub,
		Conn: conn,
		Send: make(chan []byte, 256),
		ID:   generateRoomCode(),
	}

	log.Printf("Client %s connected", client.ID)

	go client.writePump()
	go client.readPump()
}


func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
		log.Printf("Client %s disconnected", c.ID)
	}()

	c.Conn.SetReadLimit(4096)

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var msg WSMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			c.sendError("Invalid message format")
			continue
		}

		c.handleMessage(msg)
	}
}

func (c *Client) writePump() {
	defer c.Conn.Close()
	for msg := range c.Send {
		c.mu.Lock()
		err := c.Conn.WriteMessage(websocket.TextMessage, msg)
		c.mu.Unlock()
		if err != nil {
			break
		}
	}
}


func (c *Client) handleMessage(msg WSMessage) {
	switch msg.Type {
	case MsgCreateRoom:
		var payload CreateRoomPayload
		if msg.Payload != nil {
			_ = json.Unmarshal(msg.Payload, &payload)
		}
		c.handleCreateRoom(payload)
	case MsgJoinRoom:
		var payload JoinRoomPayload
		if err := json.Unmarshal(msg.Payload, &payload); err != nil {
			c.sendError("Invalid join room payload")
			return
		}
		c.handleJoinRoom(payload)
	case MsgMove:
		var payload MovePayload
		if err := json.Unmarshal(msg.Payload, &payload); err != nil {
			c.sendError("Invalid move payload")
			return
		}
		c.handleMove(payload)
	case MsgRejoinRoom:
		var payload RejoinRoomPayload
		if err := json.Unmarshal(msg.Payload, &payload); err != nil {
			c.sendError("Invalid rejoin room payload")
			return
		}
		c.handleRejoinRoom(payload)
	case MsgPing:
		c.handlePing()
	case MsgResign:
		c.handleResign()
	case MsgDrawOffer:
		c.handleDrawOffer()
	case MsgDrawAccept:
		c.handleDrawAccept()
	case MsgDrawDecline:
		c.handleDrawDecline()
	default:
		c.sendError("Unknown message type: " + msg.Type)
	}
}


func (c *Client) handleCreateRoom(payload CreateRoomPayload) {
	c.Hub.mu.Lock()
	defer c.Hub.mu.Unlock()

	name := strings.TrimSpace(payload.Name)
	if name == "" {
		name = "Player 1"
	}
	c.Name = name

	code := generateRoomCode()
	for _, exists := c.Hub.Rooms[code]; exists; _, exists = c.Hub.Rooms[code] {
		code = generateRoomCode()
	}

	room := &Room{
		Code:      code,
		Game:      NewChessGame(),
		White:     c,
		WhiteName: c.Name,
	}

	c.Hub.Rooms[code] = room
	c.RoomCode = code
	c.Color = "white"

	log.Printf("Room %s created by %s (client %s)", code, c.Name, c.ID)
	c.sendGameState(room)
}

func (c *Client) handleJoinRoom(payload JoinRoomPayload) {
	c.Hub.mu.Lock()
	defer c.Hub.mu.Unlock()

	room, exists := c.Hub.Rooms[payload.RoomCode]
	if !exists {
		c.sendError("Room not found. Check the code and try again.")
		return
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	if room.White != nil && room.Black != nil {
		c.sendError("Room is full")
		return
	}

	name := strings.TrimSpace(payload.Name)
	if name == "" {
		name = "Player 2"
	}
	c.Name = name

	if room.Black == nil {
		room.Black = c
		c.Color = "black"
	} else {
		room.White = c
		c.Color = "white"
	}

	c.RoomCode = payload.RoomCode
	room.Started = true
	if c.Color == "black" {
		room.BlackName = c.Name
	} else {
		room.WhiteName = c.Name
	}

	log.Printf("%s (client %s) joined room %s as %s", c.Name, c.ID, payload.RoomCode, c.Color)

	if room.White != nil {
		room.White.sendGameState(room)
	}
	if room.Black != nil {
		room.Black.sendGameState(room)
	}
}

func (c *Client) handleMove(payload MovePayload) {
	c.Hub.mu.RLock()
	room, exists := c.Hub.Rooms[c.RoomCode]
	c.Hub.mu.RUnlock()

	if !exists {
		c.sendError("You are not in a room")
		return
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	if room.White == nil || room.Black == nil {
		c.sendError("Waiting for opponent to join")
		return
	}

	if room.Game.IsGameOver() {
		c.sendError("Game is already over")
		return
	}

	currentTurn := room.Game.Turn()
	if (currentTurn == "w" && c.Color != "white") || (currentTurn == "b" && c.Color != "black") {
		c.sendError("It's not your turn")
		return
	}

	err := room.Game.Move(payload.From, payload.To, payload.Promotion)
	if err != nil {
		c.sendError("Illegal move: " + err.Error())
		return
	}

	log.Printf("Room %s: %s moved %s%s%s", room.Code, c.Color, payload.From, payload.To, payload.Promotion)

	lastMove := &MovePayload{From: payload.From, To: payload.To, Promotion: payload.Promotion}

	if room.Game.IsGameOver() {
		result, method := room.Game.Outcome()
		gameOverPayload := GameOverPayload{
			Result: result,
			Method: method,
			FEN:    room.Game.FEN(),
		}
		log.Printf("Room %s: Game over — %s by %s", room.Code, result, method)
		if room.White != nil {
			room.White.sendGameStateWithMove(room, lastMove)
			room.White.sendGameOver(gameOverPayload)
		}
		if room.Black != nil {
			room.Black.sendGameStateWithMove(room, lastMove)
			room.Black.sendGameOver(gameOverPayload)
		}
		return
	}

	if room.White != nil {
		room.White.sendGameStateWithMove(room, lastMove)
	}
	if room.Black != nil {
		room.Black.sendGameStateWithMove(room, lastMove)
	}
}


func (c *Client) sendGameState(room *Room) {
	c.sendGameStateWithMove(room, nil)
}

func (c *Client) sendGameStateWithMove(room *Room, lastMove *MovePayload) {
	whiteName := ""
	blackName := ""
	if room.White != nil {
		whiteName = room.White.Name
	}
	if room.Black != nil {
		blackName = room.Black.Name
	}

	started := room.Started

	payload := GameStatePayload{
		FEN:         room.Game.FEN(),
		Turn:        room.Game.Turn(),
		RoomCode:    room.Code,
		White:       whiteName,
		Black:       blackName,
		LastMove:    lastMove,
		InCheck:     room.Game.InCheck(),
		PlayerColor: c.Color,
		Started:     started,
	}

	c.sendJSON(MsgGameState, payload)
}

func (c *Client) sendGameOver(payload GameOverPayload) {
	c.sendJSON(MsgGameOver, payload)
}

func (c *Client) sendError(message string) {
	c.sendJSON(MsgError, ErrorPayload{Message: message})
}

func (c *Client) sendJSON(msgType string, payload interface{}) {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshaling payload: %v", err)
		return
	}

	msg := WSMessage{
		Type:    msgType,
		Payload: json.RawMessage(payloadBytes),
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	select {
	case c.Send <- data:
	default:
		log.Printf("Client %s send buffer full, dropping message", c.ID)
	}
}


func (c *Client) handleRejoinRoom(payload RejoinRoomPayload) {
	c.Hub.mu.Lock()
	defer c.Hub.mu.Unlock()

	room, exists := c.Hub.Rooms[payload.RoomCode]
	if !exists {
		c.sendError("Room not found. The game may have ended — please start a new one.")
		return
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	if room.Game.IsGameOver() {
		c.sendError("This game has already ended.")
		return
	}

	requestedColor := strings.ToLower(strings.TrimSpace(payload.Color))
	name := strings.TrimSpace(payload.Name)

	switch requestedColor {
	case "white":
		if room.White != nil {
			c.sendError("Cannot rejoin: that slot is already occupied.")
			return
		}
		if name == "" {
			name = room.WhiteName
		}
		c.Name = name
		c.Color = "white"
		c.RoomCode = payload.RoomCode
		room.White = c
		room.WhiteName = name
		stopTimer(room.whiteReconTimer)
		room.whiteReconTimer = nil
	case "black":
		if room.Black != nil {
			c.sendError("Cannot rejoin: that slot is already occupied.")
			return
		}
		if name == "" {
			name = room.BlackName
		}
		c.Name = name
		c.Color = "black"
		c.RoomCode = payload.RoomCode
		room.Black = c
		room.BlackName = name
		stopTimer(room.blackReconTimer)
		room.blackReconTimer = nil
	default:
		c.sendError("Invalid colour for rejoin.")
		return
	}

	log.Printf("%s (client %s) rejoined room %s as %s", c.Name, c.ID, payload.RoomCode, c.Color)

	c.sendGameState(room)

	if c.Color == "white" && room.Black != nil {
		room.Black.sendJSON(MsgOpponentReconnected, map[string]string{})
		room.Black.sendGameState(room)
	} else if c.Color == "black" && room.White != nil {
		room.White.sendJSON(MsgOpponentReconnected, map[string]string{})
		room.White.sendGameState(room)
	}
}

func (c *Client) handlePing() {
	c.sendJSON(MsgPong, map[string]string{})
}


func (c *Client) handleResign() {
	c.Hub.mu.RLock()
	room, exists := c.Hub.Rooms[c.RoomCode]
	c.Hub.mu.RUnlock()
	if !exists {
		c.sendError("You are not in a room")
		return
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	if room.Game.IsGameOver() {
		return
	}

	winner := "black"
	if c.Color == "black" {
		winner = "white"
	}

	payload := GameOverPayload{Result: winner, Method: "resignation", FEN: room.Game.FEN()}
	log.Printf("Room %s: %s resigned", room.Code, c.Color)
	if room.White != nil {
		room.White.sendGameOver(payload)
	}
	if room.Black != nil {
		room.Black.sendGameOver(payload)
	}
}

func (c *Client) handleDrawOffer() {
	c.Hub.mu.RLock()
	room, exists := c.Hub.Rooms[c.RoomCode]
	c.Hub.mu.RUnlock()
	if !exists {
		c.sendError("You are not in a room")
		return
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	if room.Game.IsGameOver() || room.White == nil || room.Black == nil {
		return
	}

	room.DrawOfferedBy = c.Color

	var opponent *Client
	if c.Color == "white" {
		opponent = room.Black
	} else {
		opponent = room.White
	}
	if opponent != nil {
		opponent.sendJSON(MsgDrawOffered, map[string]string{})
	}
}

func (c *Client) handleDrawAccept() {
	c.Hub.mu.RLock()
	room, exists := c.Hub.Rooms[c.RoomCode]
	c.Hub.mu.RUnlock()
	if !exists {
		return
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	if room.DrawOfferedBy == "" || room.DrawOfferedBy == c.Color {
		return
	}

	room.DrawOfferedBy = ""
	payload := GameOverPayload{Result: "draw", Method: "agreement", FEN: room.Game.FEN()}
	log.Printf("Room %s: Draw agreed", room.Code)
	if room.White != nil {
		room.White.sendGameOver(payload)
	}
	if room.Black != nil {
		room.Black.sendGameOver(payload)
	}
}

func (c *Client) handleDrawDecline() {
	c.Hub.mu.RLock()
	room, exists := c.Hub.Rooms[c.RoomCode]
	c.Hub.mu.RUnlock()
	if !exists {
		return
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	room.DrawOfferedBy = ""

	var offerer *Client
	if c.Color == "white" {
		offerer = room.Black
	} else {
		offerer = room.White
	}
	if offerer != nil {
		offerer.sendJSON(MsgDrawDeclined, map[string]string{})
	}
}

func notifyRoomState(room *Room) {
	if room.White != nil {
		room.White.sendGameState(room)
	}
	if room.Black != nil {
		room.Black.sendGameState(room)
	}
}
