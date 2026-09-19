import {cp,mkdir,rm,readdir,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const dist=resolve('dist');
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
for(const path of ['index.html','styles.css','src','THIRD_PARTY_NOTICES.md']) await cp(resolve(path),resolve(dist,path),{recursive:true});
// Full documentation ships so the in-app provenance links (docs/*.md) resolve
// offline: GitHub Pages and any static mirror keep the same relative layout.
// docs/qa is excluded: it holds generated run reports (timestamps), which CI
// uploads as artifacts rather than baking into the static package.
for (const entry of await readdir(resolve('docs'))) {
  if (entry === 'qa') continue;
  await cp(resolve('docs', entry), resolve(dist, 'docs', entry), { recursive: true });
}
const html=await readFile(resolve(dist,'index.html'),'utf8');
if(/<script[^>]+src=["']https?:/i.test(html)||/<link[^>]+href=["']https?:/i.test(html)) throw new Error('Runtime hotlink detected in built HTML');
console.log('Built dist/ with project-owned runtime, bundled data notices/licenses, and offline documentation.');
