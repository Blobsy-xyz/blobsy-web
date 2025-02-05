import React from 'react';
import {useSelector} from 'react-redux';
import {RootState, LeaderboardEntry} from '../../store/store';
import RollupCard from './RollupCard';
import '../../styles/leaderboard.css';

const RollupList: React.FC = () => {
    const leaderboardObj = useSelector((state: RootState) => state.leaderboard);
    const rollups: LeaderboardEntry[] = Object.values(leaderboardObj)
        .sort((a, b) => b.noOfAggBlobs - a.noOfAggBlobs);

    return (
        <table className="leaderboard-table">
            <thead>
            <tr>
                <th>Sender</th>
                <th>Cost</th>
                <th>Agg Cost</th>
                <th>Savings</th>
                <th>Blobs</th>
                <th>Agg Blobs</th>
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
