const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const lines=[
 'Breaking news. Hari ini kita membahas sebuah fenomena yang tercatat dalam arsip: Kyandra, dengan tinggi seratus empat puluh sembilan sentimeter.',
 'Namun para peneliti menemukan hal menarik. Angka tingginya boleh seratus empat puluh sembilan, tetapi tingkat percaya dirinya belum berhasil diukur karena alatnya tidak cukup panjang.',
 'Untuk urusan foto, fotografer hanya perlu satu hal: mencari angle terbaik. Bukan masalah, ini namanya seni komposisi dan perspektif.',
 'Saat foto bersama, kamera mendadak ikut belajar seni komposisi. Semua orang punya posisi terbaiknya masing-masing.',
 'Mari kita hitung: seratus empat puluh sembilan sentimeter tinggi badan, seratus empat puluh sembilan persen energi, dan seribu persen percaya diri. Hasilnya? Kyandra tetap jadi pusat perhatian.',
 'Jangan salah paham. Ini bukan kekurangan. Ini edisi ringkas dengan fitur lengkap, hemat tempat, dan tetap penuh kejutan.',
 'Kyandra, jangan ngambek. Ini cuma bercanda. Kalau kamu ngambek, nanti satu kamera ikut minta maaf. Sekian laporan hari ini.'
];
const dir=path.join(process.cwd(),'public','audio');fs.mkdirSync(dir,{recursive:true});
const out=path.join(dir,'kyandra-narration.mp3');
const exe=process.env.EDGE_TTS_BIN||path.join(process.cwd(),'.venv-tts',process.platform==='win32'?'Scripts/edge-tts.exe':'bin/edge-tts');
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{encoding:'utf8'});if(r.error||r.status!==0)throw new Error(r.error?.message||r.stderr||cmd+' failed');return r.stdout.trim();};
const segments=[],durations=[];
for(let i=0;i<lines.length;i++){
 const p=path.join(dir,'kyandra-line-'+String(i+1).padStart(2,'0')+'.mp3');
 run(exe,['--voice',process.env.TTS_VOICE||'id-ID-ArdiNeural','--rate=-1%','--pitch=+1Hz','--volume=+0%','--text',lines[i],'--write-media',p,'--no-progress']);
 if(fs.statSync(p).size<2500)throw new Error('TTS segment '+(i+1)+' too small');
 const d=Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',p]));
 if(!Number.isFinite(d)||d<=0)throw new Error('Cannot measure segment '+(i+1));
 segments.push(p);durations.push(d);
}
const silence=path.join(dir,'kyandra-pause.mp3');
run('ffmpeg',['-y','-f','lavfi','-i','anullsrc=r=24000:cl=mono','-t','0.48','-ar','24000','-ac','1','-b:a','64k',silence]);
const list=path.join(dir,'kyandra-concat.txt'),ordered=[];
for(let i=0;i<segments.length;i++){ordered.push(segments[i]);if(i<segments.length-1)ordered.push(silence);}
fs.writeFileSync(list,ordered.map(p=>"file '"+p.replace(/'/g,"'\\''")+"'").join('\n')+'\n');
run('ffmpeg',['-y','-f','concat','-safe','0','-i',list,'-ar','24000','-ac','1','-b:a','96k',out]);
const total=Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',out]));
if(!Number.isFinite(total)||total<20||fs.statSync(out).size<12000)throw new Error('Narration validation failed');
const fps=30,gap=Math.round(.48*fps);let cursor=0;
const starts=durations.map((d,i)=>{const s=cursor;cursor+=Math.ceil(d*fps);if(i<durations.length-1)cursor+=gap;return s;});
const frames=Math.ceil(total*fps)+75;
fs.writeFileSync(path.join(process.cwd(),'src/generated/kyandra-timing.ts'),'// Generated from measured neural narration durations.\nexport const KYANDRA_SCENE_STARTS = '+JSON.stringify(starts)+' as const;\nexport const KYANDRA_DURATION_FRAMES = '+frames+';\n');
for(const p of [...segments,silence])fs.unlinkSync(p);fs.unlinkSync(list);
console.log('Verified Indonesian neural narration: '+total.toFixed(2)+'s across '+lines.length+' segments.');
console.log('Scene starts: '+starts.join(', '));console.log('Duration: '+(frames/fps).toFixed(2)+'s');
