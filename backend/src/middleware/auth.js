const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware de autenticação JWT
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Acesso negado. Token não fornecido.'
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select('-password_hash');

      if (!user || !user.active) {
        return res.status(401).json({
          error: 'Token inválido ou usuário inativo.'
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        error: 'Token inválido ou expirado.'
      });
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      error: 'Erro interno de autenticação.'
    });
  }
};

// Middleware de autorização por roles
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acesso negado. Permissão insuficiente.'
      });
    }

    next();
  };
};

// Permissões por role
const PERMISSIONS = {
  ADMIN: ['UPLOAD_DATA', 'MANAGE_USERS', 'FULL_ACCESS', 'SEARCH_HCP', 'VALIDATE_HCP', 'COMPARE_HCP', 'EXPORT_HCP', 'VIEW_HCP'],
  STEWARD: ['SEARCH_HCP', 'VALIDATE_HCP', 'COMPARE_HCP', 'EXPORT_HCP', 'VIEW_HCP'],
  VIEWER: ['SEARCH_HCP', 'VIEW_HCP']
};

// Middleware de verificação de permissão específica
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado.'
      });
    }

    const userPermissions = PERMISSIONS[req.user.role] || [];

    if (!userPermissions.includes(permission) && !userPermissions.includes('FULL_ACCESS')) {
      return res.status(403).json({
        error: `Permissão '${permission}' não concedida para este usuário.`
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  hasPermission,
  PERMISSIONS
};
