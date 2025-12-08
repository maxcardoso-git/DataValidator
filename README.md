# MDM Validation - HCP

Aplicação web para validação da deduplicação e qualidade de dados de médicos (HCPs) pós-processos de MDM.

## Tecnologias

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Banco de Dados**: MongoDB
- **Autenticação**: JWT + BCrypt

## Funcionalidades

### Módulos

1. **Autenticação**: Login com controle de sessão JWT
2. **Busca de HCPs**: Pesquisa por nome, CRM ou ID
3. **Validação de HCP**: Tela com abas para validação detalhada
4. **Comparação**: Comparação lado a lado de registros
5. **Upload de Dados**: Carga de arquivos JSON (Admin)
6. **Gerenciamento de Usuários**: CRUD de usuários (Admin)
7. **Dashboard**: Estatísticas do sistema (Admin)
8. **Relatórios**: Exportação em JSON e PDF

### Roles

- **ADMIN**: Acesso total ao sistema
- **STEWARD**: Validação e correção de dados
- **VIEWER**: Apenas consulta

## Instalação

### Pré-requisitos

- Node.js 18+
- MongoDB 6+
- npm ou yarn

### Desenvolvimento Local

1. Clone o repositório:
```bash
git clone <repo-url>
cd DataValidator
```

2. Configure o backend:
```bash
cd backend
cp .env.example .env
# Edite o .env com suas configurações
npm install
```

3. Configure o frontend:
```bash
cd ../frontend
npm install
```

4. Inicie o MongoDB localmente ou via Docker:
```bash
docker run -d -p 27017:27017 --name mdm-mongo mongo:7.0
```

5. Execute o seed para criar usuários de teste:
```bash
cd backend
npm run seed
```

6. Inicie o backend:
```bash
npm run dev
```

7. Em outro terminal, inicie o frontend:
```bash
cd frontend
npm run dev
```

8. Acesse: http://localhost:5173

### Usuários de Teste

Após rodar o seed:

| Usuário  | Senha       | Role    |
|----------|-------------|---------|
| admin    | admin123    | ADMIN   |
| steward  | steward123  | STEWARD |
| viewer   | viewer123   | VIEWER  |

### Docker Compose

Para rodar toda a aplicação com Docker:

```bash
docker-compose up -d
```

Acesse:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## Estrutura do Projeto

```
DataValidator/
├── backend/
│   ├── src/
│   │   ├── config/         # Configurações (banco de dados)
│   │   ├── middleware/     # Middlewares (auth, etc)
│   │   ├── models/         # Schemas do MongoDB
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Serviços (validação, auditoria)
│   │   ├── utils/          # Utilitários (seed)
│   │   └── index.js        # Entry point
│   ├── uploads/            # Arquivos de upload temporários
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── context/        # Context API (Auth)
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Serviços de API
│   │   ├── styles/         # Estilos CSS
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API Endpoints

### Autenticação

- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário logado

### HCP

- `GET /api/hcp/search` - Busca HCPs
- `GET /api/hcp/:id` - Detalhes de um HCP
- `POST /api/hcp/:id/validate` - Executa validação automática
- `POST /api/hcp/:id/decision` - Registra decisão manual
- `GET /api/hcp/compare/records` - Compara dois HCPs
- `GET /api/hcp/:id/report` - Relatório JSON
- `GET /api/hcp/:id/audit` - Histórico de auditoria

### Admin

- `POST /api/admin/upload` - Upload de arquivo JSON
- `GET /api/admin/upload/history` - Histórico de uploads
- `GET /api/admin/users` - Lista usuários
- `POST /api/admin/users` - Cria usuário
- `PUT /api/admin/users/:id` - Atualiza usuário
- `DELETE /api/admin/users/:id` - Desativa usuário
- `GET /api/admin/stats` - Estatísticas do sistema

### Relatórios

- `GET /api/report/:id/pdf` - Download PDF
- `GET /api/report/summary` - Resumo geral

## Regras de Validação

1. **CRM_UNICO_HCP**: Verifica se cada CRM pertence a um único HCP
2. **TELEFONE_FORMATO**: Valida formato de telefone (10-13 dígitos)
3. **EMAIL_FORMATO**: Valida formato de e-mail
4. **ENDERECO_COMPLETO**: Verifica campos obrigatórios do endereço
5. **NOME_DUPLICADO**: Detecta nomes duplicados
6. **CRM_SITUACAO**: Verifica situação do CRM
7. **CAMPOS_OBRIGATORIOS**: Verifica presença de campos essenciais

## Licença

Proprietário - Close-Up International / 200DEV
