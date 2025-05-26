// src/config/database.js
const mongoose = require('mongoose');

// Opções de conexão MongoDB
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: true,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

// Função para conectar ao MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('Variável de ambiente MONGODB_URI não definida');
    }

    await mongoose.connect(uri, options);
    console.log('Conexão com MongoDB estabelecida');
    
    return mongoose.connection;
  } catch (err) {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  }
};

// Função para fechar conexão
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('Conexão com MongoDB fechada');
  } catch (err) {
    console.error('Erro ao fechar conexão com MongoDB:', err);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  closeDB
};