import React from 'react';
import './SocialIcons.scss'; // Подключите стили, если требуется

const SocialIcons = () => {
    return (

        <div className="social-icons-container">
            <link rel="stylesheet"
                  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"/>

            <a href="https://discord.com/invite/cQMVwEth" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-discord"></i>
            </a>
            <a href="https://t.me/pfaumc" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-telegram-plane"></i>
            </a>
            <a href="https://www.tiktok.com/@pfaumc.io?_t=8maTAytrFMu&_r=1" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-tiktok"></i>
            </a>
            <a href="https://youtube.com/@pfaumc?si=wNfsT74Iu_mwaDbQ" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-youtube"></i>
            </a>
            <a href="https://vk.com/pfaumc" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-vk"></i>
            </a>
        </div>
    );
};

export default SocialIcons;
