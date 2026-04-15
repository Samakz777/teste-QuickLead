let bancoLeads = JSON.parse(localStorage.getItem("bancoLeads")) || [];
let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
let agendamentoAtual = null;

// ELEMENTOS
const nomeInput = document.getElementById("nome");
const numeroInput = document.getElementById("numero");
const unidadeInput = document.getElementById("unidade");
const dataInput = document.getElementById("data");
const horaInput = document.getElementById("hora");

const entradaFiltro = document.getElementById("entradaFiltro");
const saidaFiltro = document.getElementById("saidaFiltro");

const entradaBanco = document.getElementById("entradaBanco");
const listaBanco = document.getElementById("listaBanco");

const filtroData = document.getElementById("filtroData");
const listaAgenda = document.getElementById("listaAgenda");

const dataRelatorio = document.getElementById("dataRelatorio");
const resultadoRelatorio = document.getElementById("resultadoRelatorio");

const modal = document.getElementById("modalComprovante");
const textoComprovante = document.getElementById("textoComprovante");

const importarTexto = document.getElementById("importarTexto");

// =========================
// UTILIDADES GERAIS
// =========================
function salvar() {
  localStorage.setItem("bancoLeads", JSON.stringify(bancoLeads));
  localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
}

function trocarAba(id) {
  document.querySelectorAll(".aba").forEach((aba) => aba.classList.remove("ativa"));
  const destino = document.getElementById(id);
  if (destino) destino.classList.add("ativa");
}

function limparNumero(texto = "") {
  return String(texto).replace(/\D/g, "").replace(/^55/, "");
}

function getPhoneKey(numero) {
  if (!numero) return "";
  return limparNumero(numero).slice(-8);
}

function normalizarTexto(texto = "") {
  return String(texto).trim().toUpperCase();
}

function formatarNumero(numero) {
  const n = limparNumero(numero);

  if (n.length === 11) {
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  }

  if (n.length === 10) {
    return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  }

  return numero || "";
}

function escaparHTML(texto = "") {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setDataHoje() {
  if (!dataInput.value) {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    dataInput.value = `${ano}-${mes}-${dia}`;
  }
}

// =========================
// REGRAS DE STATUS
// =========================
function normalizarStatus(texto = "") {
  const bruto = normalizarTexto(texto).replace(/[\s._-]+/g, "");

  if (!bruto) return "NOVO";

  if (["NOVO", "NEW", "LEADNOVO", "LEAD"].includes(bruto)) return "NOVO";

  if (bruto === "REED1" || bruto === "REED01" || bruto === "REENG1" || bruto === "REENGAJAMENTO1") {
    return "REED1";
  }

  if (bruto === "REED2" || bruto === "REED02" || bruto === "REENG2" || bruto === "REENGAJAMENTO2") {
    return "REED2";
  }

  if (
    bruto === "REED29" ||
    bruto === "REENG29" ||
    bruto === "REENGAJAMENTO29"
  ) {
    return "REED29";
  }

  if (bruto === "PROM4" || bruto === "PROM04" || bruto === "PROMO4") {
    return "PROM4";
  }

  if (bruto === "LON" || bruto === "LONG" || bruto === "LONGDISTANCE") {
    return "LON";
  }

  if (bruto === "FOR" || bruto === "FORA" || bruto === "FORADECobertura".toUpperCase() || bruto === "FORADECOVERAGE") {
    return "FOR";
  }

  if (bruto === "DES" || bruto === "DESCARTADO" || bruto === "DESQUALIFICADO") {
    return "DES";
  }

  if (bruto === "PAT" || bruto === "PACIENTE") {
    return "PAT";
  }

  return bruto;
}

function obterCategoriaStatus(status) {
  const s = normalizarStatus(status);

  if (s === "NOVO" || s === "REED1") {
    return "UTIL_AGORA";
  }

  if (s === "REED2" || s === "REED29" || s === "PROM4") {
    return "IGNORAR_AGORA";
  }

  if (s === "LON" || s === "FOR" || s === "DES" || s === "PAT") {
    return "DESQUALIFICADO";
  }

  return "NEUTRO";
}

function obterPrioridadeStatus(status) {
  const s = normalizarStatus(status);

  if (s === "NOVO") return 1;
  if (s === "REED1") return 2;
  if (s === "REED2") return 3;
  if (s === "REED29") return 4;
  if (s === "PROM4") return 5;
  if (s === "LON" || s === "FOR" || s === "DES" || s === "PAT") return 99;

  return 50;
}

function statusEhDesqualificado(status) {
  return obterCategoriaStatus(status) === "DESQUALIFICADO";
}

function statusEhIgnoradoAgora(status) {
  return obterCategoriaStatus(status) === "IGNORAR_AGORA";
}

function statusEhUtilAgora(status) {
  return obterCategoriaStatus(status) === "UTIL_AGORA";
}

// =========================
// BANCO DE LEADS
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
    .map((p) => p.trim())
    .filter(Boolean);

  let status = "NOVO";

  if (partes.length > 0) {
    status = normalizarStatus(partes[partes.length - 1]);
  } else {
    const tokens = restante.split(/\s+/).filter(Boolean);
    if (tokens.length > 0) {
      status = normalizarStatus(tokens.join(""));
    }
  }

  return { numero, tipo: status };
}

function buscarLeadNoBancoPorNumero(numero) {
  const key = getPhoneKey(numero);
  if (!key) return null;
  return bancoLeads.find((lead) => getPhoneKey(lead.numero) === key) || null;
}

function salvarBanco() {
  const linhas = entradaBanco.value.split("\n");
  let adicionados = 0;
  let atualizados = 0;
  let ignorados = 0;

  linhas.forEach((linha) => {
    const dado = extrairNumeroEStatusDaLinha(linha);
    if (!dado) {
      ignorados++;
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

  bancoLeads.sort((a, b) => {
    const prioridadeA = obterPrioridadeStatus(a.tipo);
    const prioridadeB = obterPrioridadeStatus(b.tipo);

    if (prioridadeA !== prioridadeB) {
      return prioridadeA - prioridadeB;
    }

    return a.numero.localeCompare(b.numero);
  });

  salvar();
  entradaBanco.value = "";
  mostrarBanco();

  alert(
    `✅ Banco atualizado!\n\nAdicionados: ${adicionados}\nAtualizados: ${atualizados}\nIgnorados: ${ignorados}`
  );
}

function mostrarBanco() {
  if (!listaBanco) return;

  if (bancoLeads.length === 0) {
    listaBanco.innerHTML = "<p>Nenhum lead salvo no banco.</p>";
    return;
  }

  listaBanco.innerHTML = bancoLeads
    .map((lead, index) => {
      const categoria = obterCategoriaStatus(lead.tipo);
      let classe = "neutro";

      if (categoria === "UTIL_AGORA") classe = "util";
      if (categoria === "IGNORAR_AGORA") classe = "ignorar";
      if (categoria === "DESQUALIFICADO") classe = "desqualificado";

      return `
        <div class="agenda-item">
          <p><strong>${index + 1}.</strong> ${escaparHTML(formatarNumero(lead.numero))}</p>
          <p>Status: <strong>${escaparHTML(normalizarStatus(lead.tipo))}</strong></p>
          <p>Categoria: <strong>${classe.toUpperCase()}</strong></p>
        </div>
      `;
    })
    .join("");
}

// =========================
// FILTRO INTELIGENTE
// =========================
function filtrarLeads() {
  const linhas = entradaFiltro.value.split("\n");

  const aprovados = [];
  const removidosDuplicados = [];
  const removidosIgnorados = [];
  const removidosDesqualificados = [];
  const removidosInvalidos = [];

  const usados = new Set();

  linhas.forEach((linha) => {
    const numero = limparNumero(linha);
    if (!numero) {
      if (linha.trim()) removidosInvalidos.push(linha.trim());
      return;
    }

    const key = getPhoneKey(numero);
    if (!key) {
      removidosInvalidos.push(linha.trim());
      return;
    }

    if (usados.has(key)) {
      removidosDuplicados.push(numero);
      return;
    }

    usados.add(key);

    const leadBanco = buscarLeadNoBancoPorNumero(numero);

    if (!leadBanco) {
      aprovados.push({
        numero,
        status: "NOVO",
        origem: "ENTRADA NOVA"
      });
      return;
    }

    const status = normalizarStatus(leadBanco.tipo);

    if (statusEhDesqualificado(status)) {
      removidosDesqualificados.push(`${numero} (${status})`);
      return;
    }

    if (statusEhIgnoradoAgora(status)) {
      removidosIgnorados.push(`${numero} (${status})`);
      return;
    }

    if (statusEhUtilAgora(status)) {
      aprovados.push({
        numero,
        status,
        origem: "BANCO"
      });
      return;
    }

    aprovados.push({
      numero,
      status,
      origem: "BANCO"
    });
  });

  aprovados.sort((a, b) => {
    return obterPrioridadeStatus(a.status) - obterPrioridadeStatus(b.status);
  });

  let textoFinal = "";

  textoFinal += "LEADS APROVADOS\n";
  textoFinal += "====================\n";
  textoFinal += aprovados.length
    ? aprovados.map((lead) => `${lead.numero} - ${lead.status}`).join("\n")
    : "Nenhum lead aprovado.";

  textoFinal += "\n\nRESUMO\n";
  textoFinal += "====================\n";
  textoFinal += `Aprovados: ${aprovados.length}\n`;
  textoFinal += `Duplicados removidos: ${removidosDuplicados.length}\n`;
  textoFinal += `Ignorados no momento: ${removidosIgnorados.length}\n`;
  textoFinal += `Desqualificados removidos: ${removidosDesqualificados.length}\n`;
  textoFinal += `Inválidos: ${removidosInvalidos.length}\n`;

  if (removidosDuplicados.length) {
    textoFinal += "\nDUPLICADOS REMOVIDOS\n";
    textoFinal += "====================\n";
    textoFinal += removidosDuplicados.join("\n");
  }

  if (removidosIgnorados.length) {
    textoFinal += "\n\nIGNORADOS NO MOMENTO\n";
    textoFinal += "====================\n";
    textoFinal += removidosIgnorados.join("\n");
  }

  if (removidosDesqualificados.length) {
    textoFinal += "\n\nDESQUALIFICADOS REMOVIDOS\n";
    textoFinal += "====================\n";
    textoFinal += removidosDesqualificados.join("\n");
  }

  if (removidosInvalidos.length) {
    textoFinal += "\n\nLINHAS INVÁLIDAS\n";
    textoFinal += "====================\n";
    textoFinal += removidosInvalidos.join("\n");
  }

  saidaFiltro.value = textoFinal;
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
  const totalNoDia = agendamentos.filter((a) => a.data === data).length + 1;
  const [ano, mes, dia] = data.split("-");
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

function validarAgendamento({ nome, numero, unidade, data, hora }) {
  if (!nome || !numero || !unidade || !data || !hora) {
    alert("Preencha todos os campos!");
    return false;
  }

  if (nome.length < 3) {
    alert("Digite um nome válido.");
    return false;
  }

  if (numero.length < 10) {
    alert("Digite um número válido.");
    return false;
  }

  return true;
}

function agendar() {
  const nome = nomeInput.value.trim();
  const numero = limparNumero(numeroInput.value);
  const unidade = unidadeInput.value;
  const data = dataInput.value;
  const hora = horaInput.value;

  const dados = { nome, numero, unidade, data, hora };

  if (!validarAgendamento(dados)) return;
  if (!confirm("Confirmar agendamento?")) return;

  const senha = gerarSenha(data);

  const novoAgendamento = {
    nome,
    numero,
    unidade,
    data,
    hora,
    senha,
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

// =========================
// MODAL / WHATSAPP
// =========================
function mostrarModalComprovante(agendamento) {
  agendamentoAtual = agendamento;
  textoComprovante.value = gerarMensagem(agendamento);
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
}

function copiarComprovante() {
  const texto = textoComprovante.value;

  if (!texto) return;

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(texto)
      .then(() => alert("✅ Comprovante copiado!"))
      .catch(() => fallbackCopiarTexto());
    return;
  }

  fallbackCopiarTexto();
}

function fallbackCopiarTexto() {
  textoComprovante.select();
  textoComprovante.setSelectionRange(0, 99999);
  document.execCommand("copy");
  alert("✅ Comprovante copiado!");
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
  const texto = limparNumero(numero);

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(texto)
      .then(() => alert("✅ Número copiado!"))
      .catch(() => alert("Não foi possível copiar o número."));
    return;
  }

  alert(`Número: ${texto}`);
}

function verComprovante(index) {
  const agendamento = agendamentos[index];
  if (!agendamento) return;
  mostrarModalComprovante(agendamento);
}

function reenviarWhats(index) {
  const agendamento = agendamentos[index];
  if (!agendamento) return;

  const mensagem = gerarMensagem(agendamento);
  const link = `https://wa.me/55${limparNumero(agendamento.numero)}?text=${encodeURIComponent(mensagem)}`;

  window.open(link, "_blank");
}

function excluir(index) {
  const agendamento = agendamentos[index];
  if (!agendamento) return;

  if (!confirm(`Excluir o agendamento de ${agendamento.nome}?`)) return;

  agendamentos.splice(index, 1);
  salvar();
  filtrarAgenda();
}

function filtrarAgenda() {
  const dataSelecionada = filtroData.value;

  if (!dataSelecionada) {
    alert("Selecione uma data!");
    return;
  }

  const listaDoDia = agendamentos
    .map((agendamento, index) => ({ ...agendamento, indexOriginal: index }))
    .filter((agendamento) => agendamento.data === dataSelecionada)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  if (listaDoDia.length === 0) {
    listaAgenda.innerHTML = "<p>Nenhum agendamento para esta data.</p>";
    return;
  }

  listaAgenda.innerHTML = listaDoDia
    .map((agendamento) => {
      return `
        <div class="agenda-item">
          <p><strong>${escaparHTML(agendamento.nome)}</strong> — ${escaparHTML(agendamento.unidade)} — ${escaparHTML(agendamento.hora)}</p>
          <p>Senha: <strong>${escaparHTML(agendamento.senha)}</strong></p>
          <p>Número: <strong>${escaparHTML(formatarNumero(agendamento.numero))}</strong></p>
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
            <button onclick="copiarNumero('${agendamento.numero}')">Copiar Número</button>
            <button onclick="verComprovante(${agendamento.indexOriginal})">📋 Ver Comprovante</button>
            <button onclick="reenviarWhats(${agendamento.indexOriginal})">📱 Reenviar WhatsApp</button>
            <button onclick="excluir(${agendamento.indexOriginal})">Excluir</button>
          </div>
        </div>
      `;
    })
    .join("");
}

// =========================
// RELATÓRIOS
// =========================
function gerarRelatorio() {
  const dataSelecionada = dataRelatorio.value;

  if (!dataSelecionada) {
    alert("Selecione uma data!");
    return;
  }

  const lista = agendamentos.filter((a) => a.data === dataSelecionada);
  const contagemPorUnidade = {};

  lista.forEach((agendamento) => {
    contagemPorUnidade[agendamento.unidade] = (contagemPorUnidade[agendamento.unidade] || 0) + 1;
  });

  let texto = `Relatório ${dataSelecionada}\n\n`;

  if (lista.length === 0) {
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
// IMPORTAR / EXPORTAR
// =========================
function exportarDados() {
  const dados = {
    bancoLeads,
    agendamentos,
    exportadoEm: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(dados, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quicklead-dados.json";
  link.click();

  URL.revokeObjectURL(url);
  alert("✅ Arquivo JSON exportado com sucesso!");
}

function importarDados() {
  const texto = importarTexto.value.trim();

  if (!texto) {
    alert("Cole o conteúdo do JSON primeiro!");
    return;
  }

  if (!confirm("Importar esses dados? Os dados atuais serão substituídos.")) {
    return;
  }

  try {
    const dados = JSON.parse(texto);

    bancoLeads = Array.isArray(dados.bancoLeads)
      ? dados.bancoLeads.map((lead) => ({
          numero: limparNumero(lead.numero || ""),
          tipo: normalizarStatus(lead.tipo || "NOVO")
        })).filter((lead) => lead.numero)
      : [];

    agendamentos = Array.isArray(dados.agendamentos)
      ? dados.agendamentos.map((agendamento) => ({
          nome: String(agendamento.nome || "").trim(),
          numero: limparNumero(agendamento.numero || ""),
          unidade: String(agendamento.unidade || "").trim(),
          data: String(agendamento.data || "").trim(),
          hora: String(agendamento.hora || "").trim(),
          senha: String(agendamento.senha || "").trim(),
          criadoEm: agendamento.criadoEm || new Date().toISOString()
        })).filter((agendamento) => agendamento.nome && agendamento.numero && agendamento.data)
      : [];

    salvar();
    mostrarBanco();
    importarTexto.value = "";

    alert("✅ Dados importados com sucesso!");
  } catch (erro) {
    alert("❌ JSON inválido! Verifique o conteúdo colado.");
  }
}

// =========================
// INICIALIZAÇÃO
// =========================
setDataHoje();
mostrarBanco();
