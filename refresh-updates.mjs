// Run from the exported GitHub website root: node refresh-updates.mjs
import {readFile,writeFile,rename} from 'node:fs/promises';
import {refreshUpdates} from './updates-service.mjs';
let previous;try{previous=JSON.parse(await readFile(new URL('./updates.json',import.meta.url),'utf8'));}catch{}
const result=await refreshUpdates(previous);
if(!result.news.length||!result.projects.length)throw Error('Incomplete source retrieval; retain the prior snapshot.');
await writeFile(new URL('./updates.pending.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
await rename(new URL('./updates.pending.json',import.meta.url),new URL('./updates.json',import.meta.url));
console.log(JSON.stringify({checkedAt:result.checkedAt,news:result.news.length,projects:result.projects.length,warnings:result.warnings}));
