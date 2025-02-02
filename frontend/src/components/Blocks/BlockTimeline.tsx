import React from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '../../store/store';
import BlockCard from './BlockCard';

const BlockTimeline: React.FC = () => {
    const blocks = useSelector((state: RootState) => state.blocks);
    return (
        <div style={{overflowY: 'auto', maxHeight: '90vh'}}>
            {blocks.map(block => (
                <BlockCard key={block.block_number} block={block}/>
            ))}
        </div>
    );
};

export default BlockTimeline;
