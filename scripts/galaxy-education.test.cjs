const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const source=fs.readFileSync('src/GalaxyEducation.tsx','utf8');const voice=fs.readFileSync('scripts/generate-galaxy-voice.cjs','utf8');
test('all eight planets are present in solar-system order',()=>{const names=['MERKURIUS','VENUS','BUMI','MARS','JUPITER','SATURNUS','URANUS','NEPTUNUS'];const p=names.map(n=>source.indexOf("name:'"+n+"'"));assert.ok(p.every(n=>n>=0));assert.deepEqual([...p].sort((a,b)=>a-b),p);});
test('narration covers each planet and Pluto classification',()=>{for(const n of ['Merkurius','Venus','Bumi','Mars','Jupiter','Saturnus','Uranus','Neptunus'])assert.ok(voice.includes(n));assert.match(voice,/Pluto[\\s\\S]*planet katai/i);});
test('timing is measured from generated narration',()=>{assert.match(voice,/ffprobe/);assert.match(voice,/GALAXY_SCENE_STARTS/);});
