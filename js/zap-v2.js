const templateZapDefault = `✨ CONFIRMAÇÃO DE AGENDAMENTO ✨

Bom dia !!

Me chamo Simone e sou da equipe Connecta.

Estamos entrando em contato para confirmar o agendamento da sua visita, conforme abaixo:

🗳️ *Data:* {DATA}
⏰ *Horário:* {HORA}

⚠️Caso tenha alguma desistência , estaremos avisando 

📍 Endereço: Rua Heloísa, nº 22

🚨 ATENÇÃO 🚨
Os atendimentos devem ser agendados exclusivamente pelo número:
📱 (21) 99250-8080
👉 Coordenação Connecta`;

window.abrirModalZapConfirmacao = function() {
    if (typeof histPacienteAtual === 'undefined' || !histPacienteAtual) {
        if(typeof showModalAlert === 'function') showModalAlert("Selecione um munícipe primeiro.");
        return;
    }

    
    // Resetar campos
    const inputData = document.getElementById('zap-data');
    const inputHora = document.getElementById('zap-hora');
    
    // Tenta pegar a data de marcação do primeiro atendimento pendente, se houver
    let dataMarcada = "";
    if (typeof histAtendimentos !== 'undefined' && histAtendimentos && histAtendimentos.length > 0) {
        // Pega o mais recente que não esteja concluído
        const pendentes = histAtendimentos.filter(a => a.status !== 'CONCLUIDO');
        if (pendentes.length > 0) {
            const at = pendentes[0];
            if (at.data_marcacao) {
                // Formata de YYYY-MM-DD para DD/MM
                const parts = at.data_marcacao.split('-');
                if(parts.length === 3) dataMarcada = parts[2] + '/' + parts[1];
            }
        }
    }
    
    inputData.value = dataMarcada;
    inputHora.value = "";
    
    atualizarTextoZap();
    
    document.getElementById('modal-zap-confirmacao').classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
};

window.atualizarTextoZap = function() {
    const dataVal = document.getElementById('zap-data').value || "...";
    const horaVal = document.getElementById('zap-hora').value || "...";
    
    let novoTexto = templateZapDefault.replace('{DATA}', dataVal).replace('{HORA}', horaVal);
    document.getElementById('zap-texto-final').value = novoTexto;
};

window.enviarZapConfirmacao = function() {
    if (typeof histPacienteAtual === 'undefined' || !histPacienteAtual) return;
    
    const p = histPacienteAtual;
    const tel = p.tel1 || p.tel2 || '';
    const numTel = tel.replace(/\D/g, '');
    
    if (!numTel || numTel.length < 10) {
        if(typeof showModalAlert === 'function') showModalAlert("O munícipe não possui um telefone válido cadastrado.");
        return;
    }
    
    const textoFinal = document.getElementById('zap-texto-final').value;
    
    const link = `https://api.whatsapp.com/send/?phone=55${numTel}&text=${encodeURIComponent(textoFinal)}`;
    window.open(link, '_blank');
    
    document.getElementById('modal-zap-confirmacao').classList.add('hidden');
};
