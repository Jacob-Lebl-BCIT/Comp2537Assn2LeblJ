import express from 'express';
import { ensureLoggedIn } from '../middleware/auth.js';

const router = express.Router();

router.get('/members', ensureLoggedIn, (req, res) => {
    res.render('members', {
        title: 'Members Area',
        name: req.session.name,
        messages: req.flash() // Pass flash messages
    });
});

export default router;
