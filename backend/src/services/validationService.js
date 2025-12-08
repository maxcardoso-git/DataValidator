const { HCP, ValidationLog } = require('../models');

/**
 * Regras de validação automática para HCPs
 */
const VALIDATION_RULES = [
  {
    id: 'CRM_UNICO_HCP',
    name: 'CRM Único por HCP',
    description: 'Verifica se cada CRM pertence a um único HCP.',
    severity: 'ERROR',
    validate: async (hcp) => {
      const results = [];

      for (const crm of hcp.crm || []) {
        if (!crm.inscricao || !crm.estado) continue;

        const count = await HCP.countDocuments({
          'crm.inscricao': crm.inscricao,
          'crm.estado': crm.estado,
          id_hcp: { $ne: hcp.id_hcp }
        });

        if (count > 0) {
          results.push({
            status: 'FAIL',
            details: `CRM ${crm.inscricao}/${crm.estado} encontrado em ${count} outro(s) HCP(s).`
          });
        }
      }

      return results.length > 0
        ? { status: 'FAIL', details: results.map(r => r.details).join('; ') }
        : { status: 'PASS', details: 'Todos os CRMs são únicos.' };
    }
  },
  {
    id: 'TELEFONE_FORMATO',
    name: 'Formato de Telefone',
    description: 'Verifica se todos os telefones possuem entre 10 e 13 dígitos numéricos.',
    severity: 'WARNING',
    validate: async (hcp) => {
      const telefones = hcp.telefones || [];
      const invalidos = [];

      for (const tel of telefones) {
        if (!tel.telefone) continue;

        const numeros = tel.telefone.replace(/\D/g, '');
        if (numeros.length < 10 || numeros.length > 13) {
          invalidos.push(tel.telefone);
        }
      }

      if (invalidos.length > 0) {
        return {
          status: 'FAIL',
          details: `Telefones com formato inválido: ${invalidos.join(', ')}`
        };
      }

      return { status: 'PASS', details: 'Todos os telefones possuem formato válido.' };
    }
  },
  {
    id: 'EMAIL_FORMATO',
    name: 'Formato de E-mail',
    description: 'Verifica se os e-mails são válidos.',
    severity: 'ERROR',
    validate: async (hcp) => {
      const emails = hcp.emails || [];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidos = [];

      for (const e of emails) {
        if (!e.email) continue;

        if (!emailRegex.test(e.email)) {
          invalidos.push(e.email);
        }
      }

      if (invalidos.length > 0) {
        return {
          status: 'FAIL',
          details: `E-mails inválidos: ${invalidos.join(', ')}`
        };
      }

      return { status: 'PASS', details: 'Todos os e-mails possuem formato válido.' };
    }
  },
  {
    id: 'ENDERECO_COMPLETO',
    name: 'Endereço Completo',
    description: 'Verifica se cada endereço possui os campos obrigatórios.',
    severity: 'ERROR',
    validate: async (hcp) => {
      const enderecos = hcp.enderecos || [];
      const camposObrigatorios = ['tipo', 'logradouro', 'numero', 'municipio', 'estado', 'cep'];
      const incompletos = [];

      enderecos.forEach((end, index) => {
        const faltantes = camposObrigatorios.filter(campo => !end[campo]);
        if (faltantes.length > 0) {
          incompletos.push(`Endereço ${index + 1}: falta ${faltantes.join(', ')}`);
        }
      });

      if (incompletos.length > 0) {
        return {
          status: 'FAIL',
          details: incompletos.join('; ')
        };
      }

      return { status: 'PASS', details: 'Todos os endereços estão completos.' };
    }
  },
  {
    id: 'NOME_DUPLICADO',
    name: 'Nome Duplicado',
    description: 'Verifica se o nome normalizado aparece em mais de um HCP.',
    severity: 'WARNING',
    validate: async (hcp) => {
      if (!hcp.nome_normalizado) {
        return { status: 'PASS', details: 'Nome não normalizado.' };
      }

      const count = await HCP.countDocuments({
        nome_normalizado: hcp.nome_normalizado,
        id_hcp: { $ne: hcp.id_hcp }
      });

      if (count > 0) {
        return {
          status: 'FAIL',
          details: `Nome "${hcp.nome_normalizado}" encontrado em ${count} outro(s) HCP(s).`
        };
      }

      return { status: 'PASS', details: 'Nome único no sistema.' };
    }
  },
  {
    id: 'CRM_SITUACAO',
    name: 'Situação do CRM',
    description: 'Verifica se há CRM com situação irregular.',
    severity: 'WARNING',
    validate: async (hcp) => {
      const crms = hcp.crm || [];
      const irregulares = crms.filter(c =>
        c.situacao && !['ATIVO', 'REGULAR', 'INSCRITO'].includes(c.situacao.toUpperCase())
      );

      if (irregulares.length > 0) {
        return {
          status: 'FAIL',
          details: `CRMs com situação irregular: ${irregulares.map(c => `${c.inscricao}/${c.estado} (${c.situacao})`).join(', ')}`
        };
      }

      return { status: 'PASS', details: 'Todos os CRMs estão regulares.' };
    }
  },
  {
    id: 'CAMPOS_OBRIGATORIOS',
    name: 'Campos Obrigatórios',
    description: 'Verifica presença de campos essenciais.',
    severity: 'ERROR',
    validate: async (hcp) => {
      const faltantes = [];

      if (!hcp.nome_medico) faltantes.push('nome_medico');
      if (!hcp.crm || hcp.crm.length === 0) faltantes.push('crm');

      if (faltantes.length > 0) {
        return {
          status: 'FAIL',
          details: `Campos obrigatórios faltantes: ${faltantes.join(', ')}`
        };
      }

      return { status: 'PASS', details: 'Todos os campos obrigatórios estão preenchidos.' };
    }
  }
];

/**
 * Serviço de validação de HCPs
 */
const validationService = {
  /**
   * Executa todas as regras de validação em um HCP
   * @param {string} id_hcp - ID do HCP
   * @returns {Object} Resultado da validação com score e regras
   */
  async validateHcp(id_hcp) {
    const hcp = await HCP.findOne({ id_hcp });

    if (!hcp) {
      throw new Error(`HCP não encontrado: ${id_hcp}`);
    }

    const rules_results = [];
    let errorCount = 0;
    let warningCount = 0;
    let passCount = 0;

    for (const rule of VALIDATION_RULES) {
      try {
        const result = await rule.validate(hcp);

        rules_results.push({
          rule_id: rule.id,
          rule_name: rule.name,
          severity: rule.severity,
          status: result.status,
          details: result.details
        });

        if (result.status === 'FAIL') {
          if (rule.severity === 'ERROR') errorCount++;
          else if (rule.severity === 'WARNING') warningCount++;
        } else {
          passCount++;
        }
      } catch (error) {
        console.error(`Erro na regra ${rule.id}:`, error);
        rules_results.push({
          rule_id: rule.id,
          rule_name: rule.name,
          severity: rule.severity,
          status: 'FAIL',
          details: `Erro ao executar validação: ${error.message}`
        });
        errorCount++;
      }
    }

    // Cálculo do score: penaliza erros mais que warnings
    const totalRules = VALIDATION_RULES.length;
    const score_calculado = Math.max(0,
      (passCount - (errorCount * 0.3) - (warningCount * 0.1)) / totalRules
    );

    // Salva o log de validação
    const validationLog = new ValidationLog({
      id_hcp,
      rules_results,
      score_calculado: Math.round(score_calculado * 100) / 100,
      timestamp: new Date()
    });

    await validationLog.save();

    // Atualiza o score no HCP
    await HCP.updateOne(
      { id_hcp },
      {
        score_qualidade: Math.round(score_calculado * 100) / 100,
        updated_at: new Date()
      }
    );

    return {
      id_hcp,
      score_calculado: Math.round(score_calculado * 100) / 100,
      rules_results,
      summary: {
        total: totalRules,
        passed: passCount,
        errors: errorCount,
        warnings: warningCount
      }
    };
  },

  /**
   * Obtém o último log de validação de um HCP
   * @param {string} id_hcp - ID do HCP
   */
  async getLastValidation(id_hcp) {
    return await ValidationLog.findOne({ id_hcp })
      .sort({ timestamp: -1 });
  },

  /**
   * Lista todas as regras de validação disponíveis
   */
  getRules() {
    return VALIDATION_RULES.map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      severity: rule.severity
    }));
  }
};

module.exports = validationService;
