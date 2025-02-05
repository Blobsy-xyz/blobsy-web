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
                textAlign: "center",
                borderTop: "1px solid #ccc",
            }}
        >
            <small>
                © {new Date().getFullYear()} <a href=">https://kriptal.io">Kriptal</a> All rights reserved.&nbsp;
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        window.location.href =
                            `mailto:` + `${"info"}@${"kriptal"}.${"io"}`;
                    }}
                >
                    info@kriptal.io
                </a>
            </small>
        </footer>
    );
};

export default Footer;