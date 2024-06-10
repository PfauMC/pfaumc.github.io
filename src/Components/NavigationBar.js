import React from 'react';
import {Button, Nav, Navbar} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Navbar.scss'; // Подключаем стили
import Logo from '../img/Logo.png'; // Импортируем логотип

const NavigationBar = () => {
    return (
        <Navbar className="custom-navbar" expand="lg">
            <Navbar.Brand as={Link} to="/">
                <img
                    src={Logo}
                    width="50"
                    height="50"
                    className="d-inline-block align-top"
                    alt="Logo"
                />
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav"/>
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="mx-auto">
                    <Nav.Link as={Link} to="/">Главная</Nav.Link>
                    <Nav.Link as={Link} to="/Page/RulesPage">Правила</Nav.Link>
                    <Nav.Link as={Link} to="/Page/GuildPage">Гильдии</Nav.Link>
                    <Nav.Link href="https://discord.com">Discord</Nav.Link>
                </Nav>
                <Button variant="outline-success" as={Link} to="/Page/LogIn" className="ml-auto">
                    Войти
                </Button>
            </Navbar.Collapse>
        </Navbar>
    );
};

export default NavigationBar;
