const mongoose = require('mongoose');

const metadataSchema = new mongoose.Schema({
  ip: String,
  user_agent: String
}, { _id: false });

const auditSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['LOGIN', 'LOGOUT', 'VIEW_HCP', 'UPDATE_HCP', 'DECISION', 'UPLOAD_DATA', 'EXPORT', 'SEARCH', 'COMPARE'],
    required: true
  },
  id_hcp: {
    type: String,
    default: null
  },
  metadata: metadataSchema,
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Índices para consultas de auditoria
auditSchema.index({ user: 1, timestamp: -1 });
auditSchema.index({ action: 1, timestamp: -1 });
auditSchema.index({ id_hcp: 1, timestamp: -1 });
auditSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Audit', auditSchema);
