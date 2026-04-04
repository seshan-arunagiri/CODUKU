"use client";

import styles from './FollowUps.module.css';

interface Props {
  text: string;
  onAsk: (q: string) => void;
  isLast: boolean;
}

// Parses [[FOLLOWUP: q1 | q2 | q3]] from bot message
export function parseFollowUps(text: string): { clean: string; questions: string[] } {
  const match = text.match(/\[\[FOLLOWUP:(.*?)\]\]/);
  if (!match) return { clean: text, questions: [] };
  const questions = match[1].split('|').map(q => q.trim()).filter(Boolean);
  const clean = text.replace(/\[\[FOLLOWUP:.*?\]\]/, '').trimEnd();
  return { clean, questions };
}

export default function FollowUps({ text, onAsk, isLast }: Props) {
  if (!isLast) return null;
  const { questions } = parseFollowUps(text);
  if (!questions.length) return null;

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>✨ Ask next</span>
      <div className={styles.chips}>
        {questions.map(q => (
          <button key={q} className={styles.chip} onClick={() => onAsk(q)}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
