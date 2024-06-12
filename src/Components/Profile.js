import React from 'react';
import './Profile.scss';
import {Badge, Card} from 'react-bootstrap';

const Profile = () => {
    const user = {
        nickname: 'DeadlySunset',
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        badges: ['Мэр', 'Staff', 'DiscordKittenUWU'],
        skinUrl: 'https://via.placeholder.com/150' // Замените на URL скина персонажа
    };

    return (
        <div className="profile d-flex flex-column justify-content-center align-items-center">
            <Card className="profile-card d-flex flex-row">
                <Card.Img variant="left" src={user.skinUrl} className="profile-skin"/>
                <Card.Body>
                    <Card.Title>{user.nickname}</Card.Title>
                    <Card.Text>
                        <strong>UUID:</strong> {user.uuid}
                    </Card.Text>
                    <div className="badges">
                        {user.badges.map((badge, index) => (
                            <Badge key={index} pill variant="primary" className="badge-item">
                                {badge} <span aria-hidden="true">&times;</span>
                            </Badge>
                        ))}
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Profile;
