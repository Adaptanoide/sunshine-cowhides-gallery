// src/routes/orders.js
const express = require('express');

const router = express.Router();

// Rotas de pedidos serão implementadas posteriormente
router.get('/cart', (req, res) => {
  res.json({ message: 'Carrinho de compras' });
});

module.exports = router;