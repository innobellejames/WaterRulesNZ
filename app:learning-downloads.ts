import {PDFDocument,rgb,StandardFonts,degrees} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import embeddedFont from './record-font.json';
import {passingScore,type LearningAttempt,type LearningCourse} from './learning-types';
export const RECORD_TITLE='Introductory Learning Completion Record';
export const RECORD_SCOPE='Self-assessed · Unproctored · Non-accredited';
export function nzAttemptDate(value:string){const date=new Date(value);if(!Number.isFinite(date.getTime()))throw Error('Invalid attempt date');return new Intl.DateTimeFormat('en-NZ',{dateStyle:'long',timeStyle:'short',timeZone:'Pacific/Auckland'}).format(date)+' (Pacific/Auckland)';}
export function validateAttempt(attempt:LearningAttempt){
 if(!attempt||attempt.answered!==30||attempt.total!==30||!passingScore(attempt.score)||!attempt.id||!attempt.courseId||!attempt.courseTitle||!attempt.contentVersion)throw Error('A completed passing attempt is required');
 const start=Date.parse(attempt.startedAt),end=Date.parse(attempt.submittedAt);if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)throw Error('Invalid attempt timestamps');
}
function fontBytes(){return Uint8Array.from(atob(embeddedFont.regular),c=>c.charCodeAt(0));}
export async function buildLearningRecordPDF(name:string,attempt:LearningAttempt):Promise<Uint8Array>{
 validateAttempt(attempt);name=name.trim();if(!name||name.length>90)throw Error('Enter your name using 1 to 90 characters');
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);const font=await doc.embedFont(fontBytes(),{subset:true});
 doc.setTitle(RECORD_TITLE);doc.setAuthor('WaterRulesNZ');doc.setSubject('Independent introductory self-assessed learning record');doc.setCreationDate(new Date(attempt.submittedAt));
 const bold=await doc.embedFont(StandardFonts.HelveticaBold),serif=await doc.embedFont(StandardFonts.TimesRoman);
 const page=doc.addPage([842,595]),ink=rgb(.07,.20,.19),muted=rgb(.30,.39,.37),teal=rgb(.047,.40,.37),line=rgb(.80,.86,.83),margin=48,max=746;
 page.drawRectangle({x:0,y:0,width:842,height:595,color:rgb(.985,.988,.976)});
 // Draw the watermark underneath all record fields so the result stays readable.
 page.drawText('WATERRULES NZ',{x:185,y:270,size:49,font:bold,color:teal,rotate:degrees(22),opacity:.075});
 const watermarkDate=new Intl.DateTimeFormat('en-NZ',{day:'2-digit',month:'short',year:'numeric',timeZone:'Pacific/Auckland'}).format(new Date(attempt.submittedAt));
 page.drawText(`SELF-ASSESSED · ${attempt.score}/30 · ${watermarkDate} · ${attempt.id.slice(0,12)}`,{x:192,y:246,size:10,font,color:teal,rotate:degrees(22),opacity:.18});
 page.drawRectangle({x:0,y:583,width:842,height:12,color:teal});
 // The site's own droplet logo, without a seal or accreditation emblem.
 page.drawRectangle({x:48,y:513,width:40,height:40,color:teal});
 page.drawSvgPath('M32 11C25 22 17 30 17 40a15 15 0 0 0 30 0c0-10-8-18-15-29Z',{x:48,y:553,scale:.625,borderColor:rgb(1,1,1),borderWidth:4});
 const text=(value:string,x:number,y:number,size:number,face=font,color=ink)=>page.drawText(value,{x,y,size,font:face,color});
 text('WaterRules NZ',100,533,20,bold,teal);text('Independent guidance and learning',100,516,9,font,muted);
 text('Introductory Learning',margin,464,32,serif);text('Completion Record',margin,426,32,serif);
 text(RECORD_SCOPE,margin,397,11,font,teal);
 page.drawLine({start:{x:margin,y:378},end:{x:794,y:378},thickness:.7,color:line});
 text('LEARNER NAME SUPPLIED',margin,352,8.5,bold,muted);
 let nameSize=29;while(font.widthOfTextAtSize(name,nameSize)>max*1.8&&nameSize>16)nameSize--;
 if(font.widthOfTextAtSize(name,nameSize)<=max){text(name,margin,315,nameSize);}else{
  // Wrap long supplied names over two lines, including names without spaces.
  nameSize=Math.min(nameSize,22);
  let first='';for(const ch of name){if(font.widthOfTextAtSize(first+ch,nameSize)>max)break;first+=ch;}
  const space=first.lastIndexOf(' ');if(space>first.length*.5)first=first.slice(0,space);
  const rest=name.slice(first.length).trim();text(first.trim(),margin,326,nameSize);text(rest,margin,300,nameSize);
 }

 text('TOPIC',margin,285,8.5,bold,muted);text(attempt.courseTitle,margin,261,17);
 page.drawLine({start:{x:margin,y:244},end:{x:794,y:244},thickness:.7,color:line});
 text('ASSESSMENT SCORE',margin,224,8.5,bold,muted);text(`${attempt.score} / 30`,margin,194,25,bold,teal);text(`(${(attempt.score/30*100).toFixed(1)}%)`,159,197,12,font,muted);
 text('QUIZ ATTEMPTED',430,224,8.5,bold,muted);
 text(new Intl.DateTimeFormat('en-NZ',{dateStyle:'long',timeZone:'Pacific/Auckland'}).format(new Date(attempt.submittedAt)),430,204,14);
 text(new Intl.DateTimeFormat('en-NZ',{timeStyle:'short',timeZone:'Pacific/Auckland'}).format(new Date(attempt.submittedAt))+' · Pacific/Auckland',430,186,10,font,muted);
 text('Completion threshold: 26/30 is the minimum whole-number score meeting 85%.',margin,165,9,font,muted);
 let y=141;
 function paragraph(value:string){let row='';for(const word of value.split(' ')){if(row&&font.widthOfTextAtSize(row+' '+word,9)>max){text(row,margin,y,9,font,muted);y-=13;row=word;}else row+=(row?' ':'')+word;}if(row){text(row,margin,y,9,font,muted);y-=13;}}
 paragraph('This records a browser-calculated introductory quiz result. Identity, supervision, workplace competence and regulatory compliance have not been verified.');
 paragraph('Not an NZQA qualification, qualification credit, professional accreditation or operator authorisation. Not issued or endorsed by NZQA, Water New Zealand, any other training provider or a regulator.');
 text('Content version: '+attempt.contentVersion+' · Browser-reported attempt time: '+attempt.submittedAt,margin,76,8,font,muted);
 text('Local attempt reference: '+attempt.id+' · No public verification register',margin,63,8,font,muted);
 page.drawLine({start:{x:margin,y:49},end:{x:794,y:49},thickness:.7,color:line});
 text('Issued by WaterRulesNZ',margin,31,8.5,bold,teal);text('waterrulesnz.com',650,31,9,font,teal);
 return doc.save();
}
export function triggerDownload(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.rel='noopener';a.style.display='none';document.body.appendChild(a);a.click();a.remove();return {url,name};}
export async function downloadCertificate(name:string,attempt:LearningAttempt){const bytes=await buildLearningRecordPDF(name,attempt);const namePart=attempt.courseId.replace(/[^a-z0-9-]/gi,'-');const fileName=`WaterRulesNZ-${namePart}-${attempt.submittedAt.slice(0,10)}-${attempt.score}-of-30.pdf`;return triggerDownload(new Blob([bytes as BlobPart],{type:'application/pdf'}),fileName);}
export function downloadLearningNotes(course:LearningCourse){const text=[course.title,'WaterRulesNZ · independent introductory learning',course.description,...course.lessons.flatMap(l=>['',l.title,l.intro||'',...l.points.map(p=>'• '+p),l.example?'Worked example: '+l.example:'',l.activity?'Try it: '+l.activity.prompt:'',l.activity?'Discussion: '+l.activity.feedback:'']),'','Official supporting source: '+course.source,'Assessment: 30 questions. Completion threshold: 26 correct.','Optional PDF records are self-assessed, unproctored and non-accredited.'].join('\n');const f=triggerDownload(new Blob([text],{type:'text/plain;charset=utf-8'}),'WaterRulesNZ-'+course.id+'-notes.txt');setTimeout(()=>URL.revokeObjectURL(f.url),60000);}
