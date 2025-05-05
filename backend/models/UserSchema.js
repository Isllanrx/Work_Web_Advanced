const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    imagem: {
        type: String,
        required: false,
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('User', UserSchema);