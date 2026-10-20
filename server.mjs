import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpeg':'image/jpeg','.jpg':'image/jpeg'};
http.createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const relative=pathname==='/'?'index.html':pathname.slice(1);
    const resolved=path.resolve(root,relative);
    if(!resolved.startsWith(root+path.sep)||relative.split('/').some(p=>p.startsWith('.'))||!types[path.extname(resolved)]){res.writeHead(404);res.end('Not found');return}
    const body=await readFile(resolved);
    res.writeHead(200,{'Content-Type':types[path.extname(resolved)],'Cache-Control':'no-store'});res.end(body);
  }catch{res.writeHead(404);res.end('Not found')}
}).listen(8765,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:8765'));
