import React from 'react';
import '../../styles/megaBlob.css';

interface MegaBlobBarProps {
    megaBlob: {
        name: string;
        created_at: number;
        filled: number; // Sum of included blob fill percentages (max 100)
        value: number;
        segments: {
            rollup: string;
            filled: number; // Percentage value of this segment
            color: string;
        }[];
    };
}

const MegaBlobBar: React.FC<MegaBlobBarProps> = ({megaBlob}) => {
    // Sum of all provided segment fill percentages.
    const usedFill = megaBlob.segments.reduce((sum, seg) => sum + seg.filled, 0);
    // Unused percentage is the remainder to reach 100%
    const unusedFill = 100 - usedFill;
    const isMegablob = megaBlob.segments.length > 1;
    
    return (
        <div className={`mega-blob-bar ${isMegablob ? 'mega-blob-megablob' : ''}`}
             title={`${megaBlob.name} (${megaBlob.filled}%)`}>
            {megaBlob.segments.map((segment, idx) => (
                <div
                    key={idx}
                    className="mega-blob-segment"
                    style={{
                        width: `${segment.filled}%`,
                        backgroundColor: segment.color,
                    }}
                    title={`${segment.rollup}: ${segment.filled}%`}
                >
                    <span className="mega-blob-segment-label">{segment.filled}%</span>
                </div>
            ))}
            {unusedFill > 0 && (
                <div
                    className="mega-blob-segment"
                    style={{
                        width: `${unusedFill}%`,
                        backgroundColor: '#000000',
                    }}
                    title={`Unused: ${unusedFill}%`}
                >
                    <span className="mega-blob-segment-label">{unusedFill}%</span>
                </div>
            )}
        </div>
    );
};

export default MegaBlobBar;
