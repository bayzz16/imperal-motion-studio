const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const lines=[
'Ini adalah kisah Saiful dan Sagita. Kadang, pertemuan kecil menjadi awal cerita yang berarti. Di sebuah sore sepulang sekolah, dua orang bertemu tanpa pernah merencanakannya.',
'Saat berjalan, Sagita tidak sengaja menjatuhkan bukunya. Saiful mengambilnya dan menyerahkannya kembali. Sagita berkata, “Eh, maaf! Itu bukuku.” Saiful menjawab, “Oh, ini? Nih, punya kamu.” “Makasih, ya.” “Sama-sama.”',
'Hari demi hari, mereka semakin dekat. Mereka belajar bersama, bertukar cerita, dan tertawa karena hal-hal sederhana. Suatu hari Sagita berkata, “Ngobrol sama kamu bikin hariku lebih menyenangkan.” Saiful hanya tersenyum malu.',
'Suatu sore, Saiful terlihat lebih pendiam. Sagita bertanya, “Kamu kenapa?” Saiful menjawab, “Aku cuma takut suatu hari nanti kita jadi asing, padahal sekarang kita sudah sedekat ini.” Sagita mendengarkan dengan tenang.',
'Di bawah langit senja, Saiful akhirnya jujur. “Aku senang bisa mengenalmu. Awalnya kita cuma dua orang yang kebetulan bertemu. Tapi sekarang, kamu jadi seseorang yang sangat berarti buatku.”',
'Sagita tersenyum haru. “Saiful, sebenarnya aku juga merasakan hal yang sama.” Untuk pertama kalinya, keduanya tak perlu menebak-nebak lagi apa yang ada di hati masing-masing.',
'Saiful membuka kedua tangannya. Sagita tersenyum lalu melangkah mendekat. Mereka berpelukan dengan hangat, sementara matahari perlahan tenggelam. Karena terkadang, seseorang membuat hari biasa terasa luar biasa. Terima kasih sudah hadir dalam ceritaku.'
];
const dir=path.join(process.cwd(),'public','audio');fs.mkdirSync(dir,{recursive:true});const out=path.join(dir,'saiful-sagita-narration.mp3');
const exe=process.env.EDGE_TTS_BIN||path.join(process.cwd(),'.venv-tts',process.platform==='win32'?'Scripts/edge-tts.exe':'bin/edge-tts');
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{encoding:'utf8'});if(r.error||r.status!==0)throw new Error(r.error?.message||r.stderr||cmd+' failed');return r.stdout.trim();};
const segments=[],durations=[];
for(let i=0;i<lines.length;i++){const p=path.join(dir,'saiful-sagita-line-'+String(i+1).padStart(2,'0')+'.mp3');run(exe,['--voice',process.env.TTS_VOICE||'id-ID-GadisNeural','--rate=-3%','--pitch=+0Hz','--volume=+0%','--text',lines[i],'--write-media',p,'--no-progress']);if(fs.statSync(p).size<2500)throw new Error('TTS segment '+(i+1)+' too small');const d=Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',p]));if(!Number.isFinite(d)||d<=0)throw new Error('Cannot measure segment '+(i+1));segments.push(p);durations.push(d);}
const silence=path.join(dir,'saiful-sagita-pause.mp3');run('ffmpeg',['-y','-f','lavfi','-i','anullsrc=r=24000:cl=mono','-t','0.55','-ar','24000','-ac','1','-b:a','64k',silence]);
const list=path.join(dir,'saiful-sagita-concat.txt'),ordered=[];for(let i=0;i<segments.length;i++){ordered.push(segments[i]);if(i<segments.length-1)ordered.push(silence);}
fs.writeFileSync(list,ordered.map(p=>"file '"+p.replace(/'/g,"'\\''")+"'").join('\n')+'\n');
run('ffmpeg',['-y','-f','concat','-safe','0','-i',list,'-ar','24000','-ac','1','-b:a','96k',out]);
const total=Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',out]));if(!Number.isFinite(total)||total<35||fs.statSync(out).size<20000)throw new Error('Narration validation failed');
let cursor=0;const starts=durations.map((d,i)=>{const s=cursor;cursor+=Math.ceil(d*30);if(i<durations.length-1)cursor+=12;return s;});const frames=Math.ceil(total*30)+90;
fs.writeFileSync(path.join(process.cwd(),'src/generated/saiful-sagita-timing.ts'),'// Generated from measured Indonesian neural narration durations.\nexport const SAIFUL_SAGITA_SCENE_STARTS = '+JSON.stringify(starts)+' as const;\nexport const SAIFUL_SAGITA_DURATION_FRAMES = '+frames+';\n');
for(const p of [...segments,silence])fs.unlinkSync(p);fs.unlinkSync(list);console.log('Verified Indonesian neural narration: '+total.toFixed(2)+'s across '+lines.length+' scenes. Duration: '+(frames/30).toFixed(2)+'s');
