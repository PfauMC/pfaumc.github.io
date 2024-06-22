import "./Fireflies.scss"
import React, { useState, useEffect } from 'react';


const Fireflies = () => {
    const [fireflies, setFireflies] = useState([]);

    // Добавление нового светлячка
    const addFirefly = () => {
        const newFirefly = {
            id: Date.now(),
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            speedX: Math.random() * 2 - 1, // скорость по X
            speedY: Math.random() * 2 - 1, // скорость по Y
        };
        setFireflies(prevFireflies => [...prevFireflies, newFirefly]);
    };

    // Удаление светлячка
    const removeFirefly = (id) => {
        setFireflies(prevFireflies => prevFireflies.filter(firefly => firefly.id !== id));
    };

    // Обработчик для добавления светлячков через интервал времени
    useEffect(() => {
        const interval = setInterval(addFirefly, 1000); // добавляем светлячков каждую секунду

        return () => {
            clearInterval(interval);
        };
    }, []);

    // Обновление позиции светлячков и их удаление при выходе за границы экрана
    useEffect(() => {
        const updateFireflies = () => {
            setFireflies(prevFireflies =>
                prevFireflies.map(firefly => ({
                    ...firefly,
                    x: firefly.x + firefly.speedX,
                    y: firefly.y + firefly.speedY,
                }))
            );
        };

        const animate = () => {
            updateFireflies();
            requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animate);
        };
    }, []);

    return (
        <div className="fireflies-container">
            {fireflies.map(firefly => (
                <Firefly key={firefly.id} x={firefly.x} y={firefly.y} removeFirefly={() => removeFirefly(firefly.id)} />
            ))}
        </div>
    );
};

const Firefly = ({ x, y, removeFirefly }) => {
    return (
        <div className="firefly" style={{ left: x, top: y }} onClick={removeFirefly}></div>
    );
};

export default Fireflies;