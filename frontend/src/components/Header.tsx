import React from 'react';
import '../styles/header.css';

const Header: React.FC = () => {
    return (
        <header className="header">
            <img src="/blober-logo-small.png" alt="Blober" className="logo"/>
            <div className="brand-info">
                <h1>Blober</h1>
                <p>Inside blob aggregation</p>
            </div>
        </header>
    );
};

export default Header;
