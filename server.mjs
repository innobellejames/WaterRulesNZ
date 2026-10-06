import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {handlePageViews} from './page-view-service.mjs';
import {handleRainfall} from './rainfall-service.mjs';
import {handleRegionalRainfall} from './regional-rainfall-service.mjs';
import {handleIssue} from './issue-service.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT||8080),host=process.env.HOST||'127.0.0.1';
const prefix=(process.env.BASE_PATH||'').replace(/\/$/,'');
if(prefix&&!/^\/[a-zA-Z0-9_\/-]+$/.test(prefix))throw Error('Invalid BASE_PATH');
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Choose a PORT between 1 and 65535.');
const allowed=(process.env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.pdf':'application/pdf','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','.gif':'image/gif','.json':'application/json'};
createServer(async(req,res)=>{
 let path='';
 const json=(body,status)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
 async function respond(response){res.writeHead(response.status,Object.fromEntries(response.headers));res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));}
 try{
  const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
  if(prefix&&url.pathname===prefix){res.writeHead(308,{Location:prefix+'/'});res.end();return;}
  if(prefix&&!url.pathname.startsWith(prefix+'/')){json({error:'Not found'},404);return;}
  path=decodeURIComponent(url.pathname.slice(prefix.length));
  const isApi=path.startsWith('/api/');const origin=req.headers.origin;
  // External static frontends must be explicitly allowed. Do not trust proxy headers unless TRUST_PROXY=1.
  const forwarded=process.env.TRUST_PROXY==='1';
  const publicOrigin=process.env.PUBLIC_ORIGIN||`${forwarded&&req.headers['x-forwarded-proto']==='https'?'https':'http'}://${req.headers.host}`;
  if(isApi){
   if(origin&&origin!==publicOrigin&&!allowed.includes(origin)){json({error:'Submit requests from this website.'},403);return;}
   if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
   res.setHeader('Access-Control-Allow-Methods','GET, HEAD, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Accept, Content-Type');res.setHeader('X-Content-Type-Options','nosniff');
   if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
   if(path==='/api/issues'){
    if(req.method!=='POST'){json({error:'Method not allowed'},405);return;}
    let text='',size=0;for await(const chunk of req){size+=chunk.length;if(size>16000){json({error:'This report is too long.'},413);return;}text+=chunk.toString();}
    const ip=forwarded?String(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',')[0]:req.socket.remoteAddress;
    const visitor=createHash('sha256').update(String(ip)).digest('hex');
    await respond(await handleIssue(new Request(url,{method:'POST',headers:{'Content-Type':String(req.headers['content-type']||'')},body:text}),visitor));return;
   }
   if(path==='/api/page-views'){await respond(await handlePageViews(req.method));return;}
   if(!['GET','HEAD'].includes(req.method)){json({error:'Method not allowed'},405);return;}
   if(path==='/api/health'){json({ok:true,services:['rainfall','regional-rainfall','page-views','issues']},200);return;}
   if(path==='/api/rainfall'||path==='/api/regional-rainfall'){await respond(await (path==='/api/rainfall'?handleRainfall:handleRegionalRainfall)(new Request(url)));return;}
   json({error:'Unknown data service.'},404);return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  if(path==='/')path='/index.html';
  // Only public files are served. Server code, mail settings and stored reports stay private.
  if(!['/index.html','/styles.css','/script.js','/favicon.svg','/ads.txt'].includes(path)&&!/^\/(downloads|images|assets)\//.test(path)){res.writeHead(404);res.end('Not found');return;}
  const filename=resolve(root,'.'+path);if(!filename.startsWith(resolve(root)+sep)){res.writeHead(403);res.end('Forbidden');return;}
  const data=await readFile(filename);res.writeHead(200,{'Content-Type':types[extname(filename)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data);
 }catch{if(path.startsWith('/api/'))json({error:'The requested data service is unavailable. Please try again.'},500);else{res.writeHead(404);res.end('Not found');}}
}).listen(port,host,()=>console.log(`WaterRules NZ ready: http://${host}:${port}${prefix}/`));
