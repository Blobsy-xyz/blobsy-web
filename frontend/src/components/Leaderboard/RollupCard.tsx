import React, {useEffect, useState} from 'react';
import {LeaderboardEntry} from '../../store/store';
import '../../styles/rollupCard.css';

interface RollupCardProps {
    entry: LeaderboardEntry;
}

const RollupCard: React.FC<RollupCardProps> = ({entry}) => {
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        setFlash(true);
        const timeout = setTimeout(() => setFlash(false), 1000);
        return () => clearTimeout(timeout);
    }, [entry.cost, entry.noOfBlobs, entry.noOfAggBlobs]);

    return (
        <tr className={flash ? 'flash' : ''} style={{backgroundColor: entry.color}}>
            <td>{entry.name}</td>
            <td>{entry.cost.toFixed(4)}</td>
            <td>{(entry.savings).toFixed(4)} <small>({(entry.savings && entry.cost ? entry.savings / entry.cost * 100 : 0).toFixed(2)}%)</small></td>
            <td>{entry.noOfBlobs}</td>
            <td>{entry.noOfAggBlobs} <small>({(entry.noOfAggBlobs && entry.noOfBlobs ? entry.noOfAggBlobs / entry.noOfBlobs * 100: 0).toFixed(2)}%)</small></td>
        </tr>
    );
};

export default RollupCard;
