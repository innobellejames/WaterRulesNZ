import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseIssue,deliverIssue} from './issue-delivery.mjs';
// Keep this directory on a persistent, private volume; it is never served.
const folder=resolve(process.env.ISSUES_DATA_DIR||fileURLToPath(new URL('./data/issues/',import.meta.url)));
const file=resolve(folder,'reports.json');let queue=Promise.resolve();
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function handleIssue(request,visitor){
 if(request.method!=='POST')return reply({error:'Method not allowed'},405);
 if(!request.headers.get('content-type')?.includes('application/json'))return reply({error:'Use the issue form.'},415);
 const text=await request.text();if(text.length>16000)return reply({error:'This report is too long.'},413);
 let issue;try{issue=parseIssue(JSON.parse(text));}catch(e){return reply({error:e instanceof SyntaxError?'Invalid report.':e.message},400);}
 const operation=queue.then(async()=>{
  let reports=[];try{reports=JSON.parse(await readFile(file,'utf8'));if(!Array.isArray(reports))throw Error('Invalid issue store');}catch(e){if(e.code!=='ENOENT')throw e;}
  let stored=reports.find(r=>r.id===issue.id);
  if(stored?.delivery==='sent')return reply({id:issue.id,delivery:'sent'});
  if(!stored){if(reports.filter(r=>r.visitor===visitor&&Date.parse(r.createdAt)>Date.now()-3600000).length>=5)return reply({error:'You have submitted several reports. Please try again in an hour.'},429);stored={...issue,visitor,delivery:'pending'};reports.push(stored);}
  async function save(){await mkdir(folder,{recursive:true});await writeFile(file+'.tmp',JSON.stringify(reports)+'\n',{mode:0o600});await rename(file+'.tmp',file);}
  await save();
  try{stored.delivery=await deliverIssue(stored,{key:process.env.ISSUE_MAIL_API_KEY,from:process.env.ISSUE_MAIL_FROM,to:process.env.ISSUE_REPORT_TO,provider:process.env.ISSUE_MAIL_PROVIDER,origin:process.env.PUBLIC_ORIGIN||new URL(request.url).origin});await save();}catch{console.error('Issue mail delivery pending',stored.id);}
  return reply({id:stored.id,delivery:stored.delivery},stored.delivery==='sent'?200:202);
 });queue=operation.catch(()=>{});
 try{return await operation;}catch{return reply({error:'The report could not be saved. Please retry or download a copy.'},503);}
}
