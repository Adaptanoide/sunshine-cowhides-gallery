// src/controllers/orderController.js
const Order = require('../models/order');
const CustomerCode = require('../models/customerCode');
const Category = require('../models/category');
const CategoryAccess = require('../models/categoryAccess');
const fileService = require('../services/fileService');
const emailService = require('../services/emailService');

// Criar novo pedido
exports.createOrder = async (req, res) => {
  try {
    const { items, notes, shippingAddress, paymentMethod } = req.body;
    const { role, code, id } = req.user;
    
    // Verificar se é cliente
    if (role !== 'customer') {
      return res.status(403).json({ message: 'Apenas clientes podem criar pedidos' });
    }
    
    // Buscar cliente
    const customer = await CustomerCode.findOne({ code });
    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    // Verificar se há itens
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'O pedido deve conter pelo menos um item' });
    }
    
    // Processar itens
    const processedItems = [];
    let totalPrice = 0;
    
    for (const item of items) {
      // Buscar categoria
      const category = await Category.findOne({ path: item.categoryPath });
      if (!category) {
        return res.status(400).json({ message: `Categoria não encontrada: ${item.categoryPath}` });
      }
      
      // Verificar acesso
      const access = await CategoryAccess.findOne({
        customerId: customer._id,
        categoryId: category._id
      });
      
      if (!access) {
        return res.status(403).json({ message: `Acesso negado à categoria: ${category.name}` });
      }
      
      // Determinar preço (personalizado ou padrão)
      let price = category.price;
      if (access.customPrice !== null) {
        price = access.customPrice;
      }
      
      // Adicionar item processado
      processedItems.push({
        categoryId: category._id,
        categoryName: category.name,
        imagePath: item.path,
        imageFileName: path.basename(item.path),
        price
      });
      
      // Somar ao preço total
      totalPrice += price;
    }
    
    // Criar pedido
    const order = await Order.create({
      customerCode: code,
      customerName: customer.name,
      items: processedItems,
      totalPrice,
      notes,
      shippingAddress,
      paymentMethod,
      status: 'waiting'
    });
    
    // Criar pasta do pedido
    const folderInfo = await fileService.createOrderFolder(order);
    
    // Atualizar caminho da pasta
    order.folderPath = folderInfo.folderPath;
    await order.save();
    
    // Adicionar pedido ao cliente
    customer.orders.push(order._id);
    await customer.save();
    
    // Enviar email de confirmação
    try {
      await emailService.sendOrderConfirmation(order, customer);
    } catch (emailErr) {
      console.error('Erro ao enviar email de confirmação:', emailErr);
      // Continuar mesmo com erro no email
    }
    
    res.status(201).json({
      message: 'Pedido criado com sucesso',
      order
    });
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ message: 'Erro ao criar pedido' });
  }
};

// Listar pedidos
exports.listOrders = async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const { role, code } = req.user;
    
    // Calcular skip para paginação
    const skip = (page - 1) * limit;
    
    // Construir query
    const query = {};
    
    // Filtrar por status
    if (status) {
      query.status = status;
    }
    
    // Filtrar por cliente se não for admin
    if (role === 'customer') {
      query.customerCode = code;
    }
    
    // Buscar pedidos
    const orders = await Order.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .select('-items'); // Excluir lista de itens para performance
    
    // Contar total
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Erro ao listar pedidos:', err);
    res.status(500).json({ message: 'Erro ao listar pedidos' });
  }
};

// Obter detalhes de um pedido
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { role, code } = req.user;
    
    // Buscar pedido
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }
    
    // Verificar acesso se não for admin
    if (role === 'customer' && order.customerCode !== code) {
      return res.status(403).json({ message: 'Acesso negado a este pedido' });
    }
    
    res.json(order);
  } catch (err) {
    console.error('Erro ao buscar detalhes do pedido:', err);
    res.status(500).json({ message: 'Erro ao buscar detalhes do pedido' });
  }
};

// Atualizar status do pedido
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const { role, id } = req.user;
    
    // Verificar se é admin
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Apenas administradores podem atualizar o status do pedido' });
    }
    
    // Verificar status válido
    if (!['waiting', 'paid', 'canceled'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }
    
    // Buscar pedido
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }
    
    // Atualizar status
    const oldStatus = order.status;
    order.status = status;
    
    // Registrar data da mudança de status
    if (status === 'paid') {
      order.paidAt = new Date();
      
      // Mover pasta para "pago"
      if (oldStatus === 'waiting') {
        try {
          const folderInfo = await fileService.moveOrderToPaid(order);
          order.folderPath = folderInfo.folderPath;
        } catch (folderErr) {
          console.error('Erro ao mover pasta do pedido:', folderErr);
          // Continuar mesmo com erro na pasta
        }
      }
    } else if (status === 'canceled') {
      order.canceledAt = new Date();
    }
    
    // Registrar admin que processou
    order.processedBy = id;
    
    await order.save();
    
    // Enviar email de atualização
    try {
      const customer = await CustomerCode.findOne({ code: order.customerCode });
      if (customer) {
        await emailService.sendOrderStatusUpdate(order, customer);
      }
    } catch (emailErr) {
      console.error('Erro ao enviar email de atualização:', emailErr);
      // Continuar mesmo com erro no email
    }
    
    res.json({
      message: 'Status atualizado com sucesso',
      order
    });
  } catch (err) {
    console.error('Erro ao atualizar status do pedido:', err);
    res.status(500).json({ message: 'Erro ao atualizar status do pedido' });
  }
};

// Processar pedido (admin)
exports.processOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { internalNotes } = req.body;
    const { role, id } = req.user;
    
    // Verificar se é admin
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Apenas administradores podem processar pedidos' });
    }
    
    // Buscar pedido
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }
    
    // Atualizar notas internas
    if (internalNotes !== undefined) {
      order.internalNotes = internalNotes;
    }
    
    // Registrar admin que processou
    order.processedBy = id;
    
    await order.save();
    
    res.json({
      message: 'Pedido processado com sucesso',
      order
    });
  } catch (err) {
    console.error('Erro ao processar pedido:', err);
    res.status(500).json({ message: 'Erro ao processar pedido' });
  }
};

// Obter pedidos do cliente atual
exports.getMyOrders = async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    const { role, code } = req.user;
    
    // Verificar se é cliente
    if (role !== 'customer') {
      return res.status(403).json({ message: 'Apenas clientes podem acessar seus pedidos' });
    }
    
    // Calcular skip para paginação
    const skip = (page - 1) * limit;
    
    // Construir query
    const query = { customerCode: code };
    
    // Filtrar por status
    if (status) {
      query.status = status;
    }
    
    // Buscar pedidos
    const orders = await Order.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    // Contar total
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Erro ao buscar pedidos do cliente:', err);
    res.status(500).json({ message: 'Erro ao buscar pedidos' });
  }
};