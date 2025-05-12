import express from 'express';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import Joi from 'joi';
import bcrypt from 'bcrypt';

import User from './models/User.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8000;

const mongoURI = process.env.MONGO_URI; // ===== STORED IN .env FILE ======
const TTL = 60 * 60; // 1 hour



try {
    const db = await mongoose.connect(mongoURI, {
        dbName: 'assn2'
    });
    console.log('MongoDB connected successfully');
} catch (error) {
    console.error('MongoDB connection error:', error);
}

// middleware
app.use(express.urlencoded({ extended: false })); // Parse form data
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// joi validation schemas
const signupSchema = Joi.object({
    name: Joi.string().alphanum().min(3).max(30).required(), // Add name validation
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'ca', 'org'] } }).required(), // Basic email validation
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*]{3,30}$')).required() // Example: letters, numbers, some symbols, 3-30 chars
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// authentication middleware
function ensureLoggedIn(req, res, next) {
    if (req.session.authenticated) {
        return next(); // user athenticated, go next middleware
    } else {
        res.redirect('/login');
    }
}


// session stuff

const sessionStore = MongoStore.create({
    mongoUrl: mongoURI,
    collectionName: 'sessions', // Changed from 'assn1' to 'sessions'
    dbName: 'assn2',
    ttl: TTL,
    autoRemove: 'native',
    crypto: {
        secret: process.env.SESSION_SECRET
    },
});



app.use(session({
    secret: process.env.NODE_SESSION_SECRET,
    saveUninitialized: false,
    store: sessionStore,
    resave: false, 
    cookie: {
        maxAge: TTL * 1000, // 1 hour
    }
}));


// more middleware:tm:

app.get('/', (req, res) => {
        // check session
    if (req.session.authenticated) {
        res.send(`<h1>Hello, ${req.session.name}</h1><br><a href="/members">Members area</a>
            <br><a href="/logout">Logout</a>`);
    } else {
        res.sendFile('public/index.html', {root: __dirname});
    }
})



// signup route

app.get('/signup', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect('/members');
    } else {
    res.sendFile('public/signup.html', {root: __dirname});
    }


});

// post to handle signup

app.post('/signupSubmit', async (req, res) => {
    const { email, password, name } = req.body;

    let missingFields = [];
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0) {
        return res.status(400).send(`Missing fields: ${missingFields.join(', ')}
         <br><br> <a href="/signup">Try again</a>`);
    }

    // joi validation

    const validationResult = signupSchema.validate({ name, email, password }); 
    if (validationResult.error) {
        return res.status(400).send(`Validation error: ${validationResult.error.details[0].message}
         <br><br> <a href="/signup">Try again</a>`);
    }

    try {
        // check for duplicate user
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).send(`Email already in use
             <br><br> <a href="/signup">Try again</a>`);
        }

        // hash pword, default to 10 rounds
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ name, email, password: hashedPassword});
        await newUser.save();
        console.log("User created:", newUser);

        // Log the user in and create session
        req.session.authenticated = true;
        req.session.email = email;
        req.session.name = name; 
        req.session.userId = newUser._id;
        req.session.cookie.maxAge = TTL * 1000; // 1 hour

        res.redirect('/members');


    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("An internal server error occurred. Please try again later.");
    }

})


// login routes
app.get('/login', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect('/members');
    } else {
    res.sendFile('public/login.html', {root: __dirname});
    }
});

app.post('/loginSubmit', async (req, res) => {

    const { email, password } = req.body;

    // joi validation
    const validationResult = loginSchema.validate({ email, password });
    if (validationResult.error) {
        return res.status(400).send(`Validation error: ${validationResult.error.details[0].message}
         <br><br> <a href="/login">Try again</a>`);
    }

    try {

        const user = await User.findOne({email: email});

        if (!user) {
            return res.status(401).send(`Invalid email or password
             <br><br> <a href="/login">Try again</a>`);
        }

        // compare password with hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            // pword match, login
            req.session.authenticated = true;
            req.session.email = email;
            req.session.name = user.name; // Store name in session
            req.session.userID = user._id;
            req.session.cookie.maxAge = TTL * 1000; // 1 hour

            console.log("User logged in:", user);
                        res.redirect('/members');
        } else {
            // pword mismatch
            return res.status(401).send(`Invalid email or password
             <br><br> <a href="/login">Try again</a>`);
        }

    } catch (error) {
        console.error("login error:", error);
        res.status(500).send("somethn went bad here.");
    }

});

// members route
app.get('/members', ensureLoggedIn, (req, res) => {

    const imageNumber = Math.floor(Math.random() * 3) + 1; // Random number between 1 and 3
    const imageName = `car${imageNumber}.JPEG`;

    res.send(`
        <h1>Hello, ${req.session.name}</h1>
        <p>Welcome to the members area!</p>
        <img src="/${imageName}" alt="Random Cat" style="width: 300px; height: auto;">
        <br>
        <p>refresh to see another cat</p>
        <br>
        <form action="/logout" method="get">
            <button type="submit">Logout</button>
        </form>
        `)

});

app.get('/logout', (req, res) => {

    req.session.destroy(err => { // ==================== END SESSION ==================== (large comment to easily find during demo)
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("couldnt log out");
        }
        console.log("User logged out");
        res.redirect('/');
    })

});



// 404 handle
app.use((req, res) => {
    res.status(404).send('404 Not Found');
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});