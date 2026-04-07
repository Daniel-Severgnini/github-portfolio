# 🚀 GitHub Portfolio - Daniel Severgnini

Um portfólio moderno e interativo construído com React, TypeScript e Tailwind CSS, exibindo projetos do GitHub com funcionalidades avançadas de administração.

## ✨ Funcionalidades

- 🎨 **Design Moderno**: Interface com dark/light mode, animações suaves e design responsivo
- 📊 **Dashboard Admin**: Controle total sobre o conteúdo (projetos em destaque, descrições customizadas, vídeos)
- 🎬 **Suporte Multimídia**: Vídeos do YouTube e arquivos locais (MP4) nos projetos
- 🔍 **Sistema de Filtros**: Busca por nome, filtro por linguagem e tecnologia
- ⭐ **Projetos em Destaque**: Seção especial para projetos importantes
- 📱 **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- 🎯 **Modal Interativo**: Detalhes completos dos projetos com blur background

## 🛠️ Tecnologias Utilizadas

- **React 19** - Framework principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Recharts** - Gráficos e visualizações
- **GitHub API** - Dados dos repositórios
- **Lucide React** - Ícones modernos
- **Vercel** - Deploy e hospedagem

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn

### Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/github-portfolio.git
   cd github-portfolio
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Execute o projeto:**
   ```bash
   npm start
   ```

4. **Abra no navegador:**
   - Acesse [http://localhost:3000](http://localhost:3000)

## 📦 Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `build/`.

## 🌐 Deploy na Vercel

### Método 1: Deploy Automático (Recomendado)

1. **Conecte seu repositório GitHub à Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "New Project"
   - Importe seu repositório GitHub

2. **Configurações da Vercel:**
   - **Framework Preset:** `Create React App`
   - **Root Directory:** `./` (padrão)
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

3. **Variáveis de Ambiente (opcional):**
   - Nenhuma variável obrigatória necessária

4. **Deploy:**
   - Clique em "Deploy"
   - Aguarde o build ser concluído
   - Seu portfólio estará online!

### Método 2: Deploy Manual

1. **Build local:**
   ```bash
   npm run build
   ```

2. **Instale Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

## 🔧 Configuração do Dashboard Admin

### Acesso ao Dashboard
1. No portfólio, pressione e segure a foto de perfil por 2 segundos
2. Digite a senha: `admin123`
3. Acesse as abas **Perfil** e **Projetos**

### Funcionalidades do Dashboard

#### 📝 Aba Perfil
- Editar nome, título e bio
- Gerenciar projetos em destaque
- Adicionar/remover projetos da lista principal

#### 📁 Aba Projetos
- Editar descrições expandidas dos projetos
- Adicionar "O que Resolve?" e "Diferencial Técnico"
- Inserir vídeos (YouTube ou arquivos locais)
- Configurar tecnologias utilizadas

### Vídeos nos Projetos
- **YouTube:** Cole a URL completa do vídeo
- **Arquivo Local:** Selecione arquivo MP4 do seu computador (máx. 50MB)

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── App.tsx              # Componente principal
│   ├── Dashboard.tsx        # Painel administrativo
│   ├── Header.tsx           # Cabeçalho com tema
│   ├── ProfileCard.tsx      # Card do perfil
│   ├── ProjectsList.tsx     # Lista de projetos
│   ├── ProjectModal.tsx     # Modal de detalhes do projeto
│   └── ...
├── hooks/
│   ├── useGithubData.ts     # Hook para API do GitHub
│   └── useProjectMetadata.ts # Hook para metadados
├── types/
│   └── Project.ts           # Tipos TypeScript
└── ...
```

## 🎨 Personalização

### Cores e Tema
- O projeto usa Tailwind CSS para estilização
- Suporte completo a dark/light mode
- Gradientes e animações modernas

### Dados Personalizados
- Todos os dados são armazenados no localStorage
- Possibilidade de customizar nome, bio, projetos em destaque
- Metadados dos projetos editáveis via dashboard

## 📊 API do GitHub

O projeto consome a API pública do GitHub para:
- Listar repositórios públicos
- Obter estatísticas (estrelas, forks, linguagem)
- Dados de atualização dos projetos

**Nota:** Não requer token de API para repositórios públicos.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Contato

**Daniel Severgnini**
- GitHub: [Seu GitHub](https://github.com/Daniel-Severgnini)
- LinkedIn: [Seu LinkedIn](https://linkedin.com/in/seu-perfil)

---

⭐ **Dê uma estrela se gostou do projeto!**
