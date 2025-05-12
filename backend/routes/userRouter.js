const express = require('express');
const router = express.Router();
const User = require('../models/UserSchema');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const { hash, compare } = require('bcrypt');

function userRouter() {
    router.post('/login', async (req, res) => {
        try {
            
            const { email } = req.body;
            const user = await User.findOne({ email });
            const checkPassword = await compare(req.body.password, user.password);
            if (user){
                res.status(200).json({
                    message: 'Usuário habilitado a logar',
                    user: {
                        _id: user._id,
                        nome: user.nome,
                        email: user.email,
                        imagem: user.imagem || '/images/padrao.png',
                        admin: user.admin,
                        token: jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' })
                    }
                });
            } else {
                res.status(401).json({ error: 'Credenciais inválidas' });
            }
        } catch (error) {
            res.status(401).json({ error: 'Credenciais inválidas' });
        }
    });

    router.post('/', async (req, res) => {
        try {
            const passwordHash = await hash(req.body.password, 10);
            req.body.password = passwordHash;
            const user = new User(req.body)
            await user.save();
            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({ error: 'Erro ao criar usuário', detailedMessage: error});
        }
    });

    router.post('/upload/:id', async (req, res) => {
        try {
            if (!req.files || !req.files.imagem) {
                return res.status(400).json({ error: 'Nenhuma imagem enviada' });
            }

            const file = req.files.imagem;
            const fileName = Date.now() + path.extname(file.name);
            const dir = path.join(__dirname, '../../frontend/public/images');
            const filePath = path.join(dir, fileName);

            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir, { recursive: true });
            }

            await file.mv(filePath);

            const user = await User.findByIdAndUpdate(
                req.params.id,
                { imagem: `/images/${fileName}` },
                { new: true }
            );

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            res.json(user);
        } catch (error) {
            console.error('Erro no upload:', error);
            res.status(400).json({ error: 'Erro ao fazer upload da imagem' });
        }
    });

    router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
        try {
            const users = await User.find();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar usuários' });
        }
    });

    router.get('/:id', authMiddleware, async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            res.json(user);
        } catch (error) {
            res.status(404).json({ error: 'Usuário não encontrado' });
        }
    });

    router.delete('/:id', authMiddleware, async (req, res) => {
        try {
            await User.findByIdAndDelete(req.params.id);
            res.status(204).json({ message: 'Usuário deletado com sucesso' });
        } catch (error) {
            res.status(404).json({ error: 'Usuário não encontrado' });
        }
    });

    return router;
}

module.exports = userRouter;