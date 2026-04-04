"use client";

import { useState } from 'react';
import styles from './ChallengeCard.module.css';

interface Props {
  text: string; // raw message text containing [[CHALLENGE:...]]
}

export function parseChallenge(text: string): {
  clean: string;
  challenge: { problem: string; hint: string; answer: string } | null;
} {
  const match = text.match(/\[\[CHALLENGE:(.*?)\]\]/);
  if (!match) return { clean: text, challenge: null };
  const parts = match[1].split('|').map(s => s.trim());
  const clean = text.replace(/\[\[CHALLENGE:.*?\]\]/, '').trimEnd();
  if (parts.length < 3) return { clean, challenge: null };
  return {
    clean,
    challenge: { problem: parts[0], hint: parts[1], answer: parts[2] },
  };
}

export default function ChallengeCard({ text }: Props) {
  const { challenge } = parseChallenge(text);
  const [showHint, setShowHint]     = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [solved, setSolved]         = useState(false);

  if (!challenge) return null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon}>⚗️</span>
        <span className={styles.title}>Try It Yourself</span>
        {solved && <span className={styles.solvedBadge}>✓ Solved!</span>}
      </div>

      <p className={styles.problem}>{challenge.problem}</p>

      <div className={styles.actions}>
        {!showHint && !solved && (
          <button className={styles.hintBtn} onClick={() => setShowHint(true)}>
            💡 Show hint
          </button>
        )}
        {showHint && (
          <p className={styles.hint}>💡 {challenge.hint}</p>
        )}
        {!showAnswer && (
          <button
            className={styles.answerBtn}
            onClick={() => { setShowAnswer(true); setSolved(true); }}
          >
            🔍 Reveal answer
          </button>
        )}
        {showAnswer && (
          <p className={styles.answer}>Answer: <code>{challenge.answer}</code></p>
        )}
      </div>
    </div>
  );
}
