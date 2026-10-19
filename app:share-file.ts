import banner from './share-banner.json';
let cached:File|undefined;
export function sharingPhoto(){if(!cached){const raw=atob(banner.image.split(',')[1]);const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));cached=new File([bytes],'Water-Rules-NZ.png',{type:'image/png'});}return cached;}
export function photoShareData(url:string):ShareData|null{try{const data={title:'WaterRules NZ | Drinking water guidance and learning',text:'An independent guide to New Zealand drinking water requirements, linked official sources, interactive lessons and planning tools.',url,files:[sharingPhoto()]};return typeof navigator.share==='function'&&typeof navigator.canShare==='function'&&navigator.canShare(data)?data:null;}catch{return null;}}
export function saveSharingPhoto(){const url=URL.createObjectURL(sharingPhoto());const a=document.createElement('a');a.href=url;a.download='Water-Rules-NZ.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
