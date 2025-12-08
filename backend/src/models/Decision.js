const mongoose = require('mongoose');

// Schema para itens individuais na decisão
const itemDecisionSchema = new mongoose.Schema({
  index: { type: Number, required: true },
  value: { type: String }, // Valor do item (telefone, email, etc.) para referência
  label: { type: String }  // Label descritivo do item
}, { _id: false });

const decisionSchema = new mongoose.Schema({
  id_hcp: {
    type: String,
    required: true,
    index: true
  },
  user: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['STEWARD', 'ADMIN'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  decision_type: {
    type: String,
    enum: ['VALIDAR', 'REJEITAR', 'CORRIGIR', 'DUPLICADO', 'NAO_RELACIONADO'],
    required: true
  },
  linked_hcp_id: {
    type: String,
    default: null
  },
  comments: {
    type: String,
    default: ''
  },
  // Legado: mantém compatibilidade com registros antigos
  selected_items: {
    crm: [Number],
    enderecos: [Number],
    telefones: [Number],
    emails: [Number],
    organizacoes: [Number],
    informacao_adicional: [Number]
  },
  // Novo: armazena detalhes dos itens selecionados
  item_details: {
    crm: [itemDecisionSchema],
    enderecos: [itemDecisionSchema],
    telefones: [itemDecisionSchema],
    emails: [itemDecisionSchema],
    organizacoes: [itemDecisionSchema],
    informacao_adicional: [itemDecisionSchema]
  }
});

// Índices para consultas frequentes
decisionSchema.index({ id_hcp: 1, timestamp: -1 });
decisionSchema.index({ user: 1, timestamp: -1 });
decisionSchema.index({ decision_type: 1 });

module.exports = mongoose.model('Decision', decisionSchema);
