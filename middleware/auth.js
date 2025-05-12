export function ensureLoggedIn(req, res, next) {
    if (req.session.authenticated) {
        return next(); // user authenticated, go next middleware
    } else {
        res.redirect('/login');
    }
}
