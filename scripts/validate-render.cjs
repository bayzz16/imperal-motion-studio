const fs=require('node:fs');const path=require('node:path');const {spawnSync}=require('node:child_process');
const file=process.env.OUTPUT_PATH||path.join(process.cwd(),'out',process.env.OUTPUT_FILENAME||'tunas-dewa.mp4');
if(!fs.existsSync(file))throw new Error('Rendered MP4 not found: '+file);
const stat=fs.statSync(file);if(!stat.isFile()||stat.size<20000)throw new Error('Rendered MP4 is empty or unexpectedly small: '+stat.size+' bytes');
const probe=spawnSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,width,height','-of','json',file],{encoding:'utf8'});
if(probe.error||probe.status!==0)throw new Error(probe.error?.message||probe.stderr||'ffprobe failed');
const data=JSON.parse(probe.stdout);const streams=data.streams||[];const video=streams.find(s=>s.codec_type==='video');const audio=streams.find(s=>s.codec_type==='audio');const duration=Number(data.format?.duration);
if(!video)throw new Error('MP4 has no video stream.');if(!audio)throw new Error('MP4 has no audio stream.');if(!Number.isFinite(duration)||duration<=0)throw new Error('MP4 duration is invalid.');if(!(video.width>0&&video.height>0))throw new Error('Video dimensions are invalid.');
console.log('MP4 validation passed');console.log('File: '+file);console.log('Size: '+(stat.size/1024/1024).toFixed(2)+' MiB');console.log('Duration: '+duration.toFixed(2)+' s');console.log('Resolution: '+video.width+'x'+video.height);console.log('Audio stream: present');
