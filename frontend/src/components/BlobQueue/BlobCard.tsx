import React from 'react';
import {BlobData, Block} from '../../store/store';
import {RootState} from '../../store/store';
import {motion} from 'framer-motion';
import '../../styles/blobCard.css';
import {useSelector} from "react-redux";

interface BlobCardProps {
    blob: BlobData;
}

interface BlockCardProps {
    block: Block;
}

const BlobCard: React.FC<BlobCardProps> = ({blob}) => {
    const blocks = useSelector((state: RootState) => state.blocks);
    const lastBlockNumber = blocks[0].block_number;
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
                <small>Sender: <b>{blob.name}</b>, Fee: <b>{blob.blob_fee}</b> gwei,
                    Age: <b>{lastBlockNumber - blob.blockReceived}</b> block(s)</small>
            </div>
        </motion.div>
    );
};

export default BlobCard;
