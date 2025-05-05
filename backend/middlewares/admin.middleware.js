const User = require('../models/UserSchema');

async function adminMiddleware(req, res, next) {
    try {
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        if (!user.admin) {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar esta rota.' });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: 'Erro ao verificar permissões' });
    }
}

module.exports = adminMiddleware; 