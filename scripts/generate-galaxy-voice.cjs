const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const lines=[
'Kita tinggal di planet Bumi. Namun Bumi bukan satu-satunya dunia di sekitar kita. Bumi adalah bagian dari sebuah keluarga planet yang disebut Tata Surya.',
'Tata Surya berada di Galaksi Bima Sakti, sebuah galaksi spiral berbatang. Matahari berada di wilayah yang disebut Lengan Orion. Tata Surya membutuhkan sekitar dua ratus tiga puluh juta tahun untuk mengelilingi pusat galaksi.',
'Di pusat Tata Surya kita ada Matahari. Matahari bukan planet, melainkan sebuah bintang yang menghasilkan cahaya dan energi. Gravitasi Matahari membantu menjaga planet-planet tetap mengorbitnya.',
'Inilah Merkurius, planet pertama sekaligus yang terkecil di Tata Surya. Permukaannya penuh kawah. Karena hampir tidak memiliki atmosfer tebal untuk menyimpan panas, suhu siang dan malamnya sangat berbeda. Satu tahun Merkurius berlangsung hanya delapan puluh delapan hari Bumi.',
'Planet kedua adalah Venus. Ukurannya hampir sebesar Bumi, tetapi kondisinya sangat berbeda. Atmosfer Venus yang sangat tebal dan kaya karbon dioksida memerangkap panas. Karena efek rumah kaca yang ekstrem, Venus menjadi planet terpanas di Tata Surya.',
'Berikutnya adalah Bumi, rumah kita. Bumi memiliki air dalam bentuk cair di permukaannya, atmosfer yang mendukung kehidupan, dan beragam ekosistem. Sejauh yang diketahui ilmu pengetahuan, Bumi adalah satu-satunya planet tempat kehidupan telah ditemukan.',
'Planet keempat adalah Mars, yang dikenal sebagai Planet Merah. Warna kemerahannya berasal dari mineral besi yang teroksidasi pada debu dan batuannya. Mars memiliki gunung berapi raksasa, lembah panjang, musim, dan tudung es di kutub.',
'Sekarang kita sampai pada Jupiter, planet terbesar di Tata Surya. Jupiter adalah raksasa gas yang atmosfernya dipenuhi pita awan. Bintik Merah Besar adalah badai raksasa yang telah diamati selama ratusan tahun. Satu hari di Jupiter hanya sekitar sepuluh jam.',
'Planet keenam adalah Saturnus. Ia juga raksasa gas, tetapi paling terkenal karena sistem cincinnya yang sangat lebar. Cincin itu bukan satu lempengan padat; cincin tersusun dari sangat banyak keping es dan batuan yang mengorbit Saturnus.',
'Inilah Uranus, planet ketujuh dan salah satu raksasa es. Keunikannya adalah kemiringan sumbu rotasi yang hampir sembilan puluh derajat. Akibatnya, Uranus tampak berputar menyamping seperti bola yang menggelinding. Gas metana membantu memberi warna biru kehijauan.',
'Planet kedelapan sekaligus planet utama terjauh dari Matahari adalah Neptunus. Neptunus merupakan raksasa es berwarna biru dengan atmosfer yang sangat dinamis. Anginnya dapat melaju lebih dari dua ribu kilometer per jam. Neptunus membutuhkan sekitar seratus enam puluh lima tahun Bumi untuk menyelesaikan satu orbit.',
'Di antara orbit Mars dan Jupiter terdapat sabuk asteroid, kumpulan benda berbatu yang mengorbit Matahari. Lebih jauh lagi ada wilayah Sabuk Kuiper. Pluto berada di wilayah tersebut dan diklasifikasikan sebagai planet katai, bukan salah satu dari delapan planet utama.',
'Sekarang kita sudah mengenal delapan planet: Merkurius, Venus, Bumi, Mars, Jupiter, Saturnus, Uranus, dan Neptunus. Tata Surya adalah lingkungan kosmik kita, sedangkan Bima Sakti adalah galaksi tempat kita berada.'
];
const dir=path.join(process.cwd(),'public','audio');fs.mkdirSync(dir,{recursive:true});
const out=path.join(dir,'galaxy-narration.mp3');
const exe=process.env.EDGE_TTS_BIN||path.join(process.cwd(),'.venv-tts',process.platform==='win32'?'Scripts/edge-tts.exe':'bin/edge-tts');
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{encoding:'utf8'});if(r.error||r.status!==0)throw new Error(r.error?.message||r.stderr||cmd+' failed');return r.stdout.trim();};
const segments=[],durations=[];
for(let i=0;i<lines.length;i++){
 const p=path.join(dir,'galaxy-line-'+String(i+1).padStart(2,'0')+'.mp3');
 run(exe,['--voice',process.env.TTS_VOICE||'id-ID-ArdiNeural','--rate=-3%','--pitch=-1Hz','--volume=+0%','--text',lines[i],'--write-media',p,'--no-progress']);
 if(fs.statSync(p).size<2500)throw new Error('TTS segment '+(i+1)+' too small');
 const d=Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',p]));
 if(!Number.isFinite(d)||d<=0)throw new Error('Cannot measure segment '+(i+1));
 segments.push(p);durations.push(d);
}
const silence=path.join(dir,'galaxy-pause.mp3');
run('ffmpeg',['-y','-f','lavfi','-i','anullsrc=r=24000:cl=mono','-t','0.5','-ar','24000','-ac','1','-b:a','64k',silence]);
const list=path.join(dir,'galaxy-concat.txt'),ordered=[];
for(let i=0;i<segments.length;i++){ordered.push(segments[i]);if(i<segments.length-1)ordered.push(silence);}
fs.writeFileSync(list,ordered.map(p=>"file '"+p.replace(/'/g,"'\\''")+"'").join('\n')+'\n');
run('ffmpeg',['-y','-f','concat','-safe','0','-i',list,'-ar','24000','-ac','1','-b:a','96k',out]);
const total=Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',out]));
if(!Number.isFinite(total)||total<100||fs.statSync(out).size<40000)throw new Error('Narration validation failed');
const fps=30,gap=15;let cursor=0;
const starts=durations.map((d,i)=>{const s=cursor;cursor+=Math.ceil(d*fps);if(i<durations.length-1)cursor+=gap;return s;});
const frames=Math.ceil(total*fps)+75;
fs.writeFileSync(path.join(process.cwd(),'src/generated/galaxy-timing.ts'),'// Generated from measured neural narration durations.\nexport const GALAXY_SCENE_STARTS = '+JSON.stringify(starts)+' as const;\nexport const GALAXY_DURATION_FRAMES = '+frames+';\n');
for(const p of [...segments,silence])fs.unlinkSync(p);fs.unlinkSync(list);
console.log('Verified Indonesian neural narration: '+total.toFixed(2)+'s across '+lines.length+' segments.');
console.log('Scene starts: '+starts.join(', '));console.log('Duration: '+(frames/fps).toFixed(2)+'s');
