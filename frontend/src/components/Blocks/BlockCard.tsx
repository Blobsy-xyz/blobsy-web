import React from 'react';
import {BlobData, Block} from '../../store/store';
import MegaBlobBar from './MegaBlobBar';
import '../../styles/blockCard.css';

interface BlockCardProps {
    block: Block;
}

const BlockCard: React.FC<BlockCardProps> = ({block}) => {
    return (
        <div className="block-card">
            {/* Header Row */}
            <div className="block-card-header">
                <span>Block #{block.block_number}</span>
                <span>{new Date(block.block_timestamp * 1000).toLocaleTimeString()}</span>
            </div>

            {/* Original Blobs Row */}
            <div className="original-blobs-header"><small><b>Original blobs:</b></small></div>
            <div className="original-blobs-row">
                {block.blobs && block.blobs.length > 0 ? (
                    block.blobs.map((blob: BlobData, idx: number) => (
                        <div
                            key={idx}
                            className="blob-bar"
                            style={{background: blob.color, height: `${blob.filled}%`}}
                            title={`Sender: ${blob.name}: ${blob.filled}%, Fee: ${blob.blob_fee} gwei`}
                        >
                            <div><small>{blob.filled}%</small></div>
                        </div>
                    ))
                ) : (
                    <small className="waiting">No blobs in this block</small>
                )}
            </div>

            {/* Mega Blobs Row */}
            <div className="mega-blobs-row">
                <div className="mega-blobs-header"><small><b>Agg blobs:</b></small></div>
                {block.megaBlobs && block.megaBlobs.length > 0 ? (
                    block.megaBlobs.map((megaBlob, idx) => (
                        <div key={idx}>
                            <MegaBlobBar megaBlob={megaBlob}/>
                        </div>
                    ))
                ) : (
                    <small className="waiting">No blobs (or to small) to aggregate ... </small>
                )}
            </div>
        </div>
    );
};

export default BlockCard;
