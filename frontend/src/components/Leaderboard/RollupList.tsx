import React from 'react';
import {useSelector} from 'react-redux';
import {RootState, LeaderboardEntry} from '../../store/store';
import RollupCard from './RollupCard';
import '../../styles/leaderboard.css';

const RollupList: React.FC = () => {
    const leaderboardObj = useSelector((state: RootState) => state.leaderboard);
    const rollups: LeaderboardEntry[] = Object.values(leaderboardObj)
        .sort((a, b) => b.cost - a.cost);

    return (
        <table className="leaderboard-table">
            <thead>
            <tr>
                <th title="The sender of the blobs">Sender</th>
                <th title="The original cost of blobs (ether)">Cost (eth)</th>
                <th title="The aggregated cost of blobs (ether)">AggCost (eth)</th>
                <th title="The number of original blobs">Blobs</th>
                <th title="The number of mega blobs (with more then 1 blob)">MegaBlobs</th>
            </tr>
            </thead>
            <tbody>
            {rollups.map((entry, idx) => (
                <RollupCard key={idx} entry={entry}/>
            ))}
            </tbody>
        </table>
    );
};

export default RollupList;
