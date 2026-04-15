let bancoLeads = JSON.parse(localStorage.getItem("bancoLeads")) || [];
let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
let agendamentoAtual = null;
let leadSelecionadoIndex = null;

// ELEMENTOS
const nomeInput = document.getElementById("nome");
const numeroInput = document.getElementById("numero");
const unidadeInput = document.getElementById("unidade");
const dataInput = document.getElementById("data");
const horaInput = document.getElementById("hora");

const entradaFiltro = document.getElementById("entradaFiltro");
const saidaFiltro = document.getElementById("saidaFiltro");
const saidaBloqueados = document.getElementById("saidaBloqueados");
const resumoFiltro = document.getElementById("resumoFiltro");

const entradaBanco = document.getElementById("entradaBanco");
const listaBanco = document.getElementById("listaBanco");
const buscaBanco = document.getElementById("buscaBanco");

const filtroData = document.getElementById("filtroData");
const listaAgenda = document.getElementById("listaAgenda");

const dataRelatorio = document.getElementById("dataRelatorio");
const resultadoRelatorio = document.getElementById("resultadoRelatorio");

const modal = document.getElementById("modalComprovante");
const textoComprovante = document.getElementById("textoComprovante");

const modalAcoesBanco = document.getElementById("modalAcoesBanco");
const syncStatusTexto = document.getElementById("syncStatusTexto");

// =========================
// BASE
// =========================
function salvar() {
  localStorage.setItem("bancoLeads", JSON.stringify(bancoLeads));
  localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
  atualizarStatusSync("Salvo localmente");
}

function atualizarStatusSync(texto = "Modo local ativo") {
  if (syncStatusTexto) {
    syncStatusTexto.textContent = texto;
  }
}

function trocarAba(id) {
  document.querySelectorAll(".aba").forEach((aba) => aba.classList.remove("ativa"));
  const abaDestino = document.getElementById(id);
  if (abaDestino) abaDestino.classList.add("ativa");
}

function limparNumero(texto = "") {
  return String(texto).replace(/\D/g, "").replace(/^55/, "");
}

function getPhoneKey(numero) {
  const limpo = limparNumero(numero);
  return limpo ? limpo.slice(-8) : "";
}

function normalizarTexto(texto = "") {
  return String(texto).trim().toUpperCase();
}

function escaparHTML(texto = "") {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatarNumero(numero = "") {
  const n = limparNumero(numero);

  if (n.length === 11) {
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  }

  if (n.length === 10) {
    return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  }

  return numero;
}

function copiarTexto(texto, mensagemSucesso = "✅ Copiado com sucesso!") {
  if (!texto) return;

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(texto)
      .then(() => alert(mensagemSucesso))
      .catch(() => fallbackCopiarTexto(texto, mensagemSucesso));
    return;
  }

  fallbackCopiarTexto(texto, mensagemSucesso);
}

function fallbackCopiarTexto(texto, mensagemSucesso) {
  const area = document.createElement("textarea");
  area.value = texto;
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
  alert(mensagemSucesso);
}

function setDataHoje() {
  if (!dataInput) return;

  if (!dataInput.value) {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    dataInput.value = `${ano}-${mes}-${dia}`;
  }
}

// =========================
// STATUS / REGRAS
// =========================
function normalizarStatus(texto = "") {
  const bruto = normalizarTexto(texto).replace(/[\s._-]+/g, "");

  if (!bruto) return "NOVO";

  if (["NOVO", "NEW", "LEADNOVO", "LEAD"].includes(bruto)) return "NOVO";

  if (["REED1", "REED01", "REENG1", "REENGAJAMENTO1", "REEDD1", "REEDIA1"].includes(bruto)) {
    return "REED1";
  }

  if (["REED2", "REED02", "REENG2", "REENGAJAMENTO2", "REEDD2"].includes(bruto)) {
    return "REED2";
  }

  if (["REED29", "REENG29", "REENGAJAMENTO29"].includes(bruto)) {
    return "REED29";
  }

  if (["PROM4", "PROM04", "PRO4", "PROMO4", "PROMM4", "PROMES4"].includes(bruto)) {
    return "PROM4";
  }

  if (["LON", "LONG", "LONGDISTANCE"].includes(bruto)) {
    return "LON";
  }

  if (["FOR", "FORA", "FORADECobertura".toUpperCase(), "FORADECOVERAGE"].includes(bruto)) {
    return "FOR";
  }

  if (["DES", "DESCARTADO", "DESQUALIFICADO"].includes(bruto)) {
    return "DES";
  }

  if (["PAT", "PATOLOGIA"].includes(bruto)) {
    return "PAT";
  }

  return bruto;
}

function obterCategoriaStatus(status) {
  const s = normalizarStatus(status);

  if (s === "NOVO" || s === "REED1") return "UTIL_AGORA";
  if (s === "REED2" || s === "REED29" || s === "PROM4") return "IGNORAR_AGORA";
  if (s === "LON" || s === "FOR" || s === "DES" || s === "PAT") return "DESQUALIFICADO";

  return "NEUTRO";
}

function obterPrioridadeStatus(status) {
  const s = normalizarStatus(status);

  if (s === "NOVO") return 1;
  if (s === "REED1") return 2;
  if (s === "REED2") return 3;
  if (s === "REED29") return 4;
  if (s === "PROM4") return 5;
  if (s === "DES") return 96;
  if (s === "LON") return 97;
  if (s === "FOR") return 98;
  if (s === "PAT") return 99;

  return 50;
}

function categoriaParaClasse(categoria) {
  if (categoria === "UTIL_AGORA") return "util";
  if (categoria === "IGNORAR_AGORA") return "ignorar";
  if (categoria === "DESQUALIFICADO") return "desqualificado";
  return "neutro";
}

// =========================
// BANCO
// =========================
function extrairNumeroEStatusDaLinha(linha = "") {
  const texto = String(linha).trim();
  if (!texto) return null;

  const numeroEncontrado = texto.match(/(?:\+?55\s*)?(\d[\d\s().-]{7,}\d)/);
  const numero = numeroEncontrado ? limparNumero(numeroEncontrado[0]) : "";

  if (!numero) return null;

  let restante = texto.replace(numeroEncontrado[0], " ");
  restante = restante.replace(/[–—]/g, "-").trim();

  const partes = restante
    .split("-")
    .map((parte) => parte.trim())
    .filter(Boolean);

  let status = "NOVO";

  if (partes.length > 0) {
    status = normalizarStatus(partes[partes.length - 1]);
  } else {
    const fallback = restante.split(/\s+/).filter(Boolean).join("");
    if (fallback) status = normalizarStatus(fallback);
  }

  return {
    numero,
    tipo: status
  };
}

function buscarLeadNoBancoPorNumero(numero) {
  const chave = getPhoneKey(numero);
  if (!chave) return null;

  return bancoLeads.find((lead) => getPhoneKey(lead.numero) === chave) || null;
}

function ordenarBanco() {
  bancoLeads.sort((a, b) => {
    const prioridadeA = obterPrioridadeStatus(a.tipo);
    const prioridadeB = obterPrioridadeStatus(b.tipo);

    if (prioridadeA !== prioridadeB) {
      return prioridadeA - prioridadeB;
    }

    return limparNumero(a.numero).localeCompare(limparNumero(b.numero));
  });
}

function salvarBanco() {
  const linhas = entradaBanco.value.split("\n");
  let adicionados = 0;
  let atualizados = 0;
  let ignorados = 0;

  linhas.forEach((linha) => {
    const dado = extrairNumeroEStatusDaLinha(linha);

    if (!dado) {
      if (linha.trim()) ignorados++;
      return;
    }

    const existente = buscarLeadNoBancoPorNumero(dado.numero);

    if (existente) {
      existente.numero = dado.numero;
      existente.tipo = normalizarStatus(dado.tipo);
      atualizados++;
    } else {
      bancoLeads.push({
        numero: dado.numero,
        tipo: normalizarStatus(dado.tipo)
      });
      adicionados++;
    }
  });

  ordenarBanco();
  salvar();
  entradaBanco.value = "";
  mostrarBanco();

  alert(
    `✅ Banco atualizado!\n\nAdicionados: ${adicionados}\nAtualizados: ${atualizados}\nIgnorados: ${ignorados}`
  );
}

function renderBanco(lista = bancoLeads) {
  if (!listaBanco) return;

  if (!lista.length) {
    listaBanco.innerHTML = "<p>Nenhum lead encontrado no banco.</p>";
    return;
  }

  listaBanco.innerHTML = lista.map((lead) => {
    const categoria = obterCategoriaStatus(lead.tipo);
    const classe = categoriaParaClasse(categoria);
    const indexOriginal = bancoLeads.findIndex(
      (item) => getPhoneKey(item.numero) === getPhoneKey(lead.numero)
    );

    return `
      <div class="agenda-item ${classe}">
        <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
          <div>
            <p><strong>${escaparHTML(formatarNumero(lead.numero))}</strong></p>
            <p>Status: <strong>${escaparHTML(normalizarStatus(lead.tipo))}</strong></p>
            <p>Categoria: <strong>${escaparHTML(categoria)}</strong></p>
          </div>

          <button
            type="button"
            onclick="abrirAcoesBanco(${indexOriginal})"
            aria-label="Abrir ações do lead"
            style="min-width:44px;"
          >⋯</button>
        </div>
      </div>
    `;
  }).join("");
}

function mostrarBanco() {
  renderBanco(bancoLeads);
}

function filtrarBancoManual() {
  const termo = normalizarTexto(buscaBanco?.value || "");

  if (!termo) {
    renderBanco(bancoLeads);
    return;
  }

  const listaFiltrada = bancoLeads.filter((lead) => {
    const numero = limparNumero(lead.numero);
    const numeroFormatado = formatarNumero(lead.numero).toUpperCase();
    const status = normalizarStatus(lead.tipo);

    return (
      numero.includes(termo.replace(/\D/g, "")) ||
      numeroFormatado.includes(termo) ||
      status.includes(termo)
    );
  });

  renderBanco(listaFiltrada);
}

function limparBancoCompleto() {
  if (!bancoLeads.length) {
    alert("O banco já está vazio.");
    return;
  }

  const confirmar = confirm(
    "Tem certeza que deseja apagar todo o banco de leads?\n\nEssa ação não pode ser desfeita."
  );

  if (!confirmar) return;

  bancoLeads = [];
  salvar();
  mostrarBanco();

  if (buscaBanco) buscaBanco.value = "";

  alert("✅ Banco apagado com sucesso.");
}

function abrirAcoesBanco(index) {
  leadSelecionadoIndex = index;
  if (modalAcoesBanco) {
    modalAcoesBanco.style.display = "flex";
    modalAcoesBanco.setAttribute("aria-hidden", "false");
  }
}

function fecharModalBanco() {
  leadSelecionadoIndex = null;
  if (modalAcoesBanco) {
    modalAcoesBanco.style.display = "none";
    modalAcoesBanco.setAttribute("aria-hidden", "true");
  }
}

function editarLeadSelecionado() {
  if (leadSelecionadoIndex === null || !bancoLeads[leadSelecionadoIndex]) return;

  const lead = bancoLeads[leadSelecionadoIndex];

  const novoNumero = prompt("Editar número:", lead.numero);
  if (novoNumero === null) return;

  const novoStatus = prompt(
    "Editar status:\n\nUse por exemplo: NOVO, REED1, REED2, REED29, PROM4, DES, LON, FOR, PAT",
    lead.tipo
  );
  if (novoStatus === null) return;

  const numeroLimpo = limparNumero(novoNumero);
  const statusNormalizado = normalizarStatus(novoStatus);

  if (!numeroLimpo) {
    alert("Número inválido.");
    return;
  }

  lead.numero = numeroLimpo;
  lead.tipo = statusNormalizado;

  ordenarBanco();
  salvar();
  mostrarBanco();
  fecharModalBanco();

  alert("✅ Lead atualizado com sucesso.");
}

function excluirLeadSelecionado() {
  if (leadSelecionadoIndex === null || !bancoLeads[leadSelecionadoIndex]) return;

  const lead = bancoLeads[leadSelecionadoIndex];
  const confirmar = confirm(
    `Excluir este lead?\n\n${formatarNumero(lead.numero)} - ${normalizarStatus(lead.tipo)}`
  );

  if (!confirmar) return;

  bancoLeads.splice(leadSelecionadoIndex, 1);
  salvar();
  mostrarBanco();
  fecharModalBanco();

  alert("✅ Lead excluído com sucesso.");
}

function sincronizarAgora() {
  atualizarStatusSync("Sincronização online ainda não configurada");
  alert(
    "A estrutura já está pronta, mas a sincronização em tempo real ainda depende de banco online.\n\nNo próximo passo, isso pode ser ligado com Firebase."
  );
}

// =========================
// FILTRO
// =========================
function filtrarLeads() {
  const linhas = entradaFiltro.value.split("\n");

  const aprovados = [];
  const bloqueados = [];
  const usados = new Set();

  let totalDuplicados = 0;
  let totalIgnorados = 0;
  let totalDesqualificados = 0;
  let totalInvalidos = 0;
  let totalNovos = 0;
  let totalReed1 = 0;

  linhas.forEach((linha) => {
    const numero = limparNumero(linha);

    if (!numero) {
      if (linha.trim()) {
        totalInvalidos++;
        bloqueados.push(`${linha.trim()} - INVÁLIDO`);
      }
      return;
    }

    const chave = getPhoneKey(numero);

    if (!chave) {
      totalInvalidos++;
      bloqueados.push(`${linha.trim()} - INVÁLIDO`);
      return;
    }

    if (usados.has(chave)) {
      totalDuplicados++;
      bloqueados.push(`${numero} - DUPLICADO`);
      return;
    }

    usados.add(chave);

    const leadBanco = buscarLeadNoBancoPorNumero(numero);

    if (!leadBanco) {
      aprovados.push(`${numero} - NOVO`);
      totalNovos++;
      return;
    }

    const status = normalizarStatus(leadBanco.tipo);
    const categoria = obterCategoriaStatus(status);

    if (categoria === "UTIL_AGORA") {
      aprovados.push(`${numero} - ${status}`);
      if (status === "NOVO") totalNovos++;
      if (status === "REED1") totalReed1++;
      return;
    }

    if (categoria === "IGNORAR_AGORA") {
      totalIgnorados++;
      bloqueados.push(`${numero} - ${status} - IGNORAR AGORA`);
      return;
    }

    if (categoria === "DESQUALIFICADO") {
      totalDesqualificados++;
      bloqueados.push(`${numero} - ${status} - DESQUALIFICADO`);
      return;
    }

    aprovados.push(`${numero} - ${status}`);
  });

  saidaFiltro.value = aprovados.join("\n");
  saidaBloqueados.value = bloqueados.join("\n");

  resumoFiltro.value =
`RESUMO DA TRIAGEM
====================
Aprovados: ${aprovados.length}
- Novos: ${totalNovos}
- REED1: ${totalReed1}

Bloqueados: ${bloqueados.length}
- Duplicados: ${totalDuplicados}
- Ignorados no momento: ${totalIgnorados}
- Desqualificados: ${totalDesqualificados}
- Inválidos: ${totalInvalidos}

REGRAS ATIVAS
====================
TRABALHAR AGORA:
- NOVO
- REED1

IGNORAR NO MOMENTO:
- REED2
- REED29
- PROM4

DESQUALIFICAR:
- DES
- LON
- FOR
- PAT`;
}

function copiarAprovados() {
  const texto = saidaFiltro.value.trim();

  if (!texto) {
    alert("Não há aprovados para copiar.");
    return;
  }

  copiarTexto(texto, "✅ Leads aprovados copiados.");
}

function limparFiltro() {
  if (entradaFiltro) entradaFiltro.value = "";
  if (saidaFiltro) saidaFiltro.value = "";
  if (saidaBloqueados) saidaBloqueados.value = "";
  if (resumoFiltro) resumoFiltro.value = "";
}

// =========================
// AGENDAMENTO
// =========================
function formatarHorario(hora = "") {
  if (!hora.includes(":")) return hora;

  const [h, m] = hora.split(":");
  const horaNum = Number(h);
  const periodo = horaNum < 12 ? "DA MANHÃ" : "DA TARDE";

  return `${h}:${m}H ${periodo}`;
}

function gerarSenha(data) {
  const totalNoDia = agendamentos.filter((item) => item.data === data).length + 1;
  const [, mes, dia] = data.split("-");
  return `PJ${dia}${mes}-${String(totalNoDia).padStart(2, "0")}`;
}

function gerarMensagem(agendamento) {
  const dataFormatada = agendamento.data.split("-").reverse().join("/");
  const horaFormatada = formatarHorario(agendamento.hora);

  return `*SEU AGENDAMENTO FOI CONFIRMADO!✅*

*Consultor: PAULO LOBATO*

*Pacientes: ${agendamento.nome.toUpperCase()}*

Senha:
*${agendamento.senha}*

*UNIDADE: ${agendamento.unidade}*

*DATA: ${dataFormatada} às ${horaFormatada}!*

*LEVAR UM DOCUMENTO OFICIAL COM FOTO*

*Não realizam o exame:*
* Crianças menores de 6 anos
* Lactantes e Gestantes
* Menores de idade ir acompanhado(a) com responsável
* Atendimento por ordem de chegada

*Tenha um excelente exame!😃*

Projeto Enxergar 🌐`;
}

function validarAgendamento(dados) {
  if (!dados.nome || !dados.numero || !dados.unidade || !dados.data || !dados.hora) {
    alert("Preencha todos os campos.");
    return false;
  }

  if (dados.nome.trim().length < 3) {
    alert("Digite um nome válido.");
    return false;
  }

  if (limparNumero(dados.numero).length < 10) {
    alert("Digite um número válido.");
    return false;
  }

  return true;
}

function agendar() {
  const dados = {
    nome: nomeInput.value.trim(),
    numero: limparNumero(numeroInput.value),
    unidade: unidadeInput.value,
    data: dataInput.value,
    hora: horaInput.value
  };

  if (!validarAgendamento(dados)) return;
  if (!confirm("Confirmar agendamento?")) return;

  const novoAgendamento = {
    ...dados,
    senha: gerarSenha(dados.data),
    criadoEm: new Date().toISOString()
  };

  agendamentos.push(novoAgendamento);
  salvar();

  nomeInput.value = "";
  numeroInput.value = "";
  unidadeInput.value = "";
  dataInput.value = "";
  horaInput.value = "";

  mostrarModalComprovante(novoAgendamento);
  setDataHoje();
}

function mostrarModalComprovante(agendamento) {
  agendamentoAtual = agendamento;
  textoComprovante.value = gerarMensagem(agendamento);
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
}

function copiarComprovante() {
  const texto = textoComprovante.value.trim();
  if (!texto) return;
  copiarTexto(texto, "✅ Comprovante copiado.");
}

function enviarWhats() {
  if (!agendamentoAtual) return;

  const numero = limparNumero(agendamentoAtual.numero);
  const mensagem = textoComprovante.value || gerarMensagem(agendamentoAtual);
  const link = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`;

  window.open(link, "_blank");
}

function fecharModal() {
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  agendamentoAtual = null;
}

// =========================
// AGENDA
// =========================
function copiarNumero(numero) {
  copiarTexto(limparNumero(numero), "✅ Número copiado.");
}

function verComprovante(index) {
  const agendamento = agendamentos[index];
  if (!agendamento) return;
  mostrarModalComprovante(agendamento);
}

function reenviarWhats(index) {
  const agendamento = agendamentos[index];
  if (!agendamento) return;

  const link = `https://wa.me/55${limparNumero(agendamento.numero)}?text=${encodeURIComponent(gerarMensagem(agendamento))}`;
  window.open(link, "_blank");
}

function excluir(index) {
  const agendamento = agendamentos[index];
  if (!agendamento) return;

  const confirmar = confirm(`Excluir o agendamento de ${agendamento.nome}?`);
  if (!confirmar) return;

  agendamentos.splice(index, 1);
  salvar();
  filtrarAgenda();
}

function filtrarAgenda() {
  const dataSelecionada = filtroData.value;

  if (!dataSelecionada) {
    alert("Selecione uma data.");
    return;
  }

  const listaDoDia = agendamentos
    .map((item, index) => ({ ...item, indexOriginal: index }))
    .filter((item) => item.data === dataSelecionada)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  if (!listaDoDia.length) {
    listaAgenda.innerHTML = "<p>Nenhum agendamento para esta data.</p>";
    return;
  }

  listaAgenda.innerHTML = listaDoDia.map((item) => `
    <div class="agenda-item">
      <p><strong>${escaparHTML(item.nome)}</strong> — ${escaparHTML(item.unidade)} — ${escaparHTML(item.hora)}</p>
      <p>Senha: <strong>${escaparHTML(item.senha)}</strong></p>
      <p>Número: <strong>${escaparHTML(formatarNumero(item.numero))}</strong></p>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
        <button type="button" onclick="copiarNumero('${item.numero}')">Copiar Número</button>
        <button type="button" onclick="verComprovante(${item.indexOriginal})">📋 Ver Comprovante</button>
        <button type="button" onclick="reenviarWhats(${item.indexOriginal})">📱 Reenviar WhatsApp</button>
        <button type="button" onclick="excluir(${item.indexOriginal})">Excluir</button>
      </div>
    </div>
  `).join("");
}

// =========================
// RELATÓRIOS
// =========================
function gerarRelatorio() {
  const dataSelecionada = dataRelatorio.value;

  if (!dataSelecionada) {
    alert("Selecione uma data.");
    return;
  }

  const lista = agendamentos.filter((item) => item.data === dataSelecionada);
  const contagemPorUnidade = {};

  lista.forEach((item) => {
    contagemPorUnidade[item.unidade] = (contagemPorUnidade[item.unidade] || 0) + 1;
  });

  let texto = `Relatório ${dataSelecionada}\n\n`;

  if (!lista.length) {
    texto += "Nenhum agendamento encontrado para esta data.";
    resultadoRelatorio.textContent = texto;
    return;
  }

  Object.keys(contagemPorUnidade)
    .sort((a, b) => a.localeCompare(b))
    .forEach((unidade) => {
      texto += `${unidade}: ${contagemPorUnidade[unidade]}\n`;
    });

  texto += `\nTotal do dia: ${lista.length}`;
  resultadoRelatorio.textContent = texto;
}

// =========================
// INICIALIZAÇÃO
// =========================
setDataHoje();
ordenarBanco();
mostrarBanco();
atualizarStatusSync("Modo local ativo");
