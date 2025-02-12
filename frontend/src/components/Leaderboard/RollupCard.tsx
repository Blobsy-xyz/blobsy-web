import React, {useEffect, useState} from 'react';
import {LeaderboardEntry, RootState} from '../../store/store';
import '../../styles/rollupCard.css';
import {useSelector} from "react-redux";
import {createSelector} from "reselect";

interface RollupCardProps {
    entry: LeaderboardEntry;
}

const selectBlobs = createSelector(
    (state: RootState) => state.blobs,
    (_, entry: LeaderboardEntry) => entry.name,
    (blobs: any[], name: string) => blobs.filter((blob: any) => blob.name === name)
);

const selectAggBlobs = createSelector(
    (state: RootState) => state.aggBlobs,
    (_, entry: LeaderboardEntry) => entry.name,
    (aggBlobs: any[], name: string) => aggBlobs.filter((megaBlob: any) => megaBlob.is_aggregated && megaBlob.segments.some((segment: any) => segment.rollup === name))
);

const selectAllAggBlobs = createSelector(
    (state: RootState) => state.aggBlobs,
    (_, entry: LeaderboardEntry) => entry.name,
    (aggBlobs: any[], name: string) => aggBlobs.filter(megaBlob => megaBlob.segments.some((segment: any) => segment.rollup === name))
);

const RollupCard: React.FC<RollupCardProps> = ({entry}) => {
    const [flash, setFlash] = useState(false);

    const blobs = useSelector((state: RootState) => selectBlobs(state, entry));
    const aggBlobs = useSelector((state: RootState) => selectAggBlobs(state, entry));
    const allAggBlobs = useSelector((state: RootState) => selectAllAggBlobs(state, entry));
    const aggCost = allAggBlobs.reduce((sum, megaBlob) => sum + megaBlob.segments.filter((segment: {
        rollup: string;
        blob_fee: number
    }) => segment.rollup === entry.name).reduce((segSum: number, segment: {
        blob_fee: number
    }) => segSum + segment.blob_fee, 0), 0);
    const noOfBlobs = blobs.length;
    const noOfAggBlobs = aggBlobs.length;

    useEffect(() => {
        setFlash(true);
        const timeout = setTimeout(() => setFlash(false), 300);
        return () => clearTimeout(timeout);
    }, [entry.cost, blobs.length, aggBlobs.length]);

    return (
        <tr className={flash ? 'flash' : ''} style={{backgroundColor: entry.color}}>
            <td>{entry.name}</td>
            <td>{(entry.cost / 1e9).toFixed(4)}</td>
            <td>{(aggCost / 1e9).toFixed(4)}
                <small>({(aggCost && entry.cost ? aggCost / entry.cost * 100 : 0).toFixed(2)}%)</small></td>
            <td>{noOfBlobs}</td>
            <td>{noOfAggBlobs}
                <small>({(noOfAggBlobs && noOfBlobs ? noOfAggBlobs / noOfBlobs * 100 : 0).toFixed(2)}%)</small></td>
        </tr>
    );
};

export default RollupCard;