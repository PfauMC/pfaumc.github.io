import React, { useState, useEffect } from 'react';
import { Button, Nav, Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Navbar.scss'; // Подключаем пользовательские стили
import Logo from '../img/Logo.png'; // Импортируем логотип

const NavigationBar = () => {
    const [prevScrollPos, setPrevScrollPos] = useState(window.pageYOffset);
    const [visible, setVisible] = useState(true);

    const handleScroll = () => {
        const currentScrollPos = window.pageYOffset;
        setVisible(prevScrollPos > currentScrollPos || currentScrollPos === 0);
        setPrevScrollPos(currentScrollPos);
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [prevScrollPos, visible]);

    return (
        <Navbar className={`custom-navbar ${visible ? 'is-visible' : 'is-hidden'}`} expand="lg">
            <Navbar.Brand as={Link} to="/">
                <img
                    src={Logo}
                    width="50"
                    height="50"
                    className="d-inline-block align-top"
                    alt="Логотип"
                />
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="mx-auto">
                    <Nav.Link as={Link} to="/">
                        Главная
                    </Nav.Link>
                    <Nav.Link as={Link} to="/rules">
                        Правила
                    </Nav.Link>
                    <Nav.Link as={Link} to="/guild">
                        Гильдии
                    </Nav.Link>
                    <Nav.Link href="/map">Карта мира</Nav.Link>
                    <Nav.Link href="https://discord.pfaumc.io">Discord</Nav.Link>
                </Nav>
                <Button variant="outline-success" as={Link} to="/profile" className="ml-auto">
                    Профиль
                </Button>
                <Button variant="outline-success" as={Link} to="/login">
                    Войти
                </Button>
            </Navbar.Collapse>
        </Navbar>
    );
};

export default NavigationBar;
