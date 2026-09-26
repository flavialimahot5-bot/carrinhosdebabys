import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

// Publish only the static site; reference captures and build tools stay private.
const output=path.resolve('dist');
assert.equal(path.dirname(output),process.cwd());
await fs.rm(output,{recursive:true,force:true});
await fs.mkdir(output,{recursive:true});
const files=['index.html',...Array.from({length:6},(_,i)=>`variant-${i+1}.html`),'app.js','responsive.js','local.css'];
for(const file of files)await fs.copyFile(file,path.join(output,file));
await fs.cp('assets',path.join(output,'assets'),{recursive:true});
await fs.writeFile(path.join(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
console.log(`Static site ready in dist: ${files.length} files plus assets.`);
