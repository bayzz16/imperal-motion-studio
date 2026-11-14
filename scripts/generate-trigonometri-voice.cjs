const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const lines=[
  'Halo semuanya. Kali ini kita akan mempraktikkan penggunaan teori trigonometri untuk memperkirakan tinggi tiang bendera tanpa harus memanjatnya.',
  'Bayangkan sebuah tiang bendera di halaman sekolah. Dalam contoh simulasi ini, pengamat berdiri delapan meter dari pangkal tiang. Permukaan tanah dianggap datar.',
  'Selanjutnya, pengamat mengarahkan klinometer sederhana ke puncak tiang. Sudut elevasi yang digunakan dalam simulasi ini adalah tiga puluh lima derajat.',
  'Jarak mendatar menjadi sisi samping segitiga siku-siku. Selisih tinggi antara puncak tiang dan mata pengamat menjadi sisi depan. Garis pandang membentuk sisi miring.',
  'Karena kita mengetahui sudut dan sisi samping, perbandingan yang tepat adalah tangen. Tangen sudut sama dengan sisi depan dibagi sisi samping.',
  'Tinggi di atas mata pengamat sama dengan delapan dikali tangen tiga puluh lima derajat. Tinggi mata pengamat diasumsikan satu koma lima meter, sehingga nilai itu harus ditambahkan.',
  'Tangen tiga puluh lima derajat sekitar nol koma tujuh nol nol dua. Delapan dikali nol koma tujuh nol nol dua ditambah satu koma lima menghasilkan sekitar tujuh koma satu nol meter.',
  'Jadi, berdasarkan data simulasi, tinggi tiang diperkirakan tujuh koma satu nol meter. Ingat, angka ini adalah contoh perhitungan, bukan hasil pengukuran langsung di sekolah. Terima kasih.'
];
const dir=path.join(process.cwd(),'public','audio');fs.mkdirSync(dir,{recursive:true});
const out=path.join(dir,'trigonometri-narration.mp3');
const voice=process.env.TTS_VOICE||'id-ID-ArdiNeural';
const rate=process.env.TTS_RATE||'-2%';
const pitch=process.env.TTS_PITCH||'+0Hz';
const exe=process.env.EDGE_TTS_BIN||path.join(process.cwd(),'.venv-tts',process.platform==='win32'?'Scripts/edge-tts.exe':'bin/edge-tts');
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{encoding:'utf8'});if(r.error||r.status!==0)throw new Error(r.error?.message||r.stderr||cmd+' failed');return r.stdout.trim();};
const segments=[],durations=[];
for(let i=0;i<lines.length;i++){
 const p=path.join(dir,'trigonometri-line-'+String(i+1).padStart(2,'0')+'.mp3');
 run(exe,['--voice',voice,'--rate='+rate,'--pitch='+pitch,'--volume=+0%','--text',lines[i],'--write-media',p,'--no-progress']);
 if(fs.statSync(p).size<3000)throw new Error('TTS segment '+(i+1)+' is too small');
 const d=Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',p]));
 if(!Number.isFinite(d)||d<=0)throw new Error('Cannot measure segment '+(i+1));
 segments.push(p);durations.push(d);
}
const silence=path.join(dir,'trigonometri-pause.mp3');
run('ffmpeg',['-y','-f','lavfi','-i','anullsrc=r=24000:cl=mono','-t','0.55','-ar','24000','-ac','1','-b:a','64k',silence]);
const list=path.join(dir,'trigonometri-concat.txt');
const ordered=[];for(let i=0;i<segments.length;i++){ordered.push(segments[i]);if(i<segments.length-1)ordered.push(silence);}
fs.writeFileSync(list,ordered.map(p=>"file '"+p.replace(/'/g,"'\\''")+"'").join('\n')+'\n');
run('ffmpeg',['-y','-f','concat','-safe','0','-i',list,'-ar','24000','-ac','1','-b:a','96k',out]);
const total=Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',out]));
if(!Number.isFinite(total)||total<25||fs.statSync(out).size<20000)throw new Error('Narration validation failed');
const fps=30,gap=Math.round(.55*fps);let cursor=0;
const starts=durations.map((d,i)=>{const s=cursor;cursor+=Math.ceil(d*fps);if(i<durations.length-1)cursor+=gap;return s;});
const frames=Math.ceil(total*fps)+90;
fs.writeFileSync(path.join(process.cwd(),'src/generated/trigonometri-timing.ts'),'// Generated from measured neural narration durations.\nexport const TRIGONOMETRI_SCENE_STARTS = '+JSON.stringify(starts)+' as const;\nexport const TRIGONOMETRI_DURATION_FRAMES = '+frames+';\n');
for(const p of [...segments,silence])fs.unlinkSync(p);fs.unlinkSync(list);
console.log('Verified neural narration: '+total.toFixed(2)+'s across '+lines.length+' measured segments.');
console.log('Scene starts: '+starts.join(', '));console.log('Composition duration: '+(frames/fps).toFixed(2)+'s');
