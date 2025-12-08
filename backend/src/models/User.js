const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username é obrigatório'],
    unique: true,
    trim: true,
    minlength: [3, 'Username deve ter no mínimo 3 caracteres']
  },
  password_hash: {
    type: String,
    required: [true, 'Senha é obrigatória']
  },
  role: {
    type: String,
    enum: ['ADMIN', 'STEWARD', 'VIEWER'],
    default: 'VIEWER'
  },
  active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Índice único para username
userSchema.index({ username: 1 }, { unique: true });

// Hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  this.updated_at = Date.now();
  next();
});

// Método para verificar senha
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

// Método para retornar usuário sem senha
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password_hash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
