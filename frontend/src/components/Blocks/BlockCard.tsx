import React from 'react';
import {BlobData, Block} from '../../store/store';

interface BlockCardProps {
    block: Block;
}

const BlockCard: React.FC<BlockCardProps> = ({block}) => {
    return (
        <div style={{
            margin: '8px',
            padding: '16px',
            backgroundColor: '#1E1E1E',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
            {/* Header Row */}
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Block #{block.block_number}</span>
                <span>{new Date(block.block_timestamp).toLocaleTimeString()}</span>
            </div>
            {/* Original Blobs Row */}
            <div style={{marginTop: '8px'}}>
                {block.blobs.map((blob: BlobData, idx: number) => (
                    <div key={idx} style={{
                        margin: '4px 0',
                        background: blob.name === 'rollup A' ? '#FF5733' : '#33FFBD', // sample rollup colors
                        height: `${blob.filled}%`,
                        width: '20px',
                        display: 'inline-block',
                        marginRight: '4px'
                    }}>
                        <small>{blob.blob_fee}</small>
                    </div>
                ))}
            </div>
            {/* Mega Blobs Row (highlighted) - placeholder until aggregation logic */}
            <div style={{marginTop: '8px', backgroundColor: '#333', padding: '4px', borderRadius: '4px'}}>
                <span>Mega Blobs (coming soon)</span>
            </div>
        </div>
    );
};

export default BlockCard;
