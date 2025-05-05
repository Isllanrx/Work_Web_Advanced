# 📄 Projeto MEAN Stack

## 🚀 Descrição
Aplicação full-stack desenvolvida com a stack MEAN:
- **MongoDB** para o banco de dados.
- **Express.js** e **Node.js** para o backend.
- **Angular** para o frontend.

---

## 📁 Estrutura de Pastas

### 🔙 Backend (`/backend`)
- **models/**: Schemas Mongoose:
  - `MessageSchema.js`: Estrutura das mensagens.
  - `UserSchema.js`: Estrutura dos usuários.
- **routes/**:
  - `db.js`: Conexão com o banco de dados MongoDB.
- `server.js`: Arquivo principal do backend (API Express).

### 🔜 Frontend (`/frontend`)
- **src/app/**: Aplicação Angular.
  - `login/`, `message/`, `signup/`: Componentes da aplicação.
  - `middlewares/`: Possível uso de interceptadores ou guards.
  - `services/`: Serviços para conexão com a API.
  - `app.component.*`: Componentes principais do app.
  - `app.routes.ts`: Rotas do Angular.
  - `app.config.*`: Arquivos de configuração do app.
  - `main.ts` / `main.server.ts`: Bootstrap da aplicação.
- `angular.json`, `package.json`: Configurações e dependências do Angular.

---

## 🔧 Como Rodar o Projeto

### Backend
```bash
cd backend
npm install
node server.js
```

### Frontend
```bash
cd frontend
npm install
ng serve
```

---

## 👥 Integrantes
- Ramsés de Oliveira Martins
- Gustavo Müller 
- Isllan Toso

