import React from 'react';
import styles from './ArrowDownButton.module.scss';

const ArrowDownButton = () => {
    const scrollDown = () => {
        window.scrollTo({
            top: window.scrollY + 1100,
            behavior: 'smooth'
        });
    };

    return (
        <button className={styles.arrowButton} onClick={scrollDown}>
            <img
                className={styles.arrowIcon}
                src="https://img.icons8.com/ios/50/000000/chevron-down.png"
                alt="chevron-down"
                width="50"
                height="50"
            
            />
        </button>
    );
};

export default ArrowDownButton;