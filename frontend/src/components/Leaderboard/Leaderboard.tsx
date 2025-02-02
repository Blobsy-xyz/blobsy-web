import React from 'react';
import TotalsPanel from './TotalsPanel';
import RollupList from './RollupList';

const Leaderboard: React.FC = () => {
    return (
        <div>
            <h3>Leaderboard</h3>
            <TotalsPanel />
            <RollupList />
        </div>
    );
};

export default Leaderboard;
