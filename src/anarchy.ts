const ALL_RANKS_PRIVATE: Rank[] = [];
const RANKS_BY_NAME_PRIVATE: Map<string, Rank> = new Map();
export class Rank {
    readonly name: string;
    readonly seriesEntryFeePoints: number;
    readonly seriesWinPoints: ReadonlyArray<number>;
    readonly openLossPoints: number;
    readonly startPoints: number;
    readonly endPoints: number;
    readonly hasRankUpBattle: boolean;

    static readonly ALL_RANKS: ReadonlyArray<Rank> = ALL_RANKS_PRIVATE;
    static readonly RANKS_BY_NAME: ReadonlyMap<string, Rank> = RANKS_BY_NAME_PRIVATE;

    private constructor(name: string, entryFeePoints: number, baseWinPoints: number,
            openLossPoints: number, startPoints: number, endPoints: number, hasRankUpBattle: boolean) {
        this.name = name;
        this.seriesEntryFeePoints = entryFeePoints;
        this.openLossPoints = openLossPoints;
        this.startPoints = startPoints;
        this.endPoints = endPoints;
        this.hasRankUpBattle = hasRankUpBattle;

        let gameWinPoints = [0];
        for (let i = 0; i < 5; i++) {
            gameWinPoints.push(gameWinPoints[i] + baseWinPoints + 5 * i);
        }
        this.seriesWinPoints = gameWinPoints;

        ALL_RANKS_PRIVATE.push(this);
        RANKS_BY_NAME_PRIVATE.set(name, this);
    }

    get previousRank(): Rank | null {
        let i = Rank.ALL_RANKS.indexOf(this);
        if (i == 0) return null;
        return Rank.ALL_RANKS[i - 1];
    }

    get nextRank(): Rank | null {
        let i = Rank.ALL_RANKS.indexOf(this);
        if (i == Rank.ALL_RANKS.length - 1) return null;
        return Rank.ALL_RANKS[i + 1];
    }

    static {
        new Rank("C-", 0, 20, 1, 0, 200, false);
        new Rank("C", 20, 20, 1, 200, 400, false);
        new Rank("C+", 40, 20, 1, 400, 600, true);
        new Rank("B-", 55, 30, 2, 100, 350, false);
        new Rank("B", 70, 30, 2, 350, 600, false);
        new Rank("B+", 85, 30, 2, 600, 850, true);
        new Rank("A-", 110, 40, 3, 200, 500, false);
        new Rank("A", 120, 40, 3, 500, 800, false);
        new Rank("A+", 130, 40, 3, 800, 1100, true);
        new Rank("S", 170, 50, 4, 300, 1000, true);

        // TODO: not sure if this is accurate
        for (let i = 0; i < 50; i++) {
            new Rank("S+" + i, 180, 50, 5, 300, 300 + 350 * (i % 10 + 1), i % 10 == 9);
        }
        // Behavior at maximum from https://www.youtube.com/watch?v=hmZWG0Y_3Ag
        new Rank("S+50", 180, 50, 5, 300, 9999, false);
    }
}

export enum SeriesType {
    SERIES = "series", RANK_UP_BATTLE = "rankup"
};

export const SERIES_WINS_BY_TYPE: Record<SeriesType, number> = {
    [SeriesType.SERIES]: 5,
    [SeriesType.RANK_UP_BATTLE]: 3
};
export const SERIES_LOSSES = 3;
export const GOLD_VALUE = 5;
export const SILVER_VALUE = 1;
export const OPEN_WIN_POINTS = 8;
export const MAX_POINTS = 9999;
export const MIN_POINTS = -9999; // TODO not sure what the real minimum is

export interface MatchResults {
    win: boolean;
    gold: number;
    silver: number;
}

export interface AnarchyJSON {
    rank: string;
    points: number;
    seriesInProgress: SeriesType | null;
    seriesMatches: MatchResults[];
}

export class Anarchy {
    rank: Rank = Rank.ALL_RANKS[0];
    private points_: number = 0;
    seriesInProgress: SeriesType | null = null;
    seriesMatches: MatchResults[] = [];

    copy(): Anarchy {
        let copy = new Anarchy();
        copy.rank = this.rank;
        copy.points_ = this.points_;
        copy.seriesInProgress = this.seriesInProgress;
        copy.seriesMatches = JSON.parse(JSON.stringify(this.seriesMatches));
        return copy;
    }

    get points() {
        return this.points_;
    }

    set points(newPoints) {
        if (newPoints > this.rank.endPoints) {
            if (!this.rank.hasRankUpBattle) {
                if (this.rank.nextRank) {
                    this.rank = this.rank.nextRank;
                } else {
                    newPoints = this.rank.endPoints;
                }
            }
        }
        if (newPoints > MAX_POINTS) {
            newPoints = MAX_POINTS;
        }
        if (newPoints < MIN_POINTS) {
            newPoints = MIN_POINTS;
        }
        this.points_ = newPoints;
    }

    get seriesWins() {
        let wins = 0;
        for (let match of this.seriesMatches) {
            if (match.win) {
                wins++;
            }
        }
        return wins;
    }

    get seriesLosses() {
        let losses = 0;
        for (let match of this.seriesMatches) {
            if (!match.win) {
                losses++;
            }
        }
        return losses;
    }

    get seriesGold() {
        let gold = 0;
        for (let match of this.seriesMatches) {
            gold += match.gold;
        }
        return gold;
    }

    get seriesSilver() {
        let silver = 0;
        for (let match of this.seriesMatches) {
            silver += match.silver;
        }
        return silver;
    }

    startSeries() {
        if (!this.seriesInProgress) {
            this.seriesInProgress = this.isRankUpBattleReady ? SeriesType.RANK_UP_BATTLE : SeriesType.SERIES;
            this.points -= this.rank.seriesEntryFeePoints;
            this.seriesMatches = [];
        }
    }

    endSeries() {
        this.points += this.pointsGainedThisSeries;
        if (this.seriesInProgress == SeriesType.RANK_UP_BATTLE && this.rank.hasRankUpBattle) {
            if (this.seriesWins >= SERIES_WINS_BY_TYPE[SeriesType.RANK_UP_BATTLE]) {
                this.rank = this.rank.nextRank!;
                this.points = this.rank.startPoints;
            }
        }
        this.seriesInProgress = null;
        this.seriesMatches = [];
    }

    winOpen() {
        this.points += OPEN_WIN_POINTS;
    }

    loseOpen() {
        this.points -= this.rank.openLossPoints;
    }

    get pointsGainedThisSeries() {
        if (this.seriesInProgress == SeriesType.SERIES) {
            return this.rank.seriesWinPoints[this.seriesWins] + this.seriesGold * GOLD_VALUE + this.seriesSilver * SILVER_VALUE;
        } else {
            return 0;
        }
    }

    get isRankUpBattleReady() {
        return this.rank.hasRankUpBattle && this.points >= this.rank.endPoints;
    }

    get isSeriesComplete() {
        if (!this.seriesInProgress) return false;
        return this.seriesWins >= SERIES_WINS_BY_TYPE[this.seriesInProgress] || this.seriesLosses >= SERIES_LOSSES;
    }

    get isSeriesValid() {
        if (!this.seriesInProgress) return true;
        let wins = 0, losses = 0;
        for (let match of this.seriesMatches) {
            if (wins >= SERIES_WINS_BY_TYPE[this.seriesInProgress] || losses >= SERIES_LOSSES) {
                return false;
            }
            if (match.win) {
                wins++;
            } else {
                losses++;
            }
        }
        return true;
    }

    get estimatedPoints() {
        if (!this.seriesInProgress) return this.points;

        let wins = 0, losses = 0;
        for (let match of this.seriesMatches) {
            if (match.win) {
                wins++;
            } else {
                losses++;
            }
        }

        let fractionProrated = (SERIES_WINS_BY_TYPE[this.seriesInProgress] - wins) * (SERIES_LOSSES - losses)
            / (SERIES_WINS_BY_TYPE[this.seriesInProgress] * SERIES_LOSSES);
        if (fractionProrated < 0) fractionProrated = 0;
        if (fractionProrated > 1) fractionProrated = 1;

        let proratedCostOffset = this.rank.seriesEntryFeePoints * fractionProrated;
        return this.points + proratedCostOffset + this.pointsGainedThisSeries;
    }

    store(): AnarchyJSON {
        return {
            rank: this.rank.name,
            points: this.points,
            seriesInProgress: this.seriesInProgress,
            seriesMatches: this.seriesMatches
        };
    }

    static load(json: AnarchyJSON): Anarchy {
        let model = new Anarchy();
        model.rank = RANKS_BY_NAME_PRIVATE.get(json.rank) ?? Rank.ALL_RANKS[0];
        model.points = json.points;
        model.seriesInProgress = json.seriesInProgress;
        model.seriesMatches = json.seriesMatches;
        return model;
    }
}
