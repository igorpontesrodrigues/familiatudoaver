/**
 * js/config.js
 * Arquivo de configuração e variáveis globais do sistema.
 */

// ============================================================================
// 1. CONFIGURAÇÃO DA API (BACKEND)
// ============================================================================
// IMPORTANTE: Substitua pela URL atual do seu Google Apps Script (Deploy web app -> Executable by Anyone)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNtohug1LnuzYn56ySQ97SvcmNbpxLeZgYYAeKwy_9tyWrH_l3SZKdcJElYQ2eVbEn3w/exec";

// ============================================================================
// 2. CONFIGURAÇÃO DOS SELECTS DINÂMICOS
// ============================================================================
// Mapeia os campos dropdown que puxam opções da planilha 'Filtros'
const CONFIG_SELECTS = [
    // Formulário Munícipe (Antigo Eleitor)
    { id: 'municipio', label: 'Município', container: 'container_municipio', key: 'MUNICIPIO' },
    { id: 'bairro', label: 'Bairro', container: 'container_bairro', key: 'BAIRRO' },
    { id: 'status_titulo', label: 'Situação do Título', container: 'container_status_titulo', key: 'STATUS_TITULO' },
    { id: 'indicacao', label: 'Indicação (Liderança)', container: 'container_indicacao', key: 'INDICACAO' }, 

    // Formulário Atendimento - REORGANIZADO CONFORME SOLICITAÇÃO
    // Ordem visual sugerida: Categorias > Atendimento > Especialidade > Procedimento > Tipos > Parceiro > Status
    
    // 1. CATEGORIAS (Antigo Tipo Serviço)
    { id: 'tipo_servico', label: 'Categorias', container: 'container_tipo_servico', key: 'CATEGORIAS' },
    
    // 2. ATENDIMENTO (Antigo Sub-Tipo/Detalhe - Trocado ordem visual via UI ou apenas renomeado aqui, mantendo container original)
    { id: 'tipo', label: 'Atendimento', container: 'container_tipo', key: 'ATENDIMENTO' },
    
    // 3. ESPECIALIDADE
    { id: 'especialidade', label: 'Especialidade', container: 'container_especialidade', key: 'ESPECIALIDADE' },
    
    // 4. PROCEDIMENTO/EXAMES
    { id: 'procedimento', label: 'Procedimento/Exames', container: 'container_procedimento', key: 'PROCEDIMENTO_EXAMES' },
    
    // 5. TIPOS (Antigo Local - Repaproveitando o campo para salvar essa info específica)
    { id: 'local', label: 'Tipos (Detalhe)', container: 'container_local', key: 'TIPOS' },

    // Extras
    { id: 'parceiro', label: 'Parceiro/Médico', container: 'container_parceiro', key: 'PARCEIRO' },
    { id: 'status_atendimento', label: 'Status Inicial', container: 'container_status_atendimento', key: 'STATUS_ATENDIMENTO', nameOverride: 'status' }
];

// ============================================================================
// 3. VARIÁVEIS DE ESTADO GLOBAL (CACHE)
// ============================================================================
let pacienteAtual = null; // Mantendo o nome da variável técnica, mas no contexto é o Munícipe
let histPacienteAtual = null; 
let todosAtendimentos = [];
let todosPacientes = []; 
let opcoesFiltros = {};
let dashboardRawData = null;

// CACHE RELATÓRIOS
window.dadosRelatorioCache = { 
    especialidade: [], 
    procedimento: [],
    lideranca: []
};

// ============================================================================
// 4. CONTROLE DE ACESSO
// ============================================================================
// null = não logado, 'ADMIN' = total, 'VISITOR' = leitura
let currentUserRole = null;
