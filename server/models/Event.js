const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
    {
        title: { type: String, 
                 required: true,
                 trim: true
                },
        capacity: { type: Number, required: true, min: 1},
        seatsTaken: { type: Number, default: 0},
        description: { type: String, trim: true},
        venue: { type: String, required: true, trim: true},
        date: {type: Date, required: true},
    },
    { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);


