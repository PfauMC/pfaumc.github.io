import React from 'react';
import './Heatmap.scss';


const days = ['Пн', "", 'Чт ', ' ', 'Вс ', ' ', ' '];
const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const contributions = [
    // Пример данных о вкладе (один квадрат - одна дата)
    { day: 0, week: 0, count: 1 },
    { day: 1, week: 0, count: 2 },
    { day: 2, week: 0, count: 3 },
    { day: 3, week: 0, count: 4 },
    { day: 4, week: 0, count: 5 },
    { day: 5, week: 0, count: 3 },
    { day: 6, week: 0, count: 2 },
    // добавьте остальные данные для всех 52 недель
    // В вашем примере их 37
];

const getColor = (count) => {
    if (count > 4) return '#03f5fd'; // насыщенный голубой
    if (count > 3) return 'rgba(21,234,243,0.78)'; // средний голубой
    if (count > 2) return 'rgba(21,234,243,0.49)'; // голубой
    if (count > 1) return 'rgba(21,234,243,0.29)'; // светлый голубой
    if (count > 0) return 'rgba(21,234,243,0.1)'; // очень светлый голубой
    return 'rgba(55,59,62,0.1)'; // почти белый
};

const Heatmap = () => {
    return (
        <div className="heatmap">
            <div className="months">
                {months.map((month, i) => (
                    <div key={i} className="month">{month}</div>
                ))}
            </div>
            <div className="days-and-weeks">
                <div className="days">
                    {days.map((day, i) => (
                        <div key={i} className="day">{day}</div>
                    ))}
                </div>
                <div className="weeks">
                    {Array.from({length: 52}).map((_, week) => (
                        <div key={week} className="week">
                            {days.map((_, day) => {
                                const contribution = contributions.find(c => c.week === week && c.day === day);
                                const count = contribution ? contribution.count : 0;
                                return (
                                    <div key={day} className="day" style={{backgroundColor: getColor(count)}}>
                                        &nbsp;
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            <div className="legend-container">
                <div className="legend">
                    <span>Less</span>
                    <div className="legend-colors">
                        <div style={{backgroundColor: 'rgba(55,59,62,0.1)'}}></div>
                        <div style={{backgroundColor: 'rgba(21,234,243,0.1)'}}></div>
                        <div style={{backgroundColor: 'rgba(21,234,243,0.29)'}}></div>
                        <div style={{backgroundColor: 'rgba(21,234,243,0.49)'}}></div>
                        <div style={{backgroundColor: 'rgba(21,234,243,0.78)'}}></div>
                        <div style={{backgroundColor: '#03f5fd'}}></div>
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
};

export default Heatmap;
