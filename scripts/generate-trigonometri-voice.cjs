const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const ts=require('typescript');

// All dialogue lines use the same narrator voice.
const dialogue=[
 {speaker:'Filza',scene:'opening',text:'Halo semuanya! Kami dari kelompok kelas sepuluh E dua.'},
 {speaker:'Falyn',scene:'opening',text:'Hari ini kami akan mempraktikkan teori trigonometri untuk memperkirakan tinggi tiang bendera.'},
 {speaker:'Taysa',scene:'opening',text:'Kita akan mencari tingginya tanpa mengukur tiang dari bawah sampai ke puncak.'},
 {speaker:'Miko',scene:'tools',text:'Memangnya bisa? Kita kan tidak punya tangga sepanjang tiang.'},
 {speaker:'Rahma',scene:'tools',text:'Bisa. Kita siapkan meteran, busur derajat, sedotan, benang, pemberat, dan kalkulator.'},
 {speaker:'Bayu',scene:'tools',text:'Meteran untuk mengukur jarak. Busur, sedotan, benang, dan pemberat kita gunakan untuk membuat klinometer sederhana.'},
 {speaker:'Taysa',scene:'build',text:'Pertama, tempelkan sedotan pada sisi lurus busur derajat.'},
 {speaker:'Filza',scene:'build',text:'Lalu ikat benang di bagian tengah busur dan pasang pemberat pada ujungnya.'},
 {speaker:'Miko',scene:'build',text:'Sedotan menjadi alat bidik, sedangkan benang menunjukkan arah vertikal. Klinometer sederhana kita siap.'},
 {speaker:'Bayu',scene:'measure',text:'Sekarang aku berdiri pada titik pengamatan. Jarak mendatar dari titik ini ke pangkal tiang adalah delapan meter.'},
 {speaker:'Falyn',scene:'measure',text:'Arahkan sedotan ke puncak tiang, lalu baca sudut yang ditunjukkan benang pada busur derajat.'},
 {speaker:'Rahma',scene:'measure',text:'Pada contoh simulasi ini, sudut elevasinya tiga puluh lima derajat dan tinggi mata pengamat satu koma lima meter.'},
 {speaker:'Taysa',scene:'geometry',text:'Garis mendatar dari mata pengamat menjadi sisi samping, sedangkan selisih tinggi ke puncak tiang menjadi sisi depan.'},
 {speaker:'Miko',scene:'geometry',text:'Garis pandang menjadi sisi miring. Jadi terbentuk segitiga siku-siku dengan sudut elevasi tiga puluh lima derajat.'},
 {speaker:'Bayu',scene:'formula',text:'Kita gunakan tangen, karena yang diketahui adalah sisi depan dan sisi samping.'},
 {speaker:'Rahma',scene:'formula',text:'Tangen tiga puluh lima derajat sama dengan tinggi tiang dikurangi satu koma lima, lalu dibagi delapan.'},
 {speaker:'Filza',scene:'result',text:'Tinggi sama dengan delapan dikali tangen tiga puluh lima derajat, ditambah satu koma lima meter.'},
 {speaker:'Falyn',scene:'result',text:'Tangen tiga puluh lima derajat sekitar nol koma tujuh nol nol dua. Hasil akhirnya sekitar tujuh koma satu nol meter.'},
 {speaker:'Miko',scene:'closing',text:'Wah, ternyata tinggi benda bisa diperkirakan menggunakan trigonometri. Tidak perlu memanjat tiangnya!'},
 {speaker:'Taysa',scene:'closing',text:'Dari praktik ini, kita belajar bahwa matematika bisa digunakan dalam kehidupan sehari-hari.'},
 {speaker:'Rahma',scene:'closing',text:'Kita juga belajar mengukur dengan teliti dan bekerja sama.'},
 {speaker:'Bayu',scene:'closing',text:'Demikian praktik trigonometri dari kelompok kami.'},
 {speaker:'Filza',scene:'closing',text:'Terima kasih sudah menyaksikan video kami!'},
];

// One consistent Indonesian neural narrator for the entire practice video.
const voice=process.env.TTS_VOICE||'id-ID-ArdiNeural';
const rate=process.env.TTS_RATE||'-4%';
const pitch=process.env.TTS_PITCH||'-2Hz';
const root=process.cwd(),dir=path.join(root,'public','audio','trigonometri');
fs.mkdirSync(dir,{recursive:true});
const exe=process.env.EDGE_TTS_BIN||path.join(root,'.venv-tts',process.platform==='win32'?'Scripts/edge-tts.exe':'bin/edge-tts');
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{encoding:'utf8'});if(r.error||r.status!==0)throw new Error(r.error?.message||r.stderr||cmd+' failed');return r.stdout.trim();};
const fps=30,gapFrames=Math.round(.55*fps);let cursor=0;
const cues=[];
for(let i=0;i<dialogue.length;i++){
 const line=dialogue[i];
 const file='audio/trigonometri/dialogue-'+String(i+1).padStart(2,'0')+'.mp3';
 const output=path.join(root,'public',file);
 run(exe,['--voice',voice,'--rate='+rate,'--pitch='+pitch,'--volume=+0%','--text',line.text,'--write-media',output,'--no-progress']);
 const size=fs.statSync(output).size;
 if(size<2500)throw new Error('TTS dialogue '+(i+1)+' is too small ('+size+' bytes)');
 const duration=Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',output]));
 if(!Number.isFinite(duration)||duration<=0)throw new Error('Cannot measure dialogue '+(i+1));
 const frames=Math.ceil(duration*fps);
 cues.push({...line,startFrame:cursor,durationFrames:frames});
 cursor+=frames+(i<dialogue.length-1?gapFrames:0);
}
const silence=path.join(dir,'trigonometri-pause.mp3');
run('ffmpeg',['-y','-f','lavfi','-i','anullsrc=r=24000:cl=mono','-t',(gapFrames/fps).toFixed(3),'-ar','24000','-ac','1','-b:a','64k',silence]);
const list=path.join(dir,'trigonometri-concat.txt');
const ordered=[];
for(let i=0;i<dialogue.length;i++){
 ordered.push(path.join(root,'public','audio','trigonometri','dialogue-'+String(i+1).padStart(2,'0')+'.mp3'));
 if(i<dialogue.length-1)ordered.push(silence);
}
fs.writeFileSync(list,ordered.map(p=>"file '"+p.replace(/'/g,"'\\''")+"'").join('\n')+'\n');
const narration=path.join(root,'public','audio','trigonometri-narration.mp3');
run('ffmpeg',['-y','-f','concat','-safe','0','-i',list,'-ar','24000','-ac','1','-b:a','96k',narration]);
const totalSeconds=Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',narration]));
if(!Number.isFinite(totalSeconds)||totalSeconds<=0||fs.statSync(narration).size<20000)throw new Error('Combined narration validation failed');
const total=Math.ceil(totalSeconds*fps)+fps*2;
const output='// Generated from measured single-voice Indonesian narration audio.\nexport const TRIGONOMETRI_DIALOGUE_CUES = '+JSON.stringify(cues,null,2)+' as const;\nexport const TRIGONOMETRI_DURATION_FRAMES = '+total+';\n';
const compiled=ts.transpileModule(output,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020},reportDiagnostics:true});
const errors=(compiled.diagnostics||[]).filter((diagnostic)=>diagnostic.category===ts.DiagnosticCategory.Error);
if(errors.length)throw new Error('Generated timing module failed TypeScript validation: '+errors.map((diagnostic)=>ts.flattenDiagnosticMessageText(diagnostic.messageText,' ')).join('; '));
fs.writeFileSync(path.join(root,'src/generated/trigonometri-timing.ts'),output);
for(let i=1;i<=dialogue.length;i++)fs.unlinkSync(path.join(dir,'dialogue-'+String(i).padStart(2,'0')+'.mp3'));
fs.unlinkSync(silence);fs.unlinkSync(list);
console.log('Generated '+cues.length+' timed narration segments using one voice and assembled them into one MP3 track.');
console.log('Narrator voice: '+voice+' ('+rate+', '+pitch+').');
console.log('Combined narration duration: '+totalSeconds.toFixed(2)+' seconds.');
console.log('Composition duration: '+(total/fps).toFixed(2)+' seconds.');
