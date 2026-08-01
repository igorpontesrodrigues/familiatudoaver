/**
 * js/api.js
 * Funções de comunicação com o backend (Firebase Firestore) e lógica de negócios.
 */

// ============================================================================
// 0. UTILITÁRIOS DE UI (Loading Dinâmico)
// ============================================================================

function setLoadingText(loadingId, text) {
    const label = document.getElementById('lbl-' + loadingId);
    if (label) label.innerText = text;
}

// ============================================================================
// 1. FUNÇÕES BASE
// ============================================================================

// VALORES PADRÃO HARDCODED (Para garantir que apareçam mesmo se o DB estiver vazio)
const VALORES_PADRAO = {
    'CATEGORIAS': [],
    'ATENDIMENTO': [],
    'ESPECIALIDADE': [],
    'PROCEDIMENTO_EXAMES': [],
    'TIPOS_EXAME': [],
    'STATUS_TITULO': [],
    'STATUS_ATENDIMENTO': [],
    'PRIORIDADE': [],
    'TIPOS_SERVICO': [],
    'LIDERANCA': [],
    'LOCAL': [],
    'PARCEIRO': [],
    'INDICACAO': []
};
window.VALORES_PADRAO = VALORES_PADRAO;

async function carregarFiltros() {
    const safety = setTimeout(() => {
        if(typeof CONFIG_SELECTS !== 'undefined') {
            CONFIG_SELECTS.forEach(cfg => {
                const sel = document.getElementById(`sel_${cfg.id}`);
                if(sel && sel.value === "" && sel.options[0].text === "Carregando...") {
                    popularSelectComPadroes(sel, cfg.key, []);
                }
            });
        }
    }, 5000);

    try {
        if (window.auth && !window.auth.currentUser) {
            await new Promise(resolve => {
                const unsubscribe = window.auth.onAuthStateChanged(user => {
                    unsubscribe();
                    resolve();
                });
            });
        }
        
        // Se ainda não estiver logado, não tente buscar no firestore
        if (window.auth && !window.auth.currentUser) return;
        
        const querySnapshot = await window.getDocs(window.collection(window.db, "config_selects"));
        const resultData = {};
        window.precosPadraoProcedimentos = {};
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const cat = data.tipo || data.chave;
            if(cat && data.valor) {
                if(!resultData[cat]) resultData[cat] = [];
                if(!resultData[cat].includes(data.valor)) resultData[cat].push(data.valor);
                
                if (data.preco_padrao) {
                    window.precosPadraoProcedimentos[data.valor] = data.preco_padrao;
                }
            }
        });

        clearTimeout(safety);
        opcoesFiltros = resultData;
        
        if(typeof CONFIG_SELECTS !== 'undefined') {
            CONFIG_SELECTS.forEach(cfg => {
                const sel = document.getElementById(`sel_${cfg.id}`);
                if(!sel) return;
                
                const listaDB = opcoesFiltros[cfg.key] || [];
                popularSelectComPadroes(sel, cfg.key, listaDB);
                
                // Restaura valor selecionado se houver (edição)
                const hiddenVal = document.getElementById(`field_${cfg.id}`).value;
                if(hiddenVal) {
                    let exists = false;
                    for(let i=0; i<sel.options.length; i++) {
                        if(sel.options[i].value.toUpperCase() === hiddenVal.toUpperCase()) {
                            sel.selectedIndex = i; exists = true; break;
                        }
                    }
                    if(!exists) {
                        const novaOpcao = new Option(hiddenVal, hiddenVal, true, true);
                        const lastIndex = sel.options.length - 1;
                        sel.add(novaOpcao, lastIndex >= 0 ? sel.options[lastIndex] : null);
                        sel.value = hiddenVal; 
                    }
                }
            });
        }
        
        if (typeof window.aplicarTomSelectGlobalmente === 'function') {
            window.aplicarTomSelectGlobalmente();
        }
    } catch (err) { console.error("Erro ao carregar filtros", err); }
}

window.aplicarTomSelectGlobalmente = function() {
    if (typeof TomSelect === 'undefined') return;
    const selects = document.querySelectorAll('select.input-field, select.tom-select-auto');
    selects.forEach(sel => {
        if (sel.tomselect) {
            sel.tomselect.sync();
        } else {
            // Check if it's already hidden or disabled (TomSelect will hide the original anyway, but don't apply if it's a hidden original)
            if(sel.style.display === 'none' && !sel.classList.contains('tomselected')) return;
            new TomSelect(sel, {
                create: false,
                placeholder: sel.options[0] && sel.options[0].value === "" ? sel.options[0].text : "Pesquise ou selecione...",
                allowEmptyOption: true,
                maxOptions: 200,
                onChange: function(value) {
                    // manually trigger onchange event so our existing logic (like checkSelectNew) fires
                    const event = new Event('change', { bubbles: true });
                    sel.dispatchEvent(event);
                }
            });
        }
    });
};

function popularSelectComPadroes(sel, key, listaExtra) {
    sel.innerHTML = '<option value="">Selecione...</option>';
    
    // 1. Pega os padrões definidos no código
    const padroes = VALORES_PADRAO[key] || [];
    
    // 2. Junta com os do banco (evitando duplicados)
    const conjuntoUnico = new Set([...padroes, ...listaExtra]);
    
    // 3. Ordena e cria as opções
    Array.from(conjuntoUnico).sort().forEach(op => {
        if(op) sel.innerHTML += `<option value="${op}">${op}</option>`;
    });
    
    // Sincroniza TomSelect se já existir
    if (sel.tomselect) {
        sel.tomselect.sync();
    }
}

async function saveNewFilter(category, value) {
    if (!value || value === "") return;
    try {
        const valNorm = String(value).toUpperCase().trim();
        const catNorm = category.toUpperCase().trim();
        const q = window.query(window.collection(window.db, "filtros"), window.where("categoria", "==", catNorm), window.where("valor", "==", valNorm));
        const querySnapshot = await window.getDocs(q);
        
        if (querySnapshot.empty) {
            await window.addDoc(window.collection(window.db, "filtros"), {
                categoria: catNorm,
                valor: valNorm
            });
        }
    } catch (e) {
        console.error("Erro ao salvar novo filtro", e);
    }
}

// ============================================================================
// 2. MUNÍCIPES (ANTIGOS PACIENTES) E HISTÓRICO
// ============================================================================

async function carregarListaPacientes() {
    const tbody = document.getElementById('tabela-pacientes-body');
    if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Carregando lista...</td></tr>';
    
    try {
        const q = window.query(window.collection(window.db, "pacientes"));
        const querySnapshot = await window.getDocs(q);
        const pacientes = [];
        querySnapshot.forEach((doc) => {
            pacientes.push({ ...doc.data(), id: doc.id });
        });
        
        // Ordena em memória para evitar exclusão de docs sem data_criacao
        pacientes.sort((a,b) => {
            const n1 = (a.nome || '').toLowerCase();
            const n2 = (b.nome || '').toLowerCase();
            return n1.localeCompare(n2);
        });
        
        todosPacientes = pacientes;
        filtrarPacientesNaTela();
    } catch(e) { 
        console.error(e);
        if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center text-red-500 py-4">Erro de conexão.</td></tr>'; 
    }
}

window.tabPacientesAtual = 'COMPLETOS'; // 'COMPLETOS' ou 'PRE'

function mudarTabPacientes(tab) {
    window.tabPacientesAtual = tab;
    document.getElementById('tab-pacientes-completos').classList.remove('border-blue-600', 'text-blue-600', 'dark:text-blue-400');
    document.getElementById('tab-pacientes-completos').classList.add('border-transparent', 'text-slate-500');
    document.getElementById('tab-pacientes-pre').classList.remove('border-blue-600', 'text-blue-600', 'dark:text-blue-400');
    document.getElementById('tab-pacientes-pre').classList.add('border-transparent', 'text-slate-500');
    
    if (tab === 'COMPLETOS') {
        document.getElementById('tab-pacientes-completos').classList.add('border-blue-600', 'text-blue-600', 'dark:text-blue-400');
        document.getElementById('tab-pacientes-completos').classList.remove('border-transparent', 'text-slate-500');
    } else {
        document.getElementById('tab-pacientes-pre').classList.add('border-blue-600', 'text-blue-600', 'dark:text-blue-400');
        document.getElementById('tab-pacientes-pre').classList.remove('border-transparent', 'text-slate-500');
    }
    filtrarPacientesNaTela();
}

function filtrarPacientesNaTela() {
    const termo = document.getElementById('filtro-paciente-input').value.toLowerCase();
    
    // Filtra pela aba (Completos vs Pré Cadastro)
    let porAba = todosPacientes.filter(p => {
        if (window.tabPacientesAtual === 'PRE') {
            return p.pre_cadastro === true;
        } else {
            return !p.pre_cadastro;
        }
    });

    const filtrados = porAba.filter(p => {
        const nome = p.nome ? String(p.nome).toLowerCase() : '';
        const cpf = p.cpf ? String(p.cpf) : '';
        const municipio = p.municipio ? String(p.municipio).toLowerCase() : '';
        return nome.includes(termo) || cpf.includes(termo) || municipio.includes(termo);
    });
    
    if(typeof renderizarPaginaPacientes === 'function') {
        window.paginacaoPacientes.dadosFiltrados = filtrados;
        window.paginacaoPacientes.paginaAtual = 1;
        renderizarPaginaPacientes();
    }
}

async function carregarAniversarios() {
    const tbody = document.getElementById('tabela-niver-body');
    if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Buscando...</td></tr>';
    const mes = parseInt(document.getElementById('filtro-niver-mes').value);
    const mesStr = mes.toString().padStart(2, '0');
    
    try {
        const querySnapshot = await window.getDocs(window.collection(window.db, "pacientes"));
        const aniversariantes = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if(data.nascimento && data.nascimento !== "") {
                const parts = data.nascimento.split('-');
                if(parts.length === 3 && parts[1] === mesStr) {
                    const dia = parseInt(parts[2]);
                    aniversariantes.push({
                        id: doc.id,
                        nome: data.nome,
                        cpf: data.cpf,
                        dia: dia,
                        data_completa: data.nascimento,
                        tel: data.tel1,
                        bairro: data.bairro
                    });
                }
            }
        });

        aniversariantes.sort((a, b) => a.dia - b.dia);
        
        tbody.innerHTML = '';
        if(aniversariantes.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">Nenhum aniversariante neste mês.</td></tr>'; return; }
        
        const hoje = new Date();
        const diaHoje = hoje.getDate();
        const mesHoje = hoje.getMonth() + 1;

        aniversariantes.forEach(p => {
            if(p.data_completa && p.data_completa.startsWith('1900')) return;
            let statusClass = "text-slate-600";
            let rowClass = "hover:bg-blue-50 cursor-pointer transition-all border-b border-slate-100";
            let statusText = "Futuro";
            let icone = "";

            if (mes < mesHoje) {
                statusClass = "text-slate-500";
                rowClass = "bg-slate-50 hover:bg-slate-100 cursor-pointer border-b border-slate-200 transition-colors";
                statusText = "Já foi";
                icone = "check";
            } else if (mes > mesHoje) {
                statusClass = "text-blue-600 font-medium";
                rowClass = "bg-white hover:bg-blue-50 cursor-pointer border-b border-slate-100 border-l-4 border-l-blue-300 transition-colors";
                statusText = "Futuro";
                icone = "calendar-clock";
            } else {
                if (p.dia < diaHoje) {
                    statusClass = "text-slate-500 font-medium";
                    rowClass = "bg-slate-100 hover:bg-slate-200 cursor-pointer border-b border-slate-200 transition-colors";
                    statusText = "Já foi";
                    icone = "check-circle";
                } else if (p.dia === diaHoje) {
                    statusClass = "text-emerald-700 font-bold animate-pulse";
                    rowClass = "bg-emerald-50 border-2 border-emerald-400 cursor-pointer shadow-md relative z-10";
                    statusText = "HOJE!";
                    icone = "party-popper";
                } else {
                    statusClass = "text-slate-600 font-bold";
                    rowClass = "bg-white hover:bg-slate-50 cursor-pointer border-b border-slate-100 border-l-4 border-l-slate-300 transition-colors";
                    statusText = "Em breve";
                    icone = "clock";
                }
            }

            let dataFmt = `${p.dia}/${mes}`;
            if(p.data_completa) {
                const parts = p.data_completa.split('-');
                if(parts.length === 3) {
                    const ano = parseInt(parts[0]);
                    if(ano > 1901) dataFmt = `${parts[2]}/${parts[1]}/${parts[0]}`; else dataFmt = `${parts[2]}/${parts[1]}`; 
                }
            }

            const tr = document.createElement('tr');
            tr.className = rowClass;
            tr.onclick = function() { 
                if(p.cpf || p.nome) verHistoricoCompleto(p);
                else showModalAlert("Cadastro incompleto (sem CPF/Nome).");
            };
            
            tr.innerHTML = `
                <td class="px-6 py-4 font-bold ${statusClass} flex items-center gap-2">
                    ${icone ? `<i data-lucide="${icone}" class="w-4 h-4"></i>` : ''} ${dataFmt}
                </td>
                <td class="px-6 py-4 uppercase font-medium text-slate-700">${p.nome}</td>
                <td class="px-6 py-4 text-slate-500">${p.tel||'-'}</td>
                <td class="px-6 py-4 text-slate-500 uppercase">${p.bairro||'-'}</td>
                <td class="px-6 py-4 text-xs uppercase font-bold ${statusClass}">${statusText}</td>
            `;
            tbody.appendChild(tr);
        });
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-red-500 py-4">Erro ao carregar.</td></tr>'; }
}

async function verificarCpfInicial() {
    const cpf = document.getElementById('paciente_cpf_check').value;
    const msg = document.getElementById('msg_cpf_paciente');
    const loading = document.getElementById('loading-paciente');
    
    setLoadingText('loading-paciente', "Buscando...");

    if(cpf.length < 5) { msg.innerHTML = "<span class='text-red-600 font-bold'>CPF Inválido.</span>"; return; }
    loading.classList.remove('hidden'); loading.classList.add('flex');
    document.getElementById('opcoes-paciente-existente').classList.add('hidden');
    document.getElementById('resto-form-paciente').classList.add('hidden');
    pacienteAtual = null;

    try {
        const searchCpf = String(cpf).replace(/\D/g, '');
        const searchCpfFormatado = searchCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        let querySnapshot = await window.getDocs(window.query(window.collection(window.db, "pacientes"), window.where("cpf", "==", searchCpf)));
        
        if (querySnapshot.empty && searchCpfFormatado.length === 14) {
            querySnapshot = await window.getDocs(window.query(window.collection(window.db, "pacientes"), window.where("cpf", "==", searchCpfFormatado)));
        }
        
        loading.classList.add('hidden'); loading.classList.remove('flex');
        if(!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            pacienteAtual = { ...doc.data(), id: doc.id };
            msg.innerHTML = `<span class="text-blue-700 font-bold flex items-center gap-1"><i data-lucide="check" class="w-4 h-4"></i> Encontrado: ${pacienteAtual.nome}</span>`;
            document.getElementById('opcoes-paciente-existente').classList.remove('hidden');
        } else {
            msg.innerHTML = `<span class="text-emerald-600 font-bold flex items-center gap-1"><i data-lucide="plus" class="w-4 h-4"></i> CPF não encontrado. Iniciando novo cadastro.</span>`;
            if(typeof mostrarFormularioPaciente === 'function') mostrarFormularioPaciente(false);
        }
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) { 
        loading.classList.add('hidden'); loading.classList.remove('flex'); 
        msg.innerHTML = "Erro de conexão."; 
        console.error(e);
    }
}

async function verificarPorId(id) {
    const loading = document.getElementById('loading-paciente');
    setLoadingText('loading-paciente', "Carregando dados...");
    
    loading.classList.remove('hidden'); loading.classList.add('flex');
    try {
        const docRef = window.doc(window.db, "pacientes", id);
        const docSnap = await window.getDoc(docRef);
        
        loading.classList.add('hidden'); loading.classList.remove('flex');
        if(docSnap.exists) {
            pacienteAtual = { ...docSnap.data(), id: docSnap.id };
            
            const msgElement = document.getElementById('msg_cpf_paciente');
            const cpfStr = pacienteAtual.cpf ? String(pacienteAtual.cpf) : '';

            if (cpfStr.length > 4) {
                msgElement.innerHTML = `<span class="text-blue-700 font-bold flex items-center gap-1"><i data-lucide="check" class="w-4 h-4"></i> Munícipe Encontrado: ${pacienteAtual.nome}</span>`;
            } else {
                msgElement.innerHTML = `<span class="text-orange-600 font-bold flex items-center gap-1"><i data-lucide="alert-circle" class="w-4 h-4"></i> Editando cadastro sem CPF (ID: ${id})</span>`;
            }

            document.getElementById('opcoes-paciente-existente').classList.remove('hidden');
            if(typeof editarPaciente === 'function') editarPaciente();
        }
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) { console.error(e); }
}

function editarPaciente() { 
    if(pacienteAtual && typeof mostrarFormularioPaciente === 'function') mostrarFormularioPaciente(true, pacienteAtual); 
}

async function submitPaciente(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    let rawCpf = document.getElementById('paciente_cpf_check').value;
    
    // Se o CPF no form estiver preenchido (mesmo no pré-cadastro), usá-lo
    const cpfFormInput = document.getElementById('field_cpf_form');
    if (cpfFormInput && cpfFormInput.value) {
        rawCpf = cpfFormInput.value;
    }
    
    data.cpf = String(rawCpf).replace(/\D/g, '');
    delete data.cpf_form; // Remove duplicate key from formData
    
    try {
        data.arquivos_anexos = JSON.parse(data.arquivos_json || '[]');
    } catch(e) {
        data.arquivos_anexos = [];
    }
    delete data.arquivos_json;
    
    const isPreCadastro = (window.tipoCadastroAtual === 'PRE' && (!data.cpf || data.cpf.length < 5));
    data.pre_cadastro = isPreCadastro;
    
    if(!isPreCadastro) {
        if(!data.cpf || data.cpf.length < 5) { showModalAlert("CPF obrigatório para Cadastro Completo."); return; }
    }
    
    const loading = document.getElementById('loading-paciente');
    setLoadingText('loading-paciente', "Salvando...");
    if(loading) { loading.classList.remove('hidden'); loading.classList.add('flex'); }

    // Normalize to uppercase
    for(let k in data) {
        if(typeof data[k] === 'string' && !['cpf','id'].includes(k) && !k.includes('data')) {
            data[k] = data[k].toUpperCase();
        }
    }

    try {
        let docId = data.id;
        let acao = 'criar';
        let dadosAnteriores = null;
        
        // Verifica se CPF já existe para evitar duplicidades (apenas se tiver CPF)
        let hasDuplicate = false;
        let existingDocId = null;
        if (data.cpf && data.cpf.length >= 5) {
            const checkQ = window.query(window.collection(window.db, "pacientes"), window.where("cpf", "==", data.cpf));
            const checkSnap = await window.getDocs(checkQ);
            if (!checkSnap.empty) {
                hasDuplicate = true;
                existingDocId = checkSnap.docs[0].id;
            }
        }
        
        if (!docId) {
            if (hasDuplicate) {
                showModalAlert("Erro: Este CPF já está cadastrado no sistema!");
                if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
                return;
            }
            // New patient
            data.data_criacao = new Date().toISOString();
            const docRef = await window.addDoc(window.collection(window.db, "pacientes"), data);
            docId = docRef.id;
            
            if(typeof window.logAuditoria === 'function') {
                window.logAuditoria('CRIAÇÃO', 'Munícipes', `Novo cadastro: ${data.nome} (CPF: ${data.cpf})`);
            }
        } else {
            if (hasDuplicate) {
                if (existingDocId !== docId) {
                    showModalAlert("Erro: Este CPF já pertence a outro munícipe!");
                    if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
                    return;
                }
            }
            // Update patient
            acao = 'editar';
            const oldSnap = await window.getDoc(window.doc(window.db, "pacientes", docId));
            if(oldSnap.exists) dadosAnteriores = oldSnap.data();
            
            const { id, ...updateData } = data; // remove id from data
            await window.updateDoc(window.doc(window.db, "pacientes", docId), updateData);
            
            if(typeof window.logAuditoria === 'function') {
                window.logAuditoria('EDIÇÃO', 'Munícipes', `Edição de cadastro: ${data.nome} (CPF: ${data.cpf})`);
            }
        }

        if(typeof atualizarEstatisticas === 'function') {
            await atualizarEstatisticas('pacientes', acao, dadosAnteriores, data);
        }

        // Salva novos filtros automaticamente
        await saveNewFilter('MUNICIPIO', data.municipio);
        await saveNewFilter('BAIRRO', data.bairro);
        await saveNewFilter('STATUS_TITULO', data.status_titulo);
        await saveNewFilter('INDICACAO', data.indicacao);
        
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        showMessage('Munícipe salvo com sucesso!', 'success');
        if(typeof window.logAuditoria === 'function') window.logAuditoria(data.id ? 'EDITAR_MUNICIPE' : 'CRIAR_MUNICIPE', 'MUNICIPES', 'Nome: ' + data.nome);
        
        if(typeof resetFormPaciente === 'function') resetFormPaciente(); 
        if(typeof voltarInicio === 'function') voltarInicio(); 
    } catch (err) {
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        showModalAlert("Erro ao salvar: " + err);
    }
}

window.submitAtendimentoAPI = async (batch) => {
    const loading = document.getElementById('loading-atendimento');
    setLoadingText('loading-atendimento', "Salvando atendimento(s)...");
    if(loading) { loading.classList.remove('hidden'); loading.classList.add('flex'); }

    try {
        const fireBatch = window.writeBatch(window.db);
        let docsAtualizados = 0;
        let acao = 'criar';

        for (let data of batch) {
            let docId = data.id;
            
            for(let k in data) {
                if(typeof data[k] === 'string' && !['cpf_paciente','id'].includes(k) && !k.includes('data')) {
                    data[k] = data[k].toUpperCase();
                }
            }

            if (!docId) {
                data.data_criacao = new Date().toISOString();
                const newRef = window.doc(window.collection(window.db, "atendimentos"));
                fireBatch.set(newRef, data);
                data.id = newRef.id;
            } else {
                acao = 'editar';
                const docRef = window.doc(window.db, "atendimentos", docId);
                const { id, ...updateData } = data;
                fireBatch.update(docRef, updateData);
            }
            docsAtualizados++;
        }

        await fireBatch.commit();
        
        if(typeof atualizarEstatisticas === 'function') {
            await atualizarEstatisticas('atendimentos', acao, null, batch[0]);
        }

        if (typeof todosAtendimentos !== 'undefined' && Array.isArray(todosAtendimentos)) {
            for (let item of batch) {
                if (acao === 'criar') {
                    todosAtendimentos.unshift(item);
                } else {
                    const idx = todosAtendimentos.findIndex(a => a.id === item.id);
                    if (idx > -1) todosAtendimentos[idx] = item;
                    else todosAtendimentos.unshift(item);
                }
            }
        }

        window._atendimentosPrecisamRecarregar = true;
        if(typeof carregarListaAtendimentos === 'function') {
            carregarListaAtendimentos().catch(e => console.error("Reload error", e));
        }

        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        showMessage(docsAtualizados > 1 ? 'Atendimentos salvos com sucesso!' : 'Atendimento salvo com sucesso!', 'success');
        if(typeof window.logAuditoria === 'function') window.logAuditoria('SALVAR_ATENDIMENTO', 'ATENDIMENTOS', 'Prontuário/Data: ' + batch[0]?.data_abertura || new Date().toISOString());
        return true;
    } catch (err) {
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        if (typeof showModalAlert === 'function') showModalAlert("Erro ao salvar atendimento: " + err);
        return false;
    }
};

// ============================================================================
// 3. ATENDIMENTOS E DASHBOARD
// ============================================================================

async function buscarPacienteParaAtendimento() {
    const termo = document.getElementById('busca_cpf').value.trim();
    const resDiv = document.getElementById('resultado_busca');
    if(termo.length < 2) {
        resDiv.innerHTML = "";
        return; 
    }
    
    resDiv.innerText = "Buscando..."; 
    document.getElementById('resto-form-atendimento').classList.add('hidden');
    
    // 1. Tenta buscar na memória local primeiro (muito mais rápido)
    const termoLower = termo.toLowerCase();
    const termoDigitos = termo.replace(/\D/g, '');
    
    if (typeof todosPacientes !== 'undefined' && Array.isArray(todosPacientes) && todosPacientes.length > 0) {
        let encontrados = todosPacientes.filter(p => {
            const nome = (p.nome || '').toLowerCase();
            const cpf = (p.cpf || '').replace(/\D/g, '');
            return nome.includes(termoLower) || (termoDigitos.length >= 3 && cpf.includes(termoDigitos));
        });
        
        if (encontrados.length > 0 && encontrados.length <= 15) {
            // Mostra lista para escolher
            let listaHtml = `<div class="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] max-h-60 overflow-y-auto">`;
            encontrados.forEach(p => {
                const pJson = JSON.stringify(p).replace(/"/g, '&quot;');
                listaHtml += `<div onclick="selecionarPacienteAtendimento(${pJson})" class="px-4 py-2 hover:bg-emerald-50 cursor-pointer border-b border-slate-100 flex flex-col text-left">
                    <span class="font-bold text-sm text-slate-800">${p.nome}</span>
                    <span class="text-xs text-slate-400">${p.cpf || 'Sem CPF'} — ${p.municipio || ''}</span>
                </div>`;
            });
            listaHtml += '</div>';
            resDiv.innerHTML = `<span class="text-blue-600 font-medium">${encontrados.length} mun\u00EDcipe(s) encontrado(s). Selecione:</span>${listaHtml}`;
            if(typeof lucide !== 'undefined') lucide.createIcons();
            return;
        } else if (encontrados.length > 15) {
            resDiv.innerHTML = `<span class="text-slate-500 font-medium">Muitos resultados (${encontrados.length}). Digite mais para filtrar.</span>`;
            return;
        }
    }
    
    if (termoDigitos.length >= 3) {
        // 2. Fallback: busca no Firestore somente por CPF
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
                listaHtml += `<div onclick="selecionarPacienteAtendimento(${pJson})" class="px-4 py-2 hover:bg-emerald-50 cursor-pointer border-b border-slate-100 flex flex-col text-left">
                    <span class="font-bold text-sm text-slate-800">${data.nome}</span>
                    <span class="text-xs text-slate-400">${data.cpf || 'Sem CPF'} — ${data.municipio || ''}</span>
                </div></div>`;
                resDiv.innerHTML = `<span class="text-blue-600 font-medium">1 munícipe encontrado. Selecione:</span>${listaHtml}`;
            } else {
                resDiv.innerHTML = `<span class="text-red-500 font-medium">Munícipe não encontrado. Verifique o nome ou CPF.</span>`;
            }
            if(typeof lucide !== 'undefined') lucide.createIcons();
        } catch(e) { resDiv.innerText = "Erro na busca."; }
    } else {
        resDiv.innerHTML = `<span class="text-red-500 font-medium">Munícipe não encontrado. Verifique o nome ou CPF.</span>`;
    }
}

// Função auxiliar para quando o usuário clica em um da lista
window.selecionarPacienteAtendimento = function(p) {
    const resDiv = document.getElementById('resultado_busca');
    resDiv.innerHTML = `<span class="text-emerald-600 font-bold flex items-center gap-1"><i data-lucide="check" class="w-4 h-4"></i> ${p.nome}</span>`;
    document.getElementById('hidden_cpf').value = p.cpf || '';
    document.getElementById('hidden_nome').value = p.nome;
    if(document.getElementById('hidden_id_paciente')) document.getElementById('hidden_id_paciente').value = p.id || '';
    document.getElementById('busca_cpf').value = p.cpf || p.nome;

    // Limpa todos os campos do formulário antes de mostrar (evita dados do paciente anterior)
    if (typeof resetFormAtendimento === 'function') resetFormAtendimento(true);

    document.getElementById('resto-form-atendimento').classList.remove('hidden');
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

async function carregarListaAtendimentos() {
    const tbody = document.getElementById('tabela-atendimentos-body');
    const contador = document.getElementById('contador-atendimentos');
    
    if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">Carregando histórico...</td></tr>';
    
    try {
        const q = window.query(window.collection(window.db, "atendimentos"));
        const querySnapshot = await window.getDocs(q);
        const atendimentos = [];
        querySnapshot.forEach((doc) => {
            atendimentos.push({ ...doc.data(), id: doc.id });
        });
        
        atendimentos.sort((a, b) => {
            const n1 = (a.nome_paciente || '').toLowerCase();
            const n2 = (b.nome_paciente || '').toLowerCase();
            return n1.localeCompare(n2);
        });
        
        todosAtendimentos = atendimentos;
        atualizarFiltrosData();
        
        if(typeof renderizarPaginaAtendimentos === 'function') {
            window.paginacaoAtendimentos.dadosFiltrados = todosAtendimentos;
            window.paginacaoAtendimentos.paginaAtual = 1;
            renderizarPaginaAtendimentos();
        } else {
             if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center text-red-500 py-4">Erro: renderizarTabelaAtendimentos não encontrada.</td></tr>';
        }
    } catch(e) { 
        console.error(e);
        if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center text-red-500 py-4">Erro de conexão ao carregar atendimentos.</td></tr>'; 
    }
}

function atualizarFiltrosData() {
    if(!todosAtendimentos) return;
    
    const anos = new Set();
    const meses = [
        {v:'01',n:'Janeiro'},{v:'02',n:'Fevereiro'},{v:'03',n:'Março'},
        {v:'04',n:'Abril'},{v:'05',n:'Maio'},{v:'06',n:'Junho'},
        {v:'07',n:'Julho'},{v:'08',n:'Agosto'},{v:'09',n:'Setembro'},
        {v:'10',n:'Outubro'},{v:'11',n:'Novembro'},{v:'12',n:'Dezembro'}
    ];

    todosAtendimentos.forEach(at => {
        if(at.data_abertura) {
            anos.add(at.data_abertura.split('-')[0]);
        }
    });

    const selAno = document.getElementById('filtro-ano');
    const selMes = document.getElementById('filtro-mes');
    
    if(selAno) {
        const current = selAno.value;
        selAno.innerHTML = '<option value="">Ano</option>';
        Array.from(anos).sort().reverse().forEach(a => selAno.innerHTML += `<option value="${a}">${a}</option>`);
        selAno.value = current;
    }
    
    if(selMes && selMes.options.length <= 1) {
        selMes.innerHTML = '<option value="">Mês</option>';
        meses.forEach(m => selMes.innerHTML += `<option value="${m.v}">${m.n}</option>`);
    }
}

function filtrarAtendimentos() {
    if(!todosAtendimentos) return;
    
    const termo = document.getElementById('filtro-atendimento-input').value.toLowerCase();
    const status = document.getElementById('filtro-status').value;
    const mes = document.getElementById('filtro-mes').value;
    const ano = document.getElementById('filtro-ano').value;

    const filtrados = todosAtendimentos.filter(at => {
        const textoMatch = (at.nome_paciente && at.nome_paciente.toLowerCase().includes(termo)) ||
                           (at.cpf_paciente && String(at.cpf_paciente).includes(termo)) ||
                           (at.especialidade && at.especialidade.toLowerCase().includes(termo)) ||
                           (at.tipo_servico && at.tipo_servico.toLowerCase().includes(termo));
        
        if(!textoMatch) return false;
        if(status) {
            const st = (at.status || '').toUpperCase().trim();
            if (status === 'CONCLUIDO') {
                if(st !== 'CONCLUIDO' && st !== 'CONCLUÍDO' && st !== 'RESOLVIDO') return false;
            } else {
                if(st !== status) return false;
            }
        }
        
        const [y, m, d] = at.data_abertura ? at.data_abertura.split('-') : ['','',''];
        if(mes && m !== mes) return false;
        if(ano && y !== ano) return false;

        return true;
    });

    if(typeof renderizarPaginaAtendimentos === 'function') {
        window.paginacaoAtendimentos.dadosFiltrados = filtrados;
        window.paginacaoAtendimentos.paginaAtual = 1;
        renderizarPaginaAtendimentos();
    }
}


async function loadDashboard() {
    try {
        const pacSnap = await window.getDocs(window.collection(window.db, "pacientes"));
        const atendSnap = await window.getDocs(window.collection(window.db, "atendimentos"));
        
        const pacientes = [];
        pacSnap.forEach(doc => pacientes.push({ ...doc.data(), id: doc.id }));
        
        const atendimentos = [];
        atendSnap.forEach(doc => atendimentos.push({ ...doc.data(), id: doc.id }));
        
        dashboardRawData = { pacientes, atendimentos };
        
        if(typeof popularFiltroAno === 'function') popularFiltroAno();
        if(typeof aplicarFiltrosDashboard === 'function') aplicarFiltrosDashboard();
    } catch(e) { console.error(e); }
}

function popularFiltroAno() {
    if(!dashboardRawData) return;
    const anos = new Set();
    dashboardRawData.atendimentos.forEach(at => {
        if(at.data_abertura) anos.add(at.data_abertura.split('-')[0]);
    });
    const sel = document.getElementById('dash-filter-ano');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">Ano: Todos</option>';
    Array.from(anos).sort().reverse().forEach(a => sel.innerHTML += `<option value="${a}">${a}</option>`);
    if(current) sel.value = current;
}

function aplicarFiltrosDashboard() {
    if(!dashboardRawData) return;
    
    const fStatus = document.getElementById('dash-filter-status') ? document.getElementById('dash-filter-status').value : '';
    const fMes = document.getElementById('dash-filter-mes') ? document.getElementById('dash-filter-mes').value : '';
    const fAno = document.getElementById('dash-filter-ano') ? document.getElementById('dash-filter-ano').value : '';
    const modoSelect = document.getElementById('dash-modo');
    const modo = modoSelect ? modoSelect.value : 'municipe';
    
    const temFiltroAtivo = fStatus !== "" || fMes !== "" || fAno !== "";

    const atendimentosFiltrados = dashboardRawData.atendimentos.filter(at => {
        const [y, m, d] = at.data_abertura ? at.data_abertura.split('-') : ['','',''];
        if(fStatus) {
            const st = (at.status || '').toUpperCase().trim();
            if (fStatus === 'CONCLUIDO') {
                if(st !== 'CONCLUIDO' && st !== 'CONCLUÍDO' && st !== 'RESOLVIDO') return false;
            } else {
                if(st !== fStatus) return false;
            }
        }
        if(fMes && m !== fMes) return false;
        if(fAno && y !== fAno) return false;
        return true;
    });

    let pacientesFiltrados;
    if (modo === 'atendimento') {
        const cpfsNosAtendimentos = new Set(atendimentosFiltrados.map(at => at.cpf_paciente));
        pacientesFiltrados = dashboardRawData.pacientes.filter(p => cpfsNosAtendimentos.has(p.cpf));
    } else {
        pacientesFiltrados = dashboardRawData.pacientes.filter(p => {
            if (!temFiltroAtivo) return true;
            let y = '', m = '';
            if (p.data_criacao) {
                const dataObj = new Date(p.data_criacao);
                if (!isNaN(dataObj)) {
                    y = dataObj.getFullYear().toString();
                    m = (dataObj.getMonth() + 1).toString().padStart(2, '0');
                }
            }
            if (fMes && m !== fMes) return false;
            if (fAno && y !== fAno) return false;
            return true;
        });
    }
    window.pacientesDashboardFiltrados = pacientesFiltrados;

    const totalPacientes = pacientesFiltrados.length; 
    const totalAtendimentos = atendimentosFiltrados.length;
    
    const statusConcluidos = ['CONCLUIDO', 'CONCLUÍDO', 'RESOLVIDO'];
    const statusCancelados = ['CANCELADO', 'INDEFERIDO'];
    
    const totalConcluidos = atendimentosFiltrados.filter(at => at.status && statusConcluidos.includes(at.status.toUpperCase())).length;
    const totalCancelados = atendimentosFiltrados.filter(at => at.status && statusCancelados.includes(at.status.toUpperCase())).length;
    const totalAndamento = atendimentosFiltrados.filter(at => at.status && at.status.toUpperCase() === 'EM ANDAMENTO').length;
    const totalPendentes = atendimentosFiltrados.filter(at => {
        if (!at.status) return true;
        const s = at.status.toUpperCase();
        return !statusConcluidos.includes(s) && !statusCancelados.includes(s) && s !== 'EM ANDAMENTO';
    }).length;

    const dp = document.getElementById('dash-pacientes');
    if (dp) dp.innerText = totalPacientes;
    const dm = document.getElementById('dash-mes');
    if (dm) dm.innerText = totalAtendimentos;
    const dconc = document.getElementById('dash-concluidos');
    if (dconc) dconc.innerText = totalConcluidos;
    const dpend = document.getElementById('dash-pendentes');
    if (dpend) dpend.innerText = totalPendentes;
    const dand = document.getElementById('dash-andamento');
    if (dand) dand.innerText = totalAndamento;
    const dcanc = document.getElementById('dash-cancelados');
    if (dcanc) dcanc.innerText = totalCancelados;
    const dpendCard = document.getElementById('dash-pendentes-card');
    if (dpendCard) dpendCard.innerText = totalPendentes;

    if(typeof renderizarGraficos === 'function') renderizarGraficos(atendimentosFiltrados, pacientesFiltrados, modo);
    if(typeof calcularMetricasTempo === 'function') calcularMetricasTempo(atendimentosFiltrados);
    if(typeof renderizarTorreGenero === 'function') renderizarTorreGenero(pacientesFiltrados);
}

function calcularMetricasTempo(atendimentos) {
    const hoje = new Date();
    let totalDiasEspera = 0;
    let countEspera = 0;
    let totalDiasMarcacao = 0;
    let countMarcacao = 0;

    atendimentos.forEach(at => {
        if(!at.data_abertura) return;
        const dAbertura = new Date(at.data_abertura);
        
        if(at.status === 'PENDENTE') {
            const diffTime = Math.abs(hoje - dAbertura);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            totalDiasEspera += diffDays;
            countEspera++;
        } else if (at.data_marcacao) {
            const dMarcacao = new Date(at.data_marcacao);
            const diffTime = Math.abs(dMarcacao - dAbertura);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            totalDiasEspera += diffDays;
            countEspera++;
            totalDiasMarcacao += diffDays;
            countMarcacao++;
        }
    });

    const mediaEspera = countEspera > 0 ? Math.round(totalDiasEspera / countEspera) : 0;
    const mediaMarcacao = countMarcacao > 0 ? Math.round(totalDiasMarcacao / countMarcacao) : 0;

    document.getElementById('dash-tempo-espera').innerText = mediaEspera;
    document.getElementById('dash-tempo-marcacao').innerText = mediaMarcacao;
    document.getElementById('dash-tempo-total').innerText = mediaEspera;
}

async function initParceiros() {
    if(!dashboardRawData) {
        await loadDashboard();
    }
    if(!dashboardRawData) return;

    const selAno = document.getElementById('parc-filter-ano');
    if(selAno && selAno.options.length <= 1) {
        const anos = new Set();
        dashboardRawData.atendimentos.forEach(at => { if(at.data_abertura) anos.add(at.data_abertura.split('-')[0]); });
        Array.from(anos).sort().reverse().forEach(a => selAno.innerHTML += `<option value="${a}">${a}</option>`);
    }

    const fStatus = document.getElementById('parc-filter-status') ? document.getElementById('parc-filter-status').value : '';
    const fMes = document.getElementById('parc-filter-mes') ? document.getElementById('parc-filter-mes').value : '';
    const fAno = document.getElementById('parc-filter-ano') ? document.getElementById('parc-filter-ano').value : '';
    const fLideranca = document.getElementById('parc-filter-lideranca') ? document.getElementById('parc-filter-lideranca').value.toUpperCase() : '';
    const hoje = new Date();

    const mapPacientes = {};
    if (dashboardRawData.pacientes) {
        dashboardRawData.pacientes.forEach(p => mapPacientes[p.cpf] = p);
    }

    // Coleta Lideranças Únicas para popular o filtro parc-filter-lideranca
    const liderancasUnicas = new Set();
    if (dashboardRawData.pacientes) {
        dashboardRawData.pacientes.forEach(p => {
            if(p.indicacao && p.indicacao.trim() !== '') liderancasUnicas.add(p.indicacao.trim().toUpperCase());
        });
    }
    dashboardRawData.atendimentos.forEach(at => {
        let ind = null;
        if (at.cpf_paciente && mapPacientes[at.cpf_paciente]) {
            ind = mapPacientes[at.cpf_paciente].indicacao || at.indicacao;
        } else {
            ind = at.indicacao;
        }
        if(ind && ind.trim() !== '') liderancasUnicas.add(ind.trim().toUpperCase());
    });
    
    const selLideranca = document.getElementById('parc-filter-lideranca');
    if (selLideranca && selLideranca.options.length <= 1) {
        Array.from(liderancasUnicas).sort().forEach(l => {
            selLideranca.innerHTML += `<option value="${l}">${l}</option>`;
        });
    }

    const parceiroStats = {};

    if (dashboardRawData.pacientes) {
        dashboardRawData.pacientes.forEach(p => {
            let parc = p.parceiro; 
            if (parc && parc.trim() !== '') {
                parc = parc.trim().toUpperCase();
                let ind = p.indicacao ? p.indicacao.trim().toUpperCase() : 'SEM INDICAÇÃO';
                
                if (fLideranca && ind !== fLideranca) return;

                if(!parceiroStats[parc]) {
                    parceiroStats[parc] = { nome: parc, total_pacientes: 0, total: 0, concluido: 0, andamento: 0, pendente: 0, cancelado: 0, qtd: 0, isLider: false, lista: [], listaPacientes: [] };
                }
                parceiroStats[parc].total_pacientes++;
                parceiroStats[parc].listaPacientes.push(p);
            }
        });
    }

    const filtrados = dashboardRawData.atendimentos.filter(at => {
        const [y, m, d] = at.data_abertura ? at.data_abertura.split('-') : ['','',''];
        if(fStatus && at.status !== fStatus) return false;
        if(fMes && m !== fMes) return false;
        if(fAno && y !== fAno) return false;
        
        let ind = null;
        if (at.cpf_paciente && mapPacientes[at.cpf_paciente]) {
            ind = mapPacientes[at.cpf_paciente].indicacao || at.indicacao;
        } else {
            ind = at.indicacao;
        }
        ind = (ind || 'SEM INDICAÇÃO').trim().toUpperCase();
        
        if (fLideranca && ind !== fLideranca) return false;
        
        return true;
    });

    filtrados.forEach(at => {
        let parc = null;
        if (at.parceiro && at.parceiro.trim() !== '') {
            parc = at.parceiro.trim().toUpperCase();
        } else if (at.cpf_paciente && mapPacientes[at.cpf_paciente] && mapPacientes[at.cpf_paciente].parceiro) {
            parc = mapPacientes[at.cpf_paciente].parceiro.trim().toUpperCase();
        }

        if (!parc || parc === 'null' || parc === 'undefined' || parc.trim() === '') {
            parc = 'SEM PARCEIRO';
        } else {
            parc = parc.trim().toUpperCase();
        }

        if(!parceiroStats[parc]) {
            parceiroStats[parc] = { nome: parc, total_pacientes: 0, total: 0, concluido: 0, andamento: 0, pendente: 0, cancelado: 0, qtd: 0, isLider: false, lista: [], listaPacientes: [] };
        }
        
        const statP = parceiroStats[parc];
        statP.total++;
        statP.qtd++;
        
        const st = (at.status || '').toUpperCase().trim();
        if(st === 'CONCLUIDO' || st === 'CONCLUÍDO' || st === 'RESOLVIDO') statP.concluido++;
        else if(st === 'EM ANDAMENTO') statP.andamento++;
        else if(st === 'CANCELADO') statP.cancelado++;
        else statP.pendente++;
        
        let dias = 0;
        if(at.data_abertura) {
            const inicio = new Date(at.data_abertura);
            let fim = hoje;
            if(at.data_marcacao) fim = new Date(at.data_marcacao);
            const diffTime = Math.abs(fim - inicio);
            dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        statP.lista.push({ 
            ...at, 
            id: at.id, 
            cpf: at.cpf_paciente || at.cpf, 
            nome: at.nome_paciente || at.nome || 'Nome não carregado', 
            diasEspera: dias 
        });
    });

    const listaParceiro = Object.values(parceiroStats).sort((a,b) => b.total - a.total);
    if(!window.dadosRelatorioCache) window.dadosRelatorioCache = {};
    window.dadosRelatorioCache['parceiro'] = listaParceiro;

    renderTabelaParceiroBody(listaParceiro);
}

async function initLiderancas() {
    if(!dashboardRawData) {
        await loadDashboard();
    }
    if(!dashboardRawData) return;

    const selAno = document.getElementById('lider-filter-ano');
    if(selAno && selAno.options.length <= 1) {
        const anos = new Set();
        dashboardRawData.atendimentos.forEach(at => { if(at.data_abertura) anos.add(at.data_abertura.split('-')[0]); });
        Array.from(anos).sort().reverse().forEach(a => selAno.innerHTML += `<option value="${a}">${a}</option>`);
    }

    const fStatus = document.getElementById('lider-filter-status') ? document.getElementById('lider-filter-status').value : '';
    const fMes = document.getElementById('lider-filter-mes') ? document.getElementById('lider-filter-mes').value : '';
    const fAno = document.getElementById('lider-filter-ano') ? document.getElementById('lider-filter-ano').value : '';
    const fParceiro = document.getElementById('lider-filter-parceiro') ? document.getElementById('lider-filter-parceiro').value.toUpperCase() : '';
    const hoje = new Date();

    const mapPacientes = {};
    const mapPacientesById = {};
    const mapPacientesByNome = {};
    const isValidKey = (k) => {
        if(!k) return false;
        if(typeof k !== 'string') return false;
        const t = k.trim().toUpperCase();
        if(t === '' || t === 'UNDEFINED' || t === 'NULL' || t === '___.___.___-__') return false;
        return true;
    };

    if (dashboardRawData.pacientes) {
        dashboardRawData.pacientes.forEach(p => {
            if (isValidKey(p.cpf)) mapPacientes[p.cpf] = p;
            if (p.id) mapPacientesById[p.id] = p;
            if (isValidKey(p.nome)) mapPacientesByNome[p.nome.trim().toUpperCase()] = p;
        });
    }

    // Coleta Parceiros Únicos para popular o filtro lider-filter-parceiro
    const parceirosUnicos = new Set();
    if (dashboardRawData.pacientes) {
        dashboardRawData.pacientes.forEach(p => {
            if(p.parceiro && p.parceiro.trim() !== '') parceirosUnicos.add(p.parceiro.trim().toUpperCase());
        });
    }
    dashboardRawData.atendimentos.forEach(at => {
        let parc = null;
        if (at.parceiro && at.parceiro.trim() !== '') {
            parc = at.parceiro.trim().toUpperCase();
        } else {
            let pParc = null;
            if (at.id_paciente && mapPacientesById[at.id_paciente]) pParc = mapPacientesById[at.id_paciente];
            else if (isValidKey(at.cpf_paciente) && mapPacientes[at.cpf_paciente]) pParc = mapPacientes[at.cpf_paciente];
            else if (isValidKey(at.nome_paciente) && mapPacientesByNome[at.nome_paciente.trim().toUpperCase()]) pParc = mapPacientesByNome[at.nome_paciente.trim().toUpperCase()];
            
            if(pParc && pParc.parceiro) parc = pParc.parceiro.trim().toUpperCase();
        }
        if(parc && parc.trim() !== '') parceirosUnicos.add(parc.trim().toUpperCase());
    });
    
    const selParceiro = document.getElementById('lider-filter-parceiro');
    if (selParceiro && selParceiro.options.length <= 1) {
        Array.from(parceirosUnicos).sort().forEach(p => {
            selParceiro.innerHTML += `<option value="${p}">${p}</option>`;
        });
    }

    const liderancaStats = {};
    
    if (dashboardRawData.pacientes) {
        dashboardRawData.pacientes.forEach(p => {
            let ind = p.indicacao;
            let parc = p.parceiro ? p.parceiro.trim().toUpperCase() : 'SEM PARCEIRO';
            let isLider = (p.lideranca && p.lideranca.trim().toUpperCase() === 'SIM');
            
            if (fParceiro && parc !== fParceiro) return;
            
            if (!ind || ind.trim() === '' || ind === 'null' || ind === 'undefined') {
                ind = 'SEM INDICAÇÃO';
            } else {
                ind = ind.trim().toUpperCase();
            }
            
            if(!liderancaStats[ind]) {
                liderancaStats[ind] = { nome: ind, total_pacientes: 0, total: 0, concluido: 0, andamento: 0, pendente: 0, cancelado: 0, qtd: 0, isLider: false, lista: [], listaPacientes: [] };
            }
            
            liderancaStats[ind].total_pacientes++;
            liderancaStats[ind].listaPacientes.push(p);
            if(isLider) liderancaStats[ind].isLider = true;
        });
    }

    const filtrados = dashboardRawData.atendimentos.filter(at => {
        const [y, m, d] = at.data_abertura ? at.data_abertura.split('-') : ['','',''];
        if(fStatus && at.status !== fStatus) return false;
        if(fMes && m !== fMes) return false;
        if(fAno && y !== fAno) return false;
        
        let parc = null;
        if (at.parceiro && at.parceiro.trim() !== '') {
            parc = at.parceiro.trim().toUpperCase();
        } else {
            let pParc = null;
            if (at.id_paciente && mapPacientesById[at.id_paciente]) pParc = mapPacientesById[at.id_paciente];
            else if (isValidKey(at.cpf_paciente) && mapPacientes[at.cpf_paciente]) pParc = mapPacientes[at.cpf_paciente];
            else if (isValidKey(at.nome_paciente) && mapPacientesByNome[at.nome_paciente.trim().toUpperCase()]) pParc = mapPacientesByNome[at.nome_paciente.trim().toUpperCase()];
            
            if(pParc && pParc.parceiro) parc = pParc.parceiro.trim().toUpperCase();
        }
        parc = (parc || 'SEM PARCEIRO').trim().toUpperCase();
        
        if (fParceiro && parc !== fParceiro) return false;
        
        return true;
    });
    
    filtrados.forEach(at => {
        let ind = null;
        let isLider = false;
        let p = null;
        if (at.id_paciente && mapPacientesById[at.id_paciente]) p = mapPacientesById[at.id_paciente];
        else if (isValidKey(at.cpf_paciente) && mapPacientes[at.cpf_paciente]) p = mapPacientes[at.cpf_paciente];
        else if (isValidKey(at.nome_paciente) && mapPacientesByNome[at.nome_paciente.trim().toUpperCase()]) p = mapPacientesByNome[at.nome_paciente.trim().toUpperCase()];
        
        if (p) {
            ind = p.indicacao || at.indicacao;
            isLider = ((p.lideranca && p.lideranca.trim().toUpperCase() === 'SIM') || (at.lideranca && at.lideranca.trim().toUpperCase() === 'SIM'));
        } else {
            ind = at.indicacao;
            isLider = (at.lideranca && at.lideranca.trim().toUpperCase() === 'SIM');
        }
        
        if (!ind || ind.trim() === '' || ind === 'null' || ind === 'undefined') {
            ind = 'SEM INDICAÇÃO';
        } else {
            ind = ind.trim().toUpperCase();
        }
        
        if(!liderancaStats[ind]) {
            liderancaStats[ind] = { nome: ind, total_pacientes: 0, total: 0, concluido: 0, andamento: 0, pendente: 0, cancelado: 0, qtd: 0, isLider: false, lista: [], listaPacientes: [] };
        }
        
        const stat = liderancaStats[ind];
        if(isLider) stat.isLider = true;
        stat.total++;
        stat.qtd++;
        
        const st = (at.status || '').toUpperCase().trim();
        if(st === 'CONCLUIDO' || st === 'CONCLUÍDO' || st === 'RESOLVIDO') stat.concluido++;
        else if(st === 'EM ANDAMENTO') stat.andamento++;
        else if(st === 'CANCELADO') stat.cancelado++;
        else stat.pendente++;
        

        let dias = 0;
        if(at.data_abertura) {
            const inicio = new Date(at.data_abertura);
            let fim = hoje;
            if(at.data_marcacao) fim = new Date(at.data_marcacao);
            const diffTime = Math.abs(fim - inicio);
            dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        stat.lista.push({ 
            ...at, 
            id: at.id, 
            cpf: at.cpf_paciente || at.cpf, 
            nome: at.nome_paciente || at.nome || 'Nome não carregado', 
            diasEspera: dias 
        });
    });

    const listaLideranca = Object.values(liderancaStats).sort((a,b) => b.total - a.total);
    if(!window.dadosRelatorioCache) window.dadosRelatorioCache = {};
    window.dadosRelatorioCache['lideranca'] = listaLideranca;

    renderTabelaLiderancaBody(listaLideranca);
}

window.sortLiderancaCol = 'demandas';
window.sortLiderancaDir = 'desc';

window.ordenarTabelaLideranca = function(col) {
    if(window.sortLiderancaCol === col) {
        window.sortLiderancaDir = window.sortLiderancaDir === 'asc' ? 'desc' : 'asc';
    } else {
        window.sortLiderancaCol = col;
        window.sortLiderancaDir = col === 'nome' ? 'asc' : 'desc';
    }
    
    const lista = window.dadosRelatorioCache['lideranca'];
    if(!lista) return;

    lista.sort((a, b) => {
        let valA, valB;
        if(col === 'nome') { valA = a.nome; valB = b.nome; }
        else if(col === 'pessoas') { valA = a.total_pacientes; valB = b.total_pacientes; }
        else if(col === 'demandas') { valA = a.total; valB = b.total; }
        else if(col === 'concluido') { valA = a.concluido; valB = b.concluido; }
        else if(col === 'pendente') { valA = a.pendente; valB = b.pendente; }
        else if(col === 'perc') { valA = (a.concluido / (a.total||1)); valB = (b.concluido / (b.total||1)); }

        if(valA < valB) return window.sortLiderancaDir === 'asc' ? -1 : 1;
        if(valA > valB) return window.sortLiderancaDir === 'asc' ? 1 : -1;
        return 0;
    });

    renderTabelaLiderancaBody(lista);
}

window.sortParceiroCol = 'demandas';
window.sortParceiroDir = 'desc';

window.ordenarTabelaParceiro = function(col) {
    if(window.sortParceiroCol === col) {
        window.sortParceiroDir = window.sortParceiroDir === 'asc' ? 'desc' : 'asc';
    } else {
        window.sortParceiroCol = col;
        window.sortParceiroDir = col === 'nome' ? 'asc' : 'desc';
    }
    
    const lista = window.dadosRelatorioCache['parceiro'];
    if(!lista) return;

    lista.sort((a, b) => {
        let valA, valB;
        if(col === 'nome') { valA = a.nome; valB = b.nome; }
        else if(col === 'pessoas') { valA = a.total_pacientes; valB = b.total_pacientes; }
        else if(col === 'demandas') { valA = a.total; valB = b.total; }
        else if(col === 'concluido') { valA = a.concluido; valB = b.concluido; }
        else if(col === 'andamento') { valA = a.andamento; valB = b.andamento; }
        else if(col === 'pendente') { valA = a.pendente; valB = b.pendente; }
        else if(col === 'cancelado') { valA = a.cancelado; valB = b.cancelado; }
        else if(col === 'perc') { valA = (a.concluido / (a.total||1)); valB = (b.concluido / (b.total||1)); }

        if(valA < valB) return window.sortParceiroDir === 'asc' ? -1 : 1;
        if(valA > valB) return window.sortParceiroDir === 'asc' ? 1 : -1;
        return 0;
    });

    renderTabelaParceiroBody(lista);
}

function renderTabelaParceiroBody(listaParceiro) {
    const tbody = document.getElementById('tabela-parceiros-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if(listaParceiro.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-slate-400 text-xs">Sem dados com estes filtros.</td></tr>';
    } else {
        listaParceiro.forEach((stat, index) => {
            const perc = Math.round((stat.concluido / stat.total) * 100) || 0;
            const corBarra = perc > 70 ? 'bg-emerald-500' : (perc > 40 ? 'bg-blue-500' : 'bg-orange-400');
            
            tbody.innerHTML += `
                <tr class="hover:bg-blue-50 border-b border-slate-50 transition cursor-pointer group" onclick="abrirListaRelatorio('parceiro', ${index})">
                    <td class="px-2 py-2 font-bold text-slate-700 text-xs truncate max-w-[120px] group-hover:text-blue-700" title="${stat.nome}">
                        ${stat.nome} 
                        <i data-lucide="search" class="w-3 h-3 inline opacity-0 group-hover:opacity-100 ml-1"></i>
                    </td>
                    <td class="px-2 py-2 text-center font-mono font-bold text-indigo-700">${stat.total}</td>
                    <td class="px-2 py-2 text-center font-mono text-emerald-600">${stat.concluido}</td>
                    <td class="px-2 py-2 text-center font-mono text-blue-600">${stat.andamento}</td>
                    <td class="px-2 py-2 text-center font-mono text-orange-600">${stat.pendente}</td>
                    <td class="px-2 py-2 text-center font-mono text-red-600">${stat.cancelado}</td>
                    <td class="px-2 py-2 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <span class="text-[10px] font-bold text-slate-500">${perc}%</span>
                            <div class="w-8 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div class="h-full ${corBarra}" style="width: ${perc}%"></div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function renderTabelaLiderancaBody(listaLideranca) {
    const tbody = document.getElementById('tabela-lideranca-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if(listaLideranca.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-slate-400 text-xs">Sem dados com estes filtros.</td></tr>';
    } else {
        listaLideranca.forEach((stat, index) => {
            const perc = Math.round((stat.concluido / stat.total) * 100) || 0;
            const corBarra = perc > 70 ? 'bg-emerald-500' : (perc > 40 ? 'bg-blue-500' : 'bg-orange-400');
            
            tbody.innerHTML += `
                <tr class="hover:bg-blue-50 border-b border-slate-50 transition cursor-pointer group" onclick="abrirListaRelatorio('lideranca', ${index})">
                    <td class="px-2 py-2 font-bold text-slate-700 text-xs truncate max-w-[120px] group-hover:text-blue-700" title="${stat.nome}">
                        ${stat.nome} 
                        ${stat.isLider ? '<span class="ml-1 bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">Líder</span>' : ''}
                        <i data-lucide="search" class="w-3 h-3 inline opacity-0 group-hover:opacity-100 ml-1"></i>
                    </td>
                    <td class="px-2 py-2 text-center font-mono font-bold text-blue-700">${stat.total_pacientes}</td>
                    <td class="px-2 py-2 text-center font-mono font-bold text-indigo-700">${stat.total}</td>
                    <td class="px-2 py-2 text-center font-mono text-emerald-600">${stat.concluido}</td>
                    <td class="px-2 py-2 text-center font-mono text-orange-600">${stat.pendente}</td>
                    <td class="px-2 py-2 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <span class="text-[10px] font-bold text-slate-500">${perc}%</span>
                            <div class="w-8 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div class="h-full ${corBarra}" style="width: ${perc}%"></div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
}

/**
 * Gera e imprime um relatório detalhado de Lideranças e Parceiros em PDF.
 */
window.imprimirRelatorioLideranca = function() {
    const lista = window.dadosRelatorioCache ? window.dadosRelatorioCache['lideranca'] : null;
    if (!lista || lista.length === 0) {
        if(typeof showModalAlert === 'function') showModalAlert('Carregue os dados de parceiros primeiro antes de imprimir.');
        return;
    }

    const fStatus = document.getElementById('parc-filter-status') ? document.getElementById('parc-filter-status').value : '';
    const fMes = document.getElementById('parc-filter-mes') ? document.getElementById('parc-filter-mes').value : '';
    const fAno = document.getElementById('parc-filter-ano') ? document.getElementById('parc-filter-ano').value : '';
    const mesesNome = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const filtroTexto = [fStatus, fMes ? mesesNome[parseInt(fMes)] : '', fAno].filter(Boolean).join(' / ') || 'Todos os registros';

    // Só imprimir lideranças com dados
    const listaFiltrada = lista.filter(s => s.total_pacientes > 0 || s.total > 0);

    let htmlLideres = '';
    listaFiltrada.forEach(stat => {
        const perc = Math.round((stat.concluido / (stat.total || 1)) * 100) || 0;
        const corPerc = perc > 70 ? '#10b981' : perc > 40 ? '#3b82f6' : '#f97316';

        // Pegar lista de atendimentos únicos
        const atendimentosMostrar = (stat.lista || []).slice(0, 20);

        let linhasAtend = '';
        atendimentosMostrar.forEach(at => {
            const data = at.data_abertura ? at.data_abertura.split('-').reverse().join('/') : '-';
            const statusCor = at.status === 'CONCLUIDO' ? '#059669' : '#f97316';
            linhasAtend += `
                <tr style="page-break-inside: avoid; break-inside: avoid;">
                    <td style="padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9;">${at.nome_paciente || at.nome || '-'}</td>
                    <td style="padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9;">${at.cpf_paciente || at.cpf || '-'}</td>
                    <td style="padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9;">${at.tipo_servico || at.especialidade || at.procedimento || '-'}</td>
                    <td style="padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9;">${data}</td>
                    <td style="padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9; color: ${statusCor}; font-weight: bold;">${at.status || '-'}</td>
                    <td style="padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9;">${at.obs_atendimento || '-'}</td>
                </tr>`;
        });

        // Pegar dados do 1º paciente para telefone/endereço
        const primeiroPac = stat.listaPacientes && stat.listaPacientes[0];
        const telefone = primeiroPac ? (primeiroPac.tel1 || primeiroPac.tel2 || '') : '';
        const municipio = primeiroPac ? (primeiroPac.municipio || '') : '';

        htmlLideres += `
        <div class="lider-card" style="margin-bottom: 28px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 16px; font-weight: 800; color: #f8fafc; letter-spacing: -0.3px;">
                        ${stat.nome} ${stat.isLider ? '<span style="background:#10b981;color:white;font-size:9px;padding:2px 8px;border-radius:999px;margin-left:8px;font-weight:700;">LÍDER</span>' : ''}
                    </div>
                    ${municipio ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 3px;">📍 ${municipio} ${telefone ? '&nbsp;·&nbsp; 📞 ' + telefone : ''}</div>` : ''}
                </div>
                <div style="display: flex; gap: 20px; text-align: center;">
                    <div><div style="font-size: 22px; font-weight: 800; color: #60a5fa;">${stat.total_pacientes}</div><div style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">Pessoas</div></div>
                    <div><div style="font-size: 22px; font-weight: 800; color: #a5f3fc;">${stat.total}</div><div style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">Demandas</div></div>
                    <div><div style="font-size: 22px; font-weight: 800; color: #6ee7b7;">${stat.concluido}</div><div style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">Atend.</div></div>
                    <div><div style="font-size: 22px; font-weight: 800; color: #fbbf24;">${stat.pendente}</div><div style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">Pendentes</div></div>
                    <div>
                        <div style="font-size: 22px; font-weight: 800; color: ${corPerc};">${perc}%</div>
                        <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">Resol.</div>
                    </div>
                </div>
            </div>
            ${atendimentosMostrar.length > 0 ? `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8fafc;">
                        <th style="padding: 6px 8px; font-size: 10px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Nome</th>
                        <th style="padding: 6px 8px; font-size: 10px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">CPF</th>
                        <th style="padding: 6px 8px; font-size: 10px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Serviço</th>
                        <th style="padding: 6px 8px; font-size: 10px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Data</th>
                        <th style="padding: 6px 8px; font-size: 10px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Status</th>
                        <th style="padding: 6px 8px; font-size: 10px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Obs.</th>
                    </tr>
                </thead>
                <tbody>${linhasAtend}</tbody>
            </table>` : '<p style="padding: 12px 18px; color: #94a3b8; font-size: 12px;">Nenhum atendimento registrado para este filtro.</p>'}
        </div>`;
    });

    const htmlPrint = `<!DOCTYPE html>
    <html><head>
    <meta charset="UTF-8">
    <title>Relatório de Lideranças e Parceiros — Connecta</title>
    <style>
        @page { size: A4 portrait; margin: 12mm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; background: #fff; }
        .header { padding-bottom: 14px; border-bottom: 3px solid #10b981; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
        .header .brand { font-size: 22px; font-weight: 800; color: #0f172a; }
        .header .sub { font-size: 12px; font-weight: 600; color: #10b981; text-transform: uppercase; letter-spacing: 1px; margin: 2px 0; }
        .header .meta { font-size: 11px; color: #64748b; }
        .summary-bar { display: flex; gap: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px; margin-bottom: 20px; }
        .summary-bar .item { text-align: center; }
        .summary-bar .item .val { font-size: 20px; font-weight: 800; color: #0f172a; }
        .summary-bar .item .lbl { font-size: 9px; color: #64748b; text-transform: uppercase; }
    </style>
    </head>
    <body>
    <div class="header">
        <div>
            <div class="brand">CONNECTA</div>
            <div class="sub">Relatório de Lideranças e Parceiros</div>
            <div class="meta">Filtro: <strong>${filtroTexto}</strong> &nbsp;·&nbsp; Total de lideranças: <strong>${listaFiltrada.length}</strong> &nbsp;·&nbsp; Emissão: ${new Date().toLocaleString('pt-BR')}</div>
        </div>
        <div class="summary-bar">
            <div class="item"><div class="val">${listaFiltrada.reduce((a,s) => a + s.total_pacientes, 0)}</div><div class="lbl">Pessoas</div></div>
            <div class="item"><div class="val">${listaFiltrada.reduce((a,s) => a + s.total, 0)}</div><div class="lbl">Demandas</div></div>
            <div class="item"><div class="val" style="color:#10b981">${listaFiltrada.reduce((a,s) => a + s.concluido, 0)}</div><div class="lbl">Atendidos</div></div>
            <div class="item"><div class="val" style="color:#f97316">${listaFiltrada.reduce((a,s) => a + s.pendente, 0)}</div><div class="lbl">Pendentes</div></div>
        </div>
    </div>
    ${htmlLideres}
    </body></html>`;

    const mywindow = window.open('', 'PRINT_LIDERANCA', 'height=900,width=1200');
    mywindow.document.write(htmlPrint);
    mywindow.document.close();
    mywindow.focus();
    setTimeout(() => { mywindow.print(); }, 800);
};
window.imprimirRelatorioParceiros = function() {
    const lista = window.dadosRelatorioCache ? window.dadosRelatorioCache['parceiro'] : null;
    if (!lista || lista.length === 0) {
        if(typeof showModalAlert === 'function') showModalAlert('Carregue os dados de parceiros primeiro antes de imprimir.');
        return;
    }

    const fStatus = document.getElementById('parc-filter-status') ? document.getElementById('parc-filter-status').value : '';
    const fMes = document.getElementById('parc-filter-mes') ? document.getElementById('parc-filter-mes').value : '';
    const fAno = document.getElementById('parc-filter-ano') ? document.getElementById('parc-filter-ano').value : '';
    const fLideranca = document.getElementById('parc-filter-lideranca') ? document.getElementById('parc-filter-lideranca').value : '';
    const mesesNome = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    
    let filtrosArr = [];
    if(fStatus) filtrosArr.push(fStatus);
    if(fMes) filtrosArr.push(mesesNome[parseInt(fMes)]);
    if(fAno) filtrosArr.push(fAno);
    if(fLideranca) filtrosArr.push('Lid: ' + fLideranca);
    
    const filtroTexto = filtrosArr.length > 0 ? filtrosArr.join(' / ') : 'Todos os registros';

    const listaFiltrada = lista.filter(s => s.total_pacientes > 0 || s.total > 0);

    let htmlParceiros = '';
    listaFiltrada.forEach(stat => {
        const perc = Math.round((stat.concluido / (stat.total || 1)) * 100) || 0;
        const corPerc = perc > 70 ? '#10b981' : perc > 40 ? '#3b82f6' : '#f97316';

        const atendimentosMostrar = (stat.lista || []).slice(0, 20);

        let linhasAtend = '';
        atendimentosMostrar.forEach(at => {
            const data = at.data_abertura ? at.data_abertura.split('-').reverse().join('/') : '-';
            const statusCor = at.status === 'CONCLUIDO' ? '#059669' : '#f97316';
            linhasAtend += `
                <tr style="page-break-inside: avoid; break-inside: avoid;">
                    <td style="padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9;">${at.nome_paciente || at.nome || '-'}</td>
                    <td style="padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9;">${at.cpf_paciente || at.cpf || '-'}</td>
                    <td style="padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9;">${at.tipo_servico || at.especialidade || at.procedimento || '-'}</td>
                    <td style="padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9;">${data}</td>
                    <td style="padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9; color: ${statusCor}; font-weight: bold;">${at.status || '-'}</td>
                    <td style="padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9;">${at.obs_atendimento || '-'}</td>
                </tr>`;
        });

        const primeiroPac = stat.listaPacientes && stat.listaPacientes[0];
        const telefone = primeiroPac ? (primeiroPac.tel1 || primeiroPac.tel2 || '') : '';
        const municipio = primeiroPac ? (primeiroPac.municipio || '') : '';

        htmlParceiros += `
        <div class="lider-card" style="margin-bottom: 28px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 16px; font-weight: 800; color: #f8fafc; letter-spacing: -0.3px;">
                        ${stat.nome}
                    </div>
                    ${municipio ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 3px;">📍 ${municipio} ${telefone ? '&nbsp;·&nbsp; 📞 ' + telefone : ''}</div>` : ''}
                </div>
                <div style="display: flex; gap: 20px; text-align: center;">
                    <div><div style="font-size: 22px; font-weight: 800; color: #a5f3fc;">${stat.total}</div><div style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">Envios</div></div>
                    <div><div style="font-size: 22px; font-weight: 800; color: #6ee7b7;">${stat.concluido}</div><div style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">Concluídos</div></div>
                    <div><div style="font-size: 22px; font-weight: 800; color: #fbbf24;">${stat.pendente}</div><div style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">Pendentes</div></div>
                    <div><div style="font-size: 22px; font-weight: 800; color: #ef4444;">${stat.cancelado}</div><div style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">Cancelados</div></div>
                </div>
            </div>
            ${atendimentosMostrar.length > 0 ? `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8fafc;">
                        <th style="padding: 6px 8px; font-size: 10px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Nome</th>
                        <th style="padding: 6px 8px; font-size: 10px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">CPF</th>
                        <th style="padding: 6px 8px; font-size: 10px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Serviço</th>
                        <th style="padding: 6px 8px; font-size: 10px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Data</th>
                        <th style="padding: 6px 8px; font-size: 10px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Status</th>
                        <th style="padding: 6px 8px; font-size: 10px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Obs.</th>
                    </tr>
                </thead>
                <tbody>${linhasAtend}</tbody>
            </table>` : '<p style="padding: 12px 18px; color: #94a3b8; font-size: 12px;">Nenhum atendimento registrado para este filtro.</p>'}
        </div>`;
    });

    const htmlPrint = `<!DOCTYPE html>
    <html><head>
    <meta charset="UTF-8">
    <title>Relatório de Parceiros — Connecta</title>
    <style>
        @page { size: A4 portrait; margin: 12mm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; background: #fff; }
        .header { padding-bottom: 14px; border-bottom: 3px solid #10b981; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
        .header .brand { font-size: 22px; font-weight: 800; color: #0f172a; }
        .header .sub { font-size: 12px; font-weight: 600; color: #10b981; text-transform: uppercase; letter-spacing: 1px; margin: 2px 0; }
        .header .meta { font-size: 11px; color: #64748b; }
        .summary-bar { display: flex; gap: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px; margin-bottom: 20px; }
        .summary-bar .item { text-align: center; }
        .summary-bar .item .val { font-size: 20px; font-weight: 800; color: #0f172a; }
        .summary-bar .item .lbl { font-size: 9px; color: #64748b; text-transform: uppercase; }
    </style>
    </head>
    <body>
    <div class="header">
        <div>
            <div class="brand">CONNECTA</div>
            <div class="sub">Relatório de Parceiros</div>
            <div class="meta">Filtro: <strong>${filtroTexto}</strong> &nbsp;·&nbsp; Total de parceiros: <strong>${listaFiltrada.length}</strong> &nbsp;·&nbsp; Emissão: ${new Date().toLocaleString('pt-BR')}</div>
        </div>
        <div class="summary-bar">
            <div class="item"><div class="val">${listaFiltrada.reduce((a,s) => a + s.total, 0)}</div><div class="lbl">Total de Envios</div></div>
            <div class="item"><div class="val" style="color:#10b981">${listaFiltrada.reduce((a,s) => a + s.concluido, 0)}</div><div class="lbl">Concluídos</div></div>
            <div class="item"><div class="val" style="color:#f97316">${listaFiltrada.reduce((a,s) => a + s.pendente, 0)}</div><div class="lbl">Pendentes</div></div>
            <div class="item"><div class="val" style="color:#ef4444">${listaFiltrada.reduce((a,s) => a + s.cancelado, 0)}</div><div class="lbl">Cancelados</div></div>
        </div>
    </div>
    ${htmlParceiros}
    </body></html>`;

    const mywindow = window.open('', 'PRINT_PARCEIRO', 'height=900,width=1200');
    mywindow.document.write(htmlPrint);
    mywindow.document.close();
    mywindow.focus();
    setTimeout(() => { mywindow.print(); }, 800);
};

async function initRelatorios() {
    if(!dashboardRawData) {
        await loadDashboard();
    }
    
    const selAno = document.getElementById('rel-filter-ano');
    if(selAno && selAno.options.length <= 1 && dashboardRawData) {
        const anos = new Set();
        dashboardRawData.atendimentos.forEach(at => {
            if(at.data_abertura) anos.add(at.data_abertura.split('-')[0]);
        });
        Array.from(anos).sort().reverse().forEach(a => selAno.innerHTML += `<option value="${a}">${a}</option>`);
    }

    const selEspPDF = document.getElementById('pdf-pendencias-filtro-esp');
    if(selEspPDF && dashboardRawData && dashboardRawData.atendimentos) {
        const espsExistentes = new Set(Array.from(selEspPDF.options).map(o => o.value.toUpperCase()));
        const novasEsps = new Set();
        dashboardRawData.atendimentos.forEach(at => {
            if(at.status === 'PENDENTE') {
                const e = (at.procedimento || at.especialidade || at.tipo || '').trim().toUpperCase();
                if(e && !espsExistentes.has(e)) novasEsps.add(e);
            }
        });
        Array.from(novasEsps).sort().forEach(e => selEspPDF.innerHTML += `<option value="${e}">${e}</option>`);
    }

    carregarRelatorioRisco();
    atualizarGraficosRelatorios();
}

function carregarRelatorioRisco() {
    const tbody = document.getElementById('tabela-risco-body');
    if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Calculando...</td></tr>';
    
    if(!dashboardRawData || !dashboardRawData.atendimentos || dashboardRawData.atendimentos.length === 0) {
        if(typeof loadDashboard === 'function') {
            loadDashboard().then(() => renderizarRelatorioRisco());
        } else {
            renderizarRelatorioRisco();
        }
    } else {
        renderizarRelatorioRisco();
    }
}

function renderizarRelatorioRisco() {
    const tbody = document.getElementById('tabela-risco-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    const hoje = new Date();
    const trintaDias = new Date();
    trintaDias.setDate(hoje.getDate() + 30);

    const baseAtendimentos = (dashboardRawData && dashboardRawData.atendimentos) ? dashboardRawData.atendimentos : [];

    const listaRisco = baseAtendimentos.filter(at => {
        if(!at.data_risco || at.status === 'CONCLUIDO' || at.status === 'CANCELADO') return false;
        const dRisco = new Date(at.data_risco);
        return dRisco <= trintaDias;
    }).sort((a,b) => new Date(a.data_risco) - new Date(b.data_risco));

    if(listaRisco.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">Nenhum atendimento em risco próximo.</td></tr>';
        return;
    }

    listaRisco.forEach(at => {
        const dRisco = new Date(at.data_risco);
        const diasRestantes = Math.ceil((dRisco - hoje) / (1000 * 60 * 60 * 24));
        
        let badgeClass = "bg-orange-100 text-orange-700";
        let textoPrazo = `${diasRestantes} dias`;
        
        if(diasRestantes < 0) {
            badgeClass = "bg-red-100 text-red-700 font-bold";
            textoPrazo = `VENCIDO (${Math.abs(diasRestantes)} dias)`;
        } else if(diasRestantes <= 7) {
            badgeClass = "bg-red-50 text-red-600 font-bold";
        }

        const tempId = 'risco_' + Math.random().toString(36).substr(2, 9);
        window[tempId] = at;

        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-red-50 transition-colors cursor-pointer";
        tr.innerHTML = `
            <td class="px-6 py-4 text-sm font-medium text-slate-800">
                ${at.data_risco.split('-').reverse().join('/')}
                <div class="text-xs ${badgeClass} inline-block px-2 py-0.5 rounded mt-1">${textoPrazo}</div>
            </td>
            <td class="px-6 py-4 text-slate-700 uppercase text-xs font-bold">${at.nome_paciente || at.nome || '-'}</td>
            <td class="px-6 py-4 text-slate-600 text-xs uppercase">${at.procedimento || at.tipo_servico || '-'}<br>${at.local || ''}</td>
            <td class="px-6 py-4 text-xs font-bold text-slate-500">${at.status}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="event.stopPropagation(); abrirEdicaoAtendimentoId('${at.id}')" class="btn-action bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition" title="Editar"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
            </td>
        `;
        tr.onclick = () => abrirDetalheAtendimento(window[tempId]);
        tbody.appendChild(tr);
    });
    if(typeof lucide !== 'undefined') lucide.createIcons();
    if(typeof aplicarPermissoes === 'function' && typeof currentUserRole !== 'undefined') aplicarPermissoes();
}

function atualizarGraficosRelatorios() {
    if(!dashboardRawData) return;

    const fStatus = document.getElementById('rel-filter-status').value;
    const fMes = document.getElementById('rel-filter-mes').value;
    const fAno = document.getElementById('rel-filter-ano').value;
    const hoje = new Date();

    const dadosFiltrados = dashboardRawData.atendimentos.filter(at => {
        const [y, m, d] = at.data_abertura ? at.data_abertura.split('-') : ['','',''];
        if(fStatus && at.status !== fStatus) return false;
        if(fMes && m !== fMes) return false;
        if(fAno && y !== fAno) return false;
        return true;
    });

    const calcularDias = (at) => {
        if(!at.data_abertura) return 0;
        const inicio = new Date(at.data_abertura);
        let fim = hoje; 
        if(at.data_marcacao) {
            fim = new Date(at.data_marcacao);
        } else if (at.status === 'CONCLUIDO') {
            return null; 
        }
        const diffTime = Math.abs(fim - inicio);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const processarMedia = (campo) => {
        const grupos = {};
        dadosFiltrados.forEach(at => {
            const chave = at[campo] ? at[campo].trim().toUpperCase() : 'N/I';
            const dias = calcularDias(at);
            if(dias !== null) {
                if(!grupos[chave]) grupos[chave] = { total: 0, qtd: 0, lista: [] };
                grupos[chave].total += dias;
                grupos[chave].qtd++;
                const atNormalizado = { ...at, id: at.id, cpf: at.cpf_paciente, nome: at.nome_paciente || 'Nome não carregado', diasEspera: dias };
                grupos[chave].lista.push(atNormalizado);
            }
        });
        return Object.entries(grupos)
            .map(([nome, dados]) => ({ 
                nome, mediaDias: Math.round(dados.total / dados.qtd), qtd: dados.qtd, lista: dados.lista.sort((a,b) => b.diasEspera - a.diasEspera) 
            }))
            .sort((a,b) => b.mediaDias - a.mediaDias) 
            .slice(0, 10); 
    };

    const dadosEspecialidade = processarMedia('especialidade');
    const dadosProcedimento = processarMedia('procedimento');

    window.dadosRelatorioCache['especialidade'] = dadosEspecialidade;
    window.dadosRelatorioCache['procedimento'] = dadosProcedimento;

    renderizarTabelaGrafica('listaRelEspecialidade', dadosEspecialidade, 'bg-rose-500', 'especialidade');
    renderizarTabelaGrafica('listaRelProcedimento', dadosProcedimento, 'bg-violet-500', 'procedimento');
}

function renderizarTabelaGrafica(containerId, dados, corBarra, tipo) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if(dados.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm italic text-center py-4">Sem dados para o período.</p>';
        return;
    }

    const maxDias = Math.max(...dados.map(d => d.mediaDias)) || 1;

    dados.forEach((d, index) => {
        const porcentagem = (d.mediaDias / maxDias) * 100;
        const meses = (d.mediaDias / 30).toFixed(1); 
        
        const html = `
            <div class="group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-lg transition" onclick="abrirListaRelatorio('${tipo}', ${index})">
                <div class="flex justify-between text-xs mb-1 text-slate-700">
                    <span class="font-bold truncate pr-2 w-1/2 flex items-center gap-1 group-hover:text-blue-600 transition">
                        ${d.nome} <i data-lucide="chevron-right" class="w-3 h-3 opacity-0 group-hover:opacity-100 transition"></i>
                    </span>
                    <span class="text-slate-500 font-mono bg-white px-1 rounded border border-slate-100">${d.qtd} atd.</span>
                </div>
                <div class="flex items-center gap-2 h-6" title="Média exata: ${d.mediaDias} dias">
                    <div class="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div class="h-full rounded-full ${corBarra} opacity-80 group-hover:opacity-100 transition-all" style="width: ${porcentagem}%"></div>
                    </div>
                    <span class="text-xs font-bold text-slate-600 w-16 text-right">${meses} meses</span>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================================================
// 6. FUNÇÕES DE EXCLUSÃO (API) E CADASTRO DE ATENDIMENTO
// ============================================================================

window.excluirPacienteAPI = async (id, cpf) => {
    const loading = document.getElementById('loading-paciente');
    setLoadingText('loading-paciente', "Excluindo...");
    if(loading) { loading.classList.remove('hidden'); loading.classList.add('flex'); }
    try {
        let finalId = id;
        
        if (!finalId && cpf) {
            const cpfLimp = String(cpf).replace(/\D/g, '');
            const q = window.query(window.collection(window.db, "pacientes"), window.where("cpf", "==", cpfLimp));
            const snap = await window.getDocs(q);
            if (!snap.empty) {
                finalId = snap.docs[0].id;
            } else {
                // Tenta achar com formatação
                const q2 = window.query(window.collection(window.db, "pacientes"), window.where("cpf", "==", cpf));
                const snap2 = await window.getDocs(q2);
                if (!snap2.empty) finalId = snap2.docs[0].id;
            }
        }
        
        if (!finalId) {
            throw new Error("ID não fornecido e não foi possível localizar por CPF.");
        }

        const pacRef = window.doc(window.db, "pacientes", finalId);
        const pacSnap = await window.getDoc(pacRef);
        let dadosPaciente = null;
        if(pacSnap.exists) dadosPaciente = pacSnap.data();

        await window.deleteDoc(pacRef);
        
        const qAtd1 = window.query(window.collection(window.db, "atendimentos"), window.where("paciente_id", "==", finalId));
        const qAtd2 = window.query(window.collection(window.db, "atendimentos"), window.where("cpf_paciente", "==", String(cpf || (dadosPaciente && dadosPaciente.cpf) || '')));
        
        const [atdSnap1, atdSnap2] = await Promise.all([
            window.getDocs(qAtd1), 
            window.getDocs(qAtd2)
        ]);

        const batch = window.writeBatch(window.db);
        const idsApagados = new Set();

        atdSnap1.forEach(doc => { 
            batch.delete(doc.ref); 
            idsApagados.add(doc.id); 
        });
        
        atdSnap2.forEach(doc => {
            if(!idsApagados.has(doc.id) && String(doc.data().cpf_paciente) && String(doc.data().cpf_paciente) !== 'undefined' && String(doc.data().cpf_paciente) !== '') {
                batch.delete(doc.ref);
                idsApagados.add(doc.id);
            }
        });

        await batch.commit();

        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        showMessage('Munícipe e atendimentos excluídos.', 'success');
        if(typeof window.logAuditoria === 'function') window.logAuditoria('EXCLUIR_MUNICIPE', 'MUNICIPES', 'CPF: ' + cpf);
        
        if(typeof resetFormPaciente === 'function') resetFormPaciente();
        if(typeof voltarInicio === 'function') voltarInicio();
    } catch(e) {
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        showModalAlert("Erro ao excluir: " + e);
    }
}

window.mesclarExcluirDuplicataAPI = async (idFraco, idPrincipal, cpf) => {
    try {
        let finalIdFraco = idFraco;
        let finalIdPrincipal = idPrincipal;
        
        // Se idFraco for inválido, busca por CPF
        if ((!finalIdFraco || finalIdFraco === 'undefined') && cpf) {
            const q = window.query(window.collection(window.db, "pacientes"), window.where("cpf", "==", String(cpf).replace(/\D/g, '')));
            const snap = await window.getDocs(q);
            if (!snap.empty) {
                // Pega todos que batem com o CPF
                const docs = snap.docs;
                // Encontra qual deles é o Principal e qual é o Fraco (se não sabíamos o ID)
                // Vamos assumir que se finalIdPrincipal for válido, o que não for ele, é o fraco.
                if (finalIdPrincipal && finalIdPrincipal !== 'undefined') {
                    const docFraco = docs.find(d => d.id !== finalIdPrincipal);
                    if (docFraco) finalIdFraco = docFraco.id;
                } else {
                    // Se nem o principal tivermos, estamos em um cenário muito corrompido, aborta.
                    throw new Error("Não foi possível identificar as duas pontas da duplicidade.");
                }
            } else {
                // Tenta buscar com formatação
                const q2 = window.query(window.collection(window.db, "pacientes"), window.where("cpf", "==", cpf));
                const snap2 = await window.getDocs(q2);
                if (!snap2.empty) {
                    const docFraco = snap2.docs.find(d => d.id !== finalIdPrincipal);
                    if (docFraco) finalIdFraco = docFraco.id;
                }
            }
        }
        
        if (!finalIdFraco || finalIdFraco === 'undefined') {
            throw new Error("Munícipe que será excluído não existe mais na base.");
        }

        const pacRefFraco = window.doc(window.db, "pacientes", finalIdFraco);
        const pacSnap = await window.getDoc(pacRefFraco);
        
        const qAtd = window.query(window.collection(window.db, "atendimentos"), window.where("paciente_id", "==", finalIdFraco));
        const atdSnap = await window.getDocs(qAtd);
        
        const batch = window.writeBatch(window.db);
        
        // Transfere todos os atendimentos para o Principal
        atdSnap.forEach(docAtd => {
            batch.update(docAtd.ref, {
                paciente_id: finalIdPrincipal
            });
        });
        
        // Exclui o fraco
        batch.delete(pacRefFraco);
        
        await batch.commit();
        return true;
    } catch(e) {
        console.error(e);
        throw e;
    }
}

async function excluirAtendimentoAPI(id) {
    const loading = document.getElementById('loading-atendimento');
    setLoadingText('loading-atendimento', "Excluindo...");
    if(loading) { loading.classList.remove('hidden'); loading.classList.add('flex'); }

    try {
        const atdRef = window.doc(window.db, "atendimentos", id);
        const atdSnap = await window.getDoc(atdRef);
        let dadosAtd = null;
        if(atdSnap.exists) dadosAtd = atdSnap.data();

        await window.deleteDoc(atdRef);

        if(typeof atualizarEstatisticas === 'function' && dadosAtd) {
            await atualizarEstatisticas('atendimentos', 'excluir', dadosAtd, null);
        }

        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        showMessage('Atendimento excluído.', 'success');
        if(typeof window.logAuditoria === 'function') window.logAuditoria('EXCLUIR_ATENDIMENTO', 'ATENDIMENTOS', 'ID: ' + id);
        
        if(typeof resetFormAtendimento === 'function') resetFormAtendimento();
        if(typeof voltarInicio === 'function') voltarInicio();
    } catch(e) {
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        showModalAlert("Erro ao excluir: " + e);
    }
}
// O restante do submitAtendimento está no ui.js, porém ui.js chamava sendData('registerServiceBatch' ou 'registerService')
// ou alterar ui.js. Para ser menos intrusivo, farei o `sendData` atuar como ponte
async function sendData(action, data, loadingId) {
    const loading = document.getElementById(loadingId);
    setLoadingText(loadingId, "Salvando...");
    if(loading) { loading.classList.remove('hidden'); loading.classList.add('flex'); }
    
    const normalize = (obj) => {
        for(let k in obj) {
            if(typeof obj[k] === 'string' && !['cpf','cpf_paciente','id'].includes(k) && !k.includes('data')) {
                obj[k] = obj[k].toUpperCase();
            }
        }
    };

    if (Array.isArray(data)) {
        data.forEach(normalize);
    } else {
        normalize(data);
    }

    try {
        if (action === 'registerService') {
            const { id, ...updateData } = data;
            let acao = 'criar';
            let dadosAnteriores = null;

            if (id) {
                acao = 'editar';
                const oldSnap = await window.getDoc(window.doc(window.db, "atendimentos", id));
                if(oldSnap.exists) { dadosAnteriores = oldSnap.data(); }
                await window.updateDoc(window.doc(window.db, "atendimentos", id), updateData);
                if(typeof window.logAuditoria === 'function') window.logAuditoria('EDIÇÃO', 'Atendimentos', `Edição do atendimento de: ${updateData.nome_paciente} (CPF: ${updateData.cpf_paciente})`);
            } else {
                const novoDoc = await window.addDoc(window.collection(window.db, "atendimentos"), updateData);
                data.id = novoDoc.id;
                if(typeof window.logAuditoria === 'function') window.logAuditoria('CRIAÇÃO', 'Atendimentos', `Criação de atendimento para: ${updateData.nome_paciente} (CPF: ${updateData.cpf_paciente})`);
            }

            if(typeof atualizarEstatisticas === 'function') {
                await atualizarEstatisticas('atendimentos', acao, dadosAnteriores, data);
            }

            await saveNewFilter('CATEGORIAS', data.tipo_servico);
            await saveNewFilter('PARCEIRO', data.parceiro);
            await saveNewFilter('LOCAL', data.local);
            await saveNewFilter('ESPECIALIDADE', data.especialidade);
            await saveNewFilter('ATENDIMENTO', data.tipo);
            await saveNewFilter('PROCEDIMENTO_EXAMES', data.procedimento);

            if (typeof todosAtendimentos !== 'undefined' && Array.isArray(todosAtendimentos)) {
                if (acao === 'criar' || !id) {
                    todosAtendimentos.unshift(data);
                } else {
                    const idx = todosAtendimentos.findIndex(a => a.id === data.id);
                    if (idx > -1) todosAtendimentos[idx] = data;
                    else todosAtendimentos.unshift(data);
                }
            }

            window._atendimentosPrecisamRecarregar = true;
            if(typeof carregarListaAtendimentos === 'function') {
                carregarListaAtendimentos().catch(e => console.error("Reload error", e));
            }

            if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
            showMessage('Atendimento atualizado com sucesso!', 'success');
            return true;
        }
        else if (action === 'registerServiceBatch') {
            const batch = window.writeBatch(window.db);
            const atendimentosRef = window.collection(window.db, "atendimentos");
            
            data.forEach(item => {
                const docRef = window.doc(atendimentosRef);
                item.id = docRef.id;
                batch.set(docRef, item);
                
                saveNewFilter('CATEGORIAS', item.tipo_servico);
                saveNewFilter('PARCEIRO', item.parceiro);
                saveNewFilter('LOCAL', item.local);
                saveNewFilter('ESPECIALIDADE', item.especialidade);
                saveNewFilter('ATENDIMENTO', item.tipo);
                saveNewFilter('PROCEDIMENTO_EXAMES', item.procedimento);
            });

            await batch.commit();

            if(typeof atualizarEstatisticas === 'function') {
                for(let item of data) {
                    await atualizarEstatisticas('atendimentos', 'criar', null, item);
                }
            }

            if (typeof todosAtendimentos !== 'undefined' && Array.isArray(todosAtendimentos)) {
                data.forEach(item => {
                    todosAtendimentos.unshift(item);
                });
            }

            window._atendimentosPrecisamRecarregar = true;
            if(typeof carregarListaAtendimentos === 'function') {
                carregarListaAtendimentos().catch(e => console.error("Reload error", e));
            }

            if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
            showMessage(`${data.length} atendimentos salvos!`, 'success');
            return true;
        }
        else if (action === 'registerPatient') {
             return false;
        }
    } catch(e) {
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        showModalAlert("Erro: " + e);
        return false;
    }
}
window.sendData = sendData;
window.submitPaciente = submitPaciente;
window.excluirPacienteAPI = excluirPacienteAPI;
window.excluirAtendimentoAPI = excluirAtendimentoAPI;

// ============================================================================
// 7. PAINEL ADMIN E USUÁRIOS
// ============================================================================

async function carregarListaUsuarios() {
    const tbody = document.getElementById('tabela-usuarios-body');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-slate-500">Carregando usuários...</td></tr>';
    
    try {
        const querySnapshot = await window.getDocs(window.collection(window.db, 'usuarios'));
        tbody.innerHTML = '';
        
        if (querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-slate-500">Nenhum usuário encontrado.</td></tr>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const email = data.email || 'N/A';
            const perfil = data.perfil || 'padrao';
            
            // Aceita "admin" ou "ADMIN" para manter compatibilidade com registros antigos, 
            // mas ao salvar salvará como ADMIN.
            const isAdm = perfil.toUpperCase() === 'ADMIN';
            const badgeCor = isAdm ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700 border border-slate-200';
            const nomePerfil = isAdm ? 'Administrador' : 'Visitante';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-4 py-4 text-left">
                    <div class="flex items-center gap-3">
                        <div class="${isAdm ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} w-8 h-8 rounded-full flex items-center justify-center font-bold uppercase shadow-sm">
                            ${email.charAt(0)}
                        </div>
                        <span class="font-medium text-slate-800">${email}</span>
                    </div>
                </td>
                <td class="px-4 py-4 text-center">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${badgeCor} inline-block min-w-[100px] text-center">
                        ${nomePerfil}
                    </span>
                </td>
                <td class="px-4 py-4 text-right">
                    <label class="relative inline-flex items-center cursor-pointer group" title="Alterar acesso">
                        <input type="checkbox" class="sr-only peer" ${isAdm ? 'checked' : ''} onchange="alterarCargoUsuario('${doc.id}', this.checked ? 'ADMIN' : 'padrao')">
                        <div class="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600 group-hover:opacity-90"></div>
                    </label>
                </td>
            `;
            tbody.appendChild(tr);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) {
        console.error('Erro ao buscar usuários:', e);
        showModalAlert('Erro ao buscar usuários.');
    }
}

async function alterarCargoUsuario(uid, novoCargo) {
    try {
        await window.updateDoc(window.doc(window.db, 'usuarios', uid), {
            perfil: novoCargo
        });
        carregarListaUsuarios();
        showMessage('Cargo atualizado com sucesso!', 'success');
    } catch(e) {
        console.error('Erro ao alterar cargo:', e);
        showModalAlert('Erro ao alterar cargo do usuário.');
    }
}

window.carregarListaUsuarios = carregarListaUsuarios;
window.alterarCargoUsuario = alterarCargoUsuario;

// ==========================================
// AUDITORIA (LOGS)
// ==========================================
window.logAuditoria = async function(acao, modulo, detalhes) {
    if(!window.db) return;
    try {
        const user = window.auth ? window.auth.currentUser : null;
        const email = user ? user.email : 'desconhecido';
        await window.addDoc(window.collection(window.db, 'auditoria'), {
            acao: acao,
            modulo: modulo,
            detalhes: detalhes,
            usuario: email,
            data_hora: new Date().toISOString()
        });
    } catch(e) {
        console.error('Erro ao registrar auditoria:', e);
    }
};

window.extrairDadosParaListas = async function() {
    try {
        if(!window.db) return;
        if(typeof showMessage === 'function') showMessage('Extraindo dados antigos para listas genéricas. Aguarde...', 'info');
        
        const inDb = new Set();
        const snapConfig = await window.getDocs(window.collection(window.db, 'config_selects'));
        snapConfig.forEach(d => {
            const data = d.data();
            if(data.chave && data.valor) {
                inDb.add(`${data.chave}_${data.valor.toUpperCase().trim()}`);
            }
        });

        async function addIfNew(chave, valor) {
            if(!valor || typeof valor !== 'string') return;
            const normVal = valor.toUpperCase().trim();
            if(normVal === '' || normVal === 'SELECIONE...' || normVal === 'NÃO' || normVal === 'SIM') return;
            const uid = `${chave}_${normVal}`;
            if(!inDb.has(uid)) {
                await window.addDoc(window.collection(window.db, 'config_selects'), {
                    chave: chave,
                    valor: normVal,
                    criacao: new Date().toISOString()
                });
                inDb.add(uid);
            }
        }

        // 1. Lideranças (da coleção antiga)
        try {
            const snapLider = await window.getDocs(window.collection(window.db, 'liderancas'));
            for(let doc of snapLider.docs) {
                await addIfNew('LIDERANCA', doc.data().nome);
            }
        } catch(e) { console.log('Sem coleção liderancas'); }

        // 2. Pacientes (STATUS_TITULO)
        const snapPac = await window.getDocs(window.collection(window.db, 'pacientes'));
        for(let doc of snapPac.docs) {
            await addIfNew('STATUS_TITULO', doc.data().status_titulo);
            // also try to get lideranca from paciente
            if (doc.data().indicacao) await addIfNew('LIDERANCA', doc.data().indicacao);
        }

        // 3. Atendimentos (LOCAL e PARCEIRO)
        const snapAtend = await window.getDocs(window.collection(window.db, 'atendimentos'));
        for(let doc of snapAtend.docs) {
            await addIfNew('LOCAL', doc.data().local);
            await addIfNew('PARCEIRO', doc.data().parceiro);
            if (doc.data().indicacao) await addIfNew('LIDERANCA', doc.data().indicacao);
        }

        if(typeof showMessage === 'function') showMessage('Extração concluída com sucesso! Recarregando...', 'success');
        setTimeout(() => window.location.reload(), 2000);
    } catch(e) {
        console.error(e);
        if(typeof showModalAlert === 'function') showModalAlert('Erro ao extrair: ' + e.message);
    }
};



// ==========================================
// UPLOAD DE ARQUIVOS (FIREBASE STORAGE)
// ==========================================

async function uploadArquivoFirebase(file, prefixPath) {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
        throw new Error(`O arquivo ${file.name} tem mais de 5MB. Envie arquivos menores.`);
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const fullPath = `${prefixPath}/${timestamp}_${safeName}`;
    
    const storageRef = window.storage.ref();
    const fileRef = storageRef.child(fullPath);
    
    await fileRef.put(file);
    const downloadURL = await fileRef.getDownloadURL();
    
    return {
        name: file.name,
        url: downloadURL,
        path: fullPath,
        size: file.size
    };
}

async function uploadArquivosPaciente() {
    const input = document.getElementById('file_upload_documentos');
    if (!input.files || input.files.length === 0) return typeof showModalAlert === 'function' ? showModalAlert("Selecione pelo menos um arquivo antes de clicar em Enviar.") : alert("Selecione pelo menos um arquivo.");
    
    const progressEl = document.getElementById('upload_progress_paciente');
    if(progressEl) { progressEl.classList.remove('hidden'); progressEl.classList.add('flex'); }
    
    const hiddenInput = document.getElementById('field_arquivos_json');
    let atuais = [];
    try { atuais = JSON.parse(hiddenInput.value || '[]'); } catch(e) {}
    
    try {
        for (let i = 0; i < input.files.length; i++) {
            const file = input.files[i];
            const result = await uploadArquivoFirebase(file, 'pacientes_docs');
            atuais.push(result);
        }
        hiddenInput.value = JSON.stringify(atuais);
        renderizarListaArquivos(atuais, 'lista_arquivos_paciente', 'field_arquivos_json');
        input.value = ""; // limpa o input
    } catch(e) {
        typeof showModalAlert === 'function' ? showModalAlert(e.message) : alert(e.message);
    } finally {
        if(progressEl) { progressEl.classList.add('hidden'); progressEl.classList.remove('flex'); }
    }
}

async function uploadArquivosAtendimento() {
    const input = document.getElementById('file_upload_atendimento');
    if (!input.files || input.files.length === 0) return typeof showModalAlert === 'function' ? showModalAlert("Selecione pelo menos um arquivo antes de clicar em Enviar.") : alert("Selecione pelo menos um arquivo.");
    
    const progressEl = document.getElementById('upload_progress_atendimento');
    if(progressEl) { progressEl.classList.remove('hidden'); progressEl.classList.add('flex'); }
    
    const hiddenInput = document.getElementById('field_arquivos_json_atendimento');
    let atuais = [];
    try { atuais = JSON.parse(hiddenInput.value || '[]'); } catch(e) {}
    
    try {
        for (let i = 0; i < input.files.length; i++) {
            const file = input.files[i];
            const result = await uploadArquivoFirebase(file, 'atendimentos_docs');
            atuais.push(result);
        }
        hiddenInput.value = JSON.stringify(atuais);
        renderizarListaArquivos(atuais, 'lista_arquivos_atendimento', 'field_arquivos_json_atendimento');
        input.value = ""; // limpa o input
    } catch(e) {
        typeof showModalAlert === 'function' ? showModalAlert(e.message) : alert(e.message);
    } finally {
        if(progressEl) { progressEl.classList.add('hidden'); progressEl.classList.remove('flex'); }
    }
}

function renderizarListaArquivos(arquivos, containerId, hiddenInputId) {
    const container = document.getElementById(containerId);
    if(!container) return;
    
    container.innerHTML = '';
    arquivos.forEach((arq, index) => {
        const chip = document.createElement('div');
        chip.className = "flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-xs font-medium dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800 shadow-sm";
        
        const link = document.createElement('a');
        link.href = arq.url;
        link.target = "_blank";
        link.className = "hover:underline flex items-center gap-1 max-w-[200px] truncate";
        link.innerHTML = `<i data-lucide="file" class="w-3 h-3 flex-shrink-0"></i> <span class="truncate" title="${arq.name}">${arq.name}</span>`;
        
        const btnRemover = document.createElement('button');
        btnRemover.type = "button";
        btnRemover.className = "text-red-500 hover:text-red-700 hover:bg-red-100 p-0.5 rounded transition ml-1 flex-shrink-0";
        btnRemover.innerHTML = `<i data-lucide="x" class="w-3 h-3"></i>`;
        btnRemover.onclick = () => { removerArquivo(index, hiddenInputId, containerId); };
        
        chip.appendChild(link);
        chip.appendChild(btnRemover);
        container.appendChild(chip);
    });
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function removerArquivo(index, hiddenInputId, containerId) {
    if(!confirm("Remover este anexo da lista? (Ele será salvo assim no banco ao submeter o formulário)")) return;
    
    const hiddenInput = document.getElementById(hiddenInputId);
    let atuais = [];
    try { atuais = JSON.parse(hiddenInput.value || '[]'); } catch(e) {}
    
    atuais.splice(index, 1);
    hiddenInput.value = JSON.stringify(atuais);
    
    renderizarListaArquivos(atuais, containerId, hiddenInputId);
}

// Filtro de busca no histórico de atendimentos
function filtrarHistoricoTimeline(termo) {
    const container = document.getElementById('hist-timeline-items');
    if (!container) return;
    
    if (!termo || !termo.trim()) {
        container.innerHTML = window._historicoItemsHtml || '';
        if(typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }
    
    const t = termo.toLowerCase();
    const filtrados = (window.historicoAtualCache || []).filter(at => {
        return [at.tipo_servico, at.especialidade, at.procedimento, at.local, at.status, at.obs_atendimento, at.parceiro, at.tipo, at.data_abertura, at.data_marcacao]
            .some(v => v && String(v).toLowerCase().includes(t));
    });
    
    if (filtrados.length === 0) {
        container.innerHTML = '<p class="text-slate-400 italic text-sm pl-2 pt-2">Nenhum resultado para "' + termo + '".</p>';
        return;
    }
    
    const all = window.historicoAtualCache || [];
    const marker = 'class="relative pl-4 pb-6 cursor-pointer';
    const allDivs = (window._historicoItemsHtml || '').split(marker).filter(Boolean);
    const html = filtrados.map(f => {
        const i = all.indexOf(f);
        return i >= 0 && allDivs[i] ? '<div ' + marker + allDivs[i] : '';
    }).join('');
    container.innerHTML = html;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================================================
// CADASTROS POR DATA
// ============================================================================
async function buscarCadastrosPorData(atalho) {
    const container = document.getElementById('resultado_cadastros_data');
    const inputData = document.getElementById('filtro_data_cadastro');
    
    let dataBusca = '';
    if (atalho === 'hoje') {
        dataBusca = new Date().toISOString().split('T')[0];
        if(inputData) inputData.value = dataBusca;
    } else if (atalho === 'ontem') {
        const d = new Date(); d.setDate(d.getDate() - 1);
        dataBusca = d.toISOString().split('T')[0];
        if(inputData) inputData.value = dataBusca;
    } else {
        dataBusca = inputData ? inputData.value : '';
    }
    
    if (!dataBusca) {
        container.innerHTML = '<p class="text-amber-600 font-medium">Selecione uma data para buscar.</p>';
        return;
    }
    
    container.innerHTML = '<p class="text-slate-400 italic text-sm animate-pulse">Buscando...</p>';
    
    try {
        // Use local cache if available
        let pacientes = typeof todosPacientes !== 'undefined' ? todosPacientes : [];
        
        if (pacientes.length === 0) {
            const snap = await window.getDocs(window.collection(window.db, 'pacientes'));
            pacientes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        
        // Filter by data_criacao matching selected date
        const encontrados = pacientes.filter(p => {
            if (!p.data_criacao) return false;
            return p.data_criacao.startsWith(dataBusca);
        });
        
        const dataFmt = dataBusca.split('-').reverse().join('/');
        
        if (encontrados.length === 0) {
            container.innerHTML = `<p class="text-slate-500 italic text-sm">Nenhum cadastro encontrado em <strong>${dataFmt}</strong>.</p>`;
            return;
        }
        window._cadastrosDataAtual = encontrados;
        
        let html = `
            <div class="flex items-center justify-between mb-3">
                <p class="text-slate-700 dark:text-slate-200 font-bold">${encontrados.length} cadastro(s) em <span class="text-blue-600">${dataFmt}</span></p>
                <button onclick="imprimirCadastrosPorData('${dataBusca}')" 
                    class="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 shadow-sm border border-slate-200 dark:border-slate-600">
                    <i data-lucide="printer" class="w-3 h-3 text-blue-600"></i> Imprimir
                </button>
            </div>
            <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th class="px-4 py-3 text-left">Nome</th>
                            <th class="px-4 py-3 text-left">CPF</th>
                            <th class="px-4 py-3 text-left">WhatsApp</th>
                            <th class="px-4 py-3 text-left">Bairro</th>
                            <th class="px-4 py-3 text-left">Tipo</th>
                            <th class="px-4 py-3 text-center">Ação</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">`;
        
        encontrados.sort((a,b) => (a.nome || '').localeCompare(b.nome || '')).forEach(p => {
            const cpfFmt = p.cpf ? String(p.cpf).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '-';
            const tipo = p.pre_cadastro ? '<span class="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Pré Cadastro</span>' : '<span class="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Completo</span>';
            const pStr = JSON.stringify(p).replace(/'/g, "\\'");
            html += `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <td class="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">${p.nome || '-'}</td>
                    <td class="px-4 py-3 text-slate-500">${cpfFmt}</td>
                    <td class="px-4 py-3 text-slate-500">${p.tel1 || p.whatsapp || '-'}</td>
                    <td class="px-4 py-3 text-slate-500">${p.bairro || '-'}</td>
                    <td class="px-4 py-3">${tipo}</td>
                    <td class="px-4 py-3 text-center">
                        <button onclick="verHistoricoCompleto(${pStr.replace(/"/g, '&quot;')})" 
                            class="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center mx-auto w-max gap-1.5 text-xs">
                            <i data-lucide="eye" class="w-3 h-3"></i> Ficha
                        </button>
                    </td>
                </tr>`;
        });
        
        html += '</tbody></table></div>';
        
        // Month summary
        const monthPrefix = dataBusca.substring(0, 7);
        const monthDaysSet = new Set();
        pacientes.forEach(p => {
            if (p.data_criacao && p.data_criacao.startsWith(monthPrefix) && !p.data_criacao.startsWith(dataBusca)) {
                monthDaysSet.add(p.data_criacao.substring(8, 10));
            }
        });
        const monthDays = Array.from(monthDaysSet).sort((a,b) => parseInt(a) - parseInt(b));
        if (monthDays.length > 0) {
            html += `<div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex flex-wrap gap-1 items-center">
                <i data-lucide="info" class="w-3 h-3 inline"></i> <span class="font-bold">Dica:</span> Também houveram cadastros nos dias: 
                ${monthDays.map(d => `<button onclick="document.getElementById('filtro_data_cadastro').value='${monthPrefix}-${d}'; buscarCadastrosPorData();" class="text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-1.5 py-0.5 rounded transition">${d}</button>`).join('')} 
                deste mês.
            </div>`;
        }
        
        container.innerHTML = html;
        if(typeof lucide !== 'undefined') lucide.createIcons();
        
    } catch(e) {
        console.error(e);
        container.innerHTML = '<p class="text-red-500 text-sm">Erro ao buscar cadastros. Tente novamente.</p>';
    }
}

function imprimirCadastrosPorData(data) {
    const lista = window._cadastrosDataAtual || [];
    const dataFmt = data.split('-').reverse().join('/');
    let rows = lista.map(p => {
        const cpfFmt = p.cpf ? String(p.cpf).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '-';
        return `<tr style="border-bottom:1px solid #eee">
            <td style="padding:6px 8px">${p.nome || '-'}</td>
            <td style="padding:6px 8px">${cpfFmt}</td>
            <td style="padding:6px 8px">${p.tel1 || p.whatsapp || '-'}</td>
            <td style="padding:6px 8px">${p.bairro || '-'}</td>
            <td style="padding:6px 8px">${p.pre_cadastro ? 'Pré Cadastro' : 'Completo'}</td>
        </tr>`;
    }).join('');
    
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Cadastros de ${dataFmt}</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; margin: 0; padding: 30px; color: #333; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .header h1 { font-size: 18px; margin: 0; color: #1e3a8a; text-transform: uppercase; }
            .header p { margin: 0; font-size: 12px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f8fafc; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; color: #475569; font-size: 11px; text-transform: uppercase; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            tr:nth-child(even) { background-color: #fcfcfc; }
            .badge { display: inline-block; padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
            .badge-completo { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
            .badge-pre { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
        </style>
        </head><body>
        <div class="header">
            <div>
                <h1>Cadastros Realizados em ${dataFmt}</h1>
                <p>Relatório gerado pelo sistema Connecta</p>
            </div>
            <div>
                <p><strong>Total:</strong> ${lista.length} registro(s)</p>
            </div>
        </div>
        <table>
            <thead><tr><th>Nome do Munícipe</th><th>CPF</th><th>WhatsApp</th><th>Bairro</th><th>Tipo Cadastro</th></tr></thead>
            <tbody>
                ${lista.map(p => {
                    const cpfFmt = p.cpf ? String(p.cpf).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '-';
                    const badgeClass = p.pre_cadastro ? 'badge badge-pre' : 'badge badge-completo';
                    const tipo = p.pre_cadastro ? 'Pré Cadastro' : 'Completo';
                    return `<tr>
                        <td style="font-weight: bold;">${p.nome || '-'}</td>
                        <td>${cpfFmt}</td>
                        <td>${p.tel1 || p.whatsapp || '-'}</td>
                        <td>${p.bairro || '-'}</td>
                        <td><span class="${badgeClass}">${tipo}</span></td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
        <script>window.print();<\/script></body></html>`);
    w.document.close();
}

// ============================================================================
// INICIA FLATPICKR COM DESTAQUE DE DIAS
// ============================================================================
setTimeout(() => {
    if (typeof flatpickr !== 'undefined') {
        const input = document.getElementById('filtro_data_cadastro');
        if (input) {
            input.type = 'text'; // Flatpickr works best on text inputs
            const fp = flatpickr(input, {
                locale: 'pt',
                dateFormat: 'Y-m-d',
                onDayCreate: function(dObj, dStr, fp, dayElem) {
                    const date = dayElem.dateObj;
                    if (!date) return;
                    const isoDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                    
                    let pacientes = typeof window.todosPacientes !== 'undefined' ? window.todosPacientes : [];
                    if (pacientes.length > 0) {
                        const hasCadastro = pacientes.some(p => p.data_criacao && p.data_criacao.startsWith(isoDate));
                        if (hasCadastro) {
                            dayElem.classList.add('has-cadastro');
                            dayElem.title = 'Há cadastros neste dia';
                        }
                    }
                }
            });
            
            // Pre-load patients to color calendar
            if (typeof window.todosPacientes === 'undefined' || window.todosPacientes.length === 0) {
                if (window.db && window.getDocs && window.collection) {
                    window.getDocs(window.collection(window.db, 'pacientes')).then(snap => {
                        window.todosPacientes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                        fp.redraw(); // Redraw calendar to show green dots
                    }).catch(e => console.error(e));
                }
            }
        }
    }
}, 2000);
