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
                    <button onclick='abrirModalContatoPendencia(${JSON.stringify(at)})' class="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 p-2 rounded-lg transition" title="Enviar WhatsApp">
                        <i data-lucide="message-circle" class="w-5 h-5"></i>
                    </button>
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
            pacienteId = pEncontrado.id;
            data = pEncontrado;
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

        let num = data.telefone || data.whatsapp || '';
        if (!num) {
            if(typeof showMessage === 'function') showMessage("Paciente não possui telefone cadastrado.", "error");
            return;
        }
        num = num.replace(/\D/g, '');
        if (num.length < 10) {
            if(typeof showMessage === 'function') showMessage("Número de telefone inválido.", "error");
            return;
        }

            window.pendenciaSelecionada = at;
            window.pendenciaTelefone = num;
            
            const nomeStr = data.nome || at.nome_paciente || 'Paciente';
            // Pega o primeiro nome para a saudação
            const primeiroNome = nomeStr.split(' ')[0];
            const procStr = at.procedimento || at.tipo_servico || 'procedimento/exame';

            document.getElementById('lbl-contato-nome').innerText = nomeStr;
            document.getElementById('lbl-contato-procedimento').innerText = procStr;
            
            // Saudação baseada na hora
            const h = new Date().getHours();
            let saudacao = "Boa noite";
            if(h < 12) saudacao = "Bom dia";
            else if (h < 18) saudacao = "Boa tarde";

            const textoBase = `${saudacao} ${primeiroNome}!\n\nAinda não conseguimos o seu ${procStr}. Estamos acompanhando a solicitação e, assim que tivermos um retorno, entraremos em contato imediatamente. Agradecemos pela compreensão.\n\nGostaria de saber: você quer continuar aguardando ou já conseguiu o atendimento?`;
            
            document.getElementById('txt-contato-pendencia').value = textoBase;
            document.getElementById('bloco-status-pendencia').classList.add('hidden');
            
            document.getElementById('modal-contato-pendencia').classList.remove('hidden');
            setTimeout(() => document.getElementById('modal-contato-pendencia').classList.remove('opacity-0'), 10);
            
        } else {
            if(typeof showMessage === 'function') showMessage("Cadastro do paciente não encontrado.", "error");
        }
    } catch (e) {
        console.error("Erro ao buscar contato do munícipe", e);
    }
}

function fecharModalContatoPendencia() {
    const modal = document.getElementById('modal-contato-pendencia');
    if(modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

function enviarWppPendencia() {
    const msg = document.getElementById('txt-contato-pendencia').value;
    const num = window.pendenciaTelefone;
    if(num && msg) {
        const url = `https://wa.me/55${num}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
        
        // Exibe o bloco para perguntar o status
        document.getElementById('bloco-status-pendencia').classList.remove('hidden');
    }
}

async function marcarStatusPendencia(statusRetorno) {
    const at = window.pendenciaSelecionada;
    if(!at || !at.id) return;
    
    try {
        const docRef = window.doc(window.db, "atendimentos", at.id);
        const agoraStr = new Date().toLocaleString('pt-BR');
        
        if (statusRetorno === 'CONCLUIDO') {
            await window.updateDoc(docRef, {
                status: 'CONCLUIDO',
                data_conclusao: new Date().toISOString().split('T')[0],
                obs_atendimento: (at.obs_atendimento ? at.obs_atendimento + '\n' : '') + `[${agoraStr}] - Marcado como Concluído via contato. O paciente informou que já conseguiu o atendimento.`
            });
            if(typeof showMessage === 'function') showMessage("Atendimento marcado como concluído!", "success");
        } else {
            // Apenas atualiza a observação
            await window.updateDoc(docRef, {
                obs_atendimento: (at.obs_atendimento ? at.obs_atendimento + '\n' : '') + `[${agoraStr}] - Paciente contatado via WhatsApp e deseja continuar aguardando.`
            });
            if(typeof showMessage === 'function') showMessage("Observação adicionada ao atendimento.", "success");
        }
        
        fecharModalContatoPendencia();
        // Recarrega as pendências para atualizar a lista
        renderizarAlertas();
        
    } catch (e) {
        console.error("Erro ao atualizar status do atendimento", e);
        if(typeof showMessage === 'function') showMessage("Erro ao atualizar o atendimento.", "error");
    }
}
