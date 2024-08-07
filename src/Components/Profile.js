import React from 'react';
import './Profile.scss';
import {Badge, Button, Card, Col, Container, Row} from 'react-bootstrap';
import avatar from '../img/AAAA.png';
import Activ from "./Activ";
import BanHistory from './BanHistory';
import BlackBar from '../Components/BlackBar';
import Heatmap from './Heatmap';

const Profile = () => {
    const user = {
        nickname: 'DeadlySunset',
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        badges: ['Мэр', 'Staff', 'DiscordKittenUWU'],
        skinUrl: 'https://via.placeholder.com/150',
        guilds: ['Таверна Союза Бардов']
    };



    const banHistoryData = [
        { type: 'Бан', reason: 'Использование читов', date: '01.01.2024' },
        { type: 'Мут', reason: 'Оскорбления игроков', date: '15.01.2024' },
        { type: 'Бан', reason: 'Гриферство', date: '20.02.2024 ' }
    ];



    return (
        <div className="profile">
            <BlackBar />
            <Container className="mt-4">
                <Row>
                    <Col md={3}>
                        <Card.Img src={avatar} className="img-fluid"/>
                        <div className="mt-4">
                            <Button variant="primary">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                     class="bi bi-discord" viewBox="0 0 16 16">
                                    <path
                                        d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
                                </svg>
                            </Button>
                            <Button variant="primary" className="ml-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                     class="bi bi-telegram" viewBox="0 0 16 16">
                                    <path
                                        d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294.26.006.549-.1.868-.32 2.179-1.471 3.304-2.214 3.374-2.23.05-.012.12-.026.166.016.047.041.042.12.037.141-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8.154 8.154 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629.093.06.183.125.27.187.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.426 1.426 0 0 0-.013-.315.337.337 0 0 0-.114-.217.526.526 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09z"/>
                                </svg>
                            </Button>
                        </div>
                    </Col>
                    <Col md={6}>
                        <Card className="castom_profile">
                            <Card.Body>
                                <Card.Title>DeadlySunset</Card.Title>
                                <Card.Subtitle className="mb-2 custom-gray-text">
                                    Был на сервере 2 часа назад
                                </Card.Subtitle>
                                <div className="badges">
                                    {user.badges.map((badge, index) => (
                                        <Badge key={index} pill variant="primary" className="badge-item">
                                            {badge} <span aria-hidden="true">&times;</span>
                                        </Badge>
                                    ))}
                                </div>
                                <div className="guilds mt-4">
                                    <h5>Гильдии:</h5>
                                    <ul>
                                        {user.guilds.map((guild, index) => (
                                            <li key={index}>{guild}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="mt-4">
                                    <h5>Статистика: </h5>
                                    <p>Наиграл: 0.0 ч. Месяц: 0.0 ч. Неделя: 0.0 ч. </p>
                                </div>
                                <Heatmap/>
                                <BanHistory history={banHistoryData}/>

                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>


    );
};

export default Profile;


