"use client";

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import styles from './CodeBlock.module.css';

interface Props {
  language?: string;
  children: string;
}

export default function CodeBlock({ language = 'text', children }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.lang}>{language}</span>
        <button className={styles.copyBtn} onClick={copy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: '0 0 10px 10px',
          background: '#0d0b14',
          fontSize: '0.87rem',
          lineHeight: '1.6',
          padding: '1rem 1.2rem',
        }}
        showLineNumbers={children.split('\n').length > 4}
        lineNumberStyle={{ color: '#4a4060', fontSize: '0.75rem' }}
      >
        {children.trim()}
      </SyntaxHighlighter>
    </div>
  );
}
