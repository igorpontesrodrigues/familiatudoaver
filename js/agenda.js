let todosCompromissos = [];

/**
 * Carrega a agenda do Firestore
 */
async function carregarAgenda() {
    try {
        const mesAno = document.getElementById('agenda-filtro-mes') ? document.getElementById('agenda-filtro-mes').value : '';
        const diaEspecifico = document.getElementById('agenda-filtro-dia') ? document.getElementById('agenda-filtro-dia').value : '';
        const categoria = document.getElementById('agenda-filtro-categoria') ? document.getElementById('agenda-filtro-categoria').value : '';
        
        const container = document.getElementById('agenda-lista');
        if(container) container.innerHTML = '<div class="p-8 text-center text-slate-400 italic">Carregando compromissos...</div>';

        const q = window.query(window.collection(window.db, 'agenda'));
        const snapshot = await window.getDocs(q);
        
        todosCompromissos = [];
        snapshot.forEach(doc => {
            todosCompromissos.push({ id: doc.id, ...doc.data() });
        });

        // Filtrar localmente (Firestore não aceita `LIKE` ou funções de mês fáceis)
        let listaFiltrada = [...todosCompromissos];

        if (diaEspecifico) {
            listaFiltrada = listaFiltrada.filter(c => c.data === diaEspecifico);
        } else if (mesAno) {
            listaFiltrada = listaFiltrada.filter(c => c.data && c.data.startsWith(mesAno));
        }
        
        if (categoria) {
            listaFiltrada = listaFiltrada.filter(c => c.categoria === categoria);
        }

        // Ordenar por data e hora crescente
        listaFiltrada.sort((a, b) => {
            const dateA = a.data + 'T' + (a.hora || '00:00');
            const dateB = b.data + 'T' + (b.hora || '00:00');
            return dateA.localeCompare(dateB);
        });

        renderizarAgenda(listaFiltrada);
    } catch (e) {
        console.error("Erro ao carregar agenda:", e);
        if(typeof showModalAlert === 'function') showModalAlert("Erro ao carregar a agenda.");
    }
}

/**
 * Renderiza a lista de compromissos
 */
function renderizarAgenda(lista) {
    const container = document.getElementById('agenda-lista');
    const tituloLista = document.getElementById('agenda-titulo-lista');
    
    if(!container) return;

    if (tituloLista) {
        tituloLista.innerText = `Compromissos (${lista.length})`;
    }

    if (lista.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-slate-400 italic">Nenhum compromisso encontrado para os filtros selecionados.</div>';
        return;
    }

    container.innerHTML = '';
    
    // Agrupar por data
    const agrupado = {};
    lista.forEach(c => {
        if(!agrupado[c.data]) agrupado[c.data] = [];
        agrupado[c.data].push(c);
    });

    Object.keys(agrupado).sort().forEach(dataKey => {
        // Formatar data (YYYY-MM-DD para DD/MM/YYYY)
        const [ano, mes, dia] = dataKey.split('-');
        const dataFmt = `${dia}/${mes}/${ano}`;
        
        // Determinar o dia da semana
        const diaSemana = new Date(ano, mes-1, dia).toLocaleDateString('pt-BR', { weekday: 'long' });

        const headerDiv = document.createElement('div');
        headerDiv.className = "bg-amber-50 px-4 py-2 border-y border-amber-100/50 flex justify-between items-center";
        headerDiv.innerHTML = `
            <div class="font-bold text-amber-800">${dataFmt}</div>
            <div class="text-xs font-medium text-amber-600 uppercase">${diaSemana}</div>
        `;
        container.appendChild(headerDiv);

        agrupado[dataKey].forEach(c => {
            let catColor = "bg-slate-100 text-slate-700";
            let catIcon = "circle";
            
            let catLabel = 'INTERNO';
            if (c.categoria === 'GABINETE') catLabel = 'INTERNO';
            if (c.categoria === 'VISITA') { catLabel = 'EXTERNO'; catColor = "bg-emerald-100 text-emerald-700"; catIcon = "map-pin"; }
            if (c.categoria === 'EVENTO') { catLabel = 'EVENTO'; catColor = "bg-fuchsia-100 text-fuchsia-700"; catIcon = "party-popper"; }

            const div = document.createElement('div');
            div.className = "p-4 hover:bg-slate-50 transition border-b border-slate-100/50 group";
            
            const btnEditClass = (typeof currentUserRole !== 'undefined' && currentUserRole === 'VISITOR') ? 'hidden' : '';

            div.innerHTML = `
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="md:w-24 shrink-0 flex flex-col items-start md:items-end md:pr-4 md:border-r border-slate-200">
                        <div class="font-bold text-slate-800 text-lg">${c.hora || '--:--'}</div>
                        <div class="${catColor} text-[10px] px-2 py-1 rounded-full font-bold mt-1 flex items-center gap-1 uppercase">
                            <i data-lucide="${catIcon}" class="w-3 h-3"></i> ${catLabel}
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                            <h4 class="font-bold text-slate-800 uppercase text-lg mb-1">${c.titulo}</h4>
                            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                <button onclick="editarCompromisso('${c.id}')" class="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded transition ${btnEditClass}" title="Editar"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                                <button onclick="excluirCompromisso('${c.id}')" class="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded transition ${btnEditClass}" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                        </div>
                        ${(c.municipe_endereco || c.local) ? `<div class="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-2 uppercase"><i data-lucide="map-pin" class="w-4 h-4 text-amber-500 shrink-0"></i> <span>${c.municipe_endereco || c.local}</span></div>` : ''}
                        ${(c.municipe_nome || c.envolvidos) ? `<div class="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-1.5 uppercase"><i data-lucide="user" class="w-4 h-4 text-blue-500 shrink-0"></i> <span><strong>${c.municipe_nome || c.envolvidos}</strong> ${c.municipe_cpf ? `(CPF: ${c.municipe_cpf})` : ''}</span></div>` : ''}
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                            ${c.telefone ? `<div class="text-sm text-slate-500 flex items-center gap-1"><i data-lucide="phone" class="w-3.5 h-3.5"></i> ${c.telefone}</div>` : ''}
                            ${c.servico ? `<div class="text-sm text-slate-500 flex items-center gap-1"><i data-lucide="activity" class="w-3.5 h-3.5"></i> ${c.servico}</div>` : ''}
                            ${c.indicacao ? `<div class="text-sm text-slate-500 flex items-center gap-1"><i data-lucide="tag" class="w-3.5 h-3.5"></i> Indicação: ${c.indicacao}</div>` : ''}
                        </div>

                        ${c.detalhes ? `<div class="mt-3 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-100 dark:border-slate-700 uppercase">${c.detalhes}</div>` : ''}
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    });

    if(typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Funções auxiliares para buscar e selecionar munícipe na Agenda
 */
window.buscarMunicipeAgenda = function(termo) {
    const listaSugestoes = document.getElementById('agenda_lista_sugestoes');
    if (!listaSugestoes) return;

    if (!termo || termo.trim().length < 2) {
        listaSugestoes.classList.add('hidden');
        listaSugestoes.innerHTML = '';
        return;
    }

    const busca = termo.toLowerCase().trim();
    const buscaDigitos = termo.replace(/\D/g, '');

    const filtrados = (window.todosPacientes || []).filter(p => {
        const nome = (p.nome || '').toLowerCase();
        const cpf = (p.cpf || '').toLowerCase();
        const cpfDigitos = (p.cpf || '').replace(/\D/g, '');
        return nome.includes(busca) || cpf.includes(busca) || (buscaDigitos.length >= 3 && cpfDigitos.includes(buscaDigitos));
    }).slice(0, 10);

    if (filtrados.length === 0) {
        listaSugestoes.innerHTML = '<div class="p-3 text-xs text-slate-400 text-center italic">Nenhum munícipe encontrado.</div>';
        listaSugestoes.classList.remove('hidden');
        return;
    }

    let html = '';
    filtrados.forEach(p => {
        const enderecoFmt = [p.logradouro, p.numero ? `nº ${p.numero}` : '', p.bairro, p.municipio].filter(Boolean).join(', ');
        html += `
            <div onclick="selecionarMunicipeAgenda(${JSON.stringify(p).replace(/"/g, '&quot;')})" class="p-3 hover:bg-amber-50 dark:hover:bg-slate-700 cursor-pointer transition">
                <div class="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase">${p.nome || 'SEM NOME'}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 flex justify-between mt-0.5">
                    <span>CPF: ${p.cpf || 'S/N'}</span>
                    <span class="truncate max-w-[200px]">${enderecoFmt || 'Sem endereço'}</span>
                </div>
            </div>
        `;
    });

    listaSugestoes.innerHTML = html;
    listaSugestoes.classList.remove('hidden');
};

window.selecionarMunicipeAgenda = function(p) {
    const enderecoFmt = [p.logradouro, p.numero ? `nº ${p.numero}` : '', p.bairro, p.municipio].filter(Boolean).join(', ');

    document.getElementById('agenda_municipe_id').value = p.id || '';
    document.getElementById('agenda_municipe_nome').value = p.nome || '';
    document.getElementById('agenda_municipe_cpf').value = p.cpf || '';
    document.getElementById('agenda_municipe_endereco').value = enderecoFmt;

    document.getElementById('agenda_card_nome').innerText = p.nome || 'SEM NOME';
    document.getElementById('agenda_card_cpf').innerText = p.cpf || 'Não informado';
    document.getElementById('agenda_card_endereco').innerText = enderecoFmt || 'Não informado';

    document.getElementById('agenda_municipe_card').classList.remove('hidden');
    document.getElementById('agenda_lista_sugestoes').classList.add('hidden');
    document.getElementById('agenda_busca_municipe').value = '';

    const envInput = document.getElementById('agenda_envolvidos');
    if (envInput && (!envInput.value || envInput.value.trim() === '')) {
        envInput.value = `${p.nome || ''} ${p.cpf ? '(CPF: ' + p.cpf + ')' : ''}`.trim();
    }

    const locInput = document.getElementById('agenda_local');
    if (locInput && (!locInput.value || locInput.value.trim() === '') && enderecoFmt) {
        locInput.value = enderecoFmt;
    }
};

window.limparMunicipeAgenda = function() {
    document.getElementById('agenda_municipe_id').value = '';
    document.getElementById('agenda_municipe_nome').value = '';
    document.getElementById('agenda_municipe_cpf').value = '';
    document.getElementById('agenda_municipe_endereco').value = '';
    document.getElementById('agenda_municipe_card').classList.add('hidden');
};

/**
 * Abre o modal de nova agenda
 */
function abrirModalAgenda() {
    document.getElementById('frmAgenda').reset();
    document.getElementById('agenda_id').value = '';
    limparMunicipeAgenda();
    document.getElementById('titulo-modal-agenda').innerText = "Novo Compromisso";
    document.getElementById('btn-salvar-agenda').innerHTML = "Salvar Compromisso";
    
    // Set default date to today
    const hoje = new Date();
    document.getElementById('agenda_data').valueAsDate = hoje;

    const modal = document.getElementById('modal-agenda');
    if (modal) modal.classList.remove('hidden');
}

/**
 * Fecha o modal
 */
function fecharModalAgenda() {
    const modal = document.getElementById('modal-agenda');
    if (modal) modal.classList.add('hidden');
}

/**
 * Edita um compromisso
 */
function editarCompromisso(id) {
    const comp = todosCompromissos.find(c => c.id === id);
    if (!comp) return;

    document.getElementById('agenda_id').value = comp.id;
    document.getElementById('agenda_titulo').value = comp.titulo || '';
    document.getElementById('agenda_data').value = comp.data || '';
    document.getElementById('agenda_hora').value = comp.hora || '';
    document.getElementById('agenda_categoria').value = comp.categoria || 'GABINETE';
    document.getElementById('agenda_local').value = comp.local || '';
    document.getElementById('agenda_envolvidos').value = comp.envolvidos || '';
    document.getElementById('agenda_detalhes').value = comp.detalhes || '';
    
    // Novos campos
    if(document.getElementById('agenda_servico')) document.getElementById('agenda_servico').value = comp.servico || '';
    if(document.getElementById('agenda_telefone')) document.getElementById('agenda_telefone').value = comp.telefone || '';
    if(document.getElementById('agenda_indicacao')) document.getElementById('agenda_indicacao').value = comp.indicacao || '';

    if (comp.municipe_nome || comp.municipe_cpf) {
        document.getElementById('agenda_municipe_id').value = comp.municipe_id || '';
        document.getElementById('agenda_municipe_nome').value = comp.municipe_nome || '';
        document.getElementById('agenda_municipe_cpf').value = comp.municipe_cpf || '';
        document.getElementById('agenda_municipe_endereco').value = comp.municipe_endereco || '';
        document.getElementById('agenda_card_nome').innerText = comp.municipe_nome || 'SEM NOME';
        document.getElementById('agenda_card_cpf').innerText = comp.municipe_cpf || 'Não informado';
        document.getElementById('agenda_card_endereco').innerText = comp.municipe_endereco || 'Não informado';
        document.getElementById('agenda_municipe_card').classList.remove('hidden');
    } else {
        limparMunicipeAgenda();
    }

    document.getElementById('titulo-modal-agenda').innerText = "Editar Compromisso";
    document.getElementById('btn-salvar-agenda').innerHTML = "Atualizar Compromisso";
    
    const modal = document.getElementById('modal-agenda');
    if (modal) modal.classList.remove('hidden');
}

/**
 * Salva a agenda no Firestore
 */
async function salvarAgenda(e) {
    e.preventDefault();
    
    const id = document.getElementById('agenda_id').value;
    const btnSalvar = document.getElementById('btn-salvar-agenda');
    const originalText = btnSalvar.innerHTML;
    
    btnSalvar.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Salvando...`;
    btnSalvar.disabled = true;

    try {
        const dados = {
            titulo: document.getElementById('agenda_titulo').value,
            data: document.getElementById('agenda_data').value,
            hora: document.getElementById('agenda_hora').value,
            categoria: document.getElementById('agenda_categoria').value,
            local: document.getElementById('agenda_local').value,
            envolvidos: document.getElementById('agenda_envolvidos').value,
            detalhes: document.getElementById('agenda_detalhes').value,
            servico: document.getElementById('agenda_servico') ? document.getElementById('agenda_servico').value : '',
            telefone: document.getElementById('agenda_telefone') ? document.getElementById('agenda_telefone').value : '',
            indicacao: document.getElementById('agenda_indicacao') ? document.getElementById('agenda_indicacao').value : '',
            municipe_id: document.getElementById('agenda_municipe_id').value || '',
            municipe_nome: document.getElementById('agenda_municipe_nome').value || '',
            municipe_cpf: document.getElementById('agenda_municipe_cpf').value || '',
            municipe_endereco: document.getElementById('agenda_municipe_endereco').value || '',
            data_criacao: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (id) {
            await window.updateDoc(window.doc(window.db, 'agenda', id), dados);
        } else {
            await window.addDoc(window.collection(window.db, 'agenda'), dados);
        }

        fecharModalAgenda();
        carregarAgenda();
        if(typeof showModalAlert === 'function') showModalAlert("Compromisso salvo com sucesso!");
        if(typeof window.logAuditoria === 'function') {
            window.logAuditoria(id ? 'EDIÇÃO' : 'CRIAÇÃO', 'Agenda', `${id ? 'Edição de' : 'Novo'} compromisso - Munícipe/Título: ${dados.municipe_nome || dados.titulo || '-'} | Data: ${dados.data_hora_inicio || '-'}`);
        }
    } catch (err) {
        console.error("Erro ao salvar agenda:", err);
        if(typeof showModalAlert === 'function') showModalAlert("Erro ao salvar compromisso: " + err.message);
    } finally {
        btnSalvar.innerHTML = originalText;
        btnSalvar.disabled = false;
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
}

/**
 * Exclui um compromisso
 */
async function excluirCompromisso(id) {
    if (typeof showModalConfirm === 'function') {
        const conf = await showModalConfirm("Tem certeza que deseja excluir este compromisso?");
        if (!conf) return;
    } else {
        if (!confirm("Tem certeza que deseja excluir este compromisso?")) return;
    }

    const comp = typeof todosCompromissos !== 'undefined' ? todosCompromissos.find(c => c.id === id) : null;
    const info = comp ? `${comp.municipe_nome || comp.titulo || ''} (${comp.data_hora_inicio || '-'})` : `ID: ${id}`;

    try {
        await window.deleteDoc(window.doc(window.db, 'agenda', id));
        if(typeof window.logAuditoria === 'function') {
            window.logAuditoria('EXCLUSÃO', 'Agenda', `Exclusão de compromisso - ${info}`);
        }
        carregarAgenda();
    } catch (e) {
        console.error("Erro ao excluir agenda:", e);
        if(typeof showModalAlert === 'function') showModalAlert("Erro ao excluir compromisso.");
    }
}

// Inicializa a agenda quando a aba for ativada
document.addEventListener('DOMContentLoaded', () => {
    // Escuta mudanças de aba no ui.js
    const oldSwitchTab = window.switchTab;
    if (typeof oldSwitchTab === 'function') {
        window.switchTab = function(tabId, bypassHistory) {
            oldSwitchTab(tabId, bypassHistory);
            if (tabId === 'agenda') {
                carregarAgenda();
                
                // Set default month to current month if empty
                const filtroMes = document.getElementById('agenda-filtro-mes');
                if (filtroMes && !filtroMes.value) {
                    const hoje = new Date();
                    filtroMes.value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
                    carregarAgenda();
                }
            }
        };
    }
});

window.imprimirAgendaOficial = function() {
    const mesAno = document.getElementById('agenda-filtro-mes') ? document.getElementById('agenda-filtro-mes').value : '';
    const diaEspecifico = document.getElementById('agenda-filtro-dia') ? document.getElementById('agenda-filtro-dia').value : '';
    
    let listaFiltrada = [...(todosCompromissos || [])];
    if (diaEspecifico) {
        listaFiltrada = listaFiltrada.filter(c => c.data === diaEspecifico);
    } else if (mesAno) {
        listaFiltrada = listaFiltrada.filter(c => c.data && c.data.startsWith(mesAno));
    }

    listaFiltrada.sort((a, b) => {
        const dateA = a.data + 'T' + (a.hora || '00:00');
        const dateB = b.data + 'T' + (b.hora || '00:00');
        return dateA.localeCompare(dateB);
    });

    if (listaFiltrada.length === 0) {
        if (typeof showModalAlert === 'function') showModalAlert('Nenhum compromisso encontrado para imprimir com os filtros atuais.');
        return;
    }

    // Agrupar por data
    const agrupado = {};
    listaFiltrada.forEach(c => {
        if (!agrupado[c.data]) agrupado[c.data] = [];
        agrupado[c.data].push(c);
    });

    let linhasHtml = '';
    Object.keys(agrupado).sort().forEach(dataKey => {
        const [ano, mes, dia] = dataKey.split('-');
        const dataFmt = `${dia}/${mes}/${ano}`;
        const diaSemana = new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { weekday: 'long' });

        linhasHtml += `
            <tr style="page-break-inside: avoid; break-inside: avoid;">
                <td style="padding: 14px 0 6px 0;">
                    <div class="date-banner">
                        <span class="date-num">${dataFmt}</span>
                        <span class="date-day">${diaSemana}</span>
                    </div>
                </td>
            </tr>
        `;

        agrupado[dataKey].forEach(c => {
            let catBorder = "#3b82f6";
            let catBg = "#eff6ff";
            let catColor = "#1d4ed8";
            let catLabel = "INTERNO";
            
            if (c.categoria === 'GABINETE') { catLabel = "INTERNO"; }
            if (c.categoria === 'VISITA') { catBorder = "#10b981"; catBg = "#ecfdf5"; catColor = "#047857"; catLabel = "EXTERNO"; }
            if (c.categoria === 'EVENTO') { catBorder = "#a855f7"; catBg = "#fdf4ff"; catColor = "#7e22ce"; catLabel = "EVENTO"; }

            const envTexto = c.municipe_nome 
                ? `<strong>${c.municipe_nome}</strong> ${c.municipe_cpf ? `(CPF: ${c.municipe_cpf})` : ''}`
                : (c.envolvidos || '');
            const endTexto = c.municipe_endereco || c.local || '';

            linhasHtml += `
                <tr style="page-break-inside: avoid; break-inside: avoid;">
                    <td style="padding: 6px 0;">
                        <div class="card-item" style="border-left: 5px solid ${catBorder};">
                            <div class="card-left">
                                <div class="time-box">${c.hora || '--:--'}</div>
                                <div class="cat-pill" style="background: ${catBg}; color: ${catColor};">${catLabel}</div>
                            </div>
                            <div class="card-body">
                                <div class="card-title">${c.titulo || 'SEM TÍTULO'}</div>
                                ${endTexto ? `<div class="card-row"><span class="lbl">📍 Endereço / Local:</span> ${endTexto}</div>` : ''}
                                ${envTexto ? `<div class="card-row"><span class="lbl">👤 Munícipe / Envolvidos:</span> ${envTexto}</div>` : ''}
                                ${(c.telefone || c.servico || c.indicacao) ? `
                                    <div class="card-row" style="margin-top: 6px; display: flex; gap: 15px; font-size: 11px;">
                                        ${c.telefone ? `<span><span class="lbl">📞 Tel:</span> ${c.telefone}</span>` : ''}
                                        ${c.servico ? `<span><span class="lbl">⚕️ Serviço:</span> ${c.servico}</span>` : ''}
                                        ${c.indicacao ? `<span><span class="lbl">🏷️ Indicação:</span> ${c.indicacao}</span>` : ''}
                                    </div>
                                ` : ''}
                                ${c.detalhes ? `<div class="card-details">${c.detalhes}</div>` : ''}
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });
    });

    const periodoStr = diaEspecifico ? `Dia ${diaEspecifico.split('-').reverse().join('/')}` : (mesAno ? `Mês ${mesAno.split('-').reverse().join('/')}` : 'Geral');

    const htmlPrint = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Agenda Oficial - Connecta</title>
        <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #1e293b; margin: 0; padding: 0; background: #fff; }
            table { width: 100%; border-collapse: collapse; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; break-inside: avoid; }
            td { vertical-align: top; }

            .header-banner {
                padding-bottom: 16px;
                border-bottom: 3px solid #f59e0b;
                margin-bottom: 16px;
            }
            .header-banner .brand {
                font-size: 24px;
                font-weight: 800;
                color: #0f172a;
                letter-spacing: -0.5px;
                margin: 0;
            }
            .header-banner .subtitle {
                font-size: 13px;
                font-weight: 600;
                color: #d97706;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 3px 0 8px 0;
            }
            .header-banner .meta {
                font-size: 12px;
                color: #64748b;
            }

            .date-banner {
                background: #fffbeb;
                border: 1px solid #fef3c7;
                border-left: 4px solid #f59e0b;
                border-radius: 8px;
                padding: 10px 14px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .date-banner .date-num {
                font-size: 16px;
                font-weight: 800;
                color: #92400e;
            }
            .date-banner .date-day {
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                color: #b45309;
                letter-spacing: 0.5px;
            }

            .card-item {
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                padding: 14px 16px;
                display: flex;
                gap: 18px;
                background: #ffffff;
                box-shadow: 0 1px 3px rgba(0,0,0,0.03);
            }
            .card-left {
                width: 85px;
                flex-shrink: 0;
                border-right: 1px solid #f1f5f9;
                padding-right: 14px;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
            }
            .time-box {
                font-size: 18px;
                font-weight: 800;
                color: #0f172a;
                line-height: 1.1;
            }
            .cat-pill {
                font-size: 10px;
                font-weight: 800;
                padding: 3px 8px;
                border-radius: 999px;
                text-transform: uppercase;
                margin-top: 6px;
            }
            .card-body {
                flex: 1;
            }
            .card-title {
                font-size: 15px;
                font-weight: 800;
                color: #0f172a;
                text-transform: uppercase;
                margin-bottom: 6px;
            }
            .card-row {
                font-size: 12px;
                color: #334155;
                margin-top: 4px;
                line-height: 1.4;
            }
            .card-row .lbl {
                font-weight: 700;
                color: #64748b;
            }
            .card-details {
                margin-top: 8px;
                padding: 8px 12px;
                background: #f8fafc;
                border: 1px solid #f1f5f9;
                border-radius: 6px;
                font-size: 11.5px;
                color: #475569;
                line-height: 1.4;
                text-transform: uppercase;
            }
        </style>
    </head>
    <body>
        <table>
            <thead>
                <tr>
                    <th>
                        <div class="header-banner">
                            <div class="brand">CONNECTA</div>
                            <div class="subtitle">Agenda Oficial de Compromissos</div>
                            <div class="meta">Período: <strong>${periodoStr}</strong> &nbsp;•&nbsp; Total: <strong>${listaFiltrada.length} compromissos</strong> &nbsp;•&nbsp; Emissão: ${new Date().toLocaleString('pt-BR')}</div>
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody>
                ${linhasHtml}
            </tbody>
        </table>
    </body>
    </html>
    `;

    let mywindow = window.open('', 'PRINT', 'height=800,width=1100');
    mywindow.document.write(htmlPrint);
    mywindow.document.close();
    mywindow.focus();
    setTimeout(() => {
        mywindow.print();
    }, 800);
};

