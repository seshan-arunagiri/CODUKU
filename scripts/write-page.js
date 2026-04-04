const fs = require('fs'), path = require('path');

const content = `"use client";

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send, Trash2, Flag, Search, X, Menu, Sun, Moon,
  ClipboardList, Pencil, RotateCcw, Copy, Check,
  Zap, Brain, Map, FlaskConical, ScanSearch, ScrollText, Wand2, User, Bot
} from 'lucide-react';
import TypewriterText from './components/TypewriterText';
import ReactionBar from './components/ReactionBar';
import FollowUps, { parseFollowUps } from './components/FollowUps';
import ChallengeCard, { parseChallenge } from './components/ChallengeCard';
import styles from './page.module.css';

interface ProblemContext {
  title?: string; description?: string; constraints?: string; examples?: string;
  studentCode?: string; language?: string; lastResult?: string; failingTest?: string;
  hintLevel?: number; giveUp?: boolean;
}

export default function Page() {
  return (
    <Suspense fallback={<div className={styles.loading}><Wand2 size={32} className={styles.loadingIcon} /></div>}>
      <ChatApp />
    </Suspense>
  );
}

function ChatApp() {
  const [isMounted, setIsMounted]     = useState(false);
  const [input, setInput]             = useState('');
  const [hintLevel, setHintLevel]     = useState(1);
  const [liveCode, setLiveCode]       = useState<string>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme]             = useState<'dark'|'light'>('dark');
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId]     = useState<string|null>(null);
  const [editText, setEditText]       = useState('');
  const [copiedId, setCopiedId]       = useState<string|null>(null);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editRef     = useRef<HTMLTextAreaElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  const urlContext = useMemo<ProblemContext>(() => ({
    title:       searchParams.get('title')       || undefined,
    description: searchParams.get('description') || undefined,
    constraints: searchParams.get('constraints') || undefined,
    examples:    searchParams.get('examples')    || undefined,
    studentCode: searchParams.get('code')        || undefined,
    language:    searchParams.get('lang')        || undefined,
    lastResult:  searchParams.get('result')      || undefined,
    failingTest: searchParams.get('failTest')    || undefined,
    giveUp:      searchParams.get('giveUp') === 'true' || undefined,
  }), [searchParams]);

  useEffect(() => {
    const h = (e: MessageEvent) => {
      if (e.data?.type === 'CODE_UPDATE' && typeof e.data.code === 'string') setLiveCode(e.data.code);
    };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, []);

  const problemContext = useMemo<ProblemContext>(() => ({
    ...urlContext, studentCode: liveCode ?? urlContext.studentCode, hintLevel,
  }), [urlContext, liveCode, hintLevel]);

  const hasProblem = !!problemContext.title;
  const isGiveUp   = !!problemContext.giveUp;

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!isMounted) return;
    const s = localStorage.getItem('hp_theme') as 'dark'|'light'|null;
    if (s) setTheme(s);
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hp_theme', theme);
  }, [theme, isMounted]);

  useEffect(() => { if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50); }, [searchOpen]);
  useEffect(() => { if (editingId)  setTimeout(() => editRef.current?.focus(),   50); }, [editingId]);

  // Stable transport — only recreates when problem identity changes, not on hintLevel
  const contextRef = useRef(problemContext);
  useEffect(() => { contextRef.current = problemContext; }, [problemContext]);

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: { problemContext: contextRef.current },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [urlContext.title, urlContext.studentCode, urlContext.lastResult, urlContext.language, urlContext.giveUp, liveCode]);

  const { messages, sendMessage, setMessages, status, error, clearError } = useChat({ transport });
  const isLoading  = status === 'submitted' || status === 'streaming';
  const storageKey = \`hp_mentor_\${problemContext.title ?? 'general'}\`;

  useEffect(() => {
    if (!isMounted || messages.length > 0) return;
    try {
      const s = localStorage.getItem(storageKey);
      if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) setMessages(p); }
    } catch { /* ignore */ }
  }, [isMounted, storageKey, setMessages, messages.length]);

  useEffect(() => {
    if (isMounted && messages.length > 0) localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, isMounted, storageKey]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 130) + 'px';
  }, [input]);

  // Before sending, update the transport body with latest context
  const sendWithContext = useCallback((text: string) => {
    contextRef.current = { ...contextRef.current, hintLevel: hintLevel + 1 };
    sendMessage({ text });
  }, [sendMessage, hintLevel]);

  const submit = useCallback(() => {
    if (!input.trim() || isLoading) return;
    if (error) clearError();
    sendWithContext(input);
    setInput('');
    setHintLevel(p => Math.min(p + 1, 4));
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, isLoading, sendWithContext, error, clearError]);

  const react = useCallback((msg: string) => {
    if (error) clearError();
    sendWithContext(msg);
    setHintLevel(p => Math.min(p + 1, 4));
  }, [sendWithContext, error, clearError]);

  const handleGiveUp = useCallback(() => {
    if (!confirm('Reveal the full approach?')) return;
    sendWithContext('__GIVE_UP__');
    setHintLevel(4);
  }, [sendWithContext]);

  const handleSummarize = useCallback(() => { sendWithContext('__SUMMARIZE__'); }, [sendWithContext]);

  const startEdit  = useCallback((id: string, text: string) => { setEditingId(id); setEditText(text); }, []);
  const cancelEdit = useCallback(() => { setEditingId(null); setEditText(''); }, []);

  const confirmEdit = useCallback(() => {
    if (!editText.trim() || !editingId) return;
    const idx = messages.findIndex(m => m.id === editingId);
    if (idx === -1) return;
    setMessages(messages.slice(0, idx));
    sendWithContext(editText.trim());
    setHintLevel(p => Math.min(p + 1, 4));
    setEditingId(null); setEditText('');
  }, [editText, editingId, messages, sendWithContext, setMessages]);

  const retryMessage = useCallback((id: string, text: string) => {
    const idx = messages.findIndex(m => m.id === id);
    if (idx === -1) return;
    setMessages(messages.slice(0, idx));
    sendWithContext(text);
    setHintLevel(p => Math.min(p + 1, 4));
  }, [messages, sendWithContext, setMessages]);

  const copyMessage = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const clearHistory = () => {
    if (confirm('Clear all chat history?')) {
      setMessages([]); setHintLevel(1); localStorage.removeItem(storageKey);
    }
  };

  const getRawText   = (m: any) => m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') ?? m.content ?? '';
  const getCleanText = (m: any) => parseChallenge(parseFollowUps(getRawText(m)).clean).clean;

  const matchingIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    return new Set(messages.filter(m => getCleanText(m).toLowerCase().includes(q)).map(m => m.id));
  }, [searchQuery, messages]);

  const suggestions = hasProblem
    ? [\`How should I think about "\${problemContext.title}"?\`, 'What algorithm pattern fits?', 'Walk me through the approach', 'What edge cases matter?']
    : ['What is two pointer technique?', 'Explain binary search with example', 'When to use dynamic programming?', 'How does sliding window work?'];

  const resultColor: Record<string,string> = { WA:'#e05c5c', TLE:'#f59e0b', RE:'#a78bfa', MLE:'#f97316', AC:'#4ade80' };
  const result = problemContext.lastResult?.toUpperCase();

  if (!isMounted) return null;
  const botMessages = messages.filter(x => x.role === 'assistant');

  return (
    <div className={styles.shell}>
      {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      <aside className={\`\${styles.sidebar} \${sidebarOpen ? styles.open : ''}\`}>
        <div className={styles.crest}>
          <Zap size={28} className={styles.crestIcon} />
          <div className={styles.crestTitle}>Mentor House</div>
          <div className={styles.crestSub}>"Draco Dormiens Nunquam Titillandus"</div>
        </div>

        <div className={styles.scroll}>
          <span className={styles.scrollLabel}>{hasProblem ? 'Current Challenge' : 'Mode'}</span>
          <span className={styles.scrollTitle}>{hasProblem ? problemContext.title : 'Open Study Hall'}</span>
          <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginTop:'0.3rem' }}>
            <span className={styles.scrollBadge}>{hasProblem ? 'Spell Active' : 'General Practice'}</span>
            {(liveCode ?? urlContext.studentCode) && <span className={styles.scrollBadge}>Code Synced</span>}
            {problemContext.language && <span className={styles.scrollBadge}>{problemContext.language}</span>}
          </div>
        </div>

        {result && result !== 'AC' && (
          <div className={styles.resultCard} style={{ borderColor: resultColor[result] ?? '#555' }}>
            <span className={styles.resultLabel}>Last Submission</span>
            <span className={styles.resultBadge} style={{ color: resultColor[result] ?? '#aaa' }}>
              {result === 'WA' && 'Wrong Answer'}{result === 'TLE' && 'Time Limit Exceeded'}
              {result === 'RE' && 'Runtime Error'}{result === 'MLE' && 'Memory Limit Exceeded'}
            </span>
            {problemContext.failingTest && <span className={styles.resultTest}>Failing: <code>{problemContext.failingTest}</code></span>}
          </div>
        )}
        {result === 'AC' && (
          <div className={styles.resultCard} style={{ borderColor:'#4ade80' }}>
            <span className={styles.resultBadge} style={{ color:'#4ade80' }}>Accepted!</span>
          </div>
        )}

        {hasProblem && (
          <div className={styles.hintTracker}>
            <span className={styles.scrollLabel}>Hint Level</span>
            <div className={styles.hintDots}>
              {[1,2,3,4].map(l => (
                <div key={l} className={styles.hintDot}
                  style={{ background: hintLevel >= l ? 'var(--gold)' : 'var(--border)' }}
                  title={['Nudge','Pattern','Approach','Full'][l-1]} />
              ))}
            </div>
            <span className={styles.hintLabel}>{['Nudge','Pattern Hint','Approach Hint','Full Breakdown'][Math.min(hintLevel,4)-1]}</span>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
          <span className={styles.spellsTitle}>The Mentor's Oath</span>
          {[
            { icon: <Brain size={12}/>,       t: 'Reveals the thinking path, not the answer' },
            { icon: <Map size={12}/>,          t: 'Maps the algorithm pattern for you' },
            { icon: <FlaskConical size={12}/>, t: 'Breaks down logic step by step' },
            { icon: <ScanSearch size={12}/>,   t: 'Spots edge cases you might miss' },
            { icon: <ScrollText size={12}/>,   t: 'Guides complexity analysis' },
          ].map(({ icon, t }) => (
            <div key={t} className={styles.spell}>
              <span className={styles.spellGlyph}>{icon}</span>
              <span>{t}</span>
            </div>
          ))}
        </div>

        <div className={styles.sidebarBottom}>
          {messages.length >= 8 && (
            <button onClick={handleSummarize} className={styles.summaryBtn} disabled={isLoading}>
              <ClipboardList size={13} /> Summarize Session
            </button>
          )}
          {hasProblem && messages.length >= 4 && !isGiveUp && (
            <button onClick={handleGiveUp} className={styles.giveUpBtn}>
              <Flag size={13} /> I give up
            </button>
          )}
          {messages.length > 0 && (
            <button onClick={clearHistory} className={styles.clearBtn}>
              <Trash2 size={13} /> Clear Chat
            </button>
          )}
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.menuBtn} onClick={() => setSidebarOpen(o => !o)}><Menu size={16}/></button>
            <span className={styles.headerOrb} />
            <span className={styles.headerText}>
              {hasProblem ? <>Assigned: <span className={styles.headerProblem}>{problemContext.title}</span></> : 'Defence Against Dark Algorithms'}
            </span>
          </div>
          <div className={styles.headerActions}>
            <button className={\`\${styles.searchBtn} \${searchOpen ? styles.active : ''}\`}
              onClick={() => { setSearchOpen(o => !o); setSearchQuery(''); }} title="Search">
              <Search size={14}/>
            </button>
            <button className={styles.themeBtn} onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Toggle theme">
              {theme === 'dark' ? <Sun size={14}/> : <Moon size={14}/>}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className={styles.searchBar}>
            <Search size={14} style={{ color:'var(--text-muted)', flexShrink:0 }}/>
            <input ref={searchRef} className={styles.searchInput} placeholder="Search messages..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)} />
            {searchQuery && <span className={styles.searchCount}>{matchingIds.size} result{matchingIds.size !== 1 ? 's' : ''}</span>}
            <button className={styles.searchClose} onClick={() => { setSearchOpen(false); setSearchQuery(''); }}><X size={14}/></button>
          </div>
        )}

        <div className={styles.messages}>
          {messages.length === 0 ? (
            <div className={styles.empty}>
              <Wand2 size={44} className={styles.emptyIcon}/>
              <h2 className={styles.emptyTitle}>{hasProblem ? \`Let us unravel "\${problemContext.title}"\` : 'What shall we study today?'}</h2>
              <p className={styles.emptyQuote}>
                {hasProblem
                  ? \`"It is our choices that show what we truly are." I won't hand you the answer — I'll show you how to think your way to it.\`
                  : \`"It does not do to dwell on answers and forget to think." Ask me anything — I'll guide your reasoning, not replace it.\`}
              </p>
              <div className={styles.spellCards}>
                {suggestions.map(q => (
                  <button key={q} className={styles.spellCard} onClick={() => { sendWithContext(q); setHintLevel(2); }}>{q}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m) => {
                const rawText = getRawText(m);
                const isUser  = m.role === 'user';
                if (isUser && (rawText === '__GIVE_UP__' || rawText === '__SUMMARIZE__')) return null;
                const isLastBot   = !isUser && m.id === botMessages[botMessages.length-1]?.id && !isLoading;
                const isStreaming = isLastBot && isLoading;
                const isMatch     = !!(searchQuery.trim() && matchingIds.has(m.id));
                const isEditing   = editingId === m.id;
                return (
                  <div key={m.id} className={\`\${styles.row} \${isUser ? styles.rowUser : ''} \${isMatch ? styles.rowHighlight : ''}\`}>
                    <div className={\`\${styles.avatar} \${isUser ? styles.avatarUser : styles.avatarBot}\`}>
                      {isUser ? <User size={14}/> : <Bot size={14}/>}
                    </div>
                    <div className={\`\${styles.bubble} \${isUser ? styles.bubbleUser : styles.bubbleBot}\`}>
                      <div className={styles.bubbleName}>{isUser ? 'Student' : 'Mentor'}</div>
                      {isUser && isEditing ? (
                        <div className={styles.editWrap}>
                          <textarea ref={editRef} className={styles.editField} value={editText} rows={3}
                            onChange={e => setEditText(e.target.value)}
                            onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();confirmEdit();}if(e.key==='Escape')cancelEdit(); }} />
                          <div className={styles.editActions}>
                            <button className={styles.editSaveBtn} onClick={confirmEdit} disabled={!editText.trim()}>Send</button>
                            <button className={styles.editCancelBtn} onClick={cancelEdit}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="prose">
                            {isUser ? <p>{rawText}</p> : <TypewriterText text={rawText} isStreaming={isStreaming}/>}
                          </div>
                          <div className={\`\${styles.msgActions} \${isUser ? styles.msgActionsUser : styles.msgActionsBot}\`}>
                            <button className={styles.msgActionBtn} title="Copy"
                              onClick={() => copyMessage(m.id, isUser ? rawText : getCleanText(m))}>
                              {copiedId === m.id ? <Check size={12}/> : <Copy size={12}/>}
                            </button>
                            {isUser && !isLoading && (
                              <button className={styles.msgActionBtn} title="Edit" onClick={() => startEdit(m.id, rawText)}>
                                <Pencil size={12}/>
                              </button>
                            )}
                            {isUser && !isLoading && (
                              <button className={styles.msgActionBtn} title="Retry" onClick={() => retryMessage(m.id, rawText)}>
                                <RotateCcw size={12}/>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                      {!isUser && !isEditing && (
                        <>
                          <ChallengeCard text={rawText}/>
                          <ReactionBar isLast={isLastBot} onReact={react}/>
                          <FollowUps text={rawText} onAsk={react} isLast={isLastBot}/>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className={styles.row}>
                  <div className={\`\${styles.avatar} \${styles.avatarBot}\`}><Bot size={14}/></div>
                  <div className={\`\${styles.bubble} \${styles.bubbleBot}\`}>
                    <div className={styles.bubbleName}>Mentor</div>
                    <div className={styles.typing}><span/><span/><span/></div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef}/>
        </div>

        <div className={styles.inputBar}>
          <div className={styles.inputWrap}>
            <textarea ref={textareaRef} className={styles.inputField} value={input} rows={1}
              placeholder={hasProblem ? \`Ask about "\${problemContext.title}"...\` : 'Ask your question here...'}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit();} }}
              disabled={isLoading}/>
            <button className={styles.sendBtn} onClick={submit} disabled={!input.trim()||isLoading}>
              <Send size={15}/>
            </button>
          </div>
          <p className={styles.inputHint}>Enter to send &middot; Shift+Enter for new line</p>
        </div>
      </main>
    </div>
  );
}
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'app', 'page.tsx'), content, 'utf8');
console.log('Written:', fs.statSync(path.join(__dirname, '..', 'src', 'app', 'page.tsx')).size, 'bytes');
