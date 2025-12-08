const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { User, HCP, UploadSession } = require('../models');
const { authenticate, authorize, hasPermission } = require('../middleware/auth');
const auditService = require('../services/auditService');

const router = express.Router();

// Configuração do Multer para upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || path.extname(file.originalname) === '.json') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos JSON são permitidos.'), false);
    }
  }
});

/**
 * POST /admin/upload
 * Upload de arquivo JSON com registros HCP
 */
router.post('/upload', [
  authenticate,
  authorize('ADMIN'),
  upload.single('file')
], async (req, res) => {
  let uploadSession = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    // Cria sessão de upload
    uploadSession = new UploadSession({
      user: req.user.username,
      filename: req.file.originalname,
      status: 'RECEBIDO',
      started_at: new Date()
    });

    await uploadSession.save();

    // Lê e processa o arquivo
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');

    let data;
    try {
      data = JSON.parse(fileContent);
    } catch (parseError) {
      uploadSession.status = 'ERRO';
      uploadSession.log = 'Erro ao parsear JSON: ' + parseError.message;
      uploadSession.finished_at = new Date();
      await uploadSession.save();

      fs.unlinkSync(filePath);

      return res.status(400).json({ error: 'Arquivo JSON inválido.' });
    }

    // Garante que é um array
    const records = Array.isArray(data) ? data : [data];

    // Atualiza status
    uploadSession.status = 'PROCESSANDO';
    await uploadSession.save();

    let processed = 0;
    let errors = 0;
    const errorLog = [];

    // Processa cada registro
    for (const record of records) {
      try {
        // Suporta tanto _id quanto id_hcp como identificador
        let id_hcp = record.id_hcp || record._id;

        if (!id_hcp) {
          errors++;
          errorLog.push(`Registro sem id_hcp ou _id: ${JSON.stringify(record).substring(0, 100)}`);
          continue;
        }

        // Prepara o registro para salvar
        const hcpData = { ...record };

        // Se veio com _id, converte para id_hcp e guarda o original
        if (record._id && !record.id_hcp) {
          hcpData.id_hcp = record._id;
          hcpData._id_original = record._id;
          delete hcpData._id; // Remove _id para não conflitar com MongoDB
        }

        // Converte score (0-100) para score_qualidade (0-1) se existir
        if (typeof hcpData.score === 'number' && hcpData.score > 1) {
          hcpData.score_qualidade = hcpData.score / 100;
        } else if (typeof hcpData.score === 'number') {
          hcpData.score_qualidade = hcpData.score;
        }

        // Normaliza nome
        if (hcpData.nome_medico) {
          hcpData.nome_normalizado = hcpData.nome_medico
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Z\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        }

        // Define status inicial se não existir
        if (!hcpData.status_validacao) {
          hcpData.status_validacao = 'A_REVISAR';
        }

        // Upsert do registro
        await HCP.updateOne(
          { id_hcp: hcpData.id_hcp },
          { $set: { ...hcpData, updated_at: new Date() } },
          { upsert: true }
        );

        processed++;
      } catch (recordError) {
        errors++;
        const recordId = record.id_hcp || record._id || 'unknown';
        errorLog.push(`Erro no registro ${recordId}: ${recordError.message}`);
      }
    }

    // Finaliza sessão
    uploadSession.status = 'CONCLUIDO';
    uploadSession.records_processed = processed;
    uploadSession.records_with_error = errors;
    uploadSession.log = errorLog.join('\n');
    uploadSession.finished_at = new Date();
    await uploadSession.save();

    // Remove arquivo temporário
    fs.unlinkSync(filePath);

    // Registra auditoria
    await auditService.log({
      user: req.user.username,
      role: req.user.role,
      action: 'UPLOAD_DATA',
      metadata: auditService.extractMetadata(req),
      details: {
        filename: req.file.originalname,
        processed,
        errors
      }
    });

    res.json({
      message: 'Upload processado com sucesso.',
      session_id: uploadSession._id,
      records_processed: processed,
      records_with_error: errors
    });
  } catch (error) {
    console.error('Erro no upload:', error);

    if (uploadSession) {
      uploadSession.status = 'ERRO';
      uploadSession.log = error.message;
      uploadSession.finished_at = new Date();
      await uploadSession.save();
    }

    // Remove arquivo se existir
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: 'Erro ao processar upload.' });
  }
});

/**
 * GET /admin/upload/history
 * Histórico de uploads
 */
router.get('/upload/history', [
  authenticate,
  authorize('ADMIN')
], async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const sessions = await UploadSession.find()
      .sort({ started_at: -1 })
      .limit(limit);

    res.json({ items: sessions });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de uploads.' });
  }
});

/**
 * GET /admin/users
 * Lista usuários
 */
router.get('/users', [
  authenticate,
  authorize('ADMIN')
], async (req, res) => {
  try {
    const users = await User.find().select('-password_hash');
    res.json({ users });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
});

/**
 * POST /admin/users
 * Cria novo usuário
 */
router.post('/users', [
  authenticate,
  authorize('ADMIN'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username deve ter no mínimo 3 caracteres'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('role').isIn(['ADMIN', 'STEWARD', 'VIEWER']).withMessage('Role inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, role } = req.body;

    // Verifica se usuário já existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username já existe.' });
    }

    const user = new User({
      username,
      password_hash: password, // Será hasheado pelo pre-save
      role,
      active: true
    });

    await user.save();

    res.status(201).json({
      message: 'Usuário criado com sucesso.',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
});

/**
 * PUT /admin/users/:id
 * Atualiza usuário
 */
router.put('/users/:id', [
  authenticate,
  authorize('ADMIN'),
  body('role').optional().isIn(['ADMIN', 'STEWARD', 'VIEWER']),
  body('active').optional().isBoolean(),
  body('password').optional().isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { role, active, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (role !== undefined) user.role = role;
    if (active !== undefined) user.active = active;
    if (password) user.password_hash = password; // Será hasheado pelo pre-save

    await user.save();

    res.json({
      message: 'Usuário atualizado com sucesso.',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

/**
 * DELETE /admin/users/:id
 * Desativa usuário (soft delete)
 */
router.delete('/users/:id', [
  authenticate,
  authorize('ADMIN')
], async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Não permite deletar o próprio usuário
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Não é possível desativar seu próprio usuário.' });
    }

    user.active = false;
    await user.save();

    res.json({ message: 'Usuário desativado com sucesso.' });
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    res.status(500).json({ error: 'Erro ao desativar usuário.' });
  }
});

/**
 * GET /admin/stats
 * Estatísticas do sistema
 */
router.get('/stats', [
  authenticate,
  authorize('ADMIN')
], async (req, res) => {
  try {
    const [
      totalHcps,
      hcpsByStatus,
      totalUsers,
      activeUsers,
      recentUploads
    ] = await Promise.all([
      HCP.countDocuments(),
      HCP.aggregate([
        { $group: { _id: '$status_validacao', count: { $sum: 1 } } }
      ]),
      User.countDocuments(),
      User.countDocuments({ active: true }),
      UploadSession.find().sort({ started_at: -1 }).limit(5)
    ]);

    res.json({
      hcps: {
        total: totalHcps,
        byStatus: hcpsByStatus.reduce((acc, item) => {
          acc[item._id || 'SEM_STATUS'] = item.count;
          return acc;
        }, {})
      },
      users: {
        total: totalUsers,
        active: activeUsers
      },
      recentUploads
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
  }
});

module.exports = router;
