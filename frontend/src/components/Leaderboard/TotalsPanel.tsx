import React from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '../../store/store';
import '../../styles/leaderboard.css';

const TotalsPanel: React.FC = () => {
    const leaderboard = useSelector((state: RootState) => state.leaderboard);
    const blobs = useSelector((state: RootState) => state.blobs);
    const megaBlobs = useSelector((state: RootState) => state.aggBlobs.filter(blob => blob.is_aggregated));
    const aggBlobs = useSelector((state: RootState) => state.aggBlobs);

    // Calculate totals
    const totals = Object.values(leaderboard).reduce((acc, entry) => {
        acc.originalCost += entry.cost;
        return acc;
    }, {originalCost: 0, aggCost: 0});

    // Sum all mega_blob_fee from aggregated blobs
    totals.aggCost = aggBlobs.reduce((sum, blob) => sum + blob.mega_blob_fee, 0);

    const noOfBlobs = blobs.length;
    const noOfMegaBlobs = megaBlobs.length;

    return (
        <div className="totals-panel">
            <table>
                <tbody>
                <tr>
                    <td>Original Cost (ether):</td>
                    <td><b>{(totals.originalCost / 1e9).toFixed(4)}</b></td>
                </tr>
                <tr>
                    <td>Agg Cost (ether):</td>
                    <td>
                        <small>({(totals.aggCost && totals.originalCost ? totals.aggCost / totals.originalCost * 100 : 0).toFixed(2)}%)</small>&nbsp;
                        <b>{(totals.aggCost / 1e9).toFixed(4)}</b>
                    </td>
                </tr>
                <tr>
                    <td>Original Blobs:</td>
                    <td><b>{noOfBlobs}</b></td>
                </tr>
                <tr>
                    <td>Aggregated Blobs:</td>
                    <td>
                        <small>({(noOfMegaBlobs && noOfBlobs ? noOfMegaBlobs / noOfBlobs * 100 : 0).toFixed(2)}%)</small>&nbsp;
                        <b>{noOfMegaBlobs}</b>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};

export default TotalsPanel;