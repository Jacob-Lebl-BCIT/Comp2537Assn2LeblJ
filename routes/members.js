import express from 'express';
import { ensureLoggedIn } from '../middleware/auth.js';

const router = express.Router();

router.get('/members', ensureLoggedIn, (req, res) => {
    const imageNumber = Math.floor(Math.random() * 3) + 1; // Random number between 1 and 3
    const imageName = `car${imageNumber}.JPEG`;

    res.send(`
        <h1>Hello, ${req.session.name}</h1>
        <p>Welcome to the members area!</p>
        <img src="/${imageName}" alt="Random Car" style="width: 300px; height: auto;">
        <br>
        <p>refresh to see another car</p>
        <br>
        <form action="/logout" method="get">
            <button type="submit">Logout</button>
        </form>
    `);
});

export default router;
