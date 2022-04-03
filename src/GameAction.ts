type GameAction = PlayAction | JoinAction | BetAction | StartAction;

interface Action {
    playerId: string;
    type: string;
}

interface PlayAction extends Action {
    type: "play";
    data: { card: number }
}

interface JoinAction extends Action {
    type: "join";
    data: { name: string }
}

interface BetAction extends Action {
    type: "bet";
    data: { bet: number }
}

interface StartAction extends Action {
    type: "start";
    data: void;
}

export default GameAction