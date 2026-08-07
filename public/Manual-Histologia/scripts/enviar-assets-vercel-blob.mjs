import { put } from '@vercel/blob';
import { createReadStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const plan=(await readFile(path.join(root,'dados/plano-assets-blob.jsonl'),'utf8')).trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const mapFile=path.join(root,'dados/mapa-assets-blob.json');
let done={}; try{done=JSON.parse(await readFile(mapFile,'utf8'))}catch{}
if(!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Defina BLOB_READ_WRITE_TOKEN.');
const concurrency=Math.max(1,Math.min(8,Number(process.env.HISTOLOGY_UPLOAD_CONCURRENCY||4))); let cursor=0,uploaded=0;
async function checkpoint(){await writeFile(mapFile,JSON.stringify(done,null,2)+'\n')}
async function worker(){while(true){const i=cursor++; if(i>=plan.length)return; const item=plan[i]; if(done[item.sha256])continue; const local=path.join(root,item.arquivoLocal); const blob=await put(item.blobPath,createReadStream(local),{access:'public',addRandomSuffix:false,contentType:item.mime,token:process.env.BLOB_READ_WRITE_TOKEN}); done[item.sha256]={url:blob.url,pathname:blob.pathname,sha256:item.sha256,bytes:item.bytes,mime:item.mime}; uploaded++; if(uploaded%25===0){await checkpoint(); console.log(`${Object.keys(done).length}/${plan.length}`)}}}
await Promise.all(Array.from({length:concurrency},worker)); await checkpoint(); console.log(`Concluído: ${Object.keys(done).length}/${plan.length}.`);
