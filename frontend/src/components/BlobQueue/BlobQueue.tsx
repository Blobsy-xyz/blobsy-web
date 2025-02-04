import React from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '../../store/store';
import BlobCard from './BlobCard';
import {AnimatePresence, motion} from 'framer-motion';

const BlobQueue: React.FC = () => {
    const blobQueue = useSelector((state: RootState) => state.blobQueue);
    if (blobQueue.length === 0) {
        return (
            <motion.div
                initial={{opacity: 0, y: 100}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 1, ease: 'easeOut'}}
            >
                <span className="waiting">Waiting for blobs ...</span>
            </motion.div>
        );
    }
    return (
        <div>
            <AnimatePresence>
                {blobQueue.map(blob => (
                    <BlobCard key={blob.id} blob={blob}/>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default BlobQueue;
