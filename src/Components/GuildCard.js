import React from 'react';
import './GuildCard.scss';
import GuildFlagImg from '../img/GuildFlag.png'; // Предполагается, что это общий флаг для всех карточек

const GuildCard = ({ guildName, description, membersCount, flagImagePath }) => {
    return (
        <div className="guild-card">
            <div className="card-body">
                <div className="text-content">
                    <h5 className="card-title">{guildName}</h5>
                    <p className="card-text">{description}</p>
                    <p className="card-text"><small className="text-muted">Участников: {membersCount}</small></p>
                </div>
                <img src={flagImagePath} className="guild-flag" alt="Guild Flag"/>
            </div>
        </div>
    );
};

export default GuildCard;
