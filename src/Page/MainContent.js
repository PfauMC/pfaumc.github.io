import React from 'react';
import '../styles/Main.scss';
import './MainContent.scss';
import icon1 from '../img/Icon1.png';
import icon2 from '../img/Icon2.png';
import icon3 from '../img/Icon3.png';
import icon4 from '../img/Icon4.png';
import icon5 from '../img/Icon5.png';
import icon6 from '../img/Icon6.png';
import InfoCard from "../Components/InfoCard";


const MainContent = () => {
    const copyToClipboard = () => {
        navigator.clipboard.writeText('pfaumc.io');
        alert('Адрес сервера скопирован в буфер обмена!');
    };

    return (
        <div className="main-content">
            <div className="content-block">
                <h1>PfauMC</h1>
                <p>Стань частью нашего дружного сообщества и наслаждайся</p>
                <p>игрой вместе с нами.</p>

                <button onClick={copyToClipboard} className="start-button">Начать играть</button>
            </div>
            <div className="features">
                <h2>Почему именно мы?</h2>
                <div className="feature-grid">
                    <InfoCard icon={icon1} title="ОБНОВЛЕНИЯ"
                              text="Наш сервер всегда обновляется до новейших версий игры, что позволяет игрокам наслаждаться всеми последними функциями и улучшениями."/>
                    <InfoCard icon={icon2} title="НЕТ ПРИВЕЛЕГИЙ"
                              text="Мы предлагаем равноправный опыт игры без донатных привилегий, что позволяет всем игрокам начать с одинаковых возможностей."/>
                    <InfoCard icon={icon3} title="МИР БЕЗ ГРАНИЦ"
                              text="У нас нет ограничений на размер миров, что позволяет игрокам исследовать и строить в неограниченных пространствах."/>
                    <InfoCard icon={icon4} title="СООБЩЕСТВО"
                              text="Мы предлагаем активное сообщество игроков, которые всегда готовы помочь и поддержать новых участников."/>
                    <InfoCard icon={icon5} title="АДМИНИСТРАЦИЯ"
                              text="Наша администрация всегда готова решить любые проблемы или вопросы игроков, обеспечивая комфортное и приятное времяпрепровождение на сервере."/>
                    <InfoCard icon={icon6} title="ИВЕНТЫ"
                              text="На сервере есть миниигры и ивенты, которые добавляют разнообразие и интерес к игровому процессу."/>
                </div>
            </div>
            <div className="news-section">
                <h2>Новости</h2>

            </div>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"/>
            {/*<div className="social-icons">*/}
            {/*    <a href="https://discord.com/invite/cQMVwEth" target="_blank"><i className="fab fa-discord"></i></a>*/}
            {/*    <a href="https://t.me/pfaumc" target="_blank"><i className="fab fa-telegram-plane"></i></a>*/}
            {/*    <a href="https://www.tiktok.com/@pfaumc.io?_t=8maTAytrFMu&_r=1" target="_blank"><i*/}
            {/*        className="fab fa-tiktok"></i></a>*/}
            {/*    <a href="https://youtube.com/@pfaumc?si=wNfsT74Iu_mwaDbQ" target="_blank"><i*/}
            {/*        className="fab fa-youtube"></i></a>*/}
            {/*    <a href="https://vk.com/pfaumc" target="_blank"><i className="fab fa-vk"></i></a>*/}
            {/*</div>*/}
        </div>


    );
};

export default MainContent;