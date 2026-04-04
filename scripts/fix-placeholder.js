const fs = require('fs');
let lines = fs.readFileSync('src/app/page.tsx', 'utf8').split('\n');

// Find the line with headerText and the surrounding structure
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('headerText') && lines[i].includes('hasProblem')) {
    // Replace the whole line with just the problem title version
    lines[i] = "            {hasProblem && (<span className={styles.headerText}>Assigned: <span className={styles.headerProblem}>{problemContext.title}</span></span>)}";
    console.log('Fixed line', i+1);
    break;
  }
}

fs.writeFileSync('src/app/page.tsx', lines.join('\n'), 'utf8');
console.log('Done');
