# 4section-PM - Gestão de Material Carga

O **4section-PM** é uma aplicação moderna para gestão de estoque e pessoal do **43° Batalhão de Polícia Militar**. O sistema oferece controle total sobre armamento, viatura, equipamentos de informática e mobiliário.

## ✨ Funcionalidades Principais

- **📊 Dashboard Inteligente**: Visão geral de todo o material carga com gráficos dinâmicos.
- **🛡️ Gestão de Material Bélico**: Controle de armas, munições, das de perícia e validade.
- **🚗 Gestão de Viaturas**: Monitoramento de quilometragem, placa, prefixo e localização.
- **👥 Controle de Efetivo**: Cadastro completo de policiais e histórico de acautelamentos.
- **📝 Auditoria Completa**: Registro automático de todas as ações realizadas no sistema.
- **📄 Relatórios PDF**: Geração de relatórios profissionais de carga e pessoal.

## 🛠️ Stack Tecnológica

- **Frontend**: React 19 + Vite + TypeScript
- **Backend/DB**: Supabase (Postgres)
- **Icons**: Lucide React
- **Estilo**: Modern Dark Interface

## 📚 Documentação Técnica

A documentação do sistema está estruturada para orientar o desenvolvedor e a seção de TI do batalhão:
- [Guia de Configuração Local](.env.example) — Passos para configurar as credenciais do Supabase.
- **Segurança**: O sistema exige HTTPS/SSL ativo em produção devido ao uso da Web Crypto API do navegador para login de militares.

## 🚀 Como Executar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure as variáveis do Supabase no arquivo `.env`.
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

