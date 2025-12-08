const express = require('express');
const PDFDocument = require('pdfkit');
const { param } = require('express-validator');
const { HCP, ValidationLog, Decision, Audit } = require('../models');
const { authenticate, hasPermission } = require('../middleware/auth');
const auditService = require('../services/auditService');

const router = express.Router();

/**
 * GET /report/:id_hcp/pdf
 * Gera relatório em PDF
 */
router.get('/:id_hcp/pdf', [
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

    // Busca dados relacionados
    const [lastValidation, decisoes, auditoria] = await Promise.all([
      ValidationLog.findOne({ id_hcp }).sort({ timestamp: -1 }),
      Decision.find({ id_hcp }).sort({ timestamp: -1 }).limit(10),
      Audit.find({ id_hcp }).sort({ timestamp: -1 }).limit(20)
    ]);

    // Registra auditoria
    await auditService.log({
      user: req.user.username,
      role: req.user.role,
      action: 'EXPORT',
      id_hcp,
      metadata: auditService.extractMetadata(req),
      details: { format: 'pdf' }
    });

    // Cria PDF
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio_${id_hcp}.pdf`);

    doc.pipe(res);

    // Cabeçalho
    doc.fontSize(20).text('Relatório de Validação HCP', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
    doc.moveDown(2);

    // Dados do HCP
    doc.fontSize(14).text('Dados do HCP', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`ID: ${hcp.id_hcp}`);
    doc.text(`Nome: ${hcp.nome_medico}`);
    doc.text(`Status: ${hcp.status_validacao}`);
    doc.text(`Score de Qualidade: ${(hcp.score_qualidade * 100).toFixed(1)}%`);
    doc.moveDown();

    // CRMs
    if (hcp.crm && hcp.crm.length > 0) {
      doc.fontSize(12).text('CRMs:', { underline: true });
      doc.fontSize(10);
      hcp.crm.forEach(crm => {
        doc.text(`  • ${crm.inscricao}/${crm.estado} - ${crm.situacao || 'N/A'}`);
        if (crm.especialidades && crm.especialidades.length > 0) {
          crm.especialidades.forEach(esp => {
            doc.text(`    Especialidade: ${esp.especialidade} (RQE: ${esp.rqe})`);
          });
        }
      });
      doc.moveDown();
    }

    // Endereços
    if (hcp.enderecos && hcp.enderecos.length > 0) {
      doc.fontSize(12).text('Endereços:', { underline: true });
      doc.fontSize(10);
      hcp.enderecos.forEach((end, i) => {
        doc.text(`  ${i + 1}. ${end.tipo || 'Outro'}: ${end.logradouro}, ${end.numero}`);
        doc.text(`     ${end.bairro}, ${end.municipio}/${end.estado} - CEP: ${end.cep}`);
      });
      doc.moveDown();
    }

    // Contatos
    doc.fontSize(12).text('Contatos:', { underline: true });
    doc.fontSize(10);
    if (hcp.telefones && hcp.telefones.length > 0) {
      doc.text(`  Telefones: ${hcp.telefones.map(t => t.telefone).join(', ')}`);
    }
    if (hcp.emails && hcp.emails.length > 0) {
      doc.text(`  E-mails: ${hcp.emails.map(e => e.email).join(', ')}`);
    }
    doc.moveDown();

    // Resultados de Validação
    doc.addPage();
    doc.fontSize(14).text('Resultados de Validação', { underline: true });
    doc.moveDown(0.5);

    if (lastValidation && lastValidation.rules_results) {
      const errors = lastValidation.rules_results.filter(r => r.status === 'FAIL' && r.severity === 'ERROR');
      const warnings = lastValidation.rules_results.filter(r => r.status === 'FAIL' && r.severity === 'WARNING');
      const passed = lastValidation.rules_results.filter(r => r.status === 'PASS');

      doc.fontSize(12).fillColor('red').text(`Erros (${errors.length}):`, { underline: true });
      doc.fillColor('black').fontSize(10);
      errors.forEach(rule => {
        doc.text(`  • ${rule.rule_name}: ${rule.details}`);
      });
      doc.moveDown();

      doc.fontSize(12).fillColor('orange').text(`Avisos (${warnings.length}):`, { underline: true });
      doc.fillColor('black').fontSize(10);
      warnings.forEach(rule => {
        doc.text(`  • ${rule.rule_name}: ${rule.details}`);
      });
      doc.moveDown();

      doc.fontSize(12).fillColor('green').text(`Aprovados (${passed.length}):`, { underline: true });
      doc.fillColor('black').fontSize(10);
      passed.forEach(rule => {
        doc.text(`  • ${rule.rule_name}`);
      });
      doc.moveDown();
    } else {
      doc.fontSize(10).text('Nenhuma validação executada.');
      doc.moveDown();
    }

    // Decisões
    doc.fontSize(14).text('Histórico de Decisões', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);

    if (decisoes.length > 0) {
      decisoes.forEach(dec => {
        const data = new Date(dec.timestamp).toLocaleString('pt-BR');
        doc.text(`  • ${data} - ${dec.user} (${dec.role}): ${dec.decision_type}`);
        if (dec.comments) {
          doc.text(`    Comentário: ${dec.comments}`);
        }
      });
    } else {
      doc.text('  Nenhuma decisão registrada.');
    }
    doc.moveDown();

    // Trilha de Auditoria
    doc.fontSize(14).text('Trilha de Auditoria (últimas 20 ações)', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(9);

    if (auditoria.length > 0) {
      auditoria.forEach(log => {
        const data = new Date(log.timestamp).toLocaleString('pt-BR');
        doc.text(`  • ${data} - ${log.user}: ${log.action}`);
      });
    } else {
      doc.text('  Nenhum registro de auditoria.');
    }

    // Rodapé
    doc.moveDown(2);
    doc.fontSize(8).fillColor('gray').text(
      'Este documento foi gerado automaticamente pelo sistema de Validação MDM - HCP',
      { align: 'center' }
    );
    doc.text('Close-Up International - 200DEV', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório PDF.' });
  }
});

/**
 * GET /report/summary
 * Relatório resumido de todos os HCPs
 */
router.get('/summary', [
  authenticate,
  hasPermission('EXPORT_HCP')
], async (req, res) => {
  try {
    const { status, minScore, maxScore } = req.query;

    let match = {};

    if (status) {
      match.status_validacao = status;
    }

    if (minScore !== undefined || maxScore !== undefined) {
      match.score_qualidade = {};
      if (minScore !== undefined) match.score_qualidade.$gte = parseFloat(minScore);
      if (maxScore !== undefined) match.score_qualidade.$lte = parseFloat(maxScore);
    }

    const summary = await HCP.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status_validacao',
          count: { $sum: 1 },
          avgScore: { $avg: '$score_qualidade' }
        }
      }
    ]);

    const totalByScore = await HCP.aggregate([
      { $match: match },
      {
        $bucket: {
          groupBy: '$score_qualidade',
          boundaries: [0, 0.5, 0.7, 0.85, 1.01],
          default: 'other',
          output: {
            count: { $sum: 1 },
            hcps: { $push: '$id_hcp' }
          }
        }
      }
    ]);

    res.json({
      byStatus: summary,
      byScoreRange: totalByScore,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório resumido.' });
  }
});

module.exports = router;
