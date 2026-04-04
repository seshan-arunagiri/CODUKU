const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');

c = c.replace(
  "  const [editingId, setEditingId]     = useState(null);",
  "  const [editingId, setEditingId]     = useState<string | null>(null);"
);
c = c.replace(
  "  const [copiedId, setCopiedId]       = useState(null);",
  "  const [copiedId, setCopiedId]       = useState<string | null>(null);"
);

fs.writeFileSync('src/app/page.tsx', c, 'utf8');
console.log('Fixed types');
