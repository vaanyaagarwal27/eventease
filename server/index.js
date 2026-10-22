require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.get('/', (req, res) => {
    res.send('EventEase server is running');

});

app.get('/hello',(req, res) => {
    res.json({message: 'hi'});
});


mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('Connected to MongoDB');
    app.listen(3000, () => {
     console.log('Server listening on port 3000');

    });
})
.catch((err) => {
    console.error('MongoDB connection failed:', err.message);
});

