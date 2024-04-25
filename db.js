const mongoose = require('mongoose');
require('dotenv').config();

const mongoURL = process.env.MONGO_URL_LOCAL;

//set up mongodb connection
mongoose.connect(mongoURL, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
})

const db = mongoose.connection; //get the default connection

db.on('connected', () => {
    console.log('Connected to MongoDB server');
});

db.on('error', (err) => {
    console.log('Error connecting to MongoDB server', err);
});

db.on('disconnected', () => {            
    console.log('Disconnected from MongoDB server');
});

//export the db connection
module.exports = db;

