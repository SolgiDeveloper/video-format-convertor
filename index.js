const {app, BrowserWindow, ipcMain, shell} = require('electron');
const ffmpeg = require('fluent-ffmpeg');
const _ = require('lodash');
// lodash: is a utility library that can be used to help with iteration over common arrays and abjects
// const { app, BrowserWindow, ipcMain, shell } = electron;

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
      contextIsolation: false,
    }
  });
  mainWindow.loadURL(`file://${__dirname}/src/index.html`);
});

ipcMain.on('videos:added', (event, videos) => {
  // we have a list of videos => vid 5.8
  // inja yek javab be front midahad ke shamel results ast.
  const promises = _.map(videos, video => {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(video.path, (err, metadata) => {
        // video.duration = metadata.format.duration;
        // video.format = 'avi';
        // resolve(video);
        // or
        resolve({
        ...video,
        duration: metadata.format.duration,
        format: 'avi' // set default format for select option menu
        })
      });
    });
  });

  Promise.all(promises)
    .then((results) => {
      mainWindow.webContents.send('metadata:complete', results);
    });
});

ipcMain.on('conversion:start', (event, videos) => {
  // inja process har video jodagane be results dade mishe
  _.each(videos, video => {
    // convert video file and save it in same directory
    const outputDirectory = video.path.split(video.name)[0];
    const outputName = video.name.split('.')[0]
    const outputPath = `${outputDirectory}${outputName}.${video.format}`;

    ffmpeg(video.path)
      .output(outputPath)
      .on('progress', ({timemark}) =>
        // timemark => zaman bagimande az video
        mainWindow.webContents.send('conversion:progress', {video, timemark})
      )
      .on('end', () =>
        mainWindow.webContents.send('conversion:end', {video, outputPath})
      )
      .run(); // this tells ffmpeg hey there's no other options or events we want to go onto the .on() ==> just do the video conversion process.
  });
});

ipcMain.on('folder:open', (event, outputPath) => {
  shell.showItemInFolder(outputPath);
});
