// src/services/fileService.js
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

class FileService {
  constructor(storagePath) {
    this.storagePath = storagePath || process.env.STORAGE_PATH || path.join(__dirname, '../../storage');
    this.categoriesPath = path.join(this.storagePath, 'categories');
    this.thumbnailsPath = path.join(this.storagePath, 'thumbnails');
    this.ordersPath = path.join(this.storagePath, 'orders');
    
    // Garantir que as pastas existam
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
      await fs.mkdir(this.categoriesPath, { recursive: true });
      await fs.mkdir(this.thumbnailsPath, { recursive: true });
      await fs.mkdir(path.join(this.thumbnailsPath, 'small'), { recursive: true });
      await fs.mkdir(path.join(this.thumbnailsPath, 'medium'), { recursive: true });
      await fs.mkdir(path.join(this.thumbnailsPath, 'large'), { recursive: true });
      await fs.mkdir(this.ordersPath, { recursive: true });
      await fs.mkdir(path.join(this.ordersPath, 'waiting'), { recursive: true });
      await fs.mkdir(path.join(this.ordersPath, 'paid'), { recursive: true });
      console.log('Diretórios do storage verificados com sucesso');
    } catch (err) {
      console.error('Erro ao criar diretórios:', err);
      throw err;
    }
  }

  // Listar categorias (pastas)
  async listCategories(parentPath = '') {
    try {
      const targetPath = path.join(this.categoriesPath, parentPath);
      
      try {
        await fs.access(targetPath);
      } catch (err) {
        // Se o diretório não existir, retornar lista vazia
        return [];
      }
      
      const items = await fs.readdir(targetPath, { withFileTypes: true });
      
      const directories = [];
      
      for (const item of items) {
        if (item.isDirectory()) {
          const fullPath = parentPath ? path.join(parentPath, item.name) : item.name;
          directories.push({
            name: item.name,
            path: fullPath,
            parentPath: parentPath || null
          });
        }
      }
      
      return directories;
    } catch (err) {
      console.error(`Erro ao listar categorias em ${parentPath}:`, err);
      throw err;
    }
  }

  // Listar imagens em uma categoria
  async listImages(categoryPath) {
    try {
      const targetPath = path.join(this.categoriesPath, categoryPath);
      
      try {
        await fs.access(targetPath);
      } catch (err) {
        // Se o diretório não existir, retornar lista vazia
        return [];
      }
      
      const items = await fs.readdir(targetPath, { withFileTypes: true });
      
      const images = [];
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
      
      for (const item of items) {
        if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase();
          if (validExtensions.includes(ext)) {
            const imagePath = path.join(categoryPath, item.name);
            
            // Criar thumbnails para a imagem
            const thumbnails = await this.createAllThumbnails(imagePath);
            
            images.push({
              name: item.name,
              path: imagePath,
              thumbnails
            });
          }
        }
      }
      
      return images;
    } catch (err) {
      console.error(`Erro ao listar imagens em ${categoryPath}:`, err);
      throw err;
    }
  }

  // Criar todos os tamanhos de thumbnail para uma imagem
  async createAllThumbnails(imagePath) {
    try {
      const sizes = {
        small: 200,
        medium: 400,
        large: 800
      };
      
      const thumbnails = {};
      
      for (const [size, width] of Object.entries(sizes)) {
        thumbnails[size] = await this.ensureThumbnail(imagePath, size, width);
      }
      
      return thumbnails;
    } catch (err) {
      console.error(`Erro ao criar thumbnails para ${imagePath}:`, err);
      // Retornar objeto vazio em caso de erro
      return {};
    }
  }

  // Criar/garantir que o thumbnail existe
  async ensureThumbnail(imagePath, size = 'medium', width = 400) {
    try {
      const sourcePath = path.join(this.categoriesPath, imagePath);
      const thumbDir = path.join(this.thumbnailsPath, size, path.dirname(imagePath));
      const thumbName = `${path.basename(imagePath, path.extname(imagePath))}.webp`;
      const thumbPath = path.join(thumbDir, thumbName);
      
      // Verificar se o thumbnail já existe
      try {
        await fs.access(thumbPath);
        return path.join(size, path.dirname(imagePath), thumbName); // Thumbnail já existe
      } catch (err) {
        // Thumbnail não existe, criar
        await fs.mkdir(thumbDir, { recursive: true });
        
        await sharp(sourcePath)
          .resize(width)
          .webp({ quality: 80 })
          .toFile(thumbPath);
          
        return path.join(size, path.dirname(imagePath), thumbName);
      }
    } catch (err) {
      console.error(`Erro ao criar thumbnail para ${imagePath}:`, err);
      // Retornar caminho vazio em caso de erro
      return '';
    }
  }

  // Sincronizar estrutura de pastas do storage com o banco de dados
  async syncCategoriesWithDB(categoryModel) {
    try {
      // Listar todas as categorias no sistema de arquivos
      const fileSystemCategories = await this.getAllCategories();
      
      let newCount = 0;
      let updateCount = 0;
      
      // Para cada categoria, atualizar ou criar no banco de dados
      for (const category of fileSystemCategories) {
        const existingCategory = await categoryModel.findOne({ path: category.path });
        
        if (existingCategory) {
          // Atualizar categoria existente
          existingCategory.name = category.name;
          existingCategory.parentPath = category.parentPath;
          
          await existingCategory.save();
          updateCount++;
        } else {
          // Criar nova categoria
          await categoryModel.create({
            name: category.name,
            path: category.path,
            parentPath: category.parentPath,
            price: 0, // Preço padrão
            active: true
          });
          newCount++;
        }
      }
      
      console.log(`Sincronização concluída: ${fileSystemCategories.length} categorias (${newCount} novas, ${updateCount} atualizadas)`);
      
      return {
        count: fileSystemCategories.length,
        new: newCount,
        updated: updateCount
      };
    } catch (err) {
      console.error('Erro ao sincronizar categorias:', err);
      throw err;
    }
  }

  // Obter todas as categorias recursivamente
  async getAllCategories(parentPath = '') {
    const categories = await this.listCategories(parentPath);
    let allCategories = [...categories];
    
    // Recursivamente obter subcategorias
    for (const category of categories) {
      const subcategories = await this.getAllCategories(category.path);
      allCategories = [...allCategories, ...subcategories];
    }
    
    return allCategories;
  }

  // Criar pasta de pedido
  async createOrderFolder(order) {
    try {
      const { customerName, _id: orderId, items } = order;
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      const folderName = `${customerName} ${items.length}un ${dateStr} [${orderId}]`;
      const orderPath = path.join(this.ordersPath, 'waiting', folderName);
      
      // Criar pasta principal do pedido
      await fs.mkdir(orderPath, { recursive: true });
      
      // Agrupar itens por categoria
      const categorizedItems = {};
      for (const item of items) {
        if (!categorizedItems[item.categoryName]) {
          categorizedItems[item.categoryName] = [];
        }
        categorizedItems[item.categoryName].push(item);
      }
      
      // Criar subpastas por categoria e copiar imagens
      for (const [categoryName, categoryItems] of Object.entries(categorizedItems)) {
        const categoryPath = path.join(orderPath, categoryName);
        await fs.mkdir(categoryPath, { recursive: true });
        
        // Copiar imagens
        for (const item of categoryItems) {
          const sourcePath = path.join(this.categoriesPath, item.imagePath);
          const fileName = path.basename(item.imagePath);
          const destPath = path.join(categoryPath, fileName);
          
          await fs.copyFile(sourcePath, destPath);
        }
      }
      
      return {
        folderPath: path.join('waiting', folderName),
        fullPath: orderPath
      };
    } catch (err) {
      console.error('Erro ao criar pasta de pedido:', err);
      throw err;
    }
  }

  // Mover pedido para "pago"
  async moveOrderToPaid(order) {
    try {
      const sourcePath = path.join(this.ordersPath, order.folderPath);
      const destPath = path.join(this.ordersPath, 'paid', path.basename(order.folderPath));
      
      // Verificar se pasta de origem existe
      try {
        await fs.access(sourcePath);
      } catch (err) {
        throw new Error('Pasta do pedido não encontrada');
      }
      
      // Mover pasta
      await fs.rename(sourcePath, destPath);
      
      return {
        folderPath: path.join('paid', path.basename(order.folderPath)),
        fullPath: destPath
      };
    } catch (err) {
      console.error('Erro ao mover pedido para pago:', err);
      throw err;
    }
  }

  // Obter informações sobre o armazenamento
  async getStorageStats() {
    try {
      const categoriesStats = await this.getDirectoryStats(this.categoriesPath);
      const thumbnailsStats = await this.getDirectoryStats(this.thumbnailsPath);
      const ordersStats = await this.getDirectoryStats(this.ordersPath);
      
      return {
        categories: categoriesStats,
        thumbnails: thumbnailsStats,
        orders: ordersStats,
        total: {
          size: categoriesStats.size + thumbnailsStats.size + ordersStats.size,
          files: categoriesStats.files + thumbnailsStats.files + ordersStats.files,
          directories: categoriesStats.directories + thumbnailsStats.directories + ordersStats.directories
        }
      };
    } catch (err) {
      console.error('Erro ao obter estatísticas de armazenamento:', err);
      throw err;
    }
  }

  // Obter estatísticas de um diretório
  async getDirectoryStats(dirPath) {
    try {
      let size = 0;
      let files = 0;
      let directories = 0;
      
      const items = await this.readDirRecursive(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          directories++;
        } else if (stats.isFile()) {
          files++;
          size += stats.size;
        }
      }
      
      return {
        size,
        files,
        directories
      };
    } catch (err) {
      console.error(`Erro ao obter estatísticas de ${dirPath}:`, err);
      return {
        size: 0,
        files: 0,
        directories: 0
      };
    }
  }

  // Ler diretório recursivamente
  async readDirRecursive(dir, allFiles = []) {
    try {
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          allFiles.push(filePath);
          await this.readDirRecursive(filePath, allFiles);
        } else {
          allFiles.push(filePath);
        }
      }
      
      return allFiles;
    } catch (err) {
      console.error(`Erro ao ler diretório ${dir}:`, err);
      return [];
    }
  }
}

module.exports = new FileService();