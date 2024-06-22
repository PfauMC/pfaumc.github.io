import React from 'react';
import './Footer.scss';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="row">
                    <div className="col-12 col-md-4">
                        <p className="mb-0">© PfauMC.io 2024</p>
                    </div>
                    <div className="col-12 col-md-4">
                        <p className="mb-0">Все права защищены!</p>
                    </div>
                    <div className="col-12 col-md-4">
                        <p className="mb-0">Оригинальные права принадлежат Mojang AB</p>
                    </div>
                    <div className="col-12">
                        <p className="mb-0">
                            <a href="#user-agreement" className="text-white mx-2">Пользовательское соглашение</a>
                            <a href="#privacy-policy" className="text-white mx-2">Политика конфиденциальности</a>
                            <a href="#contacts" className="text-white mx-2">Контакты</a>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
