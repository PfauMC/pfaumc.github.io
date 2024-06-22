import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

const BanHistory = ({ history }) => {

    // Inline styles for row, col, and card
    const rowStyle = {
        height: '50px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // 15% black background
        marginBottom: '10px', // Optional: Add some margin between rows
        borderRadius: '5px', // Optional: Add rounded corners
    };

    const colStyle = {
        height: '50px',

    };

    const cardStyle = {
        height: '100%',

    };

    return (
        <div className="mt-4">
            <h5>История банов/мутов</h5>
            {history.length > 0 ? (
                history.map((entry, index) => (
                    <Row key={index} className="mb-2" style={Object.assign({}, rowStyle)}>
                        <Col xs={2} style={colStyle}><strong>{entry.type}</strong></Col>
                        <Col xs={6} style={colStyle}><strong>{entry.reason}</strong></Col>
                        <Col xs={4} style={colStyle}><strong>{entry.date}</strong></Col>
                    </Row>
                ))
            ) : (
                <p>Нет записей о банах/мутах.</p>
            )}
        </div>
    );
};

export default BanHistory;
