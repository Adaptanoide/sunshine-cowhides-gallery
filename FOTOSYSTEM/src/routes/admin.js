// src/routes/admin.js
const express = require('express');
const adminController = require('../controllers/adminController');
const orderController = require('../controllers/orderController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticação e admin
router.use(authMiddleware);
router.use(adminOnly);

// Rotas de gerenciamento de clientes
router.get('/customers', adminController.listCustomers);
router.get('/customers/:code', adminController.getCustomer);
router.post('/customers', adminController.createCustomerCode);
router.put('/customers/:code', adminController.updateCustomer);
router.delete('/customers/:code', adminController.deleteCustomer);

// Rotas de gerenciamento de categorias
router.get('/categories', adminController.listCategories);
router.put('/categories/:categoryId/price', adminController.updateCategoryPrice);
router.post('/categories/batch-update', adminController.batchUpdatePrices);
router.post('/categories/sync', adminController.syncCategories);

// Rotas de controle de acesso às categorias
router.get('/customers/:code/category-access', adminController.getCustomerCategoryAccess);
router.post('/customers/:code/category-access', adminController.grantCategoryAccess);
router.delete('/customers/:code/category-access/:categoryId', adminController.revokeCategoryAccess);
router.post('/customers/:code/category-access/batch', adminController.batchCategoryAccess);

// Rotas de gerenciamento de pedidos
router.get('/orders', orderController.listOrders);
router.get('/orders/:orderId', orderController.getOrderDetails);
router.put('/orders/:orderId/status', orderController.updateOrderStatus);
router.post('/orders/:orderId/process', orderController.processOrder);

module.exports = router;