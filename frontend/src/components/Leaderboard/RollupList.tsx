import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import RollupCard from './RollupCard';

const RollupList: React.FC = () => {
    const leaderboard = useSelector((state: RootState) => state.leaderboard);
    const rollups = Object.entries(leaderboard);
    return (
        <div>
            {rollups.map(([rollup, stats]) => (
                <RollupCard key={rollup} rollup={rollup} stats={stats} />
            ))}
        </div>
    );
};

export default RollupList;
