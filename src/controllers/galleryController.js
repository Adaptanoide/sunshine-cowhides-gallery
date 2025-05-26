// src/controllers/galleryController.js
const Category = require('../models/category');
const CustomerCode = require('../models/customerCode');
const CategoryAccess = require('../models/categoryAccess');
const fileService = require('../services/fileService');
const mongoose = require('mongoose');

// Obter categorias acessíveis para o cliente
exports.getCategories = async (req, res) => {
  try {
    const { parentPath = '' } = req.query;
    const { role, id, code } = req.user;
    
    // Construir query base
    let query = { parentPath };
    
    // Filtrar por categorias acessíveis para o cliente
    if (role === 'customer') {
      // Buscar cliente
      const customer = await CustomerCode.findOne({ code });
      if (!customer) {
        return res.status(404).json({ message: 'Cliente não encontrado' });
      }
      
      // Registrar último acesso
      customer.lastLogin = new Date();
      await customer.save();
      
      // Buscar IDs de categorias acessíveis
      const accessibleCategories = await CategoryAccess.find({ customerId: customer._id });
      const accessibleCategoryIds = accessibleCategories.map(access => access.categoryId);
      
      // Adicionar filtro por IDs acessíveis
      if (accessibleCategoryIds.length > 0) {
        query._id = { $in: accessibleCategoryIds };
      } else {
        // Se não houver categorias acessíveis, retornar lista vazia
        return res.json([]);
      }
    }
    
    // Buscar categorias
    const categories = await Category.find(query).sort('name');
    
    // Se for cliente, adicionar preços personalizados
    if (role === 'customer') {
      const customer = await CustomerCode.findOne({ code });
      
      // Para cada categoria, verificar se há preço personalizado
      const categoriesWithPrices = await Promise.all(categories.map(async (category) => {
        const categoryObj = category.toObject();
        
        // Buscar acesso com preço personalizado
        const access = await CategoryAccess.findOne({
          customerId: customer._id,
          categoryId: category._id
        });
        
        // Se houver preço personalizado, substituir o preço padrão
        if (access && access.customPrice !== null) {
          categoryObj.price = access.customPrice;
        }
        
        return categoryObj;
      }));
      
      // Incrementar contagem de visualizações
      for (const category of categories) {
        category.views += 1;
        await category.save();
      }
      
      return res.json(categoriesWithPrices);
    }
    
    // Para admin, retornar todas as categorias normalmente
    res.json(categories);
  } catch (err) {
    console.error('Erro ao buscar categorias:', err);
    res.status(500).json({ message: 'Erro ao buscar categorias' });
  }
};

// Obter imagens de uma categoria
exports.getImages = async (req, res) => {
  try {
    const { categoryPath } = req.params;
    const { role, code } = req.user;
    
    // Verificar se categoria existe
    const category = await Category.findOne({ path: categoryPath });
    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }
    
    // Se for cliente, verificar acesso
    if (role === 'customer') {
      // Buscar cliente
      const customer = await CustomerCode.findOne({ code });
      if (!customer) {
        return res.status(404).json({ message: 'Cliente não encontrado' });
      }
      
      // Verificar se cliente tem acesso a esta categoria
      const access = await CategoryAccess.findOne({
        customerId: customer._id,
        categoryId: category._id
      });
      
      if (!access) {
        return res.status(403).json({ message: 'Acesso negado a esta categoria' });
      }
      
      // Obter preço (personalizado ou padrão)
      let price = category.price;
      if (access.customPrice !== null) {
        price = access.customPrice;
      }
      
      // Buscar imagens
      const images = await fileService.listImages(categoryPath);
      
      // Atualizar contagem de imagens se necessário
      if (category.imageCount !== images.length) {
        category.imageCount = images.length;
        await category.save();
      }
      
      return res.json({
        category: {
          ...category.toObject(),
          price
        },
        images
      });
    }
    
    // Para admin, retornar normalmente
    const images = await fileService.listImages(categoryPath);
    
    // Atualizar contagem de imagens se necessário
    if (category.imageCount !== images.length) {
      category.imageCount = images.length;
      await category.save();
    }
    
    res.json({
      category,
      images
    });
  } catch (err) {
    console.error('Erro ao buscar imagens:', err);
    res.status(500).json({ message: 'Erro ao buscar imagens' });
  }
};

// Obter todas as categorias para o cliente atual (incluindo subcategorias)
exports.getAllClientCategories = async (req, res) => {
  try {
    const { code } = req.user;
    
    // Buscar cliente
    const customer = await CustomerCode.findOne({ code });
    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    // Buscar IDs de categorias acessíveis
    const accessibleCategories = await CategoryAccess.find({ customerId: customer._id });
    const accessibleCategoryIds = accessibleCategories.map(access => access.categoryId);
    
    if (accessibleCategoryIds.length === 0) {
      return res.json([]);
    }
    
    // Buscar categorias com preços personalizados
    const categories = await Category.find({ _id: { $in: accessibleCategoryIds } }).sort('name');
    
    // Para cada categoria, verificar se há preço personalizado
    const categoriesWithPrices = await Promise.all(categories.map(async (category) => {
      const categoryObj = category.toObject();
      
      // Buscar acesso com preço personalizado
      const access = await CategoryAccess.findOne({
        customerId: customer._id,
        categoryId: category._id
      });
      
      // Se houver preço personalizado, substituir o preço padrão
      if (access && access.customPrice !== null) {
        categoryObj.price = access.customPrice;
      }
      
      return categoryObj;
    }));
    
    res.json(categoriesWithPrices);
  } catch (err) {
    console.error('Erro ao buscar todas as categorias do cliente:', err);
    res.status(500).json({ message: 'Erro ao buscar categorias' });
  }
};

// Pesquisar categorias
exports.searchCategories = async (req, res) => {
  try {
    const { query } = req.query;
    const { role, code } = req.user;
    
    if (!query) {
      return res.status(400).json({ message: 'Termo de pesquisa necessário' });
    }
    
    // Construir query para pesquisa
    let searchQuery = {
      name: { $regex: query, $options: 'i' }
    };
    
    // Filtrar por categorias acessíveis para o cliente
    if (role === 'customer') {
      // Buscar cliente
      const customer = await CustomerCode.findOne({ code });
      if (!customer) {
        return res.status(404).json({ message: 'Cliente não encontrado' });
      }
      
      // Buscar IDs de categorias acessíveis
      const accessibleCategories = await CategoryAccess.find({ customerId: customer._id });
      const accessibleCategoryIds = accessibleCategories.map(access => access.categoryId);
      
      // Adicionar filtro por IDs acessíveis
      if (accessibleCategoryIds.length > 0) {
        searchQuery._id = { $in: accessibleCategoryIds };
      } else {
        // Se não houver categorias acessíveis, retornar lista vazia
        return res.json([]);
      }
    }
    
    // Buscar categorias
    const categories = await Category.find(searchQuery).sort('name').limit(20);
    
    // Se for cliente, adicionar preços personalizados
    if (role === 'customer') {
      const customer = await CustomerCode.findOne({ code });
      
      // Para cada categoria, verificar se há preço personalizado
      const categoriesWithPrices = await Promise.all(categories.map(async (category) => {
        const categoryObj = category.toObject();
        
        // Buscar acesso com preço personalizado
        const access = await CategoryAccess.findOne({
          customerId: customer._id,
          categoryId: category._id
        });
        
        // Se houver preço personalizado, substituir o preço padrão
        if (access && access.customPrice !== null) {
          categoryObj.price = access.customPrice;
        }
        
        return categoryObj;
      }));
      
      return res.json(categoriesWithPrices);
    }
    
    // Para admin, retornar todas as categorias normalmente
    res.json(categories);
  } catch (err) {
    console.error('Erro na pesquisa de categorias:', err);
    res.status(500).json({ message: 'Erro na pesquisa' });
  }
};