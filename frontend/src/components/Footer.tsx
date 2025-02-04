// Footer.tsx (TypeScript / React)
import React from "react";

const Footer: React.FC = () => {
    return (
        <footer
            style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                width: "100%",
                background: "#1E1E1E",
                color: "#ccc",
                height: "20px",
                padding: "10px 10px",
                textAlign: "left",
                borderTop: "1px solid #ccc",
            }}
        >
            <small>© {new Date().getFullYear()} Kriptal. All rights reserved.</small>
        </footer>
    );
};

export default Footer;