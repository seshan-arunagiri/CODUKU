const http = require('http');

const body = JSON.stringify({
  messages: [{ role: 'user', parts: [{ type: 'text', text: 'explain dynamic programming in detail with examples' }], id: '1' }],
  problemContext: {}
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/chat',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
};

let fullResponse = '';
const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', chunk => { fullResponse += chunk.toString(); });
  res.on('end', () => {
    console.log('Total bytes:', fullResponse.length);
    // Extract text from stream
    const textParts = [];
    const lines = fullResponse.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'text-delta') textParts.push(data.delta);
        } catch {}
      }
    }
    const text = textParts.join('');
    console.log('Response text length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));
    console.log('Last 200 chars:', text.substring(Math.max(0, text.length - 200)));
    console.log('Ends mid-sentence:', !text.trim().endsWith('.') && !text.trim().endsWith('?') && !text.trim().endsWith('!'));
  });
});

req.on('error', e => console.error('Error:', e.message));
req.setTimeout(30000, () => { console.log('Timeout'); req.destroy(); });
req.write(body);
req.end();
