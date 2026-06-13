const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT_HTTPS = 8443;
const PORT_HTTP = 8080;
const DIR = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function handler(req, res) {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.join(DIR, url === '/' ? 'index.html' : url);
  
  if (!filePath.startsWith(DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404); res.end('Not Found'); return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}

// Get PFX path
const pfxPath = process.env.TEMP + '\\ledger.pfx';
let httpsStarted = false;

if (fs.existsSync(pfxPath)) {
  const options = {
    pfx: fs.readFileSync(pfxPath),
    passphrase: '1234'
  };
  
  https.createServer(options, handler).listen(PORT_HTTPS, '0.0.0.0', () => {
    httpsStarted = true;
    console.log('');
    console.log('========================================');
    console.log('  HTTPS Server running on port ' + PORT_HTTPS);
    console.log('========================================');
  });
} else {
  console.log('No certificate found, HTTP only (PWA install needs HTTPS)');
}

http.createServer(handler).listen(PORT_HTTP, '0.0.0.0', () => {
  console.log('');
  console.log('========================================');
  console.log('  HTTP  Server running on port ' + PORT_HTTP);
  console.log('========================================');
});

// Show local IPs
const ifaces = os.networkInterfaces();
console.log('');
console.log('Your local IPs (phone and PC must be on same WiFi):');
for (const [name, addrs] of Object.entries(ifaces)) {
  for (const addr of addrs) {
    if (addr.family === 'IPv4' && !addr.internal) {
      console.log('  ' + addr.address);
      if (httpsStarted) {
        console.log('    -> https://' + addr.address + ':' + PORT_HTTPS);
      }
      console.log('    -> http://' + addr.address + ':' + PORT_HTTP);
    }
  }
}
console.log('');
