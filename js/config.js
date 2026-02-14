/**
 * js/config.js
 * Arquivo de configuração e variáveis globais do sistema.
 */

// ============================================================================
// 1. CONFIGURAÇÃO DA API (BACKEND)
// ============================================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNtohug1LnuzYn56ySQ97SvcmNbpxLeZgYYAeKwy_9tyWrH_l3SZKdcJElYQ2eVbEn3w/exec";

// ============================================================================
// 2. CONFIGURAÇÃO DOS SELECTS DINÂMICOS
// ============================================================================
const CONFIG_SELECTS = [
    // Formulário Munícipe
    { id: 'municipio', label: 'Município', container: 'container_municipio', key: 'MUNICIPIO' },
    { id: 'bairro', label: 'Bairro', container: 'container_bairro', key: 'BAIRRO' },
    { id: 'status_titulo', label: 'Situação do Título', container: 'container_status_titulo', key: 'STATUS_TITULO' },
    { id: 'indicacao', label: 'Indicação (Liderança)', container: 'container_indicacao', key: 'INDICACAO' }, 

    // Formulário Atendimento - REORGANIZADO
    
    // 1. CATEGORIAS (Antigo Tipo Serviço)
    { id: 'tipo_servico', label: 'Categorias', container: 'container_tipo_servico', key: 'CATEGORIAS' },
    
    // 2. ATENDIMENTO (Antigo Sub-Tipo)
    { id: 'tipo', label: 'Atendimento', container: 'container_tipo', key: 'ATENDIMENTO' },
    
    // 3. ESPECIALIDADE
    { id: 'especialidade', label: 'Especialidade', container: 'container_especialidade', key: 'ESPECIALIDADE' },
    
    // 4. PROCEDIMENTO/EXAMES
    { id: 'procedimento', label: 'Procedimento/Exames', container: 'container_procedimento', key: 'PROCEDIMENTO_EXAMES' },
    
    // 5. LOCAL (Restaurado)
    { id: 'local', label: 'Local de Atendimento', container: 'container_local', key: 'LOCAL' },

    // 6. TIPOS (Novo - Condicional: Só aparece se Local == HO)
    { id: 'tipos_exame', label: 'Tipos (Específico HO)', container: 'container_tipos_exame', key: 'TIPOS_EXAME' },

    // Extras
    { id: 'parceiro', label: 'Parceiro/Médico', container: 'container_parceiro', key: 'PARCEIRO' },
    { id: 'status_atendimento', label: 'Status Inicial', container: 'container_status_atendimento', key: 'STATUS_ATENDIMENTO', nameOverride: 'status' }
];

// ============================================================================
// 3. VARIÁVEIS GLOBAIS
// ============================================================================
let pacienteAtual = null; 
let histPacienteAtual = null; 
let todosAtendimentos = [];
let todosPacientes = []; 
let opcoesFiltros = {};
let dashboardRawData = null;

window.dadosRelatorioCache = { 
    especialidade: [], 
    procedimento: [],
    lideranca: []
};

let currentUserRole = null;
