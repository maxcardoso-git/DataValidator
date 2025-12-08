require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, HCP } = require('../models');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mdm_validation');
    console.log('Conectado ao MongoDB');

    // Criar usuário admin padrão
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        password_hash: 'admin123', // Será hasheado pelo pre-save
        role: 'ADMIN',
        active: true
      });
      await admin.save();
      console.log('Usuário admin criado (senha: admin123)');
    }

    // Criar usuário steward
    const stewardExists = await User.findOne({ username: 'steward' });
    if (!stewardExists) {
      const steward = new User({
        username: 'steward',
        password_hash: 'steward123',
        role: 'STEWARD',
        active: true
      });
      await steward.save();
      console.log('Usuário steward criado (senha: steward123)');
    }

    // Criar usuário viewer
    const viewerExists = await User.findOne({ username: 'viewer' });
    if (!viewerExists) {
      const viewer = new User({
        username: 'viewer',
        password_hash: 'viewer123',
        role: 'VIEWER',
        active: true
      });
      await viewer.save();
      console.log('Usuário viewer criado (senha: viewer123)');
    }

    // Criar alguns HCPs de exemplo
    const hcpExamples = [
      {
        id_hcp: 'HCP001',
        nome_medico: 'Dr. João Carlos da Silva',
        score_qualidade: 0.95,
        status_validacao: 'VALIDADO',
        crm: [{
          estado: 'SP',
          inscricao: '123456',
          tipo: 'Principal',
          situacao: 'ATIVO',
          ano_formatura: '2005',
          especialidades: [{
            rqe: '12345',
            especialidade: 'Cardiologia'
          }]
        }],
        enderecos: [{
          tipo: 'Consultório',
          logradouro: 'Av. Paulista',
          numero: '1000',
          complemento: 'Sala 1001',
          bairro: 'Bela Vista',
          municipio: 'São Paulo',
          estado: 'SP',
          cep: '01310-100',
          pais: 'Brasil'
        }],
        telefones: [{ telefone: '11999998888' }],
        emails: [{ email: 'joao.silva@email.com' }],
        organizacoes: [{
          cnes: '1234567',
          nome_razao: 'Hospital São Paulo',
          nome_fantasia: 'Hospital São Paulo',
          atuacao: 'Médico',
          especialidade: 'Cardiologia'
        }],
        informacao_adicional: [{
          origem: 'CRM-SP',
          laboratorio: 'Lab A',
          data_carga: '2024-01-15',
          regiao: 'Sudeste',
          supervisor: 'Maria Santos',
          ativo: 'S'
        }]
      },
      {
        id_hcp: 'HCP002',
        nome_medico: 'Dra. Maria Fernanda Oliveira',
        score_qualidade: 0.72,
        status_validacao: 'A_REVISAR',
        crm: [{
          estado: 'RJ',
          inscricao: '654321',
          tipo: 'Principal',
          situacao: 'ATIVO',
          ano_formatura: '2010',
          especialidades: [{
            rqe: '54321',
            especialidade: 'Dermatologia'
          }]
        }],
        enderecos: [{
          tipo: 'Consultório',
          logradouro: 'Rua Visconde de Pirajá',
          numero: '500',
          bairro: 'Ipanema',
          municipio: 'Rio de Janeiro',
          estado: 'RJ',
          cep: '22410-002',
          pais: 'Brasil'
        }],
        telefones: [{ telefone: '21988887777' }],
        emails: [{ email: 'maria.oliveira@email.com' }]
      },
      {
        id_hcp: 'HCP003',
        nome_medico: 'Dr. Pedro Henrique Santos',
        score_qualidade: 0.45,
        status_validacao: 'A_REVISAR',
        crm: [{
          estado: 'MG',
          inscricao: '789012',
          tipo: 'Principal',
          situacao: 'SUSPENSO',
          ano_formatura: '2008'
        }],
        telefones: [{ telefone: '3133334444' }],
        emails: [{ email: 'invalido-email' }] // Email inválido para teste
      },
      {
        id_hcp: 'HCP004',
        nome_medico: 'Dra. Ana Beatriz Costa',
        score_qualidade: 0.88,
        status_validacao: 'A_REVISAR',
        crm: [{
          estado: 'SP',
          inscricao: '111222',
          tipo: 'Principal',
          situacao: 'ATIVO',
          ano_formatura: '2012',
          especialidades: [{
            rqe: '11122',
            especialidade: 'Pediatria'
          }]
        }],
        enderecos: [{
          tipo: 'Consultório',
          logradouro: 'Rua Augusta',
          numero: '2000',
          complemento: 'Conj. 50',
          bairro: 'Consolação',
          municipio: 'São Paulo',
          estado: 'SP',
          cep: '01305-100',
          pais: 'Brasil'
        }],
        telefones: [{ telefone: '11977776666' }],
        emails: [{ email: 'ana.costa@email.com' }]
      },
      {
        id_hcp: 'HCP005',
        nome_medico: 'Dr. Roberto Carlos Mendes',
        score_qualidade: 0.60,
        status_validacao: 'CORRIGIR',
        crm: [{
          estado: 'RS',
          inscricao: '333444',
          tipo: 'Principal',
          situacao: 'ATIVO',
          ano_formatura: '2000'
        }],
        enderecos: [{
          tipo: 'Residencial',
          logradouro: 'Av. Ipiranga',
          municipio: 'Porto Alegre',
          estado: 'RS'
          // Faltando campos obrigatórios para teste
        }],
        telefones: [{ telefone: '123' }], // Telefone inválido para teste
        emails: [{ email: 'roberto.mendes@email.com' }]
      }
    ];

    for (const hcpData of hcpExamples) {
      const exists = await HCP.findOne({ id_hcp: hcpData.id_hcp });
      if (!exists) {
        // Normalizar nome
        if (hcpData.nome_medico) {
          hcpData.nome_normalizado = hcpData.nome_medico
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Z\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        }

        const hcp = new HCP(hcpData);
        await hcp.save();
        console.log(`HCP ${hcpData.id_hcp} criado`);
      }
    }

    console.log('\nSeed concluído com sucesso!');
    console.log('\nUsuários criados:');
    console.log('  admin / admin123 (ADMIN)');
    console.log('  steward / steward123 (STEWARD)');
    console.log('  viewer / viewer123 (VIEWER)');

    process.exit(0);
  } catch (error) {
    console.error('Erro no seed:', error);
    process.exit(1);
  }
};

seedDatabase();
