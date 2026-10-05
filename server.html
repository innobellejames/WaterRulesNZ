<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta http-equiv="Content-Style-Type" content="text/css">
  <title></title>
  <meta name="Description" content="Explore New Zealand drinking water supplier requirements with linked official sources.">
  <meta name="Generator" content="Cocoa HTML Writer">
  <meta name="CocoaVersion" content="2299.77">
  <style type="text/css">
    p.p1 {margin: 0.0px 0.0px 0.0px 0.0px; font: 12.0px Times; -webkit-text-stroke: #000000}
    p.p2 {margin: 0.0px 0.0px 0.0px 0.0px; font: 12.0px Times; -webkit-text-stroke: #000000; min-height: 14.0px}
    span.s1 {font-kerning: none}
  </style>
</head>
<body>
<p class="p1"><span class="s1">================================================================================</span></p>
<p class="p1"><span class="s1">import {createServer} from 'node:http';</span></p>
<p class="p1"><span class="s1">import {readFile} from 'node:fs/promises';</span></p>
<p class="p1"><span class="s1">import {fileURLToPath} from 'node:url';</span></p>
<p class="p1"><span class="s1">import {resolve,extname,sep} from 'node:path';</span></p>
<p class="p1"><span class="s1">import {handlePageViews} from './page-view-service.mjs';</span></p>
<p class="p1"><span class="s1">import {handleRainfall} from './rainfall-service.mjs';</span></p>
<p class="p1"><span class="s1">import {handleRegionalRainfall} from './regional-rainfall-service.mjs';</span></p>
<p class="p1"><span class="s1">const root=fileURLToPath(new URL('.',import.meta.url));</span></p>
<p class="p1"><span class="s1">const ISSUE_RECIPIENT=process.env.ISSUE_REPORT_TO||"innobelle.james@gmail.com";</span></p>
<p class="p1"><span class="s1">const ISSUE_FROM=process.env.ISSUE_REPORT_FROM||"WaterRules NZ &lt;onboarding@resend.dev&gt;";</span></p>
<p class="p1"><span class="s1">const RESEND_API_KEY=process.env.RESEND_API_KEY||"";</span></p>
<p class="p1"><span class="s1">const issueWindow=new Map();</span></p>
<p class="p1"><span class="s1">function issueAllowed(ip){</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>const now=Date.now(), key=ip||"unknown", last=issueWindow.get(key)||0;</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>if(now-last&lt;60_000)return false;</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>issueWindow.set(key,now);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>for(const [k,t] of issueWindow)if(now-t&gt;10*60_000)issueWindow.delete(k);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>return true;</span></p>
<p class="p1"><span class="s1">}</span></p>
<p class="p1"><span class="s1">async function readJson(req){</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>let raw=""; for await(const chunk of req) raw+=chunk;</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>if(raw.length&gt;20_000)throw new Error("Issue report is too large.");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>const body=JSON.parse(raw);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>if(!body||typeof body!=="object")throw new Error("Invalid issue report.");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>const kind=String(body.kind||"Other").slice(0,80),details=String(body.details||"").trim().slice(0,8000),page=String(body.page||"").slice(0,2000),date=String(body.date||new Date().toISOString()).slice(0,80);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>if(!details)throw new Error("Please describe the issue.");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>return {kind,details,page,date};</span></p>
<p class="p1"><span class="s1">}</span></p>
<p class="p1"><span class="s1">async function handleIssueReport(req){</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>const headers={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>if(req.method==="OPTIONS")return new Response(null,{status:204,headers});</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>if(req.method!=="POST")return Response.json({error:"Method not allowed."},{status:405,headers:{...headers,Allow:"POST, OPTIONS"}});</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>if(!issueAllowed(req.headers.get("x-forwarded-for")||""))return Response.json({error:"Please wait a minute before sending another report."},{status:429,headers});</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>if(!RESEND_API_KEY)return Response.json({error:"Issue email delivery is not configured on this server. Set RESEND_API_KEY and ISSUE_REPORT_FROM, or use the download fallback."},{status:503,headers});</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>try{</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>const {kind,details,page,date}=await readJson(req);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":`Bearer ${RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">   </span>from:ISSUE_FROM,to:[ISSUE_RECIPIENT],subject:`WaterRules NZ issue · ${kind}`,</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">   </span>text:`WaterRules NZ issue report\n\nType: ${kind}\nPage: ${page}\nDate: ${date}\n\nDetails:\n${details}`</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>})});</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>const body=await response.json().catch(()=&gt;({}));</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>if(!response.ok)throw new Error(body.message||"Email provider rejected the report.");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>return Response.json({ok:true},{headers});</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>}catch(error){return Response.json({error:error.message||"The issue report could not be sent."},{status:500,headers});}</span></p>
<p class="p1"><span class="s1">}</span></p>
<p class="p2"><span class="s1"></span><br></p>
<p class="p1"><span class="s1">const port=Number(process.env.PORT||8080),host=process.env.HOST||'0.0.0.0';</span></p>
<p class="p1"><span class="s1">if(!Number.isInteger(port)||port&lt;1||port&gt;65535)throw new Error('Choose a PORT between 1 and 65535.');</span></p>
<p class="p1"><span class="s1">const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.pdf':'application/pdf','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','.gif':'image/gif','.json':'application/json'};</span></p>
<p class="p1"><span class="s1">createServer(async(req,res)=&gt;{</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>try{</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>const isApi=(req.url||'').split('?')[0].startsWith('/api/');</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>if(isApi){res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET, HEAD, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Accept');res.setHeader('X-Content-Type-Options','nosniff');}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>if(req.method==='OPTIONS'&amp;&amp;isApi){res.writeHead(204);res.end();return;}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>const url=new URL(req.url||'/','http://localhost');</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>if(url.pathname==='/api/page-views'){const response=await handlePageViews(req.method);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));return;}if(url.pathname==='/api/report-issue'){const response=await handleIssueReport(req);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));return;}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>if(req.method!=='GET'&amp;&amp;req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>if(url.pathname==='/api/rainfall'||url.pathname==='/api/regional-rainfall'){</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">   </span>const handler=url.pathname==='/api/rainfall'?handleRainfall:handleRegionalRainfall;</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">   </span>const response=await handler(new Request(url));res.writeHead(response.status,Object.fromEntries(response.headers));res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));return;</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>const pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>if(!['/index.html','/styles.css','/script.js','/favicon.svg'].includes(pathname)&amp;&amp;!/^\/(downloads|images|assets)\//.test(pathname)){res.writeHead(404);res.end('Not found');return;}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>const filename=resolve(root,'.'+pathname);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>if(!filename.startsWith(resolve(root)+sep)){res.writeHead(403);res.end('Forbidden');return;}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>const data=await readFile(filename);res.writeHead(200,{'Content-Type':types[extname(filename)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>}catch{if((req.url||'').startsWith('/api/')){res.writeHead(500,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'The requested data service is unavailable. Please try again.'}));}else{res.writeHead(404);res.end('Not found');}}</span></p>
<p class="p1"><span class="s1">}).listen(port,host,()=&gt;console.log(`WaterRules NZ ready: http://${host}:${port}`));</span></p>
</body>
</html>
