const DB_SEED = {
  "CATEGORIAS": [
    "Consulta", "Exame", "Cirurgia", "Procedimento", "Internação", "Medicamento", "Tratamento", "Reabilitação", "TFD (Tratamento Fora do Domicílio)", "Terapia",
    "JURIDICO", "SAUDE", "SERVIÇO", "SOCIAL"
  ],
  "ATENDIMENTO": [
    "CONSULTA AGENDADA", "CONSULTA EMERGENCIAL", "CONSULTA PRÉ OPERATORIA", "ENCAMINHAMENTOS", "EXAMES", "INTERNAÇÃO CIRURGICA", "ORIENTAÇÕES", "PROCEDIMENTOS"
  ],
  "ESPECIALIDADE": [
    "Acupuntura", "Alergia e Imunologia", "Angiologia", "Cardiologia", "Cirurgia Cardíaca", "Cirurgia Geral", "Cirurgia Pediátrica", "Cirurgia Plástica", "Cirurgia Torácica", "Cirurgia Vascular", "Clínica Geral", "Coloproctologia", "Dermatologia", "Endocrinologia", "Endocrinologia Pediátrica", "Fisiatria", "Fisioterapia", "Fonoaudiologia", "Gastroenterologia", "Geriatria", "Ginecologia", "Hematologia", "Hepatologia", "Infectologia", "Mastologia", "Medicina da Dor", "Medicina do Trabalho", "Nefrologia", "Neurologia", "Neurocirurgia", "Nutrição", "Obstetrícia", "Oftalmologia", "Oncologia", "Oncologia Pediátrica", "Ortopedia", "Otorrinolaringologia", "Pediatria", "Pneumologia", "Proctologia", "Psicologia", "Psiquiatria", "Radioterapia", "Reumatologia", "Serviço Social", "Terapia Ocupacional", "Urologia",
    "GINECOLOGIA", "ORTOPEDISTA", "CLINICO GERAL", "PEDIATRA", "CIRURGIÃO INFANTIL", "CIRURGIÃO ADULTO", "IMAGENS"
  ],
  "PROCEDIMENTO_EXAMES": [
    "Angiorressonância", "Arteriografia", "Densitometria Óssea", "Mamografia", "Ressonância Magnética", "Tomografia Computadorizada", "Ultrassonografia", "Raio-X", "PET Scan", "Cintilografia",
    "Colonoscopia", "Endoscopia", "Ecocardiograma", "Eletrocardiograma", "Eletroneuromiografia", "Holter 24h", "MAPA 24h", "Teste Ergométrico", "Cateterismo Cardíaco", "Broncoscopia", "Videolaringoscopia",
    "Exames de Sangue", "Exames Hormonais", "Exames Genéticos", "Biópsias", "Anatomopatológico",
    "Infiltração", "Bloqueio Neurológico", "Punção", "Hemodiálise", "Quimioterapia", "Radioterapia", "Fisioterapia", "Terapia Ocupacional", "Fonoaudiologia",
    "[CIRURGIA] Bariátrica", "[CIRURGIA] Catarata", "[CIRURGIA] Cardíaca", "[CIRURGIA] Hérnia", "[CIRURGIA] Vesícula", "[CIRURGIA] Histerectomia", "[CIRURGIA] Ortopédica", "[CIRURGIA] Coluna", "[CIRURGIA] Joelho", "[CIRURGIA] Quadril", "[CIRURGIA] Ombro", "[CIRURGIA] Vascular", "[CIRURGIA] Neurocirurgia", "[CIRURGIA] Prostatectomia", "[CIRURGIA] Oncológica", "[CIRURGIA] Oftalmológica", "[CIRURGIA] Geral", "[CIRURGIA] Plástica Reparadora",
    "USG", "TC", "RNM", "ECG", "DOPLLER", "OFTALMOLÓGICOS"
  ],
  "TIPOS_EXAME": [
    "RNM CRANIO", "RNM PELVE", "TC FACE", "OCT", "MAPEAMENTO RETINA"
  ],
  "PRIORIDADE": [
    "Baixa", "Média", "Alta", "Urgente", "Acamado", "Cadeirante", "Pessoa com Deficiência", "Gestante", "Idoso", "Criança", "Paciente Oncológico", "Doença Rara", "Alto Risco", "Judicializado", "Vulnerabilidade Social", "Beneficiário de Programa Social"
  ],
  "STATUS_ATENDIMENTO": [
    "Recebido", "Em Análise", "Encaminhado", "Aguardando Vaga", "Aguardando Retorno", "Agendado", "Em Tratamento", "Resolvers", "Resolvido", "Indeferido", "Cancelado"
  ],
  "STATUS_TITULO": [
    "REGULAR", "CANCELADO", "SUSPENSO", "NÃO POSSUI"
  ],
  "TIPOS_SERVICO": [
    "TROCA DE LÂMPADA", "COLETA DE ENTULHO", "CAPINA/ROÇADA", "TAPA BURACO", "OUTROS"
  ]
};

window.seedInitialData = async function(silent = false) {
    console.log("Iniciando seedInitialData via botão ou auto...");
    localStorage.setItem('seed_run', 'false'); // reset the local storage just in case
    if(!window.db) {
        if(!silent) alert("Firebase DB não carregado!");
        return;
    }
    try {
        if(!silent && typeof showMessage === 'function') showMessage('Iniciando injeção de dados. Por favor, aguarde...', 'info');
        console.log("Iniciando seed de dados oficiais...");
        let totalAdded = 0;
        for (let chave of Object.keys(DB_SEED)) {
            const q = window.query(window.collection(window.db, 'config_selects'), window.where('chave', '==', chave));
            const snap = await window.getDocs(q);
            
            const inDb = new Set();
            snap.forEach(d => { if(d.data().valor) inDb.add(d.data().valor.toUpperCase().trim()); });
            
            let added = 0;
            for (let val of DB_SEED[chave]) {
                const normVal = String(val).toUpperCase().trim();
                if (!inDb.has(normVal)) {
                    await window.addDoc(window.collection(window.db, 'config_selects'), {
                        chave: chave,
                        valor: normVal,
                        criacao: new Date().toISOString()
                    });
                    added++;
                    totalAdded++;
                }
            }
            if(added > 0) {
                console.log(`[SEED] ${chave}: Adicionados ${added} novos itens oficiais.`);
            }
        }
        console.log("Seed finalizado com sucesso!");
        if(!silent && typeof showMessage === 'function') showMessage('Listas iniciais inseridas com sucesso! Recarregando a página...', 'success');
        
        // Dispara extração automática de dados do histórico se não rodou nesta versão
        await window.extrairDadosParaListas(true);

        if(!silent || totalAdded > 0) {
            setTimeout(() => window.location.reload(), 2000);
        }
    } catch(e) {
        console.error("Erro no seed:", e);
        if(!silent && typeof showModalAlert === 'function') showModalAlert('Erro ao inserir: ' + e.message);
    }
}


window.extrairDadosParaListas = async function(silent = false) {
    try {
        if(!window.db) return;
        if(!silent && typeof showMessage === 'function') showMessage('Extraindo dados antigos para listas genéricas. Aguarde...', 'info');
        
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
            if(normVal === '' || normVal === '-' || normVal === 'SELECIONE...' || normVal === 'NÃO' || normVal === 'SIM' || normVal === 'OUTROS') return;
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
            if (doc.data().indicacao) await addIfNew('LIDERANCA', doc.data().indicacao);
        }

        // 3. Atendimentos (LOCAL, PARCEIRO, ESPECIALIDADE, PROCEDIMENTO, CATEGORIAS, ATENDIMENTO)
        const snapAtend = await window.getDocs(window.collection(window.db, 'atendimentos'));
        for(let doc of snapAtend.docs) {
            await addIfNew('LOCAL', doc.data().local);
            await addIfNew('PARCEIRO', doc.data().parceiro);
            await addIfNew('ESPECIALIDADE', doc.data().especialidade);
            await addIfNew('PROCEDIMENTO_EXAMES', doc.data().procedimento);
            await addIfNew('CATEGORIAS', doc.data().tipo_servico);
            await addIfNew('ATENDIMENTO', doc.data().tipo);
            if (doc.data().indicacao) await addIfNew('LIDERANCA', doc.data().indicacao);
        }

        // 4. Serviços Públicos (TIPOS_SERVICO)
        try {
            const snapServ = await window.getDocs(window.collection(window.db, 'servicos_publicos'));
            for(let doc of snapServ.docs) {
                await addIfNew('TIPOS_SERVICO', doc.data().tipo_servico);
            }
        } catch(e) {}

        if(!silent && typeof showMessage === 'function') showMessage('Extração concluída com sucesso! Recarregando...', 'success');
        if(!silent) setTimeout(() => window.location.reload(), 2000);
    } catch(e) {
        console.error(e);
        if(!silent && typeof showModalAlert === 'function') showModalAlert('Erro ao extrair: ' + e.message);
    }
};



window.limparDuplicadas = async function() {
  if(!confirm('Deseja limpar itens duplicados nas listas?')) return;
  try {
    if(typeof showMessage === 'function') showMessage('Limpando duplicadas. Aguarde...', 'info');
    const snap = await window.getDocs(window.collection(window.db, 'config_selects'));
    const unicos = new Set();
    let removidos = 0;
    for(let doc of snap.docs) {
      const d = doc.data();
      const ch = String(d.chave || d.tipo || '').trim().toUpperCase();
      const val = String(d.valor || d.nome || '').trim().toUpperCase();
      if(!ch || !val) continue;
      const hash = ch + '_' + val;
      if(unicos.has(hash)) {
        await window.deleteDoc(doc.ref);
        removidos++;
      } else {
        unicos.add(hash);
      }
    }
    if(typeof showMessage === 'function') showMessage(`Limpeza concluída! ${removidos} itens duplicados removidos.`, 'success');
    if(typeof carregarListaAdmin === 'function') carregarListaAdmin();
  } catch(e) {
    alert('Erro: ' + e.message);
  }
};

// Auto-run recuperação 1 vez por navegador na versão 6 para garantir restauração dos itens
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.auth && window.auth.currentUser && localStorage.getItem('recovery_v6_run') !== 'true') {
            console.log("Iniciando auto-recuperação de opções do histórico e padrões...");
            localStorage.setItem('recovery_v6_run', 'true');
            if (typeof window.seedInitialData === 'function') {
                window.seedInitialData(true);
            }
        }
    }, 4000);
});
