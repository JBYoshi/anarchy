import { useId, useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import GoldMedal from "./assets/goldmedal.png";
import SilverMedal from "./assets/silvermedal.png";
import { MatchResults, SERIES_LOSSES, SERIES_WINS_BY_TYPE, SeriesType } from "./anarchy";

function RangeSelect({value, max, setValue, item}: {value: number, max: number, setValue: (newValue: number) => void, item: () => JSX.Element}) {
    let [hoverValue, setHoverValue] = useState<number | null>(null);
    let pickers = [];
    let groupId = useId();
    for (let index = 1; index <= max; index++) {
        const buttonId = useId();

        let selected = value >= index;

        let valueToSetOnClick = value == index ? 0 : index;
        pickers.push(<span
            style={{opacity: selected ? 1 : 0.3}}
            onMouseOver={() => {
                setHoverValue(index);
            }} onMouseOut={() => {
                if (index == hoverValue) setHoverValue(null);
            }} 
        >
            <input id={buttonId} name={groupId} type="checkbox" style="display: none;" checked={selected} onChange={() => {
                setValue(valueToSetOnClick);
                setHoverValue(null);
            }}/><label for={buttonId} class="label">{ item() }</label>
        </span>);
    }
    return <div style="display: flex; flex-direction: row;">
        {pickers}
    </div>;
}

function SeriesMatch({key, match, type, changeWinDisabled, onMatchUpdated, onMatchRemoved}: {match: MatchResults, changeWinDisabled: boolean, type: SeriesType, onMatchUpdated: (match: MatchResults) => void, onMatchRemoved: () => void, key: number}) {
    return <div key={key} style="display: flex; flex-direction: row;">
        <button style="width: 6em;" disabled={changeWinDisabled} onClick={() => {
            let match2 = {...match};
            match2.win = !match2.win;
            onMatchUpdated(match2);
        }} class={match.win ? "victory-defeat-swap" : "defeat victory-defeat-swap"}>
            {match.win ? "VICTORY" : "DEFEAT"}
        </button>
        { type != SeriesType.RANK_UP_BATTLE && <div class="medal-list" style="display: flex; flex-direction: column;">
            <RangeSelect value={match.gold} setValue={gold => {
                let match2 = {...match};
                match2.gold = gold;
                if (match2.silver > 3 - match2.gold) match2.silver = 3 - match2.gold;
                onMatchUpdated(match2);
            }} max={3} item={() => <img class="medal" src={GoldMedal} />}/>
            <RangeSelect value={match.silver} setValue={silver => {
                let match2 = {...match};
                match2.silver = silver;
                if (match2.gold > 3 - match2.silver) match2.gold = 3 - match2.silver;
                onMatchUpdated(match2);
            }} max={3} item={() => <img class="medal" src={SilverMedal} />}/>
        </div> }
        <button style="aspect-ratio: 1" onClick={onMatchRemoved}>-</button>
    </div>;
}

export default function Series({matches, type, onMatchesUpdated}: {matches: MatchResults[], type: SeriesType, onMatchesUpdated: (matches: MatchResults[]) => void}) {
    let wins = 0, losses = 0;
    for (let match of matches) {
        if (match.win) wins++;
        else losses++;
    }

    return <div style="display: flex; flex-direction: column;">
        {matches.map((match, index) => 
            <SeriesMatch key={index} match={match} type={type}
                // TODO: this logic is safe but gets stuck if the maximum number of matches is used (7 for a standard series).
                changeWinDisabled={match.win
                    ? losses >= SERIES_LOSSES || (losses == SERIES_LOSSES - 1 && matches[matches.length - 1].win && index != matches.length - 1)
                    : wins >= SERIES_WINS_BY_TYPE[type] || (wins == SERIES_WINS_BY_TYPE[type] - 1 && !matches[matches.length - 1].win && index != matches.length - 1)}
                onMatchUpdated={match2 => onMatchesUpdated([...matches.slice(0, index), match2, ...matches.slice(index + 1)])}
                onMatchRemoved={() => onMatchesUpdated([...matches.slice(0, index), ...matches.slice(index + 1)])}
            />
        )}
        {(wins < SERIES_WINS_BY_TYPE[type] && losses < SERIES_LOSSES) && <div style="display: flex; flex-direction: row; align-items: center;">
            <span>Add:</span>
            <button onClick={() => {
                onMatchesUpdated([...matches, {win: true, gold: 0, silver: 0}]);
            }}>VICTORY</button>
            <button onClick={() => {
                onMatchesUpdated([...matches, {win: false, gold: 0, silver: 0}]);
            }} class="defeat">DEFEAT</button>
        </div>}
    </div>;
}