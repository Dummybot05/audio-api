import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseBuffer } from 'music-metadata';
import  cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIO_DIR = path.join(__dirname, 'audio');

app.use(cors());
app.use('/audio', express.static(AUDIO_DIR));

app.get('/', (req,res) => {
    res.send('Hi');
})

var final_array = [];

app.get('/list', async (req, res) => {
  fs.readdir(AUDIO_DIR, async (err, files) => {
    if (err) {
       return res.status(500).json({ error: 'Unable to read audio directory' });
    }
    files.forEach(async (ever) => {
      const filename = ever;
      const filePath = path.join(AUDIO_DIR, filename);
      if (!fs.existsSync(filePath)) {
         return res.status(404).json({ error: 'File not found' });
      }

      try {
         const fileBuffer = fs.readFileSync(filePath);
         const metadata = await parseBuffer(fileBuffer);

         final_array.push({
               id: ever,
               artist: metadata.common.artist || 'Unknown',
               title: metadata.common.title || 'Unknown',
               album: metadata.common.album || 'Unknown',
               genre: metadata.common.genre ? metadata.common.genre[0] : 'Unknown',
               duration: metadata.format.duration,
               poster: metadata.common.picture
                   ? `data:${metadata.common.picture[0].format};base64,${metadata.common.picture[0].data.toString('base64')}`
                   : null
         })
       } catch (error) {
         res.status(500).json({ error: 'Error processing file' });
       }
    });
    await res.json(final_array);
  });
});

app.get('/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(AUDIO_DIR, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    try {
        const fileBuffer = fs.readFileSync(filePath);
        const metadata = await parseBuffer(fileBuffer);

        res.json({
            buffer: fileBuffer.toString('base64'),
            artist: metadata.common.artist || 'Unknown',
            title: metadata.common.title || 'Unknown',
            album: metadata.common.album || 'Unknown',
            genre: metadata.common.genre ? metadata.common.genre[0] : 'Unknown',
            duration: metadata.format.duration,
            poster: metadata.common.picture
                ? `data:${metadata.common.picture[0].format};base64,${metadata.common.picture[0].data.toString('base64')}`
                : null
        });
    } catch (error) {
        res.status(500).json({ error: 'Error processing file' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

