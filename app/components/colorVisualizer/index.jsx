import React, { useEffect, useState } from 'react';
import styles from './colorVisualizer.module.css';

// Helper to repeat or sample colors to exactly n items
function getFixedLengthColors(colors, n = 10) {
    if (!colors || colors.length === 0) return Array(n).fill('oklch(0 0 0)');
    const arr = [];
    for (let i = 0; i < n; i++) {
        arr.push(colors[i % colors.length]);
    }
    return arr;
}

// Fisher-Yates shuffle
function fisherYatesShuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export default function ColorVisualizer({ colors }) {
    const [animatedColors, setAnimatedColors] = useState(colors || []);

    useEffect(() => {
        setAnimatedColors(colors || []);
    }, [colors]);

    useEffect(() => {
        let isMounted = true;
        const interval = setInterval(() => {
            if (!colors || colors.length === 0) return;
            const shuffled = fisherYatesShuffle(colors);
            if (isMounted) setAnimatedColors(shuffled);
        }, 5000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [colors]);

    return (
        <>
            <div className={`${styles.visualizerContainer} ${styles.left}`}>
                {getFixedLengthColors(animatedColors, 10).map((color, i) => (
                    <div
                        key={i}
                        className={styles.visualizerBar}
                        style={{
                            background: color,
                            boxShadow: `${color} 0 0 50px`,
                            width: `50px`,
                            height: `calc(100dvh / 10)`,
                            minWidth: '8px',
                            maxWidth: '100%',
                            transition: 'all 5s linear'
                        }}
                    />
                ))}
            </div>
            <div className={`${styles.visualizerContainer} ${styles.right}`}>
                {getFixedLengthColors(animatedColors, 10).map((color, i) => (
                    <div
                        key={i}
                        className={styles.visualizerBar}
                        style={{
                            background: color,
                            boxShadow: `${color} 0 0 50px`,
                            width: `50px`,
                            height: `calc(100dvh / 10)`,
                            minWidth: '8px',
                            maxWidth: '100%',
                            transition: 'all 5s linear'
                        }}
                    />
                ))}
            </div>
        </>
    );
}
