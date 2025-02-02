import React from 'react';
import { BlobData } from '../../store/store';

interface BlobCardProps {
    blob: BlobData;
}

const BlobCard: React.FC<BlobCardProps> = ({ blob }) => {
    return (
        <div style={{
            margin: '4px',
            padding: '8px',
            backgroundColor: blob.name === 'rollup A' ? '#FF5733' : '#33FFBD',
            borderRadius: '4px'
        }}>
            <div>{blob.name}</div>
            <div>Fee: {blob.blob_fee}</div>
            <div>Fullness: {blob.filled}%</div>
        </div>
    );
};

export default BlobCard;
