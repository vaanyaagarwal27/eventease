require('dotenv').config();
const Registration = require('./models/Registration');
const Event = require('./models/Event');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(cors());
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

app.post('/api/events/:id/register', async (req,res) =>{
    const { name, email} = req.body;
    if(!name || !email) {
        return res.status(400).json({error: 'Name and email are required'});
    }
    try{
        const event = await Event.findById(req.params.id);
        if(!event){
            return res.status(404).json({error: 'Event not found'});
        }
        const registration = await Registration.create({event: event._id, name, email});

        const updated = await Event.findOneAndUpdate(
            {_id: event._id, $expr: { $lt: ['$seatsTaken', '$capacity']}},
            { $inc: { seatsTaken: 1}}
            
        );

        if (!updated){
            await Registration.deleteOne({_id: registration._id});
            return res.status(409).json({ error: 'Sorry, this event is full'});

        }
        res.status(201).json(registration);
    } catch (err){
        if (err.code ==11000){
            return res.status(409).json({error: 'you are already registered for this event'});
        }
        res.status(400).json({error: err.message});
    }
});

app.get('/api/events/:id/attendees', async (req, res) => {
  try {
    const attendees = await Registration.find({ event: req.params.id }).sort({ createdAt: 1});
    res.json(attendees);
  } catch (err) {
    res.status(400).json({ error: 'Invalid event id' });
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

