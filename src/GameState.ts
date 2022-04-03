import GamePhase from "./GamePhase";
import Player from "./Player";

export default interface GameState {
    id: string;
    creator: string;
    players: Player[]
    phase: GamePhase;
    turn: number;
    round: number;
    pass: number;
    table: { [key: string]: number }
}