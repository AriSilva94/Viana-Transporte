const http = require('http');
const fs = require('fs');
const path = require('path');
const base = process.argv[2];
const port = Number(process.argv[3] || 52341);
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  const clean = decodeURIComponent((req.url||'/').split('?')[0]);
  const rel = clean === '/' ? '/auth-direcoes.html' : clean;
  const file = path.join(base, rel.replace(/^\/+/, ''));
  if (!file.startsWith(base)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(file, (err, data)=>{
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream'});
    res.end(data);
  });
}).listen(port, '127.0.0.1');
