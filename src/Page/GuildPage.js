import React from 'react';
import './GuildPage.scss';
import SocialIcons from "../Components/SocialIcons";
import Fireflies from '../Components/Fireflies';
import GuildCard from '../Components/GuildCard';
import { Container, Row, Col } from 'react-bootstrap';
import BlackBar from '../Components/BlackBar';

import GuildFlag1 from '../img/GuildFlag.png';
import GuildFlag2 from '../img/GuildFlag2.png';
import GuildFlag3 from '../img/GuildFlag3.png';
import GuildFlag4 from '../img/GuildFlag4.png';

export default function GuildPage() {
    return (
        <div className="back_img">
            <div className="GuildContent">
                <SocialIcons />
                <BlackBar />
                <Fireflies />
                <Container>
                    <Row className="justify-content-between guild-card-row">
                        <Col xs={12} sm={6} md={4} lg={3} className="mb-4">
                            <GuildCard
                                guildName="Таверна союза Бардов"
                                description="Уютная таверна с баром ждет своих первых посетителей!"
                                membersCount={12}
                                flagImagePath={GuildFlag1}
                            />
                        </Col>
                        <Col xs={12} sm={6} md={4} lg={3} className="mb-4">
                            <GuildCard
                                guildName="ЧВК Авариус"
                                description="Вступай в банду СВОшных тараканов прямо сейчас!!"
                                membersCount={30}
                                flagImagePath={GuildFlag2}
                            />
                        </Col>
                        <Col xs={12} sm={6} md={4} lg={3} className="mb-4">
                            <GuildCard
                                guildName="My Litle Ponny"
                                description="Дружба - это чудо! "
                                membersCount={1}
                                flagImagePath={GuildFlag3}
                            />
                        </Col>
                        <Col xs={12} sm={6} md={4} lg={3} className="mb-4">
                            <GuildCard
                                guildName="Бикини-Ботом"
                                description="Стань частью нашего подводного мира!"
                                membersCount={10}
                                flagImagePath={GuildFlag4}
                            />
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>
    );
}