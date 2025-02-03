import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import '../../styles/leaderboard.css';

const TotalsPanel: React.FC = () => {
    const leaderboard = useSelector((state: RootState) => state.leaderboard);
    const totals = Object.values(leaderboard).reduce((acc, entry) => {
        acc.originalCost += entry.cost;
        acc.aggregatedCost += entry.aggCost;
        acc.savings += (entry.cost - entry.aggCost);
        acc.noOfBlobs += entry.noOfBlobs;
        acc.noOfAggBlobs += entry.noOfAggBlobs;
        return acc;
    }, { originalCost: 0, aggregatedCost: 0, savings: 0, noOfBlobs: 0, noOfAggBlobs: 0 });

    return (
        <div className="totals-panel">
            <div>Original Cost: {totals.originalCost.toFixed(4)}</div>
            <div>Aggregated Cost: {totals.aggregatedCost.toFixed(4)}</div>
            <div>Savings: {totals.savings.toFixed(4)}</div>
            <div>No. of Blobs: {totals.noOfBlobs}</div>
            <div>No. of Agg Blobs: {totals.noOfAggBlobs}</div>
        </div>
    );
};

export default TotalsPanel;
