import React, {useEffect} from 'react';
import {webSocketService} from './services/websocketService';
import BlocksColumn from './components/Blocks/BlockTimeline';
import BlobQueue from './components/BlobQueue/BlobQueue';
import Leaderboard from './components/Leaderboard/Leaderboard';
import {aggregatorService} from './services/aggregatorService';

const App: React.FC = () => {
    useEffect(() => {
        webSocketService.connect();
        aggregatorService.start();
        return () => {
            aggregatorService.stop();
        };
    }, []);

    return (
        <div style={{display: 'flex', flexDirection: 'row', padding: '16px'}}>
            <div style={{flex: 1}}><h3>Blocks</h3><BlocksColumn/></div>
            <div style={{flex: 1}}><BlobQueue/></div>
            <div style={{flex: 1}}>
                <Leaderboard/>
            </div>
        </div>
    );
};

export default App;
