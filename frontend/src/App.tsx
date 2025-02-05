import React, {useEffect} from 'react';
import {webSocketService} from './services/websocketService';
import BlocksColumn from './components/Blocks/BlockTimeline';
import BlobQueue from './components/BlobQueue/BlobQueue';
import Leaderboard from './components/Leaderboard/Leaderboard';
import {aggregatorService} from './services/aggregatorService';
import Header from './components/Header';
import Footer from "./components/Footer";


const App: React.FC = () => {
    useEffect(() => {
        webSocketService.connect();
        aggregatorService.start();
        return () => {
            aggregatorService.stop();
        };
    }, []);

    return (
        <div>
            <Header/>
            <div style={{display: 'flex', flexDirection: 'row', padding: '16px'}}>
                <div style={{flex: 1}}><h3>Blocks</h3><BlocksColumn/></div>
                <div style={{flex: 1}}><h3>Blob queue</h3><BlobQueue/></div>
                <div style={{flex: 1}}><h3>Leaderboard</h3>
                    <Leaderboard/>
                </div>
            </div>
            <Footer/>
        </div>
    );
};

export default App;
