let bancoLeads = JSON.parse(localStorage.getItem("bancoLeads")) || [];
let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
let temaSalvo = localStorage.getItem("quickleadTema") || "dark";

let agendamentoAtual = null;
let leadSelecionadoIndex = null;
let tipoComprovanteAtual = "paciente";

// ELEMENTOS
const unidadeInput = document.getElementById("unidade");
const dataInput = document.getElementById("data");
const horaInput = document.getElementById("hora");
const tipoAgendamentoInput = document.getElementById("tipoAgendamento");

const listaPessoas = document.getElementById("listaPessoas");

const entradaFiltro = document.getElementById("entradaFiltro");
const saidaFiltro = document.getElementById("saidaFiltro");
const saidaBloqueados = document.getElementById("saidaBloqueados");
const resumoFiltro = document.getElementById("resumoFiltro");

const entradaBanco = document.getElementById("entradaBanco");
const listaBanco = document.getElementById("listaBanco");
const buscaBanco = document.getElementById("buscaBanco");
const resumoBanco = document.getElementById("resumoBanco");
const segmentacaoEmMassa = document.getElementById("segmentacaoEmMassa");

const filtroSegmentacaoBanco = document.getElementById("filtroSegmentacaoBanco");
const filtroDiaReed = document.getElementById("filtroDiaReed");
const filtroMesPro = document.getElementById("filtroMesPro");

const painelReed = document.getElementById("painelReed");
const painelPro = document.getElementById("painelPro");
const campanhaVisualizacao = document.getElementById("campanhaVisualizacao");

const filtroData = document.getElementById("filtroData");
const listaAgenda = document.getElementById("listaAgenda");

const dataRelatorio = document.getElementById("dataRelatorio");
const resultadoRelatorio = document.getElementById("resultadoRelatorio");

const modal = document.getElementById("modalComprovante");
const textoComprovante = document.getElementById("textoComprovante");

const modalAcoesBanco = document.getElementById("modalAcoesBanco");
const modalSegmentacaoMassa = document.getElementById("modalSegmentacaoMassa");
const syncStatusTexto = document.getElementById("syncStatusTexto");
const modalListaLeads = document.getElementById("modalListaLeads");
const modalListaLeadsTitulo = document.getElementById("titulo-modal-lista-leads");
const modalListaLeadsConteudo = document.getElementById("modalListaLeadsConteudo");
const toastContainer = document.getElementById("toastContainer");
const modalConfirmacao = document.getElementById("modalConfirmacao");
const modalConfirmacaoMensagem = document.getElementById("modalConfirmacaoMensagem");
const modalConfirmacaoDetalhe = document.getElementById("modalConfirmacaoDetalhe");
const btnConfirmarModalAcao = document.getElementById("btnConfirmarModalAcao");
const modalEntrada = document.getElementById("modalEntrada");
const modalEntradaInput = document.getElementById("modalEntradaInput");
const modalEntradaLabel = document.getElementById("modalEntradaLabel");

let resolverModalConfirmacao = null;
let resolverModalEntrada = null;
const nomeTMKInput = document.getElementById("nomeTMK");
const generoTMKInput = document.getElementById("generoTMK");
const importarTXTInput = document.getElementById("importarTXT");
const segmentacaoPadraoBanco = document.getElementById("segmentacaoPadraoBanco");
const segmentacaoPadraoReed = document.getElementById("segmentacaoPadraoReed");
const segmentacaoPadraoPro = document.getElementById("segmentacaoPadraoPro");
const modalEntradaSelect = document.getElementById("modalEntradaSelect");
const btnGeneroM = document.getElementById("btnGeneroM");
const btnGeneroF = document.getElementById("btnGeneroF");
let nomeTMK = localStorage.getItem("quickleadTMK") || "PAULO LOBATO";
let generoTMK = localStorage.getItem("quickleadGeneroTMK") || "M";

function getNomeTMK() {
  return (nomeTMK || "PAULO LOBATO").trim().toUpperCase();
}

function getGeneroTMK() {
  return generoTMK === "F" ? "F" : "M";
}

function getTituloConsultor() {
  return getGeneroTMK() === "F" ? "Consultora" : "Consultor";
}

function getTituloPaciente(qtd = 1) {
  return Number(qtd) === 1 ? "Paciente" : "Pacientes";
}

function getTituloSenha(qtd = 1) {
  return Number(qtd) === 1 ? "Senha" : "Senhas";
}

function formatarNumeroWhats(numero = "") {
  const n = limparNumero(numero);
  if (!n) return "";
  return n.startsWith("55") ? n : `55${n}`;
}

function formatarTipoRegistro(tipo = "agendamento") {
  const mapa = { agendamento: "AGENDAMENTO", inclusao: "INCLUSÃO", reagendamento: "REAGENDAMENTO" };
  return mapa[tipo] || String(tipo || "AGENDAMENTO").toUpperCase();
}

function normalizarTipoRegistro(tipo = "agendamento") {
  const bruto = normalizarTexto(tipo).replace(/[Ç]/g, "C");
  if (["INCLUSAO", "INCLUSAO NO MESMO DIA"].includes(bruto)) return "inclusao";
  if (["REAGENDAMENTO", "REAGENDAR"].includes(bruto)) return "reagendamento";
  return "agendamento";
}

const UNIDADES_ORDEM = [
  "Augusto Montenegro", "Marabá", "Ananindeua", "Telégrafo", "Marambaia",
  "José Bonifácio", "Cidade Nova", "Jurunas", "Castanhal", "Capanema",
  "Manaus", "Manoa", "Fortaleza"
];

const UNIDADES_RELATORIO = {
  "Augusto Montenegro": "AUGUSTO",
  "Marabá": "MARABÁ",
  "Ananindeua": "ANANINDEUA",
  "Telégrafo": "TELÉGRAFO",
  "Marambaia": "MARAMBAIA",
  "José Bonifácio": "J.BONIFÁCIO",
  "Cidade Nova": "CIDADE NOVA",
  "Jurunas": "JURUNAS",
  "Castanhal": "CASTANHAL",
  "Capanema": "CAPANEMA",
  "Manaus": "MANAUS",
  "Manoa": "MANOA",
  "Fortaleza": "FORTALEZA"
};


function atualizarGeneroUI() {
  document.documentElement.setAttribute("data-genero", getGeneroTMK());
  if (generoTMKInput) generoTMKInput.value = getGeneroTMK();
  btnGeneroM?.classList.toggle("ativo", getGeneroTMK() === "M");
  btnGeneroF?.classList.toggle("ativo", getGeneroTMK() === "F");
}

function setGeneroTMK(valor) {
  generoTMK = valor === "F" ? "F" : "M";
  localStorage.setItem("quickleadGeneroTMK", generoTMK);
  atualizarGeneroUI();
  mostrarToast(generoTMK === "F" ? "Perfil definido como consultora." : "Perfil definido como consultor.", "ok");
}

function mostrarToast(texto, tipo = "ok", subtexto = "") {

  if (!toastContainer) {
    console.log(texto);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast--${tipo}`;
  toast.innerHTML = `
    <div class="toast__corpo">
      <div class="toast__texto">${escaparHTML(texto)}</div>
      ${subtexto ? `<div class="toast__sub">${escaparHTML(subtexto)}</div>` : ""}
    </div>
    <button type="button" class="toast__fechar" aria-label="Fechar">×</button>
  `;

  const remover = () => {
    toast.classList.add("saindo");
    setTimeout(() => toast.remove(), 180);
  };

  toast.querySelector(".toast__fechar")?.addEventListener("click", remover);
  toastContainer.appendChild(toast);
  setTimeout(remover, 2800);
}

function abrirModalBase(modalEl) {
  if (!modalEl) return;
  modalEl.style.display = "flex";
  modalEl.setAttribute("aria-hidden", "false");
}

function fecharModalBase(modalEl) {
  if (!modalEl) return;
  modalEl.style.display = "none";
  modalEl.setAttribute("aria-hidden", "true");
}

function confirmarAcao(mensagem, detalhe = "", textoConfirmar = "Confirmar") {
  return new Promise((resolve) => {
    if (!modalConfirmacao) {
      resolve(window.confirm(mensagem));
      return;
    }

    resolverModalConfirmacao = resolve;
    if (modalConfirmacaoMensagem) modalConfirmacaoMensagem.textContent = mensagem;
    if (modalConfirmacaoDetalhe) modalConfirmacaoDetalhe.textContent = detalhe || "";
    if (btnConfirmarModalAcao) btnConfirmarModalAcao.textContent = textoConfirmar;
    abrirModalBase(modalConfirmacao);
  });
}

function fecharModalConfirmacao(confirmado = false) {
  fecharModalBase(modalConfirmacao);
  if (resolverModalConfirmacao) {
    const fn = resolverModalConfirmacao;
    resolverModalConfirmacao = null;
    fn(confirmado);
  }
}

function solicitarEntrada(label, valorInicial = "", titulo = "Editar campo") {
  return new Promise((resolve) => {
    if (!modalEntrada || !modalEntradaInput) {
      resolve(window.prompt(label, valorInicial));
      return;
    }

    resolverModalEntrada = resolve;
    if (modalEntradaSelect) { modalEntradaSelect.style.display = "none"; modalEntradaSelect.innerHTML = ""; }
    if (modalEntradaInput) { modalEntradaInput.style.display = ""; modalEntradaInput.removeAttribute("list"); }
    const tituloEl = document.getElementById("titulo-modal-entrada");
    if (tituloEl) tituloEl.textContent = titulo;
    if (modalEntradaLabel) modalEntradaLabel.textContent = label;
    modalEntradaInput.value = valorInicial || "";
    abrirModalBase(modalEntrada);
    setTimeout(() => modalEntradaInput.focus(), 30);
  });
}

function confirmarModalEntrada() {
  const usandoSelect = modalEntradaSelect && modalEntradaSelect.style.display !== "none";
  fecharModalEntrada(usandoSelect ? (modalEntradaSelect.value ?? "") : (modalEntradaInput?.value ?? ""));
}

function fecharModalEntrada(valor = null) {
  fecharModalBase(modalEntrada);
  if (modalEntradaSelect) { modalEntradaSelect.style.display = "none"; modalEntradaSelect.innerHTML = ""; }
  if (modalEntradaInput) { modalEntradaInput.style.display = ""; modalEntradaInput.removeAttribute("list"); }
  if (resolverModalEntrada) {
    const fn = resolverModalEntrada;
    resolverModalEntrada = null;
    fn(valor);
  }
}


// =========================
// BASE / UTILIDADES
// =========================
function salvar() {
  localStorage.setItem("bancoLeads", JSON.stringify(bancoLeads));
  localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
  atualizarStatusSync("Salvo localmente");
}

function atualizarStatusSync(texto = "Modo local ativo") {
  if (syncStatusTexto) syncStatusTexto.textContent = texto;
}

function trocarAba(id) {
  document.querySelectorAll(".aba").forEach((aba) => aba.classList.remove("ativa"));
  const abaDestino = document.getElementById(id);
  if (abaDestino) abaDestino.classList.add("ativa");

  document.querySelectorAll("nav.menu button").forEach((btn) => btn.classList.remove("ativo"));
  const botaoAtivo = Array.from(document.querySelectorAll("nav.menu button")).find((btn) => {
    const destino = btn.getAttribute("aria-controls") || "";
    return destino === id || btn.getAttribute("onclick")?.includes(`'${id}'`);
  });
  if (botaoAtivo) botaoAtivo.classList.add("ativo");
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

function copiarTexto(texto, mensagem = "✅ Copiado com sucesso!") {
  if (!texto) return;

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(texto)
      .then(() => mostrarToast(mensagem, "ok"))
      .catch(() => fallbackCopiarTexto(texto, mensagem));
    return;
  }

  fallbackCopiarTexto(texto, mensagem);
}

function fallbackCopiarTexto(texto, mensagem) {
  const area = document.createElement("textarea");
  area.value = texto;
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
  mostrarToast(mensagem, "ok");
}

function agoraISO() {
  return new Date().toISOString();
}

function formatarDataBR(dataISO) {
  if (!dataISO) return "";
  const [, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}`;
}

function formatarDataBRCompleta(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function obterNomeDiaSemana(dataISO) {
  const data = new Date(`${dataISO}T12:00:00`);
  return data.toLocaleDateString("pt-BR", { weekday: "long" });
}

function capitalizar(texto = "") {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("quickleadTema", theme);
}

function alternarTema() {
  const atual = document.documentElement.getAttribute("data-theme") || "dark";
  const novo = atual === "dark" ? "light" : "dark";
  setTheme(novo);
}

function diferencaEmDias(inicioISO, fim = new Date()) {
  if (!inicioISO) return 0;
  const inicio = new Date(inicioISO);
  const diff = fim.getTime() - inicio.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function diferencaEmMeses(inicioISO, fim = new Date()) {
  if (!inicioISO) return 0;
  const inicio = new Date(inicioISO);

  let meses = (fim.getFullYear() - inicio.getFullYear()) * 12;
  meses += fim.getMonth() - inicio.getMonth();

  if (fim.getDate() < inicio.getDate()) {
    meses -= 1;
  }

  return Math.max(0, meses);
}

// =========================
// COMPATIBILIDADE DE REGISTROS ANTIGOS
// =========================
function normalizarAgendamento(agendamento = {}) {
  if (Array.isArray(agendamento.pessoas) && agendamento.pessoas.length) {
    return {
      ...agendamento,
      pessoas: agendamento.pessoas.map((pessoa) => ({
        nome: (pessoa?.nome || "").trim(),
        numero: limparNumero(pessoa?.numero || ""),
        observacao: (pessoa?.observacao || "").trim(),
        senha: pessoa?.senha || ""
      }))
    };
  }

  // Compatibilidade com formato antigo:
  // { nome, numero, senha, unidade, data, hora, tipo }
  const pessoaLegacy = {
    nome: (agendamento.nome || "").trim(),
    numero: limparNumero(agendamento.numero || ""),
    observacao: (agendamento.observacao || "").trim(),
    senha: agendamento.senha || ""
  };

  return {
    ...agendamento,
    tipo: agendamento.tipo || "agendamento",
    pessoas: [pessoaLegacy]
  };
}

function normalizarAgendamentosExistentes() {
  agendamentos = agendamentos.map((item) => normalizarAgendamento(item));
}

// =========================
// REGRAS DE DATA / HORA
// =========================
function obterDataHojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function obterProximoDiaUtilISO() {
  const hoje = new Date();
  const diaSemanaAtual = hoje.getDay(); // 0 domingo, 6 sábado
  const data = new Date(hoje);

  // Regra pedida:
  // sexta -> sábado
  // sábado -> segunda
  // domingo -> segunda
  if (diaSemanaAtual === 6) {
    data.setDate(data.getDate() + 2);
  } else if (diaSemanaAtual === 0) {
    data.setDate(data.getDate() + 1);
  } else {
    data.setDate(data.getDate() + 1);
  }

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function atualizarDataPadraoPorTipo() {
  if (!dataInput || !tipoAgendamentoInput) return;

  const tipo = tipoAgendamentoInput.value;

  if (tipo === "inclusao") {
    dataInput.value = obterDataHojeISO();
    return;
  }

  dataInput.value = obterProximoDiaUtilISO();
}

function gerarListaHorarios() {
  const horarios = [];
  for (let hora = 7; hora <= 19; hora++) {
    for (let minuto = 0; minuto < 60; minuto += 30) {
      const h = String(hora).padStart(2, "0");
      const m = String(minuto).padStart(2, "0");
      horarios.push(`${h}:${m}`);
    }
  }
  return horarios;
}

function preencherHorarios() {

  if (!horaInput) return;

  const horarios = [];
  for (let hora = 7; hora <= 19; hora++) {
    for (let minuto = 0; minuto < 60; minuto += 30) {
      const h = String(hora).padStart(2, "0");
      const m = String(minuto).padStart(2, "0");
      horarios.push(`${h}:${m}`);
    }
  }

  horaInput.innerHTML = `<option value="">Selecionar horário</option>` +
    horarios.map((h) => `<option value="${h}">${h}</option>`).join("");
}

function normalizarHoraDigitada(valor = "") {
  let texto = String(valor).trim();
  if (!texto) return "";
  if (/^\d{1,2}$/.test(texto)) texto = `${texto}:00`;
  if (/^\d{3,4}$/.test(texto)) texto = texto.length === 3 ? `0${texto[0]}:${texto.slice(1)}` : `${texto.slice(0, 2)}:${texto.slice(2)}`;
  const match = texto.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return "";
  let h = Number(match[1]);
  let m = Number(match[2]);
  if (h < 7 || h > 19 || m < 0 || m > 59) return "";
  if (m < 15) m = 0;
  else if (m < 45) m = 30;
  else { h += 1; m = 0; }
  if (h > 19) return "19:30";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// =========================
// MULTI-PACIENTE


// =========================
// MULTI-PACIENTE

// =========================
// MULTI-PACIENTE
// =========================
// MULTI-PACIENTE
// =========================
function criarBlocoPessoaHTML(index, pessoa = {}) {
  const nome = escaparHTML(pessoa.nome || "");
  const numero = escaparHTML(pessoa.numero || "");
  const observacao = escaparHTML(pessoa.observacao || "");

  return `
    <div class="agenda-item pessoa-bloco" data-index="${index}">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px;">
        <strong>Paciente ${index + 1}</strong>
        <button type="button" onclick="removerPessoa(${index})">Remover</button>
      </div>

      <div class="painel-agendamento-grid">
        <div class="grupo-campos">
          <label>Nome</label>
          <input
            type="text"
            class="pessoa-nome"
            placeholder="Nome do paciente"
            value="${nome}"
          >
        </div>

        <div class="grupo-campos">
          <label>Número</label>
          <input
            type="tel"
            class="pessoa-numero"
            placeholder="Número do paciente ou indicação"
            value="${numero}"
          >
        </div>
      </div>

      <div class="grupo-campos">
        <label>Observação</label>
        <textarea
          class="pessoa-observacao"
          placeholder="Ex: criança menor — ligar somente para pais responsáveis"
        >${observacao}</textarea>
      </div>
    </div>
  `;
}

function adicionarPessoa(pessoa = {}) {
  if (!listaPessoas) return;

  const index = listaPessoas.children.length;
  listaPessoas.insertAdjacentHTML("beforeend", criarBlocoPessoaHTML(index, pessoa));
}

function reindexarPessoas() {
  if (!listaPessoas) return;

  const blocos = Array.from(listaPessoas.querySelectorAll(".pessoa-bloco"));
  listaPessoas.innerHTML = "";
  blocos.forEach((bloco, index) => {
    const nome = bloco.querySelector(".pessoa-nome")?.value || "";
    const numero = bloco.querySelector(".pessoa-numero")?.value || "";
    const observacao = bloco.querySelector(".pessoa-observacao")?.value || "";
    listaPessoas.insertAdjacentHTML("beforeend", criarBlocoPessoaHTML(index, {
      nome,
      numero,
      observacao
    }));
  });
}

function removerPessoa(index) {
  if (!listaPessoas) return;
  const blocos = listaPessoas.querySelectorAll(".pessoa-bloco");
  if (blocos.length <= 1) {
    mostrarToast("É necessário manter pelo menos uma pessoa no agendamento.", "aviso");
    return;
  }

  const alvo = listaPessoas.querySelector(`.pessoa-bloco[data-index="${index}"]`);
  if (alvo) {
    alvo.remove();
    reindexarPessoas();
  }
}

function coletarPessoasFormulario() {
  if (!listaPessoas) return [];

  const blocos = Array.from(listaPessoas.querySelectorAll(".pessoa-bloco"));

  return blocos.map((bloco) => ({
    nome: (bloco.querySelector(".pessoa-nome")?.value || "").trim().toUpperCase(),
    numero: limparNumero(bloco.querySelector(".pessoa-numero")?.value || ""),
    observacao: (bloco.querySelector(".pessoa-observacao")?.value || "").trim()
  }));
}

function limparFormularioAgendamento() {
  if (tipoAgendamentoInput) tipoAgendamentoInput.value = "agendamento";
  if (unidadeInput) unidadeInput.value = "";
  if (horaInput) horaInput.value = "";
  atualizarDataPadraoPorTipo();

  if (listaPessoas) {
    listaPessoas.innerHTML = "";
    adicionarPessoa();
  }
}

function juntarNomes(pessoas = []) {
  const nomes = pessoas.map((p) => p.nome).filter(Boolean);

  if (!nomes.length) return "";
  if (nomes.length === 1) return nomes[0];
  if (nomes.length === 2) return `${nomes[0]} e ${nomes[1]}`;

  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

function juntarNomesComNumero(pessoas = []) {
  const itens = pessoas
    .map((p) => {
      const nome = (p.nome || "").trim();
      const numeroWhats = formatarNumeroWhats(p.numero || "");
      if (!nome && !numeroWhats) return "";
      if (nome && numeroWhats) return `${nome} (${numeroWhats})`;
      if (nome) return nome;
      return numeroWhats;
    })
    .filter(Boolean);

  if (!itens.length) return "";
  if (itens.length === 1) return itens[0];
  if (itens.length === 2) return `${itens[0]} e ${itens[1]}`;

  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

// =========================
// STATUS / SEGMENTAÇÃO

// =========================
function normalizarStatus(texto = "") {
  const bruto = normalizarTexto(texto).replace(/[\s._-]+/g, "");
  if (!bruto) return null;
  if (["DES", "DESCARTADO", "DESQUALIFICADO"].includes(bruto)) return "DES";
  if (["LON", "LONG", "LONGDISTANCE"].includes(bruto)) return "LON";
  if (["FOR", "FORA", "FORADECOBERTURA", "FORADECOVERAGE"].includes(bruto)) return "FOR";
  if (["PAT", "PATOLOGIA"].includes(bruto)) return "PAT";
  const matchReed = bruto.match(/^REEDD?(\d{1,2})$/);
  if (matchReed) {
    const dia = Number(matchReed[1]);
    if (dia >= 1 && dia <= 30) return `REEDD${dia}`;
  }
  const matchPro = bruto.match(/^PROM?M?(\d{1,2})$|^PRO(?:GRAMADO)?M(\d{1,2})$/);
  if (matchPro) {
    const mes = Number(matchPro[1] || matchPro[2]);
    if (mes >= 1 && mes <= 12) return `PROM${mes}`;
  }
  return null;
}


function decomporStatus(status = "") {
  const s = normalizarStatus(status) || "REEDD1";
  if (s === "DES" || s === "LON" || s === "FOR" || s === "PAT") return { status: s, segmento: s, baseTipo: s, baseValor: null };
  const reed = s.match(/^REEDD(\d{1,2})$/);
  if (reed) return { status: `REED D${Number(reed[1])}`, segmento: "REED", baseTipo: "REED", baseValor: Number(reed[1]) };
  const pro = s.match(/^PROM(\d{1,2})$/);
  if (pro) return { status: `PRO M${Number(pro[1])}`, segmento: "PRO", baseTipo: "PRO", baseValor: Number(pro[1]) };
  return { status: "REED D1", segmento: "REED", baseTipo: "REED", baseValor: 1 };
}


function formatarStatusExibicao(status = "") {
  return decomporStatus(status).status;
}

function categoriaDoStatus(status = "") {
  const info = decomporStatus(status);
  if (info.segmento === "REED") return info.baseValor === 1 ? "UTIL_AGORA" : "IGNORAR_AGORA";
  if (info.segmento === "PRO") return "IGNORAR_AGORA";
  if (["DES", "LON", "FOR", "PAT"].includes(info.segmento)) return "DESQUALIFICADO";
  return "NEUTRO";
}


function categoriaParaClasse(categoria) {
  if (categoria === "UTIL_AGORA") return "util";
  if (categoria === "IGNORAR_AGORA") return "ignorar";
  if (categoria === "DESQUALIFICADO") return "desqualificado";
  return "neutro";
}

function prioridadeStatus(status = "") {
  const info = decomporStatus(status);
  if (info.segmento === "REED" && info.baseValor === 1) return 1;
  if (info.segmento === "REED") return 10 + info.baseValor;
  if (info.segmento === "PRO") return 50 + info.baseValor;
  if (info.segmento === "DES") return 96;
  if (info.segmento === "LON") return 97;
  if (info.segmento === "FOR") return 98;
  if (info.segmento === "PAT") return 99;
  return 70;
}

// =========================
// ATUALIZAÇÃO AUTOMÁTICA DE CAMPANHAS


// =========================
// ATUALIZAÇÃO AUTOMÁTICA DE CAMPANHAS
// =========================
function atualizarStatusDinamicoLead(lead) {
  if (!lead) return lead;
  const infoAtual = decomporStatus(lead.tipo);
  if (!lead.baseTipo) lead.baseTipo = infoAtual.baseTipo;
  if (lead.baseValor === undefined || lead.baseValor === null) lead.baseValor = infoAtual.baseValor;
  if (lead.baseTipo === "REED") {
    const diasPassados = diferencaEmDias(lead.criadoEm || agoraISO());
    const restante = Math.max(1, (lead.baseValor || 1) - diasPassados);
    lead.tipo = `REEDD${restante}`;
    if (restante === 1 && (lead.baseValor || 1) !== 1) lead.atualizadoAutomaticamente = true;
    return lead;
  }
  if (lead.baseTipo === "PRO") {
    const mesesPassados = diferencaEmMeses(lead.criadoEm || agoraISO());
    const restante = Math.max(1, (lead.baseValor || 1) - mesesPassados);
    lead.tipo = `PROM${restante}`;
    if (restante === 1 && (lead.baseValor || 1) !== 1) lead.atualizadoAutomaticamente = true;
    return lead;
  }
  return lead;
}


function atualizarStatusAutomaticos() {
  let alterou = false;

  bancoLeads = bancoLeads.map((lead) => {
    const tipoAntes = lead.tipo;
    const baseTipoAntes = lead.baseTipo;
    const baseValorAntes = lead.baseValor;

    if (!lead.criadoEm) {
      lead.criadoEm = agoraISO();
    }

    if (!lead.baseTipo) {
      const info = decomporStatus(lead.tipo);
      lead.baseTipo = info.baseTipo;
      lead.baseValor = info.baseValor;
    }

    const atualizado = atualizarStatusDinamicoLead(lead);

    if (
      atualizado.tipo !== tipoAntes ||
      atualizado.baseTipo !== baseTipoAntes ||
      atualizado.baseValor !== baseValorAntes
    ) {
      alterou = true;
    }

    return atualizado;
  });

  ordenarBanco();

  if (alterou) {
    salvar();
  }
}


function preencherSegmentacoesPadraoBanco() {
  if (segmentacaoPadraoReed && !segmentacaoPadraoReed.options.length) {
    segmentacaoPadraoReed.innerHTML = Array.from({ length: 30 }, (_, i) => `<option value="D${i + 1}">D${i + 1}</option>`).join("");
  }
  if (segmentacaoPadraoPro && !segmentacaoPadraoPro.options.length) {
    segmentacaoPadraoPro.innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="M${i + 1}">M${i + 1}</option>`).join("");
  }
}

function atualizarUIBancoPadrao() {
  preencherSegmentacoesPadraoBanco();
  const tipo = segmentacaoPadraoBanco?.value || "REED";
  document.querySelectorAll(".banco-padrao-reed").forEach((el) => el.style.display = tipo === "REED" ? "flex" : "none");
  document.querySelectorAll(".banco-padrao-pro").forEach((el) => el.style.display = tipo === "PRO" ? "flex" : "none");
}

function obterStatusPadraoBanco() {
  preencherSegmentacoesPadraoBanco();
  const tipo = segmentacaoPadraoBanco?.value || "REED";
  if (tipo === "REED") return `REED ${segmentacaoPadraoReed?.value || "D1"}`;
  if (tipo === "PRO") return `PRO ${segmentacaoPadraoPro?.value || "M1"}`;
  return tipo;
}

// =========================
// BANCO
// =========================
function extrairTodosNumerosValidos(texto = "") {
  const matches = String(texto).match(/(?:\+?55\s*)?\d[\d\s().-]{7,}\d/g) || [];

  return matches
    .map((item) => limparNumero(item))
    .filter((numero) => numero.length === 10 || numero.length === 11)
    .filter((numero, index, arr) => arr.indexOf(numero) === index);
}

function extrairNumeroEStatusDaLinha(linha = "") {
  const texto = String(linha).trim();
  if (!texto) return null;

  const numeros = extrairTodosNumerosValidos(texto);
  if (!numeros.length) return null;

  const numero = numeros[0];
  const matchStatusExplicito = texto.match(/-\s*([A-Za-zÀ-ÿ0-9\s]+)\s*$/);

  if (!matchStatusExplicito) {
    return {
      numero,
      tipo: null,
      baseTipo: null,
      baseValor: null,
      criadoEm: agoraISO()
    };
  }

  const statusBruto = matchStatusExplicito[1].trim();
  const statusNormalizado = normalizarStatus(statusBruto);

  if (!statusNormalizado) {
    return {
      numero,
      tipo: null,
      baseTipo: null,
      baseValor: null,
      criadoEm: agoraISO()
    };
  }

  const info = decomporStatus(statusNormalizado);

  return {
    numero,
    tipo: statusNormalizado,
    baseTipo: info.baseTipo,
    baseValor: info.baseValor,
    criadoEm: agoraISO()
  };
}

function buscarLeadNoBancoPorNumero(numero) {
  const chave = getPhoneKey(numero);
  if (!chave) return null;
  return bancoLeads.find((lead) => getPhoneKey(lead.numero) === chave) || null;
}

function ordenarBanco() {
  bancoLeads.sort((a, b) => {
    const prioridadeA = prioridadeStatus(a.tipo);
    const prioridadeB = prioridadeStatus(b.tipo);

    if (prioridadeA !== prioridadeB) {
      return prioridadeA - prioridadeB;
    }

    return limparNumero(a.numero).localeCompare(limparNumero(b.numero));
  });
}

function abrirImportacaoTXT() {
  if (importarTXTInput) importarTXTInput.click();
}

function importarLeadsTXT(conteudo = "") {
  if (!conteudo.trim()) {
    mostrarToast("Arquivo TXT vazio.", "aviso");
    return;
  }
  if (entradaBanco) entradaBanco.value = conteudo.trim();
  mostrarToast("TXT importado para a área do banco. Revise e escolha a ação desejada.", "ok");
}

function salvarBanco() {
  const texto = entradaBanco?.value || "";
  const linhas = texto.split("\n");
  let adicionados = 0;
  let atualizados = 0;
  let ignorados = 0;
  let semStatus = 0;

  const dadosValidos = [];

  linhas.forEach((linha) => {
    const dado = extrairNumeroEStatusDaLinha(linha);

    if (!dado) {
      if (linha.trim()) ignorados++;
      return;
    }

    if (!dado.tipo) {
      semStatus++;
      return;
    }

    dadosValidos.push(dado);
  });

  if (semStatus > 0) {
    mostrarToast(
      "Escolha uma segmentação para esses números.",
      "aviso",
      "Como há número sem status, use a segmentação em massa para aplicar REED, PRO, DES, LON, FOR ou PAT."
    );
    abrirSegmentacaoEmMassa();
    return;
  }

  dadosValidos.forEach((dado) => {
    const existente = buscarLeadNoBancoPorNumero(dado.numero);

    if (existente) {
      existente.numero = dado.numero;
      existente.tipo = dado.tipo;
      existente.baseTipo = dado.baseTipo;
      existente.baseValor = dado.baseValor;
      existente.criadoEm = agoraISO();
      atualizados++;
    } else {
      bancoLeads.push(dado);
      adicionados++;
    }
  });

  atualizarStatusAutomaticos();
  if (entradaBanco) entradaBanco.value = "";
  mostrarBanco();
  atualizarCampanhas();
  salvar();

  mostrarToast(
    "Banco atualizado!",
    "ok",
    `Adicionados: ${adicionados} · Atualizados: ${atualizados} · Ignorados: ${ignorados}`
  );
}

function abrirSegmentacaoEmMassa() {
  if (!entradaBanco.value.trim()) {
    mostrarToast("Cole uma lista no banco antes de aplicar segmentação em massa.", "aviso");
    return;
  }

  modalSegmentacaoMassa.style.display = "flex";
  modalSegmentacaoMassa.setAttribute("aria-hidden", "false");
}

function fecharModalSegmentacao() {
  modalSegmentacaoMassa.style.display = "none";
  modalSegmentacaoMassa.setAttribute("aria-hidden", "true");
}

function salvarBancoEmMassa() {
  const texto = entradaBanco.value.trim();
  if (!texto) {
    mostrarToast("Cole uma lista no campo do banco primeiro.", "aviso");
    return;
  }

  const numeros = extrairTodosNumerosValidos(texto);
  if (!numeros.length) {
    mostrarToast("Nenhum número válido foi encontrado.", "erro");
    return;
  }

  const statusSelecionado = normalizarStatus(segmentacaoEmMassa?.value || "DES");

  if (!statusSelecionado) {
    mostrarToast("Selecione uma segmentação válida.", "aviso");
    return;
  }

  const info = decomporStatus(statusSelecionado);

  let adicionados = 0;
  let mantidos = 0;

  numeros.forEach((numero) => {
    const existente = buscarLeadNoBancoPorNumero(numero);

    if (existente) {
      mantidos++;
      return;
    }

    bancoLeads.push({
      numero,
      tipo: statusSelecionado,
      baseTipo: info.baseTipo,
      baseValor: info.baseValor,
      criadoEm: agoraISO()
    });

    adicionados++;
  });

  atualizarStatusAutomaticos();
  entradaBanco.value = "";
  mostrarBanco();
  atualizarCampanhas();
  fecharModalSegmentacao();
  salvar();

  mostrarToast("Segmentação em massa aplicada.", "ok", `Novos inseridos: ${adicionados} · Mantidos: ${mantidos}`);
}

function obterListaBancoFiltrada() {
  const termo = normalizarTexto(buscaBanco?.value || "");
  const segmento = filtroSegmentacaoBanco?.value || "";
  const diaReed = filtroDiaReed?.value || "";
  const mesPro = filtroMesPro?.value || "";

  return bancoLeads.filter((lead) => {
    const info = decomporStatus(lead.tipo);
    const numeroLimpo = limparNumero(lead.numero);
    const numeroFormatado = formatarNumero(lead.numero).toUpperCase();
    const statusExibido = formatarStatusExibicao(lead.tipo).toUpperCase();

    const matchBusca =
      !termo ||
      numeroLimpo.includes(termo.replace(/\D/g, "")) ||
      numeroFormatado.includes(termo) ||
      statusExibido.includes(termo) ||
      (info.segmento || "").includes(termo);

    const matchSegmento = !segmento || info.segmento === segmento;
    const matchDia = !diaReed || (info.segmento === "REED" && `D${info.baseValor}` === diaReed);
    const matchMes = !mesPro || (info.segmento === "PRO" && `M${info.baseValor}` === mesPro);

    return matchBusca && matchSegmento && matchDia && matchMes;
  });
}

function atualizarResumoBancoCards(lista = bancoLeads) {
  const alvo = document.getElementById("bancoResumoCards");
  if (!alvo) return;
  const cont = { util: 0, ignorar: 0, des: 0 };
  lista.forEach((lead) => {
    const categoria = categoriaDoStatus(lead.tipo);
    if (categoria === "UTIL_AGORA") cont.util += 1;
    else if (categoria === "IGNORAR_AGORA") cont.ignorar += 1;
    else if (categoria === "DESQUALIFICADO") cont.des += 1;
  });
  alvo.innerHTML = `
    <div class="status-box status-box--ok"><strong>${cont.util}</strong><span>Trabalháveis agora</span></div>
    <div class="status-box status-box--alerta"><strong>${cont.ignorar}</strong><span>Aguardando o momento certo</span></div>
    <div class="status-box status-box--erro"><strong>${cont.des}</strong><span>Desqualificados</span></div>
  `;
}

function renderBanco(lista = bancoLeads) {
  if (!listaBanco) return;
  atualizarResumoBanco(lista);
  atualizarResumoBancoCards(lista);

  if (!lista.length) {
    listaBanco.innerHTML = "<p>Nenhum lead encontrado no banco.</p>";
    return;
  }

  const preview = lista.slice(0, 12);
  const restante = Math.max(0, lista.length - preview.length);

  listaBanco.innerHTML = preview.map((lead) => {
    const categoria = categoriaDoStatus(lead.tipo);
    const classe = categoriaParaClasse(categoria);
    const indexOriginal = bancoLeads.findIndex((item) => getPhoneKey(item.numero) === getPhoneKey(lead.numero));
    return `
      <div class="agenda-item ${classe}">
        <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
          <div>
            <p><strong>${escaparHTML(formatarNumero(lead.numero))}</strong></p>
            <p>Status: <strong>${escaparHTML(formatarStatusExibicao(lead.tipo))}</strong></p>
            <p>Categoria: <strong>${escaparHTML(categoria)}</strong></p>
          </div>
          <button type="button" onclick="abrirAcoesBanco(${indexOriginal})" aria-label="Abrir ações do lead" style="min-width:44px;">⋯</button>
        </div>
      </div>
    `;
  }).join("") + (restante ? `<p class="texto-ajuda banco-preview-note">Mostrando 12 de ${lista.length} leads filtrados. Use as visões por categoria para abrir a lista completa.</p>` : "");
}

function abrirLeadsModal(modo = "TODOS") {
  if (!modalListaLeads || !modalListaLeadsConteudo) return;
  const listaBase = obterListaBancoFiltrada();
  const filtrada = modo === "TODOS" ? listaBase : listaBase.filter((lead) => categoriaDoStatus(lead.tipo) === modo);
  const titulos = {
    TODOS: "Todos os leads filtrados",
    UTIL_AGORA: "Leads trabalháveis agora",
    IGNORAR_AGORA: "Leads para aguardar",
    DESQUALIFICADO: "Leads desqualificados"
  };
  if (modalListaLeadsTitulo) modalListaLeadsTitulo.textContent = titulos[modo] || "Lista de leads";
  modalListaLeadsConteudo.innerHTML = filtrada.length ? filtrada.map((lead) => `
    <div class="agenda-item ${categoriaParaClasse(categoriaDoStatus(lead.tipo))}">
      <p><strong>${escaparHTML(formatarNumero(lead.numero))}</strong></p>
      <p>Status: <strong>${escaparHTML(formatarStatusExibicao(lead.tipo))}</strong></p>
    </div>`).join("") : '<p>Nenhum lead encontrado nessa visão.</p>';
  abrirModalBase(modalListaLeads);
}

function fecharModalListaLeads() {
  fecharModalBase(modalListaLeads);
}

function atualizarResumoBanco(lista = bancoLeads) {
  if (!resumoBanco) return;

  const resumo = {
    REED: 0,
    PRO: 0,
    DES: 0,
    LON: 0,
    FOR: 0,
    PAT: 0
  };

  lista.forEach((lead) => {
    const info = decomporStatus(lead.tipo);
    if (resumo[info.segmento] !== undefined) {
      resumo[info.segmento]++;
    }
  });

  resumoBanco.value =
`RESUMO DO BANCO
====================
Total: ${lista.length}

REED: ${resumo.REED}
PRO: ${resumo.PRO}
DES: ${resumo.DES}
LON: ${resumo.LON}
FOR: ${resumo.FOR}
PAT: ${resumo.PAT}

Entradas sem status devem ser segmentadas manualmente ou tratadas como REED D1 no filtro.`;
}

function mostrarBanco() {
  renderBanco(obterListaBancoFiltrada());
}

function filtrarBancoManual() {
  mostrarBanco();
}

function aplicarFiltrosBanco() {
  mostrarBanco();
}

async function limparBancoCompleto() {
  if (!bancoLeads.length) {
    mostrarToast("O banco já está vazio.", "info");
    return;
  }

  if (!(await confirmarAcao("Tem certeza que deseja apagar todo o banco de leads?", "Essa ação remove todos os leads salvos localmente.", "Apagar tudo"))) return;

  bancoLeads = [];
  salvar();
  mostrarBanco();
  atualizarCampanhas();

  if (buscaBanco) buscaBanco.value = "";
  if (filtroSegmentacaoBanco) filtroSegmentacaoBanco.value = "";
  if (filtroDiaReed) filtroDiaReed.value = "";
  if (filtroMesPro) filtroMesPro.value = "";

  mostrarToast("Banco apagado com sucesso.", "ok");
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

async function editarLeadSelecionado() {
  if (leadSelecionadoIndex === null || !bancoLeads[leadSelecionadoIndex]) return;

  const lead = bancoLeads[leadSelecionadoIndex];

  const novoNumero = await solicitarEntrada("Editar número", lead.numero, "Editar lead");
  if (novoNumero === null) return;

  const novoStatus = prompt(
    "Editar status:\n\nExemplos:\nREED D1\nREED D15\nPRO M3\nDES\nLON\nFOR\nPAT",
    formatarStatusExibicao(lead.tipo)
  );
  if (novoStatus === null) return;

  const numeroLimpo = limparNumero(novoNumero);
  const statusNormalizado = normalizarStatus(novoStatus);

  if (!statusNormalizado) {
    mostrarToast("Status inválido.", "erro");
    return;
  }

  const info = decomporStatus(statusNormalizado);

  if (!numeroLimpo) {
    mostrarToast("Número inválido.", "erro");
    return;
  }

  lead.numero = numeroLimpo;
  lead.tipo = statusNormalizado;
  lead.baseTipo = info.baseTipo;
  lead.baseValor = info.baseValor;
  lead.criadoEm = agoraISO();

  atualizarStatusAutomaticos();
  mostrarBanco();
  atualizarCampanhas();
  fecharModalBanco();
  salvar();

  mostrarToast("Lead atualizado com sucesso.", "ok");
}

async function excluirLeadSelecionado() {
  if (leadSelecionadoIndex === null || !bancoLeads[leadSelecionadoIndex]) return;

  const lead = bancoLeads[leadSelecionadoIndex];
  if (!confirm(`Excluir este lead?\n\n${formatarNumero(lead.numero)} - ${formatarStatusExibicao(lead.tipo)}`)) {
    return;
  }

  bancoLeads.splice(leadSelecionadoIndex, 1);
  salvar();
  mostrarBanco();
  atualizarCampanhas();
  fecharModalBanco();

  mostrarToast("Lead excluído com sucesso.", "ok");
}

function copiarBancoEmFileira() {
  if (!bancoLeads.length) {
    mostrarToast("O banco está vazio.", "info");
    return;
  }

  const texto = obterListaBancoFiltrada()
    .map((lead) => limparNumero(lead.numero))
    .join("\n");

  copiarTexto(texto, "✅ Banco copiado em fileira.");
}


function exportarBancoTXT() {
  if (!bancoLeads || !bancoLeads.length) {
    mostrarToast("O banco está vazio.", "info");
    return;
  }

  const linhas = bancoLeads.map((lead) => {
    const numero = limparNumero(lead.numero);
    const status = formatarStatusExibicao(lead.tipo || lead.status || "REEDD1");
    return `${numero} - ${status}`;
  }).filter(Boolean);

  const conteudo = linhas.join("\n");
  const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });

  const hoje = new Date();
  const data = [
    String(hoje.getDate()).padStart(2, "0"),
    String(hoje.getMonth() + 1).padStart(2, "0"),
    hoje.getFullYear()
  ].join("-");

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `banco_geral_${data}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);

  mostrarToast("Banco geral exportado em TXT.", "ok");
}

function sincronizarAgora() {
  atualizarStatusSync("Sincronização online ainda não configurada");
  mostrarToast("A sincronização em tempo real ainda não está configurada.", "info", "A base local já está pronta para evolução futura.");
}

// =========================
// FILTRO ANTI-LIXO WHATSAPP
// =========================
function filtrarLeads() {
  atualizarStatusAutomaticos();
  atualizarCampanhas();

  const textoOriginal = entradaFiltro.value || "";
  const numerosExtraidos = extrairTodosNumerosValidos(textoOriginal);
  const aprovadosBrutos = [];
  const bloqueados = [];
  const usados = new Set();

  let totalDuplicados = 0;
  let totalIgnorados = 0;
  let totalDesqualificados = 0;
  let totalNovos = 0;
  let totalReed1 = 0;

  numerosExtraidos.forEach((numero) => {
    const chave = getPhoneKey(numero);
    if (!chave) return;

    if (usados.has(chave)) {
      totalDuplicados++;
      bloqueados.push(`${numero} - DUPLICADO`);
      return;
    }

    usados.add(chave);
    const leadBanco = buscarLeadNoBancoPorNumero(numero);

    if (!leadBanco) {
      aprovadosBrutos.push(limparNumero(numero));
      totalNovos++;
      return;
    }

    const categoria = categoriaDoStatus(leadBanco.tipo);
    const statusExibido = formatarStatusExibicao(leadBanco.tipo);

    if (categoria === "UTIL_AGORA") {
      aprovadosBrutos.push(limparNumero(numero));
      if (statusExibido === "REED D1") totalReed1++;
      return;
    }

    if (categoria === "IGNORAR_AGORA") {
      totalIgnorados++;
      bloqueados.push(`${numero} - ${statusExibido} - IGNORAR AGORA`);
      return;
    }

    if (categoria === "DESQUALIFICADO") {
      totalDesqualificados++;
      bloqueados.push(`${numero} - ${statusExibido} - DESQUALIFICADO`);
    }
  });

  const aprovados = aprovadosBrutos.map((numero, index) => `${numero} (Lead ${index + 1})`);
  const totalLixoIgnorado = Math.max(0, textoOriginal.split(/\n+/).filter((l) => l.trim()).length - numerosExtraidos.length);

  saidaFiltro.value = aprovados.join("\n");
  saidaBloqueados.value = bloqueados.join("\n");

  resumoFiltro.value =
`RESUMO DA EXTRAÇÃO
====================
Aprovados: ${aprovados.length}
- Entradas novas detectadas: ${totalNovos}
- REED D1 válidos: ${totalReed1}

Bloqueados: ${bloqueados.length}
- Duplicados: ${totalDuplicados}
- Ignorados no momento: ${totalIgnorados}
- Desqualificados: ${totalDesqualificados}

Lixo de WhatsApp ignorado: ${totalLixoIgnorado}
Números válidos encontrados: ${numerosExtraidos.length}

REGRAS ATIVAS
====================
TRABALHAR AGORA:
- REED D1

IGNORAR NO MOMENTO:
- REED D2 até D30
- PRO M1 até M12

DESQUALIFICAR:
- DES
- LON
- FOR
- PAT
- REED VENCIDO`;
}

function copiarAprovados() {
  const texto = saidaFiltro.value.trim();
  if (!texto) {
    mostrarToast("Não há aprovados para copiar.", "info");
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
// CAMPANHAS
// =========================
function atualizarCampanhas() {
  atualizarStatusAutomaticos();
  const reedMap = {}; const proMap = {};
  for (let i = 1; i <= 30; i++) reedMap[`D${i}`] = [];
  for (let i = 1; i <= 12; i++) proMap[`M${i}`] = [];
  bancoLeads.forEach((lead) => {
    const info = decomporStatus(lead.tipo); const numero = limparNumero(lead.numero);
    if (info.segmento === "REED" && info.baseValor >= 1 && info.baseValor <= 30) reedMap[`D${info.baseValor}`].push(numero);
    if (info.segmento === "PRO" && info.baseValor >= 1 && info.baseValor <= 12) proMap[`M${info.baseValor}`].push(numero);
  });
  const visualizacao = campanhaVisualizacao?.value || "todas";
  const totalReed = Object.values(reedMap).reduce((s, arr) => s + arr.length, 0);
  const totalPro = Object.values(proMap).reduce((s, arr) => s + arr.length, 0);
  const reedD1 = reedMap.D1.length; const proM1 = proMap.M1.length;
  const proMaisProximo = Object.entries(proMap).find(([, arr]) => arr.length)?.[0] || "Sem fila";
  const resumoCampanhas = document.getElementById("resumoCampanhas");
  if (resumoCampanhas) resumoCampanhas.innerHTML = `
      <div class="status-box status-box--ok"><strong>${reedD1}</strong><span>REED D1 acumulados para retrabalho</span></div>
      <div class="status-box status-box--alerta"><strong>${totalReed}</strong><span>Reengajamentos ativos</span></div>
      <div class="status-box"><strong>${totalPro}</strong><span>Programados ativos · M1: ${proM1} · mais próximo: ${proMaisProximo}</span></div>`;
  const textoReed = Object.keys(reedMap).map((dia) => `REENGAJAMENTO ${dia} (${reedMap[dia].length})\n${reedMap[dia].join("\n")}`.trim()).join("\n\n");
  const textoPro = Object.keys(proMap).map((mes) => `PROGRAMADO ${mes} (${proMap[mes].length})\n${proMap[mes].join("\n")}`.trim()).join("\n\n");
  if (painelReed) painelReed.value = visualizacao === "pro" ? "" : textoReed;
  if (painelPro) painelPro.value = visualizacao === "reed" ? "" : textoPro;
}


function copiarPainelReed() {
  const texto = painelReed?.value?.trim() || "";
  if (!texto) {
    mostrarToast("Não há REED para copiar.", "info");
    return;
  }
  copiarTexto(texto, "✅ Painel REED copiado.");
}

function copiarPainelPro() {
  const texto = painelPro?.value?.trim() || "";
  if (!texto) {
    mostrarToast("Não há PRO para copiar.", "info");
    return;
  }
  copiarTexto(texto, "✅ Painel PRO copiado.");
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

function maiorNumeroSenhaDoDia(data, indexIgnorado = null) {
  return agendamentos
    .map((item, index) => ({ ...normalizarAgendamento(item), indexOriginal: index }))
    .filter((item) => item.data === data && item.indexOriginal !== indexIgnorado)
    .flatMap((item) => item.pessoas || [])
    .map((pessoa) => {
      const match = String(pessoa.senha || "").match(/-(\d+)$/);
      return match ? Number(match[1]) : 0;
    })
    .reduce((maior, atual) => Math.max(maior, atual), 0);
}

function gerarSenhasParaAgendamento(data, quantidadePessoas) {
  const [, mes, dia] = data.split("-");
  const prefixo = `PJ${dia}${mes}`;
  const inicio = maiorNumeroSenhaDoDia(data) + 1;
  return Array.from({ length: quantidadePessoas }, (_, index) => `${prefixo}-${String(inicio + index).padStart(2, "0")}`);
}


function validarAgendamento(dados) {
  dados.hora = normalizarHoraDigitada(dados.hora);
  if (!dados.unidade || !dados.data || !dados.hora) {
    mostrarToast("Preencha unidade, data e horário válidos.", "aviso");
    return false;
  }

  if (!dados.pessoas.length) {
    mostrarToast("Adicione pelo menos uma pessoa.", "aviso");
    return false;
  }

  for (const pessoa of dados.pessoas) {
    if (!pessoa.nome || pessoa.nome.length < 3) {
      mostrarToast("Preencha um nome válido para cada pessoa.", "aviso");
      return false;
    }

    if (!pessoa.numero || pessoa.numero.length < 10) {
      mostrarToast("Preencha um número válido para cada pessoa.", "aviso");
      return false;
    }
  }

  return true;
}

function gerarMensagemPaciente(agendamento) {
  const ag = normalizarAgendamento(agendamento);
  const dataFormatada = formatarDataBRCompleta(ag.data);
  const horaFormatada = formatarHorario(ag.hora);
  const nomes = juntarNomes(ag.pessoas);
  const senhas = ag.pessoas.map((p) => p.senha).filter(Boolean).join(" e ");
  const qtd = ag.pessoas?.length || 1;
  const tituloPaciente = getTituloPaciente(qtd);
  const tituloSenha = getTituloSenha(qtd);

  return `*SEU AGENDAMENTO FOI CONFIRMADO!✅*

*${getTituloConsultor()}: ${getNomeTMK()}*

*${tituloPaciente}: ${nomes.toUpperCase()}*

*${tituloSenha}: ${senhas}*

*UNIDADE: ${ag.unidade}*

*DATA: ${dataFormatada} às ${horaFormatada}!*

*LEVAR UM DOCUMENTO OFICIAL COM FOTO*

*Não realizam o exame:*
* Crianças menores de 6 anos
* Lactantes e Gestantes
* Menores de idade devem ir acompanhados do responsável
* Atendimento por ordem de chegada

*Tenha um excelente exame!😃*

Projeto Enxergar 🌐`;
}

function gerarMensagemCRM(agendamento) {
  const ag = normalizarAgendamento(agendamento);
  const observacoes = ag.pessoas.map((p) => p.observacao).filter(Boolean);
  let cabecalho = `*TMK: ${getNomeTMK()}*
*RELATÓRIO CRM*`;
  if (observacoes.length) {
    cabecalho += `
*OBS:* ${observacoes.join(" | ")}`;
  }
  return `${cabecalho}

${gerarMensagemPaciente(ag)}`.trim();
}

function gerarMensagem(agendamento, tipo = "paciente") {
  if (tipo === "crm") {
    return gerarMensagemCRM(agendamento);
  }
  return gerarMensagemPaciente(agendamento);
}

async function agendar() {
  const pessoas = coletarPessoasFormulario();
  const tipo = tipoAgendamentoInput?.value || "agendamento";

  const dados = {
    tipo,
    unidade: unidadeInput.value,
    data: dataInput.value,
    hora: horaInput.value,
    pessoas
  };

  if (!validarAgendamento(dados)) return;
  if (!(await confirmarAcao("Confirmar agendamento?", "As senhas serão geradas e o comprovante será aberto.", "Confirmar"))) return;

  const senhas = gerarSenhasParaAgendamento(dados.data, dados.pessoas.length);

  const pessoasComSenha = dados.pessoas.map((pessoa, index) => ({
    ...pessoa,
    senha: senhas[index]
  }));

  const novoAgendamento = {
    ...dados,
    pessoas: pessoasComSenha,
    criadoEm: agoraISO()
  };

  agendamentos.push(novoAgendamento);
  salvar();

  if (filtroData) {
    filtroData.value = novoAgendamento.data;
  }
  filtrarAgenda();

  if (dataRelatorio) {
    dataRelatorio.value = novoAgendamento.data;
    gerarRelatorio();
  }

  mostrarModalComprovante(novoAgendamento, "paciente");
  limparFormularioAgendamento();
}

function mostrarModalComprovante(agendamento, tipo = "paciente") {
  const ag = normalizarAgendamento(agendamento);
  agendamentoAtual = ag;
  tipoComprovanteAtual = tipo;
  textoComprovante.value = gerarMensagem(ag, tipo);
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

  const numeroPrincipal = limparNumero(agendamentoAtual.pessoas?.[0]?.numero || "");
  if (!numeroPrincipal) return;

  const mensagem = textoComprovante.value || gerarMensagem(agendamentoAtual, tipoComprovanteAtual);
  const link = `https://wa.me/55${numeroPrincipal}?text=${encodeURIComponent(mensagem)}`;

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
async function editarNomePaciente(agendamentoIndex, pessoaIndex) {
  const agendamento = normalizarAgendamento(agendamentos[agendamentoIndex]);
  if (!agendamento?.pessoas?.[pessoaIndex]) return;
  const atual = agendamento.pessoas[pessoaIndex].nome || "";
  const novo = await solicitarEntrada("Editar nome do paciente", atual, "Editar paciente");
  if (novo === null) return;
  const nome = String(novo).trim().toUpperCase();
  if (nome.length < 3) {
    mostrarToast("Digite um nome válido.", "aviso");
    return;
  }
  agendamentos[agendamentoIndex].pessoas[pessoaIndex].nome = nome;
  salvar();
  filtrarAgenda();
  mostrarToast("Nome do paciente atualizado.", "ok");
}

async function editarNumeroPaciente(agendamentoIndex, pessoaIndex) {
  const agendamento = normalizarAgendamento(agendamentos[agendamentoIndex]);
  if (!agendamento?.pessoas?.[pessoaIndex]) return;
  const atual = agendamento.pessoas[pessoaIndex].numero || "";
  const novo = await solicitarEntrada("Editar número do paciente", atual, "Editar paciente");
  if (novo === null) return;
  const numero = limparNumero(String(novo));
  if (numero.length < 10) {
    mostrarToast("Digite um número válido.", "aviso");
    return;
  }
  agendamentos[agendamentoIndex].pessoas[pessoaIndex].numero = numero;
  salvar();
  filtrarAgenda();
  mostrarToast("Número do paciente atualizado.", "ok");
}


function extrairNumeroSenha(agendamento = {}) {
  const ag = normalizarAgendamento(agendamento);
  const primeiraSenha = ag.pessoas?.map((p) => p.senha).find(Boolean) || "";
  const match = String(primeiraSenha).match(/-(\d+)$/);
  return match ? Number(match[1]) : 9999;
}

function gerarSenhasParaAgendamentoEditado(data, quantidadePessoas, indexIgnorado) {
  const [, mes, dia] = data.split("-");
  const prefixo = `PJ${dia}${mes}`;
  const inicio = maiorNumeroSenhaDoDia(data, indexIgnorado) + 1;
  return Array.from({ length: quantidadePessoas }, (_, index) => `${prefixo}-${String(inicio + index).padStart(2, "0")}`);
}


function solicitarDataEntrada(label, valorInicial = "", titulo = "Editar data") {
  return new Promise((resolve) => {
    if (!modalEntrada || !modalEntradaInput) {
      resolve(window.prompt(label, valorInicial));
      return;
    }

    resolverModalEntrada = resolve;
    if (modalEntradaSelect) { modalEntradaSelect.style.display = "none"; modalEntradaSelect.innerHTML = ""; }
    if (modalEntradaInput) { modalEntradaInput.style.display = ""; modalEntradaInput.removeAttribute("list"); }
    const tituloEl = document.getElementById("titulo-modal-entrada");
    if (tituloEl) tituloEl.textContent = titulo;
    if (modalEntradaLabel) modalEntradaLabel.textContent = label;
    modalEntradaInput.type = "date";
    modalEntradaInput.value = valorInicial || "";
    abrirModalBase(modalEntrada);
    setTimeout(() => modalEntradaInput.focus(), 30);
  }).finally(() => {
    if (modalEntradaInput) modalEntradaInput.type = "text";
  });
}

function solicitarSelecaoEntrada(label, valorInicial = "", opcoes = [], titulo = "Editar campo") {
  return new Promise((resolve) => {
    if (!modalEntrada || !modalEntradaSelect) {
      resolve(window.prompt(`${label}

Opções: ${opcoes.join(", ")}`, valorInicial));
      return;
    }
    resolverModalEntrada = resolve;
    const tituloEl = document.getElementById("titulo-modal-entrada");
    if (tituloEl) tituloEl.textContent = titulo;
    if (modalEntradaLabel) modalEntradaLabel.textContent = label;
    if (modalEntradaInput) modalEntradaInput.style.display = "none";
    modalEntradaSelect.style.display = "";
    modalEntradaSelect.innerHTML = opcoes.map((opcao) => {
      const selecionado = opcao === valorInicial ? " selected" : "";
      return `<option value="${escaparHTML(opcao)}"${selecionado}>${escaparHTML(opcao)}</option>`;
    }).join("");
    abrirModalBase(modalEntrada);
    setTimeout(() => modalEntradaSelect.focus(), 30);
  });
}

async function editarUnidadeAgendamento(index) {
  const agendamento = agendamentos[index];
  if (!agendamento) return;
  const agNormalizado = normalizarAgendamento(agendamento);
  const novaUnidade = await solicitarSelecaoEntrada("Editar unidade", agNormalizado.unidade, UNIDADES_ORDEM, "Editar unidade");
  if (novaUnidade === null) return;
  if (!UNIDADES_ORDEM.includes(novaUnidade)) { mostrarToast("Selecione uma unidade válida.", "aviso"); return; }
  agendamentos[index].unidade = novaUnidade;
  salvar(); filtrarAgenda(); if (dataRelatorio && dataRelatorio.value === agNormalizado.data) gerarRelatorio();
  mostrarToast("Unidade atualizada.", "ok");
}

async function editarHorarioAgendamento(index) {
  const agendamento = agendamentos[index];
  if (!agendamento) return;
  const agNormalizado = normalizarAgendamento(agendamento);
  const novoHorario = await solicitarSelecaoEntrada("Editar horário", agNormalizado.hora, gerarListaHorarios(), "Editar horário");
  if (novoHorario === null) return;
  const horarioNormalizado = normalizarHoraDigitada(novoHorario);
  if (!horarioNormalizado) { mostrarToast("Horário inválido.", "aviso"); return; }
  agendamentos[index].hora = horarioNormalizado;
  salvar(); filtrarAgenda(); mostrarToast("Horário atualizado.", "ok");
}

async function editarTipoAgendamento(index) {
  const agendamento = agendamentos[index];
  if (!agendamento) return;
  const agNormalizado = normalizarAgendamento(agendamento);
  const tipoAtual = normalizarTipoRegistro(agNormalizado.tipo || "agendamento");
  const novoTipo = await solicitarSelecaoEntrada("Editar tipo do registro", tipoAtual, ["agendamento", "inclusao", "reagendamento"], "Editar tipo");
  if (novoTipo === null) return;
  agendamentos[index].tipo = normalizarTipoRegistro(novoTipo);
  salvar();
  filtrarAgenda();
  if (dataRelatorio && dataRelatorio.value === agNormalizado.data) gerarRelatorio();
  mostrarToast("Tipo do registro atualizado.", "ok");
}

async function editarDataAgendamento(index) {

  const agendamento = normalizarAgendamento(agendamentos[index]);
  if (!agendamento) return;

  const novaData = await solicitarDataEntrada("Editar data do agendamento", agendamento.data, "Editar data");
  if (novaData === null) return;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(novaData))) {
    mostrarToast("Data inválida.", "aviso");
    return;
  }

  const senhas = gerarSenhasParaAgendamentoEditado(novaData, agendamento.pessoas.length, index);
  const pessoasAtualizadas = agendamento.pessoas.map((pessoa, pessoaIndex) => ({
    ...pessoa,
    senha: senhas[pessoaIndex]
  }));

  agendamentos[index] = {
    ...agendamento,
    data: novaData,
    pessoas: pessoasAtualizadas,
    atualizadoEm: agoraISO()
  };

  salvar();
  if (filtroData) filtroData.value = novaData;
  filtrarAgenda();
  if (dataRelatorio && dataRelatorio.value === novaData) gerarRelatorio();
  mostrarToast("Data atualizada e senhas recalculadas.", "ok");
}

async function alternarCRMEnviado(index) {
  const agendamento = agendamentos[index];
  if (!agendamento) return;
  const agNormalizado = normalizarAgendamento(agendamento);
  const jaEnviado = Boolean(agendamento.crmEnviado);
  const confirmado = await confirmarAcao(jaEnviado ? "Desmarcar como enviado ao CRM?" : "Marcar como enviado ao CRM?", juntarNomes(agNormalizado.pessoas), jaEnviado ? "Desmarcar" : "Marcar");
  if (!confirmado) return;
  agendamentos[index].crmEnviado = !jaEnviado;
  agendamentos[index].crmEnviadoEm = !jaEnviado ? agoraISO() : null;
  salvar(); filtrarAgenda(); mostrarToast(!jaEnviado ? "Marcado como enviado ao CRM." : "CRM desmarcado.", "ok");
}


function montarListaAgendaDia(dataSelecionada) {
  const listaDoDia = agendamentos
    .map((item, index) => ({ ...normalizarAgendamento(item), indexOriginal: index }))
    .filter((item) => item.data === dataSelecionada)
    .sort((a, b) => extrairNumeroSenha(a) - extrairNumeroSenha(b));
  if (!listaDoDia.length) return "";
  const dataCurta = formatarDataBR(dataSelecionada);
  const linhas = [`*AGENDAMENTOS DO DIA ${dataCurta}*`, ""];
  listaDoDia.forEach((item) => {
    const nomes = juntarNomesComNumero(item.pessoas);
    const senhas = item.pessoas.map((p) => p.senha).filter(Boolean).join(" / ");
    const tipo = (item.tipo || "agendamento").toUpperCase();
    linhas.push(`${senhas} - ${nomes}`);
    linhas.push(`Horário: ${item.hora} | Unidade: ${item.unidade} | Tipo: ${tipo}`);
    linhas.push("");
  });
  linhas.push(`*TOTAL: ${listaDoDia.reduce((s, item) => s + (item.pessoas?.length || 1), 0)}*`);
  return linhas.join("\n").trim();
}


function copiarAgendaDoDia() {
  const dataSelecionada = filtroData?.value;
  if (!dataSelecionada) {
    mostrarToast("Selecione uma data na agenda.", "aviso");
    return;
  }

  const texto = montarListaAgendaDia(dataSelecionada);
  if (!texto) {
    mostrarToast("Nenhum agendamento encontrado para copiar.", "info");
    return;
  }

  copiarTexto(texto, "✅ Lista de agendamentos do dia copiada.");
}

function copiarNumero(numero) {
  copiarTexto(limparNumero(numero), "✅ Número copiado.");
}

function verComprovante(index, tipo = "paciente") {
  const agendamento = agendamentos[index];
  if (!agendamento) return;
  mostrarModalComprovante(agendamento, tipo);
}

function reenviarWhats(index, tipo = "paciente") {
  const agendamento = normalizarAgendamento(agendamentos[index]);
  if (!agendamento) return;

  const numero = limparNumero(agendamento.pessoas?.[0]?.numero || "");
  const mensagem = gerarMensagem(agendamento, tipo);
  const link = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`;
  window.open(link, "_blank");
}

async function transformarEmReagendamento(index) {
  return editarTipoAgendamento(index);
}

async function excluir(index) {
  const agendamento = normalizarAgendamento(agendamentos[index]);
  if (!agendamento) return;

  if (!(await confirmarAcao("Excluir este registro?", juntarNomes(agendamento.pessoas), "Excluir"))) return;

  const dataExcluida = agendamento.data;

  agendamentos.splice(index, 1);
  salvar();
  filtrarAgenda();

  if (dataRelatorio && dataRelatorio.value === dataExcluida) {
    gerarRelatorio();
  }
}

function filtrarAgenda() {
  const dataSelecionada = filtroData.value;

  if (!dataSelecionada) {
    mostrarToast("Selecione uma data.", "aviso");
    return;
  }

  const listaDoDia = agendamentos
    .map((item, index) => ({ ...normalizarAgendamento(item), indexOriginal: index }))
    .filter((item) => item.data === dataSelecionada)
    .sort((a, b) => extrairNumeroSenha(a) - extrairNumeroSenha(b));

  if (!listaDoDia.length) {
    listaAgenda.innerHTML = "<p>Nenhum registro para esta data.</p>";
    return;
  }

  listaAgenda.innerHTML = listaDoDia.map((item) => {
    const nomes = juntarNomes(item.pessoas);
    const senhas = item.pessoas.map((p) => p.senha).join(" / ");

    // Bloco por pessoa com cópia individual de nome e número
    const pessoasHTML = item.pessoas.map((p, pessoaIndex) => {
      const nomeSafe = escaparHTML(p.nome || "");
      const numeroFormatado = escaparHTML(formatarNumero(p.numero));
      const numeroLimpo = limparNumero(p.numero);
      const nomeLimpo = (p.nome || "").trim().replace(/'/g, "\\'");

      return `
        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          padding:8px 10px;
          border-radius:10px;
          background:color-mix(in srgb, var(--bg-input) 90%, transparent 10%);
          flex-wrap:wrap;
        ">
          <div>
            <span style="font-weight:700; color:var(--texto);">${nomeSafe}</span><button type="button" class="btn-mini" onclick="editarNomePaciente(${item.indexOriginal}, ${pessoaIndex})" title="Editar nome">✎</button>
            <span style="color:var(--texto-suave); margin-left:8px;">${numeroFormatado}</span><button type="button" class="btn-mini" onclick="editarNumeroPaciente(${item.indexOriginal}, ${pessoaIndex})" title="Editar número">✎</button>
            ${p.senha ? `<span style="color:var(--texto-fraco); font-size:0.86rem; margin-left:8px;">Senha: ${escaparHTML(p.senha)}</span>` : ""}
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button
              type="button"
              onclick="copiarTexto('${nomeLimpo}', '✅ Nome copiado.')"
              style="font-size:0.82rem; padding:6px 10px;"
            >Copiar nome</button>
            <button
              type="button"
              onclick="copiarTexto('${numeroLimpo}', '✅ Número copiado.')"
              style="font-size:0.82rem; padding:6px 10px;"
            >Copiar número</button>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="agenda-item ${item.crmEnviado ? 'crm-enviado' : 'crm-pendente'}">
        <p>
          <strong>${escaparHTML(nomes)}</strong>
          — ${escaparHTML(item.unidade)} <button type="button" class="btn-mini" onclick="editarUnidadeAgendamento(${item.indexOriginal})" title="Editar unidade">✎</button>
          — ${escaparHTML(item.hora)} <button type="button" class="btn-mini" onclick="editarHorarioAgendamento(${item.indexOriginal})" title="Editar horário">✎</button>
        </p>
        <p style="margin-bottom:10px;">
          Tipo: <strong>${escaparHTML(formatarTipoRegistro(item.tipo))}</strong> <button type="button" class="btn-mini" onclick="editarTipoAgendamento(${item.indexOriginal})" title="Editar tipo do registro">✎</button>
          &nbsp;|&nbsp; ${getTituloSenha(item.pessoas.length)}: <strong>${escaparHTML(senhas)}</strong>
        </p>
        <p style="margin-bottom:10px;">
          <span class="crm-status ${item.crmEnviado ? 'crm-status--ok' : ''}">
            ${item.crmEnviado ? '✓ CRM Enviado' : 'CRM pendente'}
          </span>
          ${item.crmEnviadoEm ? `<span style="color:var(--texto-fraco); font-size:0.84rem; margin-left:8px;">${new Date(item.crmEnviadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>` : ""}
        </p>

        <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;">
          ${pessoasHTML}
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" onclick="verComprovante(${item.indexOriginal}, 'paciente')">Comprovante Paciente</button>
          <button type="button" onclick="verComprovante(${item.indexOriginal}, 'crm')">Comprovante CRM</button>\n\n
          <button type="button" class="${item.crmEnviado ? '' : 'btn-perigo'}" onclick="alternarCRMEnviado(${item.indexOriginal})">${item.crmEnviado ? '✓ CRM Enviado' : 'Subir CRM'}</button>
          <button type="button" onclick="excluir(${item.indexOriginal})">Excluir</button>
        </div>
      </div>
    `;
  }).join("");
}

// =========================
// RELATÓRIO DIÁRIO
// =========================
function normalizarNomeUnidadeRelatorio(unidade = "") {
  return UNIDADES_RELATORIO[unidade] || unidade.toUpperCase();
}


function gerarRelatorio() {
  const dataSelecionada = dataRelatorio.value;
  if (!dataSelecionada) { mostrarToast("Selecione uma data.", "aviso"); return; }
  const registros = agendamentos.map(normalizarAgendamento).filter((item) => item.data === dataSelecionada);
  const mapa = {};
  UNIDADES_ORDEM.forEach((u) => mapa[u] = { agendamento: 0, reagendamento: 0, inclusao: 0, totalLinha: 0 });
  registros.forEach((registro) => {
    const quantidade = registro.pessoas?.length || 1;
    const unidade = registro.unidade;
    if (!mapa[unidade]) mapa[unidade] = { agendamento: 0, reagendamento: 0, inclusao: 0, totalLinha: 0 };
    const tipo = registro.tipo || "agendamento";
    if (tipo === "reagendamento") { mapa[unidade].reagendamento += quantidade; mapa[unidade].totalLinha += quantidade; }
    else if (tipo === "inclusao") { mapa[unidade].inclusao += quantidade; mapa[unidade].totalLinha += quantidade; }
    else { mapa[unidade].agendamento += quantidade; mapa[unidade].totalLinha += quantidade; }
  });
  const nomeDia = capitalizar(obterNomeDiaSemana(dataSelecionada));
  const dataCurta = formatarDataBR(dataSelecionada);
  const linhas = UNIDADES_ORDEM.map((unidade) => `DIA ${dataCurta} *(${String(mapa[unidade]?.totalLinha || 0).padStart(2, "0")}) ${normalizarNomeUnidadeRelatorio(unidade)}*`);
  const totalAgendamentos = Object.values(mapa).reduce((s, i) => s + i.agendamento, 0);
  const totalReagendamentos = Object.values(mapa).reduce((s, i) => s + i.reagendamento, 0);
  const totalInclusoes = Object.values(mapa).reduce((s, i) => s + i.inclusao, 0);
  const totalGeral = totalAgendamentos + totalInclusoes + totalReagendamentos;
  let texto = `*DIÁRIO* \n    _*${nomeDia} ${dataCurta}*_\n\n`;
  texto += linhas.join("\n\n");
  texto += `\n\n*${totalAgendamentos} AGENDAMENTOS*\n`;
  if (totalInclusoes > 0) texto += `\n*+ ${totalInclusoes} inclusão*\n`;
  if (totalReagendamentos > 0) texto += `\n*+ ${totalReagendamentos} reagendamento*\n`;
  texto += `\n*${totalGeral} TOTAL*\n\n \n*TMK: ${getNomeTMK()}*`;
  resultadoRelatorio.textContent = texto.trim();
}


function copiarRelatorio() {
  const texto = resultadoRelatorio.textContent.trim();
  if (!texto) {
    mostrarToast("Gere um relatório primeiro.", "aviso");
    return;
  }
  copiarTexto(texto, "✅ Relatório copiado.");
}

// =========================
// MÓDULO CLIMA
// =========================
const UNIDADES_CLIMA = {
  "Augusto Montenegro": { lat: -1.3403, lon: -48.4300 },
  "Marabá":             { lat: -5.3686, lon: -49.1178 },
  "Ananindeua":         { lat: -1.3715, lon: -48.4035 },
  "Telégrafo":          { lat: -1.4400, lon: -48.4700 },
  "Marambaia":          { lat: -1.4295, lon: -48.4660 },
  "José Bonifácio":     { lat: -1.4550, lon: -48.4720 },
  "Cidade Nova":        { lat: -1.4040, lon: -48.4315 },
  "Jurunas":            { lat: -1.4610, lon: -48.4780 },
  "Castanhal":          { lat: -1.2972, lon: -47.9218 },
  "Capanema":           { lat: -1.1951, lon: -47.1819 },
  "Manaus":             { lat: -3.1190, lon: -60.0217 },
  "Manoa":              { lat: -3.0420, lon: -60.0000 },
  "Fortaleza":          { lat: -3.7319, lon: -38.5267 }
};


// Horas operacionais analisadas (índices = hora do dia)
const HORAS_ANALISE = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

function descricaoCodigoClima(codigo) {
  if (codigo === 0) return "Céu limpo";
  if (codigo <= 3) return "Parcialmente nublado";
  if (codigo <= 48) return "Neblina";
  if (codigo <= 55) return "Chuva fina";
  if (codigo <= 65) return "Chuva";
  if (codigo <= 82) return "Pancadas de chuva";
  if (codigo <= 99) return "Tempestade";
  return "Variável";
}

function emojiCodigoClima(codigo) {
  if (codigo === 0) return "☀";
  if (codigo <= 3) return "⛅";
  if (codigo <= 48) return "🌫";
  if (codigo <= 55) return "🌦";
  if (codigo <= 65) return "🌧";
  if (codigo <= 82) return "⛈";
  if (codigo <= 99) return "⛈";
  return "🌤";
}

// Retorna 0=BAIXO, 1=MÉDIO, 2=ALTO — com pontuação contínua para ordenação
function calcularConfiancaHora(precipProb, precip, codigo) {
  let confianca = 55;
  if (precipProb <= 20) confianca += 22;
  else if (precipProb <= 40) confianca += 14;
  else if (precipProb <= 60) confianca += 8;
  else confianca += 4;
  if (precip >= 0.5) confianca += 8;
  if (codigo >= 61) confianca += 8;
  if (codigo >= 80) confianca += 5;
  return Math.max(52, Math.min(95, Math.round(confianca)));
}

function pontuarHora(precipProb, precip, codigo) {
  let score = 0;
  score += precipProb * 0.6;           // peso maior na probabilidade
  score += Math.min(precip * 20, 40);  // precip em mm, capped
  if (codigo >= 61) score += 25;       // chuva confirmada no código
  if (codigo >= 80) score += 20;       // pancadas / tempestade
  return Math.round(score);
}

function nivelRisco(score) {
  if (score >= 60) return "ALTO";
  if (score >= 30) return "MÉDIO";
  return "BAIXO";
}

function corRiscoCSS(nivel) {
  if (nivel === "ALTO")  return "var(--vermelho)";
  if (nivel === "MÉDIO") return "var(--amarelo)";
  return "var(--verde)";
}

function corBarraClima(nivel) {
  if (nivel === "ALTO")  return "#ff5252";
  if (nivel === "MÉDIO") return "#ffd54f";
  return "#00c853";
}

// Encontra as melhores janelas contínuas de horário (mínimo 1 hora de duração)
// Retorna array de { inicio, fim, scoreMedia } ordenadas por score (melhor primeiro)
function encontrarJanelasOtimas(horas) {
  // horas: array de { hora, score, nivel, ... }
  const baixas = horas.filter((h) => h.nivel === "BAIXO");
  if (!baixas.length) {
    // Se não há BAIXO, pega as MÉDIO
    const medias = horas.filter((h) => h.nivel === "MÉDIO");
    if (!medias.length) return [];
    // Janelas a partir das médias
    return construirJanelas(medias, horas, 1);
  }
  return construirJanelas(baixas, horas, 1);
}

function construirJanelas(horasFiltradas, todasHoras, minHoras) {
  // Agrupa horas consecutivas
  const janelas = [];
  let janela = [horasFiltradas[0]];

  for (let i = 1; i < horasFiltradas.length; i++) {
    const anterior = horasFiltradas[i - 1].hora;
    const atual = horasFiltradas[i].hora;
    if (atual === anterior + 1) {
      janela.push(horasFiltradas[i]);
    } else {
      if (janela.length >= minHoras) janelas.push([...janela]);
      janela = [horasFiltradas[i]];
    }
  }
  if (janela.length >= minHoras) janelas.push(janela);

  // Se não tem janela com mínimo, aceita janelas de 1 hora
  if (!janelas.length && minHoras > 1) {
    return construirJanelas(horasFiltradas, todasHoras, 1);
  }

  return janelas
    .map((j) => ({
      inicio: j[0].hora,
      fim: j[j.length - 1].hora,
      scoreMedia: Math.round(j.reduce((s, h) => s + h.score, 0) / j.length),
      nivel: j[0].nivel
    }))
    .sort((a, b) => a.scoreMedia - b.scoreMedia)
    .slice(0, 3); // top 3 janelas
}

function formatarJanela(inicio, fim) {
  const h1 = String(inicio).padStart(2, "0");
  // Fim = hora seguinte - 30min (ex: janela termina às 11 → exibe "às 11:30")
  const fimHora = fim + 1;
  const h2 = String(fimHora).padStart(2, "0");
  if (inicio === fim) {
    return `${h1}:00 às ${h1}:30`;
  }
  return `${h1}:00 às ${h2}:00`;
}

async function buscarClimaUnidade() {
  const selectUnidade = document.getElementById("climaUnidade");
  const inputDataClima = document.getElementById("climaData");
  const resultado = document.getElementById("climaResultado");

  if (!selectUnidade || !resultado) return;

  const unidadeNome = selectUnidade.value;
  if (!unidadeNome) { mostrarToast("Selecione uma unidade.", "aviso"); return; }

  const coords = UNIDADES_CLIMA[unidadeNome];
  if (!coords) {
    resultado.innerHTML = "<p>Unidade sem coordenadas cadastradas.</p>";
    return;
  }

  const dataAlvo = inputDataClima?.value || obterDataHojeISO();
  resultado.innerHTML = `<p style="color:var(--texto-suave)">Buscando previsão horária para ${escaparHTML(unidadeNome)}...</p>`;

  try {
    const url = [
      "https://api.open-meteo.com/v1/forecast",
      `?latitude=${encodeURIComponent(coords.lat)}`,
      `&longitude=${encodeURIComponent(coords.lon)}`,
      "&hourly=temperature_2m,precipitation_probability,precipitation,weather_code",
      "&timezone=America%2FBelem",
      `&start_date=${encodeURIComponent(dataAlvo)}`,
      `&end_date=${encodeURIComponent(dataAlvo)}`
    ].join("");

    const resp = await fetch(url, { method: "GET", headers: { "Accept": "application/json" } });
    if (!resp.ok) throw new Error(`Falha na API (${resp.status})`);
    const dados = await resp.json();
    if (!dados?.hourly?.time || !Array.isArray(dados.hourly.time)) {
      throw new Error("Resposta da API sem dados horários válidos");
    }
    renderClimaResultado(dados, unidadeNome, dataAlvo);
  } catch (erro) {
    console.error("Erro ao buscar clima:", erro);
    resultado.innerHTML = `<p style="color:var(--vermelho)">Não foi possível buscar a previsão agora.</p><p style="color:var(--texto-fraco); font-size:.85rem; margin-top:6px;">Detalhe técnico: ${escaparHTML(String(erro?.message || erro))}</p>`;
  }
}

function renderClimaResultado(dados, unidade, dataISO) {
  const resultado = document.getElementById("climaResultado");
  if (!resultado || !dados.hourly) return;

  const h = dados.hourly;

  // Monta array de horas analisadas com score e nível
  const weatherArray = h.weathercode || h.weather_code || [];
  const precipProbArray = h.precipitation_probability || [];
  const precipArray = h.precipitation || [];
  const tempArray = h.temperature_2m || [];

  const horasAnalisadas = HORAS_ANALISE.map((hora) => {
    const i = hora;
    const precipProb = Number(precipProbArray[i] ?? 0);
    const precip     = Number(precipArray[i] ?? 0);
    const temp       = Number(tempArray[i] ?? 0);
    const codigo     = Number(weatherArray[i] ?? 0);
    const score      = pontuarHora(precipProb, precip, codigo);
    const nivel      = nivelRisco(score);
    const confianca  = calcularConfiancaHora(precipProb, precip, codigo);

    return { hora, precipProb, precip, temp: Math.round(temp), codigo, score, nivel, confianca };
  });

  // Divide em período manhã e tarde para resumo
  const manha = horasAnalisadas.filter((h) => h.hora <= 11);
  const tarde  = horasAnalisadas.filter((h) => h.hora >= 12);

  const resumoPeriodo = (lista) => {
    const scoreMax = Math.max(...lista.map((h) => h.score));
    const probMax  = Math.max(...lista.map((h) => h.precipProb));
    const tempMedia = Math.round(lista.reduce((s, h) => s + h.temp, 0) / lista.length);
    const nivel = nivelRisco(scoreMax);
    return { scoreMax, probMax, tempMedia, nivel };
  };

  const resumoManha = resumoPeriodo(manha);
  const resumoTarde  = resumoPeriodo(tarde);

  // Janelas ideais
  const janelas = encontrarJanelasOtimas(horasAnalisadas);

  // Melhor hora individual (menor score)
  const melhorHora = [...horasAnalisadas].sort((a, b) => a.score - b.score)[0];
  const piorHora = [...horasAnalisadas].sort((a, b) => b.score - a.score)[0];
  const confiancaMedia = Math.round(horasAnalisadas.reduce((s, item) => s + item.confianca, 0) / horasAnalisadas.length);

  const dataBR = formatarDataBRCompleta(dataISO);

  // ---- HTML ----
  // 1. Linha do tempo hora a hora
  const timelineHTML = horasAnalisadas.map((item) => {
    const cor = corBarraClima(item.nivel);
    const altura = Math.max(20, Math.round((item.score / 100) * 72) + 8);
    const label = `${String(item.hora).padStart(2, "0")}h`;
    const title = `${label}: ${descricaoCodigoClima(item.codigo)} · ${item.precipProb}% chuva · ${item.temp}°C`;

    return `
      <div style="display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; min-width:0;"
           title="${escaparHTML(title)}">
        <span style="font-size:10px; color:var(--texto-fraco); white-space:nowrap;">${item.precipProb}%</span>
        <div style="
          width:100%;
          height:${altura}px;
          background:${cor};
          border-radius:4px 4px 0 0;
          opacity:0.85;
          min-height:8px;
          position:relative;
        "></div>
        <span style="font-size:10px; color:var(--texto-suave);">${label}</span>
        <span style="font-size:11px;">${emojiCodigoClima(item.codigo)}</span>
      </div>
    `;
  }).join("");

  // 2. Tabela detalhada hora a hora
  const tabelaHTML = horasAnalisadas.map((item) => {
    const cor = corRiscoCSS(item.nivel);
    const bgOpac = item.nivel === "BAIXO"
      ? "rgba(0,200,83,0.06)"
      : item.nivel === "MÉDIO"
      ? "rgba(255,213,79,0.06)"
      : "rgba(255,82,82,0.06)";

    return `
      <tr style="background:${bgOpac}; border-bottom:1px solid var(--borda);">
        <td style="padding:7px 10px; font-weight:700; white-space:nowrap;">
          ${String(item.hora).padStart(2, "0")}:00
        </td>
        <td style="padding:7px 10px; font-size:1rem;">${emojiCodigoClima(item.codigo)}</td>
        <td style="padding:7px 10px; color:var(--texto-suave); font-size:0.88rem;">
          ${escaparHTML(descricaoCodigoClima(item.codigo))}
        </td>
        <td style="padding:7px 10px; text-align:center;">${item.precipProb}%</td>
        <td style="padding:7px 10px; text-align:center; font-size:0.86rem; color:var(--texto-suave);">
          ${item.precip.toFixed(1)}mm
        </td>
        <td style="padding:7px 10px; text-align:center; color:var(--texto-suave);">${item.temp}°C</td>
        <td style="padding:7px 10px; text-align:center;">
          <span style="
            color:${cor};
            font-weight:700;
            font-size:0.82rem;
            background:${bgOpac};
            border:1px solid ${cor};
            border-radius:6px;
            padding:2px 8px;
          ">${item.nivel}</span>
          <span style="display:block; margin-top:4px; font-size:0.72rem; color:var(--texto-fraco);">${item.confianca}%</span>
        </td>
      </tr>
    `;
  }).join("");

  // 3. Janelas recomendadas
  const janelasPrincipal = janelas[0];
  const janelasBlocos = janelas.map((j, idx) => {
    const destaque = idx === 0;
    const cor = corRiscoCSS(j.nivel);
    const bg = destaque
      ? "rgba(0,170,255,0.10)"
      : "color-mix(in srgb, var(--bg-card) 90%, transparent 10%)";
    const borda = destaque
      ? "rgba(0,170,255,0.45)"
      : "var(--borda)";
    const prefixo = idx === 0 ? "Melhor janela" : idx === 1 ? "2ª opção" : "3ª opção";

    return `
      <div style="
        border:1px solid ${borda};
        border-radius:12px;
        padding:12px 14px;
        background:${bg};
        display:flex;
        flex-direction:column;
        gap:4px;
      ">
        <span style="font-size:0.78rem; color:var(--texto-fraco); text-transform:uppercase; letter-spacing:0.5px;">
          ${prefixo}
        </span>
        <span style="font-size:1.08rem; font-weight:700; color:${destaque ? "var(--azul)" : "var(--texto)"};">
          ${formatarJanela(j.inicio, j.fim)}
        </span>
        <span style="font-size:0.84rem; color:${cor};">Risco ${j.nivel}</span>
      </div>
    `;
  }).join("");

  // 4. Resumo manhã/tarde
  const classeBox = (n) =>
    n === "ALTO" ? "status-box--erro" : n === "MÉDIO" ? "status-box--alerta" : "status-box--ok";

  resultado.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:18px; padding-top:4px;">

      <!-- Cabeçalho -->
      <p style="font-size:0.94rem; color:var(--texto-suave); margin:0;">
        <strong style="color:var(--texto);">${escaparHTML(unidade)}</strong> — ${escaparHTML(dataBR)}
      </p>

      <!-- Linha do tempo visual -->
      <div>
        <p style="font-size:0.82rem; color:var(--texto-fraco); margin:0 0 8px; text-transform:uppercase; letter-spacing:0.5px;">
          Probabilidade de chuva por hora
        </p>
        <div style="
          display:flex;
          align-items:flex-end;
          gap:4px;
          padding:12px 10px 0;
          background:color-mix(in srgb, var(--bg-input) 80%, transparent 20%);
          border:1px solid var(--borda);
          border-radius:14px;
          overflow:hidden;
        ">
          ${timelineHTML}
        </div>
      </div>

      <div class="status-box ${confiancaMedia >= 78 ? "status-box--ok" : confiancaMedia >= 65 ? "status-box--alerta" : "status-box--erro"}"><strong>Confiança estimada da previsão</strong><span>${confiancaMedia}% de estabilidade na leitura do dia</span><span style="font-weight:700; color:${confiancaMedia >= 78 ? "var(--verde)" : confiancaMedia >= 65 ? "var(--amarelo)" : "var(--vermelho)"};">${confiancaMedia >= 78 ? "Confiança alta" : confiancaMedia >= 65 ? "Confiança média" : "Confiança baixa"}</span></div>
      <div class="status-box ${classeBox(melhorHora.nivel)}"><strong>Melhor hora do dia</strong><span>${String(melhorHora.hora).padStart(2, "0")}:00 · ${melhorHora.precipProb}% chuva · ${melhorHora.temp}°C</span><span style="font-weight:700; color:${corRiscoCSS(melhorHora.nivel)};">Risco ${melhorHora.nivel}</span></div>
      <div class="status-box ${classeBox(piorHora.nivel)}"><strong>Pior hora do dia</strong><span>${String(piorHora.hora).padStart(2, "0")}:00 · ${piorHora.precipProb}% chuva · ${piorHora.temp}°C</span><span style="font-weight:700; color:${corRiscoCSS(piorHora.nivel)};">Risco ${piorHora.nivel}</span></div>

      <!-- Resumo manhã/tarde -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="status-box ${classeBox(resumoManha.nivel)}">
          <strong>Manhã (7h–11h)</strong>
          <span>Pico de chuva: ${resumoManha.probMax}%</span>
          <span>Temp. média: ~${resumoManha.tempMedia}°C</span>
          <span style="color:${corRiscoCSS(resumoManha.nivel)}; font-weight:700; margin-top:4px;">
            Risco geral: ${resumoManha.nivel}
          </span>
        </div>
        <div class="status-box ${classeBox(resumoTarde.nivel)}">
          <strong>Tarde (12h–18h)</strong>
          <span>Pico de chuva: ${resumoTarde.probMax}%</span>
          <span>Temp. média: ~${resumoTarde.tempMedia}°C</span>
          <span style="color:${corRiscoCSS(resumoTarde.nivel)}; font-weight:700; margin-top:4px;">
            Risco geral: ${resumoTarde.nivel}
          </span>
        </div>
      </div>

      <!-- Janelas recomendadas -->
      <div>
        <p style="font-size:0.82rem; color:var(--texto-fraco); margin:0 0 8px; text-transform:uppercase; letter-spacing:0.5px;">
          Janelas ideais para agendamentos
        </p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:10px;">
          ${janelas.length ? janelasBlocos : `
            <div class="status-box status-box--erro">
              <strong>Dia de alto risco</strong>
              <span>Nenhum período com risco baixo identificado.</span>
              <span style="font-size:0.84rem; color:var(--texto-fraco);">
                Melhor horário disponível: ${String(melhorHora.hora).padStart(2, "0")}:00
              </span>
            </div>
          `}
        </div>
      </div>

      <!-- Tabela analítica hora a hora -->
      <div>
        <p style="font-size:0.82rem; color:var(--texto-fraco); margin:0 0 8px; text-transform:uppercase; letter-spacing:0.5px;">
          Análise detalhada hora a hora
        </p>
        <div style="overflow-x:auto; border-radius:12px; border:1px solid var(--borda);">
          <table style="width:100%; border-collapse:collapse; font-size:0.88rem;">
            <thead>
              <tr style="background:color-mix(in srgb, var(--bg-input) 90%, transparent 10%);">
                <th style="padding:8px 10px; text-align:left; font-size:0.78rem; color:var(--texto-fraco); font-weight:700;">Hora</th>
                <th style="padding:8px 10px; text-align:left; font-size:0.78rem; color:var(--texto-fraco); font-weight:700;"></th>
                <th style="padding:8px 10px; text-align:left; font-size:0.78rem; color:var(--texto-fraco); font-weight:700;">Condição</th>
                <th style="padding:8px 10px; text-align:center; font-size:0.78rem; color:var(--texto-fraco); font-weight:700;">Chuva</th>
                <th style="padding:8px 10px; text-align:center; font-size:0.78rem; color:var(--texto-fraco); font-weight:700;">Precip.</th>
                <th style="padding:8px 10px; text-align:center; font-size:0.78rem; color:var(--texto-fraco); font-weight:700;">Temp.</th>
                <th style="padding:8px 10px; text-align:center; font-size:0.78rem; color:var(--texto-fraco); font-weight:700;">Risco</th>
              </tr>
            </thead>
            <tbody>${tabelaHTML}</tbody>
          </table>
        </div>
      </div>

      <p style="font-size:0.82rem; color:var(--texto-fraco); margin:0; padding-top:4px;">
        Fonte: Open-Meteo · Dados horários · Não impede agendamentos, apenas orienta o melhor horário.
      </p>
    </div>
  `;
}

// =========================
// INICIALIZAÇÃO
// =========================
function inicializarFormulario() {
  preencherHorarios();
  limparFormularioAgendamento();

  if (tipoAgendamentoInput) {
    tipoAgendamentoInput.addEventListener("change", atualizarDataPadraoPorTipo);
  }
  if (horaInput) {
    horaInput.addEventListener("blur", () => {
      const normalizado = normalizarHoraDigitada(horaInput.value);
      if (horaInput.value && !normalizado) mostrarToast("Horário inválido. Use algo como 14:30.", "aviso");
      if (normalizado) horaInput.value = normalizado;
    });
  }
}

setTheme(temaSalvo);
normalizarAgendamentosExistentes();
salvar();
inicializarFormulario();
if (nomeTMKInput) {
  nomeTMKInput.value = nomeTMK;
  nomeTMKInput.addEventListener("input", (e) => {
    nomeTMK = e.target.value.trim() || "PAULO LOBATO";
    localStorage.setItem("quickleadTMK", nomeTMK);
  });
}
if (generoTMKInput) generoTMKInput.value = generoTMK;
atualizarGeneroUI();
if (importarTXTInput) {
  importarTXTInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => importarLeadsTXT(String(ev.target?.result || ""));
    reader.readAsText(file);
    importarTXTInput.value = "";
  });
}
atualizarStatusAutomaticos();
mostrarBanco();
atualizarCampanhas();
atualizarStatusSync("Modo local ativo");

// Define data padrão de hoje no campo clima
const climaDataInput = document.getElementById("climaData");
if (climaDataInput) climaDataInput.value = obterDataHojeISO();


document.querySelectorAll(".modal").forEach((modalEl) => {
  modalEl.addEventListener("click", (event) => {
    if (event.target === modalEl) {
      if (modalEl === modalConfirmacao) fecharModalConfirmacao(false);
      else if (modalEl === modalEntrada) fecharModalEntrada(null);
      else if (modalEl === modalAcoesBanco) fecharModalBanco();
      else if (modalEl === modalSegmentacaoMassa) fecharModalSegmentacao();
      else if (modalEl === modalListaLeads) fecharModalListaLeads();
      else if (modalEl === modal) fecharModal();
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (modalConfirmacao?.style.display === "flex") fecharModalConfirmacao(false);
    if (modalEntrada?.style.display === "flex") fecharModalEntrada(null);
  }
  if (event.key === "Enter" && modalEntrada?.style.display === "flex" && document.activeElement === modalEntradaInput) {
    confirmarModalEntrada();
  }
});

trocarAba("agendamento");

if (filtroData && !filtroData.value) filtroData.value = obterDataHojeISO();
if (dataRelatorio && !dataRelatorio.value) dataRelatorio.value = obterDataHojeISO();


try {
  preencherSegmentacoesPadraoBanco();
  atualizarUIBancoPadrao();
} catch (erro) {
  console.warn("Não foi possível inicializar controles extras do banco.", erro);
}


try { preencherSelectsSegmentacaoPadrao(); } catch (e) { console.warn('Falha ao preparar segmentação padrão:', e); }
