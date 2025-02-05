import React from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '../../store/store';
import '../../styles/leaderboard.css';
import {unwrapResult} from "@reduxjs/toolkit";

const TotalsPanel: React.FC = () => {
    const leaderboard = useSelector((state: RootState) => state.leaderboard);
    const totals = Object.values(leaderboard).reduce((acc, entry) => {
        acc.originalCost += entry.cost;
        acc.savings += (entry.savings);
        acc.noOfBlobs += entry.noOfBlobs;
        acc.noOfAggBlobs += entry.noOfAggBlobs;
        return acc;
    }, {originalCost: 0, savings: 0, noOfBlobs: 0, noOfAggBlobs: 0});

    const noOfAggBlobs = useSelector((state: RootState) => state.noOfAggBlobs);
    return (
        <div className="totals-panel">
            <table>
                <tbody>
                <tr>
                    <td>Original Cost (gwei):</td>
                    <td><b>{totals.originalCost.toFixed(4)}</b></td>
                </tr>
                <tr>
                    <td>Savings (gwei):</td>
                    <td>
                        <small>({(totals.savings && totals.originalCost ? totals.savings / totals.originalCost * 100 : 0).toFixed(2)}%)</small>&nbsp;
                        <b>{totals.savings.toFixed(4)}</b>
                    </td>
                </tr>
                <tr>
                    <td>Original Blobs:</td>
                    <td><b>{totals.noOfBlobs}</b></td>
                </tr>
                <tr>
                    <td>MegaBlobs:</td>
                    <td>
                        <small>({(totals.noOfAggBlobs && totals.noOfBlobs ? totals.noOfAggBlobs / totals.noOfBlobs * 100 : 0).toFixed(2)}%)</small>&nbsp;
                        <b>{totals.noOfAggBlobs}</b>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};

export default TotalsPanel;
