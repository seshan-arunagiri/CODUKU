"use client";

import styles from './HpSidePanel.module.css';

export default function HpSidePanel() {
  return (
    <div className={styles.panel}>

      {/* Animated background gradient */}
      <div className={styles.bg} />

      {/* Floating candles */}
      {[0,1,2,3].map(i => (
        <div key={i} className={`${styles.candle} ${styles[`candle${i}`]}`}>
          <div className={styles.candleFlame} />
          <div className={styles.candleBody} />
        </div>
      ))}

      {/* Floating stars */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <div key={i} className={`${styles.star} ${styles[`star${i}`]}`}>✦</div>
      ))}

      {/* Hogwarts crest SVG */}
      <div className={styles.crestWrap}>
        <svg viewBox="0 0 120 140" className={styles.crestSvg} xmlns="http://www.w3.org/2000/svg">
          {/* Shield outline */}
          <path d="M60 8 L108 30 L108 85 Q108 120 60 135 Q12 120 12 85 L12 30 Z"
            fill="none" stroke="url(#goldGrad)" strokeWidth="2.5" className={styles.shieldPath}/>
          {/* Dividing lines */}
          <line x1="60" y1="8" x2="60" y2="135" stroke="url(#goldGrad)" strokeWidth="1.5" opacity="0.6"/>
          <line x1="12" y1="72" x2="108" y2="72" stroke="url(#goldGrad)" strokeWidth="1.5" opacity="0.6"/>
          {/* Top-left: Lion */}
          <text x="36" y="55" textAnchor="middle" fontSize="22" className={styles.crestEmoji}>🦁</text>
          {/* Top-right: Eagle */}
          <text x="84" y="55" textAnchor="middle" fontSize="22" className={styles.crestEmoji}>🦅</text>
          {/* Bottom-left: Badger */}
          <text x="36" y="105" textAnchor="middle" fontSize="22" className={styles.crestEmoji}>🦡</text>
          {/* Bottom-right: Snake */}
          <text x="84" y="105" textAnchor="middle" fontSize="22" className={styles.crestEmoji}>🐍</text>
          {/* H letter */}
          <text x="60" y="68" textAnchor="middle" fontSize="14" fontFamily="Cinzel,serif"
            fill="url(#goldGrad)" className={styles.hLetter}>H</text>
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c9a84c"/>
              <stop offset="50%" stopColor="#f0d080"/>
              <stop offset="100%" stopColor="#c9a84c"/>
            </linearGradient>
          </defs>
        </svg>
        <div className={styles.crestGlow} />
      </div>

      {/* Wand */}
      <div className={styles.wandWrap}>
        <svg viewBox="0 0 20 120" className={styles.wandSvg} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B6914"/>
              <stop offset="40%" stopColor="#c9a84c"/>
              <stop offset="100%" stopColor="#5a3a0a"/>
            </linearGradient>
          </defs>
          <ellipse cx="10" cy="10" rx="6" ry="6" fill="url(#wandGrad)" className={styles.wandTip}/>
          <rect x="8" y="14" width="4" height="100" rx="2" fill="url(#wandGrad)"/>
        </svg>
        <div className={styles.wandSparkles}>
          {[0,1,2,3,4].map(i => (
            <div key={i} className={`${styles.sparkle} ${styles[`sparkle${i}`]}`}>✦</div>
          ))}
        </div>
      </div>

      {/* Floating books */}
      <div className={styles.book1}>📖</div>
      <div className={styles.book2}>📚</div>

      {/* Owl */}
      <div className={styles.owl}>🦉</div>

      {/* Bottom text */}
      <div className={styles.motto}>
        <span>Wit beyond measure</span>
        <span>is man's greatest treasure</span>
      </div>

    </div>
  );
}
