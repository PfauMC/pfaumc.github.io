import React from 'react';
import './Auth.scss';

const TelegramAuth = () => {
    const handleTelegramLogin = () => {
        const telegramBotUsername = 'your_bot_username'; // Замените на имя вашего Telegram-бота
        const requestUrl = `https://oauth.telegram.org/auth?bot_id=${telegramBotUsername}&origin=${window.location.origin}&embed=0`;
        window.location.href = requestUrl;
    };

    return (
        <div className="telegram-auth d-flex flex-column justify-content-center align-items-center">
            <h1 className="mb-4">Войти через: </h1>
            <button className="btn btn-primary btn-lg" onClick={handleTelegramLogin}>
                Telegram
            </button>

        </div>
    );
};

export default TelegramAuth;
