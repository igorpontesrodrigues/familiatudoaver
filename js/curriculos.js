// UI Construction
function initCurriculos() {
    const listDiv = document.getElementById('view-lista-curriculos');
    const formDiv = document.getElementById('view-form-curriculos');
    if (!listDiv || !formDiv) return;

    listDiv.innerHTML = `
        <div class="flex flex-wrap justify-between items-center mb-6 gap-3">
            <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <i data-lucide="file-text" class="text-purple-600"></i> Banco de Currículos
            </h2>
            <div class="flex gap-2 flex-wrap">
                <button onclick="imprimirPendenciasCurriculos()" class="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition flex items-center gap-2 text-sm">
                    <i data-lucide="printer" class="w-4 h-4"></i> Imprimir Pendências
                </button>
                <button onclick="novoCurriculo()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i> Novo Currículo
                </button>
            </div>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div class="p-4 border-b border-slate-200 flex flex-wrap gap-3 bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
                <input type="text" id="busca-curriculos" onkeyup="filtrarCurriculos()" placeholder="Buscar nome, cargo, indicação..." class="flex-1 input-field min-w-[200px]">
                <select id="filtro-status-curriculos" onchange="filtrarCurriculos()" class="input-field max-w-xs">
                    <option value="">Todos os Status</option>
                    <option value="ANÁLISE">Análise</option>
                    <option value="ENTREVISTA">Entrevista</option>
                    <option value="CONTRATADO">Contratado</option>
                    <option value="ARQUIVADO">Arquivado</option>
                </select>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead class="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 uppercase font-bold text-xs border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th class="px-4 py-4">Entrada</th>
                            <th class="px-4 py-4">Candidato</th>
                            <th class="px-4 py-4">Cargo Proposto</th>
                            <th class="px-4 py-4">CNH</th>
                            <th class="px-4 py-4">Indicação</th>
                            <th class="px-4 py-4">Status / Local</th>
                            <th class="px-4 py-4 text-center">Anexo</th>
                            <th class="px-4 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-curriculos" class="divide-y divide-slate-100 dark:divide-slate-700">
                        <tr><td colspan="8" class="text-center p-8 text-slate-400">Carregando currículos...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    formDiv.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <i data-lucide="file-text" class="text-purple-600"></i> Registro de Currículo
            </h2>
            <button onclick="switchTab('lista-curriculos')" class="text-slate-500 hover:text-slate-700 font-bold transition flex items-center gap-2">
                <i data-lucide="arrow-left" class="w-4 h-4"></i> Voltar à Lista
            </button>
        </div>
        <form id="frmCurriculo" onsubmit="salvarCurriculo(event)" class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
            <input type="hidden" id="curriculo_id">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
                <div class="md:col-span-8">
                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Buscar Munícipe (Candidato) <span class="text-xs font-normal text-slate-400">(CPF ou Nome)</span></label>
                    <div class="flex gap-3">
                        <input type="text" id="curriculo_busca_cpf" placeholder="Digite CPF ou Nome do munícipe..." inputmode="text" class="flex-1 rounded-lg border-slate-300 dark:border-slate-600 border p-3 shadow-sm focus:border-purple-500 outline-none relative" oninput="buscarMunicipeCurriculo()" onkeydown="if(event.key === 'Enter'){event.preventDefault(); buscarMunicipeCurriculo();}">
                        <button type="button" onclick="buscarMunicipeCurriculo()" class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 shadow-sm transition"><i data-lucide="search" class="w-5 h-5"></i></button>
                    </div>
                    <div id="curriculo_resultado_busca" class="mt-3 text-sm text-slate-600 dark:text-slate-300 min-h-[24px] font-medium relative"></div>
                    <input type="hidden" id="curriculo_cpf">
                    <input type="hidden" id="curriculo_nome">
                </div>
                <div class="md:col-span-4">
                    <label class="label-field">Telefone / Contato</label>
                    <input type="text" id="curriculo_telefone" required class="input-field" placeholder="(00) 00000-0000">
                </div>
                <div class="md:col-span-4">
                    <label class="label-field text-slate-500">Data de Nascimento <span class="text-xs font-normal text-slate-400">(da base)</span></label>
                    <input type="date" id="curriculo_nascimento" class="input-field bg-slate-50 dark:bg-slate-900/50 text-slate-600">
                </div>
                <div class="md:col-span-4">
                    <label class="label-field">Data de Entrada</label>
                    <input type="date" id="curriculo_data" required class="input-field">
                </div>
                <div class="md:col-span-4">
                    <label class="label-field">Data de Conclusão</label>
                    <input type="date" id="curriculo_data_conclusao" class="input-field">
                </div>
                <div class="md:col-span-4">
                    <label class="label-field">Cargo Proposto</label>
                    <input type="text" id="curriculo_cargo" required class="input-field uppercase" placeholder="Ex: RECEPCIONISTA">
                </div>
                <div class="md:col-span-4">
                    <label class="label-field">CNH (Carteira de Habilitação)</label>
                    <select id="curriculo_cnh" class="input-field">
                        <option value="">Não Possui</option>
                        <option value="ACC">ACC</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                        <option value="AB">AB</option>
                        <option value="AC">AC</option>
                        <option value="AD">AD</option>
                        <option value="AE">AE</option>
                    </select>
                </div>
                <div class="md:col-span-4">
                    <label class="label-field">Indicação (Quem indicou)</label>
                    <input type="text" id="curriculo_indicacao" class="input-field uppercase" placeholder="Nome do vereador ou liderança">
                </div>
                <div class="md:col-span-4">
                    <label class="label-field">Status</label>
                    <select id="curriculo_status" required class="input-field font-bold" onchange="toggleFinalizadoCurriculo()">
                        <option value="ANÁLISE">ANÁLISE (Recebido)</option>
                        <option value="ENTREVISTA">EM ENTREVISTA</option>
                        <option value="CONTRATADO">CONTRATADO (Finalizado)</option>
                        <option value="ARQUIVADO">ARQUIVADO / DESCARTADO</option>
                    </select>
                </div>
                <div class="md:col-span-12 hidden" id="container_curriculo_finalizado">
                    <label class="label-field text-emerald-600">Finalizado - Para onde foi contratado?</label>
                    <input type="text" id="curriculo_finalizado_local" class="input-field uppercase border-emerald-300 bg-emerald-50 dark:bg-emerald-900/30" placeholder="Nome da empresa, órgão, departamento...">
                </div>
                <div class="md:col-span-12">
                    <label class="label-field flex items-center gap-2"><i data-lucide="paperclip" class="w-4 h-4 text-purple-500"></i> Anexar Currículo (PDF, Doc, Imagem - Máx 5MB)</label>
                    <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <input type="file" id="curriculo_file" accept="image/*,.pdf,.doc,.docx" class="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100">
                        <button type="button" onclick="uploadArquivoCurriculo()" class="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg font-bold transition shadow-sm flex items-center gap-2 whitespace-nowrap"><i data-lucide="upload-cloud" class="w-4 h-4"></i> Fazer Upload</button>
                        <div id="upload_progress_curriculo" class="text-sm text-purple-600 font-bold hidden flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Enviando...</div>
                    </div>
                    <div id="curriculo_arquivo_url_container" class="mt-2 text-sm text-slate-600 dark:text-slate-300 hidden flex items-center gap-2">
                        <i data-lucide="check-circle" class="text-green-500 w-4 h-4"></i> Arquivo anexado: <a href="#" id="curriculo_arquivo_url_link" target="_blank" class="text-blue-500 underline hover:text-blue-700">Ver Arquivo</a>
                        <button type="button" onclick="removerAnexoCurriculo()" class="text-red-500 text-xs ml-2 underline">Remover</button>
                    </div>
                    <input type="hidden" id="curriculo_arquivo_url">
                </div>
                <div class="md:col-span-12">
                    <label class="label-field">Relatório / Anotações da Entrevista</label>
                    <textarea id="curriculo_relatorio" rows="4" class="input-field" placeholder="Experiência, impressões, comentários..."></textarea>
                </div>
            </div>
            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onclick="switchTab('lista-curriculos')" class="px-6 py-2.5 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 transition">Cancelar</button>
                <button type="submit" id="btnSalvarCurriculo" class="px-6 py-2.5 rounded-lg font-bold text-white bg-purple-600 hover:bg-purple-700 transition shadow-sm flex items-center gap-2">
                    <i data-lucide="save" class="w-4 h-4"></i> Salvar Currículo
                </button>
            </div>
        </form>
    `;

    if(typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => {
        const inputTel = document.getElementById('curriculo_telefone');
        if(inputTel) {
            inputTel.addEventListener('input', function() {
                let v = this.value.replace(/\D/g, '');
                if (v.length > 11) v = v.substring(0,11);
                if (v.length > 2) v = `(${v.substring(0,2)}) ${v.substring(2)}`;
                if (v.length > 9) v = `${v.substring(0,10)}-${v.substring(10)}`;
                this.value = v;
            });
        }
    }, 500);
    carregarCurriculos();
}

function toggleFinalizadoCurriculo() {
    const status = document.getElementById('curriculo_status').value;
    const cont = document.getElementById('container_curriculo_finalizado');
    const input = document.getElementById('curriculo_finalizado_local');
    if (status === 'CONTRATADO') {
        cont.classList.remove('hidden');
        input.required = true;
    } else {
        cont.classList.add('hidden');
        input.required = false;
        input.value = '';
    }
}

let todosCurriculos = [];

async function carregarCurriculos() {
    try {
        const snap = await window.getDocs(window.collection(window.db, "curriculos"));
        todosCurriculos = [];
        snap.forEach(doc => { todosCurriculos.push({ id: doc.id, ...doc.data() }); });
        todosCurriculos.sort((a,b) => new Date(b.data_entrada || '1970-01-01') - new Date(a.data_entrada || '1970-01-01'));
        renderCurriculos();
    } catch(e) { console.error("Erro ao carregar currículos", e); }
}

function renderCurriculos() {
    const tbody = document.getElementById('tbody-curriculos');
    if(!tbody) return;
    const termo = (document.getElementById('busca-curriculos')?.value || '').toLowerCase();
    const status = document.getElementById('filtro-status-curriculos')?.value || '';
    let html = '';
    let count = 0;
    todosCurriculos.forEach(c => {
        const text = `${c.nome || ''} ${c.cargo_proposto || ''} ${c.indicacao || ''} ${c.cnh || ''}`.toLowerCase();
        if (termo && !text.includes(termo)) return;
        if (status && c.status !== status) return;
        count++;
        const dateFmt = c.data_entrada ? c.data_entrada.split('-').reverse().join('/') : '-';
        const dataConclusaoFmt = c.data_conclusao ? c.data_conclusao.split('-').reverse().join('/') : '';
        let badge = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        if(c.status === 'ANÁLISE') badge = 'bg-blue-100 text-blue-700';
        if(c.status === 'ENTREVISTA') badge = 'bg-amber-100 text-amber-700';
        if(c.status === 'CONTRATADO') badge = 'bg-emerald-100 text-emerald-700';
        if(c.status === 'ARQUIVADO') badge = 'bg-slate-200 text-slate-500';
        const localContratado = (c.status === 'CONTRATADO' && c.finalizado_local) ? `<br><span class="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">${c.finalizado_local}</span>` : '';
        const conclusaoTag = dataConclusaoFmt ? `<br><span class="text-[10px] text-slate-400">Conc.: ${dataConclusaoFmt}</span>` : '';
        const linkAnexo = c.arquivo_url ? `<a href="${c.arquivo_url}" target="_blank" class="inline-flex items-center gap-1 text-xs bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 text-purple-700 dark:text-purple-300 px-2 py-1 rounded font-bold transition"><i data-lucide="download" class="w-3 h-3"></i> Baixar</a>` : '<span class="text-xs text-slate-300 italic">Sem Anexo</span>';
        html += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <td class="px-4 py-3 text-sm">${dateFmt}</td>
                <td class="px-4 py-3 font-bold text-slate-700 dark:text-slate-200 uppercase">${c.nome}<div class="text-xs font-normal text-slate-400 mt-0.5"><i data-lucide="phone" class="w-3 h-3 inline mr-1"></i>${c.telefone||'-'}</div></td>
                <td class="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 text-xs">${c.cargo_proposto || '-'}</td>
                <td class="px-4 py-3 text-xs font-bold text-indigo-700 dark:text-indigo-400">${c.cnh || '-'}</td>
                <td class="px-4 py-3 text-xs uppercase">${c.indicacao||'-'}</td>
                <td class="px-4 py-3"><span class="px-2 py-1 rounded-md text-[10px] font-bold uppercase ${badge}">${c.status}</span>${localContratado}${conclusaoTag}</td>
                <td class="px-4 py-3 text-center">${linkAnexo}</td>
                <td class="px-4 py-3 text-right space-x-2">
                    <button onclick="editarCurriculo('${c.id}')" class="text-purple-500 hover:text-purple-700 bg-purple-50 dark:bg-purple-900/30 p-1.5 rounded transition" title="Editar"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                    <button onclick="deletarCurriculo('${c.id}')" class="text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-900/30 p-1.5 rounded transition" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>`;
    });
    if (count === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center p-6 text-slate-400">Nenhum currículo encontrado.</td></tr>`;
    } else {
        tbody.innerHTML = html;
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function filtrarCurriculos() { renderCurriculos(); }

function novoCurriculo() {
    if (!document.getElementById('frmCurriculo')) {
        initCurriculos();
        setTimeout(novoCurriculo, 300);
        return;
    }
    document.getElementById('frmCurriculo').reset();
    document.getElementById('curriculo_id').value = '';
    document.getElementById('curriculo_busca_cpf').value = '';
    document.getElementById('curriculo_resultado_busca').innerHTML = '';
    document.getElementById('curriculo_cpf').value = '';
    document.getElementById('curriculo_nome').value = '';
    document.getElementById('curriculo_nascimento').value = '';
    document.getElementById('curriculo_cnh').value = '';
    document.getElementById('curriculo_data_conclusao').value = '';
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    document.getElementById('curriculo_data').value = `${hoje.getFullYear()}-${mes}-${dia}`;
    document.getElementById('curriculo_arquivo_url').value = '';
    document.getElementById('curriculo_arquivo_url_container').classList.add('hidden');
    toggleFinalizadoCurriculo();
    switchTab('form-curriculos');
}

async function salvarCurriculo(e) {
    e.preventDefault();
    const id = document.getElementById('curriculo_id').value;
    const btn = document.getElementById('btnSalvarCurriculo');
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Salvando...`;
    lucide.createIcons();
    const nomeMun = document.getElementById('curriculo_nome').value.trim();
    if(!nomeMun) {
        window.showModalAlert("Por favor, busque e selecione um munícipe primeiro.");
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> Salvar Currículo`;
        return;
    }
    const data = {
        cpf_municipe: document.getElementById('curriculo_cpf').value.trim(),
        nome: nomeMun.toUpperCase(),
        telefone: document.getElementById('curriculo_telefone').value.trim(),
        nascimento: document.getElementById('curriculo_nascimento').value || '',
        data_entrada: document.getElementById('curriculo_data').value,
        data_conclusao: document.getElementById('curriculo_data_conclusao').value || '',
        cargo_proposto: document.getElementById('curriculo_cargo').value.trim().toUpperCase(),
        cnh: document.getElementById('curriculo_cnh').value || '',
        indicacao: document.getElementById('curriculo_indicacao').value.trim().toUpperCase(),
        status: document.getElementById('curriculo_status').value,
        finalizado_local: document.getElementById('curriculo_finalizado_local').value.trim().toUpperCase(),
        relatorio: document.getElementById('curriculo_relatorio').value.trim(),
        arquivo_url: document.getElementById('curriculo_arquivo_url').value || ''
    };
    try {
        if(id) {
            await window.updateDoc(window.doc(window.db, "curriculos", id), data);
        } else {
            data.created_at = new Date().toISOString();
            await window.addDoc(window.collection(window.db, "curriculos"), data);
        }
        window.showModalAlert("Currículo salvo com sucesso!");
        carregarCurriculos();
        switchTab('lista-curriculos');
    } catch(err) {
        console.error("Erro ao salvar currículo", err);
        window.showModalAlert("Erro ao salvar currículo: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> Salvar Currículo`;
        lucide.createIcons();
    }
}

async function deletarCurriculo(id) {
    if(!await window.showModalConfirm("Deseja realmente excluir este currículo?", "Esta ação não pode ser desfeita.")) return;
    try {
        await window.deleteDoc(window.doc(window.db, "curriculos", id));
        carregarCurriculos();
    } catch(err) { window.showModalAlert("Erro ao excluir: " + err.message); }
}

function editarCurriculo(id) {
    const cur = todosCurriculos.find(c => c.id === id);
    if(!cur) return;
    document.getElementById('curriculo_id').value = cur.id;
    document.getElementById('curriculo_cpf').value = cur.cpf_municipe || '';
    document.getElementById('curriculo_nome').value = cur.nome || '';
    const nomeFmt = cur.nome || 'Sem Nome';
    document.getElementById('curriculo_busca_cpf').value = nomeFmt;
    document.getElementById('curriculo_resultado_busca').innerHTML = `<span class="text-purple-600 font-bold flex items-center gap-1"><i data-lucide="check" class="w-4 h-4"></i> ${nomeFmt} (Selecionado)</span>`;
    document.getElementById('curriculo_telefone').value = cur.telefone || '';
    document.getElementById('curriculo_nascimento').value = cur.nascimento || '';
    document.getElementById('curriculo_data').value = cur.data_entrada || '';
    document.getElementById('curriculo_data_conclusao').value = cur.data_conclusao || '';
    document.getElementById('curriculo_cargo').value = cur.cargo_proposto || '';
    document.getElementById('curriculo_cnh').value = cur.cnh || '';
    document.getElementById('curriculo_indicacao').value = cur.indicacao || '';
    document.getElementById('curriculo_status').value = cur.status || 'ANÁLISE';
    document.getElementById('curriculo_finalizado_local').value = cur.finalizado_local || '';
    document.getElementById('curriculo_relatorio').value = cur.relatorio || '';
    const url = cur.arquivo_url || '';
    document.getElementById('curriculo_arquivo_url').value = url;
    if(url) {
        document.getElementById('curriculo_arquivo_url_container').classList.remove('hidden');
        document.getElementById('curriculo_arquivo_url_link').href = url;
    } else {
        document.getElementById('curriculo_arquivo_url_container').classList.add('hidden');
    }
    toggleFinalizadoCurriculo();
    switchTab('form-curriculos');
}

async function uploadArquivoCurriculo() {
    const fileInput = document.getElementById('curriculo_file');
    const file = fileInput.files[0];
    if(!file) { window.showModalAlert("Selecione um arquivo primeiro."); return; }
    if (file.size > 5 * 1024 * 1024) { window.showModalAlert('O arquivo deve ter no máximo 5MB.'); return; }
    document.getElementById('upload_progress_curriculo').classList.remove('hidden');
    document.getElementById('curriculo_arquivo_url_container').classList.add('hidden');
    try {
        const result = await uploadArquivoFirebase(file, 'curriculos_docs');
        document.getElementById('curriculo_arquivo_url').value = result.url;
        document.getElementById('curriculo_arquivo_url_link').href = result.url;
        document.getElementById('upload_progress_curriculo').classList.add('hidden');
        document.getElementById('curriculo_arquivo_url_container').classList.remove('hidden');
        fileInput.value = '';
    } catch (e) {
        console.error(e);
        window.showModalAlert("Erro ao iniciar upload: " + e.message);
        document.getElementById('upload_progress_curriculo').classList.add('hidden');
    }
}

function removerAnexoCurriculo() {
    document.getElementById('curriculo_arquivo_url').value = '';
    document.getElementById('curriculo_arquivo_url_container').classList.add('hidden');
}

function imprimirPendenciasCurriculos() {
    const pendentes = todosCurriculos.filter(c => c.status !== 'CONTRATADO' && c.status !== 'ARQUIVADO');
    if (pendentes.length === 0) { window.showModalAlert('Nenhuma pendência encontrada para impressão.'); return; }
    const grupos = {};
    pendentes.forEach(c => {
        const cargo = (c.cargo_proposto || 'SEM CARGO').trim().toUpperCase();
        if (!grupos[cargo]) grupos[cargo] = [];
        grupos[cargo].push(c);
    });
    const agora = new Date().toLocaleString('pt-BR');
    let rows = '';
    Object.keys(grupos).sort().forEach(cargo => {
        const lista = grupos[cargo];
        rows += `<tr style="background:#ede9fe;"><td colspan="7" style="padding:6px 8px;font-weight:bold;color:#5b21b6;font-size:11px;">&#128193; ${cargo} — ${lista.length} candidato(s)</td></tr>`;
        lista.forEach(c => {
            const dtFmt = c.data_entrada ? c.data_entrada.split('-').reverse().join('/') : '-';
            const nascFmt = c.nascimento ? c.nascimento.split('-').reverse().join('/') : '-';
            const statusColor = c.status === 'ANÁLISE' ? '#1d4ed8' : '#b45309';
            const statusBg = c.status === 'ANÁLISE' ? '#dbeafe' : '#fef3c7';
            rows += `<tr><td>${c.nome || '-'}</td><td>${nascFmt}</td><td>${c.telefone || '-'}</td><td>${c.indicacao || '-'}</td><td>${c.cnh || '-'}</td><td>${dtFmt}</td><td><span style="background:${statusBg};color:${statusColor};padding:2px 6px;border-radius:4px;font-weight:bold;font-size:9px;">${c.status}</span></td></tr>`;
        });
    });
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Pendências — Currículos</title><style>body{font-family:Arial,sans-serif;font-size:11px;color:#111;margin:20px;}h1{font-size:16px;text-align:center;margin-bottom:4px;}.sub{text-align:center;font-size:10px;color:#666;margin-bottom:16px;}table{width:100%;border-collapse:collapse;}th{background:#581c87;color:white;padding:6px 8px;text-align:left;border:1px solid #7c3aed;font-size:10px;}td{padding:5px 8px;border:1px solid #e2e8f0;vertical-align:top;}tr:nth-child(even){background:#faf5ff;}</style></head><body><h1>Connecta Gestão — Pendências de Currículos</h1><p class="sub">Gerado em: ${agora} — Total: ${pendentes.length}</p><table><thead><tr><th>Candidato</th><th>Nascimento</th><th>Telefone</th><th>Indicação</th><th>CNH</th><th>Entrada</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const popup = window.open('', 'PRINT', 'height=700,width=950');
    popup.document.write(html);
    popup.document.close();
    setTimeout(() => { popup.focus(); popup.print(); }, 500);
}

// Auto init on load
document.addEventListener("DOMContentLoaded", () => { setTimeout(initCurriculos, 1700); });

async function buscarMunicipeCurriculo() {
    const termo = document.getElementById('curriculo_busca_cpf').value.trim();
    const resDiv = document.getElementById('curriculo_resultado_busca');
    if(termo.length < 2) { resDiv.innerHTML = ""; return; }
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
                listaHtml += `<div onclick="selecionarMunicipeCurriculo(${pJson})" class="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-slate-100 flex flex-col text-left"><span class="font-bold text-sm text-slate-800">${p.nome}</span><span class="text-xs text-slate-400">${p.cpf || 'Sem CPF'} — ${p.municipio || ''}</span></div>`;
            });
            listaHtml += '</div>';
            resDiv.innerHTML = `<span class="text-purple-600 font-medium">${encontrados.length} munícipe(s) encontrado(s). Selecione:</span>${listaHtml}`;
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
                let listaHtml = `<div class="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] max-h-60 overflow-y-auto"><div onclick="selecionarMunicipeCurriculo(${pJson})" class="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-slate-100 flex flex-col text-left"><span class="font-bold text-sm text-slate-800">${data.nome}</span><span class="text-xs text-slate-400">${data.cpf || 'Sem CPF'} — ${data.municipio || ''}</span></div></div>`;
                resDiv.innerHTML = `<span class="text-purple-600 font-medium">1 munícipe encontrado. Selecione:</span>${listaHtml}`;
            } else {
                resDiv.innerHTML = `<span class="text-red-500 font-medium">Munícipe não encontrado.</span>`;
            }
            if(typeof lucide !== 'undefined') lucide.createIcons();
        } catch(e) { resDiv.innerText = "Erro na busca."; }
    } else {
        resDiv.innerHTML = `<span class="text-red-500 font-medium">Munícipe não encontrado.</span>`;
    }
}

window.selecionarMunicipeCurriculo = function(p) {
    const resDiv = document.getElementById('curriculo_resultado_busca');
    resDiv.innerHTML = `<span class="text-purple-600 font-bold flex items-center gap-1"><i data-lucide="check" class="w-4 h-4"></i> ${p.nome}</span>`;
    document.getElementById('curriculo_cpf').value = p.cpf || '';
    document.getElementById('curriculo_nome').value = p.nome;
    const tel = p.tel || p.telefone || p.whatsapp || p.tel1 || '';
    if(tel) document.getElementById('curriculo_telefone').value = tel;
    if(p.nascimento) document.getElementById('curriculo_nascimento').value = p.nascimento;
    if(p.indicacao) document.getElementById('curriculo_indicacao').value = p.indicacao;
    if(typeof lucide !== 'undefined') lucide.createIcons();
};
