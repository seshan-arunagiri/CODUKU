const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Remove the MODE scroll card entirely — replace with conditional (only show when problem is loaded)
const oldScroll = `        <div className={styles.scroll}>
          <span className={styles.scrollLabel}>{hasProblem ? 'Current Challenge' : 'Mode'}</span>
          <span className={styles.scrollTitle}>{hasProblem ? problemContext.title : 'Open Study Hall'}</span>
          <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginTop:'0.3rem' }}>
            <span className={styles.scrollBadge}>{hasProblem ? 'Spell Active' : 'General Practice'}</span>
            {(liveCode ?? urlContext.studentCode) && <span className={styles.scrollBadge}>Code Synced</span>}
            {problemContext.language && <span className={styles.scrollBadge}>{problemContext.language}</span>}
          </div>
        </div>`;

const newScroll = `        {hasProblem && (
          <div className={styles.scroll}>
            <span className={styles.scrollLabel}>Current Challenge</span>
            <span className={styles.scrollTitle}>{problemContext.title}</span>
            <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginTop:'0.3rem' }}>
              <span className={styles.scrollBadge}>Spell Active</span>
              {(liveCode ?? urlContext.studentCode) && <span className={styles.scrollBadge}>Code Synced</span>}
              {problemContext.language && <span className={styles.scrollBadge}>{problemContext.language}</span>}
            </div>
          </div>
        )}`;

if (c.includes(oldScroll)) {
  c = c.replace(oldScroll, newScroll);
  console.log('MODE card made conditional');
} else {
  console.log('MODE card pattern not found');
}

// 2. Remove the headerOrb span
c = c.replace('            <span className={styles.headerOrb} />\n', '');
console.log('headerOrb removed:', !c.includes('headerOrb'));

fs.writeFileSync('src/app/page.tsx', c, 'utf8');
