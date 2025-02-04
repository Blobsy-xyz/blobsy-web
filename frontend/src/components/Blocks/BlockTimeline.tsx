import React from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '../../store/store';
import BlockCard from './BlockCard';
import {motion} from 'framer-motion';
import '../../styles/general.css';

const BlockTimeline: React.FC = () => {
    const blocks = useSelector((state: RootState) => state.blocks);
    if (blocks.length === 0) {
        return (
            <motion.div
                initial={{opacity: 0, y: 100}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 1, ease: 'easeOut'}}
            >
                <span className="waiting">Waiting for blocks ...</span>
            </motion.div>
        );
    }

    return (
        <div style={{overflowY: 'auto', maxHeight: '90vh'}}>
            {blocks.map(block => (
                <BlockCard key={block.block_number} block={block}/>
            ))}
        </div>
    );
};

export default BlockTimeline;
