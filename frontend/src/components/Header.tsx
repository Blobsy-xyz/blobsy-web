import React from 'react';
import '../styles/header.css';

const Header: React.FC = () => {
    return (
        <header className="header">
            <img src="/blober-logo-small.png" alt="Blober" className="logo"/>
            <div className="brand-info">
                <h1>Blobsy <sup style={{color: 'orange', fontSize: '50%'}}>alpha</sup></h1>
                <p>Inside blob aggregation</p>
            </div>

            <div className="info-icon" style={{position: 'relative', marginLeft: 'auto'}}>
                <span
                    style={{
                        display: 'inline-block',
                        width: '25px',
                        height: '25px',
                        border: '1px solid orange',
                        borderRadius: '50%',
                        textAlign: 'center',
                        lineHeight: '25px',
                        fontSize: '18px',
                        cursor: 'pointer'
                    }}
                    onClick={() => {
                        const popover = document.getElementById('popover-info');
                        if (popover) {
                            const isVisible = popover.style.display === 'block';
                            popover.style.display = isVisible ? 'none' : 'block';
                        }
                    }}
                >
                    i
                </span>
                <div
                    id="popover-info"
                    style={{
                        display: 'none',
                        position: 'absolute',
                        top: '30px',
                        right: '0',
                        width: '300px',
                        background: 'orange',
                        color: 'black',
                        padding: '10px',
                        borderRadius: '5px',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
                        zIndex: 10
                    }}
                ><small>
                    Realtime blob aggregation simulation.<br/>
                    Alpha means bugs.<br/><br/>
                    Currently, the aggregation algorithm is very simple:<br/>
                    <ul>
                        <li>Waits for a new block</li>
                        <li>If the block contains blob(s), it puts them into the blob queue</li>
                        <li>Processes the queue and creates a Megablob:</li>
                    </ul>
                    <ol>
                        <li>If a blob is more than 85% full</li>
                        <li>If we aggregate multiple blobs and reach more than 85%</li>
                        <li>If a blob is in the queue for more than 5 blocks</li>
                    </ol>
                    <span>Successfully aggregated megablobs have a orange border</span>
                </small>
                </div>
            </div>
        </header>
    );
};

export default Header;
