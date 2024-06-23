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
import YouTubeVideo from "../Components/Video";
import SocialIcons from "../Components/SocialIcons";
import { Container, Row, Col, Button } from 'react-bootstrap'; // Import Bootstrap components
import BlackBar from '../Components/BlackBar';
import ArrowDownButton from '../Components/ArrowDownButton';
import Fireflies from '../Components/Fireflies';



const MainContent = () => {
    const copyToClipboard = () => {
        navigator.clipboard.writeText('pfaumc.io');
        alert('Адрес сервера скопирован в буфер обмена!');
    };

    return (
        <div className="main-content">
            <Fireflies/>
            <Container>
                <div className="content-block">
                    <h1 className="gradient-text">PfauMC</h1>
                    <p>Стань частью нашего дружного сообщества и наслаждайся игрой вместе с нами.</p>


                    <button onClick={copyToClipboard} className="start-button">Начать играть</button>
                </div>
            </Container>
            <ArrowDownButton />
            <BlackBar/>

            <Container className="features">
                <h2>Почему именно мы?</h2>
                <Row className="feature-grid">
                    <InfoCard icon={icon1} title="ОБНОВЛЕНИЯ"
                              text="Наш сервер всегда обновляется до новейших версий игры, что позволяет игрокам наслаждаться всеми последними функциями и улучшениями."/>
                    <InfoCard icon={icon2} title="НЕТ ПРИВИЛЕГИЙ"
                              text="Мы предлагаем равноправный опыт игры без донатных привилегий, что позволяет всем игрокам начать с одинаковых возможностей."/>
                    <InfoCard icon={icon3} title="МИР БЕЗ ГРАНИЦ"
                              text="У нас нет ограничений на размер миров, что позволяет игрокам исследовать и строить в неограниченных пространствах."/>
                    <InfoCard icon={icon4} title="СООБЩЕСТВО"
                              text="Мы предлагаем активное сообщество игроков, которые всегда готовы помочь и поддержать новых участников."/>
                    <InfoCard icon={icon5} title="АДМИНИСТРАЦИЯ"
                              text="Наша администрация всегда готова решить любые проблемы или вопросы игроков, обеспечивая комфортное и приятное времяпрепровождение на сервере."/>
                    <InfoCard icon={icon6} title="ИВЕНТЫ"
                              text="На сервере есть миниигры и ивенты, которые добавляют разнообразие и интерес к игровому процессу."/>
                </Row>
            </Container>

            <BlackBar />


            <Container className="news-section">
                <Row>
                    <Col>
                        <YouTubeVideo videoId="syIkjsbiS50"/>
                    </Col>
                </Row>
            </Container>

            <SocialIcons/>
        </div>
    );
};

export default MainContent;
