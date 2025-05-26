// src/models/category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  path: {
    type: String,
    required: true,
    unique: true
  },
  parentPath: {
    type: String,
    default: null
  },
  // Preço base (padrão)
  price: {
    type: Number,
    default: 0
  },
  priceUnit: {
    type: String,
    default: 'un'
  },
  // Desconto por quantidade
  quantityDiscounts: [{
    quantity: Number,
    discountPercentage: Number
  }],
  active: {
    type: Boolean,
    default: true
  },
  // Estatísticas para monitoramento
  views: {
    type: Number,
    default: 0
  },
  imageCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Método para obter caminho completo
categorySchema.virtual('fullPath').get(function() {
  return this.parentPath 
    ? `${this.parentPath}/${this.name}` 
    : this.name;
});

module.exports = mongoose.model('Category', categorySchema);