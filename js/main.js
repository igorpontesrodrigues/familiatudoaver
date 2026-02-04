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
// SOBRESCRITA DE CORREÇÃO (PATCH)
// ============================================================================
// Esta função substitui a do ui.js para garantir que o fluxo de Novo Atendimento 
// funcione corretamente sem ser apagado pelo reset do formulário.

window.abrirAtendimentoDireto = function(cpf, id) {
    if(!cpf || cpf.length < 5) { 
        alert("Munícipe sem CPF. Edite o cadastro primeiro."); 
        if(typeof abrirEdicaoDireta === 'function') abrirEdicaoDireta(cpf, id); 
        return; 
    }
    
    // 1. Alterna para a aba SEM resetar automaticamente (false)
    if(typeof switchTab === 'function') switchTab('form-atendimento', false);
    
    // 2. LIMPEZA MANUAL SEGURA
    // Ao invés de usar resetFormAtendimento() que limpa tudo, limpamos apenas o necessário
    
    // Limpa lista temporária
    if(typeof listaProcedimentosTemp !== 'undefined') {
        listaProcedimentosTemp = [];
        if(typeof renderizarTabelaProcedimentos === 'function') renderizarTabelaProcedimentos();
    }

    // Reseta campos do formulário visualmente, MAS NÃO O BUSCA_CPF
    const frm = document.getElementById('frmAtendimento');
    if(frm) {
        // Limpa inputs exceto o de busca
        const inputs = frm.querySelectorAll('input:not(#busca_cpf), textarea, select');
        inputs.forEach(inp => {
            if(inp.type !== 'button' && inp.type !== 'submit' && inp.type !== 'hidden') {
                inp.value = '';
            }
        });
        // Reseta IDs ocultos de edição
        document.getElementById('atend_id_hidden').value = '';
    }

    // Reseta selects customizados
    if(typeof CONFIG_SELECTS !== 'undefined') {
        CONFIG_SELECTS.forEach(cfg => {
            const sel = document.getElementById(`sel_${cfg.id}`);
            if(sel) sel.value = "";
            if(typeof cancelSelectNew === 'function') cancelSelectNew(cfg.id);
        });
    }

    // Restaura interface para modo "Novo"
    if(typeof toggleModoEdicao === 'function') toggleModoEdicao(false);
    document.getElementById('resultado_busca').innerText = '';
    document.getElementById('resto-form-atendimento').classList.add('hidden');
    
    const dataAb = document.getElementById('data_abertura');
    if(dataAb) dataAb.valueAsDate = new Date();

    // 3. PREENCHIMENTO GARANTIDO
    const inputBusca = document.getElementById('busca_cpf');
    if(inputBusca) inputBusca.value = cpf;

    // Tenta encontrar na memória (todosPacientes)
    let paciente = null;
    if (typeof todosPacientes !== 'undefined' && Array.isArray(todosPacientes)) {
        const cpfLimpo = String(cpf).replace(/\D/g, '');
        paciente = todosPacientes.find(p => String(p.id) === String(id)) || 
                   todosPacientes.find(p => String(p.cpf).replace(/\D/g, '') === cpfLimpo);
    }

    if (paciente) {
        // Encontrou na memória: Preenche direto
        const resDiv = document.getElementById('resultado_busca');
        const hiddenCpf = document.getElementById('hidden_cpf');
        const hiddenNome = document.getElementById('hidden_nome');
        
        if(resDiv) resDiv.innerHTML = `<span class="text-emerald-600 font-bold flex items-center gap-1"><i data-lucide="check" class="w-4 h-4"></i> ${paciente.nome}</span>`;
        if(hiddenCpf) hiddenCpf.value = paciente.cpf || cpf;
        if(hiddenNome) hiddenNome.value = paciente.nome;
        
        document.getElementById('resto-form-atendimento').classList.remove('hidden');
        
        // Foca na data
        if(dataAb) setTimeout(() => dataAb.focus(), 100);
    } else {
        // Não encontrou: Busca na API
        if(typeof buscarPacienteParaAtendimento === 'function') {
            buscarPacienteParaAtendimento();
        }
    }
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
};
