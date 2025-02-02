import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import BlobCard from './BlobCard';

const BlobQueue: React.FC = () => {
    const blobQueue = useSelector((state: RootState) => state.blobQueue);
    return (
        <div>
            <h3>Blob Queue</h3>
            {blobQueue.map((blob, idx) => (
                <BlobCard key={idx} blob={blob} />
            ))}
        </div>
    );
};

export default BlobQueue;
