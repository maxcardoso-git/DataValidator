const { Audit } = require('../models');

/**
 * Serviço para registro de auditoria
 */
const auditService = {
  /**
   * Registra uma ação de auditoria
   * @param {Object} params - Parâmetros da auditoria
   * @param {string} params.user - Username do usuário
   * @param {string} params.role - Role do usuário
   * @param {string} params.action - Tipo de ação
   * @param {string} [params.id_hcp] - ID do HCP relacionado
   * @param {Object} [params.metadata] - Metadados (IP, user agent)
   * @param {Object} [params.details] - Detalhes adicionais
   */
  async log({ user, role, action, id_hcp = null, metadata = {}, details = {} }) {
    try {
      const audit = new Audit({
        user,
        role,
        action,
        id_hcp,
        metadata,
        details,
        timestamp: new Date()
      });

      await audit.save();
      return audit;
    } catch (error) {
      console.error('Erro ao registrar auditoria:', error);
      // Não lançamos erro para não afetar a operação principal
    }
  },

  /**
   * Extrai metadados da requisição
   * @param {Object} req - Objeto de requisição Express
   */
  extractMetadata(req) {
    return {
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown'
    };
  },

  /**
   * Busca logs de auditoria por HCP
   * @param {string} id_hcp - ID do HCP
   * @param {number} limit - Limite de resultados
   */
  async getByHcp(id_hcp, limit = 50) {
    return await Audit.find({ id_hcp })
      .sort({ timestamp: -1 })
      .limit(limit);
  },

  /**
   * Busca logs de auditoria por usuário
   * @param {string} user - Username
   * @param {number} limit - Limite de resultados
   */
  async getByUser(user, limit = 50) {
    return await Audit.find({ user })
      .sort({ timestamp: -1 })
      .limit(limit);
  },

  /**
   * Busca logs de auditoria por período
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @param {number} limit - Limite de resultados
   */
  async getByPeriod(startDate, endDate, limit = 100) {
    return await Audit.find({
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .sort({ timestamp: -1 })
      .limit(limit);
  }
};

module.exports = auditService;
