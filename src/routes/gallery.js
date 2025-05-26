// src/routes/gallery.js
const express = require('express');
const { 
  getCategories, 
  getImages,
  getAllClientCategories,
  searchCategories
} = require('../controllers/galleryController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Rota para listar categorias
router.get('/categories', getCategories);

// Rota para listar imagens de uma categoria
router.get('/images/:categoryPath(*)', getImages);

// Rota para obter todas as categorias do cliente
router.get('/all-categories', getAllClientCategories);

// Rota para pesquisar categorias
router.get('/search', searchCategories);

// Removendo a linha problemática por enquanto
// router.post('/sync', adminOnly, syncCategories);

module.exports = router;