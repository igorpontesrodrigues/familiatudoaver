// UI Construction
function initServicosPublicos() {
    const listDiv = document.getElementById('view-lista-servicos');
    const formDiv = document.getElementById('view-form-servicos');
    if (!listDiv || !formDiv) return;

    listDiv.innerHTML = `
        <div class="flex flex-wrap justify-between items-center mb-6 gap-3">
            <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <i data-lucide="map-pin" class="text-indigo-600"></i> Serviços Públicos
            </h2>
            <div class="flex gap-2 flex-wrap">
                ${typeof currentUserRole !== 'undefined' && currentUserRole === 'admin' ? `<button onclick="abrirGerenciarTiposServico()" class="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition flex items-center gap-2 text-sm"><i data-lucide="settings" class="w-4 h-4"></i> Gerenciar Tipos</button>` : ''}
                <button onclick="imprimirPendenciasServicos()" class="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition flex items-center gap-2 text-sm">
                    <i data-lucide="printer" class="w-4 h-4"></i> Imprimir Pendências
                </button>
                <button onclick="novoServicoPublico()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i> Novo Serviço
                </button>
            </div>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div class="p-4 border-b border-slate-200 flex gap-4 bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
                <input type="text" id="busca-servicos" onkeyup="filtrarServicos()" placeholder="Buscar por munícipe ou endereço..." class="flex-1 input-field max-w-md">
                <select id="filtro-status-servicos" onchange="filtrarServicos()" class="input-field max-w-xs">
                    <option value="">Todos os Status</option>
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM ANDAMENTO">Em Andamento</option>
                    <option value="CONCLUIDO">Concluído</option>
                </select>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead class="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 uppercase font-bold text-xs border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th class="px-4 py-4">Data</th>
                            <th class="px-4 py-4">Munícipe</th>
                            <th class="px-4 py-4">Serviço Solicitado</th>
                            <th class="px-4 py-4">Indicação</th>
                            <th class="px-4 py-4">Órgão / Protocolo</th>
                            <th class="px-4 py-4">Status</th>
                            <th class="px-4 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-servicos" class="divide-y divide-slate-100 dark:divide-slate-700">
                        <tr><td colspan="7" class="text-center p-8 text-slate-400">Carregando serviços...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    formDiv.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <i data-lucide="map-pin" class="text-indigo-600"></i> Registro de Serviço Público
            </h2>
            <button onclick="switchTab('lista-servicos')" class="text-slate-500 hover:text-slate-700 font-bold transition flex items-center gap-2">
                <i data-lucide="arrow-left" class="w-4 h-4"></i> Voltar à Lista
            </button>
        </div>
        <form id="frmServicoPublico" onsubmit="salvarServicoPublico(event)" class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
            <input type="hidden" id="servico_id">
            
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
                <div class="md:col-span-8">
                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Buscar Munícipe Solicitante <span class="text-xs font-normal text-slate-400">(CPF ou Nome)</span></label>
                    <div class="flex gap-3">
                        <input type="text" id="servico_busca_cpf" placeholder="Digite CPF ou Nome do munícipe..." inputmode="text" class="flex-1 rounded-lg border-slate-300 dark:border-slate-600 border p-3 shadow-sm focus:border-indigo-500 outline-none relative" oninput="buscarMunicipeServico()" onkeydown="if(event.key === 'Enter'){event.preventDefault(); buscarMunicipeServico();}">
                        <button type="button" onclick="buscarMunicipeServico()" class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition"><i data-lucide="search" class="w-5 h-5"></i></button>
                    </div>
                    <div id="servico_resultado_busca" class="mt-3 text-sm text-slate-600 dark:text-slate-300 min-h-[24px] font-medium relative"></div>
                    <input type="hidden" id="servico_cpf">
                    <input type="hidden" id="servico_nome">
                </div>
                <div class="md:col-span-4">
                    <label class="label-field">Telefone / Contato</label>
                    <input type="text" id="servico_telefone" class="input-field" placeholder="(00) 00000-0000">
                </div>
                <div class="md:col-span-4">
                    <label class="label-field text-slate-500">Data de Nascimento <span class="text-xs font-normal text-slate-400">(da base)</span></label>
                    <input type="date" id="servico_nascimento" class="input-field bg-slate-50 dark:bg-slate-900/50 text-slate-600">
                </div>
                <div class="md:col-span-4">
                    <label class="label-field">Indicação (Quem indicou)</label>
                    <input type="text" id="servico_indicacao" class="input-field uppercase" placeholder="Nome do vereador ou liderança">
                </div>
                <div class="md:col-span-4">
                    <label class="label-field">Data da Solicitação</label>
                    <input type="date" id="servico_data" required class="input-field">
                </div>
                <div class="md:col-span-4">
                    <label class="label-field">Data de Conclusão</label>
                    <input type="date" id="servico_data_conclusao" class="input-field">
                </div>
                <div class="md:col-span-4">
                    <label class="label-field">Tipo de Serviço</label>
                    <div class="flex gap-2">
                        <select id="servico_tipo" required class="input-field uppercase flex-1">
                            <option value="">Selecione...</option>
                        </select>
                    </div>
                </div>
                <div class="md:col-span-4">
                    <label class="label-field">Status</label>
                    <select id="servico_status" required class="input-field font-bold">
                        <option value="PENDENTE">Pendente</option>
                        <option value="EM ANDAMENTO">Em Andamento</option>
                        <option value="CONCLUIDO">Concluído</option>
                    </select>
                </div>
                <div class="md:col-span-4">
                    <label class="label-field">Órgão / Responsável pela Pasta</label>
                    <input type="text" id="servico_orgao_responsavel" class="input-field uppercase" placeholder="Ex: SECRETARIA DE OBRAS">
                </div>
                <div class="md:col-span-4">
                    <label class="label-field">Nº do Protocolo</label>
                    <input type="text" id="servico_protocolo_numero" class="input-field" placeholder="Número do protocolo">
                </div>
                <div class="md:col-span-4">
                    <label class="label-field">Data do Protocolo</label>
                    <input type="date" id="servico_protocolo_data" class="input-field">
                </div>
                <div class="md:col-span-12">
                    <label class="label-field">Endereço / Referência do Serviço</label>
                    <input type="text" id="servico_endereco" required class="input-field uppercase" placeholder="Rua, Número, Bairro, Ponto de Referência">
                </div>
                <div class="md:col-span-12">
                    <label class="label-field">Observações Detalhadas</label>
                    <textarea id="servico_obs" rows="3" class="input-field uppercase" placeholder="Detalhes adicionais da solicitação..."></textarea>
                </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onclick="switchTab('lista-servicos')" class="px-6 py-2.5 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 transition">Cancelar</button>
                <button type="submit" id="btnSalvarServico" class="px-6 py-2.5 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm flex items-center gap-2">
                    <i data-lucide="save" class="w-4 h-4"></i> Salvar Solicitação
                </button>
            </div>
        </form>
    `;

    if(typeof lucide !== 'undefined') lucide.createIcons();
    carregarTiposServico();
    carregarServicosPublicos();
}

let todosServicos = [];
let tiposServicoPadrao = ['TROCA DE LÂMPADA', 'COLETA DE ENTULHO', 'CAPINA/ROÇADA', 'TAPA BURACO', 'OUTROS'];

async function carregarTiposServico() {
    try {
        const snap = await window.getDocs(window.collection(window.db, "tipos_servico"));
        let tipos = [...tiposServicoPadrao];
        snap.forEach(doc => {
            const nome = doc.data().nome;
            if (nome && !tipos.includes(nome)) tipos.push(nome);
        });
        const sel = document.getElementById('servico_tipo');
        if (!sel) return;
        const valorAtual = sel.value;
        sel.innerHTML = '<option value="">Selecione...</option>';
        tipos.forEach(t => {
            sel.innerHTML += `<option value="${t}">${t}</option>`;
        });
        if (valorAtual) sel.value = valorAtual;
    } catch(e) { console.error('Erro ao carregar tipos de serviço', e); }
}

function abrirGerenciarTiposServico() {
    // Painel de gerenciamento de tipos (admin-only)
    const painel = document.createElement('div');
    painel.id = 'painel-tipos-servico';
    painel.className = 'fixed inset-0 z-[500] flex items-center justify-center';
    painel.innerHTML = `
        <div class="absolute inset-0 bg-black/50" onclick="document.getElementById('painel-tipos-servico').remove()"></div>
        <div class="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 z-10">
            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <i data-lucide="settings" class="w-5 h-5 text-indigo-600"></i> Gerenciar Tipos de Serviço
            </h3>
            <div id="lista-tipos-servico" class="space-y-2 max-h-60 overflow-y-auto mb-4"></div>
            <div class="flex gap-2">
                <input type="text" id="novo-tipo-servico-input" class="flex-1 input-field uppercase" placeholder="Novo tipo de serviço...">
                <button onclick="adicionarTipoServico()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition">Adicionar</button>
            </div>
            <button onclick="document.getElementById('painel-tipos-servico').remove()" class="mt-4 w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition">Fechar</button>
        </div>
    `;
    document.body.appendChild(painel);
    if(typeof lucide !== 'undefined') lucide.createIcons();
    renderListaTiposServico();
}

async function renderListaTiposServico() {
    const div = document.getElementById('lista-tipos-servico');
    if (!div) return;
    try {
        const snap = await window.getDocs(window.collection(window.db, "tipos_servico"));
        let itens = tiposServicoPadrao.map(t => ({ nome: t, padrao: true, id: null }));
        snap.forEach(doc => {
            const nome = doc.data().nome;
            if (nome && !tiposServicoPadrao.includes(nome)) itens.push({ nome, padrao: false, id: doc.id });
        });
        div.innerHTML = itens.map(item => `
            <div class="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                <span class="text-sm font-bold ${item.padrao ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'}">${item.nome} ${item.padrao ? '<span class="text-[10px] text-slate-400">(padrão)</span>' : ''}</span>
                ${!item.padrao ? `<button onclick="excluirTipoServico('${item.id}', '${item.nome}')" class="text-rose-500 hover:text-rose-700 p-1 rounded"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
            </div>
        `).join('');
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) { div.innerHTML = '<p class="text-red-500 text-sm">Erro ao carregar tipos.</p>'; }
}

async function adicionarTipoServico() {
    const input = document.getElementById('novo-tipo-servico-input');
    const nome = input.value.trim().toUpperCase();
    if (!nome) return;
    try {
        await window.addDoc(window.collection(window.db, "tipos_servico"), { nome });
        input.value = '';
        renderListaTiposServico();
        carregarTiposServico();
    } catch(e) { window.showModalAlert('Erro ao adicionar tipo: ' + e.message); }
}

async function excluirTipoServico(id, nome) {
    if (!await window.showModalConfirm(`Excluir o tipo "${nome}"?`, 'Esta ação não pode ser desfeita.')) return;
    try {
        await window.deleteDoc(window.doc(window.db, "tipos_servico", id));
        renderListaTiposServico();
        carregarTiposServico();
    } catch(e) { window.showModalAlert('Erro ao excluir: ' + e.message); }
}

async function carregarServicosPublicos() {
    try {
        const snap = await window.getDocs(window.collection(window.db, "servicos_publicos"));
        todosServicos = [];
        snap.forEach(doc => {
            todosServicos.push({ id: doc.id, ...doc.data() });
        });
        todosServicos.sort((a,b) => new Date(b.data_solicitacao || '1970-01-01') - new Date(a.data_solicitacao || '1970-01-01'));
        renderServicosPublicos();
    } catch(e) {
        console.error("Erro ao carregar serviços", e);
    }
}

function renderServicosPublicos() {
    const tbody = document.getElementById('tbody-servicos');
    if(!tbody) return;
    
    const termo = (document.getElementById('busca-servicos')?.value || '').toLowerCase();
    const status = document.getElementById('filtro-status-servicos')?.value || '';
    
    let html = '';
    let count = 0;
    
    todosServicos.forEach(s => {
        const text = `${s.nome_municipe || ''} ${s.endereco || ''} ${s.tipo_servico || ''} ${s.indicacao_base || ''}`.toLowerCase();
        if (termo && !text.includes(termo)) return;
        if (status && s.status !== status) return;
        
        count++;
        const dateFmt = s.data_solicitacao ? s.data_solicitacao.split('-').reverse().join('/') : '-';
        const dataConclusaoFmt = s.data_conclusao ? s.data_conclusao.split('-').reverse().join('/') : '';
        
        let badge = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        if(s.status === 'PENDENTE') badge = 'bg-amber-100 text-amber-700';
        if(s.status === 'EM ANDAMENTO') badge = 'bg-blue-100 text-blue-700';
        if(s.status === 'CONCLUIDO') badge = 'bg-emerald-100 text-emerald-700';

        const orgaoTag = s.orgao_responsavel ? `<div class="text-[10px] text-indigo-600 font-bold mt-0.5">${s.orgao_responsavel}</div>` : '';
        const protTag = s.protocolo_numero ? `<div class="text-[10px] text-slate-400">Proto: ${s.protocolo_numero}</div>` : '';
        const conclusaoTag = dataConclusaoFmt ? `<br><span class="text-[10px] text-slate-400">Conc.: ${dataConclusaoFmt}</span>` : '';
        
        html += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <td class="px-4 py-3 text-sm">${dateFmt}</td>
                <td class="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">${s.nome_municipe}<div class="text-xs font-normal text-slate-400 mt-0.5">${s.telefone||''}</div></td>
                <td class="px-4 py-3"><span class="font-bold text-indigo-700 dark:text-indigo-400 text-xs">${s.tipo_servico}</span></td>
                <td class="px-4 py-3 text-xs">${orgaoTag}${protTag}</td>
                <td class="px-4 py-3"><span class="px-2 py-1 rounded-md text-[10px] font-bold uppercase ${badge}">${s.status}</span>${conclusaoTag}</td>
                <td class="px-4 py-3 text-right space-x-2">
                    <button onclick="editarServico('${s.id}')" class="text-indigo-500 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 p-1.5 rounded transition" title="Editar"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button onclick="deletarServico('${s.id}')" class="text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-900/30 p-1.5 rounded transition" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `;
    });
    
    if (count === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center p-6 text-slate-400">Nenhum serviço encontrado.</td></tr>`;
    } else {
        tbody.innerHTML = html;
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function filtrarServicos() { renderServicosPublicos(); }

function imprimirPendenciasServicos() {
    const pendentes = todosServicos.filter(s => s.status === 'PENDENTE' || s.status === 'EM ANDAMENTO');
    if (pendentes.length === 0) { window.showModalAlert('Nenhuma pendência encontrada para impressão.'); return; }
    const grupos = {};
    pendentes.forEach(s => {
        const tipo = (s.tipo_servico || 'SEM TIPO').trim().toUpperCase();
        if (!grupos[tipo]) grupos[tipo] = [];
        grupos[tipo].push(s);
    });
    const agora = new Date().toLocaleString('pt-BR');
    let rows = '';
    Object.keys(grupos).sort().forEach(tipo => {
        const lista = grupos[tipo];
        rows += `<tr style="background:#e0e7ff;"><td colspan="7" style="padding:6px 8px;font-weight:bold;color:#3730a3;font-size:11px;">&#128204; ${tipo} — ${lista.length} solicitação(s)</td></tr>`;
        lista.forEach(s => {
            const dtFmt = s.data_solicitacao ? s.data_solicitacao.split('-').reverse().join('/') : '-';
            const nascFmt = s.nascimento ? s.nascimento.split('-').reverse().join('/') : '-';
            const statusColor = s.status === 'PENDENTE' ? '#b45309' : '#1d4ed8';
            const statusBg = s.status === 'PENDENTE' ? '#fef3c7' : '#dbeafe';
            rows += `<tr><td>${s.nome_municipe||'-'}</td><td>${nascFmt}</td><td>${s.telefone||'-'}</td><td>${s.indicacao_base||'-'}</td><td>${s.orgao_responsavel||'-'}</td><td>${s.protocolo_numero||'-'}</td><td><span style="background:${statusBg};color:${statusColor};padding:2px 6px;border-radius:4px;font-weight:bold;font-size:9px;">${s.status}</span></td></tr>`;
        });
    });
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Pendências — Serviços Públicos</title><style>body{font-family:Arial,sans-serif;font-size:11px;color:#111;margin:20px;}h1{font-size:16px;text-align:center;margin-bottom:4px;}.sub{text-align:center;font-size:10px;color:#666;margin-bottom:16px;}table{width:100%;border-collapse:collapse;}th{background:#312e81;color:white;padding:6px 8px;text-align:left;border:1px solid #4338ca;font-size:10px;}td{padding:5px 8px;border:1px solid #e2e8f0;vertical-align:top;}tr:nth-child(even){background:#f5f3ff;}</style></head><body><h1>Connecta Gestão — Pendências de Serviços Públicos</h1><p class="sub">Gerado em: ${agora} — Total: ${pendentes.length}</p><table><thead><tr><th>Munícipe</th><th>Nasc.</th><th>Telefone</th><th>Indicação</th><th>Órgão Resp.</th><th>Protocolo</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const popup = window.open('', 'PRINT', 'height=700,width=1000');
    popup.document.write(html);
    popup.document.close();
    setTimeout(() => { popup.focus(); popup.print(); }, 500);
}

function novoServicoPublico() {
    // Garante que o form foi injetado no DOM antes de usar
    if (!document.getElementById('frmServicoPublico')) {
        initServicosPublicos();
        setTimeout(novoServicoPublico, 300);
        return;
    }
    document.getElementById('frmServicoPublico').reset();
    document.getElementById('servico_id').value = '';
    document.getElementById('servico_busca_cpf').value = '';
    document.getElementById('servico_resultado_busca').innerHTML = '';
    document.getElementById('servico_cpf').value = '';
    document.getElementById('servico_nome').value = '';
    document.getElementById('servico_nascimento').value = '';
    document.getElementById('servico_telefone').value = '';
    document.getElementById('servico_indicacao').value = '';
    document.getElementById('servico_data_conclusao').value = '';
    document.getElementById('servico_orgao_responsavel').value = '';
    document.getElementById('servico_protocolo_numero').value = '';
    document.getElementById('servico_protocolo_data').value = '';
    // Auto fill date
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    document.getElementById('servico_data').value = `${hoje.getFullYear()}-${mes}-${dia}`;
    switchTab('form-servicos');
}

async function salvarServicoPublico(e) {
    e.preventDefault();
    const id = document.getElementById('servico_id').value;
    const btn = document.getElementById('btnSalvarServico');
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Salvando...`;
    lucide.createIcons();
    
    const nomeMun = document.getElementById('servico_nome').value.trim();
    if(!nomeMun) {
        window.showModalAlert("Por favor, busque e selecione um munícipe primeiro.");
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> Salvar Solicitação`;
        return;
    }
    
    const data = {
        cpf_municipe: document.getElementById('servico_cpf').value.trim(),
        nome_municipe: nomeMun.toUpperCase(),
        telefone: document.getElementById('servico_telefone').value.trim(),
        nascimento: document.getElementById('servico_nascimento').value || '',
        indicacao_base: document.getElementById('servico_indicacao').value.trim().toUpperCase(),
        data_solicitacao: document.getElementById('servico_data').value,
        data_conclusao: document.getElementById('servico_data_conclusao').value || '',
        tipo_servico: document.getElementById('servico_tipo').value.toUpperCase(),
        orgao_responsavel: document.getElementById('servico_orgao_responsavel').value.trim().toUpperCase(),
        protocolo_numero: document.getElementById('servico_protocolo_numero').value.trim(),
        protocolo_data: document.getElementById('servico_protocolo_data').value || '',
        endereco: document.getElementById('servico_endereco').value.trim().toUpperCase(),
        status: document.getElementById('servico_status').value,
        observacoes: document.getElementById('servico_obs').value.trim().toUpperCase()
    };
    
    try {
        if(id) {
            await window.updateDoc(window.doc(window.db, "servicos_publicos", id), data);
        } else {
            data.created_at = new Date().toISOString();
            await window.addDoc(window.collection(window.db, "servicos_publicos"), data);
        }
        window.showModalAlert("Serviço salvo com sucesso!");
        carregarServicosPublicos();
        switchTab('lista-servicos');
    } catch(err) {
        console.error("Erro ao salvar serviço", err);
        window.showModalAlert("Erro ao salvar serviço: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> Salvar Solicitação`;
        lucide.createIcons();
    }
}

async function deletarServico(id) {
    if(!await window.showModalConfirm("Deseja realmente excluir este serviço?", "Esta ação não pode ser desfeita.")) return;
    
    try {
        await window.deleteDoc(window.doc(window.db, "servicos_publicos", id));
        carregarServicosPublicos();
    } catch(err) {
        window.showModalAlert("Erro ao excluir: " + err.message);
    }
}

function editarServico(id) {
    const servico = todosServicos.find(s => s.id === id);
    if(!servico) return;
    
    document.getElementById('servico_id').value = servico.id;
    document.getElementById('servico_cpf').value = servico.cpf_municipe || '';
    document.getElementById('servico_nome').value = servico.nome_municipe || '';
    const nomeFmt = servico.nome_municipe || 'Sem Nome';
    document.getElementById('servico_busca_cpf').value = nomeFmt;
    document.getElementById('servico_resultado_busca').innerHTML = `<span class="text-indigo-600 font-bold flex items-center gap-1"><i data-lucide="check" class="w-4 h-4"></i> ${nomeFmt} (Selecionado)</span>`;
    document.getElementById('servico_telefone').value = servico.telefone || '';
    document.getElementById('servico_nascimento').value = servico.nascimento || '';
    document.getElementById('servico_indicacao').value = servico.indicacao_base || '';
    document.getElementById('servico_data').value = servico.data_solicitacao || '';
    document.getElementById('servico_data_conclusao').value = servico.data_conclusao || '';
    document.getElementById('servico_orgao_responsavel').value = servico.orgao_responsavel || '';
    document.getElementById('servico_protocolo_numero').value = servico.protocolo_numero || '';
    document.getElementById('servico_protocolo_data').value = servico.protocolo_data || '';
    // Popula o select de tipo (carregando do Firestore se necessário)
    const selTipo = document.getElementById('servico_tipo');
    let exists = false;
    for(let i=0; i<selTipo.options.length; i++) {
        if(selTipo.options[i].value === servico.tipo_servico) exists = true;
    }
    if(!exists && servico.tipo_servico) {
        selTipo.innerHTML += `<option value="${servico.tipo_servico}">${servico.tipo_servico}</option>`;
    }
    selTipo.value = servico.tipo_servico || '';
    document.getElementById('servico_status').value = servico.status || 'PENDENTE';
    document.getElementById('servico_endereco').value = servico.endereco || '';
    document.getElementById('servico_obs').value = servico.observacoes || '';
    switchTab('form-servicos');
}

// Auto init on load
document.addEventListener("DOMContentLoaded", () => {
    // Wait a little bit for main layout to settle
    setTimeout(initServicosPublicos, 1500);
});

async function buscarMunicipeServico() {
    const termo = document.getElementById('servico_busca_cpf').value.trim();
    const resDiv = document.getElementById('servico_resultado_busca');
    if(termo.length < 2) {
        resDiv.innerHTML = "";
        return; 
    }
    
    resDiv.innerText = "Buscando..."; 
    
    const termoLower = termo.toLowerCase();
    const termoDigitos = termo.replace(/\D/g, '');
    
    if (typeof todosPacientes !== 'undefined' && Array.isArray(todosPacientes) && todosPacientes.length > 0) {
        let encontrados = todosPacientes.filter(p => {
            const nome = (p.nome || '').toLowerCase();
            const cpf = (p.cpf || '').replace(/\D/g, '');
            return nome.includes(termoLower) || (termoDigitos.length >= 3 && cpf.includes(termoDigitos));
        });
        
        if (encontrados.length > 0 && encontrados.length <= 15) {
            let listaHtml = `<div class="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] max-h-60 overflow-y-auto">`;
            encontrados.forEach(p => {
                const pJson = JSON.stringify(p).replace(/"/g, '&quot;');
                listaHtml += `<div onclick="selecionarMunicipeServico(${pJson})" class="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 flex flex-col text-left">
                    <span class="font-bold text-sm text-slate-800">${p.nome}</span>
                    <span class="text-xs text-slate-400">${p.cpf || 'Sem CPF'} — ${p.municipio || ''}</span>
                </div>`;
            });
            listaHtml += '</div>';
            resDiv.innerHTML = `<span class="text-indigo-600 font-medium">${encontrados.length} munícipe(s) encontrado(s). Selecione:</span>${listaHtml}`;
            if(typeof lucide !== 'undefined') lucide.createIcons();
            return;
        } else if (encontrados.length > 15) {
            resDiv.innerHTML = `<span class="text-slate-500 font-medium">Muitos resultados (${encontrados.length}). Digite mais.</span>`;
            return;
        }
    }
    
    if (termoDigitos.length >= 3) {
        try {
            const searchCpf = termoDigitos;
            const searchCpfFormatado = searchCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            
            let querySnapshot = await window.getDocs(window.query(window.collection(window.db, "pacientes"), window.where("cpf", "==", searchCpf)));
            if (querySnapshot.empty && searchCpfFormatado.length === 14) {
                querySnapshot = await window.getDocs(window.query(window.collection(window.db, "pacientes"), window.where("cpf", "==", searchCpfFormatado)));
            }
            
            if(!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                const data = doc.data();
                const pJson = JSON.stringify(data).replace(/"/g, '&quot;');
                let listaHtml = `<div class="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] max-h-60 overflow-y-auto">`;
                listaHtml += `<div onclick="selecionarMunicipeServico(${pJson})" class="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 flex flex-col text-left">
                    <span class="font-bold text-sm text-slate-800">${data.nome}</span>
                    <span class="text-xs text-slate-400">${data.cpf || 'Sem CPF'} — ${data.municipio || ''}</span>
                </div></div>`;
                resDiv.innerHTML = `<span class="text-indigo-600 font-medium">1 munícipe encontrado. Selecione:</span>${listaHtml}`;
            } else {
                resDiv.innerHTML = `<span class="text-red-500 font-medium">Munícipe não encontrado.</span>`;
            }
            if(typeof lucide !== 'undefined') lucide.createIcons();
        } catch(e) { resDiv.innerText = "Erro na busca."; }
    } else {
        resDiv.innerHTML = `<span class="text-red-500 font-medium">Munícipe não encontrado.</span>`;
    }
}

window.selecionarMunicipeServico = function(p) {
    const resDiv = document.getElementById('servico_resultado_busca');
    resDiv.innerHTML = `<span class="text-indigo-600 font-bold flex items-center gap-1"><i data-lucide="check" class="w-4 h-4"></i> ${p.nome}</span>`;
    document.getElementById('servico_cpf').value = p.cpf || '';
    document.getElementById('servico_nome').value = p.nome;
    // Auto-preencher da base
    const tel = p.tel || p.telefone || p.whatsapp || p.tel1 || '';
    if(tel) document.getElementById('servico_telefone').value = tel;
    if(p.nascimento) document.getElementById('servico_nascimento').value = p.nascimento;
    if(p.indicacao) document.getElementById('servico_indicacao').value = p.indicacao;
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

