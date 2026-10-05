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
    span.s1 {font-kerning: none}
  </style>
</head>
<body>
<p class="p1"><span class="s1">import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';</span></p>
<p class="p1"><span class="s1">import {resolve} from 'node:path';</span></p>
<p class="p1"><span class="s1">import {fileURLToPath} from 'node:url';</span></p>
<p class="p1"><span class="s1">// One server process owns this file. Use a persistent volume in production.</span></p>
<p class="p1"><span class="s1">const folder=resolve(process.env.VIEWS_DATA_DIR||fileURLToPath(new URL('./data/',import.meta.url)));</span></p>
<p class="p1"><span class="s1">const file=resolve(folder,'page-views.json');</span></p>
<p class="p1"><span class="s1">let queue=Promise.resolve();</span></p>
<p class="p1"><span class="s1">async function update(increment){</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>let count={views:0,startedAt:null};</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>try{count=JSON.parse(await readFile(file,'utf8'));}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>catch(error){if(error.code!=='ENOENT')throw error;}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>if(!Number.isSafeInteger(count.views)||count.views&lt;0)throw new Error('Invalid stored counter');</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>if(increment){</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>if(count.views&gt;=Number.MAX_SAFE_INTEGER)throw new Error('Counter limit reached');</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>count={views:count.views+1,startedAt:count.startedAt||new Date().toISOString()};</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>await mkdir(folder,{recursive:true});</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>await writeFile(file+'.tmp',JSON.stringify(count)+'\n',{mode:0o600});</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">  </span>await rename(file+'.tmp',file);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>return {...count,metric:'page loads'};</span></p>
<p class="p1"><span class="s1">}</span></p>
<p class="p1"><span class="s1">export async function handlePageViews(method){</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>if(!['GET','HEAD','POST'].includes(method))return Response.json({error:'Method not allowed'},{status:405,headers:{...headers,Allow:'GET, HEAD, POST'}});</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>const operation=queue.then(()=&gt;update(method==='POST'));</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>queue=operation.catch(()=&gt;{});</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>try{return Response.json(await operation,{headers});}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space"> </span>catch(error){console.error('Page-view counter unavailable',error);return Response.json({error:'Page views are currently unavailable.'},{status:503,headers});}</span></p>
<p class="p1"><span class="s1">}</span></p>
</body>
</html>
