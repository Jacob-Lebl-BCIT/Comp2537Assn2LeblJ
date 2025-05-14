import express from 'express';
import { ensureLoggedIn } from '../middleware/auth.js';

const router = express.Router();

router.get('/members', ensureLoggedIn, (req, res) => {
    res.render('members', {
        title: 'Members Area',
        name: req.session.name,
        user: { name: req.session.name, role: req.session.role }, // Pass user object
        messages: req.flash() // Pass flash messages
    });
});

export default router;
