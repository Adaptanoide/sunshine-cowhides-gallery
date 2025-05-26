// src/controllers/adminController.js
const CustomerCode = require('../models/customerCode');
const Category = require('../models/category');
const CategoryAccess = require('../models/categoryAccess');
const fileService = require('../services/fileService');
const crypto = require('crypto');

// Gerar código aleatório de 4 dígitos
const generateRandomCode = () => {
  const min = 1000;
  const max = 9999;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

// Verificar se código já existe
const isCodeUnique = async (code) => {
  const existingCode = await CustomerCode.findOne({ code });
  return !existingCode;
};

// Gerar código único
const generateUniqueCode = async () => {
  let code;
  let isUnique = false;
  
  // Tentar até encontrar um código único
  while (!isUnique) {
    code = generateRandomCode();
    isUnique = await isCodeUnique(code);
  }
  
  return code;
};

// Listar todos os clientes
exports.listCustomers = async (req, res) => {
  try {
    const customers = await CustomerCode.find().sort('-createdAt');
    res.json(customers);
  } catch (err) {
    console.error('Erro ao listar clientes:', err);
    res.status(500).json({ message: 'Erro ao listar clientes' });
  }
};

// Obter detalhes de um cliente
exports.getCustomer = async (req, res) => {
  try {
    const { code } = req.params;
    
    const customer = await CustomerCode.findOne({ code });
    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    // Buscar acessos às categorias
    const categoryAccess = await CategoryAccess.find({ customerId: customer._id })
      .populate('categoryId', 'name path price');
    
    res.json({
      customer,
      categoryAccess
    });
  } catch (err) {
    console.error('Erro ao buscar cliente:', err);
    res.status(500).json({ message: 'Erro ao buscar cliente' });
  }
};

// Criar novo código de cliente
exports.createCustomerCode = async (req, res) => {
  try {
    const { name, email, phone, notes } = req.body;
    
    // Gerar código único
    const code = await generateUniqueCode();
    
    // Criar cliente
    const customer = await CustomerCode.create({
      code,
      name,
      email,
      phone,
      notes,
      active: true
    });
    
    res.status(201).json({
      message: 'Cliente criado com sucesso',
      customer
    });
  } catch (err) {
    console.error('Erro ao criar cliente:', err);
    res.status(500).json({ message: 'Erro ao criar cliente' });
  }
};

// Atualizar cliente
exports.updateCustomer = async (req, res) => {
  try {
    const { code } = req.params;
    const { name, email, phone, notes, active } = req.body;
    
    // Buscar cliente
    const customer = await CustomerCode.findOne({ code });
    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    // Atualizar campos
    customer.name = name || customer.name;
    customer.email = email || customer.email;
    customer.phone = phone || customer.phone;
    customer.notes = notes !== undefined ? notes : customer.notes;
    customer.active = active !== undefined ? active : customer.active;
    
    await customer.save();
    
    res.json({
      message: 'Cliente atualizado com sucesso',
      customer
    });
  } catch (err) {
    console.error('Erro ao atualizar cliente:', err);
    res.status(500).json({ message: 'Erro ao atualizar cliente' });
  }
};

// Excluir cliente
exports.deleteCustomer = async (req, res) => {
  try {
    const { code } = req.params;
    
    // Buscar cliente
    const customer = await CustomerCode.findOne({ code });
    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    // Excluir acessos às categorias
    await CategoryAccess.deleteMany({ customerId: customer._id });
    
    // Excluir cliente
    await customer.deleteOne();
    
    res.json({ message: 'Cliente excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir cliente:', err);
    res.status(500).json({ message: 'Erro ao excluir cliente' });
  }
};

// Listar todas as categorias
exports.listCategories = async (req, res) => {
  try {
    const { parentPath = '' } = req.query;
    
    const categories = await Category.find({ parentPath }).sort('name');
    res.json(categories);
  } catch (err) {
    console.error('Erro ao listar categorias:', err);
    res.status(500).json({ message: 'Erro ao listar categorias' });
  }
};

// Atualizar preço de categoria
exports.updateCategoryPrice = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { price, priceUnit, quantityDiscounts } = req.body;
    
    // Buscar categoria
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }
    
    // Atualizar preço
    if (price !== undefined) {
      category.price = price;
    }
    
    // Atualizar unidade de preço
    if (priceUnit) {
      category.priceUnit = priceUnit;
    }
    
    // Atualizar descontos por quantidade
    if (quantityDiscounts) {
      category.quantityDiscounts = quantityDiscounts;
    }
    
    await category.save();
    
    res.json({
      message: 'Preço atualizado com sucesso',
      category
    });
  } catch (err) {
    console.error('Erro ao atualizar preço:', err);
    res.status(500).json({ message: 'Erro ao atualizar preço' });
  }
};

// Atualizar preços em lote
exports.batchUpdatePrices = async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'Dados inválidos' });
    }
    
    const results = [];
    
    // Processar cada atualização
    for (const update of updates) {
      const { categoryId, price, priceUnit } = update;
      
      try {
        // Buscar categoria
        const category = await Category.findById(categoryId);
        if (!category) {
          results.push({
            categoryId,
            success: false,
            message: 'Categoria não encontrada'
          });
          continue;
        }
        
        // Atualizar preço
        if (price !== undefined) {
          category.price = price;
        }
        
        // Atualizar unidade de preço
        if (priceUnit) {
          category.priceUnit = priceUnit;
        }
        
        await category.save();
        
        results.push({
          categoryId,
          success: true,
          category
        });
      } catch (err) {
        results.push({
          categoryId,
          success: false,
          message: err.message
        });
      }
    }
    
    res.json({
      message: 'Atualização em lote concluída',
      results
    });
  } catch (err) {
    console.error('Erro na atualização em lote:', err);
    res.status(500).json({ message: 'Erro na atualização em lote' });
  }
};

// Obter acesso às categorias de um cliente
exports.getCustomerCategoryAccess = async (req, res) => {
  try {
    const { code } = req.params;
    
    // Buscar cliente
    const customer = await CustomerCode.findOne({ code });
    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    // Buscar acessos às categorias
    const categoryAccess = await CategoryAccess.find({ customerId: customer._id })
      .populate('categoryId', 'name path price');
    
    res.json(categoryAccess);
  } catch (err) {
    console.error('Erro ao buscar acesso às categorias:', err);
    res.status(500).json({ message: 'Erro ao buscar acesso às categorias' });
  }
};

// Conceder acesso a uma categoria
exports.grantCategoryAccess = async (req, res) => {
  try {
    const { code } = req.params;
    const { categoryId, customPrice } = req.body;
    
    // Buscar cliente
    const customer = await CustomerCode.findOne({ code });
    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    // Buscar categoria
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }
    
    // Verificar se já existe acesso
    let access = await CategoryAccess.findOne({
      customerId: customer._id,
      categoryId
    });
    
    if (access) {
      // Atualizar preço personalizado
      if (customPrice !== undefined) {
        access.customPrice = customPrice;
      }
    } else {
      // Criar novo acesso
      access = await CategoryAccess.create({
        customerId: customer._id,
        categoryId,
        customPrice: customPrice !== undefined ? customPrice : null
      });
    }
    
    await access.save();
    
    res.json({
      message: 'Acesso concedido com sucesso',
      access
    });
  } catch (err) {
    console.error('Erro ao conceder acesso:', err);
    res.status(500).json({ message: 'Erro ao conceder acesso' });
  }
};

// Revogar acesso a uma categoria
exports.revokeCategoryAccess = async (req, res) => {
  try {
    const { code, categoryId } = req.params;
    
    // Buscar cliente
    const customer = await CustomerCode.findOne({ code });
    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    // Excluir acesso
    await CategoryAccess.deleteOne({
      customerId: customer._id,
      categoryId
    });
    
    res.json({ message: 'Acesso revogado com sucesso' });
  } catch (err) {
    console.error('Erro ao revogar acesso:', err);
    res.status(500).json({ message: 'Erro ao revogar acesso' });
  }
};

// Conceder acesso a múltiplas categorias
exports.batchCategoryAccess = async (req, res) => {
  try {
    const { code } = req.params;
    const { categories } = req.body;
    
    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ message: 'Dados inválidos' });
    }
    
    // Buscar cliente
    const customer = await CustomerCode.findOne({ code });
    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    const results = [];
    
    // Processar cada categoria
    for (const item of categories) {
      const { categoryId, customPrice, grant } = item;
      
      try {
        if (grant) {
          // Conceder acesso
          let access = await CategoryAccess.findOne({
            customerId: customer._id,
            categoryId
          });
          
          if (access) {
            // Atualizar preço personalizado
            if (customPrice !== undefined) {
              access.customPrice = customPrice;
              await access.save();
            }
          } else {
            // Criar novo acesso
            access = await CategoryAccess.create({
              customerId: customer._id,
              categoryId,
              customPrice: customPrice !== undefined ? customPrice : null
            });
          }
          
          results.push({
            categoryId,
            success: true,
            action: 'grant'
          });
        } else {
          // Revogar acesso
          await CategoryAccess.deleteOne({
            customerId: customer._id,
            categoryId
          });
          
          results.push({
            categoryId,
            success: true,
            action: 'revoke'
          });
        }
      } catch (err) {
        results.push({
          categoryId,
          success: false,
          message: err.message
        });
      }
    }
    
    res.json({
      message: 'Atualizações de acesso concluídas',
      results
    });
  } catch (err) {
    console.error('Erro na atualização em lote de acessos:', err);
    res.status(500).json({ message: 'Erro na atualização em lote de acessos' });
  }
};

// Sincronizar categorias do sistema de arquivos com o banco de dados
exports.syncCategories = async (req, res) => {
  try {
    // Executar sincronização
    const result = await fileService.syncCategoriesWithDB(Category);
    
    res.json({
      message: 'Sincronização concluída com sucesso',
      categoriesCount: result.count,
      newCategories: result.new,
      updatedCategories: result.updated
    });
  } catch (err) {
    console.error('Erro na sincronização de categorias:', err);
    res.status(500).json({ message: 'Erro na sincronização de categorias' });
  }
};