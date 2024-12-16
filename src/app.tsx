import { useEffect, useId, useState } from 'preact/hooks'
import './app.css'
import Series from './Series'
import { Anarchy, MAX_POINTS, MIN_POINTS, Rank, SeriesType } from './anarchy'

function RankEditor({model, setModel}: {model: Anarchy, setModel: (newModel: Anarchy) => void}) {
  const [rank, setRank] = useState(model.rank.name);
  const [points, setPoints] = useState(model.points);
  const [seriesInProgress, setSeriesInProgress] = useState(model.seriesInProgress);

  const rankId = useId();
  const pointsId = useId();
  const seriesInProgressId = useId();

  return <form style="display: flex; flex-direction: row; align-items: flex-start;" onSubmit={e => {
    let newModel = model.copy();
    newModel.rank = Rank.RANKS_BY_NAME.get(rank)!;
    newModel.points = points;
    newModel.seriesInProgress = seriesInProgress;
    if (!seriesInProgress) {
      newModel.seriesMatches = [];
    } else {
      while (!newModel.isSeriesValid) {
        newModel.seriesMatches.pop();
      }
    }
    setModel(newModel);
    e.preventDefault();
    return false;
  }}>
    <div style="flex-grow: 1;">
      <p>
        <label for={rankId}>Rank </label>
        <select id={rankId} value={rank} onChange={e => setRank(e.currentTarget.value)}>
          {Rank.ALL_RANKS.map(rank => <option value={rank.name}>{rank.name}</option>)}
        </select>
        {" "}
        <input type="number" id={pointsId}
          value={points} min={MIN_POINTS} max={MAX_POINTS}
          style="width: 4em;"
          onChange={e => setPoints(parseInt(e.currentTarget.value))}></input>
        <label for={pointsId}>p</label>
      </p>
      <p>
        <label for={seriesInProgressId}>Series In Progress: </label>
        <select id={seriesInProgressId} value={seriesInProgress || ""} onChange={e => setSeriesInProgress(e.currentTarget.value ? e.currentTarget.value as SeriesType : null)}>
          <option value="">{nameForSeriesType(null)}</option>
          <option value={SeriesType.SERIES}>{nameForSeriesType(SeriesType.SERIES)}</option>
          <option value={SeriesType.RANK_UP_BATTLE}>{nameForSeriesType(SeriesType.RANK_UP_BATTLE)}</option>
        </select>
      </p>
    </div>
    <button type="submit">Save</button>
  </form>;
}

function nameForSeriesType(type: SeriesType | null) {
  if (type == SeriesType.SERIES) return "Series";
  if (type == SeriesType.RANK_UP_BATTLE) return "Rank-Up Battle";
  return "None";
}

export function App() {
  const [draftModel, setModel] = useState(new Anarchy());
  const [editMode, setEditMode] = useState(false);
  const [anarchyOpenOperation, setAnarchyOpenOperation]
      = useState<"victory" | "defeat" | null>(null);

  useEffect(function() {
    let data = localStorage.getItem("anarchy");
    if (data) {
      setModel(Anarchy.load(JSON.parse(data)));
    }
  }, []);

  let finalizedModel = draftModel.copy();
  if (finalizedModel.isSeriesComplete) {
    finalizedModel.endSeries();
  }

  useEffect(function() {
    localStorage.setItem("anarchy", JSON.stringify(finalizedModel.store()));
  }, [finalizedModel]);

  let pointsChangeThisSeries = 0;
  if (draftModel.seriesInProgress == SeriesType.SERIES) {
    pointsChangeThisSeries = draftModel.estimatedPoints - (draftModel.points + draftModel.rank.seriesEntryFeePoints);
  }

  return (
    <>
      <div class="app-top">
        <div style="display: flex; flex-direction: column;">
          <div class="section">
            <h1>Anarchy Tracker</h1>
              { editMode ? <RankEditor model={finalizedModel} setModel={saved => {
                setModel(saved);
                setEditMode(false);
              }} /> : 
              <div style="display: flex; flex-direction: row; align-items: flex-start;">
                <div style="flex-grow: 1;">
                  <p>Rank {finalizedModel.rank.name} {finalizedModel.points}p</p>
                  <p>Series In Progress: {nameForSeriesType(finalizedModel.seriesInProgress)}</p>
                </div>
                <button onClick={() => setEditMode(true)}>Edit</button>
              </div>}
          </div>
          <div class="section">
            <h2>Anarchy Open</h2>
            <button class="victory" onClick={() => {
              let newModel = finalizedModel.copy();
              newModel.winOpen();
              setModel(newModel);
              setAnarchyOpenOperation("victory");
            }}>VICTORY</button>
            <button class="defeat" onClick={() => {
              let newModel = finalizedModel.copy();
              newModel.loseOpen();
              setModel(newModel);
              setAnarchyOpenOperation("defeat");
            }}>DEFEAT</button>
            {anarchyOpenOperation != null && <button onClick={() => {
              let newModel = finalizedModel.copy();
              if (anarchyOpenOperation == "victory") {
                newModel.undoWinOpen();
              } else {
                newModel.undoLoseOpen();
              }
              setModel(newModel);
              setAnarchyOpenOperation(null);
            }}>
              Undo
            </button>}
          </div>
        </div>
        <div>
        <div class="section">
          <h2>Anarchy Series</h2>
          {draftModel.seriesInProgress && <>
            <p>{nameForSeriesType(draftModel.seriesInProgress)} {draftModel.isSeriesComplete ? "Complete" : "In Progress"}</p>
            {draftModel.seriesInProgress == SeriesType.SERIES && <p>
              Estimated points: {draftModel.estimatedPoints.toFixed(1)}{" "}
              ({pointsChangeThisSeries >= 0 ? "Gained " : "Lost "}{Math.abs(pointsChangeThisSeries).toFixed(1)})
            </p>}
            <Series type={draftModel.seriesInProgress} matches={draftModel.seriesMatches} onMatchesUpdated={matches => {
              let newModel = draftModel.copy();
              newModel.seriesMatches = matches;
              setModel(newModel);
            }}></Series>
          </>}
          {(!draftModel.seriesInProgress || draftModel.isSeriesComplete) && <div style={{display: "flex", flexDirection: "row"}}>
            <button onClick={() => {
              let newModel = draftModel.copy();
              if (newModel.seriesInProgress) newModel.endSeries();
              newModel.startSeries();
              setModel(newModel);
            }} class="highlight">
              New {finalizedModel.isRankUpBattleReady ? "Rank-Up Battle" : "Series"}
              <br />
              <span class="small">Pay {finalizedModel.rank.seriesEntryFeePoints} pts</span>
            </button>
            {draftModel.isSeriesComplete && <button onClick={() => {
              let newModel = draftModel.copy();
              newModel.endSeries();
              setModel(newModel);
            }}>
              Clear
            </button>}
          </div>}
        </div>
        </div>
      </div>
    </>
  )
}
