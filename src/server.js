// src/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { connectDB } = require('./config/database');
const fileService = require('./services/fileService');

// Importar rotas
const authRoutes = require('./routes/auth');
const galleryRoutes = require('./routes/gallery');
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/orders');

// Inicializar app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static('public'));

// Middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);

// Servir imagens do storage
app.use('/images/categories', express.static(path.join(fileService.categoriesPath)));
app.use('/images/thumbnails', express.static(path.join(fileService.thumbnailsPath)));

// Rota principal - serve o frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rota do painel admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Rota de status (health check)
app.get('/api/status', async (req, res) => {
  try {
    // Obter estatísticas de armazenamento
    const storageStats = await fileService.getStorageStats();
    
    res.json({
      status: 'online',
      timestamp: new Date(),
      environment: process.env.NODE_ENV,
      storage: storageStats
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  res.status(err.status || 500).json({
    message: err.message || 'Erro interno do servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Função para iniciar o servidor
const startServer = async () => {
  try {
    // Conectar ao MongoDB
    await connectDB();
    
    // Garantir que as pastas do storage existam
    await fileService.ensureDirectories();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Storage: ${fileService.storagePath}`);
    });
  } catch (err) {
    console.error('Erro ao iniciar servidor:', err);
    process.exit(1);
  }
};

// Tratamento de sinais de encerramento
process.on('SIGTERM', () => {
  console.log('Sinal SIGTERM recebido. Encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Sinal SIGINT recebido. Encerrando servidor...');
  process.exit(0);
});

// Iniciar servidor
startServer();