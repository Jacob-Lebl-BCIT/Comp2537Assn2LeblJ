import express from 'express';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8000;

app.get('/', (req, res) => {
    res.sendFile('public/index.html', {root: __dirname});
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});