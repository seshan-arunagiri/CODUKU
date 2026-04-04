"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';
import { parseFollowUps } from './FollowUps';
import { parseChallenge } from './ChallengeCard';

interface Props {
  text: string;
  isStreaming: boolean;
}

export default function TypewriterText({ text }: Props) {
  const clean = parseChallenge(parseFollowUps(text).clean).clean;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Use div instead of p to avoid invalid nesting with code blocks
        p({ children }) {
          return <div style={{ marginBottom: '0.9em' }}>{children}</div>;
        },
        // Table styling
        table({ children }) {
          return (
            <div style={{ overflowX: 'auto', marginBottom: '1em' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'var(--font-serif)',
                fontSize: '0.9rem',
              }}>
                {children}
              </table>
            </div>
          );
        },
        thead({ children }) {
          return <thead style={{ background: 'rgba(201,168,76,0.1)' }}>{children}</thead>;
        },
        th({ children }) {
          return (
            <th style={{
              padding: '0.5rem 0.85rem',
              borderBottom: '2px solid var(--gold)',
              color: 'var(--gold-light)',
              fontFamily: 'var(--font-display)',
              fontSize: '0.78rem',
              letterSpacing: '0.5px',
              textAlign: 'left',
              whiteSpace: 'nowrap',
            }}>
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td style={{
              padding: '0.45rem 0.85rem',
              borderBottom: '1px solid var(--border)',
              color: 'var(--text)',
              verticalAlign: 'top',
            }}>
              {children}
            </td>
          );
        },
        tr({ children }) {
          return (
            <tr style={{ transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {children}
            </tr>
          );
        },
        code({ className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match && !String(children).includes('\n');
          if (!isInline) {
            return (
              <CodeBlock language={match?.[1] ?? 'text'}>
                {String(children)}
              </CodeBlock>
            );
          }
          return (
            <code style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.83em',
              background: 'rgba(124,77,189,0.18)',
              border: '1px solid var(--border)',
              padding: '0.15em 0.45em',
              borderRadius: '4px',
              color: 'var(--purple-light)',
            }} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {clean}
    </ReactMarkdown>
  );
}
