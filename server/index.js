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

app.get('/api/events/:id', async (req,res) =>{
    try{
        const event = await Event.findById(req.params.id);
        if (!event){
            return res.status(404).json({ error: 'Event not found'});
        }
        res.json(event);
    } catch(err) {
        res.status(400).json({ error: 'Invalid event id'});

    }
        
    });
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
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

