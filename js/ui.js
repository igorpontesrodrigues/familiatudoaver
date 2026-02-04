/**
 * js/ui.js
 * Funções de manipulação da interface (DOM) e lógica de visualização.
 */

// ============================================================================
// VARIÁVEIS GLOBAIS DE UI
// ============================================================================
let listaProcedimentosTemp = []; // Armazena os itens adicionados antes de salvar
window.historicoAtualCache = []; // Armazena o histórico do munícipe atual para impressão

// ============================================================================
// 1. LOGIN E PERMISSÕES
// ============================================================================

// Listener para tecla Enter no login
document.addEventListener('DOMContentLoaded', function() {
    const inputSenha = document.getElementById('login-senha');
    if (inputSenha) {
        inputSenha.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); 
                fazerLogin();
            }
        });
    }
});

function fazerLogin() {
    const senhaEl = document.getElementById('login-senha');
    const msg = document.getElementById('login-msg');

    if (!senhaEl) return;
    const senha = senhaEl.value;

    if (senha === 'simone123') {
        currentUserRole = 'ADMIN';
        iniciarSistema('Administrador');
    } else {
        msg.innerText = "Senha incorreta.";
        senhaEl.classList.add('border-red-500');
        setTimeout(() => senhaEl.classList.remove('border-red-500'), 2000);
    }
}

function loginVisitante() {
    currentUserRole = 'VISITOR';
    iniciarSistema('Visitante');
}

function iniciarSistema(roleName) {
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('user-role-display').innerText = roleName;
    switchTab('dashboard');
    aplicarPermissoes();
}

function logout() {
    location.reload(); 
}

function aplicarPermissoes() {
    const isVisitor = currentUserRole === 'VISITOR';
    
    const sidebarActions = document.getElementById('sidebar-actions');
    if(sidebarActions) sidebarActions.style.display = isVisitor ? 'none' : 'block';

    const botoesAcao = document.querySelectorAll('.btn-action, .btn-delete');
    botoesAcao.forEach(btn => {
        if(isVisitor) btn.classList.add('hidden');
        else {
            if(!btn.classList.contains('btn-delete')) {
                btn.classList.remove('hidden');
            }
        }
    });

    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(inp => {
        const id = inp.id || '';
        const isFilter = id.includes('filtro') || id.includes('busca') || id.includes('dash-filter') || id.includes('rel-filter') || id.includes('parc-filter');
        
        if(!isFilter) {
            if(isVisitor) inp.setAttribute('disabled', 'true');
            else inp.removeAttribute('disabled');
        } else {
            inp.removeAttribute('disabled');
        }
    });
}

// ============================================================================
// 2. NAVEGAÇÃO
// ============================================================================

/**
 * Função switchTab atualizada:
 * Adicionado parâmetro 'shouldReset' (padrão true).
 * Se for false, não limpa o formulário ao trocar de aba (usado na edição).
 */
function switchTab(tabId, shouldReset = true) {
    window.scrollTo({ top: 0, behavior: 'instant' });

    const views = [
        'view-lista-pacientes', 'view-lista-atendimentos', 
        'view-form-paciente', 'view-form-atendimento', 
        'view-dashboard', 'view-relatorios', 
        'view-parceiros', 'view-historico-paciente', 
        'view-detalhe-atendimento'
    ];
    
    views.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
    
    const target = document.getElementById('view-' + tabId);
    if(target) target.classList.remove('hidden');
    
    // Só reseta se shouldReset for true
    if (shouldReset) {
        if (tabId === 'form-paciente') resetFormPaciente();
        if (tabId === 'form-atendimento') resetFormAtendimento();
    }
    
    if (tabId === 'lista-pacientes') {
        const listaVisible = !document.getElementById('subview-pacientes-lista').classList.contains('hidden');
        if(listaVisible && typeof carregarListaPacientes === 'function') carregarListaPacientes();
        else if (typeof carregarAniversarios === 'function') carregarAniversarios();
    }

    if (tabId === 'lista-atendimentos' && typeof carregarListaAtendimentos === 'function') carregarListaAtendimentos();
    if (tabId === 'dashboard' && typeof loadDashboard === 'function') loadDashboard();
    if (tabId === 'parceiros' && typeof initParceiros === 'function') initParceiros();
    if (tabId === 'relatorios' && typeof initRelatorios === 'function') initRelatorios();

    if(currentUserRole) aplicarPermissoes();
}

function voltarInicio() { 
    switchTab('lista-pacientes'); 
}

function alternarSubAbaPacientes(aba) {
    const listaDiv = document.getElementById('subview-pacientes-lista');
    const niverDiv = document.getElementById('subview-pacientes-niver');
    const btnLista = document.getElementById('tab-btn-lista');
    const btnNiver = document.getElementById('tab-btn-niver');
    const buscaContainer = document.getElementById('container-busca-pacientes');
    const filtroNiver = document.getElementById('container-filtro-niver');

    if (aba === 'lista') {
        listaDiv.classList.remove('hidden');
        niverDiv.classList.add('hidden');
        buscaContainer.classList.remove('hidden');
        filtroNiver.classList.add('hidden');
        filtroNiver.style.display = 'none'; 

        btnLista.className = "text-blue-600 border-b-2 border-blue-600 pb-2 transition-all";
        btnNiver.className = "text-slate-500 hover:text-blue-500 pb-2 transition-all flex items-center gap-1";
        
        if(typeof carregarListaPacientes === 'function') carregarListaPacientes();
    } else {
        listaDiv.classList.add('hidden');
        niverDiv.classList.remove('hidden');
        buscaContainer.classList.add('hidden');
        filtroNiver.classList.remove('hidden');
        filtroNiver.style.display = 'flex';

        btnNiver.className = "text-pink-600 border-b-2 border-pink-600 pb-2 transition-all flex items-center gap-1";
        btnLista.className = "text-slate-500 hover:text-blue-500 pb-2 transition-all";

        if(typeof carregarAniversarios === 'function') carregarAniversarios();
    }
}

// ============================================================================
// 3. MODAIS E MENSAGENS
// ============================================================================

function showMessage(msg, type) {
    const el = document.getElementById('system-message');
    if(!el) return;
    el.innerHTML = msg;
    el.className = `mb-4 p-4 rounded-lg border flex items-center gap-2 ${type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`;
    el.classList.remove('hidden');
    if(type !== 'error') setTimeout(() => el.classList.add('hidden'), 5000);
}

function abrirDetalheAtendimento(at) {
    const backdrop = document.getElementById('modal-backdrop-detalhe');
    if(!backdrop) return;
    const innerModal = document.getElementById('view-detalhe-atendimento');
    innerModal.classList.remove('hidden');
    backdrop.classList.remove('hidden');

    document.getElementById('det-paciente').innerText = at.nome_paciente || at.nome || '-';
    document.getElementById('det-cpf').innerText = `CPF: ${at.cpf_paciente || at.cpf || '-'}`;
    document.getElementById('det-status').innerText = at.status || 'PENDENTE';
    
    const statusEl = document.getElementById('det-status');
    statusEl.className = "px-3 py-1 rounded-full text-xs font-bold border shadow-sm " + 
        (at.status === 'CONCLUIDO' ? 'bg-emerald-100 text-emerald-700' : 
        (at.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' : 
        (at.status === 'CANCELADO' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600')));

    document.getElementById('det-data').innerText = at.data_abertura ? at.data_abertura.split('-').reverse().join('/') : '-';
    document.getElementById('det-tipo').innerText = (at.tipo_servico || '') + (at.tipo ? ` - ${at.tipo}` : '');
    document.getElementById('det-servico').innerText = at.especialidade || '-';
    document.getElementById('det-local').innerText = at.local || '-';
    document.getElementById('det-parceiro').innerText = at.parceiro || '-';
    
    document.getElementById('det-marcacao').innerText = at.data_marcacao ? at.data_marcacao.split('-').reverse().join('/') : '-';
    document.getElementById('det-risco').innerText = at.data_risco ? at.data_risco.split('-').reverse().join('/') : '-';
    document.getElementById('det-obs').innerText = at.obs_atendimento || 'Sem observações.';

    const btnEdit = document.getElementById('btn-editar-detalhe');
    
    if(currentUserRole === 'VISITOR') {
        btnEdit.classList.add('hidden');
    } else {
        btnEdit.classList.remove('hidden');
        btnEdit.onclick = function() {
            fecharDetalhe();
            abrirEdicaoAtendimento(at);
        };
    }
}

function fecharDetalhe() {
    document.getElementById('modal-backdrop-detalhe').classList.add('hidden');
}

function abrirListaRelatorio(tipo, index) {
    if(!window.dadosRelatorioCache || !window.dadosRelatorioCache[tipo]) return;
    const dados = window.dadosRelatorioCache[tipo][index];
    if(!dados) return;

    document.getElementById('modal-lista-relatorio').classList.remove('hidden');
    document.getElementById('titulo-modal-relatorio').innerText = `${dados.nome} (${dados.qtd})`;
    const tbody = document.getElementById('tbody-modal-relatorio');
    tbody.innerHTML = '';

    dados.lista.forEach(at => {
        const tempId = 'rel_item_' + Math.random().toString(36).substr(2, 9);
        window[tempId] = at;
        const tr = document.createElement('tr');
        tr.className = "hover:bg-blue-50 cursor-pointer transition border-b border-slate-50";
        let badgeEspera = "bg-slate-100 text-slate-600";
        if(at.diasEspera > 90) badgeEspera = "bg-red-100 text-red-700";
        else if(at.diasEspera > 30) badgeEspera = "bg-orange-100 text-orange-700";
        else badgeEspera = "bg-green-100 text-green-700";

        tr.innerHTML = `
            <td class="px-6 py-3 font-mono text-xs text-slate-500">${at.data_abertura ? at.data_abertura.split('-').reverse().join('/') : '-'}</td>
            <td class="px-6 py-3">
                <div class="font-bold text-slate-700 text-sm uppercase">${at.nome}</div>
                <div class="text-xs text-slate-400 flex gap-2"><span>${at.local || 'Local N/I'}</span><span class="text-slate-300">|</span><span>CPF: ${at.cpf || '...'}</span></div>
            </td>
            <td class="px-6 py-3 text-right"><span class="${badgeEspera} px-2 py-1 rounded text-xs font-bold">${at.diasEspera} dias</span></td>
        `;
        tr.onclick = () => {
            document.getElementById('modal-lista-relatorio').classList.add('hidden');
            abrirDetalheAtendimento(window[tempId]);
        };
        tbody.appendChild(tr);
    });
}

// ============================================================================
// 4. LOGICA DE PROCEDIMENTOS MÚLTIPLOS & CONTROLE DE UI
// ============================================================================

function toggleModoEdicao(isEdicao) {
    const btnAdd = document.getElementById('btn-add-lista');
    const containerLista = document.getElementById('container-lista-procedimentos');
    const tituloForm = document.getElementById('titulo_form_atend');
    const btnSave = document.getElementById('btn-save-atendimento');
    
    if (isEdicao) {
        if(btnAdd) btnAdd.classList.add('hidden');
        if(containerLista) containerLista.classList.add('hidden');
        if(tituloForm) tituloForm.innerText = "Editar Atendimento";
        // No modo edição, o texto deve refletir atualização única
        if(btnSave) btnSave.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5"></i> Atualizar Dados`;
    } else {
        if(btnAdd) btnAdd.classList.remove('hidden');
        if(containerLista) containerLista.classList.remove('hidden');
        if(tituloForm) tituloForm.innerText = "Novo Atendimento";
        if(btnSave) btnSave.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5"></i> Salvar Todos os Atendimentos`;
    }
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function adicionarProcedimentoNaLista() {
    const dataAbertura = document.getElementById('data_abertura').value;
    const prontuario = document.getElementById('field_prontuario').value;
    const tipoServico = document.getElementById('field_tipo_servico').value;
    const parceiro = document.getElementById('field_parceiro').value;
    const especialidade = document.getElementById('field_especialidade').value;
    const procedimento = document.getElementById('field_procedimento').value;
    const local = document.getElementById('field_local').value;
    const tipoDetalhe = document.getElementById('field_tipo').value;
    const valor = document.getElementById('field_valor').value;
    const dataMarcacao = document.getElementById('field_data_marcacao').value;
    const dataRisco = document.getElementById('field_data_risco').value;
    const dataConclusao = document.getElementById('field_data_conclusao').value;
    const status = document.getElementById('field_status_atendimento').value; 
    const obs = document.getElementById('field_obs_atendimento').value;

    if (!tipoServico && !procedimento && !especialidade) {
        alert("Preencha pelo menos o Tipo de Serviço, Especialidade ou Procedimento.");
        return;
    }

    const item = {
        tempId: Date.now(),
        data_abertura: dataAbertura,
        prontuario: prontuario,
        tipo_servico: tipoServico,
        parceiro: parceiro,
        especialidade: especialidade,
        procedimento: procedimento,
        local: local,
        tipo: tipoDetalhe,
        valor: valor,
        data_marcacao: dataMarcacao,
        data_risco: dataRisco,
        data_conclusao: dataConclusao,
        status: status || (dataConclusao ? 'CONCLUIDO' : 'PENDENTE'),
        obs_atendimento: obs
    };

    listaProcedimentosTemp.push(item);
    renderizarTabelaProcedimentos();
    
    // Limpa campos do card
    ['field_especialidade', 'field_procedimento', 'field_local', 'field_tipo', 
     'field_valor', 'field_data_marcacao', 'field_data_risco', 'field_data_conclusao', 
     'field_obs_atendimento'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
    
    ['especialidade', 'procedimento', 'local', 'tipo'].forEach(k => {
        const sel = document.getElementById(`sel_${k}`);
        if(sel) sel.value = "";
        cancelSelectNew(k);
    });
}

function renderizarTabelaProcedimentos() {
    const tbody = document.getElementById('lista-procedimentos-temp');
    if(!tbody) return; // Proteção se o elemento não existir
    tbody.innerHTML = '';

    if (listaProcedimentosTemp.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-slate-400 italic">Nenhum item adicionado.</td></tr>';
        return;
    }

    listaProcedimentosTemp.forEach((item, index) => {
        const tr = document.createElement('tr');
        const dataFmt = item.data_marcacao ? item.data_marcacao.split('-').reverse().join('/') : (item.data_abertura ? item.data_abertura.split('-').reverse().join('/') : '-');
        const desc = `${item.tipo_servico || ''} ${item.especialidade || ''} ${item.procedimento || ''}`.trim();
        
        let statusColor = item.status === 'CONCLUIDO' ? 'text-emerald-600' : 'text-orange-600';

        tr.innerHTML = `
            <td class="px-4 py-2 font-mono text-xs">${dataFmt}</td>
            <td class="px-4 py-2 uppercase text-xs font-bold text-slate-700">${desc}</td>
            <td class="px-4 py-2 uppercase text-xs">${item.local || '-'}</td>
            <td class="px-4 py-2 text-xs font-bold ${statusColor}">${item.status}</td>
            <td class="px-4 py-2 text-right">
                <button type="button" onclick="removerItemTemp(${index})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function removerItemTemp(index) {
    listaProcedimentosTemp.splice(index, 1);
    renderizarTabelaProcedimentos();
}

function checkStatusConclusao() {
    const dataConc = document.getElementById('field_data_conclusao').value;
    const selStatus = document.getElementById('sel_status_atendimento');
    const fieldStatus = document.getElementById('field_status_atendimento');
    
    if (dataConc) {
        if(selStatus) selStatus.value = 'CONCLUIDO';
        if(fieldStatus) fieldStatus.value = 'CONCLUIDO';
    } else {
        if(selStatus && selStatus.value === 'CONCLUIDO') {
            selStatus.value = 'PENDENTE';
            if(fieldStatus) fieldStatus.value = 'PENDENTE';
        }
    }
}

async function submitAtendimento(e) {
    if(e) e.preventDefault(); 
    const id = document.getElementById('atend_id_hidden').value;

    // --- MODO EDIÇÃO (Single) ---
    if (id) {
        const data = {
            id: id,
            cpf_paciente: document.getElementById('hidden_cpf').value,
            nome_paciente: document.getElementById('hidden_nome').value,
            data_abertura: document.getElementById('data_abertura').value,
            prontuario: document.getElementById('field_prontuario').value,
            tipo_servico: document.getElementById('field_tipo_servico').value,
            parceiro: document.getElementById('field_parceiro').value,
            especialidade: document.getElementById('field_especialidade').value,
            procedimento: document.getElementById('field_procedimento').value,
            local: document.getElementById('field_local').value,
            tipo: document.getElementById('field_tipo').value,
            valor: document.getElementById('field_valor').value,
            data_marcacao: document.getElementById('field_data_marcacao').value,
            data_risco: document.getElementById('field_data_risco').value,
            data_conclusao: document.getElementById('field_data_conclusao').value,
            status: document.getElementById('field_status_atendimento').value,
            obs_atendimento: document.getElementById('field_obs_atendimento').value
        };

        if(await sendData('registerService', data, 'loading-atendimento')) { 
            if(typeof resetFormAtendimento === 'function') resetFormAtendimento(); 
            switchTab('lista-atendimentos');
        }
        return;
    }

    // --- MODO CRIAÇÃO (Lote/Batch) ---
    if (typeof listaProcedimentosTemp === 'undefined' || listaProcedimentosTemp.length === 0) {
        alert("Adicione pelo menos um procedimento à lista antes de salvar.");
        return;
    }

    const cpf = document.getElementById('hidden_cpf').value;
    const nome = document.getElementById('hidden_nome').value;

    if(!cpf && !nome) { alert("Busque o munícipe."); return; }

    // Limpeza de dados para evitar erros de payload
    const batch = listaProcedimentosTemp.map(item => {
        // Remove tempId e garante que todos os campos existam para evitar undefined
        const { tempId, ...cleanItem } = item;
        return {
            ...cleanItem,
            cpf_paciente: cpf,
            nome_paciente: nome
        };
    });

    if(await sendData('registerServiceBatch', batch, 'loading-atendimento')) { 
        // 1. LIMPEZA EXPLÍCITA IMEDIATA PARA EVITAR DUPLICIDADE
        listaProcedimentosTemp = []; 
        renderizarTabelaProcedimentos(); // Atualiza a tabela visualmente para vazia

        // 2. Reseta o formulário (ISSO AGORA LIMPA CPF E NOME OCULTOS)
        if(typeof resetFormAtendimento === 'function') resetFormAtendimento(); 
        
        // 3. Foca no campo de busca para o próximo paciente (Fluxo contínuo)
        setTimeout(() => {
            const buscaEl = document.getElementById('busca_cpf');
            if(buscaEl) {
                // buscaEl.value = ""; // Já é limpo no resetFormAtendimento
                buscaEl.focus(); 
            }
        }, 100);
    }
}

// ============================================================================
// 5. FORMULÁRIOS E PREENCHIMENTO
// ============================================================================

function renderizarSelectsVazios() {
    if(typeof CONFIG_SELECTS === 'undefined') return;
    CONFIG_SELECTS.forEach(cfg => {
        const el = document.getElementById(cfg.container);
        if(el) {
            const fieldName = cfg.nameOverride || cfg.id;
            el.innerHTML = `
                <label class="label-field">${cfg.label}</label>
                <div class="relative">
                    <select id="sel_${cfg.id}" onchange="checkSelectNew('${cfg.id}')" class="input-field bg-white uppercase">
                        <option value="">Carregando...</option>
                    </select>
                    <div id="grp_new_${cfg.id}" class="hidden mt-1 flex gap-1 animate-fade-in">
                        <input type="text" id="inp_${cfg.id}" placeholder="Digite novo..." class="switched-input flex-1 input-field uppercase">
                        <button type="button" onclick="cancelSelectNew('${cfg.id}')" class="bg-red-100 text-red-600 px-3 rounded hover:bg-red-200">✕</button>
                    </div>
                    <input type="hidden" name="${fieldName}" id="field_${cfg.id}">
                </div>`;
        }
    });
}

function checkSelectNew(id) {
    const sel = document.getElementById(`sel_${id}`);
    if (sel.value === '__NEW__') {
        sel.classList.add('hidden');
        document.getElementById(`grp_new_${id}`).classList.remove('hidden');
        document.getElementById(`inp_${id}`).focus();
        document.getElementById(`field_${id}`).value = '';
    } else {
        document.getElementById(`field_${id}`).value = sel.value;
    }
}

function cancelSelectNew(id) {
    const sel = document.getElementById(`sel_${id}`);
    sel.value = ""; 
    document.getElementById(`field_${id}`).value = "";
    sel.classList.remove('hidden'); 
    document.getElementById(`grp_new_${id}`).classList.add('hidden');
}

function preencherSelectInteligente(id, valor) {
    if(!valor) return;
    const sel = document.getElementById(`sel_${id}`);
    const hidden = document.getElementById(`field_${id}`);
    hidden.value = valor;
    sel.classList.remove('hidden');
    document.getElementById(`grp_new_${id}`).classList.add('hidden');
    
    let exists = false;
    for(let i=0; i<sel.options.length; i++) {
        if(sel.options[i].value.toUpperCase() === valor.toUpperCase()) {
            sel.selectedIndex = i;
            exists = true;
            break;
        }
    }
    if(!exists) {
        const novaOpcao = new Option(valor, valor, true, true);
        const lastIndex = sel.options.length - 1;
        if (lastIndex >= 0 && sel.options[lastIndex].value === '__NEW__') {
            sel.add(novaOpcao, sel.options[lastIndex]); 
        } else {
            sel.add(novaOpcao);
        }
        sel.value = valor;
    }
}

function renderizarTabelaPacientes(lista) {
    const tbody = document.getElementById('tabela-pacientes-body');
    tbody.innerHTML = '';
    if(lista.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>'; return; 
    }
    lista.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition-colors";
        const pStr = JSON.stringify(p).replace(/"/g, '&quot;');
        
        const btnEditClass = currentUserRole === 'VISITOR' ? 'hidden' : '';
        
        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-slate-800 uppercase" onclick="verHistoricoCompleto(${pStr})">${p.nome}</td>
            <td class="px-6 py-4 text-slate-600" onclick="verHistoricoCompleto(${pStr})">${p.cpf || '<span class="text-orange-500 text-xs font-bold px-2 py-1 bg-orange-100 rounded">SEM CPF</span>'}</td>
            <td class="px-6 py-4 hidden sm:table-cell text-slate-500" onclick="verHistoricoCompleto(${pStr})">${p.tel||'-'}</td>
            <td class="px-6 py-4 hidden md:table-cell uppercase text-slate-500" onclick="verHistoricoCompleto(${pStr})">${p.municipio||'-'}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="event.stopPropagation(); abrirAtendimentoDireto('${p.cpf}','${p.id}')" class="btn-action bg-emerald-100 text-emerald-700 p-2 rounded-lg mr-2 hover:bg-emerald-200 transition ${btnEditClass}" title="Novo Atendimento"><i data-lucide="plus" class="w-4 h-4"></i></button>
                <button onclick="event.stopPropagation(); abrirEdicaoDireta('${p.cpf}','${p.id}')" class="btn-action bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition ${btnEditClass}" title="Editar"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
            </td>`;
        tbody.appendChild(tr);
    });
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function renderizarTabelaAtendimentos(lista) {
    const tbody = document.getElementById('tabela-atendimentos-body');
    const contador = document.getElementById('contador-atendimentos');
    
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">Nenhum atendimento encontrado.</td></tr>';
        if(contador) contador.innerText = "0 registros";
        return;
    }

    lista.forEach(at => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-blue-50 transition-colors cursor-pointer group";
        
        const dataFmt = at.data_abertura ? at.data_abertura.split('-').reverse().join('/') : '-';
        
        let statusClass = "bg-slate-100 text-slate-600";
        if(at.status === 'CONCLUIDO') statusClass = "bg-emerald-100 text-emerald-700";
        if(at.status === 'PENDENTE') statusClass = "bg-amber-100 text-amber-700";
        if(at.status === 'CANCELADO') statusClass = "bg-red-100 text-red-700";

        const tempId = 'at_' + Math.random().toString(36).substr(2, 9);
        window[tempId] = at; 

        tr.onclick = () => abrirDetalheAtendimento(window[tempId]);

        tr.innerHTML = `
            <td class="px-4 py-4 font-mono text-xs text-slate-500">${dataFmt}</td>
            <td class="px-4 py-4">
                <div class="font-bold text-slate-700 text-sm uppercase">${at.nome_paciente || at.nome || 'Sem Nome'}</div>
                <div class="text-xs text-slate-400 font-mono">${at.cpf_paciente || at.cpf || '...'}</div>
            </td>
            <td class="px-4 py-4 text-xs uppercase text-slate-600 font-bold">${at.tipo_servico || '-'}</td>
            <td class="px-4 py-4 text-xs uppercase text-slate-500">${at.especialidade || '-'}</td>
            <td class="px-4 py-4 text-xs uppercase text-slate-500">${at.procedimento || '-'}</td>
            <td class="px-4 py-4">
                <span class="${statusClass} px-2 py-1 rounded text-[10px] font-bold uppercase border border-black/5">${at.status}</span>
            </td>
            <td class="px-4 py-4 text-right">
                <button onclick="event.stopPropagation(); abrirEdicaoAtendimentoId('${at.id}')" class="text-blue-600 hover:bg-blue-100 p-2 rounded border border-transparent hover:border-blue-200 transition" title="Editar">
                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if(contador) contador.innerText = `${lista.length} registros exibidos`;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function renderizarTorreGenero(pacientes) {
    let masc = 0, fem = 0;
    pacientes.forEach(p => {
        const s = p.sexo ? p.sexo.toUpperCase() : '';
        if(s === 'M' || s === 'MASCULINO') masc++;
        else if(s === 'F' || s === 'FEMININO') fem++;
    });
    const total = masc + fem || 1;
    const pMasc = Math.round((masc / total) * 100);
    const pFem = Math.round((fem / total) * 100);
    document.getElementById('val-masc').innerText = masc;
    document.getElementById('val-fem').innerText = fem;
    setTimeout(() => {
        const tMasc = document.getElementById('tower-masc');
        const tFem = document.getElementById('tower-fem');
        if(tMasc) tMasc.style.height = `${pMasc}%`;
        if(tFem) tFem.style.height = `${pFem}%`;
    }, 100);
}

function resetFormPaciente() {
    document.getElementById('frmPaciente').reset();
    document.getElementById('paciente_id_hidden').value = "";
    document.getElementById('msg_cpf_paciente').innerText = '';
    document.getElementById('opcoes-paciente-existente').classList.add('hidden');
    document.getElementById('resto-form-paciente').classList.add('hidden');
    document.getElementById('btn-imprimir').classList.add('hidden');
    
    const btnDelete = document.getElementById('btn-delete-paciente');
    if(btnDelete) btnDelete.classList.add('hidden');
    
    CONFIG_SELECTS.forEach(cfg => {
        const sel = document.getElementById(`sel_${cfg.id}`);
        if(sel && cfg.id !== 'status_atendimento') sel.value = "";
        cancelSelectNew(cfg.id);
    });
}

function resetFormAtendimento() {
    const frm = document.getElementById('frmAtendimento');
    if(frm) frm.reset();
    
    const idHidden = document.getElementById('atend_id_hidden');
    if(idHidden) idHidden.value = "";
    
    const titulo = document.getElementById('titulo_form_atend');
    if(titulo) titulo.innerText = "Novo Atendimento";
    
    const btnTxt = document.getElementById('txt_btn_atend');
    if(btnTxt) btnTxt.innerText = "Salvar Todos os Atendimentos";
    
    const resBusca = document.getElementById('resultado_busca');
    if(resBusca) resBusca.innerText = '';
    
    const resto = document.getElementById('resto-form-atendimento');
    if(resto) resto.classList.add('hidden');
    
    // LIMPEZA CRÍTICA: Garante que os dados do paciente anterior sejam removidos
    const hiddenCpf = document.getElementById('hidden_cpf');
    const hiddenNome = document.getElementById('hidden_nome');
    const buscaCpf = document.getElementById('busca_cpf');
    
    if(hiddenCpf) hiddenCpf.value = "";
    if(hiddenNome) hiddenNome.value = "";
    if(buscaCpf) buscaCpf.value = ""; // Limpa visualmente a busca
    
    const btnDelete = document.getElementById('btn-delete-atendimento');
    if(btnDelete) btnDelete.classList.add('hidden');
    
    const dataAb = document.getElementById('data_abertura');
    if(dataAb) dataAb.valueAsDate = new Date();
    
    // Reseta lista temporária
    listaProcedimentosTemp = [];
    renderizarTabelaProcedimentos();

    // RESTAURA MODO PADRÃO (NOVO)
    toggleModoEdicao(false);

    // RESET DO PRONTUÁRIO (Volta a ficar bloqueado)
    const prontuarioInput = document.getElementById('field_prontuario');
    if(prontuarioInput) {
        prontuarioInput.value = '';
        prontuarioInput.disabled = true;
        prontuarioInput.classList.add('bg-slate-100', 'cursor-not-allowed');
        prontuarioInput.classList.remove('bg-white');
        prontuarioInput.placeholder = "Selecione Local HO...";
    }

    const inpConclusao = document.getElementById('field_data_conclusao');
    if(inpConclusao) {
        inpConclusao.onchange = checkStatusConclusao;
    }
    
    if(typeof CONFIG_SELECTS !== 'undefined') {
        CONFIG_SELECTS.forEach(cfg => {
            const sel = document.getElementById(`sel_${cfg.id}`);
            if(sel) sel.value = "";
            cancelSelectNew(cfg.id);
        });
    }
}

function mostrarFormularioPaciente(isEdit, dados = null) {
    document.getElementById('resto-form-paciente').classList.remove('hidden');
    document.getElementById('opcoes-paciente-existente').classList.add('hidden');
    
    const btnPrint = document.getElementById('btn-imprimir');
    const btnDelete = document.getElementById('btn-delete-paciente');
    
    if(isEdit) {
        btnPrint.classList.remove('hidden');
        if(currentUserRole === 'ADMIN') {
            btnDelete.classList.remove('hidden');
        } else {
            btnDelete.classList.add('hidden');
        }
    } else {
        btnPrint.classList.add('hidden');
        btnDelete.classList.add('hidden');
    }

    if(isEdit && dados) {
        document.getElementById('paciente_id_hidden').value = dados.id;
        
        const fields = [
            'nome','apelido','familia','rg','nascimento','sexo','tel1','tel2',
            'cep','logradouro','municipio_titulo','zona','secao','obs',
            'sus', 'referencia', 'lideranca'
        ];
        
        fields.forEach(k => { const el = document.getElementById(`field_${k}`); if(el) el.value = dados[k] || ''; });
        
        ['municipio','bairro','status_titulo', 'indicacao'].forEach(k => { 
            preencherSelectInteligente(k, dados[k]); 
        });
        
        const elTitulo = document.getElementById('field_titulo'); if(elTitulo) elTitulo.value = dados.titulo || '';
    }
}

function abrirEdicaoDireta(cpf, id) {
    // Passa false para NÃO resetar o formulário automaticamente, pois vamos popular
    switchTab('form-paciente', false);
    const inputCpf = document.getElementById('paciente_cpf_check');
    const cpfStr = cpf ? String(cpf) : '';
    inputCpf.value = cpfStr;
    
    if (id) {
        if(typeof verificarPorId === 'function') verificarPorId(id);
    } else if (cpfStr && cpfStr.length > 4) {
        if(typeof verificarCpfInicial === 'function') verificarCpfInicial();
    }
}

function abrirEdicaoAtendimento(at) {
    // CORREÇÃO CRÍTICA: Passa false para NÃO resetar o formulário
    switchTab('form-atendimento', false);
    
    // ATIVA MODO DE EDIÇÃO (Esconde lista e botões de lote)
    toggleModoEdicao(true);

    document.getElementById('atend_id_hidden').value = at.id;
    document.getElementById('busca_cpf').value = at.cpf_paciente || at.cpf;
    document.getElementById('hidden_cpf').value = at.cpf_paciente || at.cpf;
    document.getElementById('hidden_nome').value = at.nome_paciente || at.nome;
    document.getElementById('resultado_busca').innerHTML = `<span class="text-blue-700 font-bold flex items-center gap-1"><i data-lucide="user" class="w-4 h-4"></i> Editando: ${at.nome_paciente || at.nome}</span>`;
    document.getElementById('resto-form-atendimento').classList.remove('hidden');

    const btnDelete = document.getElementById('btn-delete-atendimento');
    if(currentUserRole === 'ADMIN') {
        btnDelete.classList.remove('hidden');
    } else {
        btnDelete.classList.add('hidden');
    }

    document.getElementById('data_abertura').value = at.data_abertura || '';
    
    // LOGICA DO PRONTUÁRIO NA EDIÇÃO
    const prontuarioInput = document.getElementById('field_prontuario');
    const localVal = at.local ? at.local.toUpperCase() : '';
    
    if(localVal === 'HO') {
        prontuarioInput.disabled = false;
        prontuarioInput.classList.remove('bg-slate-100', 'cursor-not-allowed');
        prontuarioInput.classList.add('bg-white');
        prontuarioInput.value = at.prontuario || '';
    } else {
        prontuarioInput.disabled = true;
        prontuarioInput.classList.add('bg-slate-100', 'cursor-not-allowed');
        prontuarioInput.value = '';
    }

    document.getElementById('field_tipo').value = at.tipo || ''; 
    document.getElementById('field_data_marcacao').value = at.data_marcacao || '';
    document.getElementById('field_data_risco').value = at.data_risco || '';
    document.getElementById('field_data_conclusao').value = at.data_conclusao || '';
    document.getElementById('field_valor').value = at.valor || '';
    document.getElementById('field_obs_atendimento').value = at.obs_atendimento || '';

    ['tipo_servico','parceiro','especialidade','procedimento','local','tipo','status_atendimento'].forEach(k => {
        const val = k === 'status_atendimento' ? at.status : at[k];
        preencherSelectInteligente(k, val);
    });
    
    const inpConclusao = document.getElementById('field_data_conclusao');
    if(inpConclusao) inpConclusao.onchange = checkStatusConclusao;
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
    if(currentUserRole === 'VISITOR') aplicarPermissoes();
}

function abrirEdicaoAtendimentoId(id) {
    // CORREÇÃO CRÍTICA: Converte para String para garantir comparação correta
    const at = todosAtendimentos.find(x => String(x.id) === String(id));
    if(at) abrirEdicaoAtendimento(at);
}

function abrirAtendimentoDireto(cpf, id) {
    if(!cpf || cpf.length < 5) { alert("Munícipe sem CPF. Edite o cadastro primeiro."); abrirEdicaoDireta(cpf, id); return; }
    // Aqui usamos o reset padrão (true) pois é um NOVO atendimento para um paciente existente
    switchTab('form-atendimento'); 
    document.getElementById('busca_cpf').value = cpf;
    if(typeof buscarPacienteParaAtendimento === 'function') buscarPacienteParaAtendimento();
}

async function submitPaciente(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    data.cpf = document.getElementById('paciente_cpf_check').value;
    if(!data.cpf || data.cpf.length < 5) { alert("CPF obrigatório."); return; }
    
    if(await sendData('registerPatient', data, 'loading-paciente')) { 
        if(typeof resetFormPaciente === 'function') resetFormPaciente(); 
        if(typeof voltarInicio === 'function') voltarInicio(); 
    }
}

function calcularDataRisco() {
    const dataMarcacao = document.getElementById('field_data_marcacao').value;
    const campoEspec = document.getElementById('field_especialidade');
    if(!dataMarcacao) return;

    // Ajuste para evitar fuso horário que volta um dia
    const [ano, mes, dia] = dataMarcacao.split('-').map(Number);
    const d = new Date(ano, mes - 1, dia);

    let meses = 3; 
    if(campoEspec && campoEspec.value && campoEspec.value.toUpperCase().includes("OFTALMOLOGIA")) meses = 6;
    d.setMonth(d.getMonth() + meses);
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    document.getElementById('field_data_risco').value = `${yyyy}-${mm}-${dd}`;
}

// ============================================================================
// 6. FUNÇÕES DE EXCLUSÃO (UI HANDLERS)
// ============================================================================

function confirmarExclusaoPaciente() {
    if(!pacienteAtual) return;
    const confirmacao = confirm(`ATENÇÃO: Você está prestes a excluir o munícipe ${pacienteAtual.nome}.\n\nISSO APAGARÁ TAMBÉM TODOS OS ATENDIMENTOS DELE.\n\nTem certeza absoluta?`);
    if(confirmacao) {
        if(typeof excluirPacienteAPI === 'function') excluirPacienteAPI(pacienteAtual.id, pacienteAtual.cpf);
    }
}

function confirmarExclusaoAtendimento() {
    const id = document.getElementById('atend_id_hidden').value;
    if(!id) return;
    const confirmacao = confirm("Tem certeza que deseja excluir este atendimento?");
    if(confirmacao) {
        if(typeof excluirAtendimentoAPI === 'function') excluirAtendimentoAPI(id);
    }
}

// ============================================================================
// 7. RELATÓRIO ELEITORAL (NOVO)
// ============================================================================

function abrirRelatorioEleitoral() {
    if (!dashboardRawData || !dashboardRawData.pacientes) {
        alert("Dados do dashboard ainda não carregados. Aguarde um momento.");
        return;
    }

    const modal = document.getElementById('modal-relatorio-eleitoral');
    modal.classList.remove('hidden');

    const statusSet = new Set();
    dashboardRawData.pacientes.forEach(p => {
        const st = p.status_titulo ? p.status_titulo.trim().toUpperCase() : 'N/I';
        statusSet.add(st);
    });
    
    const sel = document.getElementById('filtro-modal-eleitoral');
    sel.innerHTML = '<option value="">Todos os Status</option>';
    Array.from(statusSet).sort().forEach(s => {
        sel.innerHTML += `<option value="${s}">${s}</option>`;
    });

    filtrarRelatorioEleitoral();
}

function filtrarRelatorioEleitoral() {
    const filtro = document.getElementById('filtro-modal-eleitoral').value;
    const tbody = document.getElementById('tbody-relatorio-eleitoral');
    const theadTr = document.querySelector('#modal-relatorio-eleitoral thead tr');
    
    if(theadTr && theadTr.children.length === 4) {
        const thAcao = document.createElement('th');
        thAcao.className = "px-6 py-3 text-right";
        thAcao.innerText = "Ação";
        theadTr.appendChild(thAcao);
    }

    tbody.innerHTML = '';

    const lista = dashboardRawData.pacientes.filter(p => {
        const st = p.status_titulo ? p.status_titulo.trim().toUpperCase() : 'N/I';
        if (filtro && st !== filtro) return false;
        return true;
    });

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Nenhum registro encontrado.</td></tr>';
        document.getElementById('contador-eleitoral').innerText = '0 registros';
        return;
    }

    lista.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-blue-50 transition-colors";
        
        let statusColor = "bg-slate-100 text-slate-600";
        const st = p.status_titulo ? p.status_titulo.toUpperCase() : 'N/I';
        if (st.includes('REGULAR')) statusColor = "bg-green-100 text-green-700";
        else if (st.includes('CANCELADO') || st.includes('SUSPENSO')) statusColor = "bg-red-100 text-red-700";
        else if (st.includes('TRANSFERIDO')) statusColor = "bg-orange-100 text-orange-700";

        const pStr = JSON.stringify(p).replace(/"/g, '&quot;');

        const btnEditClass = currentUserRole === 'VISITOR' ? 'hidden' : '';

        tr.innerHTML = `
            <td class="px-6 py-3">
                <div class="font-bold text-slate-800 text-sm uppercase cursor-pointer hover:text-blue-600" onclick="verHistoricoCompleto(${pStr})">${p.nome}</div>
                <div class="text-xs text-slate-400 font-mono">${p.cpf || 'SEM CPF'}</div>
            </td>
            <td class="px-6 py-3 text-sm text-slate-600">
                <div class="flex items-center gap-1"><i data-lucide="phone" class="w-3 h-3"></i> ${p.tel || '-'}</div>
            </td>
            <td class="px-6 py-3 text-sm text-slate-600">
                <div class="uppercase text-xs font-bold">${p.bairro || '-'}</div>
                <div class="text-[10px] text-slate-400">Bairro</div>
            </td>
            <td class="px-6 py-3 text-center">
                <span class="${statusColor} px-2 py-1 rounded text-[10px] font-bold uppercase border border-black/5">${st}</span>
            </td>
            <td class="px-6 py-3 text-right">
                <button onclick="document.getElementById('modal-relatorio-eleitoral').classList.add('hidden'); abrirEdicaoDireta('${p.cpf}', '${p.id}')" class="text-blue-600 hover:bg-blue-100 p-2 rounded border border-transparent hover:border-blue-200 transition ${btnEditClass}" title="Editar Cadastro">
                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('contador-eleitoral').innerText = `${lista.length} registros encontrados`;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function imprimirRelatorioEleitoral() {
    if (!dashboardRawData || !dashboardRawData.pacientes) {
        alert("Aguarde o carregamento dos dados.");
        return;
    }

    const printArea = document.getElementById('printable-area');
    if (!printArea) return;

    const filtro = document.getElementById('filtro-modal-eleitoral').value;
    
    const lista = dashboardRawData.pacientes.filter(p => {
        const st = p.status_titulo ? p.status_titulo.trim().toUpperCase() : 'N/I';
        if (filtro && st !== filtro) return false;
        return true;
    });

    const tituloRelatorio = filtro ? `Relatório Eleitoral - Status: ${filtro}` : 'Relatório Eleitoral - Geral';

    let html = `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; color: #333;">
            <div style="text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px;">
                <h1 style="margin: 0; font-size: 18px; text-transform: uppercase;">${tituloRelatorio}</h1>
                <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Gabinete Família Tudo a Ver | Total: ${lista.length} registros | Emissão: ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                    <tr style="background-color: #f1f5f9; text-align: left;">
                        <th style="padding: 8px 5px; border-bottom: 1px solid #ccc;">NOME / CPF</th>
                        <th style="padding: 8px 5px; border-bottom: 1px solid #ccc;">CONTATO</th>
                        <th style="padding: 8px 5px; border-bottom: 1px solid #ccc;">LOCALIZAÇÃO</th>
                        <th style="padding: 8px 5px; border-bottom: 1px solid #ccc; text-align: center;">STATUS</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (lista.length === 0) {
        html += `<tr><td colspan="4" style="padding: 15px; text-align: center; color: #666;">Nenhum registro encontrado.</td></tr>`;
    } else {
        lista.forEach((p, index) => {
            const bg = index % 2 === 0 ? '#fff' : '#f8fafc';
            const st = p.status_titulo ? p.status_titulo.toUpperCase() : 'N/I';
            
            html += `
                <tr style="background-color: ${bg}; border-bottom: 1px solid #eee;">
                    <td style="padding: 6px 5px;">
                        <strong style="text-transform: uppercase;">${p.nome}</strong><br>
                        ${p.cpf || '-'}
                    </td>
                    <td style="padding: 6px 5px;">${p.tel || '-'}</td>
                    <td style="padding: 6px 5px; text-transform: uppercase;">${p.bairro || '-'}</td>
                    <td style="padding: 6px 5px; text-align: center; font-weight: bold;">${st}</td>
                </tr>
            `;
        });
    }

    html += `</tbody></table>
        <div style="margin-top: 20px; font-size: 10px; text-align: right; color: #999;">Sistema de Gestão Interna</div>
    </div>`;

    printArea.innerHTML = html;
    window.print();
}

/**
 * Função para imprimir a Ficha do Munícipe (Preenchida)
 * Esta função deve ser chamada pelos botões "Imprimir" no formulário e no histórico.
 */
function imprimirFicha() {
    // Verificação de Segurança Adicional
    const btnHist = document.getElementById('btn-imprimir-historico');
    if (btnHist && btnHist.disabled) {
        // Se o botão estiver desabilitado, impede a execução mesmo que chamada via console
        return;
    }

    const printArea = document.getElementById('printable-area');
    if(!printArea) return;

    let p = pacienteAtual;
    
    // Se estiver na visualização de histórico, usa o objeto de histórico (prioridade)
    const viewHist = document.getElementById('view-historico-paciente');
    if (!viewHist.classList.contains('hidden') && typeof histPacienteAtual !== 'undefined' && histPacienteAtual) {
        p = histPacienteAtual;
    }

    // Se ainda não tiver paciente (ex: impressão direta do formulário de cadastro antes de verificar ID), tenta pegar dos inputs
    if(!p) {
        const nomeInput = document.getElementById('field_nome');
        if(nomeInput && nomeInput.value) {
            p = {
                nome: nomeInput.value,
                cpf: document.getElementById('paciente_cpf_check').value,
                rg: document.getElementById('field_rg').value,
                nascimento: document.getElementById('field_nascimento').value,
                tel: document.getElementById('field_tel1').value,
                tel2: document.getElementById('field_tel2').value,
                cep: document.getElementById('field_cep').value,
                logradouro: document.getElementById('field_logradouro').value,
                bairro: document.getElementById('field_bairro') ? document.getElementById('field_bairro').value : '',
                municipio: document.getElementById('field_municipio') ? document.getElementById('field_municipio').value : '',
                referencia: document.getElementById('field_referencia').value || document.getElementById('field_apelido').value,
                status_titulo: document.getElementById('field_status_titulo') ? document.getElementById('field_status_titulo').value : '',
                zona: document.getElementById('field_zona').value,
                secao: document.getElementById('field_secao').value,
                lideranca: document.getElementById('field_lideranca') ? document.getElementById('field_lideranca').value : '',
                indicacao: document.getElementById('field_indicacao') ? document.getElementById('field_indicacao').value : '',
                obs: document.getElementById('field_obs').value
            };
        }
    }

    if(!p) {
        alert("Nenhum munícipe selecionado para impressão.");
        return;
    }

    // Estilos inline (mesmos da ficha em branco para consistência)
    const styleLabel = "display: block; font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 2px;";
    const styleValue = "border-bottom: 1px solid #333; min-height: 20px; width: 100%; margin-bottom: 10px; font-size: 12px; font-weight: bold; color: #000; padding-bottom: 2px;";
    const styleSection = "margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 15px;";
    const styleTitle = "margin-top: 0; font-size: 14px; font-weight: bold; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;";
    // Estilos da Tabela de Histórico
    const styleTable = "width: 100%; border-collapse: collapse; font-size: 10px;";
    const styleTh = "border-bottom: 1px solid #000; text-align: left; padding: 4px; font-weight: bold; text-transform: uppercase;";
    const styleTd = "border-bottom: 1px solid #eee; padding: 4px;";

    const safe = (val) => val || '-';

    // Gera o HTML do Histórico se houver dados em cache
    let historyHtml = '';
    if (window.historicoAtualCache && window.historicoAtualCache.length > 0) {
        historyHtml += `
            <div style="${styleSection}">
                <h2 style="${styleTitle}">HISTÓRICO DE ATENDIMENTOS</h2>
                <table style="${styleTable}">
                    <thead>
                        <tr>
                            <th style="${styleTh} width: 80px;">Data</th>
                            <th style="${styleTh}">Serviço / Especialidade</th>
                            <th style="${styleTh}">Local</th>
                            <th style="${styleTh} width: 80px;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        window.historicoAtualCache.forEach(h => {
            const dataFmt = h.data_abertura ? h.data_abertura.split('-').reverse().join('/') : '-';
            const servico = `${h.tipo_servico || ''} ${h.especialidade || h.procedimento || ''}`.trim();
            historyHtml += `
                <tr>
                    <td style="${styleTd}">${dataFmt}</td>
                    <td style="${styleTd}">
                        <strong>${servico}</strong><br>
                        <span style="color: #666;">${h.obs_atendimento || ''}</span>
                    </td>
                    <td style="${styleTd}">${h.local || '-'}</td>
                    <td style="${styleTd}">${h.status || '-'}</td>
                </tr>
            `;
        });

        historyHtml += `
                    </tbody>
                </table>
            </div>
        `;
    }

    const html = `
        <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; color: #333; max-width: 100%;">
            
            <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase;">Ficha Cadastral</h1>
                <p style="margin: 2px 0 0; color: #555; font-size: 12px;">Gabinete Família Tudo a Ver</p>
            </div>

            <div style="${styleSection}">
                <h2 style="${styleTitle}">DADOS DO MUNÍCIPE</h2>
                
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 3;">
                        <span style="${styleLabel}">Nome Completo</span>
                        <div style="${styleValue}">${safe(p.nome)}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">CPF</span>
                        <div style="${styleValue}">${safe(p.cpf)}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Data Nasc.</span>
                        <div style="${styleValue}">${p.nascimento ? p.nascimento.split('-').reverse().join('/') : '-'}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">RG</span>
                        <div style="${styleValue}">${safe(p.rg)}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Telefone 1</span>
                        <div style="${styleValue}">${safe(p.tel || p.tel1)}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Telefone 2</span>
                        <div style="${styleValue}">${safe(p.tel2)}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">CEP</span>
                        <div style="${styleValue}">${safe(p.cep)}</div>
                    </div>
                    <div style="flex: 3;">
                        <span style="${styleLabel}">Endereço</span>
                        <div style="${styleValue}">${safe(p.logradouro)}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Bairro</span>
                        <div style="${styleValue}">${safe(p.bairro)}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Município</span>
                        <div style="${styleValue}">${safe(p.municipio)}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Referência</span>
                        <div style="${styleValue}">${safe(p.apelido || p.referencia)}</div>
                    </div>
                </div>
                
                 <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Situação Eleitoral</span>
                        <div style="${styleValue}">${safe(p.status_titulo)}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Zona / Seção</span>
                        <div style="${styleValue}">${safe(p.zona)} / ${safe(p.secao)}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Liderança / Indicação</span>
                        <div style="${styleValue}">${safe(p.lideranca || p.indicacao)}</div>
                    </div>
                </div>
                
                <div style="margin-top: 10px;">
                    <span style="${styleLabel}">Observações</span>
                    <div style="${styleValue} height: auto; min-height: 40px;">${safe(p.obs)}</div>
                </div>
            </div>

            ${historyHtml}
            
            <div style="text-align: center; font-size: 10px; color: #888; margin-top: 20px;">
                Impresso em ${new Date().toLocaleString('pt-BR')} - Sistema de Gestão Interna
            </div>
        </div>
    `;

    printArea.innerHTML = html;
    window.print();
}

function imprimirFichaEmBranco() {
    const printArea = document.getElementById('printable-area');
    if(!printArea) return;

    // Estilos inline para garantir a formatação na impressão
    const styleLabel = "display: block; font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 2px;";
    const styleInput = "border-bottom: 1px solid #333; height: 20px; width: 100%; margin-bottom: 10px;";
    const styleSection = "margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 15px;";
    const styleTitle = "margin-top: 0; font-size: 14px; font-weight: bold; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;";

    const html = `
        <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; color: #333; max-width: 100%;">
            
            <!-- CABEÇALHO -->
            <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase;">Ficha de Atendimento</h1>
                <p style="margin: 2px 0 0; color: #555; font-size: 12px;">Gabinete Família Tudo a Ver</p>
            </div>

            <!-- DADOS PESSOAIS -->
            <div style="${styleSection}">
                <h2 style="${styleTitle}">1. DADOS DO MUNÍCIPE</h2>
                
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 3;">
                        <span style="${styleLabel}">Nome Completo</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">CPF</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Data Nasc.</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">RG</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Telefone 1</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Telefone 2</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">CEP</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 3;">
                        <span style="${styleLabel}">Endereço (Rua, Nº, Compl)</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Bairro</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Município</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Situação Eleitoral</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Zona / Seção</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Local de Votação</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>
            </div>

            <!-- DADOS DO SERVIÇO -->
            <div style="${styleSection}">
                <h2 style="${styleTitle}">2. DADOS DO SERVIÇO / ATENDIMENTO</h2>
                
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Data Abertura</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Liderança / Indicação</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Tipo Serviço</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Especialidade / Procedimento</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Local de Atendimento</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Parceiro / Médico</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Data Marcação</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Valor (R$)</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="margin-top: 10px;">
                    <span style="${styleLabel}">Observações do Pedido</span>
                    <div style="${styleInput} height: 60px; border: 1px solid #333;"></div>
                </div>
            </div>

            <div style="text-align: center; font-size: 10px; color: #888; margin-top: 20px;">
                Impresso em ${new Date().toLocaleString('pt-BR')} - Sistema de Gestão Interna
            </div>
        </div>
    `;

    printArea.innerHTML = html;
    window.print();
}

function abrirDetalheSituacaoEleitoral(label) {
    abrirRelatorioEleitoral(label);
}

function verHistoricoCompleto(p) {
    if(typeof switchTab === 'function') switchTab('historico-paciente');
    
    document.getElementById('hist-nome').innerText = p.nome;
    document.getElementById('hist-cpf').innerText = p.cpf ? `CPF: ${p.cpf}` : 'SEM CPF REGISTRADO';
    document.getElementById('hist-tel').innerText = `Tel: ${p.tel || '-'}`;
    
    // BLOQUEIO DO BOTÃO DE IMPRESSÃO
    const btnPrint = document.getElementById('btn-imprimir-historico');
    if(btnPrint) {
        btnPrint.disabled = true;
        btnPrint.classList.add('opacity-50', 'cursor-not-allowed');
        // Mantém ícone mas muda texto
        btnPrint.innerHTML = '<i class="animate-spin mr-2" data-lucide="loader-2"></i> Carregando...';
    }

    const divDetalhes = document.getElementById('hist-detalhes');
    divDetalhes.innerHTML = '<div class="col-span-3 text-center text-blue-500"><i class="animate-spin inline-block mr-2" data-lucide="loader-2"></i> Carregando dados completos...</div>';
    
    const timeline = document.getElementById('hist-timeline');
    timeline.innerHTML = '<p class="text-slate-400 text-sm italic pl-4">Buscando histórico completo...</p>';

    const btnHistDelete = document.getElementById('btn-hist-delete');
    if(btnHistDelete && typeof currentUserRole !== 'undefined') {
        btnHistDelete.classList.toggle('hidden', currentUserRole !== 'ADMIN');
    }

    // Limpa cache anterior
    window.historicoAtualCache = [];

    try {
        let buscaParam = p.id ? `&busca=${p.id}&tipo=id` : `&busca=${p.cpf}&tipo=cpf`;
        fetch(`${SCRIPT_URL}?action=findPatient${buscaParam}`)
            .then(res => res.json())
            .then(jsonPac => {
                let pacienteCompleto = p;
                if(jsonPac.found) {
                    pacienteCompleto = jsonPac;
                    pacienteAtual = jsonPac; 
                    histPacienteAtual = jsonPac;
                } else {
                    pacienteAtual = p;
                    histPacienteAtual = p;
                }

                // Data de criação (se disponível no objeto retornado)
                const dataCriacao = pacienteCompleto.data_criacao ? pacienteCompleto.data_criacao : 'N/I';

                divDetalhes.innerHTML = `
                    <div><span class="block text-xs font-bold text-slate-400 uppercase">Cadastrado em</span> <span class="font-medium text-slate-800 text-xs">${dataCriacao}</span></div>
                    <div><span class="block text-xs font-bold text-slate-400 uppercase">Data Nasc.</span> <span class="font-medium text-slate-800">${pacienteCompleto.nascimento ? pacienteCompleto.nascimento.split('-').reverse().join('/') : '-'}</span></div>
                    <div><span class="block text-xs font-bold text-slate-400 uppercase">RG</span> <span class="font-medium text-slate-800">${pacienteCompleto.rg || '-'}</span></div>
                    
                    <div><span class="block text-xs font-bold text-slate-400 uppercase">Município</span> <span class="font-medium text-slate-800">${pacienteCompleto.municipio || '-'}</span></div>
                    <div><span class="block text-xs font-bold text-slate-400 uppercase">Bairro</span> <span class="font-medium text-slate-800">${pacienteCompleto.bairro || '-'}</span></div>
                    <div class="md:col-span-2"><span class="block text-xs font-bold text-slate-400 uppercase">Endereço</span> <span class="font-medium text-slate-800">${pacienteCompleto.logradouro || '-'}</span></div>
                    
                    <div><span class="block text-xs font-bold text-slate-400 uppercase">Situação Eleitoral</span> <span class="font-medium text-slate-800">${pacienteCompleto.status_titulo || '-'}</span></div>
                    <div><span class="block text-xs font-bold text-slate-400 uppercase">Zona/Seção</span> <span class="font-medium text-slate-800">${pacienteCompleto.zona || '-'}/${pacienteCompleto.secao || '-'}</span></div>
                    <div><span class="block text-xs font-bold text-slate-400 uppercase">Família</span> <span class="font-medium text-slate-800">${pacienteCompleto.familia || '-'}</span></div>
                    
                    ${pacienteCompleto.obs ? `<div class="md:col-span-3 mt-2 pt-2 border-t border-slate-100"><span class="block text-xs font-bold text-slate-400 uppercase">Observações</span> <p class="italic text-slate-600">${pacienteCompleto.obs}</p></div>` : ''}
                `;

                fetch(`${SCRIPT_URL}?action=getPatientHistory&cpf=${pacienteCompleto.cpf || ''}&nome=${encodeURIComponent(pacienteCompleto.nome)}`)
                    .then(res => res.json())
                    .then(jsonHist => {
                        const history = jsonHist.data || [];
                        window.historicoAtualCache = history; // Salva para impressão

                        // REABILITA O BOTÃO APÓS CARREGAR TUDO
                        if(btnPrint) {
                            btnPrint.disabled = false;
                            btnPrint.classList.remove('opacity-50', 'cursor-not-allowed');
                            btnPrint.innerHTML = '<i data-lucide="printer" class="w-4 h-4 mr-2"></i> Imprimir';
                        }

                        if(history.length === 0) {
                            timeline.innerHTML = '<p class="text-slate-400 pl-4">Nenhum atendimento registrado.</p>';
                        } else {
                            const itemsHtml = history.map(at => {
                                const dataFmt = at.data_abertura ? at.data_abertura.split('-').reverse().join('/') : '-';
                                let statusColor = "bg-slate-100 text-slate-600";
                                let borderColor = "border-slate-300";
                                
                                if(at.status === 'CONCLUIDO') { statusColor = "bg-emerald-100 text-emerald-700"; borderColor = "border-emerald-500"; }
                                if(at.status === 'PENDENTE') { statusColor = "bg-amber-100 text-amber-700"; borderColor = "border-amber-500"; }
                                if(at.status === 'CANCELADO') { statusColor = "bg-red-100 text-red-700"; borderColor = "border-red-500"; }

                                const tempId = 'hist_' + Math.random().toString(36).substr(2, 9);
                                window[tempId] = at;

                                return `
                                    <div class="relative pl-4 pb-6 cursor-pointer hover:opacity-90 transition group" onclick="abrirDetalheAtendimento(window['${tempId}'])">
                                        <div class="absolute -left-[9px] top-0 w-4 h-4 bg-white rounded-full border-4 ${borderColor}"></div>
                                        <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm group-hover:shadow-md transition-all">
                                            
                                            <!-- CABEÇALHO DO CARD -->
                                            <div class="flex justify-between items-start mb-3 border-b border-slate-50 pb-2">
                                                <div class="flex flex-col">
                                                    <span class="text-xs font-bold text-slate-400 uppercase">Data Abertura</span>
                                                    <span class="font-bold text-slate-800 text-lg">${dataFmt}</span>
                                                </div>
                                                <span class="${statusColor} text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide border border-black/5">${at.status}</span>
                                            </div>

                                            <!-- CORPO DO CARD (MAIS DETALHES) -->
                                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-700">
                                                
                                                <div class="col-span-2 sm:col-span-1">
                                                    <span class="text-[10px] font-bold text-slate-400 uppercase block">Tipo / Serviço</span>
                                                    <span class="font-bold text-blue-900">${at.tipo_servico || 'N/I'}</span>
                                                </div>

                                                <div class="col-span-2 sm:col-span-1">
                                                    <span class="text-[10px] font-bold text-slate-400 uppercase block">Especialidade / Proc.</span>
                                                    <span class="font-medium">${at.especialidade || at.procedimento || '-'}</span>
                                                </div>

                                                <div class="col-span-2">
                                                    <span class="text-[10px] font-bold text-slate-400 uppercase block">Local / Detalhe</span>
                                                    <span>${at.local || '-'} ${at.tipo ? `(${at.tipo})` : ''}</span>
                                                </div>

                                                ${at.parceiro ? `
                                                <div class="col-span-2">
                                                    <span class="text-[10px] font-bold text-slate-400 uppercase block">Parceiro</span>
                                                    <span class="text-emerald-700 font-medium"><i data-lucide="handshake" class="w-3 h-3 inline mr-1"></i>${at.parceiro}</span>
                                                </div>` : ''}

                                                ${at.data_marcacao ? `
                                                <div class="col-span-2 sm:col-span-1 bg-blue-50 p-2 rounded border border-blue-100 mt-2">
                                                    <span class="text-[10px] font-bold text-blue-400 uppercase block">Marcado Para</span>
                                                    <span class="font-bold text-blue-800">${at.data_marcacao.split('-').reverse().join('/')}</span>
                                                </div>` : ''}

                                                ${at.obs_atendimento ? `
                                                <div class="col-span-2 mt-2 pt-2 border-t border-slate-100">
                                                    <span class="text-[10px] font-bold text-slate-400 uppercase block">Observações</span>
                                                    <p class="text-slate-500 italic text-xs line-clamp-2">${at.obs_atendimento}</p>
                                                </div>` : ''}
                                            </div>

                                            <div class="text-xs text-slate-400 mt-3 flex justify-end items-center gap-1 group-hover:text-blue-500 transition-colors">
                                                <span>Ver detalhes completos</span>
                                                <i data-lucide="arrow-right" class="w-3 h-3"></i>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('');
                            timeline.innerHTML = itemsHtml;
                        }
                        
                        if(typeof lucide !== 'undefined') lucide.createIcons();
                    });
            });

    } catch(e) {
        divDetalhes.innerHTML = '<div class="col-span-3 text-red-500">Erro ao carregar detalhes do munícipe.</div>';
        timeline.innerHTML = '<p class="text-red-500 pl-4">Erro ao carregar histórico.</p>';
        if(btnPrint) {
             btnPrint.innerHTML = '<i data-lucide="alert-circle" class="w-4 h-4 mr-2"></i> Erro';
        }
        console.error(e);
    }
}
