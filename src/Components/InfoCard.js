import React from 'react';
import './InfoCard.scss';

const InfoCard = ({icon, title, text}) => {
    return (
        <div className="info-card">
            <img src={icon} alt={title} className="info-card-icon"/>
            <h3>{title}</h3>
            <p>{text}</p>
        </div>
    );
};

export default InfoCard;