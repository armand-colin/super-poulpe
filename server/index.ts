import express from 'express'
import http from 'http'
import { Server, Socket } from "socket.io"
import Game from '../src/Game';
import GameAction from '../src/GameAction';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const games: { [key: string]: Game } = {}

io.on('connection', (socket) => {
    const gameId = socket.handshake.query.gameId as string;
    const name = socket.handshake.query.name as string;

    if (!games[gameId]) {
        const game = new Game(gameId, socket.id)
        games[gameId] = game
    }

    const error = games[gameId].join(socket.id, name)

    console.log(`User ${socket.id} (${name}) tried joined ${gameId}`);

    socket.join(gameId)

    handleResult(socket, gameId, error)

    socket.on('action', action => onSocketAction(socket, gameId, action))
});

const handleResult = (socket: Socket, gameId: string, error: string | null) => {
    if (error !== null) { 
        socket.emit("error", error)
        console.error(error)
    } else
        io.in(gameId).emit("game-state", games[gameId].state)
}

const onSocketAction = (socket: Socket, gameId: string, action: GameAction) => {
    const game = games[gameId]

    console.log('got action', action);
    
    if (!game)
        return socket.emit("error", "Not joined a game")

    const error = game.addAction(action)

    handleResult(socket, gameId, error)
}

server.listen("3066", () => {
    console.log('Listening on :3066');
});