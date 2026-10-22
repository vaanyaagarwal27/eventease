require('dotenv').config();
const Event = require('./models/Event');
const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('EventEase server is running');

});

app.get('/hello',(req, res) => {
    res.json({message: 'hi'});
});

app.post('/api/events', async (req,res) => {
    try{
        const event = await Event.create(req.body);
        res.status(201).json(event);
    } catch(err) {
        res.status(400).json({error: err.message});
    }
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

