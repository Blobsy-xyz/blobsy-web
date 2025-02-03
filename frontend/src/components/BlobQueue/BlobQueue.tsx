import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import BlobCard from './BlobCard';
import { AnimatePresence } from 'framer-motion';

const BlobQueue: React.FC = () => {
    const blobQueue = useSelector((state: RootState) => state.blobQueue);
    return (
        <div>
            <h3>Blob Queue</h3>
            <AnimatePresence>
                {blobQueue.map(blob => (
                    <BlobCard key={blob.id} blob={blob} />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default BlobQueue;
