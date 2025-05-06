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

const mongoURI = process.env.MONGO_URI;
const TTL = 60 * 60 * 24; // 1 day



try {
    const db = await mongoose.connect(mongoURI, {
        dbName: 'assn1'
    });
    console.log('MongoDB connected successfully');
} catch (error) {
    console.error('MongoDB connection error:', error);
}

// joi validation schemas
const signupSchema = Joi.object({
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'ca', 'org'] } }).required(), // Basic email validation
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*]{3,30}$')).required() // Example: letters, numbers, some symbols, 3-30 chars
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});


// session stuff

const sessionStore = MongoStore.create({
    mongoUrl: mongoURI,
    collectionName: 'assn1',
    ttl: TTL,
    autoRemove: 'native',
    crypto: {
        secret: process.env.SESSION_SECRET
    }
});

// parse encoded url data
app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: process.env.NODE_SESSION_SECRET,
    saveUninitialized: false,
    store: sessionStore,
    resave: true,
    cookie: {
        maxAge: TTL * 1000, // 1 day
    }
}));


// Middleware 

app.get('/', (req, res) => {
    // check session
    if (req.session.authenticated) {
        res.sendFile(`<h1>Hello, ${req.session.name}</h1><br><a href="/members">Members area</a>
            <br><a href="/logout">Logout</a>`);
    } else {
        res.sendFile('public/index.html', {root: __dirname});
    }
})



// signup route

app.get('/signup', (req, res) => {

    res.sendFile('public/signup.html', {root: __dirname});

});

// post to handle signup

app.post('/signupSubmit', async (req, res) => {
    const { email, password } = req.body;

    let missingFields = [];
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0) {
        return res.status(400).send(`Missing fields: ${missingFields.join(', ')}
         <br><br> <a href="/signup">Try again</a>`);
    }

    // joi validation

    const validationResult = signupSchema.validate({ email, password });
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

        const newUser = new User({ email, password: hashedPassword});
        await newUser.save();
        console.log("User created:", newUser);

        // Log the user in and create session
        req.session.authenticated = true;
        req.session.email = email;
        req.session.userId = newUser._id;
        req.session.cookie.maxAge = TTL * 1000; // 1 day

        res.redirect('/members');


    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("An internal server error occurred. Please try again later.");
    }

})




// 404 handle
app.use((req, res) => {
    res.status(404).send('404 Not Found');
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});