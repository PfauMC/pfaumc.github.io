import React from 'react';
import {Col, Row} from 'react-bootstrap';
import './Activ.scss';

const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const timesOfDay = ['Утро', 'День', 'Полдень', 'Вечер', 'Ночь'];

const getColor = (value) => {
    const greenIntensity = Math.min(255, value * 51);
    return `rgb(0, ${greenIntensity}, 0)`;
};

const ActivityWidget = ({data}) => {
    return (
        <Row className="mt-4">
            <Col>
                <h5>Активность за последнюю неделю</h5>
                <div className="activity-grid-container">
                    <div className="activity-grid">
                        <div className="grid-empty"></div>
                        {daysOfWeek.map((day, dayIndex) => (
                            <div key={dayIndex} className="grid-label day-label">
                                {day}
                            </div>
                        ))}
                        {timesOfDay.map((time, timeIndex) => (
                            <React.Fragment key={timeIndex}>
                                <div className="grid-label time-label">{time}</div>
                                {data.map((day, dayIndex) => (
                                    <div
                                        key={`${dayIndex}-${timeIndex}`}
                                        className="grid-item"
                                        style={{backgroundColor: getColor(day[timeIndex])}}
                                        title={`${day[timeIndex]} часов`}
                                    ></div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </Col>
        </Row>
    );
};

export default ActivityWidget;
