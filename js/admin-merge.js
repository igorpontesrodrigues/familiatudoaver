// Lógica de Mesclagem de Munícipes

window.gruposDuplicados = {};
window.duplaAtualMesclagem = null;

// Função principal para abrir a ferramenta e varrer o banco
window.abrirModalMesclagem = async function() {
    document.getElementById('modal-mesclar-municipes').classList.remove('hidden');
    document.getElementById('modal-mesclar-municipes').classList.add('flex');
    // Adiciona o opacity-100 no próximo frame para a transição funcionar
    setTimeout(() => {
        document.getElementById('modal-mesclar-municipes').classList.remove('opacity-0');
        document.getElementById('modal-mesclar-municipes').classList.add('opacity-100');
    }, 10);

    const tbody = document.getElementById('tabela-duplicados-body');
    const totalSpan = document.getElementById('total-duplicados');
    
    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="px-6 py-12 text-center text-slate-400">
                <div class="flex flex-col items-center justify-center">
                    <i data-lucide="loader" class="w-8 h-8 text-slate-300 mb-3 animate-spin"></i>
                    <p>Buscando cadastros e analisando duplicidades...</p>
                </div>
            </td>
        </tr>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const pSnap = await window.getDocs(window.collection(window.db, "pacientes"));
        const gruposPorNome = {};

        pSnap.forEach(doc => {
            const data = doc.data();
            const nomeOriginal = data.nome || "";
            // Normalizar nome para agrupamento
            const nomeNorm = nomeOriginal.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ');
            
            if (nomeNorm.length > 2) {
                if (!gruposPorNome[nomeNorm]) {
                    gruposPorNome[nomeNorm] = [];
                }
                gruposPorNome[nomeNorm].push({ ...data, id: doc.id });
            }
        });

        // Filtrar apenas grupos com mais de 1 registro, onde pelo menos um tem CPF válido e outro não (ou tem CPFs diferentes)
        window.gruposDuplicados = {};
        let html = '';
        let total = 0;

        for (const [nomeNorm, cadastros] of Object.entries(gruposPorNome)) {
            if (cadastros.length >= 2) {
                // Checar se existe variação de CPF
                let temCpf = false;
                let semCpf = false;
                cadastros.forEach(c => {
                    const limpo = (c.cpf || '').replace(/\D/g, '');
                    if (limpo.length === 11) temCpf = true;
                    else semCpf = true;
                });

                // Se todos têm o MESMO cpf e não existe nenhum sem cpf, ignora (ou não, vamos focar em com vs sem)
                if (temCpf && semCpf) {
                    window.gruposDuplicados[nomeNorm] = cadastros;
                    total++;
                    
                    const nomeExibicao = cadastros.find(c => c.nome).nome;
                    html += `
                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-b border-slate-100 dark:border-slate-800">
                            <td class="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">${nomeExibicao}</td>
                            <td class="px-4 py-3 text-center">
                                <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                                    ${cadastros.length} cadastros
                                </span>
                            </td>
                            <td class="px-4 py-3 text-center text-xs text-slate-500">
                                Mistura de Com/Sem CPF
                            </td>
                            <td class="px-4 py-3 text-right">
                                <button onclick="window.analisarDuplicados('${nomeNorm}')" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-xs transition shadow-sm flex items-center justify-center gap-1 ml-auto">
                                    <i data-lucide="search" class="w-3 h-3"></i> Analisar
                                </button>
                            </td>
                        </tr>
                    `;
                }
            }
        }

        totalSpan.innerText = total;

        if (total === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-12 text-center text-emerald-600 font-bold">
                        <i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2"></i>Nenhum munícipe duplicado (Com/Sem CPF) encontrado! Tudo certo.
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = html;
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (e) {
        console.error("Erro ao buscar duplicados:", e);
        tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-500 font-bold">Erro: ${e.message}</td></tr>`;
    }
};

window.analisarDuplicados = function(nomeNorm) {
    const cadastros = window.gruposDuplicados[nomeNorm];
    if (!cadastros || cadastros.length < 2) return;

    // Fechar modal anterior e abrir o de comparação
    document.getElementById('modal-mesclar-municipes').classList.add('hidden');
    document.getElementById('modal-mesclar-municipes').classList.remove('flex');
    
    document.getElementById('modal-comparar-municipes').classList.remove('hidden');
    document.getElementById('modal-comparar-municipes').classList.add('flex');
    setTimeout(() => {
        document.getElementById('modal-comparar-municipes').classList.remove('opacity-0');
        document.getElementById('modal-comparar-municipes').classList.add('opacity-100');
    }, 10);

    // Separar: 1 Principal (Com CPF), 1 Secundário (Sem CPF ou CPF inválido)
    // Se tiver mais de 2, pegamos os dois primeiros por enquanto (para simplificar a mesclagem dupla a dupla)
    cadastros.sort((a, b) => {
        const cpfA = (a.cpf || '').replace(/\D/g, '');
        const cpfB = (b.cpf || '').replace(/\D/g, '');
        if (cpfA.length === 11 && cpfB.length !== 11) return -1;
        if (cpfB.length === 11 && cpfA.length !== 11) return 1;
        return 0;
    });

    const principal = cadastros[0]; // Tem CPF
    const secundario = cadastros[1]; // Sem CPF

    window.duplaAtualMesclagem = { principal, secundario };

    const container = document.getElementById('merge-comparison-container');
    
    // Lista de campos relevantes para comparar
    const campos = [
        { key: 'nome', label: 'Nome Completo' },
        { key: 'cpf', label: 'CPF' },
        { key: 'rg', label: 'RG' },
        { key: 'sus', label: 'Cartão SUS' },
        { key: 'telefone1', label: 'Telefone 1' },
        { key: 'telefone2', label: 'Telefone 2' },
        { key: 'data_nascimento', label: 'Data de Nascimento' },
        { key: 'cep', label: 'CEP' },
        { key: 'endereco', label: 'Endereço' },
        { key: 'numero', label: 'Número' },
        { key: 'bairro', label: 'Bairro' },
        { key: 'cidade', label: 'Cidade' },
        { key: 'parceiro', label: 'Parceiro' },
        { key: 'indicacao', label: 'Indicação' },
        { key: 'observacoes', label: 'Observações' }
    ];

    let html = \`
        <div class="grid grid-cols-12 gap-4 font-bold text-slate-500 text-xs uppercase tracking-wider mb-2 px-4">
            <div class="col-span-3">Campo</div>
            <div class="col-span-4 flex items-center gap-2 text-emerald-700">
                <i data-lucide="check-circle-2" class="w-4 h-4"></i> Principal (Destino)
                <span class="font-mono text-[10px] bg-emerald-100 px-1 rounded">\${principal.id}</span>
            </div>
            <div class="col-span-1 text-center">Ação</div>
            <div class="col-span-4 flex items-center gap-2 text-rose-700">
                <i data-lucide="trash-2" class="w-4 h-4"></i> Secundário (Será apagado)
                <span class="font-mono text-[10px] bg-rose-100 px-1 rounded">\${secundario.id}</span>
            </div>
        </div>
    \`;

    campos.forEach(campo => {
        const valP = (principal[campo.key] || '').trim();
        const valS = (secundario[campo.key] || '').trim();
        
        const saoIguais = valP.toLowerCase() === valS.toLowerCase() || (!valP && !valS);
        
        if (saoIguais) {
            // Mostrar bloqueado
            html += \`
                <div class="grid grid-cols-12 gap-4 items-center bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 opacity-60">
                    <div class="col-span-3 font-semibold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                        <i data-lucide="lock" class="w-3 h-3 text-slate-400"></i> \${campo.label}
                    </div>
                    <div class="col-span-4 text-sm font-medium break-words text-slate-600">\${valP || '<span class="text-slate-400 italic">Vazio</span>'}</div>
                    <div class="col-span-1 flex justify-center">
                        <div class="bg-slate-200 dark:bg-slate-700 rounded-full p-1"><i data-lucide="equal" class="w-4 h-4 text-slate-400"></i></div>
                    </div>
                    <div class="col-span-4 text-sm font-medium break-words text-slate-600">\${valS || '<span class="text-slate-400 italic">Vazio</span>'}</div>
                    
                    <input type="hidden" name="merge_\${campo.key}" value="P">
                </div>
            \`;
        } else {
            // Mostrar escolha
            // Se um for vazio e o outro tiver dado, vamos sugerir o que tem dado
            let checkedP = "checked";
            let checkedS = "";
            if (!valP && valS) {
                checkedP = "";
                checkedS = "checked";
            }

            html += \`
                <div class="grid grid-cols-12 gap-4 items-center bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-blue-100 dark:border-blue-900 shadow-sm relative overflow-hidden group">
                    <div class="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>
                    <div class="col-span-3 font-bold text-blue-900 dark:text-blue-100 text-sm">
                        \${campo.label}
                    </div>
                    <div class="col-span-4">
                        <label class="flex items-start gap-3 p-3 rounded-lg border \${checkedP ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700' : 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700 hover:bg-slate-100'} cursor-pointer transition" onclick="document.querySelectorAll('input[name=merge_\${campo.key}]').forEach(el=>el.closest('label').className='flex items-start gap-3 p-3 rounded-lg border bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700 hover:bg-slate-100 cursor-pointer transition'); this.className='flex items-start gap-3 p-3 rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700 cursor-pointer transition';">
                            <input type="radio" name="merge_\${campo.key}" value="P" class="mt-1 w-4 h-4 text-blue-600" \${checkedP}>
                            <span class="text-sm font-medium break-words \${!valP ? 'text-slate-400 italic' : 'text-slate-800 dark:text-slate-200'}">\${valP || 'Vazio'}</span>
                        </label>
                    </div>
                    <div class="col-span-1 flex justify-center text-slate-300">
                        <i data-lucide="arrow-left-right" class="w-5 h-5"></i>
                    </div>
                    <div class="col-span-4">
                        <label class="flex items-start gap-3 p-3 rounded-lg border \${checkedS ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700' : 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700 hover:bg-slate-100'} cursor-pointer transition" onclick="document.querySelectorAll('input[name=merge_\${campo.key}]').forEach(el=>el.closest('label').className='flex items-start gap-3 p-3 rounded-lg border bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700 hover:bg-slate-100 cursor-pointer transition'); this.className='flex items-start gap-3 p-3 rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700 cursor-pointer transition';">
                            <input type="radio" name="merge_\${campo.key}" value="S" class="mt-1 w-4 h-4 text-blue-600" \${checkedS}>
                            <span class="text-sm font-medium break-words \${!valS ? 'text-slate-400 italic' : 'text-slate-800 dark:text-slate-200'}">\${valS || 'Vazio'}</span>
                        </label>
                    </div>
                </div>
            \`;
        }
    });

    container.innerHTML = html;

    // Buscar quantos atendimentos o secundário tem para avisar
    window.getDocs(window.query(window.collection(window.db, "atendimentos"), window.where("id_paciente", "==", secundario.id)))
        .then(snap => {
            const qtd = snap.size;
            document.getElementById('merge-atendimentos-info').innerText = \`\${qtd} atendimento(s) do secundário serão transferidos\`;
        });

    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.confirmarMesclagemMunicipe = async function() {
    if (!window.duplaAtualMesclagem) return;
    const { principal, secundario } = window.duplaAtualMesclagem;

    const conf = confirm(\`Atenção: Esta ação NÃO PODE SER DESFEITA.\\n\\nO cadastro principal (ID: \${principal.id}) será atualizado com as opções selecionadas.\\nOs atendimentos do cadastro secundário (ID: \${secundario.id}) serão transferidos para o principal.\\nO cadastro secundário será APAGADO permanentemente.\\n\\nDeseja continuar?\`);
    if (!conf) return;

    const btn = document.getElementById('btn-confirmar-mesclagem');
    const originalText = btn.innerHTML;
    btn.innerHTML = \`<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Processando...\`;
    btn.disabled = true;

    try {
        // 1. Coletar dados selecionados para atualização
        const updateData = {};
        const radios = document.querySelectorAll('input[type="radio"]:checked, input[type="hidden"][name^="merge_"]');
        
        radios.forEach(el => {
            const campo = el.name.replace('merge_', '');
            const choice = el.value; // 'P' ou 'S'
            
            if (choice === 'S') {
                updateData[campo] = secundario[campo] || "";
            } else if (choice === 'P') {
                updateData[campo] = principal[campo] || "";
            }
        });

        // 2. Atualizar Paciente Principal
        if (Object.keys(updateData).length > 0) {
            updateData.data_atualizacao = new Date().toISOString();
            await window.updateDoc(window.doc(window.db, "pacientes", principal.id), updateData);
        }

        // 3. Transferir Atendimentos (updateBatch)
        const qAt = window.query(window.collection(window.db, "atendimentos"), window.where("id_paciente", "==", secundario.id));
        const atSnap = await window.getDocs(qAt);
        
        if (!atSnap.empty) {
            const batch = window.writeBatch(window.db);
            atSnap.forEach(docSnap => {
                batch.update(docSnap.ref, {
                    id_paciente: principal.id,
                    cpf_paciente: principal.cpf || updateData.cpf || "", // tentar manter coerência
                    nome_paciente: principal.nome || updateData.nome || ""
                });
            });
            await batch.commit();
        }

        // 4. Apagar Paciente Secundário
        await window.deleteDoc(window.doc(window.db, "pacientes", secundario.id));

        // Sucesso!
        alert(\`Mesclagem concluída com sucesso!\\n\${atSnap.size} atendimentos transferidos.\`);
        
        // Fechar modal de comparação
        document.getElementById('modal-comparar-municipes').classList.add('hidden');
        document.getElementById('modal-comparar-municipes').classList.remove('flex');
        
        // Atualizar lista
        window.abrirModalMesclagem();

    } catch (e) {
        console.error("Erro na mesclagem:", e);
        alert("Ocorreu um erro durante a mesclagem: " + e.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};
