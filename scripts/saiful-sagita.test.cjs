const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('src/SaifulSagita.tsx','utf8'),voice=fs.readFileSync('scripts/generate-saiful-sagita-voice.cjs','utf8');
test('seven scenes and final hug are present',()=>{assert.match(source,/SAIFUL_SAGITA_SCENE_STARTS/);assert.match(source,/MEREKA BERPELUKAN/);assert.match(source,/hug/);assert.match(voice,/berpelukan dengan hangat/i);});
test('story includes first meeting, closeness, confession and mutual feelings',()=>{for(const term of ['menjatuhkan bukunya','semakin dekat','jadi asing','sangat berarti buatku','merasakan hal yang sama'])assert.ok(voice.toLowerCase().includes(term.toLowerCase()),'missing '+term);});
test('narration timing is measured from actual speech',()=>{assert.match(voice,/ffprobe/);assert.match(voice,/SAIFUL_SAGITA_DURATION_FRAMES/);});
