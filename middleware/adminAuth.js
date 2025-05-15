export function ensureAdmin(req, res, next) {
    if (req.session.authenticated && req.session.role === 'admin') {
        return next();
    } else if (req.session.authenticated) {
        req.flash('error', 'You are not authorized to view this page.');
        return res.redirect('/403');
    } else {
        req.flash('error', 'You must be logged in as an admin to view this page.');
        res.redirect('/login');
    }
}
