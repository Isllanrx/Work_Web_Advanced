require('dotenv').config();
require('./db');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const app = express();
const userRouter = require('./routes/userRouter');
const messageRouter = require('./routes/messageRouter');

app.use(express.json());
app.use(cors());
app.use(fileUpload());

// Servir imagens do diretório public do frontend
app.use('/images', express.static(path.join(__dirname, '../frontend/public/images')));

app.use('/api/usuarios', userRouter());
app.use('/api/mensagens', messageRouter());

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});