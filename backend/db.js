const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/message-pwa', {
    useUnifiedTopology: true
})
.then(() => {
    console.log('A aplicação conectou ao banco');
})
.catch((err) => {
    console.error('Erro ao conectar ao MongoDB: ', err);
});