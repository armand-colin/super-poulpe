import { io, Socket } from "socket.io-client"
import readlineNode from 'readline'
import GameState from "../src/GameState";
import GamePhase from "../src/GamePhase";
import process from "process";

const iostream = readlineNode.createInterface({
    input: process.stdin,
    output: process.stdout
})

const readline = (question?: string) => {
    return new Promise<string>((resolve, reject) => {
        iostream.question(question ?? "", (data: string) => {
            resolve(data)
        })
    })
}

let gameState: GameState
let socket: Socket

async function main() {
    const name = await readline("Nom d'utilisateur: ")
    const gameId = await readline("Id de la partie: ")

    socket = io("http://localhost:3066", {
        query: { gameId, name }
    })

    socket.on('connect', () => {
        console.log('Connected');
    })

    socket.on('message', (...args) => {
        console.log(...args);
    })

    socket.on('error', (...args) => {
        console.error(...args);
    })

    socket.on('game-state', (state: GameState) => {
        printGameState(state)
        gameState = state
    })

    askCommand()
}

const printGameState = (state: GameState) => {
    // Logging state
    console.clear();

    switch (state.phase) {
        case GamePhase.preparing:
            console.log("+ PREPARATION +");
            break;
        case GamePhase.playing:
            console.log("+ JEU +");
            break;
        case GamePhase.betting:
            console.log("+ PARI +");
            break;
    }

    console.log("")

    if (Object.keys(state.table).length > 0) {
        console.log("Table:")
        console.log(Object.values(state.table).join(' '))
        console.log("")
    }

    state.players.forEach((player ,i) => {
        const self = player.id === socket.id
        const show = (self && state.round > 1) || (!self && state.round === 1)
        console.log(`${state.turn === i ? '>' : ' '} ${player.name}: ${player.cards.map(c => show ? c == -1 ? "J" : c : "#").join(' ')}`);
    })

}

const askCommand = () => {
    readline()
        .then(line => {
            const [type, data] = line.split(' ')

            if (type === "start") {
                socket.emit('action', { type: 'start', playerId: socket.id, data: undefined })
            }

            if (type === "play") {
                const card = Number(data)
                socket.emit('action', { type: 'play', playerId: socket.id, data: { card } })
            }

            if (type === "bet") {
                const bet = Number(data)
                socket.emit('action', { type: 'bet', playerId: socket.id, data: { bet } })
            }

            printGameState(gameState)
            setTimeout(askCommand)
        })
}


main()