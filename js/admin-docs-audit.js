// ============================================================================
// AUDITORIA DE DOCUMENTOS E TELEFONES
// ============================================================================

window.motivoCpfInvalido = function(cpf) {
    if (!cpf) return 'Ausente';
    const cl = String(cpf).replace(/\D/g, '');
    if (cl.length === 0) return 'Vazio / Letras';
    if (cl.length < 11) return `Incompleto (${cl.length}/11 dígitos)`;
    if (cl.length > 11) return `Excesso de dígitos (${cl.length}/11)`;
    if (/^(\d)\1{10}$/.test(cl)) return 'Número repetido / fictício (ex: 111.111...)';
    if (typeof window.isValidCPF === 'function' && !window.isValidCPF(cl)) {
        return 'Dígito verificador inválido (cálculo oficial do CPF não confere)';
    }
    return 'CPF com erro de digitação';
};

window.apagarCpfMoverPreCadastro = async function(id, index) {
    if (!id) return;
    const conf = typeof window.showModalConfirm === 'function' 
        ? await window.showModalConfirm("Tem certeza que deseja apagar o CPF incorreto deste munícipe e movê-lo para a aba Pré Cadastros?")
        : confirm("Tem certeza que deseja apagar o CPF incorreto deste munícipe e movê-lo para a aba Pré Cadastros?");
    if (!conf) return;
    try {
        await window.updateDoc(window.doc(window.db, 'pacientes', id), {
            cpf: '',
            pre_cadastro: true
        });
        if(typeof window.logAuditoria === 'function') window.logAuditoria('CORREÇÃO_CPF', 'Munícipes (Auditoria)', `CPF inválido removido e movido para Pré Cadastros - Paciente ID: ${id}`);
        const tr = document.getElementById(`tr-audit-${index}`);
        if (tr) {
            tr.classList.add('bg-amber-50', 'opacity-50');
            setTimeout(() => {
                tr.remove();
                let total = document.querySelectorAll('#tabela-auditoria-docs-body tr').length;
                document.getElementById('total-docs-invalidos').innerText = total;
                if (total === 0) {
                    document.getElementById('tabela-auditoria-docs-body').innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-emerald-600 font-bold"><i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2"></i>Tudo corrigido!</td></tr>';
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            }, 400);
        }
        window.showModalAlert("CPF apagado! O munícipe foi movido para a lista de Pré Cadastros.");
    } catch (e) {
        window.showModalAlert("Erro ao mover para Pré Cadastro: " + e.message);
    }
};

window.apagarTodosCpfInvalidosMassa = async function(btn) {
    const trs = document.querySelectorAll('#tabela-auditoria-docs-body tr');
    let alvos = [];
    trs.forEach((tr, idx) => {
        const btnApagar = tr.querySelector('button[onclick^="apagarCpfMoverPreCadastro"]');
        if (btnApagar) {
            const match = btnApagar.getAttribute('onclick').match(/apagarCpfMoverPreCadastro\('([^']+)'/);
            if (match && match[1]) {
                alvos.push({ id: match[1], index: idx });
            }
        }
    });

    if (alvos.length === 0) {
        window.showModalAlert("Nenhum cadastro com erro de CPF foi encontrado na lista atual.");
        return;
    }

    const conf = typeof window.showModalConfirm === 'function'
        ? await window.showModalConfirm(`Deseja apagar o CPF inválido de TODOS os ${alvos.length} munícipes listados com erro no CPF e movê-los para Pré Cadastros?`)
        : confirm(`Deseja apagar o CPF inválido de TODOS os ${alvos.length} munícipes listados com erro no CPF e movê-los para Pré Cadastros?`);
    if (!conf) return;

    const oldHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Apagando...';
    }

    let sucessos = 0;
    for (const alvo of alvos) {
        try {
            await window.updateDoc(window.doc(window.db, 'pacientes', alvo.id), {
                cpf: '',
                pre_cadastro: true
            });
            if(typeof window.logAuditoria === 'function') window.logAuditoria('CORREÇÃO_CPF_MASSA', 'Munícipes (Auditoria)', `CPF inválido removido em massa - Paciente ID: ${alvo.id}`);
            sucessos++;
            const tr = document.getElementById(`tr-audit-${alvo.index}`);
            if (tr) tr.remove();
        } catch (e) {
            console.warn("Erro ao apagar CPF de", alvo.id, e);
        }
    }

    let totalRestante = document.querySelectorAll('#tabela-auditoria-docs-body tr').length;
    const badgeEl = document.getElementById('total-docs-invalidos');
    if (badgeEl) badgeEl.innerText = totalRestante;
    if (totalRestante === 0) {
        document.getElementById('tabela-auditoria-docs-body').innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-emerald-600 font-bold"><i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2"></i>Tudo corrigido!</td></tr>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = oldHtml;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    window.showModalAlert(`Concluído! ${sucessos} munícipes com CPF inválido tiveram o CPF apagado e foram movidos para Pré Cadastros.`);
};

window.buscarTodosCepsReversoMassa = async function(btn) {
    const trs = document.querySelectorAll('#tabela-auditoria-docs-body tr');
    let alvos = [];
    trs.forEach((tr, idx) => {
        const btnCep = tr.querySelector('button[onclick^="buscarCepReversoAuditoria"]');
        if (btnCep) {
            const match = btnCep.getAttribute('onclick').match(/buscarCepReversoAuditoria\('([^']+)'/);
            if (match && match[1]) {
                alvos.push({ id: match[1], index: idx });
            }
        }
    });

    if (alvos.length === 0) {
        window.showModalAlert("Nenhum cadastro sem CEP com endereço elegível para busca reversa foi encontrado na lista.");
        return;
    }

    const conf = typeof window.showModalConfirm === 'function'
        ? await window.showModalConfirm(`Deseja buscar nos Correios o CEP para TODOS os ${alvos.length} munícipes listados sem CEP?`)
        : confirm(`Deseja buscar nos Correios o CEP para TODOS os ${alvos.length} munícipes listados sem CEP?`);
    if (!conf) return;

    const oldHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Buscando CEPs...';
    }

    let achados = 0;
    for (const alvo of alvos) {
        try {
            const elCep = document.getElementById(`audit-cep-${alvo.index}`);
            const docSnap = await window.getDoc(window.doc(window.db, 'pacientes', alvo.id));
            if (!docSnap.exists()) continue;
            const d = docSnap.data();
            const mun = (d.municipio || '').trim();
            const log = (d.logradouro || '').replace(/\b\d+[A-Z]?\b/g, '').trim();
            if (mun.length >= 3 && log.length >= 3) {
                const res = await fetch(`https://viacep.com.br/ws/${d.estado || 'RJ'}/${encodeURIComponent(mun)}/${encodeURIComponent(log)}/json/`);
                const arr = await res.json();
                if (Array.isArray(arr) && arr.length > 0 && arr[0].cep) {
                    const cepAchado = arr[0].cep.replace(/\D/g, '');
                    if (cepAchado.length === 8) {
                        const cepFmt = typeof window.formatMaskValue === 'function' ? window.formatMaskValue(cepAchado, 'cep') : arr[0].cep;
                        if (elCep) elCep.value = cepFmt;
                        await window.updateDoc(window.doc(window.db, 'pacientes', alvo.id), {
                            cep: cepFmt,
                            logradouro: (arr[0].logradouro || d.logradouro || '').toUpperCase(),
                            bairro: (arr[0].bairro || d.bairro || '').toUpperCase()
                        });
                        if(typeof window.logAuditoria === 'function') window.logAuditoria('BUSCA_CEP_MASSA', 'Munícipes (Auditoria)', `CEP ${cepFmt} preenchido via busca reversa nos Correios - Paciente ID: ${alvo.id}`);
                        achados++;
                        const tr = document.getElementById(`tr-audit-${alvo.index}`);
                        if (tr) tr.classList.add('bg-emerald-50');
                    }
                }
            }
        } catch (e) {
            console.warn("Falha ao buscar CEP reverso para", alvo.id, e);
        }
    }

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = oldHtml;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    window.showModalAlert(`Varredura em massa concluída! Foram encontrados e salvos com sucesso ${achados} de ${alvos.length} CEPs nos Correios.`);
};

window.buscarCepReversoAuditoria = async function(id, index) {
    const elCep = document.getElementById(`audit-cep-${index}`);
    try {
        const docSnap = await window.getDoc(window.doc(window.db, 'pacientes', id));
        if (!docSnap.exists()) return;
        const d = docSnap.data();
        const mun = (d.municipio || '').trim();
        const log = (d.logradouro || '').replace(/\b\d+[A-Z]?\b/g, '').trim();
        if (!mun || !log) {
            window.showModalAlert("Este cadastro não tem Município ou Logradouro suficientes para busca reversa no Correios. Digite o CEP manualmente ou preencha o endereço.");
            return;
        }
        const res = await fetch(`https://viacep.com.br/ws/${d.estado || 'RJ'}/${encodeURIComponent(mun)}/${encodeURIComponent(log)}/json/`);
        const arr = await res.json();
        if (Array.isArray(arr) && arr.length > 0 && arr[0].cep) {
            const cepFmt = typeof window.formatMaskValue === 'function' ? window.formatMaskValue(arr[0].cep, 'cep') : arr[0].cep;
            if (elCep) elCep.value = cepFmt;
            await window.updateDoc(window.doc(window.db, 'pacientes', id), {
                cep: cepFmt,
                logradouro: (arr[0].logradouro || d.logradouro || '').toUpperCase(),
                bairro: (arr[0].bairro || d.bairro || '').toUpperCase()
            });
            if(typeof window.logAuditoria === 'function') window.logAuditoria('BUSCA_CEP', 'Munícipes (Auditoria)', `CEP ${cepFmt} preenchido via busca reversa - Paciente ID: ${id}`);
            window.showModalAlert(`CEP encontrado (${cepFmt}) e salvo no cadastro!`);
        } else {
            window.showModalAlert("Os Correios não retornaram um CEP exato para este endereço. Digite o CEP manualmente.");
        }
    } catch (e) {
        window.showModalAlert("Erro na busca reversa de CEP: " + e.message);
    }
};

window.fecharModalAuditoriaDocs = function() {
    const m = document.getElementById('modal-auditoria-docs');
    if(!m) return;
    m.classList.add('opacity-0');
    document.getElementById('modal-auditoria-docs-content').classList.add('scale-95');
    setTimeout(() => m.classList.add('hidden'), 300);
};

window.auditarDocsBanco = async function() {
    const m = document.getElementById('modal-auditoria-docs');
    if(!m) return;
    
    m.classList.remove('hidden');
    setTimeout(() => {
        m.classList.remove('opacity-0');
        document.getElementById('modal-auditoria-docs-content').classList.remove('scale-95');
    }, 10);

    document.getElementById('loading-auditoria-docs').classList.remove('hidden');
    document.getElementById('resultado-auditoria-docs').classList.add('hidden');
    
    const tbody = document.getElementById('tabela-auditoria-docs-body');
    tbody.innerHTML = '';
    
    try {
        const snap = await window.getDocs(window.collection(window.db, 'pacientes'));
        let invalidos = [];
        
        snap.forEach(doc => {
            const data = doc.data();
            let cpfVal = data.cpf || '';
            let susVal = data.sus || '';
            let tituloVal = data.titulo || '';
            let rgVal = data.rg || '';
            let cepVal = data.cep || '';
            let tel1Val = data.telefone1 || '';
            let tel2Val = data.telefone2 || '';
            
            let cpfLimpo = cpfVal.replace(/[^\d]+/g, '');
            let susLimpo = susVal.replace(/[^\d]+/g, '');
            let tituloLimpo = tituloVal.replace(/[^\d]+/g, '');
            let rgLimpo = rgVal.replace(/[^\d]+/g, '');
            let cepLimpo = cepVal.replace(/[^\d]+/g, '');
            let tel1Limpo = tel1Val.replace(/[^\d]+/g, '');
            let tel2Limpo = tel2Val.replace(/[^\d]+/g, '');

            let errors = [];

            if (cpfLimpo.length > 0 && (cpfLimpo.length !== 11 || !window.isValidCPF(cpfLimpo))) {
                errors.push('cpf');
            }
            if (susLimpo.length > 0 && susLimpo.length !== 15) {
                errors.push('sus');
            }
            if (tituloLimpo.length > 0 && tituloLimpo.length !== 12) {
                errors.push('titulo');
            }
            if (rgVal && rgVal.toUpperCase() !== 'NÃO TEM' && (rgLimpo.length < 4 || rgLimpo.length > 14)) {
                errors.push('rg');
            }
            const temDadosEndereco = Boolean(data.municipio || data.bairro || data.logradouro || data.referencia);
            if (cepLimpo.length !== 8 && temDadosEndereco) {
                errors.push('cep');
            }
            if (tel1Limpo.length > 0 && tel1Limpo.length < 10) {
                errors.push('tel1');
            }
            if (tel2Limpo.length > 0 && tel2Limpo.length < 10) {
                errors.push('tel2');
            }
            
            if (errors.length > 0) {
                invalidos.push({
                    id: doc.id,
                    nome: data.nome || 'Sem Nome',
                    cpf: cpfVal,
                    sus: susVal,
                    titulo: tituloVal,
                    rg: rgVal,
                    cep: cepVal,
                    municipio: data.municipio || '',
                    bairro: data.bairro || '',
                    logradouro: data.logradouro || '',
                    referencia: data.referencia || '',
                    telefone1: tel1Val,
                    telefone2: tel2Val,
                    errors: errors
                });
            }
        });
        
        document.getElementById('total-docs-invalidos').innerText = invalidos.length;
        
        if (invalidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-emerald-600 font-bold"><i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2"></i>Nenhum dado inválido encontrado! O banco está limpo.</td></tr>';
        } else {
            let html = '';
            invalidos.forEach((inv, index) => {
                
                const hasError = (field) => inv.errors.includes(field);
                
                const renderField = (key, label, value, err) => {
                    if (!value && !err) return '';
                    const isErr = err;
                    let extraHtml = '';
                    if (key === 'cpf' && isErr) {
                        const motivo = window.motivoCpfInvalido(value);
                        extraHtml = `
                            <div class="ml-16 mt-1 flex flex-col gap-1.5">
                                <span class="text-[11px] text-rose-600 font-bold flex items-center gap-1"><i data-lucide="alert-triangle" class="w-3.5 h-3.5 inline"></i> Motivo: ${motivo}</span>
                                <button type="button" onclick="apagarCpfMoverPreCadastro('${inv.id}', ${index})" class="self-start text-[11px] bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold px-2.5 py-1 rounded border border-rose-300 flex items-center gap-1.5 shadow-sm transition"><i data-lucide="arrow-right-circle" class="w-3.5 h-3.5"></i> Apagar CPF e mover para Pré-Cadastro</button>
                            </div>
                        `;
                    }
                    if (key === 'cep' && isErr) {
                        const infoEnd = [inv.logradouro, inv.bairro, inv.municipio, inv.referencia ? 'Ref: ' + inv.referencia : ''].filter(Boolean).join(' - ') || 'Sem detalhes';
                        extraHtml = `
                            <div class="ml-16 mt-1 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-300 flex flex-col gap-1.5">
                                <div><span class="font-bold">Endereço cadastrado:</span> ${infoEnd}</div>
                                <button type="button" onclick="buscarCepReversoAuditoria('${inv.id}', ${index})" class="self-start text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded shadow-sm flex items-center gap-1 transition"><i data-lucide="search" class="w-3.5 h-3.5"></i> Buscar CEP nos Correios e Salvar</button>
                            </div>
                        `;
                    }
                    return `
                        <div class="flex flex-col mb-1.5">
                            <div class="flex items-center gap-2">
                                <label class="w-16 text-right text-[10px] font-bold uppercase ${isErr ? 'text-rose-600' : 'text-slate-400'}">${label}</label>
                                <input type="text" id="audit-${key}-${index}" value="${value}" 
                                    class="flex-1 px-2 py-1 text-sm rounded border ${isErr ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-slate-200 bg-slate-50 text-slate-600'} focus:outline-none focus:border-indigo-500 transition" placeholder="${key === 'cep' ? '00000-000' : ''}">
                            </div>
                            ${extraHtml}
                        </div>
                    `;
                };

                html += `
                <tr class="hover:bg-slate-50 transition border-b border-slate-100" id="tr-audit-${index}">
                    <td class="px-4 py-3 font-bold text-slate-800 align-top max-w-[200px] truncate" title="${inv.nome}">
                        ${inv.nome}
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex flex-col gap-2 max-w-md">
                            ${hasError('cpf') || inv.cpf ? renderField('cpf', 'CPF', inv.cpf, hasError('cpf')) : ''}
                            ${hasError('rg') || inv.rg ? renderField('rg', 'RG', inv.rg, hasError('rg')) : ''}
                            ${hasError('sus') || inv.sus ? renderField('sus', 'SUS', inv.sus, hasError('sus')) : ''}
                            ${hasError('titulo') || inv.titulo ? renderField('titulo', 'Título', inv.titulo, hasError('titulo')) : ''}
                            ${hasError('cep') || inv.cep ? renderField('cep', 'CEP', inv.cep, hasError('cep')) : ''}
                            ${hasError('tel1') || inv.telefone1 ? renderField('tel1', 'Tel 1', inv.telefone1, hasError('tel1')) : ''}
                            ${hasError('tel2') || inv.telefone2 ? renderField('tel2', 'Tel 2', inv.telefone2, hasError('tel2')) : ''}
                        </div>
                    </td>
                    <td class="px-3 py-2 text-right flex flex-col gap-1 justify-end items-end">
                    <button onclick="autoAjustarDocs(${index})" class="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded border border-indigo-200 transition" title="Tenta formatar automaticamente (aplica a máscara) aos valores atuais">Auto-Ajuste</button>
                    <button onclick="salvarCorrecaoDocs('${inv.id}', ${index})" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition">Salvar Correção</button>
                </td>
            </tr>`;
            });
            tbody.innerHTML = html;
            
            // Aplica as máscaras nos inputs para que a digitação já saia certa
            if (invalidos.length > 0) {
                setTimeout(() => {
                    invalidos.forEach((inv, index) => {
                        const elCpf = document.getElementById(`audit-cpf-${index}`);
                        const elSus = document.getElementById(`audit-sus-${index}`);
                        const elTit = document.getElementById(`audit-titulo-${index}`);
                        const elTel1 = document.getElementById(`audit-tel1-${index}`);
                        const elTel2 = document.getElementById(`audit-tel2-${index}`);
                        
                        if (typeof applyMask === 'function') {
                            if(elCpf) applyMask(elCpf, window.maskCPF || maskCPF);
                            if(elSus) applyMask(elSus, window.maskSUS || maskSUS);
                            if(elTit) applyMask(elTit, window.maskTitulo || maskTitulo);
                            if(elTel1) applyMask(elTel1, window.maskTelefone || maskTelefone);
                            if(elTel2) applyMask(elTel2, window.maskTelefone || maskTelefone);
                        }
                    });
                }, 100);
            }
        }
        
        if(typeof lucide !== 'undefined') lucide.createIcons();
        
        document.getElementById('loading-auditoria-docs').classList.add('hidden');
        document.getElementById('resultado-auditoria-docs').classList.remove('hidden');

    } catch(e) {
        document.getElementById('resultado-auditoria-docs').innerHTML = `<tr><td colspan="6" class="text-rose-500 text-center p-4">Erro: ${e.message}</td></tr>`;
    }
};

window.autoAjustarDocs = function(index) {
    const elCpf = document.getElementById(`audit-cpf-${index}`);
    const elSus = document.getElementById(`audit-sus-${index}`);
    const elTit = document.getElementById(`audit-titulo-${index}`);
    const elTel1 = document.getElementById(`audit-tel1-${index}`);
    const elTel2 = document.getElementById(`audit-tel2-${index}`);
    
    let changed = false;

    const applyInline = (el, type) => {
        if(!el || !el.value) return false;
        const original = el.value;
        let nums = original.replace(/\D/g, '');
        if(!nums) return false;
        let v = nums;

        if (type === 'cpf') {
            if (nums.length === 10) v = '0' + nums;
            if (nums.length === 9) v = '00' + nums;
            if (v.length > 11) v = v.slice(0, 11);
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } 
        else if (type === 'sus') {
            if (nums.length < 15) v = nums.padStart(15, '0');
            // Não corta se tiver mais de 15, para que o usuário veja o erro
            v = v.replace(/(\d{3})(\d)/, '$1 $2');
            v = v.replace(/(\d{4})(\d)/, '$1 $2');
            v = v.replace(/(\d{4})(\d)/, '$1 $2');
        }
        else if (type === 'titulo') {
            if (nums.length < 12) v = nums.padStart(12, '0');
            // Não corta se tiver mais de 12, para que o usuário veja o erro
            v = v.replace(/(\d{4})(\d)/, '$1 $2');
            v = v.replace(/(\d{4})(\d)/, '$1 $2');
        }
        else if (type === 'tel') {
            if (nums.length === 10) v = nums.slice(0,2) + '9' + nums.slice(2);
            if (v.length > 11) v = v.slice(0, 11);
            if (v.length === 11) {
                v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else if (v.length === 10) {
                v = v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            }
        }

        if (v !== original) {
            el.value = v;
            el.classList.add('bg-yellow-50', 'border-yellow-400');
            return true;
        }
        return false;
    };

    try {
        if(applyInline(elCpf, 'cpf')) changed = true;
        if(applyInline(elSus, 'sus')) changed = true;
        if(applyInline(elTit, 'titulo')) changed = true;
        if(applyInline(elTel1, 'tel')) changed = true;
        if(applyInline(elTel2, 'tel')) changed = true;
    } catch(e) {
        console.error('Erro inlining mask', e);
    }
    
    return changed;
};

window.autoAjustarTodosDocs = function() {
    const trs = document.querySelectorAll('#tabela-auditoria-docs-body tr');
    let adjusted = 0;
    trs.forEach((tr, index) => {
        if(document.getElementById(`audit-cpf-${index}`)) {
            try {
                const mudou = window.autoAjustarDocs(index);
                if (mudou) adjusted++;
            } catch(e) {
                console.error("Erro ao ajustar linha", index, e);
            }
        }
    });
    
    if (adjusted > 0) {
        window.showModalAlert(`Foram pré-formatados ${adjusted} registros visíveis (marcados em amarelo).\n\nRevise as alterações e clique em "Salvar Correção" em cada um, ou você pode continuar editando manualmente.`);
    } else {
        window.showModalAlert("Nenhuma formatação automática pôde ser aplicada. Verifique se os números estão muito incompletos.");
    }
};

window.salvarTodosAjustadosDocs = async function(btnSalvarTodos) {
    const trs = document.querySelectorAll('#tabela-auditoria-docs-body tr');
    
    // 1. Roda o auto-ajuste em todas as linhas silenciosamente
    trs.forEach((tr, index) => {
        if(document.getElementById(`audit-cpf-${index}`)) {
            try { window.autoAjustarDocs(index); } catch(e) {}
        }
    });

    let toSaveList = [];
    
    // 2. Coleta os amarelos
    trs.forEach((tr, index) => {
        const inputsAmarelos = tr.querySelectorAll('input.bg-yellow-50');
        if(inputsAmarelos.length > 0) {
            const btnSalvar = tr.querySelector('button[onclick^="salvarCorrecaoDocs"]');
            if(btnSalvar) {
                const match = btnSalvar.getAttribute('onclick').match(/salvarCorrecaoDocs\('([^']+)',\s*(\d+)\)/);
                if(match && match[1] && match[2]) {
                    toSaveList.push({ id: match[1], index: parseInt(match[2]) });
                }
            }
        }
    });

    if (toSaveList.length === 0) {
        window.showModalAlert("Nenhum registro recém-ajustado para ser salvo.\nLinhas não formatadas precisam ser corrigidas manualmente.");
        return;
    }

    const oldText = btnSalvarTodos.innerHTML;
    btnSalvarTodos.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Salvando ${toSaveList.length}...`;
    btnSalvarTodos.disabled = true;

    try {
        let partialFails = 0;
        const promises = toSaveList.map(async (item) => {
            const result = await window.salvarCorrecaoDocs(item.id, item.index, true);
            if(result && !result.allOk) partialFails++;
        });
        
        await Promise.all(promises);

        if(partialFails > 0) {
            window.showModalAlert(`Foram salvos os campos válidos, mas ${partialFails} paciente(s) ainda têm campos incorretos (marcados em vermelho) que precisam de correção manual.`);
        }

        btnSalvarTodos.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Concluído!';
        btnSalvarTodos.classList.replace('bg-emerald-600', 'bg-emerald-500');
        
        setTimeout(() => {
            btnSalvarTodos.innerHTML = oldText;
            btnSalvarTodos.disabled = false;
            btnSalvarTodos.classList.replace('bg-emerald-500', 'bg-emerald-600');
            if(typeof lucide !== 'undefined') lucide.createIcons();
        }, 2500);

    } catch(e) {
        console.error("Erro no Auto-Salvar:", e);
        window.showModalAlert("Ocorreu um erro ao salvar um ou mais registros: " + e.message);
        btnSalvarTodos.innerHTML = oldText;
        btnSalvarTodos.disabled = false;
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
};

window.salvarCorrecaoDocs = async function(id, index, silent = false) {
    const elCpf = document.getElementById(`audit-cpf-${index}`);
    const elRg = document.getElementById(`audit-rg-${index}`);
    const elSus = document.getElementById(`audit-sus-${index}`);
    const elTit = document.getElementById(`audit-titulo-${index}`);
    const elCep = document.getElementById(`audit-cep-${index}`);
    const elTel1 = document.getElementById(`audit-tel1-${index}`);
    const elTel2 = document.getElementById(`audit-tel2-${index}`);
    
    let updates = {};
    let allOk = true;
    let anyValid = false;
    
    const checkField = (el, name, len, exato, maskType) => {
        if(!el) return;
        let val = el.value.trim();
        
        el.classList.remove('bg-yellow-50', 'border-yellow-400', 'bg-red-50', 'border-red-400', 'bg-emerald-50', 'border-emerald-400');
        
        if(val === '' || val.toUpperCase() === 'NÃO TEM' || val.toUpperCase() === 'NAO TEM') {
            updates[name] = val.toUpperCase();
            anyValid = true;
            return;
        }
        
        let cl = val.replace(/[^\d]+/g, '');
        let isFieldOk = true;
        
        if (exato) {
            if(cl.length !== len) isFieldOk = false;
            if(name === 'cpf' && !window.isValidCPF(cl)) isFieldOk = false;
        } else {
            if(cl.length < len) isFieldOk = false;
        }
        
        if(isFieldOk) {
            const formatted = (typeof window.formatMaskValue === 'function' && maskType) 
                ? window.formatMaskValue(cl, maskType) 
                : val;
            updates[name] = formatted;
            el.value = formatted;
            el.classList.add('bg-emerald-50', 'border-emerald-400');
            anyValid = true;
        } else {
            el.classList.add('bg-red-50', 'border-red-400');
            allOk = false;
        }
    };
    
    checkField(elCpf, 'cpf', 11, true, 'cpf');
    checkField(elRg, 'rg', 4, false, 'rg');
    checkField(elSus, 'sus', 15, true, 'sus');
    checkField(elTit, 'titulo', 12, true, 'titulo');
    checkField(elCep, 'cep', 8, true, 'cep');
    checkField(elTel1, 'tel1', 10, false, 'tel');
    checkField(elTel2, 'tel2', 10, false, 'tel');
    
    if(!anyValid || Object.keys(updates).length === 0) {
        if(!silent) window.showModalAlert("Nenhum campo válido para salvar. Corrija os campos em vermelho.");
        return { allOk: false, saved: false };
    }
    
    try {
        await window.updateDoc(window.doc(window.db, 'pacientes', id), updates);
        if(typeof window.logAuditoria === 'function') window.logAuditoria('EDIÇÃO_AUDITORIA', 'Munícipes (Auditoria)', `Edição rápida na ferramenta de auditoria - Paciente ID: ${id}`);
        
        if (allOk) {
            const tr = document.getElementById(`tr-audit-${index}`);
            if(tr) {
                tr.classList.add('bg-emerald-50', 'opacity-50');
                setTimeout(() => {
                    tr.remove();
                    let total = document.querySelectorAll('#tabela-auditoria-docs-body tr').length;
                    document.getElementById('total-docs-invalidos').innerText = total;
                    if(total === 0) {
                        document.getElementById('tabela-auditoria-docs-body').innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-emerald-600 font-bold"><i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2"></i>Tudo corrigido!</td></tr>';
                        if(typeof lucide !== 'undefined') lucide.createIcons();
                    }
                }, 500);
            }
        } else {
            if(!silent) window.showModalAlert("Os campos válidos foram salvos no banco! Os campos que continuam em vermelho ainda são inválidos e precisam ser corrigidos.");
        }
        
        return { allOk, saved: true };
    } catch(e) {
        if(!silent) window.showModalAlert("Erro ao salvar: " + e.message);
        return { allOk: false, saved: false };
    }
};

window.fecharModalPreviewPadronizacao = function() {
    const m = document.getElementById('modal-preview-padronizacao');
    if (!m) return;
    m.classList.add('opacity-0');
    document.getElementById('modal-preview-padronizacao-content').classList.add('scale-95');
    setTimeout(() => m.classList.add('hidden'), 300);
};

window.extrairDadosLogradouro = function(logradouro) {
    if (!logradouro || typeof logradouro !== 'string') return null;
    let str = logradouro.toUpperCase().trim();
    if (!str) return null;

    let res = {
        logradouro: str,
        numero: '',
        lote: '',
        quadra: '',
        tipo_residencia: ''
    };

    // 1. Extrair Quadra: QD ou QUADRA seguido de espaço/valor, OU Q isolado no final
    const mQuadra = str.match(/\b(?:QD|QUADRA)\.?\s+([A-Z0-9-]+)\b|\bQ\.?\s+([A-Z]|\d+[A-Z]?)\s*$/i);
    if (mQuadra) {
        res.quadra = (mQuadra[1] || mQuadra[2]).toUpperCase();
        str = str.replace(mQuadra[0], ' ').trim();
    }

    // 2. Extrair Lote: LT ou LOTE explícito
    const mLote = str.match(/\b(?:LT|LOTE)\.?\s+([A-Z0-9-]+)\b/i);
    if (mLote) {
        res.lote = mLote[1].toUpperCase();
        str = str.replace(mLote[0], ' ').trim();
    }

    // 3. Extrair Tipo Residência: CASA, CA, APARTAMENTO, APTO
    const mCasa = str.match(/\b(?:CASA|CA)\b$/i);
    if (mCasa) {
        res.tipo_residencia = 'CASA';
        str = str.replace(mCasa[0], ' ').trim();
    } else {
        const mApto = str.match(/\b(?:APARTAMENTO|APTO|APT|AP)\b$/i);
        if (mApto) {
            res.tipo_residencia = 'APARTAMENTO';
            str = str.replace(mApto[0], ' ').trim();
        }
    }

    // 4. Extrair Número: S/N, SN, SEM NUMERO ou número no final
    const mSN = str.match(/\b(?:1\s+SN|SN|S\/N|SEM\s+NUMERO)\b$/i);
    if (mSN) {
        res.numero = 'S/N';
        str = str.replace(mSN[0], ' ').trim();
    } else {
        const mNum = str.match(/[\s,]+N?[º°]?\s*(\d+[A-Z]?)\s*$/i);
        if (mNum) {
            res.numero = mNum[1].toUpperCase();
            str = str.slice(0, mNum.index).trim();
        }
    }

    str = str.replace(/[,.-]+$/, '').replace(/\s+/g, ' ').trim();
    res.logradouro = str;
    return res;
};

window._pendentePadronizacao = [];

window.padronizarTodosCadastrosBanco = async function() {
    const btn = document.getElementById('btn-padronizar-massa');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 inline animate-spin"></i> Analisando Banco...';
    }

    try {
        const snap = await window.getDocs(window.collection(window.db, 'pacientes'));
        let listaMudancas = [];

        for (const docSnap of snap.docs) {
            const data = docSnap.data();
            let updates = {};
            let diffs = [];

            const labels = {
                cpf: 'CPF', rg: 'RG', cep: 'CEP', tel1: 'WhatsApp', tel2: 'Telefone 2', sus: 'Cartão SUS', titulo: 'Título de Eleitor',
                logradouro: 'Logradouro', bairro: 'Bairro', municipio: 'Município', numero: 'Número', lote: 'Lote', quadra: 'Quadra', tipo_residencia: 'Tipo Residência'
            };

            const formatIfPresent = (field, type) => {
                const currentVal = data[field];
                if (currentVal && typeof window.formatMaskValue === 'function') {
                    const formatted = window.formatMaskValue(currentVal, type);
                    if (formatted && formatted !== currentVal) {
                        updates[field] = formatted;
                        diffs.push({
                            campo: labels[field] || field,
                            antes: currentVal,
                            depois: formatted
                        });
                    }
                }
            };

            formatIfPresent('cpf', 'cpf');
            formatIfPresent('rg', 'rg');
            formatIfPresent('cep', 'cep');
            formatIfPresent('tel1', 'tel');
            formatIfPresent('tel2', 'tel');
            formatIfPresent('sus', 'sus');
            formatIfPresent('titulo', 'titulo');

            // Parser inteligente de Logradouro (separa Rua, Número, Lote, Quadra e Casa/Apto)
            if (data.logradouro && typeof window.extrairDadosLogradouro === 'function') {
                const parsed = window.extrairDadosLogradouro(data.logradouro);
                if (parsed) {
                    if (parsed.logradouro && parsed.logradouro !== (data.logradouro || '').toUpperCase().trim()) {
                        updates.logradouro = parsed.logradouro;
                        diffs.push({ campo: 'Logradouro (Limpo)', antes: data.logradouro, depois: parsed.logradouro });
                    }
                    if (parsed.numero && !data.numero) {
                        updates.numero = parsed.numero;
                        diffs.push({ campo: 'Número', antes: '(vazio)', depois: parsed.numero });
                    }
                    if (parsed.lote && !data.lote) {
                        updates.lote = parsed.lote;
                        diffs.push({ campo: 'Lote', antes: '(vazio)', depois: parsed.lote });
                    }
                    if (parsed.quadra && !data.quadra) {
                        updates.quadra = parsed.quadra;
                        diffs.push({ campo: 'Quadra', antes: '(vazio)', depois: parsed.quadra });
                    }
                    if (parsed.tipo_residencia && !data.tipo_residencia) {
                        updates.tipo_residencia = parsed.tipo_residencia;
                        diffs.push({ campo: 'Tipo Residência', antes: '(vazio)', depois: parsed.tipo_residencia });
                    }
                }
            }

            let cepLimpo = String(data.cep || '').replace(/\D/g, '');
            if (cepLimpo.length === 8) {
                try {
                    const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
                    const cepData = await res.json();
                    if (!cepData.erro) {
                        const novoLogradouro = (cepData.logradouro || '').toUpperCase().trim();
                        const novoBairro = (cepData.bairro || '').toUpperCase().trim();
                        const novoMunicipio = (cepData.localidade || '').toUpperCase().trim();
                        const novoEstado = (cepData.uf || '').toUpperCase().trim();

                        const originalLogradouro = (data.logradouro || '').toUpperCase().trim();
                        const originalBairro = (data.bairro || '').toUpperCase().trim();
                        const originalMunicipio = (data.municipio || '').toUpperCase().trim();
                        const originalEstado = (data.estado || '').toUpperCase().trim();

                        if (novoLogradouro && novoLogradouro !== originalLogradouro) {
                            updates.logradouro = novoLogradouro;
                            diffs.push({ campo: 'Logradouro (ViaCEP)', antes: data.logradouro || '(vazio)', depois: novoLogradouro });
                        }
                        if (novoBairro && novoBairro !== originalBairro) {
                            updates.bairro = novoBairro;
                            diffs.push({ campo: 'Bairro (ViaCEP)', antes: data.bairro || '(vazio)', depois: novoBairro });
                        }
                        if (novoMunicipio && novoMunicipio !== originalMunicipio) {
                            updates.municipio = novoMunicipio;
                            diffs.push({ campo: 'Município (ViaCEP)', antes: data.municipio || '(vazio)', depois: novoMunicipio });
                        }
                        if (novoEstado && novoEstado !== originalEstado) {
                            updates.estado = novoEstado;
                            diffs.push({ campo: 'UF (ViaCEP)', antes: data.estado || '(vazio)', depois: novoEstado });
                        }
                    }
                } catch (errCep) {
                    console.warn('Falha ao buscar CEP em massa para', cepLimpo);
                }
            } else if (data.municipio && (data.logradouro || updates.logradouro)) {
                // Busca reversa de CEP via Município + Logradouro
                const munClean = data.municipio.trim();
                let logClean = (updates.logradouro || data.logradouro).trim();
                logClean = logClean.replace(/\b\d+[A-Z]?\b/g, '').trim();
                if (munClean.length >= 3 && logClean.length >= 3) {
                    try {
                        const uf = data.estado || 'RJ';
                        const resRev = await fetch(`https://viacep.com.br/ws/${uf}/${encodeURIComponent(munClean)}/${encodeURIComponent(logClean)}/json/`);
                        const revData = await resRev.json();
                        if (Array.isArray(revData) && revData.length > 0 && revData[0].cep) {
                            const cepAchado = revData[0].cep.replace(/\D/g, '');
                            if (cepAchado.length === 8) {
                                const cepFmt = (typeof window.formatMaskValue === 'function')
                                    ? window.formatMaskValue(cepAchado, 'cep')
                                    : revData[0].cep;
                                updates.cep = cepFmt;
                                diffs.push({ campo: 'CEP (Busca Reversa)', antes: data.cep || '(vazio)', depois: cepFmt });
                                if (!data.bairro && revData[0].bairro) {
                                    updates.bairro = revData[0].bairro.toUpperCase();
                                    diffs.push({ campo: 'Bairro (ViaCEP)', antes: '(vazio)', depois: updates.bairro });
                                }
                                if (!data.logradouro || data.logradouro.length < revData[0].logradouro.length) {
                                    updates.logradouro = revData[0].logradouro.toUpperCase();
                                    diffs.push({ campo: 'Logradouro (ViaCEP)', antes: data.logradouro || '(vazio)', depois: updates.logradouro });
                                }
                            }
                        }
                    } catch (errRev) {
                        console.warn('Falha na busca reversa de CEP para', data.nome);
                    }
                }
            }

            if (diffs.length > 0) {
                listaMudancas.push({
                    id: docSnap.id,
                    nome: data.nome || 'Sem Nome',
                    updates: updates,
                    diffs: diffs
                });
            }
        }

        window._pendentePadronizacao = listaMudancas;

        const modal = document.getElementById('modal-preview-padronizacao');
        const content = document.getElementById('modal-preview-padronizacao-content');
        const tbody = document.getElementById('tabela-preview-padronizacao-body');
        const tituloEl = document.getElementById('preview-padronizacao-titulo');
        const countEl = document.getElementById('preview-padronizacao-count');
        const btnConfirm = document.getElementById('btn-confirmar-padronizacao');

        if (listaMudancas.length === 0) {
            window.showModalAlert('O banco de dados já está 100% padronizado! Nenhuma alteração pendente foi encontrada.');
            return;
        }

        tituloEl.innerText = `${listaMudancas.length} cadastro(s) precisam de padronização`;
        countEl.innerText = `${listaMudancas.length} munícipe(s)`;
        btnConfirm.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Confirmar e Aplicar (${listaMudancas.length})`;

        let html = '';
        listaMudancas.forEach((item) => {
            let diffHtml = item.diffs.map(d => `
                <div class="flex items-center gap-2 py-1 text-xs border-b border-slate-100 last:border-0">
                    <span class="font-bold text-slate-700 w-28 shrink-0">${d.campo}:</span>
                    <span class="text-rose-600 line-through bg-rose-50 px-2 py-0.5 rounded">${d.antes || '(vazio)'}</span>
                    <i data-lucide="arrow-right" class="w-3 h-3 text-slate-400"></i>
                    <span class="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">${d.depois}</span>
                </div>
            `).join('');

            html += `
                <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                    <td class="px-4 py-3 font-bold text-slate-800 align-top max-w-[200px]">
                        ${item.nome}
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex flex-col gap-1">
                            ${diffHtml}
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
        }, 10);

    } catch (e) {
        console.error('Erro na análise de padronização:', e);
        window.showModalAlert('Ocorreu um erro durante a análise de padronização: ' + e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};

window.confirmarAplicarPadronizacaoBanco = async function() {
    const lista = window._pendentePadronizacao || [];
    if (lista.length === 0) return;

    const btn = document.getElementById('btn-confirmar-padronizacao');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 inline animate-spin"></i> Aplicando alterações...';
    }

    try {
        let count = 0;
        for (const item of lista) {
            await window.updateDoc(window.doc(window.db, 'pacientes', item.id), item.updates);
            count++;
        }
        if(typeof window.logAuditoria === 'function' && count > 0) window.logAuditoria('PADRONIZAÇÃO_MASSA', 'Munícipes (Auditoria)', `Padronização em massa aplicada em ${count} cadastro(s)`);
        window.fecharModalPreviewPadronizacao();
        window._pendentePadronizacao = [];
        window.showModalAlert(`Sucesso! ${count} cadastro(s) foram padronizados e salvos no banco de dados.`);
    } catch (e) {
        console.error('Erro ao aplicar padronização:', e);
        window.showModalAlert('Erro ao aplicar alterações: ' + e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};

// ============================================================================
// AUDITORIA DE ATENDIMENTOS ÓRFÃOS
// ============================================================================

window.fecharModalAtendimentosOrfaos = function() {
    const modal = document.getElementById('modal-atendimentos-orfaos');
    const content = document.getElementById('modal-atendimentos-orfaos-content');
    if(!modal) return;
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
};

window.auditarAtendimentosOrfaos = async function(btn) {
    const modal = document.getElementById('modal-atendimentos-orfaos');
    const tbody = document.getElementById('tabela-atendimentos-orfaos-body');
    const totalSpan = document.getElementById('total-atendimentos-orfaos');
    
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            document.getElementById('modal-atendimentos-orfaos-content').classList.remove('scale-95');
        }, 10);
    }

    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 inline animate-spin"></i> Procurando...';
    }

    try {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-500 font-bold"><i data-lucide="loader" class="w-6 h-6 inline animate-spin mr-2"></i> Varrendo banco de dados... isso pode demorar alguns segundos.</td></tr>';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // 1. Pegar todos os pacientes e fazer um Set de CPFs e IDs válidos
        const pSnap = await window.getDocs(window.collection(window.db, "pacientes"));
        const validCpfs = new Set();
        const validIds = new Set();
        
        pSnap.forEach(doc => {
            validIds.add(doc.id);
            const d = doc.data();
            if (d.cpf) {
                validCpfs.add(String(d.cpf).replace(/\D/g, ''));
                validCpfs.add(String(d.cpf)); // Formato com máscara também por precaução
            }
        });

        // 2. Pegar todos os atendimentos e verificar
        const aSnap = await window.getDocs(window.collection(window.db, "atendimentos"));
        const orfaos = [];

        aSnap.forEach(doc => {
            const d = doc.data();
            let isOrfao = true;

            // Se tem CPF vinculado e existe no Set de CPFs válidos
            if (d.cpf_paciente && validCpfs.has(String(d.cpf_paciente).replace(/\D/g, ''))) {
                isOrfao = false;
            } else if (d.cpf_paciente && validCpfs.has(String(d.cpf_paciente))) {
                isOrfao = false;
            }
            
            // Se tem paciente_id e ele existe nos IDs válidos
            if (d.paciente_id && validIds.has(d.paciente_id)) {
                isOrfao = false;
            }

            if (isOrfao) {
                orfaos.push({
                    id: doc.id,
                    data_abertura: d.data_abertura || 'N/A',
                    nome: d.nome_paciente || 'Sem Nome',
                    cpf: d.cpf_paciente || d.paciente_id || 'Sem Identificador'
                });
            }
        });

        totalSpan.innerText = orfaos.length;

        if (orfaos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-emerald-600 font-bold"><i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2"></i>Nenhum atendimento órfão encontrado! Tudo certo.</td></tr>';
        } else {
            let html = '';
            orfaos.forEach((orfao, idx) => {
                html += `
                    <tr id="tr-orfao-${idx}" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-3">${orfao.data_abertura}</td>
                        <td class="px-4 py-3 font-bold">${orfao.nome}</td>
                        <td class="px-4 py-3 font-mono text-xs text-slate-500">${orfao.cpf}</td>
                        <td class="px-4 py-3">
                            <button onclick="apagarOrfao('${orfao.id}', ${idx})" class="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded font-bold transition flex items-center gap-1">
                                <i data-lucide="trash-2" class="w-3 h-3"></i> Apagar Atendimento
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch(e) {
        console.error("Erro ao auditar órfãos:", e);
        window.showModalAlert("Erro ao buscar órfãos: " + e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};

window.apagarOrfao = async function(id, index) {
    if (!id) return;
    const conf = typeof window.showModalConfirm === 'function' 
        ? await window.showModalConfirm("Tem certeza que deseja apagar este atendimento órfão?")
        : confirm("Tem certeza que deseja apagar este atendimento órfão?");
    
    if (!conf) return;

    try {
        await window.deleteDoc(window.doc(window.db, 'atendimentos', id));
        if(typeof window.logAuditoria === 'function') window.logAuditoria('EXCLUSÃO_ÓRFÃO', 'Atendimentos (Auditoria)', `Exclusão de atendimento órfão ID: ${id}`);
        const tr = document.getElementById(`tr-orfao-${index}`);
        if (tr) {
            tr.classList.add('bg-red-50', 'opacity-50');
            setTimeout(() => {
                tr.remove();
                let total = document.querySelectorAll('#tabela-atendimentos-orfaos-body tr[id^="tr-orfao-"]').length;
                document.getElementById('total-atendimentos-orfaos').innerText = total;
                if (total === 0) {
                    document.getElementById('tabela-atendimentos-orfaos-body').innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-emerald-600 font-bold"><i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2"></i>Todos os órfãos foram removidos!</td></tr>';
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            }, 400);
        }
    } catch(e) {
        window.showModalAlert("Erro ao apagar atendimento: " + e.message);
    }
};

window.apagarTodosOrfaos = async function(btn) {
    const trs = document.querySelectorAll('#tabela-atendimentos-orfaos-body tr[id^="tr-orfao-"]');
    if(trs.length === 0) return;

    const conf = typeof window.showModalConfirm === 'function' 
        ? await window.showModalConfirm(`Tem certeza que deseja apagar TODOS os ${trs.length} atendimentos órfãos? Esta ação não tem volta.`)
        : confirm(`Tem certeza que deseja apagar TODOS os ${trs.length} atendimentos órfãos?`);
    
    if (!conf) return;

    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 inline animate-spin"></i> Apagando...';

    try {
        const batch = window.writeBatch(window.db);
        let count = 0;
        
        trs.forEach(tr => {
            const btnApagar = tr.querySelector('button[onclick^="apagarOrfao"]');
            if(btnApagar) {
                const match = btnApagar.getAttribute('onclick').match(/apagarOrfao\('([^']+)'/);
                if(match && match[1]) {
                    batch.delete(window.doc(window.db, 'atendimentos', match[1]));
                    count++;
                }
            }
        });

        if(count > 0) {
            await batch.commit();
            document.getElementById('tabela-atendimentos-orfaos-body').innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-emerald-600 font-bold"><i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2"></i>Todos os órfãos foram apagados em massa!</td></tr>';
            document.getElementById('total-atendimentos-orfaos').innerText = '0';
            if (typeof lucide !== 'undefined') lucide.createIcons();
            window.showModalAlert(`${count} atendimentos órfãos apagados com sucesso.`);
        }
    } catch(e) {
        console.error("Erro apagar lote órfãos", e);
        window.showModalAlert("Erro ao apagar em lote: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};
