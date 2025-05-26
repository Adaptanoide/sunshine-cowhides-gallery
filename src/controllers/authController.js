// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const CustomerCode = require('../models/customerCode');

// Secret para JWT
const JWT_SECRET = process.env.JWT_SECRET || 'seu_jwt_secret';

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar admin por email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    // Verificar senha
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    // Gerar JWT
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: admin._id,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('Erro no login de admin:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

exports.validateCustomerCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    // Buscar código de cliente
    const customer = await CustomerCode.findOne({ code, active: true });
    if (!customer) {
      return res.status(401).json({ message: 'Código inválido ou inativo' });
    }
    
    // Gerar JWT
    const token = jwt.sign(
      { 
        id: customer._id, 
        code: customer.code, 
        name: customer.name,
        role: 'customer'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: customer._id,
        code: customer.code,
        name: customer.name,
        role: 'customer'
      }
    });
  } catch (err) {
    console.error('Erro na validação de código:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};