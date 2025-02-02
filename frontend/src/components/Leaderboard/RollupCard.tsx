import React from 'react';

interface RollupCardProps {
    rollup: string;
    stats: { posted: number; originalFees: number; megaBlobFees: number };
}

const RollupCard: React.FC<RollupCardProps> = ({ rollup, stats }) => {
    return (
        <div style={{
            margin: '4px 0',
            padding: '8px',
            backgroundColor: rollup === 'rollup A' ? '#FF5733' : '#33FFBD',
            borderRadius: '4px'
        }}>
            <div>{rollup}</div>
            <div>Blobs Posted: {stats.posted}</div>
            <div>Original Fees: {stats.originalFees}</div>
            <div>Mega Blob Fees: {stats.megaBlobFees}</div>
            <div>Savings: {(stats.originalFees - stats.megaBlobFees).toFixed(4)}</div>
        </div>
    );
};

export default RollupCard;
