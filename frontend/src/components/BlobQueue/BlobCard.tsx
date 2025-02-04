import React from 'react';
import {BlobData} from '../../store/store';
import {motion} from 'framer-motion';
import '../../styles/blobCard.css';

interface BlobCardProps {
    blob: BlobData;
}

const BlobCard: React.FC<BlobCardProps> = ({blob}) => {
    return (
        <motion.div
            className="blob-card"
            initial={{opacity: 1, scale: 1}}
            animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0, scale: 0.5}}
            transition={{duration: 0.3}}
        >
            <div className="blob-horizontal-bar">
                <div className="blob-filled" style={{width: `${blob.filled}%`, backgroundColor: blob.color}}>
                    <span className="blob-label">{blob.filled}%</span>
                </div>
                <div className="blob-unfilled" style={{width: `${100 - blob.filled}%`}}></div>
            </div>
            <div className="blob-info">
                <small>Name: {blob.name}</small>
            </div>
        </motion.div>
    );
};

export default BlobCard;
