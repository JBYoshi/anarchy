import { Rank, Anarchy, SeriesType } from '../anarchy';

// From https://www.youtube.com/watch?v=WexuZaAORDY
test("S+49 rank up", function() {
    let anarchy = new Anarchy();
    anarchy.rank = Rank.RANKS_BY_NAME.get("S+49")!;
    expect(anarchy.rank.endPoints).toBe(3800);
    anarchy.points = 3621;
    anarchy.seriesInProgress = SeriesType.SERIES;
    anarchy.seriesMatches = [
        {win: true, gold: 3, silver: 0},
        {win: true, gold: 3, silver: 0},
        {win: true, gold: 3, silver: 0},
        {win: false, gold: 3, silver: 0},
        {win: true, gold: 3, silver: 0},
        {win: true, gold: 3, silver: 0}
    ];
    expect(anarchy.pointsGainedThisSeries).toBe(390);

    anarchy.endSeries();

    expect(anarchy.rank.name).toBe("S+49");
    expect(anarchy.points).toBe(4011);
    expect(anarchy.isRankUpBattleReady).toBe(true);

    anarchy.startSeries();
    expect(anarchy.seriesInProgress).toBe(SeriesType.RANK_UP_BATTLE);
    anarchy.seriesMatches = [
        {win: true, gold: 0, silver: 0},
        {win: true, gold: 0, silver: 0},
        {win: true, gold: 0, silver: 0}
    ];
    expect(anarchy.isSeriesComplete).toBe(true);
    anarchy.endSeries();
    expect(anarchy.rank.name).toBe("S+50");
    expect(anarchy.points).toBe(300);
});
