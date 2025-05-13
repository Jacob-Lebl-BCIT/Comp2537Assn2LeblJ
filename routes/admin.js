import express from 'express';
import User from '../models/User.js';
import { ensureAdmin } from '../middleware/adminAuth.js';
import { ensureLoggedIn } from '../middleware/auth.js';

const router = express.Router();

// Admin dashboard route
router.get('/admin', ensureLoggedIn, ensureAdmin, async (req, res) => {
    try {
        const users = await User.find({});
        // messages are available via res.locals.messages from middleware in index.js
        res.render('admin', { title: 'Admin Panel', users: users });
    } catch (error) {
        console.error("Error fetching users for admin panel:", error);
        req.flash('error', 'Failed to load admin panel.');
        res.redirect('/members');
    }
});

// Promote user to admin
router.post('/admin/promote/:userId', ensureLoggedIn, ensureAdmin, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.userId, { role: 'admin' });
        req.flash('success', 'User promoted to admin successfully.');
    } catch (error) {
        console.error("Error promoting user:", error);
        req.flash('error', 'Error promoting user.');
    }
    res.redirect('/admin');
});

// Demote user to regular user
router.post('/admin/demote/:userId', ensureLoggedIn, ensureAdmin, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.userId, { role: 'user' });
        req.flash('success', 'User demoted to user successfully.');
    } catch (error) {
        console.error("Error demoting user:", error);
        req.flash('error', 'Error demoting user.');
    }
    res.redirect('/admin');
});

export default router;
