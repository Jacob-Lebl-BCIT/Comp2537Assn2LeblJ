import session from 'express-session';
import MongoStore from 'connect-mongo';
import 'dotenv/config';

const mongoURI = process.env.MONGO_URI;
const TTL = 60 * 60; // 1 hour

const sessionStore = MongoStore.create({
    mongoUrl: mongoURI,
    collectionName: 'sessions',
    dbName: 'assn2',
    ttl: TTL,
    autoRemove: 'native',
    crypto: {
        secret: process.env.SESSION_SECRET
    },
});

const sessionMiddleware = session({
    secret: process.env.NODE_SESSION_SECRET,
    saveUninitialized: false,
    store: sessionStore,
    resave: false,
    cookie: {
        maxAge: TTL * 1000, // 1 hour
    }
});

export { sessionMiddleware, TTL };
