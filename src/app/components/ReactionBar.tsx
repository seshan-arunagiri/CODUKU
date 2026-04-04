"use client";

import styles from './ReactionBar.module.css';

interface Props {
  onReact: (msg: string) => void;
  isLast: boolean;
}

const REACTIONS = [
  { emoji: '👍', label: 'Got it',              msg: 'Got it, thanks! That makes sense.' },
  { emoji: '🔁', label: 'Explain differently', msg: 'Can you explain that differently? Maybe with a different analogy or example.' },
  { emoji: '💡', label: 'Another example',     msg: 'Can you give me another simple example of this pattern?' },
  { emoji: '🐢', label: 'Too fast',            msg: 'That was a bit fast — can you slow down and break it into smaller steps?' },
];

export default function ReactionBar({ onReact, isLast }: Props) {
  if (!isLast) return null;
  return (
    <div className={styles.bar}>
      {REACTIONS.map(({ emoji, label, msg }) => (
        <button
          key={label}
          className={styles.btn}
          onClick={() => onReact(msg)}
          title={label}
        >
          <span>{emoji}</span>
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </div>
  );
}
