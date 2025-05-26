// src/middleware/auth.js
const jwt = require('jsonwebtoken');

// Secret para JWT
const JWT_SECRET = process.env.JWT_SECRET || 'seu_jwt_secret';

exports.authMiddleware = (req, res, next) => {
  try {
    // Obter token do header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (err) {
    console.error('Erro de autenticação:', err);
    res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado' });
  }
  next();
};
