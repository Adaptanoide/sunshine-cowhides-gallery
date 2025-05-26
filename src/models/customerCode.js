// src/models/customerCode.js
const mongoose = require('mongoose');

const customerCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    length: 4
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  // Histórico de pedidos
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  // Observações sobre o cliente
  notes: String,
  // Data do último acesso
  lastLogin: Date
}, { timestamps: true });

module.exports = mongoose.model('CustomerCode', customerCodeSchema);