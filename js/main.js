/**
 * js/main.js
 * Ponto de entrada da aplicação.
 * Inicializa bibliotecas e configura eventos globais.
 */

window.onload = function() {
    // 1. Inicializa ícones (Lucide)
    if(typeof lucide !== 'undefined') lucide.createIcons();

    // 2. Define valores padrão nos formulários (Data de hoje, Mês atual)
    const dataAbertura = document.getElementById('data_abertura');
    if(dataAbertura) dataAbertura.valueAsDate = new Date();

    const filtroNiver = document.getElementById('filtro-niver-mes');
    if(filtroNiver) filtroNiver.value = new Date().getMonth() + 1; 

    // 3. Renderiza a estrutura vazia dos selects (loading state)
    if(typeof renderizarSelectsVazios === 'function') renderizarSelectsVazios();

    // 4. Busca as opções do Google Sheets para preencher os selects
    if(typeof carregarFiltros === 'function') carregarFiltros();
};


// ============================================================================
// EVENT LISTENERS GLOBAIS
// ============================================================================

// 1. Monitora digitação nos inputs de "Cadastrar Novo" (switched-input)
document.addEventListener('input', function(e) {
    if(e.target.classList.contains('switched-input')) {
        const id = e.target.id.replace('inp_', '');
        const hiddenField = document.getElementById(`field_${id}`);
        if(hiddenField) {
            // Garante que o valor salvo seja sempre maiúsculo
            hiddenField.value = e.target.value.toUpperCase();
        }
    }
});

// 2. Monitora mudanças globais (Data Risco e Regra do Prontuário)
document.addEventListener('change', function(e) {
    const targetId = e.target.id;

    // A. Regra do Prontuário (Só habilita se Local == HO)
    if (targetId === 'sel_local' || targetId === 'inp_local') {
        const prontuarioInput = document.getElementById('field_prontuario');
        // Pega o valor do select ou do input de novo cadastro
        const valorLocal = e.target.value ? e.target.value.toUpperCase() : '';
        
        // Verifica se é HO (no select ou digitado manualmente)
        if (valorLocal === 'HO') {
            prontuarioInput.disabled = false;
            prontuarioInput.classList.remove('bg-slate-100', 'cursor-not-allowed');
            prontuarioInput.classList.add('bg-white');
            prontuarioInput.placeholder = "Digite o número...";
            prontuarioInput.focus();
        } else {
            prontuarioInput.disabled = true;
            prontuarioInput.value = ''; // Limpa se mudar para outro local
            prontuarioInput.classList.add('bg-slate-100', 'cursor-not-allowed');
            prontuarioInput.classList.remove('bg-white');
            prontuarioInput.placeholder = "Apenas para Local HO";
        }
    }

    // B. Cálculo de Data de Risco
    const idsRisco = ['sel_especialidade', 'inp_especialidade', 'field_data_marcacao'];
    if(idsRisco.includes(targetId)) {
        if(typeof calcularDataRisco === 'function') {
            setTimeout(calcularDataRisco, 100);
        }
    }
});

// ============================================================================
// SOBRESCRITA DE CORREÇÃO (PATCH - NOVO ATENDIMENTO)
// ============================================================================
// Sobrescreve a função do ui.js para garantir o fluxo correto de preenchimento.

window.abrirAtendimentoDireto = function(cpf, id) {
    if(!cpf || cpf.length < 5) { 
        alert("Munícipe sem CPF. Edite o cadastro primeiro."); 
        if(typeof abrirEdicaoDireta === 'function') abrirEdicaoDireta(cpf, id); 
        return; 
    }
    
    // 1. Navega para a aba SEM resetar (false) para não perdermos o controle
    if(typeof switchTab === 'function') switchTab('form-atendimento', false);
    
    // 2. LIMPEZA MANUAL FORÇADA
    // Limpa todos os campos EXCETO o de busca
    const inputs = document.querySelectorAll('#frmAtendimento input:not(#busca_cpf), #frmAtendimento select, #frmAtendimento textarea');
    inputs.forEach(inp => {
        if(inp.type !== 'button' && inp.type !== 'submit' && inp.type !== 'hidden') {
            inp.value = '';
        }
    });
    
    // Limpa IDs ocultos e estados
    const hiddenId = document.getElementById('atend_id_hidden');
    if(hiddenId) hiddenId.value = '';
    
    if(typeof listaProcedimentosTemp !== 'undefined') listaProcedimentosTemp = [];
    const tbody = document.getElementById('lista-procedimentos-temp');
    if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-slate-400 italic">Nenhum item adicionado.</td></tr>';

    // Reseta selects especiais
    if(typeof CONFIG_SELECTS !== 'undefined') {
        CONFIG_SELECTS.forEach(cfg => {
            const sel = document.getElementById(`sel_${cfg.id}`);
            if(sel) sel.value = "";
            if(typeof cancelSelectNew === 'function') cancelSelectNew(cfg.id);
        });
    }

    // Garante que a interface esteja em modo "Novo"
    if(typeof toggleModoEdicao === 'function') toggleModoEdicao(false);
    
    // Esconde o formulário até confirmarmos o munícipe
    const restoForm = document.getElementById('resto-form-atendimento');
    if(restoForm) restoForm.classList.add('hidden');
    
    const resDiv = document.getElementById('resultado_busca');
    if(resDiv) resDiv.innerHTML = '';

    // 3. INSERÇÃO DO CPF E BUSCA (Síncrono e Garantido)
    const inputBusca = document.getElementById('busca_cpf');
    if(inputBusca) {
        inputBusca.value = cpf; // Insere o valor
        inputBusca.dispatchEvent(new Event('input')); // Dispara evento para garantir que a UI reconheça
    }

    // Tenta achar na memória local (todosPacientes)
    let paciente = null;
    if (typeof todosPacientes !== 'undefined' && Array.isArray(todosPacientes)) {
        const cpfLimpo = String(cpf).replace(/\D/g, '');
        // Busca por ID ou CPF
        paciente = todosPacientes.find(p => String(p.id) === String(id)) || 
                   todosPacientes.find(p => String(p.cpf).replace(/\D/g, '') === cpfLimpo);
    }

    if (paciente) {
        // --- CENÁRIO 1: Munícipe encontrado na memória ---
        if(resDiv) resDiv.innerHTML = `<span class="text-emerald-600 font-bold flex items-center gap-1"><i data-lucide="check" class="w-4 h-4"></i> ${paciente.nome}</span>`;
        
        document.getElementById('hidden_cpf').value = paciente.cpf || cpf;
        document.getElementById('hidden_nome').value = paciente.nome;
        
        if(restoForm) restoForm.classList.remove('hidden');
        
        // Define data atual
        const dataAb = document.getElementById('data_abertura');
        if(dataAb) {
            dataAb.valueAsDate = new Date();
            // Pequeno delay apenas para o foco, não para os dados
            setTimeout(() => dataAb.focus(), 50);
        }
        
    } else {
        // --- CENÁRIO 2: Munícipe não está na lista local -> Buscar na API ---
        if(resDiv) resDiv.innerHTML = '<span class="text-slate-500 text-xs">Buscando...</span>';
        
        // Chama a função de busca original que lerá o valor que acabamos de colocar no input
        if(typeof buscarPacienteParaAtendimento === 'function') {
            buscarPacienteParaAtendimento();
        }
    }
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
};
