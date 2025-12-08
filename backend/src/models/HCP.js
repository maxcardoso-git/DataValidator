const mongoose = require('mongoose');

// Schema para trilha de auditoria em cada campo
const trilhaAuditoriaItemSchema = new mongoose.Schema({
  data: String,
  usuario: String,
  acao: String,
  valor_anterior: mongoose.Schema.Types.Mixed,
  valor_novo: mongoose.Schema.Types.Mixed
}, { _id: false });

const especialidadeSchema = new mongoose.Schema({
  rqe: String,
  especialidade: String
}, { _id: false });

const crmSchema = new mongoose.Schema({
  ordem: { type: Number, default: 1 },
  score: { type: Number, default: 0 },
  trilha_auditoria: [trilhaAuditoriaItemSchema],
  estado: String,
  inscricao: String,
  tipo: String,
  situacao: String,
  ano_formatura: String,
  instituicao_graduacao: String,
  especialidades: [especialidadeSchema]
}, { _id: false });

const enderecoSchema = new mongoose.Schema({
  ordem: { type: String, default: '1' },
  score: { type: Number, default: 0 },
  trilha_auditoria: [trilhaAuditoriaItemSchema],
  cep: String,
  endereco: String, // Endereço formatado completo
  tipo: String,
  logradouro: String,
  numero: String,
  complemento: String,
  bairro: String,
  municipio: String,
  estado: String,
  pais: { type: String, default: 'BRASIL' },
  latitude: String,
  longitude: String
}, { _id: false });

const telefoneSchema = new mongoose.Schema({
  ordem: { type: String, default: '1' },
  score: { type: Number, default: 0 },
  trilha_auditoria: [trilhaAuditoriaItemSchema],
  telefone: String
}, { _id: false });

const emailSchema = new mongoose.Schema({
  ordem: { type: String, default: '1' },
  score: { type: Number, default: 0 },
  trilha_auditoria: [trilhaAuditoriaItemSchema],
  email: String
}, { _id: false });

const organizacaoSchema = new mongoose.Schema({
  ordem: { type: String, default: '1' },
  score: { type: Number, default: 0 },
  trilha_auditoria: [trilhaAuditoriaItemSchema],
  cnes: String,
  competencia: String,
  vinculo: String,
  atuacao: String,
  situacao: String,
  especialidade: String,
  nome_razao: String,
  nome_fantasia: String,
  cnpj: String,
  endereco: String,
  cep: String
}, { _id: false });

const informacaoAdicionalSchema = new mongoose.Schema({
  laboratorio: String,
  data_carga: String,
  regiao: String,
  supervisor: String,
  ativo: String,
  nome: String,
  regiao_closeup: String,
  id_closeup: String,
  origem: String,
  organizacao: String
}, { _id: false });

const hcpSchema = new mongoose.Schema({
  id_hcp: {
    type: String,
    required: [true, 'ID HCP é obrigatório'],
    unique: true,
    index: true
  },
  nome_medico: {
    type: String,
    required: [true, 'Nome do médico é obrigatório']
  },
  nome_normalizado: {
    type: String,
    index: true
  },
  score: {
    type: Number,
    default: 0
  },
  score_qualidade: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  trilha_auditoria: [trilhaAuditoriaItemSchema],
  status_validacao: {
    type: String,
    enum: ['A_REVISAR', 'VALIDADO', 'REJEITADO', 'CORRIGIR', 'DUPLICADO'],
    default: 'A_REVISAR'
  },
  crm: [crmSchema],
  enderecos: [enderecoSchema],
  telefones: [telefoneSchema],
  emails: [emailSchema],
  organizacoes: [organizacaoSchema],
  informacao_adicional: [informacaoAdicionalSchema],
  // Campos originais do arquivo fonte
  _id_original: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Índices compostos
hcpSchema.index({ 'crm.inscricao': 1, 'crm.estado': 1 });
hcpSchema.index({ 'telefones.telefone': 1 });
hcpSchema.index({ 'emails.email': 1 });
hcpSchema.index({ status_validacao: 1 });
hcpSchema.index({ score_qualidade: 1 });
hcpSchema.index({ score: 1 });

// Middleware para normalizar nome antes de salvar
hcpSchema.pre('save', function(next) {
  if (this.nome_medico) {
    this.nome_normalizado = this.nome_medico
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('HCP', hcpSchema);
