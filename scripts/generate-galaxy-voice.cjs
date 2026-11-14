const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const lines=[
 'Pernahkah kamu bertanya, kita sebenarnya tinggal di mana di alam semesta? Kita tinggal di planet Bumi, yang merupakan bagian dari Tata Surya.',
 'Di pusat Tata Surya ada Matahari. Matahari adalah sebuah bintang, yaitu bola gas panas yang menghasilkan cahaya dan energi.',
 'Ada delapan planet yang mengelilingi Matahari. Urutannya adalah Merkurius, Venus, Bumi, Mars, Jupiter, Saturnus, Uranus, lalu Neptunus. Gambar ini hanya ilustrasi, bukan ukuran dan jarak sebenarnya.',
 'Empat planet yang paling dekat dengan Matahari adalah Merkurius, Venus, Bumi, dan Mars. Mereka disebut planet kebumian karena memiliki permukaan padat.',
 'Lebih jauh dari Matahari ada Jupiter, Saturnus, Uranus, dan Neptunus. Jupiter dan Saturnus merupakan raksasa gas, sedangkan Uranus dan Neptunus adalah raksasa es.',
 'Mengapa planet tidak langsung terbang menjauh? Gravitasi Matahari menarik planet, sementara gerak planet membuatnya terus bergerak mengelilingi Matahari pada lintasan yang disebut orbit.',
 'Nah, Tata Surya bukanlah galaksi. Tata Surya adalah satu sistem yang berada di dalam Galaksi Bima Sakti, rumah bagi sangat banyak bintang dan sistem planet.',
 'Galaksi Bima Sakti adalah galaksi spiral berbatang. Matahari berada di salah satu wilayah lengannya, jauh dari pusat galaksi. Jadi, Bumi adalah rumah kita, Tata Surya lingkungan kita, dan Bima Sakti adalah galaksi tempat kita berada.'
];
const dir=path.join(process.cwd(),'public','audio');fs.mkdirSync(dir,{recursive:true});
const out=path.join(dir,'galaxy-narration.mp3');
const exe=process.env.EDGE_TTS_BIN||path.join(process.cwd(),'.venv-tts',process.platform==='win32'?'Scripts/edge-tts.exe':'bin/edge-tts');
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{encoding:'utf8'});if(r.error||r.status!==0)throw new Error(r.error?.message||r.stderr||cmd+' failed');return r.stdout.trim();};
const segments=[],durations=[];
for(let i=0;i<lines.length;i++){
 const p=path.join(dir,'galaxy-line-'+String(i+1).padStart(2,'0')+'.mp3');
 run(exe,['--voice',process.env.TTS_VOICE||'id-ID-ArdiNeural','--rate=-2%','--pitch=+0Hz','--volume=+0%','--text',lines[i],'--write-media',p,'--no-progress']);
 if(fs.statSync(p).size<2500)throw new Error('TTS segment '+(i+1)+' too small');
 const d=Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',p]));
 if(!Number.isFinite(d)||d<=0)throw new Error('Cannot measure segment '+(i+1));
 segments.push(p);durations.push(d);
}
const silence=path.join(dir,'galaxy-pause.mp3');
run('ffmpeg',['-y','-f','lavfi','-i','anullsrc=r=24000:cl=mono','-t','0.42','-ar','24000','-ac','1','-b:a','64k',silence]);
const list=path.join(dir,'galaxy-concat.txt'),ordered=[];
for(let i=0;i<segments.length;i++){ordered.push(segments[i]);if(i<segments.length-1)ordered.push(silence);}
fs.writeFileSync(list,ordered.map(p=>"file '"+p.replace(/'/g,"'\\''")+"'").join('\n')+'\n');
run('ffmpeg',['-y','-f','concat','-safe','0','-i',list,'-ar','24000','-ac','1','-b:a','96k',out]);
const total=Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',out]));
if(!Number.isFinite(total)||total<30||fs.statSync(out).size<16000)throw new Error('Narration validation failed');
const fps=30,gap=Math.round(.42*fps);let cursor=0;
const starts=durations.map((d,i)=>{const s=cursor;cursor+=Math.ceil(d*fps);if(i<durations.length-1)cursor+=gap;return s;});
const frames=Math.ceil(total*fps)+60;
fs.writeFileSync(path.join(process.cwd(),'src/generated/galaxy-timing.ts'),'// Generated from measured neural narration durations.\nexport const GALAXY_SCENE_STARTS = '+JSON.stringify(starts)+' as const;\nexport const GALAXY_DURATION_FRAMES = '+frames+';\n');
for(const p of [...segments,silence])fs.unlinkSync(p);fs.unlinkSync(list);
console.log('Verified Indonesian neural narration: '+total.toFixed(2)+'s across '+lines.length+' segments.');
console.log('Scene starts: '+starts.join(', '));console.log('Duration: '+(frames/fps).toFixed(2)+'s');
