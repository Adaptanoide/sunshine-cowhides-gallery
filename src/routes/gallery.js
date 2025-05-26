// src/routes/gallery.js
const express = require('express');
const { 
  getCategories, 
  getImages, 
  syncCategories 
} = require('../controllers/galleryController');
const { adminOnly } = require('../middleware/auth');

const router = express.Router();

// Rota para listar categorias
router.get('/categories', getCategories);

// Rota para listar imagens de uma categoria
router.get('/images/:categoryPath(*)', getImages);

// Rota para sincronizar categorias (admin)
router.post('/sync', adminOnly, syncCategories);

module.exports = router;