// 7. RELATÓRIO ELEITORAL (NOVO)
// ============================================================================

function abrirRelatorioEleitoral(filtroInicial = '') {
    if (!dashboardRawData || !dashboardRawData.pacientes) {
        showModalAlert("Dados do dashboard ainda não carregados. Aguarde um momento.");
        return;
    }

    const basePacientes = window.pacientesDashboardFiltrados || dashboardRawData.pacientes;

    const modal = document.getElementById('modal-relatorio-eleitoral');
    modal.classList.remove('hidden');

    const statusSet = new Set();
    basePacientes.forEach(p => {
        const st = p.status_titulo ? p.status_titulo.trim().toUpperCase() : 'N/I';
        statusSet.add(st);
    });
    
    const sel = document.getElementById('filtro-modal-eleitoral');
    sel.innerHTML = '<option value="">Todos os Status</option>';
    Array.from(statusSet).sort().forEach(s => {
        sel.innerHTML += `<option value="${s}">${s}</option>`;
    });

    if (filtroInicial) {
        sel.value = filtroInicial;
    } else {
        sel.value = "";
    }

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

    const basePacientes = window.pacientesDashboardFiltrados || dashboardRawData.pacientes;

    const lista = basePacientes.filter(p => {
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
                <div class="flex items-center gap-1"><i data-lucide="phone" class="w-3 h-3"></i> ${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}</div>
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
        showModalAlert("Aguarde o carregamento dos dados.");
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
                <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Connecta | Total: ${lista.length} registros | Emissão: ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                    <tr style="background-color: #f1f5f9; text-align: left;">
                        <th style="padding: 8px 5px; border-bottom: 1px solid #ccc;">NOME / CPF</th>
                        <th style="padding: 8px 5px; border-bottom: 1px solid #ccc;">CONTATO</th>
                        <th style="padding: 8px 5px; border-bottom: 1px solid #ccc;">LOCALIZAÇÃƒÆ’O</th>
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
                    <td style="padding: 6px 5px;">${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}</td>
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
    setTimeout(() => { window.print(); }, 500);
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
                referencia: document.getElementById('field_referencia').value,
                apelido: document.getElementById('field_apelido').value,
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
        showModalAlert("Nenhum munícipe selecionado para impressão.");
        return;
    }

    // Estilos inline (mesmos da ficha em branco para consistência)
    const styleLabel = "display: block; font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 2px;";
    const styleValue = "border-bottom: 1px solid #333; min-height: 20px; width: 100%; margin-bottom: 10px; font-size: 12px; font-weight: bold; color: #000; padding-bottom: 2px;";
    const styleSection = "margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 15px;";
    const styleTitle = "margin-top: 0; font-size: 14px; font-weight: bold; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;";
    // Estilos da Tabela de Histórico
    const styleTable = "width: 100%; border-collapse: collapse; font-size: 10px;";
    const styleTh = "border-bottom: 1px solid #000; text-align: left; padding: 4px; font-weight: bold; text-transform: uppercase; font-size: 9px; background-color: #f1f5f9;";
    const styleTd = "border-bottom: 1px solid #eee; padding: 4px; font-size: 9px; page-break-inside: avoid; break-inside: avoid;";
    const styleTdRight = "border-bottom: 1px solid #eee; padding: 4px; text-align: right; font-size: 9px; page-break-inside: avoid; break-inside: avoid;";
    const styleTr = "page-break-inside: avoid; break-inside: avoid;";

    const safe = (val) => val || '-';
    const money = (val) => {
        if(!val) return 'R$ 0,00';
        return parseFloat(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Sincroniza o cache com atendimentos, currículos e serviços
    if (p && (p.cpf || p.id)) {
        const cpfP = String(p.cpf || '').replace(/\D/g, '');
        const nomeP = (p.nome || '').trim().toUpperCase();
        
        let arrAtendimentos = [];
        if (typeof todosAtendimentos !== 'undefined' && Array.isArray(todosAtendimentos)) {
            arrAtendimentos = todosAtendimentos.filter(a => {
                const aCpf = String(a.cpf_paciente || a.cpf || '').replace(/\D/g, '');
                return (cpfP && aCpf === cpfP) || (p.id && String(a.paciente_id || '') === String(p.id));
            }).map(item => ({ ...item, _tipoRegistro: 'atendimento' }));
        }

        let arrCurriculos = [];
        if (typeof todosCurriculos !== 'undefined' && Array.isArray(todosCurriculos)) {
            arrCurriculos = todosCurriculos.filter(c => {
                const cCpf = String(c.cpf || '').replace(/\D/g, '');
                const cNome = (c.nome || '').trim().toUpperCase();
                return (cpfP && cCpf === cpfP) || (nomeP && cNome === nomeP);
            }).map(item => ({ ...item, _tipoRegistro: 'curriculo' }));
        }

        let arrServicos = [];
        if (typeof todosServicos !== 'undefined' && Array.isArray(todosServicos)) {
            arrServicos = todosServicos.filter(s => {
                const sCpf = String(s.cpf || s.cpf_municipe || '').replace(/\D/g, '');
                const sNome = (s.nome_municipe || s.nome || '').trim().toUpperCase();
                return (cpfP && sCpf === cpfP) || (nomeP && sNome === nomeP);
            }).map(item => ({ ...item, _tipoRegistro: 'servico' }));
        }

        window.historicoAtualCache = [...arrAtendimentos, ...arrCurriculos, ...arrServicos];
        window.historicoAtualCache.sort((a,b) => {
            const dA = a.data_criacao || a.data_abertura || a.data_entrada || a.data_solicitacao || '2000-01-01';
            const dB = b.data_criacao || b.data_abertura || b.data_entrada || b.data_solicitacao || '2000-01-01';
            return new Date(dB) - new Date(dA);
        });
    }

    // Gera o HTML do Histórico se houver dados em cache
    let historyHtml = '';
    if (window.historicoAtualCache && window.historicoAtualCache.length > 0) {
        const atendimentos = window.historicoAtualCache.filter(h => !h._tipoRegistro || h._tipoRegistro === 'atendimento');
        const servicos = window.historicoAtualCache.filter(h => h._tipoRegistro === 'servico');
        const curriculos = window.historicoAtualCache.filter(h => h._tipoRegistro === 'curriculo');

        if (atendimentos.length > 0) {
            let totalGeral = 0;
            historyHtml += `
                <div style="${styleSection}">
                    <h2 style="${styleTitle}">HISTÓRICO DE ATENDIMENTOS</h2>
                    <table style="${styleTable}">
                        <thead>
                            <tr>
                                 <th style="${styleTh} width: 60px;">Abertura</th>
                                 <th style="${styleTh} width: 75px;">Agendamento</th>
                                 <th style="${styleTh} width: 70px;">Status</th>
                                 <th style="${styleTh}">Classificação</th>
                                 <th style="${styleTh}">Procedimento / Especialidade</th>
                                 <th style="${styleTh}">Local / Prontuário</th>
                                 <th style="${styleTh} text-align: right; width: 70px;">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            atendimentos.forEach(h => {
                const dataAberturaFmt = h.data_abertura ? h.data_abertura.split('-').reverse().join('/') : '-';
                const catTipo = `${h.tipo_servico || ''}<br><span style="color:#666; font-size:8px">${h.tipo || ''}</span>`;
                const espProc = `<b>${h.especialidade || ''}</b><br>${h.procedimento || ''}`;
                const localPront = `<b>${h.local || '-'}</b>${h.prontuario ? `<br>Pront: ${h.prontuario}` : ''}`;
                let agendamentoFmt = '-';
                let diasEspera = '';
                if (h.data_marcacao) {
                    agendamentoFmt = h.data_marcacao.split('-').reverse().join('/');
                    if (h.data_abertura) {
                        const diff = Math.ceil((new Date(h.data_marcacao) - new Date(h.data_abertura)) / (1000 * 60 * 60 * 24));
                        if (diff >= 0) diasEspera = `<br><span style="color:#888; font-size:8px">(${diff} dias de espera)</span>`;
                    }
                }
                const valorFloat = parseFloat(h.valor) || 0;
                totalGeral += valorFloat;
                const obsText = h.obs_atendimento || '';

                historyHtml += `
                    <tr style="${styleTr}">
                        <td style="${styleTd}">${dataAberturaFmt}</td>
                        <td style="${styleTd}">${agendamentoFmt}${diasEspera}</td>
                        <td style="${styleTd}"><b>${h.status || '-'}</b></td>
                        <td style="${styleTd}">${catTipo}</td>
                        <td style="${styleTd}">${espProc}</td>
                        <td style="${styleTd}">${localPront}</td>
                        <td style="${styleTdRight}">${money(valorFloat)}</td>
                    </tr>
                    ${obsText ? `<tr style="${styleTr}"><td colspan="7" style="border-bottom: 1px solid #eee; padding: 2px 4px 4px 4px; color: #555; font-style: italic; font-size: 9px; background-color: #fcfcfc; page-break-inside: avoid; break-inside: avoid;">Obs: ${obsText}</td></tr>` : ''}
                `;
            });

            historyHtml += `
                    <tr style="background-color: #f8fafc; font-weight: bold;">
                        <td colspan="6" style="padding: 8px; text-align: right; border-top: 2px solid #333;">TOTAL GERAL:</td>
                        <td style="padding: 8px; text-align: right; border-top: 2px solid #333; color: #2563eb;">${money(totalGeral)}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
            `;
        }

        if (servicos.length > 0) {
            historyHtml += `
                <div style="${styleSection}">
                    <h2 style="${styleTitle}">SERVIÇOS PÚBLICOS</h2>
                    <table style="${styleTable}">
                        <thead>
                            <tr>
                                 <th style="${styleTh} width: 60px;">Data Solic.</th>
                                 <th style="${styleTh} width: 70px;">Status</th>
                                 <th style="${styleTh}">Serviço / Tipo</th>
                                 <th style="${styleTh}">Órgão</th>
                                 <th style="${styleTh}">Protocolo</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            servicos.forEach(h => {
                const dataRaw = (h.data_solicitacao || h.data_criacao || '').split('T')[0];
                const dataFmt = dataRaw ? dataRaw.split('-').reverse().join('/') : '-';
                const obsText = h.observacoes || h.obs || '';

                historyHtml += `
                    <tr style="${styleTr}">
                        <td style="${styleTd}">${dataFmt}</td>
                        <td style="${styleTd}"><b>${h.status || '-'}</b></td>
                        <td style="${styleTd}"><b>${h.tipo_servico || h.servico || '-'}</b></td>
                        <td style="${styleTd}">${h.orgao || '-'}</td>
                        <td style="${styleTd}">${h.protocolo || '-'}</td>
                    </tr>
                    ${obsText ? `<tr style="${styleTr}"><td colspan="5" style="border-bottom: 1px solid #eee; padding: 2px 4px 4px 4px; color: #555; font-style: italic; font-size: 9px; background-color: #fcfcfc; page-break-inside: avoid; break-inside: avoid;">Obs: ${obsText}</td></tr>` : ''}
                `;
            });
            historyHtml += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (curriculos.length > 0) {
            historyHtml += `
                <div style="${styleSection}">
                    <h2 style="${styleTitle}">BANCO DE CURRÍCULOS</h2>
                    <table style="${styleTable}">
                        <thead>
                            <tr>
                                 <th style="${styleTh} width: 60px;">Data Entrada</th>
                                 <th style="${styleTh} width: 70px;">Status</th>
                                 <th style="${styleTh}">Cargo Proposto</th>
                                 <th style="${styleTh}">CNH</th>
                                 <th style="${styleTh}">Indicação</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            curriculos.forEach(h => {
                const dataRaw = (h.data_entrada || h.data_criacao || '').split('T')[0];
                const dataFmt = dataRaw ? dataRaw.split('-').reverse().join('/') : '-';
                const obsText = h.observacoes || '';

                historyHtml += `
                    <tr style="${styleTr}">
                        <td style="${styleTd}">${dataFmt}</td>
                        <td style="${styleTd}"><b>${h.status || '-'}</b></td>
                        <td style="${styleTd}"><b>${h.cargo_proposto || '-'}</b></td>
                        <td style="${styleTd}">${h.cnh || '-'}</td>
                        <td style="${styleTd}">${h.indicacao || '-'}</td>
                    </tr>
                    ${obsText ? `<tr style="${styleTr}"><td colspan="5" style="border-bottom: 1px solid #eee; padding: 2px 4px 4px 4px; color: #555; font-style: italic; font-size: 9px; background-color: #fcfcfc; page-break-inside: avoid; break-inside: avoid;">Obs: ${obsText}</td></tr>` : ''}
                `;
            });
            historyHtml += `
                        </tbody>
                    </table>
                </div>
            `;
        }
    }

    const html = `
        <style>
            @media print {
                @page { margin: 15mm 12mm; size: A4 portrait; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                thead { display: table-header-group; }
                tfoot { display: table-footer-group; }
                tr { page-break-inside: avoid; break-inside: avoid; }
                td, th { page-break-inside: avoid; break-inside: avoid; }
                .print-no-break { page-break-inside: avoid; break-inside: avoid; }
                .print-dados { page-break-inside: avoid; break-inside: avoid; }
                h1, h2 { page-break-after: avoid; break-after: avoid; }
                table { page-break-inside: auto; }
            }
        </style>
        <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; color: #333; max-width: 100%;">
            
            <div class="print-no-break" style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase;">Ficha Cadastral</h1>
                <p style="margin: 2px 0 0; color: #555; font-size: 12px;">Família Tudo a Ver</p>
            </div>

            <div style="${styleSection}">
                <h2 style="${styleTitle}">DADOS DO MUNíCIPE</h2>
                
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
                        <div style="${styleValue}">${p.nascimento ? p.nascimento.split('-').reverse().join('/') + ' (' + (window.calcularIdade ? window.calcularIdade(p.nascimento) : '') + ')' : '-'}</div>
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
                        <span style="${styleLabel}">Ponto de Referência</span>
                        <div style="${styleValue}">${safe(p.referencia)}</div>
                    </div>
                </div>
                
                 <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Referência (Apelido)</span>
                        <div style="${styleValue}">${safe(p.apelido)}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Situação Eleitoral</span>
                        <div style="${styleValue}">${safe(p.status_titulo)}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Zona / Seção</span>
                        <div style="${styleValue}">${safe(p.zona)} / ${safe(p.secao)}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Liderança (É Líder?)</span>
                        <div style="${styleValue}">${safe(p.lideranca)}</div>
                    </div>
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Quem Indicou (Indicação)</span>
                        <div style="${styleValue}">${safe(p.indicacao)}</div>
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
    setTimeout(() => { window.print(); }, 500);
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
                <p style="margin: 2px 0 0; color: #555; font-size: 12px;">Connecta</p>
            </div>

            <!-- DADOS PESSOAIS -->
            <div style="${styleSection}">
                <h2 style="${styleTitle}">1. DADOS DO MUNíCIPE</h2>
                
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
    setTimeout(() => { window.print(); }, 500);
}

function abrirDetalheSituacaoEleitoral(label) {
    abrirRelatorioEleitoral(label);
}

async function verHistoricoCompleto(p) {
    if(typeof switchTab === 'function') switchTab('historico-paciente');
    
    document.getElementById('hist-nome').innerText = p.nome;
    document.getElementById('hist-cpf').innerText = p.cpf ? `CPF: ${p.cpf}` : 'SEM CPF REGISTRADO';
    document.getElementById('hist-tel').innerText = `Tel: ${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}`;
    
    const btnPrint = document.getElementById('btn-imprimir-historico');
    if(btnPrint) {
        btnPrint.disabled = false;
        btnPrint.classList.remove('opacity-50', 'cursor-not-allowed');
        btnPrint.innerHTML = '<i data-lucide="printer" class="w-4 h-4 mr-2"></i> Completo';
    }

    const divDetalhes = document.getElementById('hist-detalhes');
    const timeline = document.getElementById('hist-timeline');
    timeline.innerHTML = '<p class="text-slate-400 text-sm italic pl-4">Buscando histórico completo...</p>';
    
    const btnHistDelete = document.getElementById('btn-hist-delete');
    if(btnHistDelete && typeof currentUserRole !== 'undefined') {
        btnHistDelete.classList.toggle('hidden', currentUserRole !== 'ADMIN');
        btnHistDelete.setAttribute('data-id', p.id || '');
        btnHistDelete.setAttribute('data-cpf', p.cpf || '');
    }

    window.historicoAtualCache = [];

    try {
        pacienteAtual = p; 
        histPacienteAtual = p;

        let dataCriacao = p.data_criacao || p.dataCriacao || p.DataCriacao || p.Data_criacao || 'N/I';
        if (dataCriacao && dataCriacao.includes('T')) {
            try {
                const d = new Date(dataCriacao);
                if (!isNaN(d.getTime())) {
                    const dia = String(d.getDate()).padStart(2, '0');
                    const mes = String(d.getMonth() + 1).padStart(2, '0');
                    const ano = d.getFullYear();
                    const hor = String(d.getHours()).padStart(2, '0');
                    const min = String(d.getMinutes()).padStart(2, '0');
                    dataCriacao = `${dia}/${mes}/${ano} ${hor}:${min}`;
                }
            } catch(e) {}
        } else if (dataCriacao && dataCriacao.length === 10 && dataCriacao.includes('-')) {
            const parts = dataCriacao.split('-');
            if(parts.length === 3 && parts[0].length === 4) dataCriacao = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        
        const municipio = p.municipio || p.cidade || p.Municipio || p.Cidade || '-';
        const bairro = p.bairro || p.Bairro || '-';
        const logradouro = p.logradouro || p.endereco || p.Endereco || p.Logradouro || '-';
        const situacao = p.status_titulo || p.situacao_eleitoral || p.situacaoEleitoral || p.municipio_titulo || '-';

        divDetalhes.innerHTML = `
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Cadastrado em</span> <span class="font-medium text-slate-800 text-xs">${dataCriacao}</span></div>
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Data Nasc.</span> <span class="font-medium text-slate-800">${p.nascimento ? p.nascimento.split('-').reverse().join('/') + ' (' + (window.calcularIdade ? window.calcularIdade(p.nascimento) : '') + ')' : '-'}</span></div>
            <div><span class="block text-xs font-bold text-slate-400 uppercase">RG</span> <span class="font-medium text-slate-800">${p.rg || '-'}</span></div>
            
            ${p.nome_social ? `<div><span class="block text-xs font-bold text-slate-400 uppercase">Nome Social</span> <span class="font-medium text-slate-800">${p.nome_social}</span></div>` : ''}
            ${p.conjuge ? `<div><span class="block text-xs font-bold text-slate-400 uppercase">Cônjuge</span> <span class="font-medium text-slate-800">${p.conjuge}</span></div>` : ''}
            ${p.profissao ? `<div><span class="block text-xs font-bold text-slate-400 uppercase">Profissão</span> <span class="font-medium text-slate-800">${p.profissao}</span></div>` : ''}
            ${p.cargo_eclesiastico ? `<div><span class="block text-xs font-bold text-slate-400 uppercase">Cargo Ecles.</span> <span class="font-medium text-slate-800">${p.cargo_eclesiastico}</span></div>` : ''}
            ${p.prontuario ? `<div><span class="block text-xs font-bold text-slate-400 uppercase">Nº Prontuário</span> <span class="font-medium text-slate-800 font-mono text-emerald-700">${p.prontuario}</span></div>` : ''}
            
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Município</span> <span class="font-medium text-slate-800">${municipio}</span></div>
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Bairro</span> <span class="font-medium text-slate-800">${bairro}</span></div>
            <div class="md:col-span-2"><span class="block text-xs font-bold text-slate-400 uppercase">Endereço</span> <span class="font-medium text-slate-800">${logradouro}</span></div>
            
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Situação Eleitoral</span> <span class="font-medium text-slate-800">${situacao}</span></div>
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Zona/Seção</span> <span class="font-medium text-slate-800">${p.zona || '-'}/${p.secao || '-'}</span></div>
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Família</span> <span class="font-medium text-slate-800">${p.familia || '-'}</span></div>
            
            ${p.parentes ? `<div class="md:col-span-3 mt-2 pt-2 border-t border-slate-100"><span class="block text-xs font-bold text-slate-400 uppercase">Vínculos Familiares</span> <p class="text-slate-800 whitespace-pre-line text-sm">${p.parentes}</p></div>` : ''}
            ${p.obs ? `<div class="md:col-span-3 mt-2 pt-2 border-t border-slate-100"><span class="block text-xs font-bold text-slate-400 uppercase">Observações</span> <p class="italic text-slate-600">${p.obs}</p></div>` : ''}
            ${p.documentos_link ? `<div class="md:col-span-3 mt-2 pt-2 border-t border-slate-100"><span class="block text-xs font-bold text-slate-400 uppercase mb-2">Documentos Anexos</span> <a href="${p.documentos_link}" target="_blank" class="inline-flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 font-bold py-2 px-4 rounded-lg transition text-sm"><i data-lucide="external-link" class="w-4 h-4"></i> Acessar Pasta de Documentos</a></div>` : ''}
        `;

        if ((!todosAtendimentos || todosAtendimentos.length === 0 || window._atendimentosPrecisamRecarregar) && typeof carregarListaAtendimentos === 'function') {
            await carregarListaAtendimentos();
            window._atendimentosPrecisamRecarregar = false;
        }

        const cpfP = String(p.cpf || '').replace(/\D/g, '');
        const nomeP = (p.nome || '').trim().toUpperCase();

        // --- Atendimentos ---
        const history = todosAtendimentos.filter(a => {
            const aCpf = String(a.cpf_paciente || a.cpf || '').replace(/\D/g, '');
            return aCpf === cpfP && cpfP !== '';
        });

        // --- Currículos ---
        let curricHistorico = [];
        if (typeof todosCurriculos !== 'undefined' && Array.isArray(todosCurriculos)) {
            curricHistorico = todosCurriculos.filter(c => {
                const cCpf = String(c.cpf || '').replace(/\D/g, '');
                const cNome = (c.nome || '').trim().toUpperCase();
                return (cpfP && cCpf === cpfP) || (nomeP && cNome === nomeP);
            });
        } else if (typeof carregarCurriculos === 'function') {
            try { await carregarCurriculos(); curricHistorico = (typeof todosCurriculos !== 'undefined' ? todosCurriculos : []).filter(c => { const cCpf = String(c.cpf || '').replace(/\D/g, ''); const cNome = (c.nome || '').trim().toUpperCase(); return (cpfP && cCpf === cpfP) || (nomeP && cNome === nomeP); }); } catch(e) {}
        }

        // --- Serviços Públicos ---
        let servicosHistorico = [];
        if (typeof todosServicos !== 'undefined' && Array.isArray(todosServicos)) {
            servicosHistorico = todosServicos.filter(s => {
                const sCpf = String(s.cpf || s.cpf_municipe || '').replace(/\D/g, '');
                const sNome = (s.nome_municipe || s.nome || '').trim().toUpperCase();
                return (cpfP && sCpf === cpfP) || (nomeP && sNome === nomeP);
            });
        } else if (typeof carregarServicosPublicos === 'function') {
            try { await carregarServicosPublicos(); servicosHistorico = (typeof todosServicos !== 'undefined' ? todosServicos : []).filter(s => { const sCpf = String(s.cpf || s.cpf_municipe || '').replace(/\D/g, ''); const sNome = (s.nome_municipe || s.nome || '').trim().toUpperCase(); return (cpfP && sCpf === cpfP) || (nomeP && sNome === nomeP); }); } catch(e) {}
        }

        // --- Merge e ordenação por data ---
        const toItems = (arr, tipo) => arr.map(item => ({ ...item, _tipoRegistro: tipo }));
        const allItems = [
            ...toItems(history, 'atendimento'),
            ...toItems(curricHistorico, 'curriculo'),
            ...toItems(servicosHistorico, 'servico'),
        ];
        allItems.sort((a, b) => {
            const dA = a.data_criacao || a.data_abertura || a.data_entrada || a.data_solicitacao || '2000-01-01';
            const dB = b.data_criacao || b.data_abertura || b.data_entrada || b.data_solicitacao || '2000-01-01';
            return new Date(dB) - new Date(dA);
        });

        history.sort((a,b) => new Date(b.data_criacao || b.data_abertura || '2000-01-01') - new Date(a.data_criacao || a.data_abertura || '2000-01-01'));
        window.historicoAtualCache = allItems;

        if(allItems.length === 0) {
            timeline.innerHTML = '<p class="text-slate-400 pl-4">Nenhum registro encontrado para este munícipe.</p>';
        } else {
            const itemsHtml = allItems.map(item => {
                const tipo = item._tipoRegistro;

                // ---- ATENDIMENTO ----
                if (tipo === 'atendimento') {
                    const at = item;
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
                                <div class="flex justify-between items-start mb-3 border-b border-slate-50 pb-2">
                                    <div class="flex flex-col">
                                        <span class="text-xs font-bold text-slate-400 uppercase">Atendimento — ${dataFmt}</span>
                                        <span class="font-bold text-slate-800 text-lg">${at.tipo_servico || 'Atendimento'}</span>
                                    </div>
                                    <span class="${statusColor} text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide border border-black/5">${at.status}</span>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-700">
                                    <div class="col-span-2 sm:col-span-1">
                                        <span class="text-[10px] font-bold text-slate-400 uppercase block">Especialidade / Proc.</span>
                                        <span class="font-medium">${at.especialidade || at.procedimento || '-'}</span>
                                    </div>
                                    <div class="col-span-2">
                                        <span class="text-[10px] font-bold text-slate-400 uppercase block">Local / Detalhe</span>
                                        <span>${at.local || '-'} ${at.tipo ? `(${at.tipo})` : ''}</span>
                                    </div>
                                    ${at.parceiro ? `<div class="col-span-2"><span class="text-[10px] font-bold text-slate-400 uppercase block">Parceiro</span><span class="text-emerald-700 font-medium"><i data-lucide="handshake" class="w-3 h-3 inline mr-1"></i>${at.parceiro}</span></div>` : ''}
                                    ${at.data_marcacao ? `<div class="col-span-2 sm:col-span-1 bg-blue-50 p-2 rounded border border-blue-100 mt-2"><span class="text-[10px] font-bold text-blue-400 uppercase block">Agendado Para</span><span class="font-bold text-blue-800">${at.data_marcacao.split('-').reverse().join('/')}</span>${at.data_abertura ? `<span class="text-[10px] text-blue-400 block">${Math.ceil((new Date(at.data_marcacao) - new Date(at.data_abertura)) / (1000*60*60*24))} dias de espera</span>` : ''}</div>` : `<div class="col-span-2 sm:col-span-1 bg-slate-50 p-2 rounded border border-slate-200 mt-2"><span class="text-[10px] font-bold text-slate-400 uppercase block">Agendado Para</span><span class="text-slate-400 italic text-xs">Sem data de agendamento</span></div>`}
                                    ${at.data_conclusao ? `<div class="col-span-2 sm:col-span-1 bg-emerald-50 p-2 rounded border border-emerald-100 mt-2"><span class="text-[10px] font-bold text-emerald-600 uppercase block">Conclusão / Prazo</span><span class="font-bold text-emerald-800">${at.data_conclusao.split('-').reverse().join('/')} <span class="text-xs ml-1 text-emerald-600">(${Math.ceil((new Date(at.data_conclusao) - new Date(at.data_abertura)) / (1000 * 60 * 60 * 24))} dias)</span></span></div>` : ''}
                                    ${at.obs_atendimento ? `<div class="col-span-2 mt-2 pt-2 border-t border-slate-100"><span class="text-[10px] font-bold text-slate-400 uppercase block">Observações</span><p class="text-slate-500 italic text-xs line-clamp-2">${at.obs_atendimento}</p></div>` : ''}
                                    ${at.anexos_link ? `<div class="col-span-2 mt-2 pt-2 border-t border-slate-100"><a href="${at.anexos_link}" target="_blank" class="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold py-1.5 px-3 rounded-lg transition text-xs"><i data-lucide="paperclip" class="w-3 h-3"></i> Anexos do Atendimento</a></div>` : ''}
                                </div>
                                <div class="text-xs text-slate-400 mt-3 flex justify-end items-center gap-1 group-hover:text-blue-500 transition-colors">
                                    <span>Ver detalhes completos</span><i data-lucide="arrow-right" class="w-3 h-3"></i>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // ---- CURRÍCULO ----
                if (tipo === 'curriculo') {
                    const c = item;
                    const dataFmt = (c.data_entrada || c.data_criacao || '').split('T')[0].split('-').reverse().join('/') || '-';
                    return `
                        <div class="relative pl-4 pb-6">
                            <div class="absolute -left-[9px] top-0 w-4 h-4 bg-white rounded-full border-4 border-purple-400"></div>
                            <div class="bg-purple-50 p-4 rounded-lg border border-purple-200 shadow-sm">
                                <div class="flex justify-between items-start mb-2 border-b border-purple-100 pb-2">
                                    <div>
                                        <span class="text-xs font-bold text-purple-400 uppercase">Currículo — ${dataFmt}</span>
                                        <p class="font-bold text-purple-900">${c.cargo_proposto || 'Cargo não informado'}</p>
                                    </div>
                                    <span class="bg-purple-100 text-purple-700 text-[10px] px-3 py-1 rounded-full font-bold uppercase">${c.status || '-'}</span>
                                </div>
                                <div class="text-sm text-slate-600 grid grid-cols-2 gap-2">
                                    ${c.cnh ? `<div><span class="text-[10px] font-bold text-slate-400 uppercase block">CNH</span><span>${c.cnh}</span></div>` : ''}
                                    ${c.indicacao ? `<div><span class="text-[10px] font-bold text-slate-400 uppercase block">Indicação</span><span>${c.indicacao}</span></div>` : ''}
                                    ${c.observacoes ? `<div class="col-span-2"><span class="text-[10px] font-bold text-slate-400 uppercase block">Obs</span><p class="text-xs italic line-clamp-2">${c.observacoes}</p></div>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }

                // ---- SERVIÇO PÚBLICO ----
                if (tipo === 'servico') {
                    const s = item;
                    const dataFmt = (s.data_solicitacao || s.data_criacao || '').split('T')[0].split('-').reverse().join('/') || '-';
                    let sColor = 'bg-indigo-100 text-indigo-700';
                    if ((s.status || '').toUpperCase() === 'CONCLUIDO') sColor = 'bg-emerald-100 text-emerald-700';
                    if ((s.status || '').toUpperCase() === 'PENDENTE') sColor = 'bg-amber-100 text-amber-700';
                    return `
                        <div class="relative pl-4 pb-6">
                            <div class="absolute -left-[9px] top-0 w-4 h-4 bg-white rounded-full border-4 border-indigo-400"></div>
                            <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-200 shadow-sm">
                                <div class="flex justify-between items-start mb-2 border-b border-indigo-100 pb-2">
                                    <div>
                                        <span class="text-xs font-bold text-indigo-400 uppercase">Serviço Público — ${dataFmt}</span>
                                        <p class="font-bold text-indigo-900">${s.tipo_servico || s.servico || 'Serviço não informado'}</p>
                                    </div>
                                    <span class="${sColor} text-[10px] px-3 py-1 rounded-full font-bold uppercase">${s.status || '-'}</span>
                                </div>
                                <div class="text-sm text-slate-600 grid grid-cols-2 gap-2">
                                    ${s.orgao ? `<div><span class="text-[10px] font-bold text-slate-400 uppercase block">Órgão</span><span>${s.orgao}</span></div>` : ''}
                                    ${s.protocolo ? `<div><span class="text-[10px] font-bold text-slate-400 uppercase block">Protocolo</span><span>${s.protocolo}</span></div>` : ''}
                                    ${s.observacoes || s.obs ? `<div class="col-span-2"><span class="text-[10px] font-bold text-slate-400 uppercase block">Obs</span><p class="text-xs italic line-clamp-2">${s.observacoes || s.obs}</p></div>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }
                return '';
            }).join('');

            timeline.innerHTML = `
                <div class="mb-4 sticky top-0 bg-white dark:bg-slate-800 pt-1 pb-3 z-10 border-b border-slate-100 dark:border-slate-700">
                    <div class="relative">
                        <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                        <input type="text" id="busca_historico" placeholder="Buscar por tipo, especialidade, local, status..."
                            class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            oninput="filtrarHistoricoTimeline(this.value)">
                    </div>
                </div>
                <div id="hist-timeline-items">${itemsHtml}</div>`;

            window._historicoItemsHtml = itemsHtml;
        }

        
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) {
        divDetalhes.innerHTML = '<div class="col-span-3 text-red-500">Erro ao carregar detalhes do munícipe.</div>';
        timeline.innerHTML = '<p class="text-red-500 pl-4">Erro ao carregar histórico.</p>';
        if(btnPrint) {
             btnPrint.innerHTML = '<i data-lucide="alert-circle" class="w-4 h-4 mr-2"></i> Erro';
        }
        console.error(e);
    }
}


// ============================================================================
// X. LISTAGENS PARA IMPRESSÃƒO
// ============================================================================

async function mudarFiltroListagem() {
    if (!todosPacientes || todosPacientes.length === 0) {
        if (typeof carregarListaPacientes === 'function') await carregarListaPacientes();
    }
    if (!todosAtendimentos || todosAtendimentos.length === 0) {
        if (typeof carregarListaAtendimentos === 'function') await carregarListaAtendimentos();
    }

    const tipo = document.getElementById('listagem-tipo').value;
    const lblFiltro = document.getElementById('lbl-filtro-secundario');
    const selMes = document.getElementById('inp-filtro-secundario-mes');
    const txtBusca = document.getElementById('inp-filtro-secundario-texto');
    if (txtBusca) txtBusca.value = ''; // Limpa a busca anterior ao mudar de filtro
    const containerTxt = document.getElementById('container-filtro-texto') || txtBusca;
    const datalist = document.getElementById('listagens-datalist');

    if (txtBusca && !txtBusca.dataset.clickBound) {
        txtBusca.addEventListener('click', function() {
            if (this.list && typeof this.showPicker === 'function') {
                try { this.showPicker(); } catch(e) {}
            }
        });
        txtBusca.addEventListener('input', function() {
            if (this.list && this.value) {
                const isSelected = Array.from(this.list.options).some(opt => opt.value === this.value);
                if (isSelected) {
                    if (typeof gerarListagem === 'function') gerarListagem();
                }
            }
        });
        txtBusca.dataset.clickBound = "true";
    }

    const selSelect = document.getElementById('inp-filtro-secundario-select');

    selMes.classList.add('hidden');
    containerTxt.classList.add('hidden');
    if (selSelect) selSelect.classList.add('hidden');
    if (datalist) datalist.innerHTML = '';

    if (tipo === 'aniversariantes') {
        lblFiltro.innerText = "Selecione o Mês";
        selMes.classList.remove('hidden');
    } else if (tipo === 'servicos' || tipo === 'curriculos') {
        lblFiltro.innerText = "Filtro Automático";
        containerTxt.classList.remove('hidden');
        txtBusca.disabled = true;
        txtBusca.placeholder = "Todos os registros...";
    } else if (tipo === 'pendentes' || tipo === 'concluidos_procedimento' || tipo === 'concluidos_especialidade') {
        const isPendente = tipo === 'pendentes';
        const isProc = tipo === 'concluidos_procedimento';
        const campo = isPendente ? 'Categoria' : (isProc ? 'Procedimento / Exame' : 'Especialidade');
        
        lblFiltro.innerText = `Filtrar por ${campo}`;
        if (selSelect) {
            selSelect.classList.remove('hidden');
            selSelect.innerHTML = `<option value="">-- TODOS --</option>`;

            if (!todosAtendimentos || todosAtendimentos.length === 0) {
                if (typeof carregarListaAtendimentos === 'function') await carregarListaAtendimentos();
            }

            let field = 'tipo_servico';
            if (!isPendente) field = isProc ? 'procedimento' : 'especialidade';

            let baseList = (todosAtendimentos || []);
            if (isPendente) {
                baseList = baseList.filter(a => a.status === 'PENDENTE');
            } else {
                baseList = baseList.filter(a => {
                    const s = (a.status || '').toUpperCase();
                    return s === 'RESOLVIDO' || s === 'CONCLUIDO' || s === 'CONCLUÍDO' || s === 'FINALIZADO';
                });
            }

            const unique = new Set();
            baseList.forEach(a => {
                let v = (a[field] || '').trim().toUpperCase();
                if (isPendente && !v) v = (a.tipo || '').trim().toUpperCase();
                if (v && v !== '-') unique.add(v);
            });
            Array.from(unique).sort().forEach(v => {
                selSelect.innerHTML += `<option value="${v}">${v}</option>`;
            });
        }
    } else if (tipo === 'bairros' || tipo === 'indicacao') {
        lblFiltro.innerText = tipo === 'bairros' ? "Selecione o Bairro" : "Selecione a Indicação";
        if (selSelect) {
            selSelect.classList.remove('hidden');
            let labelTodos = tipo === 'bairros' ? 'TODOS OS BAIRROS' : 'TODAS AS INDICAÇÕES';
            selSelect.innerHTML = `<option value="">-- ${labelTodos} --</option>`;
            let targetField = tipo === 'bairros' ? 'bairro' : 'indicacao';
            let uniqueValues = new Set();
            let hasEmpty = false;
            todosPacientes.forEach(p => {
                let v = p[targetField];
                if (targetField === 'bairro' && !v) v = p['Bairro'];
                if (v && v.trim() !== '') uniqueValues.add(v.trim().toUpperCase());
                else hasEmpty = true;
            });
            Array.from(uniqueValues).sort().forEach(val => {
                selSelect.innerHTML += `<option value="${val}">${val}</option>`;
            });
            if (hasEmpty && targetField === 'bairro') {
                selSelect.innerHTML += `<option value="SEM BAIRRO">SEM BAIRRO</option>`;
            }
        }
    } else if (tipo === 'lideranca') {
        lblFiltro.innerText = "Listagem de Lideranças";
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function gerarListagem() {
    const tipo = document.getElementById('listagem-tipo').value;
    const mes = document.getElementById('inp-filtro-secundario-mes').value;
    const selSelectVal = document.getElementById('inp-filtro-secundario-select')?.value || '';
    const txtBuscaVal = document.getElementById('inp-filtro-secundario-texto')?.value || '';
    const texto = (tipo === 'bairros' || tipo === 'indicacao') ? selSelectVal.trim().toUpperCase() : txtBuscaVal.trim().toUpperCase();
    
    const tbody = document.getElementById('tabela-listagem-body');
    const thead = document.getElementById('tabela-listagem-head');
    
    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">Carregando dados...</td></tr>';
    
    if (!todosPacientes || todosPacientes.length === 0) {
        if (typeof carregarListaPacientes === 'function') await carregarListaPacientes();
    }
    if (!todosAtendimentos || todosAtendimentos.length === 0) {
        if (typeof carregarListaAtendimentos === 'function') await carregarListaAtendimentos();
    }
    if (tipo === 'servicos' && (typeof todosServicos === 'undefined' || todosServicos.length === 0)) {
        if (typeof carregarServicosPublicos === 'function') await carregarServicosPublicos();
    }
    if (tipo === 'curriculos' && (typeof todosCurriculos === 'undefined' || todosCurriculos.length === 0)) {
        if (typeof carregarCurriculos === 'function') await carregarCurriculos();
    }
    
    let html = '';
    let header = '';

    if (tipo === 'aniversariantes') {
        header = `<tr><th class="px-6 py-4">Munícipe</th><th class="px-6 py-4">Data Nasc.</th><th class="px-6 py-4">Telefone</th><th class="px-6 py-4">Bairro</th><th class="px-6 py-4">Indicação</th></tr>`;
        
        const hojeDate = new Date();
        const hojeDia = hojeDate.getDate();
        const hojeMes = hojeDate.getMonth() + 1;
        const anoAtual = hojeDate.getFullYear();

        if (mes === "") {
            const mesesNomes = {
                '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril', '05': 'Maio', '06': 'Junho',
                '07': 'Julho', '08': 'Agosto', '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
            };
            
            for (let m = 1; m <= 12; m++) {
                const mesStr = m.toString().padStart(2, '0');
                const list = todosPacientes.filter(p => {
                    if (!p.nascimento) return false;
                    const parts = p.nascimento.split('-');
                    if (parts.length !== 3) return false;
                    return parts[1] === mesStr;
                });
                
                if (list.length > 0) {
                    list.sort((a,b) => a.nascimento.split('-')[2].localeCompare(b.nascimento.split('-')[2]));
                    html += `<tr class="bg-indigo-50"><td colspan="5" class="px-6 py-3 font-bold text-indigo-800 text-center uppercase">${mesesNomes[mesStr]} ${anoAtual} - ${list.length} pessoas fazem aniversário neste mês</td></tr>`;
                    list.forEach(p => {
                        let dataFmt = p.nascimento.split('-').reverse().join('/');
                        if (window.calcularIdade) dataFmt += ` (${window.calcularIdade(p.nascimento)})`;
                        const diaAniv = parseInt(p.nascimento.split('-')[2]);
                        
                        let statusHtml = '';
                        let trClass = 'hover:bg-slate-50 transition';
                        
                        if (m < hojeMes) { statusHtml = 'Já fez'; trClass = 'bg-slate-50 opacity-75'; }
                        else if (m > hojeMes) { statusHtml = 'Vai fazer'; }
                        else {
                            if (diaAniv < hojeDia) { statusHtml = 'Já fez'; trClass = 'bg-slate-50 opacity-75'; }
                            else if (diaAniv > hojeDia) { statusHtml = 'Vai fazer'; }
                            else { statusHtml = 'HOJE! 🥳'; trClass = 'bg-green-100 border-l-4 border-green-500 font-bold'; }
                        }
                        
                        html += `<tr class="${trClass}"><td class="px-6 py-2 font-bold">${p.nome} <span class="text-[10px] uppercase text-slate-500 ml-2 font-bold">${statusHtml}</span></td><td class="px-6 py-2">${dataFmt}</td><td class="px-6 py-2">${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}</td><td class="px-6 py-2">${p.bairro||'-'}</td><td class="px-6 py-2">${p.indicacao||'-'}</td></tr>`;
                    });
                }
            }
            if (html === '') html = `<tr><td colspan="5" class="px-6 py-4 text-center">Nenhum aniversariante encontrado.</td></tr>`;
        } else {
            const list = todosPacientes.filter(p => {
                if (!p.nascimento) return false;
                const parts = p.nascimento.split('-');
                if (parts.length !== 3) return false;
                return parts[1] === mes;
            });
            list.sort((a,b) => {
                const dA = a.nascimento.split('-')[2];
                const dB = b.nascimento.split('-')[2];
                return dA.localeCompare(dB);
            });

            if (list.length === 0) html = `<tr><td colspan="5" class="px-6 py-4 text-center">Nenhum aniversariante encontrado.</td></tr>`;
            else {
                const mesesNomes = {
                    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril', '05': 'Maio', '06': 'Junho',
                    '07': 'Julho', '08': 'Agosto', '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
                };
                html += `<tr class="bg-indigo-50"><td colspan="5" class="px-6 py-3 font-bold text-indigo-800 text-center uppercase">${mesesNomes[mes]} ${anoAtual} - ${list.length} pessoas fazem aniversário neste mês</td></tr>`;
            }
            
            list.forEach(p => {
                let dataFmt = p.nascimento.split('-').reverse().join('/');
                if (window.calcularIdade) dataFmt += ` (${window.calcularIdade(p.nascimento)})`;
                const diaAniv = parseInt(p.nascimento.split('-')[2]);
                const mesAniv = parseInt(mes);
                
                let statusHtml = '';
                let trClass = 'hover:bg-slate-50 transition';
                
                if (mesAniv < hojeMes) { statusHtml = 'Já fez'; trClass = 'bg-slate-50 opacity-75'; }
                else if (mesAniv > hojeMes) { statusHtml = 'Vai fazer'; }
                else {
                    if (diaAniv < hojeDia) { statusHtml = 'Já fez'; trClass = 'bg-slate-50 opacity-75'; }
                    else if (diaAniv > hojeDia) { statusHtml = 'Vai fazer'; }
                    else { statusHtml = 'HOJE! 🥳'; trClass = 'bg-green-100 border-l-4 border-green-500 font-bold'; }
                }

                html += `<tr class="${trClass}"><td class="px-6 py-2 font-bold">${p.nome} <span class="text-[10px] uppercase text-slate-500 ml-2 font-bold">${statusHtml}</span></td><td class="px-6 py-2">${dataFmt}</td><td class="px-6 py-2">${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}</td><td class="px-6 py-2">${p.bairro||'-'}</td><td class="px-6 py-2">${p.indicacao||'-'}</td></tr>`;
            });
        }
    } 
    else if (tipo === 'pendentes') {
        header = `<tr><th class="px-6 py-4">Munícipe (CPF)</th><th class="px-6 py-4">Categoria</th><th class="px-6 py-4">Procedimento / Local</th><th class="px-6 py-4">Data Risco</th></tr>`;
        let list = todosAtendimentos.filter(a => a.status === 'PENDENTE');

        const filtroSel = (document.getElementById('inp-filtro-secundario-select')?.value || '').trim().toUpperCase();
        if (filtroSel) {
            list = list.filter(a => {
                const cat = (a.tipo_servico || a.tipo || '').trim().toUpperCase();
                return cat === filtroSel;
            });
        }

        list.sort((a,b) => (a.nome_paciente || '').localeCompare(b.nome_paciente || ''));

        if (list.length === 0) {
            html = `<tr><td colspan="4" class="px-6 py-4 text-center">Nenhum atendimento pendente.</td></tr>`;
        } else {
            const categorias = {};
            list.forEach(a => {
                const cat = (a.tipo_servico || a.tipo || 'OUTROS').toUpperCase();
                categorias[cat] = (categorias[cat] || 0) + 1;
            });
            
            let cardsHtml = `
            <tr>
                <td colspan="4" class="bg-slate-50 p-6 border-b border-slate-200">
                    <div class="flex flex-col gap-4">
                        <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider">Resumo de Pendências</h3>
                        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                                <span class="text-3xl font-black text-rose-500">${list.length}</span>
                                <span class="text-xs font-bold text-slate-500 uppercase mt-1">Total Geral</span>
                            </div>
            `;
            Object.keys(categorias).sort().forEach(cat => {
                cardsHtml += `
                            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                                <span class="text-2xl font-black text-amber-500">${categorias[cat]}</span>
                                <span class="text-[10px] font-bold text-slate-500 uppercase mt-1 text-center leading-tight">${cat}</span>
                            </div>
                `;
            });
            cardsHtml += `
                        </div>
                    </div>
                </td>
            </tr>
            `;

            html = cardsHtml;

            list.forEach(a => {
                const dataFmt = a.data_risco ? a.data_risco.split('-').reverse().join('/') : '-';
                const cat = (a.tipo_servico || a.tipo || '-').toUpperCase();
                const tempId = 'pend_' + Math.random().toString(36).substr(2, 9);
                window[tempId] = a;

                html += `
                <tr onclick="abrirDetalheAtendimento(window['${tempId}'])" class="cursor-pointer hover:bg-slate-50 transition border-b border-slate-100 last:border-0 group">
                    <td class="px-6 py-3 font-bold text-slate-700 group-hover:text-blue-600 transition">
                        ${a.nome_paciente || 'Desconhecido'} 
                        <span class="text-xs text-slate-400 block font-normal group-hover:text-blue-400">${a.cpf_paciente||''}</span>
                    </td>
                    <td class="px-6 py-3">
                        <span class="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">${cat}</span>
                    </td>
                    <td class="px-6 py-3">
                        ${a.procedimento||'-'}<br>
                        <span class="text-xs text-slate-500">${a.local||'-'}</span>
                    </td>
                    <td class="px-6 py-3 flex flex-col justify-center">
                        <span class="text-rose-500 font-bold text-sm">${dataFmt}</span>
                        <span class="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 mt-1"><i data-lucide="external-link" class="w-3 h-3"></i> Abrir</span>
                    </td>
                </tr>`;
            });
        }
    }
    else if (tipo === 'concluidos_procedimento' || tipo === 'concluidos_especialidade') {
        const isProcedimento = tipo === 'concluidos_procedimento';
        const field = isProcedimento ? 'procedimento' : 'especialidade';
        const fieldLabel = isProcedimento ? 'Procedimento / Exame' : 'Especialidade';

        header = `<tr><th class="px-6 py-4">Munícipe (CPF)</th><th class="px-6 py-4">${fieldLabel}</th><th class="px-6 py-4">Categoria / Especialidade</th><th class="px-6 py-4">Data de Conclusão</th></tr>`;

        const statusConcluido = s => {
            const u = (s || '').toUpperCase();
            return u === 'RESOLVIDO' || u === 'CONCLUIDO' || u === 'CONCLUÍDO' || u === 'FINALIZADO';
        };

        let list = (todosAtendimentos || []).filter(a => statusConcluido(a.status));

        const filtroSel = (document.getElementById('inp-filtro-secundario-select')?.value || '').trim().toUpperCase();
        if (filtroSel) {
            list = list.filter(a => (a[field] || '').trim().toUpperCase() === filtroSel);
        }

        list.sort((a, b) => (a.nome_paciente || '').localeCompare(b.nome_paciente || ''));

        if (list.length === 0) {
            html = `<tr><td colspan="4" class="px-6 py-4 text-center">Nenhum atendimento concluído encontrado.</td></tr>`;
        } else {
            const counts = {};
            list.forEach(a => {
                const v = (a[field] || 'NÃO INFORMADO').toUpperCase();
                counts[v] = (counts[v] || 0) + 1;
            });

            let cardsHtml = `
            <tr>
                <td colspan="4" class="bg-slate-50 p-6 border-b border-slate-200">
                    <div class="flex flex-col gap-4">
                        <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider">Resumo de Concluídos</h3>
                        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                                <span class="text-3xl font-black text-emerald-500">${list.length}</span>
                                <span class="text-xs font-bold text-slate-500 uppercase mt-1">Total Filtrado</span>
                            </div>
            `;
            Object.keys(counts).sort().forEach(k => {
                cardsHtml += `
                            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                                <span class="text-2xl font-black text-emerald-500">${counts[k]}</span>
                                <span class="text-[10px] font-bold text-slate-500 uppercase mt-1 text-center leading-tight">${k}</span>
                            </div>
                `;
            });
            cardsHtml += `
                        </div>
                    </div>
                </td>
            </tr>
            `;
            html = cardsHtml;

            list.forEach(a => {
                const dataRaw = a.data_resolucao || a.data_fechamento || a.data_conclusao || a.updated_at || a.data_abertura || '';
                const dataFmt = dataRaw ? (dataRaw.includes('T') ? dataRaw.split('T')[0].split('-').reverse().join('/') : dataRaw.split('-').reverse().join('/')) : '-';
                const valCampo = (a[field] || '-').toUpperCase();
                const secundario = isProcedimento ? (a.especialidade || a.tipo_servico || '-') : (a.tipo_servico || a.tipo || '-');
                
                const tempId = 'conc_' + Math.random().toString(36).substr(2, 9);
                window[tempId] = a;

                html += `
                <tr onclick="abrirDetalheAtendimento(window['${tempId}'])" class="cursor-pointer hover:bg-slate-50 transition border-b border-slate-100 last:border-0 group">
                    <td class="px-6 py-3 font-bold text-slate-700 group-hover:text-blue-600 transition">
                        ${a.nome_paciente || 'Desconhecido'} 
                        <span class="text-xs text-slate-400 block font-normal group-hover:text-blue-400">${a.cpf_paciente || ''}</span>
                    </td>
                    <td class="px-6 py-3">
                        <span class="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">${valCampo}</span>
                    </td>
                    <td class="px-6 py-3 text-slate-500 text-sm">
                        ${secundario}
                    </td>
                    <td class="px-6 py-3 flex flex-col justify-center">
                        <span class="text-emerald-600 font-bold text-sm">${dataFmt}</span>
                        <span class="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 mt-1"><i data-lucide="external-link" class="w-3 h-3"></i> Abrir</span>
                    </td>
                </tr>`;
            });
        }
    }
    else if (tipo === 'servicos') {
        header = `<tr><th class="px-6 py-4">Data</th><th class="px-6 py-4">Munícipe</th><th class="px-6 py-4">Serviço Solicitado</th><th class="px-6 py-4">Status</th></tr>`;
        const list = typeof todosServicos !== 'undefined' ? todosServicos : [];
        list.sort((a,b) => (a.nome_municipe || '').localeCompare(b.nome_municipe || ''));
        
        if (list.length === 0) {
            html = `<tr><td colspan="4" class="px-6 py-4 text-center">Nenhum serviço encontrado.</td></tr>`;
        } else {
            list.forEach(a => {
                const dataFmt = a.data_solicitacao ? a.data_solicitacao.split('-').reverse().join('/') : '-';
                html += `<tr><td class="px-6 py-3">${dataFmt}</td><td class="px-6 py-3 font-bold text-slate-700">${a.nome_municipe || 'Desconhecido'}</td><td class="px-6 py-3">${a.tipo_servico||'-'}<br><span class="text-xs text-slate-500">${a.endereco||'-'}</span></td><td class="px-6 py-3 font-bold text-sm text-indigo-600">${a.status||'-'}</td></tr>`;
            });
        }
    }
    else if (tipo === 'curriculos') {
        header = `<tr><th class="px-6 py-4">Data Entrada</th><th class="px-6 py-4">Candidato</th><th class="px-6 py-4">Cargo / Status</th><th class="px-6 py-4">Indicação</th></tr>`;
        const list = typeof todosCurriculos !== 'undefined' ? todosCurriculos : [];
        list.sort((a,b) => (a.nome || '').localeCompare(b.nome || ''));
        
        if (list.length === 0) {
            html = `<tr><td colspan="4" class="px-6 py-4 text-center">Nenhum currículo encontrado.</td></tr>`;
        } else {
            list.forEach(a => {
                const dataFmt = a.data_entrada ? a.data_entrada.split('-').reverse().join('/') : '-';
                html += `<tr><td class="px-6 py-3 text-sm">${dataFmt}</td><td class="px-6 py-3 font-bold text-slate-700">${a.nome || 'Desconhecido'} <span class="text-xs text-slate-400 block font-normal">${a.telefone||''}</span></td><td class="px-6 py-3">${a.cargo_proposto||'-'}<br><span class="text-xs text-slate-500 font-bold">${a.status||'-'}</span></td><td class="px-6 py-3 font-bold text-sm">${a.indicacao||'-'}</td></tr>`;
            });
        }
    }
    else if (tipo === 'bairros') {
        header = `<tr><th class="px-6 py-4">Munícipe</th><th class="px-6 py-4">Bairro / Endereço</th><th class="px-6 py-4">Telefone</th><th class="px-6 py-4">Atendimentos Consolidado</th></tr>`;
        let list = todosPacientes;
        if (texto) {
            if (texto.toUpperCase() === 'SEM BAIRRO') {
                list = list.filter(p => !p.bairro && !p.Bairro);
            } else {
                list = list.filter(p => {
                    const br = (p.bairro || p.Bairro || '').trim().toUpperCase();
                    return br === texto;
                });
            }
        }
        list.sort((a,b) => ((a.bairro||a.Bairro||'').localeCompare(b.bairro||b.Bairro||'') || (a.nome||'').localeCompare(b.nome||'')));

        if (list.length === 0) html = `<tr><td colspan="4" class="px-6 py-4 text-center">Nenhum resultado.</td></tr>`;
        list.forEach(p => {
            const end = p.endereco || p.logradouro || p.Endereco || p.Logradouro || '-';
            const br = p.bairro || p.Bairro || '-';
            const bairroEnd = br + '<br><span class="text-xs text-slate-400">' + end + '</span>';
            
            const atends = (todosAtendimentos || []).filter(a => {
                const cpfP = (p.cpf || '').replace(/\D/g, '');
                const cpfA = (a.cpf_paciente || a.cpf || '').replace(/\D/g, '');
                
                // Match by CPF (ignoring leading zeros)
                if (cpfP.length > 4 && cpfA.length > 4 && parseInt(cpfP, 10) === parseInt(cpfA, 10)) return true;
                
                // Match by exact Name (trimmed)
                const nomeP = (p.nome || '').trim().toUpperCase();
                const nomeA = (a.nome_paciente || a.nome || '').trim().toUpperCase();
                if (nomeP && nomeA && nomeP === nomeA) return true;
                
                return false;
            });
            
            let cons = atends.map(a => {
                let s = [a.tipo_servico || a.tipo, a.especialidade, a.procedimento].filter(x=>x).join(' - ');
                return s ? `<div class="text-xs border-b border-slate-100 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">${s}</div>` : '';
            }).filter(x=>x).join('');
            if(!cons) cons = '-';

            html += `<tr><td class="px-6 py-2 font-bold">${p.nome}</td><td class="px-6 py-2">${bairroEnd}</td><td class="px-6 py-2">${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}</td><td class="px-6 py-2">${cons}</td></tr>`;
        });
    }
    else if (tipo === 'indicacao') {
        header = `<tr><th class="px-6 py-4">Munícipe</th><th class="px-6 py-4">Indicação</th><th class="px-6 py-4">Bairro</th></tr>`;
        let list = todosPacientes.filter(p => p.indicacao && p.indicacao.trim() !== "");
        if (texto) {
            list = list.filter(p => (p.indicacao || '').trim().toUpperCase() === texto);
        }
        list.sort((a,b) => (a.indicacao||'').localeCompare(b.indicacao||'') || (a.nome||'').localeCompare(b.nome||''));

        if (list.length === 0) html = `<tr><td colspan="3" class="px-6 py-4 text-center">Nenhum resultado.</td></tr>`;
        list.forEach(p => {
            html += `<tr><td class="px-6 py-2 font-bold">${p.nome}</td><td class="px-6 py-2">${p.indicacao||'-'}</td><td class="px-6 py-2">${p.bairro||'-'}</td></tr>`;
        });
    }
    else if (tipo === 'lideranca') {
        const indicacoes = new Set();
        todosPacientes.forEach(p => {
            if (p.indicacao && p.indicacao.trim() !== '') indicacoes.add(p.indicacao.trim().toUpperCase());
        });
        
        let lideresMap = new Map();
        todosPacientes.forEach(p => {
            if (p.lideranca && p.lideranca.trim().toUpperCase() === 'SIM') {
                const nome = (p.nome || '').trim().toUpperCase();
                if (nome) lideresMap.set(nome, p);
            }
        });
        
        indicacoes.forEach(ind => {
            if (!lideresMap.has(ind)) {
                const pac = todosPacientes.find(p => (p.nome || '').trim().toUpperCase() === ind);
                if (pac) lideresMap.set(ind, pac);
                else lideresMap.set(ind, { nome: ind, lideranca: 'NÃO', telefone: '-' });
            }
        });
        
        let list = Array.from(lideresMap.values());
        list.sort((a,b) => (a.nome||'').localeCompare(b.nome||''));
        
        header = `
        <tr class="bg-slate-100 text-slate-800 uppercase text-xs font-bold border-b border-slate-200">
            <th class="px-6 py-4 text-left">Nome da Liderança / Indicação</th>
            <th class="px-6 py-4 text-center">É Liderança Oficial?</th>
            <th class="px-6 py-4 text-center">Contatos (Qtd Indicações)</th>
            <th class="px-6 py-4 text-left">Telefone</th>
        </tr>`;

        if (list.length === 0) html = `<tr><td colspan="4" class="px-6 py-4 text-center">Nenhum resultado.</td></tr>`;
        
        list.forEach(p => {
            let tel = p.tel || p.tel1 || p.whatsapp || p.telefone || '-';
            let isLid = (p.lideranca || '').trim().toUpperCase() === 'SIM' ? 'SIM' : 'NÃO';
            let qtdIndicados = todosPacientes.filter(x => (x.indicacao||'').trim().toUpperCase() === (p.nome||'').trim().toUpperCase()).length;
            
            html += `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100 last:border-0">
                <td class="px-6 py-4 align-middle">
                    <div class="font-bold text-slate-800 uppercase">${p.nome || '-'}</div>
                </td>
                <td class="px-6 py-4 align-middle text-center">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${isLid === 'SIM' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}">${isLid}</span>
                </td>
                <td class="px-6 py-4 align-middle text-center text-slate-600 font-medium">
                    ${qtdIndicados > 0 ? `<span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs">${qtdIndicados} indicados</span>` : '-'}
                </td>
                <td class="px-6 py-4 align-middle text-slate-600">
                    ${tel}
                </td>
            </tr>`;
        });
    }

    thead.innerHTML = header;
    tbody.innerHTML = html;
}

function imprimirListagem() {
    const thead = document.getElementById('tabela-listagem-head').innerHTML;
    const tbody = document.getElementById('tabela-listagem-body').innerHTML;
    const tipo = document.getElementById('listagem-tipo').options[document.getElementById('listagem-tipo').selectedIndex].text;

    if (tbody.includes("Selecione os filtros") || tbody.includes("Nenhum resultado")) {
        showModalAlert("Gere uma listagem válida primeiro!");
        return;
    }

    const html = `
    <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin:0; font-size: 20px;">Connecta</h2>
        <h3 style="margin:5px 0 0 0; color:#475569; font-size: 16px;">Relatório: ${tipo}</h3>
        <p style="margin:5px 0 0 0; font-size: 12px; color:#94a3b8;">Gerado em: ${new Date().toLocaleString()}</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 12px;">
        <thead style="background: #f1f5f9; text-transform: uppercase;">
            ${thead}
        </thead>
        <tbody>
            ${tbody}
        </tbody>
    </table>
    <style>
        table, th, td { border: 1px solid #cbd5e1; }
        th { padding: 10px; text-align: left; }
        td { padding: 8px; }
    </style>
    `;

    let mywindow = window.open('', 'PRINT', 'height=600,width=800');
    mywindow.document.write('<html><head><title>Imprimir Listagem</title></head><body>');
    mywindow.document.write(html);
    mywindow.document.write('</body></html>');

    setTimeout(() => {
        mywindow.document.close();
        mywindow.focus();
        mywindow.print();
        mywindow.close();
    }, 500);
}

// ============================================================================
// XI. IMPRESSÃƒO DA FICHA DO CADASTRO
// ============================================================================

function imprimirFichaCadastro() {
    if (!pacienteAtual) {
        showModalAlert("Nenhum munícipe carregado para impressão.");
        return;
    }
    let p = pacienteAtual;

    const styleLabel = "display: block; font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 2px;";
    const styleData = "display: block; font-size: 13px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 12px; min-height: 18px;";
    const styleSection = "margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; break-inside: avoid;";
    const styleTitle = "margin-top: 0; font-size: 14px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 15px;";

    const fmtData = (d) => d ? d.split('-').reverse().join('/') : '-';

    const html = `
    <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e293b; padding-bottom: 10px;">
        <h2 style="margin: 0; font-size: 20px; color: #0f172a;">FICHA CADASTRAL</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Connecta - Gerado em: ${new Date().toLocaleString()}</p>
    </div>

    <div style="${styleSection}">
        <h3 style="${styleTitle}">Dados Pessoais</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 60%; padding-right: 15px;">
                    <span style="${styleLabel}">Nome Completo</span>
                    <span style="${styleData}">${p.nome || '-'}</span>
                </td>
                <td style="width: 40%;">
                    <span style="${styleLabel}">Data de Nascimento</span>
                    <span style="${styleData}">${fmtData(p.nascimento)} ${p.nascimento && window.calcularIdade ? '(' + window.calcularIdade(p.nascimento) + ')' : ''}</span>
                </td>
            </tr>
            <tr>
                <td style="padding-right: 15px;">
                    <span style="${styleLabel}">Nome da Mãe</span>
                    <span style="${styleData}">${p.nome_mae || '-'}</span>
                </td>
                <td>
                    <span style="${styleLabel}">Profissão</span>
                    <span style="${styleData}">${p.profissao || '-'}</span>
                </td>
            </tr>
        </table>
    </div>

    <div style="${styleSection}">
        <h3 style="${styleTitle}">Documentação</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 33%; padding-right: 15px;">
                    <span style="${styleLabel}">CPF</span>
                    <span style="${styleData}">${p.cpf || '-'}</span>
                </td>
                <td style="width: 33%; padding-right: 15px;">
                    <span style="${styleLabel}">RG</span>
                    <span style="${styleData}">${p.rg || '-'}</span>
                </td>
                <td style="width: 33%;">
                    <span style="${styleLabel}">Cartão SUS</span>
                    <span style="${styleData}">${p.sus || '-'}</span>
                </td>
            </tr>
            <tr>
                <td style="padding-right: 15px;">
                    <span style="${styleLabel}">Título de Eleitor</span>
                    <span style="${styleData}">${p.titulo || '-'}</span>
                </td>
                <td style="padding-right: 15px;">
                    <span style="${styleLabel}">Zona</span>
                    <span style="${styleData}">${p.zona || '-'}</span>
                </td>
                <td>
                    <span style="${styleLabel}">Seção</span>
                    <span style="${styleData}">${p.secao || '-'}</span>
                </td>
            </tr>
        </table>
    </div>

    <div style="${styleSection}">
        <h3 style="${styleTitle}">Contato e Endereço</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 50%; padding-right: 15px;">
                    <span style="${styleLabel}">Telefone Principal</span>
                    <span style="${styleData}">${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}</span>
                </td>
                <td style="width: 50%;">
                    <span style="${styleLabel}">Telefone Recado</span>
                    <span style="${styleData}">${p.tel2 || p.tel_recado || '-'}</span>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <span style="${styleLabel}">Endereço Completo</span>
                    <span style="${styleData}">${p.endereco || '-'}</span>
                </td>
            </tr>
            <tr>
                <td style="padding-right: 15px;">
                    <span style="${styleLabel}">Bairro</span>
                    <span style="${styleData}">${p.bairro || '-'}</span>
                </td>
                <td>
                    <span style="${styleLabel}">CEP</span>
                    <span style="${styleData}">${p.cep || '-'}</span>
                </td>
            </tr>
        </table>
    </div>

    <div style="${styleSection}">
        <h3 style="${styleTitle}">Informações Adicionais</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 50%; padding-right: 15px;">
                    <span style="${styleLabel}">Liderança</span>
                    <span style="${styleData}">${p.lideranca || '-'}</span>
                </td>
                <td style="width: 50%;">
                    <span style="${styleLabel}">Indicação</span>
                    <span style="${styleData}">${p.indicacao || '-'}</span>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <span style="${styleLabel}">Redes Sociais</span>
                    <span style="${styleData}">${p.redes_sociais || '-'}</span>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <span style="${styleLabel}">Observações Cadastrais</span>
                    <span style="${styleData}">${p.obs_cadastro || '-'}</span>
                </td>
            </tr>
        </table>
    </div>
    `;

    let mywindow = window.open('', 'PRINT', 'height=600,width=800');
    mywindow.document.write('<html><head><title>Imprimir Cadastro</title></head><body style="font-family: sans-serif;">');
    mywindow.document.write(html);
    mywindow.document.write('</body></html>');

    setTimeout(() => {
        mywindow.document.close();
        mywindow.focus();
        mywindow.print();
        mywindow.close();
    }, 500);
}


// ============================================================================
// XII. CONTROLES DE PAGINAÇÃO
// ============================================================================

window.paginacaoPacientes = { paginaAtual: 1, itensPorPagina: 10, dadosFiltrados: [] };
window.paginacaoAtendimentos = { paginaAtual: 1, itensPorPagina: 10, dadosFiltrados: [] };

// --- PAGINAÇÃO: PACIENTES ---

function renderizarPaginaPacientes() {
    const p = window.paginacaoPacientes;
    const total = p.dadosFiltrados.length;
    const totalPaginas = Math.ceil(total / p.itensPorPagina) || 1;
    
    if (p.paginaAtual > totalPaginas) p.paginaAtual = totalPaginas;
    if (p.paginaAtual < 1) p.paginaAtual = 1;

    const inicio = (p.paginaAtual - 1) * p.itensPorPagina;
    const fim = inicio + p.itensPorPagina;
    const itensPagina = p.dadosFiltrados.slice(inicio, fim);

    if (typeof renderizarTabelaPacientes === 'function') {
        renderizarTabelaPacientes(itensPagina);
    }

    const info = document.getElementById('paginacao-pacientes-info');
    if (info) {
        info.innerText = `Mostrando ${total === 0 ? 0 : inicio + 1} a ${Math.min(fim, total)} de ${total} registros`;
    }

    renderizarControlesPaginacao('paginacao-pacientes-botoes', p.paginaAtual, totalPaginas, 'mudarPaginaPacientes');
}

function mudarPaginaPacientes(pagina) {
    const p = window.paginacaoPacientes;
    const totalPaginas = Math.ceil(p.dadosFiltrados.length / p.itensPorPagina) || 1;
    
    if (pagina === 'prev') p.paginaAtual = Math.max(1, p.paginaAtual - 1);
    else if (pagina === 'next') p.paginaAtual = Math.min(totalPaginas, p.paginaAtual + 1);
    else p.paginaAtual = parseInt(pagina);

    renderizarPaginaPacientes();
}

function mudarTamanhoPaginaPacientes(size) {
    window.paginacaoPacientes.itensPorPagina = parseInt(size);
    window.paginacaoPacientes.paginaAtual = 1;
    renderizarPaginaPacientes();
}

// --- PAGINAÇÃO: ATENDIMENTOS ---

function renderizarPaginaAtendimentos() {
    const p = window.paginacaoAtendimentos;
    const total = p.dadosFiltrados.length;
    const totalPaginas = Math.ceil(total / p.itensPorPagina) || 1;
    
    if (p.paginaAtual > totalPaginas) p.paginaAtual = totalPaginas;
    if (p.paginaAtual < 1) p.paginaAtual = 1;

    const inicio = (p.paginaAtual - 1) * p.itensPorPagina;
    const fim = inicio + p.itensPorPagina;
    const itensPagina = p.dadosFiltrados.slice(inicio, fim);

    if (typeof renderizarTabelaAtendimentos === 'function') {
        renderizarTabelaAtendimentos(itensPagina);
    }

    const info = document.getElementById('paginacao-atendimentos-info');
    if (info) {
        info.innerText = `Mostrando ${total === 0 ? 0 : inicio + 1} a ${Math.min(fim, total)} de ${total} registros`;
    }

    // Esconde contador antigo
    const oldContador = document.getElementById('contador-atendimentos');
    if (oldContador) oldContador.style.display = 'none';

    renderizarControlesPaginacao('paginacao-atendimentos-botoes', p.paginaAtual, totalPaginas, 'mudarPaginaAtendimentos');
}

function mudarPaginaAtendimentos(pagina) {
    const p = window.paginacaoAtendimentos;
    const totalPaginas = Math.ceil(p.dadosFiltrados.length / p.itensPorPagina) || 1;
    
    if (pagina === 'prev') p.paginaAtual = Math.max(1, p.paginaAtual - 1);
    else if (pagina === 'next') p.paginaAtual = Math.min(totalPaginas, p.paginaAtual + 1);
    else p.paginaAtual = parseInt(pagina);

    renderizarPaginaAtendimentos();
}

function mudarTamanhoPaginaAtendimentos(size) {
    window.paginacaoAtendimentos.itensPorPagina = parseInt(size);
    window.paginacaoAtendimentos.paginaAtual = 1;
    renderizarPaginaAtendimentos();
}

// --- UTILITÁRIO GERAL DE CONTROLES ---

function renderizarControlesPaginacao(containerId, paginaAtual, totalPaginas, nomeFuncaoMudanca) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';

    // Botão Anterior
    const prevDisabled = paginaAtual === 1 ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-slate-100 hover:text-blue-600';
    html += `<button onclick="${nomeFuncaoMudanca}('prev')" class="px-3 py-1 text-sm border border-slate-200 rounded text-slate-500 bg-white transition ${prevDisabled}"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>`;

    // Lógica para mostrar apenas algumas páginas (ex: 1, 2, 3, ..., 10)
    let startPage = Math.max(1, paginaAtual - 2);
    let endPage = Math.min(totalPaginas, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    if (startPage > 1) {
        html += `<button onclick="${nomeFuncaoMudanca}(1)" class="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-100 transition bg-white text-slate-600">1</button>`;
        if (startPage > 2) html += `<span class="px-2 text-slate-400">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === paginaAtual 
            ? 'bg-blue-600 text-white border-blue-600 font-bold' 
            : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200';
        html += `<button onclick="${nomeFuncaoMudanca}(${i})" class="px-3 py-1 text-sm border rounded transition ${activeClass}">${i}</button>`;
    }

    if (endPage < totalPaginas) {
        if (endPage < totalPaginas - 1) html += `<span class="px-2 text-slate-400">...</span>`;
        html += `<button onclick="${nomeFuncaoMudanca}(${totalPaginas})" class="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-100 transition bg-white text-slate-600">${totalPaginas}</button>`;
    }

    // Botão Próximo
    const nextDisabled = paginaAtual === totalPaginas ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-slate-100 hover:text-blue-600';
    html += `<button onclick="${nomeFuncaoMudanca}('next')" class="px-3 py-1 text-sm border border-slate-200 rounded text-slate-500 bg-white transition ${nextDisabled}"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>`;

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderRecentLogins() {
    const container = document.getElementById('recent-logins');
    if(!container) return;
    
    let recents = JSON.parse(localStorage.getItem('recentLoginsCache') || '[]');
    if(recents.length === 0) {
        container.innerHTML = '';
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    let html = `<p class="text-xs text-slate-500 font-bold uppercase mb-3 text-center">Acessos Salvos (Clique para entrar)</p>
                <div class="flex flex-col gap-2">`;
                
    recents.forEach(r => {
        html += `<div class="flex items-center gap-2">
                    <button onclick="loginDiretoCache('${r.email}', '${r.token}')" type="button" class="flex-1 flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg transition-all w-full text-left">
                        <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold uppercase shrink-0">${r.email.charAt(0)}</div>
                        <span class="text-sm font-medium truncate">${r.email}</span>
                    </button>
                    <button onclick="removerLoginCache('${r.email}')" type="button" class="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all shrink-0" title="Remover acesso">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                 </div>`;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

function removerLoginCache(email) {
    let recents = JSON.parse(localStorage.getItem('recentLoginsCache') || '[]');
    recents = recents.filter(r => r.email !== email);
    localStorage.setItem('recentLoginsCache', JSON.stringify(recents));
    renderRecentLogins();
}

function loginDiretoCache(email, token) {
    document.getElementById('login_email').value = email;
    document.getElementById('login_senha').value = atob(token);
    efetuarLogin();
}

document.addEventListener('DOMContentLoaded', renderRecentLogins);



// ============================================================================
// ADMIN PANEL UI
// ============================================================================

window.alterarSenhaVisitante = async function(uid, email) {
    if (!uid || !email) return;
    const res = await window.showModalAlterarSenha(email);
    if (!res) return;

    const ref = window.doc(window.db, 'usuarios', uid);

    if (res.action === 'EMAIL') {
        try {
            await window.auth.sendPasswordResetEmail(email);
            if (window.setDoc) {
                await window.setDoc(ref, {
                    senha_reset_solicitado_em: new Date().toISOString(),
                    alterado_por_admin: window.auth.currentUser?.email || 'admin'
                }, { merge: true });
            } else {
                await window.updateDoc(ref, {
                    senha_reset_solicitado_em: new Date().toISOString(),
                    alterado_por_admin: window.auth.currentUser?.email || 'admin'
                });
            }
            if (typeof window.logAuditoria === 'function') {
                window.logAuditoria('ALTERAR_SENHA_VISITANTE', 'Usuários', `Admin enviou e-mail de redefinição para visitante: ${email}`);
            }
            window.showModalAlert(`E-mail de alteração de senha enviado para ${email}! Registrado no log de auditoria.`);
        } catch (e) {
            window.showModalAlert("Erro ao enviar e-mail de alteração de senha: " + e.message);
        }
    } else if (res.action === 'SENHA') {
        const val = (res.senha || '').trim();
        if (val.length < 6) {
            window.showModalAlert("A nova senha precisa ter pelo menos 6 caracteres.");
            return;
        }
        try {
            if (window.setDoc) {
                await window.setDoc(ref, {
                    nova_senha_definida: val,
                    senha_alterada_em: new Date().toISOString(),
                    alterado_por_admin: window.auth.currentUser?.email || 'admin'
                }, { merge: true });
            } else {
                await window.updateDoc(ref, {
                    nova_senha_definida: val,
                    senha_alterada_em: new Date().toISOString(),
                    alterado_por_admin: window.auth.currentUser?.email || 'admin'
                });
            }
            if (typeof window.logAuditoria === 'function') {
                window.logAuditoria('ALTERAR_SENHA_VISITANTE', 'Usuários', `Admin definiu nova senha para o visitante: ${email}`);
            }
            window.showModalAlert(`Nova senha ("${val}") registrada com sucesso para ${email}! Registrado no log de auditoria.`);
        } catch (e) {
            window.showModalAlert("Erro ao salvar senha: " + e.message);
        }
    }
};

function renderizarUsuarios(usuarios) {
    const tbody = document.getElementById('tabela-usuarios-body');
    if(!tbody) return;
    
    if(usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="px-4 py-8 text-center text-slate-400">Nenhum usuário encontrado.</td></tr>';
        return;
    }
    
    let html = '';
    usuarios.forEach(u => {
        const email = u.email || 'Sem e-mail';
        const perfil = u.perfil || 'VISITOR';
        const isAdmin = perfil === 'ADMIN';
        
        const badgeClass = isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600';
        
        let acoes = '';
        if (email !== window.auth.currentUser?.email) {
            if (isAdmin) {
                acoes = `<button onclick="alterarCargoUsuario('${u.id}', 'VISITOR')" class="text-xs text-orange-600 hover:text-orange-800 font-bold bg-orange-50 px-3 py-1 rounded transition">Tornar Visitante</button>`;
            } else {
                acoes = `<button onclick="alterarCargoUsuario('${u.id}', 'ADMIN')" class="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-3 py-1 rounded transition">Tornar Admin</button>`;
            }
        } else {
            acoes = `<span class="text-xs text-slate-400 italic">Você</span>`;
        }
        
        html += `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                <td class="px-4 py-3 font-medium text-slate-800">${email}</td>
                <td class="px-4 py-3 text-center"><span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${badgeClass}">${perfil}</span></td>
                <td class="px-4 py-3 text-right">
                    <div class="flex justify-end gap-2">${acoes}</div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

window.renderizarUsuarios = renderizarUsuarios;

// ============================================================================
// ORDENAÇÃO GENÉRICA DE TABELAS
// ============================================================================

window.sortState = {};

window.sortTable = function(tabelaId, campo, thElement) {
    if (!window.sortState[tabelaId]) window.sortState[tabelaId] = { campo: '', asc: true };

    if (window.sortState[tabelaId].campo === campo) {
        window.sortState[tabelaId].asc = !window.sortState[tabelaId].asc;
    } else {
        window.sortState[tabelaId].campo = campo;
        window.sortState[tabelaId].asc = true;
    }

    // Atualizar icones visuais
    if (thElement && thElement.parentElement) {
        const tr = thElement.parentElement;
        const allThs = tr.querySelectorAll('th.sortable');
        allThs.forEach(th => {
            const icon = th.querySelector('i') || th.querySelector('svg.lucide');
            if (icon) {
                const newIcon = document.createElement('i');
                newIcon.setAttribute('data-lucide', 'arrow-up-down');
                newIcon.className = "w-3 h-3 text-slate-400 group-hover:text-blue-500";
                icon.replaceWith(newIcon);
            }
        });
        const currentIcon = thElement.querySelector('i') || thElement.querySelector('svg.lucide');
        if (currentIcon) {
            const newIcon = document.createElement('i');
            newIcon.setAttribute('data-lucide', window.sortState[tabelaId].asc ? 'arrow-up' : 'arrow-down');
            newIcon.className = "w-3 h-3 text-slate-400 group-hover:text-blue-500";
            currentIcon.replaceWith(newIcon);
        }
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();

    let dataArray = [];
    if (tabelaId === 'pacientes') dataArray = (typeof pacientesFiltrados !== 'undefined' ? pacientesFiltrados : null) || (typeof todosPacientes !== 'undefined' ? todosPacientes : []);
    if (tabelaId === 'atendimentos') dataArray = (typeof atendimentosFiltrados !== 'undefined' ? atendimentosFiltrados : null) || (typeof todosAtendimentos !== 'undefined' ? todosAtendimentos : []);
    if (tabelaId === 'aniversariantes') dataArray = (typeof niverFiltrados !== 'undefined' ? niverFiltrados : null) || (typeof todosPacientes !== 'undefined' ? todosPacientes : []);
    if (tabelaId === 'campanhas') dataArray = (typeof campanhaPessoas !== 'undefined' ? campanhaPessoas : []);

    if (!dataArray || dataArray.length === 0) return;

    dataArray.sort((a, b) => {
        let valA = a[campo] || '';
        let valB = b[campo] || '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (campo.includes('data') || campo.includes('nascimento')) {
            // Converte YYYY-MM-DD para string pura (ja ordena certo). Se for DD/MM/YYYY, precisa converter
            if (typeof valA === 'string' && valA.includes('/')) valA = valA.split('/').reverse().join('-');
            if (typeof valB === 'string' && valB.includes('/')) valB = valB.split('/').reverse().join('-');
        }

        if (valA < valB) return window.sortState[tabelaId].asc ? -1 : 1;
        if (valA > valB) return window.sortState[tabelaId].asc ? 1 : -1;
        return 0;
    });

    if (tabelaId === 'pacientes') {
        if(window.paginacaoPacientes) window.paginacaoPacientes.dadosFiltrados = dataArray;
        if(typeof renderizarPaginaPacientes === 'function') renderizarPaginaPacientes();
    }
    if (tabelaId === 'atendimentos') {
        if(window.paginacaoAtendimentos) window.paginacaoAtendimentos.dadosFiltrados = dataArray;
        if(typeof renderizarPaginaAtendimentos === 'function') renderizarPaginaAtendimentos();
    }
    if (tabelaId === 'aniversariantes' && typeof renderizarTabelaAniversariantes === 'function') renderizarTabelaAniversariantes(dataArray);
    if (tabelaId === 'campanhas' && typeof window.renderizarTabelaListagem === 'function') window.renderizarTabelaListagem(dataArray);
};
