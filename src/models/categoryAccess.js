// src/models/categoryAccess.js
const mongoose = require('mongoose');

// Modelo para controlar o acesso de clientes às categorias
const categoryAccessSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerCode',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  // Preço personalizado para este cliente nesta categoria
  // Se null, usa o preço padrão da categoria
  customPrice: {
    type: Number,
    default: null
  }
}, { timestamps: true });

// Índice composto para evitar duplicatas
categoryAccessSchema.index({ customerId: 1, categoryId: 1 }, { unique: true });

module.exports = mongoose.model('CategoryAccess', categoryAccessSchema);