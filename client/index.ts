import { io, Socket } from "socket.io-client"
import readlineNode from 'readline'
import GameState from "../src/GameState";
import GamePhase from "../src/GamePhase";
import process from "process";

let ip = "http://localhost:3066"

if (process.argv[2])
    ip = process.argv[2]


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

    socket = io(ip, {
        query: { gameId, name }
    })

    socket.on('disconnect', console.error)

    socket.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message}`);
      });

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
            printPreparation(state)
            break;
        case GamePhase.playing:
            console.log("+ JEU +");
            printPlaying(state)
            break;
        case GamePhase.betting:
            console.log("+ PARI +");
            printBetting(state)
            break;
    }

}

const printPreparation = (state: GameState) => {
    console.log("")
    console.log(state.players.map(player => player.id === state.creator ? `*${player.name}*` : player.name).join(', '))
}

const printBetting = (state: GameState) => {
    state.players.forEach((player ,i) => {
        const self = player.id === socket.id
        const show = (self && state.round > 1) || (!self && state.round === 1)
        console.log(`${state.turn === i ? '>' : ' '} ${player.name} (${player.health}❤️): ${player.cards.map(c => show ? c == -1 ? "J" : c : "#").join(' ')} ${state.turn > i ? '> ' + player.bet : ''}`);
    })
}

const printPlaying = (state: GameState) => {
    state.players.forEach((player ,i) => {
        const self = player.id === socket.id
        const show = (self && state.round > 1) || (!self && state.round === 1)
        console.log(`${state.turn === i ? '>' : ' '} ${player.name} (${player.health}❤️, ${player.passes}/${player.bet}): ${player.cards.map(c => show ? c == -1 ? "J" : c : "#").join(' ')} ${state.turn > i ? '> ' + state.table[player.id] : ''}`);
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