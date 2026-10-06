import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
// One server process owns this file. Use a persistent volume in production.
const folder=resolve(process.env.VIEWS_DATA_DIR||fileURLToPath(new URL('./data/',import.meta.url)));
const file=resolve(folder,'page-views.json');
let queue=Promise.resolve();
async function update(increment,viewId){
 let count={views:0,startedAt:null,recentIds:[]};
 try{count=JSON.parse(await readFile(file,'utf8'));}
 catch(error){if(error.code!=='ENOENT')throw error;}
 if(!Number.isSafeInteger(count.views)||count.views<0)throw new Error('Invalid stored counter');
 if(increment&&(!viewId||!count.recentIds?.includes(viewId))){
  if(count.views>=Number.MAX_SAFE_INTEGER)throw new Error('Counter limit reached');
  count={views:count.views+1,startedAt:count.startedAt||new Date().toISOString(),recentIds:[...(count.recentIds||[]),...(viewId?[viewId]:[])].slice(-50000)};
  await mkdir(folder,{recursive:true});
  await writeFile(file+'.tmp',JSON.stringify(count)+'\n',{mode:0o600});
  await rename(file+'.tmp',file);
 }
 return {views:count.views,startedAt:count.startedAt,metric:'page loads'};
}
export async function handlePageViews(method,viewId){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
 if(!['GET','HEAD','POST'].includes(method))return Response.json({error:'Method not allowed'},{status:405,headers:{...headers,Allow:'GET, HEAD, POST'}});
 const operation=queue.then(()=>update(method==='POST',viewId&&/^[a-zA-Z0-9-]{16,80}$/.test(viewId)?viewId:undefined));
 queue=operation.catch(()=>{});
 try{return Response.json(await operation,{headers});}
 catch(error){console.error('Page-view counter unavailable',error);return Response.json({error:'Page views are currently unavailable.'},{status:503,headers});}
}
