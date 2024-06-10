import React from 'react';
import '../styles/Main.scss';
import './Footer.scss';


const Footer = () => {
    return (
        <footer>
            <div className="footer-info">
                <p className="p_2">© PfauMC.io 2024</p>
                <p>Все права защищены!</p>
                <p>Оригинальные права принадлежат Mojang AB</p>
                <p>
                    <a href="#user-agreement">Пользовательское соглашение</a>
                    <a href="#privacy-policy">Политика конфиденциальности</a>
                    <a href="#contacts">Контакты</a>
                </p>
            </div>
        </footer>
    );
};

export default Footer;
