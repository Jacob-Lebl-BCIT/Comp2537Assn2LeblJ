import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename)); // Navigate up to the main project directory

router.get('/', (req, res) => {
    if (req.session.authenticated) {
        res.render('index', {
            title: 'Home',
            name: req.session.name,
            authenticated: req.session.authenticated
        });
    } else {
        res.render('index', {
            title: 'Home',
            authenticated: req.session.authenticated
        });
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
