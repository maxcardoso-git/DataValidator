const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');
const auditService = require('../services/auditService');

const router = express.Router();

/**
 * POST /auth/login
 * Autentica usuário e retorna token JWT
 */
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username é obrigatório'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Busca usuário
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        error: 'Credenciais inválidas.'
      });
    }

    // Verifica se está ativo
    if (!user.active) {
      return res.status(401).json({
        error: 'Usuário inativo. Entre em contato com o administrador.'
      });
    }

    // Verifica senha
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        error: 'Credenciais inválidas.'
      });
    }

    // Gera token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '60m' }
    );

    // Registra auditoria de login
    await auditService.log({
      user: user.username,
      role: user.role,
      action: 'LOGIN',
      metadata: auditService.extractMetadata(req)
    });

    res.json({
      token,
      role: user.role,
      username: user.username
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno ao processar login.'
    });
  }
});

/**
 * POST /auth/logout
 * Registra logout do usuário (token deve ser invalidado no cliente)
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Registra auditoria de logout
    await auditService.log({
      user: req.user.username,
      role: req.user.role,
      action: 'LOGOUT',
      metadata: auditService.extractMetadata(req)
    });

    res.json({ message: 'Logout realizado com sucesso.' });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      error: 'Erro interno ao processar logout.'
    });
  }
});

/**
 * GET /auth/me
 * Retorna dados do usuário autenticado
 */
router.get('/me', authenticate, async (req, res) => {
  res.json({
    username: req.user.username,
    role: req.user.role,
    active: req.user.active
  });
});

module.exports = router;
