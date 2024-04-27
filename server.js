const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Function to handle range headers
function handleRangeHeaders(req, res, fileSize) {
  const range = req.headers.range;
  if (!range) {
    return { start: 0, end: fileSize - 1 };
  }

  const parts = range.replace(/bytes=/, '').split('-');
  console.log(parts)
  const start = parseInt(parts[0], 10);
  let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  if (end - start + 1 > (4*1048576)) {
    // 1 mb chunk size
    console.log("=======grater than 4 mb requested==========",end - start + 1 )
    end = start + 1048576 - 1; // Set the end byte position to start + 1 MB - 1
  }
  return { start, end };
}

app.get('/video', (req, res) => {
  const videoPath = '/Users/jpfunwareaccounts/downloads/video.mp4'; // Provide the path to your video file
  const videoStat = fs.statSync(videoPath);
  const fileSize = videoStat.size;

  const { start, end } = handleRangeHeaders(req, res, fileSize);
  const chunkSize = (end - start) + 1;

  // Set headers for partial content
  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': 'video/mp4'
  });

  const videoStream = fs.createReadStream(videoPath, { start, end });

  videoStream.on('open', () => {
    videoStream.pipe(res);
  });

  videoStream.on('error', (err) => {
    console.error('Error reading video file:', err);
    res.status(500).send('Error reading video file');
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
