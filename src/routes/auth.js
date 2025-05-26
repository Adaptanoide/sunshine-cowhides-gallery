// src/routes/auth.js
const express = require('express');
const { loginAdmin, validateCustomerCode } = require('../controllers/authController');

const router = express.Router();

// Rota de login de admin
router.post('/admin/login', loginAdmin);

// Rota de validação de código de cliente
router.get('/customer/:code', validateCustomerCode);

module.exports = router;