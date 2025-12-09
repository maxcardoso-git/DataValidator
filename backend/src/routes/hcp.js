const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const { HCP, Decision, ValidationLog } = require('../models');
const { authenticate, hasPermission } = require('../middleware/auth');
const validationService = require('../services/validationService');
const auditService = require('../services/auditService');

const router = express.Router();

/**
 * GET /hcp/search
 * Busca registros de HCP
 */
router.get('/search', [
  authenticate,
  hasPermission('SEARCH_HCP'),
  query('q').optional().trim(),
  query('type').optional().isIn(['nome', 'crm', 'id', 'telefone', 'email', 'endereco', 'organizacao', 'cnes', 'cnpj', 'todos']),
  query('status').optional().isIn(['A_REVISAR', 'VALIDADO', 'REJEITADO', 'CORRIGIR', 'DUPLICADO']),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q = '', type = 'nome', status, limit = 20, offset = 0 } = req.query;

    let filter = {};

    // Filtro de busca
    if (q) {
      const searchRegex = { $regex: q, $options: 'i' };

      switch (type) {
        case 'id':
          filter.id_hcp = searchRegex;
          break;
        case 'crm':
          filter['crm.inscricao'] = searchRegex;
          break;
        case 'telefone':
          filter['telefones.telefone'] = searchRegex;
          break;
        case 'email':
          filter['emails.email'] = searchRegex;
          break;
        case 'endereco':
          filter.$or = [
            { 'enderecos.endereco': searchRegex },
            { 'enderecos.logradouro': searchRegex },
            { 'enderecos.bairro': searchRegex },
            { 'enderecos.municipio': searchRegex },
            { 'enderecos.cep': searchRegex }
          ];
          break;
        case 'organizacao':
          filter.$or = [
            { 'organizacoes.nome_fantasia': searchRegex },
            { 'organizacoes.nome_razao': searchRegex }
          ];
          break;
        case 'cnes':
          filter['organizacoes.cnes'] = searchRegex;
          break;
        case 'cnpj':
          filter['organizacoes.cnpj'] = searchRegex;
          break;
        case 'todos':
          // Busca em todos os campos principais
          filter.$or = [
            { nome_medico: searchRegex },
            { nome_normalizado: { $regex: q.toUpperCase(), $options: 'i' } },
            { id_hcp: searchRegex },
            { 'crm.inscricao': searchRegex },
            { 'telefones.telefone': searchRegex },
            { 'emails.email': searchRegex },
            { 'enderecos.endereco': searchRegex },
            { 'enderecos.logradouro': searchRegex },
            { 'enderecos.municipio': searchRegex },
            { 'enderecos.cep': searchRegex },
            { 'organizacoes.nome_fantasia': searchRegex },
            { 'organizacoes.nome_razao': searchRegex },
            { 'organizacoes.cnes': searchRegex },
            { 'organizacoes.cnpj': searchRegex }
          ];
          break;
        case 'nome':
        default:
          filter.$or = [
            { nome_medico: searchRegex },
            { nome_normalizado: { $regex: q.toUpperCase(), $options: 'i' } }
          ];
          break;
      }
    }

    // Filtro por status
    if (status) {
      filter.status_validacao = status;
    }

    // Busca com paginação
    const [items, total] = await Promise.all([
      HCP.find(filter)
        .select('id_hcp nome_medico crm score_qualidade status_validacao')
        .sort({ updated_at: -1 })
        .skip(offset)
        .limit(limit),
      HCP.countDocuments(filter)
    ]);

    // Formata resultados
    const formattedItems = items.map(hcp => ({
      id_hcp: hcp.id_hcp,
      nome_medico: hcp.nome_medico,
      crm_principal: hcp.crm && hcp.crm[0]
        ? `${hcp.crm[0].inscricao}/${hcp.crm[0].estado}`
        : '-',
      score_qualidade: hcp.score_qualidade,
      status_validacao: hcp.status_validacao
    }));

    // Registra auditoria
    await auditService.log({
      user: req.user.username,
      role: req.user.role,
      action: 'SEARCH',
      metadata: auditService.extractMetadata(req),
      details: { query: q, type, results: total }
    });

    res.json({
      items: formattedItems,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Erro na busca:', error);
    res.status(500).json({ error: 'Erro ao buscar registros.' });
  }
});

/**
 * GET /hcp/:id_hcp
 * Retorna registro completo de HCP
 */
router.get('/:id_hcp', [
  authenticate,
  hasPermission('VIEW_HCP'),
  param('id_hcp').notEmpty()
], async (req, res) => {
  try {
    const { id_hcp } = req.params;

    const hcp = await HCP.findOne({ id_hcp });

    if (!hcp) {
      return res.status(404).json({ error: 'HCP não encontrado.' });
    }

    // Busca último log de validação
    const lastValidation = await validationService.getLastValidation(id_hcp);

    // Busca decisões
    const decisions = await Decision.find({ id_hcp })
      .sort({ timestamp: -1 })
      .limit(10);

    // Registra auditoria
    await auditService.log({
      user: req.user.username,
      role: req.user.role,
      action: 'VIEW_HCP',
      id_hcp,
      metadata: auditService.extractMetadata(req)
    });

    res.json({
      hcp,
      validation: lastValidation,
      decisions
    });
  } catch (error) {
    console.error('Erro ao buscar HCP:', error);
    res.status(500).json({ error: 'Erro ao buscar registro.' });
  }
});

/**
 * POST /hcp/:id_hcp/validate
 * Executa validações automáticas
 */
router.post('/:id_hcp/validate', [
  authenticate,
  hasPermission('VALIDATE_HCP'),
  param('id_hcp').notEmpty()
], async (req, res) => {
  try {
    const { id_hcp } = req.params;

    const result = await validationService.validateHcp(id_hcp);

    // Registra auditoria
    await auditService.log({
      user: req.user.username,
      role: req.user.role,
      action: 'UPDATE_HCP',
      id_hcp,
      metadata: auditService.extractMetadata(req),
      details: { action: 'validate', score: result.score_calculado }
    });

    res.json(result);
  } catch (error) {
    console.error('Erro na validação:', error);
    res.status(500).json({ error: error.message || 'Erro ao validar registro.' });
  }
});

/**
 * POST /hcp/:id_hcp/decision
 * Grava decisão manual do Data Steward
 */
router.post('/:id_hcp/decision', [
  authenticate,
  hasPermission('VALIDATE_HCP'),
  param('id_hcp').notEmpty(),
  body('decision_type').isIn(['VALIDAR', 'REJEITAR', 'CORRIGIR', 'DUPLICADO', 'NAO_RELACIONADO']),
  body('linked_hcp_id').optional().trim(),
  body('comments').optional().trim(),
  body('selected_items').optional(),
  body('item_details').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id_hcp } = req.params;
    const { decision_type, linked_hcp_id, comments, selected_items, item_details } = req.body;

    // Verifica se HCP existe
    const hcp = await HCP.findOne({ id_hcp });
    if (!hcp) {
      return res.status(404).json({ error: 'HCP não encontrado.' });
    }

    // Cria decisão com detalhes dos itens
    const decision = new Decision({
      id_hcp,
      user: req.user.username,
      role: req.user.role,
      decision_type,
      linked_hcp_id: linked_hcp_id || null,
      comments: comments || '',
      selected_items: selected_items || null,
      item_details: item_details || null,
      timestamp: new Date()
    });

    await decision.save();

    // Atualiza status do HCP baseado na decisão
    const statusMap = {
      'VALIDAR': 'VALIDADO',
      'REJEITAR': 'REJEITADO',
      'CORRIGIR': 'CORRIGIR',
      'DUPLICADO': 'DUPLICADO',
      'NAO_RELACIONADO': 'A_REVISAR'
    };

    await HCP.updateOne(
      { id_hcp },
      {
        status_validacao: statusMap[decision_type],
        updated_at: new Date()
      }
    );

    // Registra auditoria
    await auditService.log({
      user: req.user.username,
      role: req.user.role,
      action: 'DECISION',
      id_hcp,
      metadata: auditService.extractMetadata(req),
      details: { decision_type, linked_hcp_id, comments, item_details }
    });

    res.json({
      message: 'Decisão registrada com sucesso.',
      decision
    });
  } catch (error) {
    console.error('Erro ao registrar decisão:', error);
    res.status(500).json({ error: 'Erro ao registrar decisão.' });
  }
});

/**
 * GET /hcp/compare
 * Compara dois registros HCP
 */
router.get('/compare/records', [
  authenticate,
  hasPermission('COMPARE_HCP'),
  query('id_a').notEmpty(),
  query('id_b').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id_a, id_b } = req.query;

    const [registro_a, registro_b] = await Promise.all([
      HCP.findOne({ id_hcp: id_a }),
      HCP.findOne({ id_hcp: id_b })
    ]);

    if (!registro_a || !registro_b) {
      return res.status(404).json({
        error: 'Um ou ambos os registros não foram encontrados.'
      });
    }

    // Registra auditoria
    await auditService.log({
      user: req.user.username,
      role: req.user.role,
      action: 'COMPARE',
      metadata: auditService.extractMetadata(req),
      details: { id_a, id_b }
    });

    res.json({
      registro_a,
      registro_b
    });
  } catch (error) {
    console.error('Erro na comparação:', error);
    res.status(500).json({ error: 'Erro ao comparar registros.' });
  }
});

/**
 * GET /hcp/:id_hcp/report
 * Gera relatório consolidado em JSON
 */
router.get('/:id_hcp/report', [
  authenticate,
  hasPermission('EXPORT_HCP'),
  param('id_hcp').notEmpty()
], async (req, res) => {
  try {
    const { id_hcp } = req.params;

    const hcp = await HCP.findOne({ id_hcp });

    if (!hcp) {
      return res.status(404).json({ error: 'HCP não encontrado.' });
    }

    // Busca validações
    const lastValidation = await ValidationLog.findOne({ id_hcp })
      .sort({ timestamp: -1 });

    // Busca decisões
    const decisoes = await Decision.find({ id_hcp })
      .sort({ timestamp: -1 });

    // Busca auditoria
    const auditoria = await auditService.getByHcp(id_hcp, 20);

    // Separa erros e avisos
    const rules_results = lastValidation?.rules_results || [];
    const erros = rules_results.filter(r => r.status === 'FAIL' && r.severity === 'ERROR');
    const avisos = rules_results.filter(r => r.status === 'FAIL' && r.severity === 'WARNING');

    // Registra auditoria
    await auditService.log({
      user: req.user.username,
      role: req.user.role,
      action: 'EXPORT',
      id_hcp,
      metadata: auditService.extractMetadata(req),
      details: { format: 'json' }
    });

    res.json({
      hcp: {
        id_hcp: hcp.id_hcp,
        nome_medico: hcp.nome_medico,
        crm_principal: hcp.crm && hcp.crm[0]
          ? `${hcp.crm[0].inscricao}/${hcp.crm[0].estado}`
          : '-',
        status_validacao: hcp.status_validacao
      },
      score_final: hcp.score_qualidade,
      erros,
      avisos,
      decisoes,
      auditoria
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório.' });
  }
});

/**
 * GET /hcp/:id_hcp/audit
 * Retorna histórico de auditoria do HCP
 */
router.get('/:id_hcp/audit', [
  authenticate,
  hasPermission('VIEW_HCP'),
  param('id_hcp').notEmpty()
], async (req, res) => {
  try {
    const { id_hcp } = req.params;
    const auditoria = await auditService.getByHcp(id_hcp, 50);

    res.json({ auditoria });
  } catch (error) {
    console.error('Erro ao buscar auditoria:', error);
    res.status(500).json({ error: 'Erro ao buscar auditoria.' });
  }
});

module.exports = router;
