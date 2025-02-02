import React from 'react';

const TotalsPanel: React.FC = () => {
    // In a full implementation, these values come from global state
    const totals = {
        originalCost: 0.005,
        aggregatedCost: 0.003,
        savings: 0.002,
        originalBlobs: 10,
        aggregatedBlobs: 5
    };

    return (
        <div style={{ padding: '8px', backgroundColor: '#333', borderRadius: '4px', marginBottom: '8px' }}>
            <div>Original Cost: {totals.originalCost}</div>
            <div>Aggregated Cost: {totals.aggregatedCost}</div>
            <div>Savings: {totals.savings}</div>
            <div># Original Blobs: {totals.originalBlobs}</div>
            <div># Aggregated Blobs: {totals.aggregatedBlobs}</div>
        </div>
    );
};

export default TotalsPanel;
