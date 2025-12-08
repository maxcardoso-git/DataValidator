const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB conectado: ${conn.connection.host}`);

    // Criar índices
    await createIndexes();

    return conn;
  } catch (error) {
    console.error(`Erro ao conectar MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const createIndexes = async () => {
  const db = mongoose.connection.db;

  // Índices serão criados automaticamente pelos schemas do Mongoose
  console.log('Índices do MongoDB configurados');
};

module.exports = connectDB;
