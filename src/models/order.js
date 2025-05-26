// src/models/order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerCode: {
    type: String,
    required: true,
    ref: 'CustomerCode'
  },
  customerName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'paid', 'canceled'],
    default: 'waiting'
  },
  items: [{
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    categoryName: String,
    imagePath: String,
    imageFileName: String,
    price: Number
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  // Informações adicionais
  notes: String,
  shippingAddress: String,
  paymentMethod: String,
  
  // Pasta no storage
  folderPath: String,
  
  // Datas de mudança de status
  paidAt: Date,
  canceledAt: Date,
  
  // Controle interno
  internalNotes: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);