import React from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '../../store/store';
import '../../styles/leaderboard.css';
import {unwrapResult} from "@reduxjs/toolkit";

const TotalsPanel: React.FC = () => {
    const leaderboard = useSelector((state: RootState) => state.leaderboard);
    const totals = Object.values(leaderboard).reduce((acc, entry) => {
        acc.originalCost += entry.cost;
        acc.aggregatedCost += entry.aggCost;
        acc.savings += (entry.cost - entry.aggCost);
        acc.noOfBlobs += entry.noOfBlobs;
        acc.noOfAggBlobs += entry.noOfAggBlobs;
        return acc;
    }, {originalCost: 0, aggregatedCost: 0, savings: 0, noOfBlobs: 0, noOfAggBlobs: 0});

    const noOfAggBlobs = useSelector((state: RootState) => state.noOfAggBlobs);
    return (
        <div className="totals-panel">
            <table>
                <tbody>
                <tr>
                    <td>Original Cost:</td>
                    <td><b>{totals.originalCost.toFixed(4)}</b> gwei</td>
                </tr>
                <tr>
                    <td>Aggregated Cost:</td>
                    <td><b>{totals.aggregatedCost.toFixed(4)}</b> gwei</td>
                </tr>
                <tr>
                    <td>Savings:</td>
                    <td><b>{totals.savings.toFixed(4)}</b> gwei</td>
                </tr>
                <tr>
                    <td>No. of Blobs:</td>
                    <td><b>{totals.noOfBlobs}</b></td>
                </tr>
                <tr>
                    <td>No. of Agg Blobs:</td>
                    <td><b>{noOfAggBlobs}</b></td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};

export default TotalsPanel;
