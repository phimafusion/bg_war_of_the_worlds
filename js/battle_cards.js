/**
 * Battle Cards Deck and AI Actions for Land Battles in 'The War of the Worlds'
 */

export const BATTLE_CARDS_DECK = [
    {
        id: "battle_1",
        initiative: "H",
        setup: { green: "A", yellow: "B", red: "C", black: "D", blue: "E" },
        actions: {
            green: "detect",
            yellow: "move",
            red: "attack",
            black: "focused_detect",
            blue: "double_move"
        }
    },
    {
        id: "battle_2",
        initiative: "M",
        setup: { green: "B", yellow: "C", red: "D", black: "E", blue: "A" },
        actions: {
            green: "move",
            yellow: "detect",
            red: "focused_fire",
            black: "attack",
            blue: "arrival"
        }
    },
    {
        id: "battle_3",
        initiative: "H",
        setup: { green: "C", yellow: "D", red: "E", black: "A", blue: "B" },
        actions: {
            green: "focused_detect",
            yellow: "focused_fire",
            red: "move",
            black: "double_move",
            blue: "high_activity"
        }
    },
    {
        id: "battle_4",
        initiative: "M",
        setup: { green: "D", yellow: "E", red: "A", black: "B", blue: "C" },
        actions: {
            green: "double_move",
            yellow: "arrival",
            red: "detect_all",
            black: "fire_all",
            blue: "move"
        }
    },
    {
        id: "battle_5",
        initiative: "H",
        setup: { green: "E", yellow: "A", red: "B", black: "C", blue: "D" },
        actions: {
            green: "high_activity",
            yellow: "move",
            red: "attack",
            black: "detect",
            blue: "focused_fire"
        }
    },
    {
        id: "battle_6",
        initiative: "M",
        setup: { green: "A", yellow: "C", red: "E", black: "B", blue: "D" },
        actions: {
            green: "detect_all",
            yellow: "fire_all",
            red: "arrival",
            black: "move",
            blue: "double_move"
        }
    },
    {
        id: "battle_7",
        initiative: "H",
        setup: { green: "B", yellow: "D", red: "A", black: "C", blue: "E" },
        actions: {
            green: "focused_fire",
            yellow: "focused_detect",
            red: "double_move",
            black: "high_activity",
            blue: "attack"
        }
    },
    {
        id: "battle_8",
        initiative: "M",
        setup: { green: "C", yellow: "E", red: "B", black: "D", blue: "A" },
        actions: {
            green: "arrival",
            yellow: "move",
            red: "detect",
            black: "focused_fire",
            blue: "fire_all"
        }
    },
    {
        id: "battle_9",
        initiative: "H",
        setup: { green: "D", yellow: "A", red: "C", black: "E", blue: "B" },
        actions: {
            green: "move",
            yellow: "double_move",
            red: "high_activity",
            black: "arrival",
            blue: "detect_all"
        }
    },
    {
        id: "battle_10",
        initiative: "M",
        setup: { green: "E", yellow: "B", red: "D", black: "A", blue: "C" },
        actions: {
            green: "focused_detect",
            yellow: "attack",
            red: "fire_all",
            black: "double_move",
            blue: "move"
        }
    }
];

export class BattleDeck {
    constructor() {
        this.deck = [];
        this.discard = [];
        this.reset();
    }

    reset() {
        this.deck = [...BATTLE_CARDS_DECK];
        this.shuffle();
        this.discard = [];
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    draw() {
        if (this.deck.length === 0) {
            if (this.discard.length === 0) return null;
            this.deck = [...this.discard];
            this.shuffle();
            this.discard = [];
        }
        const card = this.deck.pop();
        this.discard.push(card);
        return card;
    }
}
