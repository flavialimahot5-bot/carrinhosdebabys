import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const captureEnabled=process.argv.includes('--capture');
const port=Number(process.argv.find(a=>a.startsWith('--port='))?.split('=')[1]||5173);
http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(captureEnabled && pathname==='/capture' && req.method==='POST'){
    let body='';for await(const chunk of req)body+=chunk;
    const variant=new URL(req.url,'http://localhost').searchParams.get('variant');
    const filename=variant&&/^[0-6]$/.test(variant)?`source-${variant}.json`:'source.json';
    fs.writeFileSync(path.join(root,filename),new URLSearchParams(body).get('content'));
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<h1>Referência salva</h1>');return;
  }
  if(captureEnabled && pathname==='/capture'){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<form method="POST"><label>Conteúdo da referência<textarea wrap="off" style="width:300px;height:40px" name="content" aria-label="Conteúdo da referência"></textarea></label><button>Salvar referência</button></form>');return;
  }
  if(!/^\/(?:index\.html|variant-[1-6]\.html|app\.js|responsive\.js|local\.css|assets\/[a-f0-9]+\.[a-z0-9]+)?$/.test(pathname)){res.writeHead(307,{'Location':'/','Cache-Control':'no-store'});res.end();return;}
  const file=path.resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(307,{'Location':'/','Cache-Control':'no-store'});res.end();return;}
  const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.jpg':'image/jpeg','.png':'image/png'};
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log(`Preview: http://localhost:${port}`));
