const fs = require('fs');
const url = require('url');
const bcrypt = require('bcrypt');
const express = require('express');
const fileUpload = require('express-fileupload');
const ffmpeg = require('fluent-ffmpeg');
const youtubedl = require('youtube-dl');

const app = express();
const port = 8080;

ffmpeg.setFfmpegPath('./ffmpeg/bin/ffmpeg.exe');
ffmpeg.setFfprobePath('./ffmpeg/bin/ffprobe.exe');
app.use(express.static(__dirname + '/src'));
app.use(fileUpload());

if(!fs.existsSync('./temp'))fs.mkdirSync('./temp');

app.get('/download',(req,res) => {
  let id = req.query.id;
  let name = req.query.name;
  res.download(`./temp/${id}.mp3`,name);
  setTimeout(() => {
      fs.unlink(`./temp/${id}.mp3`,()=>{});
  },5000);
});
app.post('/convert-url',(req,res) => {
  let url = new URL(req.body.video_url);
  let params = new URLSearchParams(url.search);
  getVideo(url.href).then(data => {
    res.end(`{"url":"${data.url}","next":[${data.next}]}`);
  });
});
app.post('/convert-file',(req,res) => {
  let id = '';
  let video = req.files.video_file;
  bcrypt.hash(video.name,1,(err,hash) => {
    hash = hash.replace(/\//g,'-');
    video.mv(`./temp/${hash}.mp4`);
    ffmpeg(`./temp/${hash}.mp4`).output(`./temp/${hash}.mp3`).on('end',() => {
      fs.unlink(`./temp/${hash}.mp4`,()=>{});
      res.end(`{"url":"/download?id=${hash}&name=${video.name.replace('.mp4','')}.mp3"}`);
    }).run();
  });
});

async function getVideo(_url){
  let id = '';
  let name = '';
  let next = [];
  let download = youtubedl(_url);
  await new Promise(resolve => {
    download.on('info',info => {
      id = info.display_id + '-' + Math.floor(Date.now() / 1000);
      name = encodeURIComponent(info.title);
      download.pipe(fs.createWriteStream(`./temp/${id}.mp4`));
    });
    download.on('end',() => {
      ffmpeg(`./temp/${id}.mp4`).output(`./temp/${id}.mp3`).on('end',() => {
        fs.unlink(`./temp/${id}.mp4`,()=>{});
        resolve();
      }).run();
    });
    download.on('next',(data) => {
      for (let i = 0;i < data.length;i++){
        next.push(`"${data[i].webpage_url}"`);
      }
    });
  });

  return {
    url: `/download?id=${id}&name=${name}.mp3`,
    next: next
  };
}

app.listen(port,() => {
    console.log('Server started on port ' + port);
});
