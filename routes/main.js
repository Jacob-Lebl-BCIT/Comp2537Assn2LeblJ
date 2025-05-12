import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename)); // Navigate up to the main project directory

router.get('/', (req, res) => {
    if (req.session.authenticated) {
        res.send(`<h1>Hello, ${req.session.name}</h1><br><a href="/members">Members area</a>
            <br><a href="/logout">Logout</a>`);
    } else {
        res.sendFile('index.html', { root: path.join(__dirname, 'public') });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("couldnt log out");
        }
        console.log("User logged out");
        res.redirect('/');
    });
});

export default router;
