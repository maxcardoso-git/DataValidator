const mongoose = require('mongoose');

const uploadSessionSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['RECEBIDO', 'PROCESSANDO', 'CONCLUIDO', 'ERRO'],
    default: 'RECEBIDO'
  },
  records_processed: {
    type: Number,
    default: 0
  },
  records_with_error: {
    type: Number,
    default: 0
  },
  started_at: {
    type: Date,
    default: Date.now
  },
  finished_at: {
    type: Date,
    default: null
  },
  log: {
    type: String,
    default: ''
  }
});

// Índice para busca por usuário e data
uploadSessionSchema.index({ user: 1, started_at: -1 });
uploadSessionSchema.index({ status: 1 });

module.exports = mongoose.model('UploadSession', uploadSessionSchema);
