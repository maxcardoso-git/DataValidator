const mongoose = require('mongoose');

const ruleResultSchema = new mongoose.Schema({
  rule_id: {
    type: String,
    required: true
  },
  rule_name: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'ERROR'],
    required: true
  },
  status: {
    type: String,
    enum: ['PASS', 'FAIL'],
    required: true
  },
  details: String
}, { _id: false });

const validationLogSchema = new mongoose.Schema({
  id_hcp: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  rules_results: [ruleResultSchema],
  score_calculado: {
    type: Number,
    min: 0,
    max: 1
  }
});

// Índice composto para busca rápida
validationLogSchema.index({ id_hcp: 1, timestamp: -1 });

module.exports = mongoose.model('ValidationLog', validationLogSchema);
