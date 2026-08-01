// Alertas e Pendências
// Responsável por buscar, classificar e exibir atendimentos pendentes há muito tempo.

async function renderizarAlertas() {
    const tbody = document.getElementById('tbody-alertas');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" class="text-center p-6 text-slate-400"><i data-lucide="loader" class="w-6 h-6 animate-spin mx-auto mb-2"></i>Buscando pendências...</td></tr>';
    if(typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const q = window.query(window.collection(window.db, "atendimentos"), window.where("status", "==", "PENDENTE"));
        const snapshot = await window.getDocs(q);

        let pendencias = [];
        const hoje = new Date();

        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            
            if (data.data_abertura) {
                const [ano, mes, dia] = data.data_abertura.split('-');
                const dataAbertura = new Date(ano, mes - 1, dia);
                const diffTime = Math.abs(hoje - dataAbertura);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                data.diasEspera = diffDays;
                
                if (diffDays >= 90) {
                    pendencias.push(data);
                }
            }
        });

        // Ordenar por mais antigos primeiro
        pendencias.sort((a, b) => b.diasEspera - a.diasEspera);

        // Atualizar KPIs
        const kpi90 = pendencias.filter(p => p.diasEspera >= 90 && p.diasEspera < 180).length;
        const kpi180 = pendencias.filter(p => p.diasEspera >= 180 && p.diasEspera < 365).length;
        const kpi365 = pendencias.filter(p => p.diasEspera >= 365).length;

        document.getElementById('kpi-90d').innerText = kpi90;
        document.getElementById('kpi-180d').innerText = kpi180;
        document.getElementById('kpi-365d').innerText = kpi365;

        // Atualiza Badge do Menu se existir
        const badge = document.getElementById('badge-alertas');
        if (badge) {
            if (pendencias.length > 0) badge.classList.remove('hidden');
            else badge.classList.add('hidden');
        }

        // Filtro selecionado
        const filtro = document.getElementById('filtro-alertas-idade').value;
        let listaFiltrada = pendencias;
        if (filtro === '90') listaFiltrada = pendencias.filter(p => p.diasEspera >= 90 && p.diasEspera < 180);
        else if (filtro === '180') listaFiltrada = pendencias.filter(p => p.diasEspera >= 180 && p.diasEspera < 365);
        else if (filtro === '365') listaFiltrada = pendencias.filter(p => p.diasEspera >= 365);

        if (listaFiltrada.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-6 text-slate-400">Nenhuma pendência crítica encontrada.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        listaFiltrada.forEach(at => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-b border-slate-100 dark:border-slate-800";
            
            let corIdade = 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
            let labelIdade = 'Atenção';
            if (at.diasEspera >= 365) { corIdade = 'text-red-600 bg-red-50 dark:bg-red-900/20'; labelIdade = 'Urgente'; }
            else if (at.diasEspera >= 180) { corIdade = 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'; labelIdade = 'Crítico'; }

            tr.innerHTML = `
                <td class="px-4 py-3 cursor-pointer" onclick='abrirDetalheAtendimentoCompleto(${JSON.stringify(at)})'>
                    <div class="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">${at.nome_paciente || at.nome || 'Sem Nome'}</div>
                    <div class="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><i data-lucide="calendar" class="w-3 h-3"></i> Aberto em ${at.data_abertura ? at.data_abertura.split('-').reverse().join('/') : '-'}</div>
                </td>
                <td class="px-4 py-3 hidden sm:table-cell cursor-pointer" onclick='abrirDetalheAtendimentoCompleto(${JSON.stringify(at)})'>
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${corIdade} border border-current border-opacity-20">
                        ${at.diasEspera} dias (${labelIdade})
                    </span>
                </td>
                <td class="px-4 py-3 hidden md:table-cell cursor-pointer text-[11px] text-slate-500 dark:text-slate-400" onclick='abrirDetalheAtendimentoCompleto(${JSON.stringify(at)})'>
                    ${at.tipo_servico || '-'} ${at.procedimento ? `<span class="block opacity-70">${at.procedimento}</span>` : ''}
                </td>
                <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                        <button id="btn-wpp-${at.id}" onclick='abrirModalContatoPendencia(${JSON.stringify(at)})' class="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 p-2 rounded-lg transition" title="Enviar WhatsApp">
                            <i data-lucide="message-circle" class="w-5 h-5"></i>
                        </button>
                        <div id="acoes-wpp-${at.id}" class="hidden flex items-center gap-1">
                            <button onclick='marcarStatusPendenciaInRow("${at.id}", "CONCLUIDO")' class="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition shadow-sm" title="Já Conseguiu (Concluir)">
                                <i data-lucide="check" class="w-4 h-4"></i>
                            </button>
                            <button onclick='marcarStatusPendenciaInRow("${at.id}", "AGUARDANDO")' class="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg transition shadow-sm" title="Ainda Aguardando">
                                <i data-lucide="clock" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        if(typeof lucide !== 'undefined') lucide.createIcons();

    } catch (e) {
        console.error("Erro ao carregar alertas:", e);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center p-6 text-red-500">Erro ao carregar pendências.</td></tr>';
    }
}

function abrirDetalheAtendimentoCompleto(at) {
    if (typeof abrirDetalheAtendimento === 'function') {
        abrirDetalheAtendimento(at);
    }
}

async function abrirModalContatoPendencia(at) {
    let pacienteId = at.paciente_id || at.id_paciente;
    let data = null;

    // Se não tiver ID direto, tenta achar o paciente na lista carregada em memória
    if (!pacienteId && typeof window.todosPacientes !== 'undefined') {
        let pEncontrado = null;
        if (at.cpf_paciente) {
            const cpfLimpo = String(at.cpf_paciente).replace(/\D/g, '');
            pEncontrado = window.todosPacientes.find(p => p.cpf && String(p.cpf).replace(/\D/g, '') === cpfLimpo);
        }
        if (!pEncontrado && at.nome_paciente) {
            pEncontrado = window.todosPacientes.find(p => p.nome === at.nome_paciente);
        }
        if (pEncontrado) {
            pacienteId = pEncontrado.id || pEncontrado._id || pEncontrado.uid;
            data = { ...pEncontrado };
            if (!pacienteId && pEncontrado.docId) pacienteId = pEncontrado.docId;
        }
    }

    if (!pacienteId && !data) {
        if(typeof showMessage === 'function') showMessage("Paciente não vinculado a este atendimento (sem CPF ou Nome exato).", "error");
        return;
    }
    
    try {
        if (!data) {
            const docSnap = await window.getDoc(window.doc(window.db, "pacientes", pacienteId));
            if (docSnap.exists()) {
                data = docSnap.data();
            } else {
                if(typeof showMessage === 'function') showMessage("Cadastro do paciente não encontrado no banco.", "error");
                return;
            }
        }

        let num = data.tel1 || data.whatsapp || data.telefone || data.tel || data.tel2 || '';
        num = num.replace(/\D/g, '');
        
        window.pendenciaSelecionada = at;
        window.pendenciaPacienteId = pacienteId;
        window.pendenciaTelefone = num;

        const nomeStr = data.nome || at.nome_paciente || 'Paciente';
        const primeiroNome = nomeStr.split(' ')[0];
        const procStr = at.procedimento || at.tipo_servico || 'procedimento/exame';

        document.getElementById('lbl-contato-nome').innerText = nomeStr;
        document.getElementById('lbl-contato-procedimento').innerText = procStr;
        
        const h = new Date().getHours();
        let saudacao = "Boa noite";
        if(h < 12) saudacao = "Bom dia";
        else if (h < 18) saudacao = "Boa tarde";

        const textoBase = `${saudacao} ${primeiroNome}!\n\nPassando para te atualizar sobre a sua solicitação de atendimento. Ainda não conseguimos agendar, mas estamos acompanhando de perto e assim que tiver novidade entramos em contato.\n\nVocê ainda está aguardando ou já conseguiu ser atendido em outro lugar?`;
        
        document.getElementById('txt-contato-pendencia').value = textoBase;
        
        if (num.length < 10) {
            document.getElementById('bloco-mensagem-pendencia').classList.add('hidden');
            document.getElementById('bloco-telefone-faltante').classList.remove('hidden');
            document.getElementById('inp-novo-telefone-pendencia').value = '';
        } else {
            document.getElementById('bloco-mensagem-pendencia').classList.remove('hidden');
            document.getElementById('bloco-telefone-faltante').classList.add('hidden');
        }
        
        const modal = document.getElementById('modal-contato-pendencia');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
            
    } catch (e) {
        console.error("Erro ao buscar contato do munícipe", e);
    }
}

function fecharModalContatoPendencia() {
    const modal = document.getElementById('modal-contato-pendencia');
    if(modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex'); // Remove flex para não interceptar cliques quando oculto
        }, 300);
    }
}

function enviarWppPendencia() {
    const msg = document.getElementById('txt-contato-pendencia').value;
    const num = window.pendenciaTelefone;
    if(num && msg) {
        const url = `https://wa.me/55${num}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
        
        if (window.pendenciaSelecionada && window.pendenciaSelecionada.id) {
            const rowActions = document.getElementById('acoes-wpp-' + window.pendenciaSelecionada.id);
            if (rowActions) {
                rowActions.classList.remove('hidden');
            }
            const btnWpp = document.getElementById('btn-wpp-' + window.pendenciaSelecionada.id);
            if (btnWpp) {
                btnWpp.classList.add('text-slate-400', 'bg-slate-50', 'dark:bg-slate-800');
                btnWpp.classList.remove('text-emerald-600', 'hover:bg-emerald-50');
            }
        }
        
        fecharModalContatoPendencia();
    }
}

async function marcarStatusPendenciaInRow(atId, statusRetorno) {
    if(!atId) return;
    
    try {
        const docRef = window.doc(window.db, "atendimentos", atId);
        const docSnap = await window.getDoc(docRef);
        if(!docSnap.exists()) return;
        
        const atData = docSnap.data();
        const agoraStr = new Date().toLocaleString('pt-BR');
        
        if (statusRetorno === 'CONCLUIDO') {
            await window.updateDoc(docRef, {
                status: 'CONCLUIDO',
                data_conclusao: new Date().toISOString().split('T')[0],
                obs_atendimento: (atData.obs_atendimento ? atData.obs_atendimento + '\n' : '') + `[${agoraStr}] - Marcado como Concluído via alerta. O paciente informou que já conseguiu o atendimento.`
            });
            if(typeof showMessage === 'function') showMessage("Atendimento marcado como concluído!", "success");
        } else {
            // Apenas atualiza a observação
            await window.updateDoc(docRef, {
                obs_atendimento: (atData.obs_atendimento ? atData.obs_atendimento + '\n' : '') + `[${agoraStr}] - Paciente contatado via WhatsApp pelo alerta e deseja continuar aguardando.`
            });
            if(typeof showMessage === 'function') showMessage("Observação adicionada ao atendimento.", "success");
        }
        
        // Esconde as ações da linha novamente
        const rowActions = document.getElementById('acoes-wpp-' + atId);
        if (rowActions) rowActions.classList.add('hidden');
        
        // Recarrega as pendências para atualizar a lista
        renderizarAlertas();
        
    } catch (e) {
        console.error("Erro ao atualizar status do atendimento", e);
        if(typeof showMessage === 'function') showMessage("Erro ao atualizar o atendimento.", "error");
    }
}

async function salvarNovoTelefonePendencia() {
    let inputTel = document.getElementById('inp-novo-telefone-pendencia').value;
    let num = inputTel.replace(/\D/g, '');
    
    if (num.length < 10) {
        if(typeof showMessage === 'function') showMessage("Digite um número de telefone válido com DDD.", "error");
        return;
    }
    
    const pacienteId = window.pendenciaPacienteId;
    if (!pacienteId) {
        if(typeof showMessage === 'function') showMessage("Não foi possível identificar o paciente. Tente fechar e abrir o contato novamente.", "error");
        return;
    }

    try {
        const btnSalvar = document.querySelector('#bloco-telefone-faltante button');
        const txtOriginal = btnSalvar.innerHTML;
        btnSalvar.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin mx-auto"></i>`;
        
        // Atualiza no banco do Firebase
        await window.updateDoc(window.doc(window.db, "pacientes", pacienteId), {
            tel1: inputTel
        });
        
        // Atualiza na memória se existir
        if (typeof window.todosPacientes !== 'undefined') {
            const p = window.todosPacientes.find(x => x.id === pacienteId);
            if(p) p.tel1 = inputTel;
        }

        window.pendenciaTelefone = num;
        btnSalvar.innerHTML = txtOriginal;
        
        // Troca os blocos
        document.getElementById('bloco-telefone-faltante').classList.add('hidden');
        document.getElementById('bloco-mensagem-pendencia').classList.remove('hidden');
        
        if(typeof showMessage === 'function') showMessage("Telefone salvo! Agora você pode enviar a mensagem.", "success");
        
        // Já envia o WhatsApp de uma vez, como o botão diz "Salvar e Enviar"
        enviarWppPendencia();
        
    } catch (e) {
        console.error("Erro ao salvar novo telefone:", e);
        if(typeof showMessage === 'function') showMessage("Erro ao salvar telefone.", "error");
    }
}
