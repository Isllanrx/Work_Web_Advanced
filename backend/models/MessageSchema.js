const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
    
    autorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    content: {
        type: String,
        required: true,
    },

    destination:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },

    type: {
        type: String,
        required: true,
        enum: ['message', 'alert', 'info']
    }
})

module.exports = mongoose.model('Message', MessageSchema);