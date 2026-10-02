import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {handlePageViews} from './page-view-service.mjs';
import {handleRainfall} from './rainfall-service.mjs';
import {handleRegionalRainfall} from './regional-rainfall-service.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT||8080),host=process.env.HOST||'127.0.0.1';
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Choose a PORT between 1 and 65535.');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.pdf':'application/pdf','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','.gif':'image/gif','.json':'application/json'};
createServer(async(req,res)=>{
 try{
  const isApi=(req.url||'').split('?')[0].startsWith('/api/');
  if(isApi){res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET, HEAD, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Accept');res.setHeader('X-Content-Type-Options','nosniff');}
  if(req.method==='OPTIONS'&&isApi){res.writeHead(204);res.end();return;}
  const url=new URL(req.url||'/','http://localhost');
  if(url.pathname==='/api/page-views'){const response=await handlePageViews(req.method);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));return;}
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  if(url.pathname==='/api/rainfall'||url.pathname==='/api/regional-rainfall'){
   const handler=url.pathname==='/api/rainfall'?handleRainfall:handleRegionalRainfall;
   const response=await handler(new Request(url));res.writeHead(response.status,Object.fromEntries(response.headers));res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));return;
  }
  const pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
  if(!['/index.html','/styles.css','/script.js','/favicon.svg'].includes(pathname)&&!/^\/(downloads|images|assets)\//.test(pathname)){res.writeHead(404);res.end('Not found');return;}
  const filename=resolve(root,'.'+pathname);
  if(!filename.startsWith(resolve(root)+sep)){res.writeHead(403);res.end('Forbidden');return;}
  const data=await readFile(filename);res.writeHead(200,{'Content-Type':types[extname(filename)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 }catch{if((req.url||'').startsWith('/api/')){res.writeHead(500,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'The requested data service is unavailable. Please try again.'}));}else{res.writeHead(404);res.end('Not found');}}
}).listen(port,host,()=>console.log(`WaterRules NZ ready: http://${host}:${port}`));
