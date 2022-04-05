import GameAction from "./GameAction";
import GamePhase from "./GamePhase";
import GameState from "./GameState";
import Player from "./Player";

export default class Game {

    private static _cards = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, -1]

    private _id: string;
    private _players: Player[]
    private _phase: GamePhase;
    private _turn: number;
    private _round: number;
    private _pass: number;
    private _table: { [key: string]: number }
    private _creator: string;

    constructor(id: string, creator: string) {
        this._id = id;
        this._creator = creator;
        this._players = []
        this._phase = GamePhase.preparing;
        this._turn = -1;
        this._round = 0;
        this._pass = 0;
        this._table = {}
    }

    public get state(): GameState {
        return {
            id: this._id,
            creator: this._creator,
            pass: this._pass,
            phase: this._phase,
            players: this._players,
            round: this._round,
            table: this._table,
            turn: this._turn
        }
    }

    public addAction(action: GameAction): string | null {
        switch (this._phase) {
            case GamePhase.preparing:
                if (action.type === "join")
                    return this.join(action.playerId, action.data.name)
                if (action.type === "start")
                    return this.start(action.playerId)
                break;
            case GamePhase.playing:
                if (action.type === "play")
                    return this.play(action.playerId, action.data.card)
                break;
            case GamePhase.betting:
                if (action.type === "bet")
                    return this.bet(action.playerId, action.data.bet)
                break;
        }
        return "Invalid action"
    }

    public join(id: string, name: string): string | null {
        if (this._players.length === 4)
            return "Cannot add a player"

        const player: Player = {
            id,
            name,
            health: 10,
            bet: -1,
            passes: 0,
            cards: []
        }

        this._players.push(player)
        return null;
    }

    public play(playerId: string, card: number): string | null {
        const playerIndex = this._players.findIndex(player => player.id === playerId)

        if (playerIndex === -1)
            return "Unknown player"

        if (playerIndex !== this._turn)
            return "Not your turn"

        const player = this._players[playerIndex]
        const handCard = (card > 21 || card < 1) ? -1 : card

        const cardIndex = player.cards.indexOf(handCard)

        if (cardIndex === -1)
            return "Card not in hand"

        player.cards.splice(cardIndex, 1)

        this._table[playerId] = card;

        this._turn++;

        if (this._turn >= this._players.length)
            this.nextPass()
        
        return null
    }

    private nextPass() {
        this._turn = 0;
        this._pass++;

        let winner: string = "";
        for (const playerId in this._table)
            if (winner === "" || this._table[winner] < this._table[playerId])
                winner = playerId

        const player = this._players.find(player => player.id === winner)!
        player.passes++;
        
        this._table = {}

        if (this._pass >= this._round)
            this.nextRound()
    }

    private nextRound() {
        this._turn = 0
        this._pass = 0

        // Calc health lost for this 
        for (const player of this._players) {
            const delta = Math.abs(player.passes - player.bet)
            player.health -= delta
        }

        for (const player of this._players)
            if (player.health <= 0)
                return this.end()
        
        this._round--;
        if (this._round === 0)
            this._round = 5;

        // Next player to start
        this._players = [...this._players.slice(1), this._players[0]]

        this.drawCards()
        this._phase = GamePhase.betting
    }

    private drawCards() {
        const count = this._round;
        // Randomized deck
        const deck = [...Game._cards].sort(_ => Math.random() - 0.5)
        
        for (const player of this._players)
            player.cards = deck.splice(0, count)
    }

    private bet(playerId: string, bet: number): string | null {
        const playerIndex = this._players.findIndex(player => player.id === playerId)
        
        if (playerIndex === -1)
            return "Unknown player"
        
        if (playerIndex !== this._turn)
            return "Not your turn"

        const player = this._players[playerIndex]

        const last = playerIndex === this._players.length - 1

        if (last) {
            let betSum = 0
            for (let i = 0; i < this._players.length - 1; i++)
                betSum += this._players[i].bet

            if (betSum + bet === this._round)
                return `Invalid bet (cannot sum up to ${this._round})`
        }

        player.bet = bet

        this._turn++;

        if (this._turn === this._players.length) {
            this._turn = 0
            this._phase = GamePhase.playing
        }

        return null
    }

    private start(playerId: string): string | null {
        if (this._creator !== playerId)
            return "Only the creator can start the game"
        
        if (this._players.length < 2)
            return "Cannot play with less than 2 players"

        this._phase = GamePhase.betting

        this._round = 5
        this._turn = 0;
        this._pass = 0;

        this.drawCards()

        return null
    }

    private end() {

    }

}