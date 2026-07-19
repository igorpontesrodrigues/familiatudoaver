/**
 * js/exporter.js
 * Lógica para exportação do banco de dados (Firebase) para arquivo Excel (.xlsx).
 */

async function exportarExcel() {
    const loading = document.getElementById('loading-export');
    if(loading) loading.classList.remove('hidden');
    
    try {
        // 1. Buscar todos os Pacientes
        const qPacientes = window.query(window.collection(window.db, "pacientes"));
        const snapPacientes = await window.getDocs(qPacientes);
        const pacientes = [];
        const pacientesMap = {}; // Para buscar o nome rapidamente ao exportar os atendimentos
        
        snapPacientes.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            pacientes.push(data);
            pacientesMap[data.cpf] = data.nome || data.apelido || 'Desconhecido';
        });

        // 2. Buscar todos os Atendimentos
        const qAtendimentos = window.query(window.collection(window.db, "atendimentos"));
        const snapAtendimentos = await window.getDocs(qAtendimentos);
        const atendimentos = [];
        
        snapAtendimentos.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            atendimentos.push(data);
        });

        // 3. Helpers de formatação (garantem que dados estejam padronizados no Excel)
        const formatarData = (isoStr) => {
            if(!isoStr) return '';
            try {
                const parts = isoStr.split('T')[0].split('-');
                if(parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                return isoStr;
            } catch(e) { return isoStr; }
        };

        const formatCPF = (val) => {
            if(!val) return '';
            val = String(val).replace(/\D/g, '');
            if(val.length === 11) return `${val.slice(0,3)}.${val.slice(3,6)}.${val.slice(6,9)}-${val.slice(9,11)}`;
            return val;
        };

        const formatTel = (val) => {
            if(!val) return '';
            val = String(val).replace(/\D/g, '');
            if(val.length === 0) return '';
            if(val.length <= 2) return `(${val}`;
            if(val.length <= 6) return `(${val.slice(0,2)}) ${val.slice(2)}`;
            if(val.length <= 10) return `(${val.slice(0,2)}) ${val.slice(2,6)}-${val.slice(6)}`;
            return `(${val.slice(0,2)}) ${val.slice(2,7)}-${val.slice(7)}`;
        };

        const formatCEP = (val) => {
            if(!val) return '';
            val = String(val).replace(/\D/g, '');
            if(val.length === 8) return `${val.slice(0,5)}-${val.slice(5)}`;
            return val;
        };

        const formatSUS = (val) => {
            if(!val) return '';
            val = String(val).replace(/\D/g, '');
            if(val.length === 15) return `${val.slice(0,3)} ${val.slice(3,7)} ${val.slice(7,11)} ${val.slice(11,15)}`;
            return val;
        };

        const formatTitulo = (val) => {
            if(!val) return '';
            val = String(val).replace(/\D/g, '');
            if(val.length === 12) return `${val.slice(0,4)} ${val.slice(4,8)} ${val.slice(8,12)}`;
            return val;
        };

        const formatRG = (val) => {
            if(!val) return '';
            let limpo = String(val).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            if(!limpo) return '';
            if(limpo.length > 0 && limpo.length <= 9) {
                limpo = limpo.padStart(9, '0');
                return `${limpo.slice(0,2)}.${limpo.slice(2,5)}.${limpo.slice(5,8)}-${limpo.slice(8,9)}`;
            }
            return val;
        };

        // Força célula como string no SheetJS para evitar Excel tratar como número
        const forcarTexto = (ws, dados, colNames) => {
            if(!ws || !dados || dados.length === 0) return;
            const headers = Object.keys(dados[0]);
            colNames.forEach(colName => {
                const colIdx = headers.indexOf(colName);
                if(colIdx < 0) return;
                const colLetter = XLSX.utils.encode_col(colIdx);
                for(let i = 0; i < dados.length; i++) {
                    const cellRef = colLetter + (i + 2); // +2: linha 1 = cabeçalho
                    if(ws[cellRef]) {
                        ws[cellRef].t = 's';
                        ws[cellRef].v = String(ws[cellRef].v || '');
                        ws[cellRef].w = ws[cellRef].v;
                        delete ws[cellRef].z;
                    }
                }
            });
        };

        // 4. Formatar Pacientes para Excel (Mapeamento amigável)
        const dadosPacientes = pacientes.map(p => ({
            "Nome Completo": p.nome || '',
            "Nome Social": p.nome_social || '',
            "Referência": p.apelido || '',
            "CPF": formatCPF(p.cpf),
            "RG": formatRG(p.rg),
            "Data Nasc.": formatarData(p.nascimento),
            "Idade": p.idade || '',
            "Sexo": p.sexo || '',
            "Telefone 1 (WhatsApp)": formatTel(p.tel1),
            "Telefone 2": formatTel(p.tel2),
            "Família": p.familia || '',
            "Cônjuge": p.conjuge || '',
            "Profissão": p.profissao || '',
            "Cargo Eclesiástico": p.cargo_eclesiastico || '',
            "Vínculos Familiares": p.parentes || '',
            "Nº Prontuário": p.prontuario || '',
            "Indicação (Liderança)": p.indicacao || '',
            "É Liderança?": String(p.lideranca || '').trim().toUpperCase() === 'SIM' ? 'SIM' : 'NÃO',
            "Filiação (Mãe/Pai)": p.filiacao || '',
            "Cartão SUS": formatSUS(p.sus),
            "Título de Eleitor": formatTitulo(p.titulo),
            "Zona Eleitoral": p.zona || '',
            "Seção Eleitoral": p.secao || '',
            "Situação Título": p.status_titulo || '',
            "Local de Votação": p.local_votacao || '',
            "Município": p.municipio || '',
            "Bairro": p.bairro || '',
            "Logradouro": p.logradouro || '',
            "Número": p.numero || '',
            "Tipo Residência": p.tipo_residencia || '',
            "Lote": p.lote || '',
            "Quadra": p.quadra || '',
            "CEP": formatCEP(p.cep),
            "Ponto de Referência": p.referencia || '',
            "Criado Em": formatarData(p.data_criacao)
        }));

        // 5. Formatar Atendimentos para Excel
        const dadosAtendimentos = atendimentos.map(a => ({
            "Nome Paciente": pacientesMap[a.cpf_paciente] || 'Munícipe Excluído',
            "CPF Paciente": formatCPF(a.cpf_paciente),
            "Data de Abertura": formatarData(a.data_abertura),
            "Status": a.status || '',
            "Especialidade / Pedido": a.especialidade || '',
            "Procedimento": a.procedimento || '',
            "Local do Atendimento": a.local || '',
            "Tipo de Serviço": a.tipo || '',
            "Médico / Profissional": a.medico || '',
            "UBS de Origem": a.ubs || '',
            "Data Marcada (Consulta)": formatarData(a.data_marcacao),
            "Data de Risco": formatarData(a.data_risco),
            "Nº Prontuário (Paciente)": a.prontuario || '',
            "Observações": a.observacao || ''
        }));

        // 6. Criar Workbook e Worksheets
        const wb = XLSX.utils.book_new();
        
        const wsPacientes = XLSX.utils.json_to_sheet(dadosPacientes);
        // Força colunas críticas como TEXTO para não quebrar no Excel
        forcarTexto(wsPacientes, dadosPacientes, [
            'CPF', 'RG', 'Telefone 1 (WhatsApp)', 'Telefone 2',
            'Cartão SUS', 'Título de Eleitor', 'Zona Eleitoral',
            'Seção Eleitoral', 'CEP', 'Nº Prontuário'
        ]);
        XLSX.utils.book_append_sheet(wb, wsPacientes, "Munícipes");
        
        const wsAtendimentos = XLSX.utils.json_to_sheet(dadosAtendimentos);
        forcarTexto(wsAtendimentos, dadosAtendimentos, ['CPF Paciente', 'Nº Prontuário (Paciente)']);
        XLSX.utils.book_append_sheet(wb, wsAtendimentos, "Atendimentos");

        // 7. Configurar largura das colunas para ficar organizado
        const wscolsPacientes = [
            {wch: 35}, {wch: 20}, {wch: 15}, {wch: 16}, {wch: 13}, {wch: 12}, {wch: 6}, {wch: 10}, 
            {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 16}, {wch: 22}, {wch: 30},
            {wch: 14}, {wch: 22}, {wch: 12}, {wch: 22}, {wch: 20}, {wch: 16}, {wch: 10},
            {wch: 10}, {wch: 16}, {wch: 28}, {wch: 20}, {wch: 20}, {wch: 35}, {wch: 12}, {wch: 25}, {wch: 14}
        ];
        wsPacientes['!cols'] = wscolsPacientes;

        const wscolsAtendimentos = [
            {wch: 35}, {wch: 16}, {wch: 15}, {wch: 15}, {wch: 30}, {wch: 30}, 
            {wch: 25}, {wch: 20}, {wch: 25}, {wch: 25}, {wch: 15}, {wch: 15}, 
            {wch: 15}, {wch: 40}
        ];
        wsAtendimentos['!cols'] = wscolsAtendimentos;

        // 8. Salvar o arquivo
        const dataAtual = new Date();
        const strData = `${dataAtual.getFullYear()}${(dataAtual.getMonth()+1).toString().padStart(2,'0')}${dataAtual.getDate().toString().padStart(2,'0')}`;
        
        XLSX.writeFile(wb, `Backup_Connecta_${strData}.xlsx`);
        
        if(loading) loading.classList.add('hidden');
        showModalAlert("Exportação concluída com sucesso! Verifique a pasta de downloads do seu navegador.");

    } catch (e) {
        console.error("Erro na exportação:", e);
        if(loading) loading.classList.add('hidden');
        showModalAlert("Ocorreu um erro ao tentar exportar os dados. Tente novamente.");
    }
}

// ============================================================================
// RELATÓRIO DE PENDÊNCIAS PARA PARCEIRO
// ============================================================================
async function exportarRelatorioPendencias() {
    const btn = document.getElementById('btn-relatorio-pendencias');
    const originalText = btn ? btn.innerHTML : '';
    if(btn) btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 inline animate-spin"></i> Gerando...';

    try {
        // 1. Buscar atendimentos e pacientes simultaneamente
        const [snapAt, snapPac] = await Promise.all([
            window.getDocs(window.collection(window.db, "atendimentos")),
            window.getDocs(window.collection(window.db, "pacientes"))
        ]);

        const pacientesMap = {};
        snapPac.forEach(doc => {
            const d = doc.data();
            pacientesMap[d.cpf] = d.nome || d.apelido || 'Desconhecido';
        });

        const hoje = new Date();
        hoje.setHours(0,0,0,0);

        const formatarData = (isoStr) => {
            if(!isoStr) return '';
            try {
                const parts = isoStr.split('T')[0].split('-');
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            } catch(e) { return isoStr; }
        };

        const calcDias = (isoStr) => {
            if(!isoStr) return '-';
            try {
                const inicio = new Date(isoStr.split('T')[0]);
                const diff = Math.floor((hoje - inicio) / (1000 * 60 * 60 * 24));
                return diff >= 0 ? diff : 0;
            } catch(e) { return '-'; }
        };

        // 2. Filtrar apenas PENDENTES
        const pendentes = [];
        snapAt.forEach(doc => {
            const at = doc.data();
            at.id = doc.id;
            if(at.status === 'PENDENTE') pendentes.push(at);
        });

        if(pendentes.length === 0) {
            showModalAlert("Não há atendimentos PENDENTES no momento. Nada a exportar.");
            if(btn) btn.innerHTML = originalText;
            if(typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        // 3. Ordenar por data de abertura (mais antigo primeiro)
        pendentes.sort((a, b) => {
            const da = a.data_abertura || '';
            const db2 = b.data_abertura || '';
            return da < db2 ? -1 : da > db2 ? 1 : 0;
        });

        // 4. Lista Detalhada (aba principal)
        const listaDetalhada = pendentes.map((at, idx) => ({
            "#": idx + 1,
            "Data Inicial (Entrada)": formatarData(at.data_abertura),
            "Dias em Aberto": calcDias(at.data_abertura),
            "Data do Risco": formatarData(at.data_risco),
            "Nome do Munícipe": pacientesMap[at.cpf_paciente] || at.nome_paciente || 'Não encontrado',
            "Tipo de Serviço": at.tipo || '',
            "Especialidade": at.especialidade || '',
            "Procedimento / Exame": at.procedimento || '',
            "Local": at.local || '',
            "Parceiro / Médico": at.parceiro || at.medico || '',
            "Observações": at.obs_atendimento || at.observacao || ''
        }));

        // 5. Resumo por Procedimento/Exame (com totais)
        const contagens = {};
        pendentes.forEach(at => {
            const chave = (at.procedimento || at.especialidade || at.tipo || 'NÃO INFORMADO').trim().toUpperCase();
            if(!contagens[chave]) contagens[chave] = { qtd: 0, maisAntigo: null };
            contagens[chave].qtd++;
            if(!contagens[chave].maisAntigo || (at.data_abertura && at.data_abertura < contagens[chave].maisAntigo)) {
                contagens[chave].maisAntigo = at.data_abertura;
            }
        });

        const resumoPorProcedimento = Object.entries(contagens)
            .sort((a, b) => b[1].qtd - a[1].qtd)
            .map(([nome, dados]) => ({
                "Procedimento / Exame": nome,
                "Total de Pendências": dados.qtd,
                "Pendência Mais Antiga (Data)": formatarData(dados.maisAntigo),
                "Há Quantos Dias": calcDias(dados.maisAntigo)
            }));

        // Linha de total geral em negrito (última linha)
        resumoPorProcedimento.push({
            "Procedimento / Exame": "TOTAL GERAL",
            "Total de Pendências": pendentes.length,
            "Pendência Mais Antiga (Data)": '',
            "Há Quantos Dias": ''
        });

        // 6. Resumo Executivo (capa)
        const maisAntigo = pendentes[0];
        const diasMaisAntigo = calcDias(maisAntigo?.data_abertura);
        const somasDias = pendentes.reduce((acc, at) => {
            const d = calcDias(at.data_abertura);
            return acc + (d === '-' ? 0 : Number(d));
        }, 0);
        const mediaDias = Math.round(somasDias / pendentes.length);

        const resumoExecutivo = [
            { "RELATÓRIO DE PENDÊNCIAS": "SISTEMA CONNECTA", "": "" },
            { "RELATÓRIO DE PENDÊNCIAS": `Data de Geração: ${hoje.toLocaleDateString('pt-BR')}`, "": "" },
            { "RELATÓRIO DE PENDÊNCIAS": "", "": "" },
            { "RELATÓRIO DE PENDÊNCIAS": "INDICADOR", "": "VALOR" },
            { "RELATÓRIO DE PENDÊNCIAS": "Total de Atendimentos Pendentes", "": pendentes.length },
            { "RELATÓRIO DE PENDÊNCIAS": "Média de Dias em Aberto", "": `${mediaDias} dias` },
            { "RELATÓRIO DE PENDÊNCIAS": "Pendência Mais Antiga — Data de Entrada", "": formatarData(maisAntigo?.data_abertura) },
            { "RELATÓRIO DE PENDÊNCIAS": "Pendência Mais Antiga — Dias em Aberto", "": `${diasMaisAntigo} dias` },
            { "RELATÓRIO DE PENDÊNCIAS": "Tipos Diferentes de Procedimento/Exame", "": Object.keys(contagens).length },
        ];

        // 7. Montar workbook com 3 abas
        const wb = XLSX.utils.book_new();

        const wsResumo = XLSX.utils.json_to_sheet(resumoExecutivo);
        wsResumo['!cols'] = [{wch: 48}, {wch: 22}];
        XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo Executivo");

        const wsProcedimento = XLSX.utils.json_to_sheet(resumoPorProcedimento);
        wsProcedimento['!cols'] = [{wch: 38}, {wch: 22}, {wch: 30}, {wch: 20}];
        XLSX.utils.book_append_sheet(wb, wsProcedimento, "Por Procedimento");

        const wsDetalhe = XLSX.utils.json_to_sheet(listaDetalhada);
        wsDetalhe['!cols'] = [
            {wch: 5}, {wch: 30}, {wch: 25}, {wch: 20}, {wch: 38},
            {wch: 22}, {wch: 25}, {wch: 25}, {wch: 22},
            {wch: 25}, {wch: 40}
        ];
        XLSX.utils.book_append_sheet(wb, wsDetalhe, "Lista Detalhada");

        // 8. Salvar
        const strData = hoje.toISOString().split('T')[0].replace(/-/g,'');
        XLSX.writeFile(wb, `Relatorio_Pendencias_${strData}.xlsx`);

        showModalAlert(`Relatório gerado com sucesso!\n\n${pendentes.length} pendências exportadas em 3 abas:\n- Resumo Executivo\n- Por Procedimento (com totais)\n- Lista Detalhada\n\nVerifique a pasta de downloads.`);

    } catch(e) {
        console.error("Erro ao gerar relatório de pendências:", e);
        showModalAlert("Ocorreu um erro ao gerar o relatório. Tente novamente.");
    } finally {
        if(btn) btn.innerHTML = originalText;
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// ============================================================================
// RELATÓRIO DE PENDÊNCIAS EM PDF (COM FILTRO E ORDENAÇÃO)
// ============================================================================
async function gerarRelatorioPendenciasPDF() {
    const btn = document.getElementById('btn-relatorio-pendencias');
    const originalHTML = btn ? btn.innerHTML : '';
    if(btn) { btn.disabled = true; btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 inline animate-spin"></i> Gerando PDF...'; if(typeof lucide !== 'undefined') lucide.createIcons(); }

    try {
        const [snapAt, snapPac] = await Promise.all([
            window.getDocs(window.collection(window.db, 'atendimentos')),
            window.getDocs(window.collection(window.db, 'pacientes'))
        ]);

        const pacientesMap = {};
        snapPac.forEach(doc => {
            const d = doc.data();
            pacientesMap[d.cpf] = d.nome || d.apelido || 'Desconhecido';
        });

        const hoje = new Date();
        hoje.setHours(0,0,0,0);

        const fmtData = (isoStr) => {
            if(!isoStr) return '-';
            try { const p = isoStr.split('T')[0].split('-'); return `${p[2]}/${p[1]}/${p[0]}`; }
            catch(e) { return isoStr; }
        };

        const calcDias = (isoStr) => {
            if(!isoStr) return null;
            try {
                const inicio = new Date(isoStr.split('T')[0]);
                const diff = Math.floor((hoje - inicio) / 86400000);
                return diff >= 0 ? diff : 0;
            } catch(e) { return null; }
        };

        // 1. Obter opções de filtro e ordenação
        const filtroEsp = (document.getElementById('pdf-pendencias-filtro-esp')?.value || '').trim().toUpperCase();
        const ordemLista = document.getElementById('pdf-pendencias-ordem')?.value || 'especialidade';

        // 2. Filtrar pendentes
        const pendentes = [];
        snapAt.forEach(doc => {
            const at = doc.data(); at.id = doc.id;
            if(at.status === 'PENDENTE') {
                if(filtroEsp && filtroEsp !== "") {
                    const esp = (at.especialidade || '').trim().toUpperCase();
                    const proc = (at.procedimento || '').trim().toUpperCase();
                    const tipo = (at.tipo || '').trim().toUpperCase();
                    
                    let match = false;
                    if(filtroEsp === 'IMAGEM') {
                        // Agrupa exames de imagem
                        match = esp.includes('IMAG') || proc.includes('IMAG') || tipo.includes('IMAG') ||
                                proc.includes('USG') || proc.includes('TC') || proc.includes('RNM') || 
                                proc.includes('RAIO') || proc.includes('MAMOGRAFIA') || proc.includes('DOPLLER') || 
                                proc.includes('DENSITOMETRIA') || proc.includes('ECOCARDIOGRAMA') || proc.includes('HOLTER') || proc.includes('MAPA');
                    } else if(filtroEsp === 'OFTALMOLOGISTA') {
                        match = esp.includes('OFTALM') || proc.includes('OFTALM') || tipo.includes('OFTALM');
                    } else if(filtroEsp === 'CIRURGIÃO') {
                        match = esp.includes('CIRURG') || proc.includes('CIRURG') || tipo.includes('CIRURG');
                    } else {
                        match = esp.includes(filtroEsp) || proc.includes(filtroEsp) || tipo.includes(filtroEsp);
                    }
                    if(!match) return;
                }
                pendentes.push(at);
            }
        });

        if(pendentes.length === 0) {
            showModalAlert(filtroEsp ? `Não há atendimentos PENDENTES para o filtro: ${filtroEsp}` : "Não há atendimentos PENDENTES no momento.");
            return;
        }

        // 3. Ordenar a lista
        if(ordemLista === 'especialidade') {
            // Ordem Alfabética por Especialidade/Procedimento e depois por data mais antiga
            pendentes.sort((a, b) => {
                const espA = (a.procedimento || a.especialidade || a.tipo || 'Z_OUTROS').trim().toUpperCase();
                const espB = (b.procedimento || b.especialidade || b.tipo || 'Z_OUTROS').trim().toUpperCase();
                if(espA !== espB) return espA.localeCompare(espB, 'pt-BR');
                return (a.data_abertura || '') < (b.data_abertura || '') ? -1 : 1;
            });
        } else if(ordemLista === 'antigo') {
            pendentes.sort((a, b) => (a.data_abertura || '') < (b.data_abertura || '') ? -1 : 1);
        } else if(ordemLista === 'recente') {
            pendentes.sort((a, b) => (a.data_abertura || '') > (b.data_abertura || '') ? -1 : 1);
        } else if(ordemLista === 'paciente') {
            pendentes.sort((a, b) => {
                const nomA = (pacientesMap[a.cpf_paciente] || a.nome_paciente || '').trim().toUpperCase();
                const nomB = (pacientesMap[b.cpf_paciente] || b.nome_paciente || '').trim().toUpperCase();
                return nomA.localeCompare(nomB, 'pt-BR');
            });
        }

        // 4. Resumo por procedimento
        const contagens = {};
        pendentes.forEach(at => {
            const chave = (at.procedimento || at.especialidade || at.tipo || 'NÃO INFORMADO').trim().toUpperCase();
            if(!contagens[chave]) contagens[chave] = { qtd: 0, maisAntigo: null };
            contagens[chave].qtd++;
            if(!contagens[chave].maisAntigo || (at.data_abertura && at.data_abertura < contagens[chave].maisAntigo))
                contagens[chave].maisAntigo = at.data_abertura;
        });
        
        // Se a ordem for por especialidade, ordena o resumo em ordem alfabética também; senão, por maior quantidade
        const resumoOrdenado = Object.entries(contagens).sort((a,b) => {
            if(ordemLista === 'especialidade') return a[0].localeCompare(b[0], 'pt-BR');
            return b[1].qtd - a[1].qtd;
        });

        // 5. Estatísticas
        const somasDias = pendentes.reduce((acc, at) => { const d = calcDias(at.data_abertura); return acc + (d !== null ? d : 0); }, 0);
        const mediaDias = Math.round(somasDias / pendentes.length);
        const diasMaisAntigo = calcDias(pendentes.reduce((min, p) => (!min || (p.data_abertura && p.data_abertura < min) ? p.data_abertura : min), null)) ?? '-';

        // ── CORES ──
        const LARANJA   = [220, 88,  42];
        const CINZA_ESC = [30,  41,  59];
        const CINZA_MED = [100, 116, 139];
        const BRANCO    = [255, 255, 255];
        const VERDE     = [21,  128, 61];
        const VERMELHO  = [185, 28,  28];

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const PW = 210;
        const M  = 14;

        // ── PÁGINA 1: CAPA + RESUMO POR PROCEDIMENTO ──────────────
        doc.setFillColor(...LARANJA);
        doc.rect(0, 0, PW, 44, 'F');
        doc.setFillColor(...CINZA_ESC);
        doc.rect(0, 44, PW, 5, 'F');

        doc.setTextColor(...BRANCO);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('RELATÓRIO DE PENDÊNCIAS', M, 16);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Sistema Connecta · CRM', M, 24);
        
        let subtitulo = `Gerado em: ${hoje.toLocaleDateString('pt-BR')}  |  ${pendentes.length} pendência(s)`;
        if(filtroEsp) subtitulo += `  |  Filtro: ${filtroEsp}`;
        
        let textoOrdem = "Ordem: Por Especialidade (Alfabética)";
        if(ordemLista === 'antigo') textoOrdem = "Ordem: Mais Antigos Primeiro";
        if(ordemLista === 'recente') textoOrdem = "Ordem: Mais Recentes Primeiro";
        if(ordemLista === 'paciente') textoOrdem = "Ordem: Munícipe (Alfabética A-Z)";
        
        doc.setFontSize(8.5);
        doc.text(`${subtitulo}  |  ${textoOrdem}`, M, 33);
        if(filtroEsp === 'IMAGEM') {
            doc.setFontSize(7.5);
            doc.text("Exames de Imagem contemplados: USG, TC, RNM, Raio-X, Mamografia, Doppler, etc.", M, 39);
        }

        // Cards indicadores
        let y = 57;
        const cardW = (PW - M * 2 - 6) / 3;
        const drawCard = (x, cy, titulo, valor, cor) => {
            doc.setFillColor(245, 248, 250);
            doc.roundedRect(x, cy, cardW, 24, 3, 3, 'F');
            doc.setFillColor(...cor);
            doc.roundedRect(x, cy, 3.5, 24, 1.5, 1.5, 'F');
            doc.setTextColor(...CINZA_MED);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text(titulo.toUpperCase(), x + 7, cy + 8);
            doc.setTextColor(...CINZA_ESC);
            doc.setFontSize(15);
            doc.setFont('helvetica', 'bold');
            doc.text(String(valor), x + 7, cy + 19);
        };
        drawCard(M,                   y, 'Total de Pendências',       pendentes.length,          VERMELHO);
        drawCard(M + cardW + 3,       y, 'Média de Dias em Aberto', `${mediaDias} dias`,        LARANJA);
        drawCard(M + (cardW+3) * 2,   y, 'Pendência Mais Antiga',     `${diasMaisAntigo} dias`,  CINZA_MED);

        // Título Tabela 1
        y += 33;
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...CINZA_ESC);
        doc.text('RESUMO POR PROCEDIMENTO / EXAME', M, y);
        y += 3;

        const resumoRows = resumoOrdenado.map(([nome, dados]) => [
            nome,
            dados.qtd,
            fmtData(dados.maisAntigo),
            calcDias(dados.maisAntigo) !== null ? `${calcDias(dados.maisAntigo)} dias` : '-'
        ]);
        resumoRows.push(['TOTAL GERAL', pendentes.length, '', '']);

        doc.autoTable({
            startY: y,
            head: [['Procedimento / Exame', 'Total', 'Mais Antiga', 'Dias Parado']],
            body: resumoRows,
            styles: { fontSize: 8.5, cellPadding: 3, font: 'helvetica', textColor: CINZA_ESC },
            headStyles: { fillColor: LARANJA, textColor: BRANCO, fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 97 },
                1: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
                2: { cellWidth: 38, halign: 'center' },
                3: { cellWidth: 30, halign: 'center' }
            },
            didParseCell: (data) => {
                if(data.row.index === resumoRows.length - 1) {
                    data.cell.styles.fillColor = CINZA_ESC;
                    data.cell.styles.textColor = BRANCO;
                    data.cell.styles.fontStyle = 'bold';
                }
            },
            margin: { left: M, right: M },
            theme: 'grid'
        });

        // ── PÁGINA 2: LISTA DETALHADA ──────────────────────────────
        doc.addPage();

        doc.setFillColor(...CINZA_ESC);
        doc.rect(0, 0, PW, 14, 'F');
        doc.setTextColor(...BRANCO);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('LISTA DETALHADA DE PENDÊNCIAS', M, 9);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(`${pendentes.length} registros  ·  ${textoOrdem}`, PW - M, 9, { align: 'right' });

        const detalheRows = pendentes.map((at, idx) => {
            const dias = calcDias(at.data_abertura);
            return [
                idx + 1,
                fmtData(at.data_abertura),
                dias !== null ? `${dias}d` : '-',
                fmtData(at.data_risco),
                pacientesMap[at.cpf_paciente] || at.nome_paciente || '-',
                (at.procedimento || at.especialidade || at.tipo || '-').toUpperCase(),
                at.local || '-',
                at.obs_atendimento || at.observacao || ''
            ];
        });

        doc.autoTable({
            startY: 18,
            head: [['#', 'Data Entrada', 'Dias', 'Data Risco', 'Munícipe', 'Procedimento / Exame', 'Local', 'Obs.']],
            body: detalheRows,
            styles: { fontSize: 7, cellPadding: 2, font: 'helvetica', textColor: CINZA_ESC, overflow: 'linebreak' },
            headStyles: { fillColor: CINZA_ESC, textColor: BRANCO, fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 7,  halign: 'center' },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 11, halign: 'center', fontStyle: 'bold' },
                3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
                4: { cellWidth: 36 },
                5: { cellWidth: 36 },
                6: { cellWidth: 24 },
                7: { cellWidth: 28 }
            },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            didParseCell: (data) => {
                if(data.column.index === 2 && data.section === 'body') {
                    const v = parseInt(data.cell.raw);
                    if(!isNaN(v) && v > 60)      { data.cell.styles.textColor = VERMELHO; data.cell.styles.fontStyle = 'bold'; }
                    else if(!isNaN(v) && v > 30) { data.cell.styles.textColor = LARANJA;  data.cell.styles.fontStyle = 'bold'; }
                    else if(!isNaN(v))           { data.cell.styles.textColor = VERDE; }
                }
                if(data.column.index === 3 && data.section === 'body' && data.cell.raw !== '-') {
                    const partes = data.cell.raw.split('/');
                    if(partes.length === 3) {
                        const dRisco = new Date(`${partes[2]}-${partes[1]}-${partes[0]}T00:00:00`);
                        const h = new Date(); h.setHours(0,0,0,0);
                        const diffDias = Math.ceil((dRisco - h) / (1000 * 60 * 60 * 24));
                        if(diffDias < 0)      { data.cell.styles.textColor = VERMELHO; data.cell.styles.fontStyle = 'bold'; }
                        else if(diffDias <= 30) { data.cell.styles.textColor = LARANJA;  data.cell.styles.fontStyle = 'bold'; }
                    }
                }
            },
            margin: { left: M, right: M },
            theme: 'grid'
        });

        // ── RODAPÉ em todas as páginas ─────────────────────────────
        const totalPaginas = doc.internal.getNumberOfPages();
        for(let i = 1; i <= totalPaginas; i++) {
            doc.setPage(i);
            doc.setFillColor(...CINZA_ESC);
            doc.rect(0, 287, PW, 10, 'F');
            doc.setTextColor(...BRANCO);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text('Sistema Connecta · Documento Confidencial', M, 293);
            doc.text(`Página ${i} de ${totalPaginas}`, PW - M, 293, { align: 'right' });
        }

        // ── SALVAR ─────────────────────────────────────────────────
        const strData = hoje.toISOString().split('T')[0].replace(/-/g,'');
        let nomeArquivo = `Relatorio_Pendencias_${strData}.pdf`;
        if(filtroEsp) nomeArquivo = `Relatorio_Pendencias_${filtroEsp}_${strData}.pdf`;
        
        doc.save(nomeArquivo);
        showModalAlert(`PDF gerado com sucesso!\n\n${pendentes.length} pendência(s) exportada(s) em ${totalPaginas} página(s).\n\nFiltro: ${filtroEsp || 'Todos'}\nOrdem: ${textoOrdem}`);

    } catch(e) {
        console.error('Erro ao gerar PDF:', e);
        showModalAlert('Erro ao gerar o PDF. Verifique o console.\n\n' + e.message);
    } finally {
        if(btn) { btn.disabled = false; btn.innerHTML = originalHTML; if(typeof lucide !== 'undefined') lucide.createIcons(); }
    }
}