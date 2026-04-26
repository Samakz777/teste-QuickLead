let bancoLeads = JSON.parse(localStorage.getItem("bancoLeads")) || [];
let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
let temaSalvo = localStorage.getItem("quickleadTema") || "dark";

let agendamentoAtual = null;
let leadSelecionadoIndex = null;
let tipoComprovanteAtual = "paciente";
let _confirmarCallbackOk = null;
let _editarLeadCallback = null;

// ELEMENTOS
const unidadeInput         = document.getElementById("unidade");
const dataInput            = document.getElementById("data");
const horaInput            = document.getElementById("hora");
const tipoAgendamentoInput = document.getElementById("tipoAgendamento");
const listaPessoas         = document.getElementById("listaPessoas");
const entradaFiltro        = document.getElementById("entradaFiltro");
const saidaFiltro          = document.getElementById("saidaFiltro");
const saidaBloqueados      = document.getElementById("saidaBloqueados");
const resumoFiltro         = document.getElementById("resumoFiltro");
const entradaBanco         = document.getElementById("entradaBanco");
const listaBanco           = document.getElementById("listaBanco");
const buscaBanco           = document.getElementById("buscaBanco");
const resumoBanco          = document.getElementById("resumoBanco");
const segmentacaoEmMassa   = document.getElementById("segmentacaoEmMassa");
const filtroSegmentacaoBanco = document.getElementById("filtroSegmentacaoBanco");
const filtroDiaReed        = document.getElementById("filtroDiaReed");
const filtroMesPro         = document.getElementById("filtroMesPro");
const painelReed           = document.getElementById("painelReed");
const painelPro            = document.getElementById("painelPro");
const campanhaVisualizacao = document.getElementById("campanhaVisualizacao");
const filtroData           = document.getElementById("filtroData");
const listaAgenda          = document.getElementById("listaAgenda");
const dataRelatorio        = document.getElementById("dataRelatorio");
const resultadoRelatorio   = document.getElementById("resultadoRelatorio");
const modal                = document.getElementById("modalComprovante");
const textoComprovante     = document.getElementById("textoComprovante");
const modalAcoesBanco      = document.getElementById("modalAcoesBanco");
const modalSegmentacaoMassa = document.getElementById("modalSegmentacaoMassa");
const syncStatusTexto      = document.getElementById("syncStatusTexto");

// =========================
// SISTEMA DE TOASTS
// =========================
function showToast(texto, tipo = "ok", opcoes = {}) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast--${tipo}`;

  const acaoHTML = opcoes.desfazerFn
    ? `<button class="toast__acao" onclick="_toastDesfazer(this)">Desfazer</button>`
    : "";

  toast.innerHTML = `
    <div class="toast__corpo">
      <div class="toast__texto">${escaparHTML(texto)}</div>
      ${opcoes.sub ? `<div class="toast__sub">${escaparHTML(opcoes.sub)}</div>` : ""}
    </div>
    ${acaoHTML}
    <button class="toast__fechar" onclick="_toastRemover(this.closest('.toast'))">✕</button>
  `;

  if (opcoes.desfazerFn) {
    toast._desfazer = opcoes.desfazerFn;
  }

  container.appendChild(toast);

  const dur = opcoes.duracao || (opcoes.desfazerFn ? 5000 : 3000);
  const timer = setTimeout(() => _toastRemover(toast), dur);
  toast._timer = timer;
}

function _toastDesfazer(btn) {
  const toast = btn.closest(".toast");
  if (toast && toast._desfazer) {
    clearTimeout(toast._timer);
    toast._desfazer();
    _toastRemover(toast);
  }
}

function _toastRemover(toast) {
  if (!toast || !toast.parentNode) return;
  toast.classList.add("saindo");
  setTimeout(() => toast.parentNode && toast.parentNode.removeChild(toast), 200);
}

// =========================
// SISTEMA DE CONFIRMAÇÃO (substitui confirm())
// =========================
function showConfirm(mensagem, detalhe, onConfirm, opcoes = {}) {
  const el = document.getElementById("modalConfirmacao");
  if (!el) { if (confirm(mensagem)) onConfirm(); return; }

  document.getElementById("modalConfirmacaoMensagem").textContent = mensagem;
  const detEl = document.getElementById("modalConfirmacaoDetalhe");
  detEl.textContent = detalhe || "";
  detEl.style.display = detalhe ? "block" : "none";

  const btnOk = document.getElementById("modalConfirmacaoOk");
  btnOk.textContent = opcoes.labelOk || "Confirmar";
  btnOk.className = opcoes.perigo ? "btn-perigo" : "btn-principal";

  _confirmarCallbackOk = onConfirm;

  el.style.display = "flex";
  el.setAttribute("aria-hidden", "false");
}

function _confirmarOk() {
  _fecharModalConfirmacao();
  if (_confirmarCallbackOk) _confirmarCallbackOk();
  _confirmarCallbackOk = null;
}

function _confirmarCancelar() {
  _fecharModalConfirmacao();
  _confirmarCallbackOk = null;
}

function _fecharModalConfirmacao() {
  const el = document.getElementById("modalConfirmacao");
  if (el) { el.style.display = "none"; el.setAttribute("aria-hidden", "true"); }
}

// =========================
// MODAL DE EDIÇÃO (substitui prompt())
// =========================
function abrirModalEditar(numero, status, callback) {
  document.getElementById("editarNumero").value = numero;
  document.getElementById("editarStatus").value = status;
  _editarLeadCallback = callback;
  const el = document.getElementById("modalEditar");
  el.style.display = "flex";
  el.setAttribute("aria-hidden", "false");
  setTimeout(() => document.getElementById("editarNumero").focus(), 60);
}

function fecharModalEditar() {
  const el = document.getElementById("modalEditar");
  if (el) { el.style.display = "none"; el.setAttribute("aria-hidden", "true"); }
  _editarLeadCallback = null;
}

function confirmarEdicaoLead() {
  const numero = document.getElementById("editarNumero").value.trim();
  const status = document.getElementById("editarStatus").value.trim();
  fecharModalEditar();
  if (_editarLeadCallback) _editarLeadCallback(numero, status);
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
  document.querySelectorAll(".aba").forEach((a) => a.classList.remove("ativa"));
  const destino = document.getElementById(id);
  if (destino) destino.classList.add("ativa");

  document.querySelectorAll("nav.menu button").forEach((btn) => {
    btn.classList.toggle("ativo", btn.dataset.tab === id);
  });
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
  if (n.length === 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
  return numero;
}

function copiarTexto(texto, mensagem = "Copiado!") {
  if (!texto) return;
  const _copy = () => {
    const tipo = mensagem.toLowerCase().includes("nome") ? "info"
      : mensagem.toLowerCase().includes("número") ? "info"
      : "ok";
    showToast(mensagem.replace("✅ ", ""), tipo);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(texto).then(_copy).catch(() => fallbackCopiarTexto(texto, mensagem));
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
  showToast(mensagem.replace("✅ ", ""), "ok");
}

function agoraISO() { return new Date().toISOString(); }

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
  return new Date(`${dataISO}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long" });
}

function capitalizar(texto = "") {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "";
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("quickleadTema", theme);
}

function alternarTema() {
  const atual = document.documentElement.getAttribute("data-theme") || "dark";
  setTheme(atual === "dark" ? "light" : "dark");
}

function diferencaEmDias(inicioISO, fim = new Date()) {
  if (!inicioISO) return 0;
  return Math.floor((fim.getTime() - new Date(inicioISO).getTime()) / (1000*60*60*24));
}

function diferencaEmMeses(inicioISO, fim = new Date()) {
  if (!inicioISO) return 0;
  const inicio = new Date(inicioISO);
  let meses = (fim.getFullYear() - inicio.getFullYear()) * 12;
  meses += fim.getMonth() - inicio.getMonth();
  if (fim.getDate() < inicio.getDate()) meses -= 1;
  return Math.max(0, meses);
}

// =========================
// COMPATIBILIDADE
// =========================
function normalizarAgendamento(ag = {}) {
  if (Array.isArray(ag.pessoas) && ag.pessoas.length) {
    return {
      ...ag,
      pessoas: ag.pessoas.map((p) => ({
        nome: (p?.nome || "").trim(),
        numero: limparNumero(p?.numero || ""),
        observacao: (p?.observacao || "").trim(),
        senha: p?.senha || ""
      }))
    };
  }
  return {
    ...ag,
    tipo: ag.tipo || "agendamento",
    pessoas: [{ nome: (ag.nome||"").trim(), numero: limparNumero(ag.numero||""), observacao: (ag.observacao||"").trim(), senha: ag.senha||"" }]
  };
}

function normalizarAgendamentosExistentes() {
  agendamentos = agendamentos.map((i) => normalizarAgendamento(i));
}

// =========================
// REGRAS DE DATA / HORA
// =========================
function obterDataHojeISO() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,"0")}-${String(h.getDate()).padStart(2,"0")}`;
}

function obterProximoDiaUtilISO() {
  const hoje = new Date();
  const ds = hoje.getDay();
  const data = new Date(hoje);
  if (ds === 6) data.setDate(data.getDate() + 2);
  else if (ds === 0) data.setDate(data.getDate() + 1);
  else data.setDate(data.getDate() + 1);
  return `${data.getFullYear()}-${String(data.getMonth()+1).padStart(2,"0")}-${String(data.getDate()).padStart(2,"0")}`;
}

function atualizarDataPadraoPorTipo() {
  if (!dataInput || !tipoAgendamentoInput) return;
  dataInput.value = tipoAgendamentoInput.value === "inclusao" ? obterDataHojeISO() : obterProximoDiaUtilISO();
}

function preencherHorarios() {
  if (!horaInput) return;
  const opts = [];
  for (let h = 7; h <= 19; h++) {
    opts.push(`${String(h).padStart(2,"0")}:00`);
    if (h < 19) opts.push(`${String(h).padStart(2,"0")}:30`);
  }
  horaInput.innerHTML = `<option value="">Selecionar horário</option>` +
    opts.map((o) => `<option value="${o}">${o}</option>`).join("");
}

// =========================
// CONTADOR DE PRODUÇÃO
// =========================
function atualizarContadorProducao() {
  const hoje = obterDataHojeISO();
  let ag = 0, inc = 0, reag = 0;
  agendamentos.forEach((item) => {
    const a = normalizarAgendamento(item);
    if (a.data !== hoje) return;
    const n = a.pessoas?.length || 1;
    if (a.tipo === "agendamento")   ag += n;
    if (a.tipo === "inclusao")      inc += n;
    if (a.tipo === "reagendamento") reag += n;
  });
  const elA = document.getElementById("contadorAgendamentos");
  const elI = document.getElementById("contadorInclusoes");
  const elR = document.getElementById("contadorReagendamentos");
  if (elA) elA.textContent = ag;
  if (elI) elI.textContent = inc;
  if (elR) elR.textContent = reag;
}

// =========================
// MULTI-PACIENTE
// =========================
function criarBlocoPessoaHTML(index, pessoa = {}) {
  const nome = escaparHTML(pessoa.nome || "");
  const numero = escaparHTML(pessoa.numero || "");
  const observacao = escaparHTML(pessoa.observacao || "");

  return `
    <div class="agenda-item pessoa-bloco" data-index="${index}">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:4px;">
        <strong style="font-size:0.8125rem; color:var(--texto-suave);">Pessoa ${index + 1}</strong>
        <button type="button" onclick="removerPessoa(${index})" class="btn-icone">Remover</button>
      </div>
      <div class="painel-agendamento-grid">
        <div class="grupo-campos">
          <label>Nome</label>
          <input type="text" class="pessoa-nome" placeholder="Nome do paciente" value="${nome}">
        </div>
        <div class="grupo-campos">
          <label>Número</label>
          <input type="tel" class="pessoa-numero" placeholder="Número do paciente" value="${numero}">
        </div>
      </div>
      <div class="grupo-campos">
        <label>Observação</label>
        <textarea class="pessoa-observacao" placeholder="Ex: criança — ligar para responsável">${observacao}</textarea>
      </div>
    </div>
  `;
}

function adicionarPessoa(pessoa = {}) {
  if (!listaPessoas) return;
  listaPessoas.insertAdjacentHTML("beforeend", criarBlocoPessoaHTML(listaPessoas.children.length, pessoa));
}

function reindexarPessoas() {
  if (!listaPessoas) return;
  const blocos = Array.from(listaPessoas.querySelectorAll(".pessoa-bloco"));
  listaPessoas.innerHTML = "";
  blocos.forEach((bloco, index) => {
    listaPessoas.insertAdjacentHTML("beforeend", criarBlocoPessoaHTML(index, {
      nome: bloco.querySelector(".pessoa-nome")?.value || "",
      numero: bloco.querySelector(".pessoa-numero")?.value || "",
      observacao: bloco.querySelector(".pessoa-observacao")?.value || ""
    }));
  });
}

function removerPessoa(index) {
  if (!listaPessoas) return;
  const blocos = listaPessoas.querySelectorAll(".pessoa-bloco");
  if (blocos.length <= 1) {
    showToast("Mantenha pelo menos uma pessoa no agendamento.", "aviso");
    return;
  }
  const alvo = listaPessoas.querySelector(`.pessoa-bloco[data-index="${index}"]`);
  if (alvo) { alvo.remove(); reindexarPessoas(); }
}

function coletarPessoasFormulario() {
  if (!listaPessoas) return [];
  return Array.from(listaPessoas.querySelectorAll(".pessoa-bloco")).map((b) => ({
    nome: (b.querySelector(".pessoa-nome")?.value || "").trim(),
    numero: limparNumero(b.querySelector(".pessoa-numero")?.value || ""),
    observacao: (b.querySelector(".pessoa-observacao")?.value || "").trim()
  }));
}

function limparFormularioAgendamento() {
  if (tipoAgendamentoInput) tipoAgendamentoInput.value = "agendamento";
  if (unidadeInput) unidadeInput.value = "";
  if (horaInput) horaInput.value = "";
  atualizarDataPadraoPorTipo();
  if (listaPessoas) { listaPessoas.innerHTML = ""; adicionarPessoa(); }
}

function juntarNomes(pessoas = []) {
  const nomes = pessoas.map((p) => p.nome).filter(Boolean);
  if (!nomes.length) return "";
  if (nomes.length === 1) return nomes[0];
  if (nomes.length === 2) return `${nomes[0]} e ${nomes[1]}`;
  return `${nomes.slice(0,-1).join(", ")} e ${nomes[nomes.length-1]}`;
}

// =========================
// STATUS / SEGMENTAÇÃO
// =========================
function normalizarStatus(texto = "") {
  const bruto = normalizarTexto(texto).replace(/[\s._-]+/g, "");
  if (!bruto) return null;
  if (["NOVO","NEW","LEADNOVO","LEAD"].includes(bruto)) return "NOVO";
  if (["DES","DESCARTADO","DESQUALIFICADO"].includes(bruto)) return "DES";
  if (["LON","LONG","LONGDISTANCE"].includes(bruto)) return "LON";
  if (["FOR","FORA","FORADECOBERTURA"].includes(bruto)) return "FOR";
  if (["PAT","PATOLOGIA"].includes(bruto)) return "PAT";
  const matchReed = bruto.match(/^REEDD?(\d{1,2})$/);
  if (matchReed) { const dia = Number(matchReed[1]); if (dia >= 1 && dia <= 30) return `REEDD${dia}`; }
  const matchPro = bruto.match(/^PROM?M?(\d{1,2})$|^PRO(?:GRAMADO)?M(\d{1,2})$/);
  if (matchPro) { const mes = Number(matchPro[1] || matchPro[2]); if (mes >= 1 && mes <= 12) return `PROM${mes}`; }
  return null;
}

function decomporStatus(status = "") {
  const s = normalizarStatus(status) || "NOVO";
  if (["NOVO","DES","LON","FOR","PAT"].includes(s)) return { status: s, segmento: s, baseTipo: s, baseValor: null };
  const reed = s.match(/^REEDD(\d{1,2})$/);
  if (reed) return { status: `REED D${Number(reed[1])}`, segmento: "REED", baseTipo: "REED", baseValor: Number(reed[1]) };
  const pro = s.match(/^PROM(\d{1,2})$/);
  if (pro) return { status: `PRO M${Number(pro[1])}`, segmento: "PRO", baseTipo: "PRO", baseValor: Number(pro[1]) };
  return { status: "NOVO", segmento: "NOVO", baseTipo: "NOVO", baseValor: null };
}

function formatarStatusExibicao(status = "") { return decomporStatus(status).status; }

function categoriaDoStatus(status = "") {
  const info = decomporStatus(status);
  if (info.segmento === "REED") return info.baseValor === 1 ? "UTIL_AGORA" : "IGNORAR_AGORA";
  if (info.segmento === "PRO") return "IGNORAR_AGORA";
  if (info.segmento === "NOVO") return "UTIL_AGORA";
  if (["DES","LON","FOR","PAT"].includes(info.segmento)) return "DESQUALIFICADO";
  return "NEUTRO";
}

function categoriaParaClasse(cat) {
  if (cat === "UTIL_AGORA") return "util";
  if (cat === "IGNORAR_AGORA") return "ignorar";
  if (cat === "DESQUALIFICADO") return "desqualificado";
  return "neutro";
}

function prioridadeStatus(status = "") {
  const info = decomporStatus(status);
  if (info.segmento === "NOVO") return 1;
  if (info.segmento === "REED" && info.baseValor === 1) return 2;
  if (info.segmento === "REED") return 10 + info.baseValor;
  if (info.segmento === "PRO") return 50 + info.baseValor;
  if (info.segmento === "DES") return 96;
  if (info.segmento === "LON") return 97;
  if (info.segmento === "FOR") return 98;
  if (info.segmento === "PAT") return 99;
  return 70;
}

// =========================
// ATUALIZAÇÃO AUTOMÁTICA
// =========================
function atualizarStatusDinamicoLead(lead) {
  if (!lead || !lead.baseTipo) return lead;
  if (lead.baseTipo === "REED") {
    const dias = diferencaEmDias(lead.criadoEm || agoraISO());
    if (dias >= lead.baseValor) { lead.tipo = "DES"; lead.baseTipo = "DES"; lead.baseValor = null; lead.atualizadoAutomaticamente = true; return lead; }
    lead.tipo = `REEDD${Math.max(1, lead.baseValor - dias)}`;
    return lead;
  }
  if (lead.baseTipo === "PRO") {
    const meses = diferencaEmMeses(lead.criadoEm || agoraISO());
    const restante = lead.baseValor - meses;
    if (restante <= 0) { lead.tipo = "NOVO"; lead.baseTipo = "NOVO"; lead.baseValor = null; lead.atualizadoAutomaticamente = true; return lead; }
    lead.tipo = `PROM${restante}`;
    return lead;
  }
  return lead;
}

function atualizarStatusAutomaticos() {
  let alterou = false;
  bancoLeads = bancoLeads.map((lead) => {
    const tA = lead.tipo, btA = lead.baseTipo, bvA = lead.baseValor;
    if (!lead.criadoEm) lead.criadoEm = agoraISO();
    if (!lead.baseTipo) { const info = decomporStatus(lead.tipo); lead.baseTipo = info.baseTipo; lead.baseValor = info.baseValor; }
    const at = atualizarStatusDinamicoLead(lead);
    if (at.tipo !== tA || at.baseTipo !== btA || at.baseValor !== bvA) alterou = true;
    return at;
  });
  ordenarBanco();
  if (alterou) salvar();
}

// =========================
// BANCO
// =========================
function extrairTodosNumerosValidos(texto = "") {
  const matches = String(texto).match(/(?:\+?55\s*)?\d[\d\s().-]{7,}\d/g) || [];
  return matches
    .map((i) => limparNumero(i))
    .filter((n) => n.length === 10 || n.length === 11)
    .filter((n, idx, arr) => arr.indexOf(n) === idx);
}

function extrairNumeroEStatusDaLinha(linha = "") {
  const texto = String(linha).trim();
  if (!texto) return null;
  const numeros = extrairTodosNumerosValidos(texto);
  if (!numeros.length) return null;
  const numero = numeros[0];
  const matchStatus = texto.match(/-\s*([A-Za-zÀ-ÿ0-9\s]+)\s*$/);
  if (!matchStatus) return { numero, tipo: null, baseTipo: null, baseValor: null, criadoEm: agoraISO() };
  const statusNorm = normalizarStatus(matchStatus[1].trim());
  if (!statusNorm) return { numero, tipo: null, baseTipo: null, baseValor: null, criadoEm: agoraISO() };
  const info = decomporStatus(statusNorm);
  return { numero, tipo: statusNorm, baseTipo: info.baseTipo, baseValor: info.baseValor, criadoEm: agoraISO() };
}

function buscarLeadNoBancoPorNumero(numero) {
  const chave = getPhoneKey(numero);
  if (!chave) return null;
  return bancoLeads.find((l) => getPhoneKey(l.numero) === chave) || null;
}

function ordenarBanco() {
  bancoLeads.sort((a, b) => {
    const pa = prioridadeStatus(a.tipo), pb = prioridadeStatus(b.tipo);
    if (pa !== pb) return pa - pb;
    return limparNumero(a.numero).localeCompare(limparNumero(b.numero));
  });
}

function salvarBanco() {
  const linhas = entradaBanco.value.split("\n");
  let adicionados = 0, atualizados = 0, ignorados = 0;
  linhas.forEach((linha) => {
    const dado = extrairNumeroEStatusDaLinha(linha);
    if (!dado) { if (linha.trim()) ignorados++; return; }
    if (!dado.tipo) { ignorados++; return; }
    const existente = buscarLeadNoBancoPorNumero(dado.numero);
    if (existente) { existente.numero = dado.numero; existente.tipo = dado.tipo; existente.baseTipo = dado.baseTipo; existente.baseValor = dado.baseValor; existente.criadoEm = agoraISO(); atualizados++; }
    else { bancoLeads.push(dado); adicionados++; }
  });
  atualizarStatusAutomaticos();
  entradaBanco.value = "";
  mostrarBanco();
  atualizarCampanhas();
  salvar();
  showToast(`Banco atualizado — ${adicionados} adicionados, ${atualizados} atualizados`, "ok", { sub: ignorados ? `${ignorados} linha(s) ignoradas` : "" });
}


function exportarBancoTXT() {
  if (!bancoLeads || !bancoLeads.length) {
    showToast("O banco está vazio.", "info");
    return;
  }

  const linhas = bancoLeads.map((lead) => {
    const numero = limparNumero(lead.numero || "");
    const status = formatarStatusExibicao(lead.tipo || lead.status || "NOVO");
    return `${numero} - ${status}`;
  }).filter((linha) => linha.trim() !== " - ");

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

  showToast("Banco geral exportado em TXT.", "ok");
}

function abrirSegmentacaoEmMassa() {
  if (!entradaBanco.value.trim()) { showToast("Cole uma lista no banco antes de continuar.", "aviso"); return; }
  modalSegmentacaoMassa.style.display = "flex";
  modalSegmentacaoMassa.setAttribute("aria-hidden", "false");
}

function fecharModalSegmentacao() {
  modalSegmentacaoMassa.style.display = "none";
  modalSegmentacaoMassa.setAttribute("aria-hidden", "true");
}

function salvarBancoEmMassa() {
  const texto = entradaBanco.value.trim();
  if (!texto) { showToast("Cole uma lista no campo do banco primeiro.", "aviso"); return; }
  const numeros = extrairTodosNumerosValidos(texto);
  if (!numeros.length) { showToast("Nenhum número válido encontrado.", "erro"); return; }
  const statusSelecionado = normalizarStatus(segmentacaoEmMassa?.value || "DES");
  if (!statusSelecionado) { showToast("Selecione uma segmentação válida.", "aviso"); return; }
  const info = decomporStatus(statusSelecionado);
  let adicionados = 0, mantidos = 0;
  numeros.forEach((numero) => {
    if (buscarLeadNoBancoPorNumero(numero)) { mantidos++; return; }
    bancoLeads.push({ numero, tipo: statusSelecionado, baseTipo: info.baseTipo, baseValor: info.baseValor, criadoEm: agoraISO() });
    adicionados++;
  });
  atualizarStatusAutomaticos();
  entradaBanco.value = "";
  mostrarBanco();
  atualizarCampanhas();
  fecharModalSegmentacao();
  salvar();
  showToast(`Segmentação aplicada — ${adicionados} novos inseridos`, "ok", { sub: mantidos ? `${mantidos} já existentes mantidos` : "" });
}

function obterListaBancoFiltrada() {
  const termo = normalizarTexto(buscaBanco?.value || "");
  const segmento = filtroSegmentacaoBanco?.value || "";
  const diaReed = filtroDiaReed?.value || "";
  const mesPro = filtroMesPro?.value || "";
  return bancoLeads.filter((lead) => {
    const info = decomporStatus(lead.tipo);
    const nL = limparNumero(lead.numero);
    const nF = formatarNumero(lead.numero).toUpperCase();
    const sE = formatarStatusExibicao(lead.tipo).toUpperCase();
    const matchB = !termo || nL.includes(termo.replace(/\D/g,"")) || nF.includes(termo) || sE.includes(termo) || (info.segmento||"").includes(termo);
    const matchS = !segmento || info.segmento === segmento;
    const matchD = !diaReed  || (info.segmento === "REED" && `D${info.baseValor}` === diaReed);
    const matchM = !mesPro   || (info.segmento === "PRO"  && `M${info.baseValor}` === mesPro);
    return matchB && matchS && matchD && matchM;
  });
}

function renderBanco(lista = bancoLeads) {
  if (!listaBanco) return;
  if (!lista.length) { listaBanco.innerHTML = `<p style="color:var(--texto-fraco); padding:8px 0;">Nenhum lead encontrado.</p>`; atualizarResumoBanco([]); return; }

  listaBanco.innerHTML = lista.map((lead) => {
    const cat = categoriaDoStatus(lead.tipo);
    const cls = categoriaParaClasse(cat);
    const idxOrig = bancoLeads.findIndex((i) => getPhoneKey(i.numero) === getPhoneKey(lead.numero));
    const statusExib = formatarStatusExibicao(lead.tipo);
    const info = decomporStatus(lead.tipo);

    // Badge class
    let badgeClass = "badge--neutro";
    if (cat === "UTIL_AGORA") badgeClass = info.segmento === "REED" ? "badge--reed-util" : "badge--novo";
    else if (cat === "IGNORAR_AGORA") badgeClass = info.segmento === "PRO" ? "badge--pro" : "badge--reed";
    else if (cat === "DESQUALIFICADO") badgeClass = "badge--des";

    return `
      <div class="agenda-item ${cls}">
        <div style="display:flex; justify-content:space-between; gap:12px; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span style="font-weight:600; font-size:0.9375rem;">${escaparHTML(formatarNumero(lead.numero))}</span>
            <span class="badge ${badgeClass}">${escaparHTML(statusExib)}</span>
          </div>
          <button type="button" onclick="abrirAcoesBanco(${idxOrig})" class="btn-icone" aria-label="Ações do lead" style="min-width:36px; text-align:center;">•••</button>
        </div>
      </div>
    `;
  }).join("");
  atualizarResumoBanco(lista);
}

function atualizarResumoBanco(lista = bancoLeads) {
  if (!resumoBanco) return;
  const r = { NOVO:0, REED:0, PRO:0, DES:0, LON:0, FOR:0, PAT:0 };
  lista.forEach((l) => { const i = decomporStatus(l.tipo); if (r[i.segmento] !== undefined) r[i.segmento]++; });
  resumoBanco.value = `RESUMO DO BANCO\n====================\nTotal: ${lista.length}\n\nNOVO: ${r.NOVO}\nREED: ${r.REED}\nPRO: ${r.PRO}\nDES: ${r.DES}\nLON: ${r.LON}\nFOR: ${r.FOR}\nPAT: ${r.PAT}`;
}

function mostrarBanco() { renderBanco(obterListaBancoFiltrada()); }
function filtrarBancoManual() { mostrarBanco(); }
function aplicarFiltrosBanco() { mostrarBanco(); }

function limparBancoCompleto() {
  if (!bancoLeads.length) { showToast("O banco já está vazio.", "aviso"); return; }
  showConfirm(
    "Apagar todo o banco de leads?",
    `${bancoLeads.length} leads serão removidos permanentemente.`,
    () => {
      bancoLeads = [];
      salvar(); mostrarBanco(); atualizarCampanhas();
      if (buscaBanco) buscaBanco.value = "";
      if (filtroSegmentacaoBanco) filtroSegmentacaoBanco.value = "";
      if (filtroDiaReed) filtroDiaReed.value = "";
      if (filtroMesPro) filtroMesPro.value = "";
      showToast("Banco apagado com sucesso.", "ok");
    },
    { perigo: true, labelOk: "Apagar tudo" }
  );
}

function abrirAcoesBanco(index) {
  leadSelecionadoIndex = index;
  if (modalAcoesBanco) { modalAcoesBanco.style.display = "flex"; modalAcoesBanco.setAttribute("aria-hidden","false"); }
}

function fecharModalBanco() {
  leadSelecionadoIndex = null;
  if (modalAcoesBanco) { modalAcoesBanco.style.display = "none"; modalAcoesBanco.setAttribute("aria-hidden","true"); }
}

function editarLeadSelecionado() {
  if (leadSelecionadoIndex === null || !bancoLeads[leadSelecionadoIndex]) return;
  const lead = bancoLeads[leadSelecionadoIndex];
  fecharModalBanco();

  abrirModalEditar(lead.numero, formatarStatusExibicao(lead.tipo), (novoNumero, novoStatus) => {
    const numLimpo = limparNumero(novoNumero);
    const statusNorm = normalizarStatus(novoStatus);
    if (!numLimpo) { showToast("Número inválido.", "erro"); return; }
    if (!statusNorm) { showToast("Status inválido.", "erro"); return; }
    const info = decomporStatus(statusNorm);
    lead.numero = numLimpo;
    lead.tipo = statusNorm;
    lead.baseTipo = info.baseTipo;
    lead.baseValor = info.baseValor;
    lead.criadoEm = agoraISO();
    atualizarStatusAutomaticos();
    mostrarBanco(); atualizarCampanhas(); salvar();
    showToast("Lead atualizado com sucesso.", "ok");
  });
}

function excluirLeadSelecionado() {
  if (leadSelecionadoIndex === null || !bancoLeads[leadSelecionadoIndex]) return;
  const lead = bancoLeads[leadSelecionadoIndex];
  const backupLead = { ...lead };
  const backupIdx = leadSelecionadoIndex;

  fecharModalBanco();

  showConfirm(
    "Excluir este lead?",
    `${formatarNumero(lead.numero)} — ${formatarStatusExibicao(lead.tipo)}`,
    () => {
      bancoLeads.splice(backupIdx, 1);
      salvar(); mostrarBanco(); atualizarCampanhas();
      showToast("Lead excluído.", "ok", {
        desfazerFn: () => {
          bancoLeads.splice(backupIdx, 0, backupLead);
          salvar(); mostrarBanco(); atualizarCampanhas();
          showToast("Ação desfeita.", "info");
        }
      });
    },
    { perigo: true, labelOk: "Excluir" }
  );
}

function copiarBancoEmFileira() {
  if (!bancoLeads.length) { showToast("O banco está vazio.", "aviso"); return; }
  const texto = obterListaBancoFiltrada().map((l) => limparNumero(l.numero)).join("\n");
  copiarTexto(texto, "Banco copiado em fileira.");
}

function sincronizarAgora() {
  showToast("Sincronização online ainda não configurada.", "aviso");
}

function importarTXT() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".txt,.csv";
  input.style.display = "none";
  document.body.appendChild(input);
  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const conteudo = ev.target.result || "";
      if (entradaBanco) {
        entradaBanco.value = conteudo;
        showToast(`Arquivo "${file.name}" carregado. Revise e salve no banco.`, "info", { duracao: 5000 });
      }
    };
    reader.readAsText(file, "UTF-8");
    document.body.removeChild(input);
  });
  input.click();
}

// =========================
// FILTRO ANTI-LIXO
// =========================
function filtrarLeads() {
  atualizarStatusAutomaticos(); atualizarCampanhas();
  const textoOriginal = entradaFiltro.value || "";
  const numeros = extrairTodosNumerosValidos(textoOriginal);
  const aprovados = [], bloqueados = [], usados = new Set();
  let totalDup = 0, totalIgn = 0, totalDes = 0, totalNov = 0, totalReed1 = 0;

  numeros.forEach((numero) => {
    const chave = getPhoneKey(numero);
    if (!chave) return;
    if (usados.has(chave)) { totalDup++; bloqueados.push(`${numero} - DUPLICADO`); return; }
    usados.add(chave);
    const lead = buscarLeadNoBancoPorNumero(numero);
    if (!lead) { aprovados.push(`${numero} - NOVO`); totalNov++; return; }
    const cat = categoriaDoStatus(lead.tipo);
    const se = formatarStatusExibicao(lead.tipo);
    if (cat === "UTIL_AGORA") { aprovados.push(`${numero} - ${se}`); if (se === "NOVO") totalNov++; if (se === "REED D1") totalReed1++; return; }
    if (cat === "IGNORAR_AGORA") { totalIgn++; bloqueados.push(`${numero} - ${se} - IGNORAR AGORA`); return; }
    if (cat === "DESQUALIFICADO") { totalDes++; bloqueados.push(`${numero} - ${se} - DESQUALIFICADO`); }
  });

  const lixo = Math.max(0, textoOriginal.split(/\n+/).filter((l) => l.trim()).length - numeros.length);
  // Saída operacional: ordem cronológica Lead 1, Lead 2...
  saidaFiltro.value = aprovados
    .map((linha, idx) => {
      const numero = linha.split(" - ")[0];
      return `${numero} (Lead ${idx + 1})`;
    })
    .join("\n");
  saidaBloqueados.value = bloqueados.join("\n");
  resumoFiltro.value = `RESUMO DA EXTRAÇÃO\n====================\nAprovados: ${aprovados.length}\n- Novos: ${totalNov}\n- REED D1: ${totalReed1}\n\nBloqueados: ${bloqueados.length}\n- Duplicados: ${totalDup}\n- Ignorados: ${totalIgn}\n- Desqualificados: ${totalDes}\n\nLixo ignorado: ${lixo}\nNúmeros válidos: ${numeros.length}\n\nREGRAS ATIVAS\n====================\nTRABALHAR: NOVO, REED D1\nIGNORAR: REED D2–D30, PRO M1–M12\nDESQUALIFICAR: DES, LON, FOR, PAT, REED vencido`;
}

function copiarAprovados() {
  const t = saidaFiltro.value.trim();
  if (!t) { showToast("Não há aprovados para copiar.", "aviso"); return; }
  copiarTexto(t, "Leads aprovados copiados.");
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
  const reedMap = {}, proMap = {};
  for (let i = 1; i <= 30; i++) reedMap[`D${i}`] = [];
  for (let i = 1; i <= 12; i++) proMap[`M${i}`] = [];
  bancoLeads.forEach((lead) => {
    const info = decomporStatus(lead.tipo);
    const n = limparNumero(lead.numero);
    if (info.segmento === "REED" && info.baseValor >= 1) reedMap[`D${info.baseValor}`].push(n);
    if (info.segmento === "PRO" && info.baseValor >= 1) proMap[`M${info.baseValor}`].push(n);
  });
  const viz = campanhaVisualizacao?.value || "todas";
  if (painelReed) painelReed.value = viz === "pro" ? "" : Object.keys(reedMap).map((d) => `${d} (${reedMap[d].length})\n${reedMap[d].join("\n")}`.trim()).join("\n\n");
  if (painelPro)  painelPro.value  = viz === "reed" ? "" : Object.keys(proMap).map((m) => `${m} (${proMap[m].length})\n${proMap[m].join("\n")}`.trim()).join("\n\n");
}

function copiarPainelReed() {
  const t = painelReed?.value?.trim() || "";
  if (!t) { showToast("Não há REED para copiar.", "aviso"); return; }
  copiarTexto(t, "Painel REED copiado.");
}

function copiarPainelPro() {
  const t = painelPro?.value?.trim() || "";
  if (!t) { showToast("Não há PRO para copiar.", "aviso"); return; }
  copiarTexto(t, "Painel PRO copiado.");
}

// =========================
// AGENDAMENTO
// =========================
function formatarHorario(hora = "") {
  if (!hora.includes(":")) return hora;
  const [h, m] = hora.split(":");
  return `${h}:${m}H ${Number(h) < 12 ? "DA MANHÃ" : "DA TARDE"}`;
}

function gerarSenhasParaAgendamento(data, qtd) {
  const total = agendamentos.map((i) => normalizarAgendamento(i)).filter((i) => i.data === data).reduce((acc, i) => acc + (i.pessoas?.length || 1), 0);
  const [, mes, dia] = data.split("-");
  return Array.from({length: qtd}, (_, i) => `PJ${dia}${mes}-${String(total + i + 1).padStart(2,"0")}`);
}

function validarAgendamento(dados) {
  if (!dados.unidade || !dados.data || !dados.hora) { showToast("Preencha unidade, data e horário.", "aviso"); return false; }
  if (!dados.pessoas.length) { showToast("Adicione pelo menos uma pessoa.", "aviso"); return false; }
  for (const p of dados.pessoas) {
    if (!p.nome || p.nome.length < 3) { showToast("Preencha um nome válido para cada pessoa.", "aviso"); return false; }
    if (!p.numero || p.numero.length < 10) { showToast("Preencha um número válido para cada pessoa.", "aviso"); return false; }
  }
  return true;
}

function getTMK() {
  return localStorage.getItem("quickleadTMK") || "PAULO LOBATO";
}

function setTMK(nome) {
  if (!nome || !nome.trim()) return;
  localStorage.setItem("quickleadTMK", nome.trim().toUpperCase());
}

function getGenero() {
  return localStorage.getItem("quickleadGenero") || "M"; // M = Masculino, F = Feminino
}

function setGenero(g) {
  localStorage.setItem("quickleadGenero", g);
}

function getTituloConsultor() {
  return getGenero() === "F" ? "Consultora" : "Consultor";
}

function getTituloPaciente(qtd) {
  return qtd > 1 ? "Pacientes" : "Paciente";
}

function getTituloSenha(qtd) {
  return qtd > 1 ? "Senhas" : "Senha";
}

function gerarMensagemPaciente(ag) {
  const a = normalizarAgendamento(ag);
  const nomes = juntarNomes(a.pessoas);
  const senhas = a.pessoas.map((p) => p.senha).join(" e ");
  const titulo = getTituloPaciente(a.pessoas.length);
  const tituloSenha = getTituloSenha(a.pessoas.length);
  const consultor = getTituloConsultor();
  return `*SEU AGENDAMENTO FOI CONFIRMADO!✅*\n\n*${consultor}: ${getTMK()}*\n\n*${titulo}: ${nomes.toUpperCase()}*\n\n*${tituloSenha}: ${senhas}*\n\n*UNIDADE: ${a.unidade}*\n\n*DATA: ${formatarDataBRCompleta(a.data)} às ${formatarHorario(a.hora)}!*\n\n*LEVAR UM DOCUMENTO OFICIAL COM FOTO*\n\n*Não realizam o exame:*\n* Crianças menores de 6 anos\n* Lactantes e Gestantes\n* Menores de idade devem ir acompanhados do responsável\n* Atendimento por ordem de chegada\n\n*Tenha um excelente exame!😃*\n\nProjeto Enxergar 🌐`;
}

function gerarMensagemCRM(ag) {
  // CRM = mesmo comprovante do paciente
  // Se houver observação, ela entra no topo; TMK aparece no início
  const a = normalizarAgendamento(ag);
  const nomes = juntarNomes(a.pessoas);
  const senhas = a.pessoas.map((p) => p.senha).join(" e ");
  const tituloSenha = getTituloSenha(a.pessoas.length);
  const todasObs = a.pessoas.map((p) => p.observacao).filter(Boolean);
  const obsTexto = todasObs.length ? todasObs.join(" | ") : "";

  let texto = "";
  if (obsTexto) {
    texto += `*OBS: ${obsTexto}*\n\n`;
  }
  texto += `*TMK: ${getTMK()}*\n\n`;
  texto += `*SEU AGENDAMENTO FOI CONFIRMADO!✅*\n\n`;
  texto += `*${getTituloConsultor()}: ${getTMK()}*\n\n`;
  texto += `*${getTituloPaciente(a.pessoas.length)}: ${nomes.toUpperCase()}*\n\n`;
  texto += `*${tituloSenha}: ${senhas}*\n\n`;
  texto += `*UNIDADE: ${a.unidade}*\n\n`;
  texto += `*DATA: ${formatarDataBRCompleta(a.data)} às ${formatarHorario(a.hora)}!*\n\n`;
  texto += `*LEVAR UM DOCUMENTO OFICIAL COM FOTO*\n\n`;
  texto += `*Não realizam o exame:*\n* Crianças menores de 6 anos\n* Lactantes e Gestantes\n* Menores de idade devem ir acompanhados do responsável\n* Atendimento por ordem de chegada\n\n`;
  texto += `*Tenha um excelente exame!😃*\n\nProjeto Enxergar 🌐`;
  return texto;
}

function gerarMensagem(ag, tipo = "paciente") {
  return tipo === "crm" ? gerarMensagemCRM(ag) : gerarMensagemPaciente(ag);
}

function agendar() {
  const pessoas = coletarPessoasFormulario();
  const tipo = tipoAgendamentoInput?.value || "agendamento";
  const dados = { tipo, unidade: unidadeInput.value, data: dataInput.value, hora: horaInput.value, pessoas };
  if (!validarAgendamento(dados)) return;

  showConfirm(
    "Confirmar agendamento?",
    `${dados.unidade} — ${formatarDataBRCompleta(dados.data)} às ${dados.hora}`,
    () => {
      const senhas = gerarSenhasParaAgendamento(dados.data, dados.pessoas.length);
      const novoAg = { ...dados, pessoas: dados.pessoas.map((p, i) => ({ ...p, senha: senhas[i] })), criadoEm: agoraISO() };
      agendamentos.push(novoAg);
      salvar();
      if (filtroData) filtroData.value = novoAg.data;
      filtrarAgenda();
      if (dataRelatorio) { dataRelatorio.value = novoAg.data; gerarRelatorio(); }
      atualizarContadorProducao();
      mostrarModalComprovante(novoAg, "paciente");
      limparFormularioAgendamento();
    },
    { labelOk: "Confirmar" }
  );
}

function mostrarModalComprovante(ag, tipo = "paciente") {
  const a = normalizarAgendamento(ag);
  agendamentoAtual = a;
  tipoComprovanteAtual = tipo;
  textoComprovante.value = gerarMensagem(a, tipo);
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
}

function copiarComprovante() {
  const t = textoComprovante.value.trim();
  if (!t) return;
  copiarTexto(t, "Comprovante copiado.");
}

function enviarWhats() {
  if (!agendamentoAtual) return;
  const num = limparNumero(agendamentoAtual.pessoas?.[0]?.numero || "");
  if (!num) return;
  const msg = textoComprovante.value || gerarMensagem(agendamentoAtual, tipoComprovanteAtual);
  window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, "_blank");
}

function fecharModal() {
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  agendamentoAtual = null;
}

// =========================
// AGENDA
// =========================
function copiarNumero(numero) { copiarTexto(limparNumero(numero), "Número copiado."); }

function verComprovante(index, tipo = "paciente") {
  const ag = agendamentos[index];
  if (!ag) return;
  mostrarModalComprovante(ag, tipo);
}

function reenviarWhats(index, tipo = "paciente") {
  const ag = normalizarAgendamento(agendamentos[index]);
  if (!ag) return;
  const num = limparNumero(ag.pessoas?.[0]?.numero || "");
  window.open(`https://wa.me/55${num}?text=${encodeURIComponent(gerarMensagem(ag, tipo))}`, "_blank");
}

function transformarEmReagendamento(index) {
  const ag = normalizarAgendamento(agendamentos[index]);
  if (!ag) return;
  showConfirm(
    "Marcar como reagendamento?",
    juntarNomes(ag.pessoas),
    () => {
      agendamentos[index] = { ...ag, tipo: "reagendamento" };
      salvar(); filtrarAgenda(); atualizarContadorProducao();
      if (dataRelatorio && dataRelatorio.value === ag.data) gerarRelatorio();
    }
  );
}

// ============================================================
// CONTROLE CRM
// ============================================================
function marcarCRMEnviado(indexOriginal) {
  const ag = agendamentos[indexOriginal];
  if (!ag) return;
  const jaEnviado = ag.crmEnviado;
  if (jaEnviado) {
    showConfirm(
      "Desmarcar envio ao CRM?",
      "O registro voltará para pendente.",
      () => {
        agendamentos[indexOriginal].crmEnviado = false;
        agendamentos[indexOriginal].crmEnviadoEm = null;
        salvar();
        filtrarAgenda();
        showToast("Marcado como não enviado ao CRM.", "aviso");
      }
    );
    return;
  }
  showConfirm(
    "Confirmar envio ao CRM?",
    "Isso marcará este agendamento como já subido ao CRM.",
    () => {
      agendamentos[indexOriginal].crmEnviado = true;
      agendamentos[indexOriginal].crmEnviadoEm = agoraISO();
      salvar();
      filtrarAgenda();
      showToast("Marcado como enviado ao CRM.", "ok");
    },
    { labelOk: "Confirmar envio" }
  );
}

function editarDataAgendamento(indexOriginal) {
  const ag = agendamentos[indexOriginal];
  if (!ag) return;
  abrirModalEditar(ag.data || "", "", (novaData, _) => {
    if (!novaData || !/^\d{4}-\d{2}-\d{2}$/.test(novaData)) {
      showToast("Data inválida. Use o formato AAAA-MM-DD.", "erro");
      return;
    }
    const dataAntiga = ag.data;
    agendamentos[indexOriginal].data = novaData;
    salvar();
    filtrarAgenda();
    if (dataRelatorio && dataRelatorio.value === dataAntiga) gerarRelatorio();
    showToast(`Data alterada para ${formatarDataBRCompleta(novaData)}.`, "ok");
  });
  // Ajustar o modal para data
  setTimeout(() => {
    const elNum = document.getElementById("editarNumero");
    const elSt  = document.getElementById("editarStatus");
    const elLbN = elNum?.previousElementSibling;
    const elLbS = elSt?.previousElementSibling;
    if (elNum) { elNum.type = "date"; elNum.value = ag.data || ""; elNum.placeholder = ""; }
    if (elSt)  { elSt.style.display = "none"; }
    if (elLbN) elLbN.textContent = "Nova data";
    if (elLbS) elLbS.style.display = "none";
    const small = document.querySelector("#modalEditar small");
    if (small) small.style.display = "none";
  }, 20);
}

function copiarListaAgendaDia() {
  const data = filtroData?.value;
  if (!data) { showToast("Selecione uma data.", "aviso"); return; }

  const lista = agendamentos
    .map((item, idx) => ({ ...normalizarAgendamento(item), indexOriginal: idx }))
    .filter((i) => i.data === data)
    .sort((a, b) => {
      const sa = extrairNumeroSenha(a.pessoas?.[0]?.senha || "");
      const sb = extrairNumeroSenha(b.pessoas?.[0]?.senha || "");
      return sa - sb;
    });

  if (!lista.length) { showToast("Nenhum agendamento nesta data.", "aviso"); return; }

  const tipoLabel = { agendamento: "Ag", reagendamento: "Reag", inclusao: "Inc" };
  const linhas = lista.map((item) => {
    const nomes = juntarNomes(item.pessoas);
    const senhas = item.pessoas.map((p) => p.senha).join(" / ");
    const tipo = tipoLabel[item.tipo] || item.tipo;
    return `[${item.hora}] ${nomes} — ${item.unidade} — ${getTituloSenha(item.pessoas.length)}: ${senhas} (${tipo})`;
  });

  const dc = formatarDataBRCompleta(data);
  const texto = `AGENDA DO DIA — ${dc}\n${"=".repeat(36)}\n${linhas.join("\n")}\n${"=".repeat(36)}\nTotal: ${lista.length} registro(s)`;
  copiarTexto(texto, `Lista do dia copiada (${lista.length} registros).`);
}

function excluir(index) {
  const ag = normalizarAgendamento(agendamentos[index]);
  if (!ag) return;
  const backupAg = agendamentos[index];
  showConfirm(
    "Excluir este registro?",
    juntarNomes(ag.pessoas),
    () => {
      const dataEx = ag.data;
      agendamentos.splice(index, 1);
      salvar(); filtrarAgenda(); atualizarContadorProducao();
      if (dataRelatorio && dataRelatorio.value === dataEx) gerarRelatorio();
      showToast("Registro excluído.", "ok", {
        desfazerFn: () => {
          agendamentos.splice(index, 0, backupAg);
          salvar(); filtrarAgenda(); atualizarContadorProducao();
          showToast("Ação desfeita.", "info");
        }
      });
    },
    { perigo: true, labelOk: "Excluir" }
  );
}

function filtrarAgenda() {
  const data = filtroData.value;
  if (!data) { showToast("Selecione uma data.", "aviso"); return; }

  const lista = agendamentos
    .map((item, idx) => ({ ...normalizarAgendamento(item), indexOriginal: idx }))
    .filter((i) => i.data === data)
    .sort((a, b) => {
      const sa = extrairNumeroSenha(a.pessoas?.[0]?.senha || "");
      const sb = extrairNumeroSenha(b.pessoas?.[0]?.senha || "");
      return sa - sb;
    });

  if (!lista.length) {
    listaAgenda.innerHTML = '<p style="color:var(--texto-fraco); padding:8px 0;">Nenhum registro para esta data.</p>';
    return;
  }

  listaAgenda.innerHTML = lista.map((item) => {
    const nomes = juntarNomes(item.pessoas);
    const senhas = item.pessoas.map((p) => p.senha).join(" / ");
    const tituloSenhaItem = getTituloSenha(item.pessoas.length);
    const crmEnviado = !!item.crmEnviado;
    const crmLabel = crmEnviado ? "\u2713 CRM Enviado" : "Subir CRM";
    const crmBg  = crmEnviado ? "var(--verde-bg)"   : "var(--amarelo-bg)";
    const crmClr = crmEnviado ? "var(--verde)"       : "var(--amarelo)";
    const crmBrd = crmEnviado ? "var(--verde-borda)" : "var(--amarelo-borda)";
    const crmHora = (crmEnviado && item.crmEnviadoEm)
      ? new Date(item.crmEnviadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : "";

    const pessoasHTML = item.pessoas.map((p) => {
      const nomeSafe   = escaparHTML(p.nome || "");
      const numForm    = escaparHTML(formatarNumero(p.numero));
      const numLimpo   = limparNumero(p.numero);
      const nomeLimpo  = (p.nome || "").trim().replace(/'/g, "\'");
      const senhaP     = escaparHTML(p.senha || "");
      return (
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;' +
        'border-radius:var(--r-md);background:var(--bg-input);flex-wrap:wrap;border:1px solid var(--borda);">' +
        '<div>' +
        '<span style="font-weight:600;color:var(--texto);font-size:0.9375rem;">' + nomeSafe + '</span>' +
        '<span style="color:var(--texto-suave);margin-left:8px;font-size:0.875rem;">' + numForm + '</span>' +
        (p.senha ? '<span style="color:var(--texto-fraco);font-size:0.8125rem;margin-left:8px;">Senha: ' + senhaP + '</span>' : '') +
        '</div>' +
        '<div style="display:flex;gap:5px;flex-wrap:wrap;">' +
        '<button type="button" onclick="copiarTexto(\'' + nomeLimpo + '\', \'Nome copiado.\')" ' +
        'class="btn-icone" style="font-size:0.75rem;padding:4px 9px;">Nome</button>' +
        '<button type="button" onclick="copiarTexto(\'' + numLimpo + '\', \'Número copiado.\')" ' +
        'class="btn-icone" style="font-size:0.75rem;padding:4px 9px;">N\u00famero</button>' +
        '</div></div>'
      );
    }).join("");

    const tipoLabel = { agendamento: "Agendamento", reagendamento: "Reagendamento", inclusao: "Inclus\u00e3o" };
    const tipoTexto = tipoLabel[item.tipo] || item.tipo.toUpperCase();
    const tipoColor = item.tipo === "reagendamento" ? "var(--amarelo)"
      : item.tipo === "inclusao" ? "var(--azul)" : "var(--verde)";
    const nomesSafe = escaparHTML(nomes);
    const unidSafe  = escaparHTML(item.unidade);
    const horaSafe  = escaparHTML(item.hora);
    const senhasSafe = escaparHTML(senhas);
    const dataSafe  = escaparHTML(formatarDataBRCompleta(item.data));
    const idx       = item.indexOriginal;

    return (
      '<div class="agenda-item' + (crmEnviado ? ' agenda-item--crm-ok' : '') + '">' +

      // Cabeçalho
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">' +
      '<div>' +
      '<span style="font-weight:700;font-size:0.9375rem;">' + nomesSafe + '</span>' +
      '<span style="color:var(--texto-suave);margin-left:8px;font-size:0.875rem;">' + unidSafe + ' \u00b7 ' + horaSafe + '</span>' +
      '</div>' +
      '<div style="display:flex;gap:6px;align-items:center;">' +
      '<span style="color:' + tipoColor + ';font-size:0.75rem;font-weight:700;letter-spacing:0.3px;text-transform:uppercase;">' + tipoTexto + '</span>' +
      (crmHora ? '<span style="font-size:0.6875rem;color:var(--texto-fraco);">\u{1F4C5} ' + crmHora + '</span>' : '') +
      '</div></div>' +

      // Senhas + Data
      '<div style="color:var(--texto-fraco);font-size:0.8125rem;margin-bottom:10px;">' +
      tituloSenhaItem + ': <strong style="color:var(--texto-suave);">' + senhasSafe + '</strong>' +
      ' \u00b7 Data: <strong style="color:var(--texto-suave);">' + dataSafe + '</strong>' +
      '</div>' +

      // Pessoas
      '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:12px;">' + pessoasHTML + '</div>' +

      // Ações
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
      '<button type="button" onclick="verComprovante(' + idx + ', \'paciente\')" style="font-size:0.8125rem;padding:6px 11px;">Comprovante</button>' +
      '<button type="button" onclick="verComprovante(' + idx + ', \'crm\')" style="font-size:0.8125rem;padding:6px 11px;">CRM</button>' +
      '<button type="button" onclick="marcarCRMEnviado(' + idx + ')" style="font-size:0.8125rem;padding:6px 11px;background:' + crmBg + ' !important;color:' + crmClr + ' !important;border:1px solid ' + crmBrd + ' !important;">' + crmLabel + '</button>' +
      '<button type="button" onclick="editarDataAgendamento(' + idx + ')" style="font-size:0.8125rem;padding:6px 11px;">Editar data</button>' +
      '<button type="button" onclick="transformarEmReagendamento(' + idx + ')" style="font-size:0.8125rem;padding:6px 11px;">Reagendamento</button>' +
      '<button type="button" onclick="excluir(' + idx + ')" class="btn-perigo" style="font-size:0.8125rem;padding:6px 11px;">Excluir</button>' +
      '</div>' +

      '</div>'
    );
  }).join("");
}

// =========================
// RELATÓRIO
// =========================
function extrairNumeroSenha(senha = "") {
  // PJ2204-07 → 7 (ordena pela sequência do dia)
  const match = String(senha).match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : 999;
}

function normalizarNomeUnidadeRelatorio(unidade = "") {
  const mapa = { "Augusto Montenegro":"AUGUSTO","Marabá":"MARABÁ","Ananindeua":"ANANINDEUA","Telégrafo":"TELÉGRAFO","Marambaia":"MARAMBAIA","José Bonifácio":"J.BONIFÁCIO","Cidade Nova":"CIDADE NOVA","Jurunas":"JURUNAS","Castanhal":"CASTANHAL","Capanema":"CAPANEMA" };
  return mapa[unidade] || unidade.toUpperCase();
}

function gerarRelatorio() {
  const data = dataRelatorio.value;
  if (!data) { showToast("Selecione uma data.", "aviso"); return; }
  const registros = agendamentos.map(normalizarAgendamento).filter((i) => i.data === data);
  const ordem = ["Augusto Montenegro","Marabá","Ananindeua","Telégrafo","Marambaia","José Bonifácio","Cidade Nova","Jurunas","Castanhal","Capanema"];
  const cont = {}; ordem.forEach((u) => { cont[u] = 0; });
  let totalAg = 0, totalReag = 0, totalInc = 0;
  registros.forEach((r) => {
    const n = r.pessoas?.length || 1;
    if (r.tipo === "agendamento") { totalAg += n; cont[r.unidade] = (cont[r.unidade] || 0) + n; }
    else if (r.tipo === "reagendamento") totalReag += n;
    else if (r.tipo === "inclusao") { totalInc += n; cont[r.unidade] = (cont[r.unidade] || 0) + n; }
  });
  const nomeDia = capitalizar(obterNomeDiaSemana(data));
  const dc = formatarDataBR(data);

  let t = `*DIÁRIO*\n_*${nomeDia} ${dc}*_\n`;
  ordem.forEach((u) => {
    t += `\nDIA ${dc} *(${String(cont[u]||0).padStart(2,"0")}) ${normalizarNomeUnidadeRelatorio(u)}*`;
  });

  t += `\n\n*${totalAg} AGENDAMENTOS*`;

  // Inclusão e Reagendamento só aparecem se existirem
  if (totalInc > 0)  t += `\n\n*+ ${totalInc} INCLUSÃO*`;
  if (totalReag > 0) t += `\n\n*${totalReag} REAGENDAMENTO*`;

  // Total geral = agendamentos + inclusões + reagendamentos
  const totalGeral = totalAg + totalInc + totalReag;
  t += `\n\n*${totalGeral} TOTAL*`;
  t += `\n\n*TMK: ${getTMK()}*`;

  resultadoRelatorio.textContent = t;
}

function copiarRelatorio() {
  const t = resultadoRelatorio.textContent.trim();
  if (!t) { showToast("Gere um relatório primeiro.", "aviso"); return; }
  copiarTexto(t, "Relatório copiado.");
}

// =========================
// MÓDULO CLIMA
// =========================
const UNIDADES_CLIMA = {
  "Augusto Montenegro": { lat: -1.3403, lon: -48.4300 },
  "Marabá":             { lat: -5.3686, lon: -49.1178 },
  "Ananindeua":         { lat: -1.3700, lon: -48.4010 },
  "Telégrafo":          { lat: -1.4400, lon: -48.4700 },
  "Marambaia":          { lat: -1.4300, lon: -48.4650 },
  "José Bonifácio":     { lat: -1.4580, lon: -48.4700 },
  "Cidade Nova":        { lat: -1.4050, lon: -48.4300 },
  "Jurunas":            { lat: -1.4610, lon: -48.4780 },
  "Castanhal":          { lat: -1.2972, lon: -47.9218 },
  "Capanema":           { lat: -1.1951, lon: -47.1819 }
};

const HORAS_ANALISE = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

function descricaoCodigoClima(c) {
  if (c===0) return "Céu limpo"; if (c<=3) return "Parcialmente nublado"; if (c<=48) return "Neblina";
  if (c<=55) return "Garoa"; if (c<=65) return "Chuva"; if (c<=82) return "Pancadas"; if (c<=99) return "Tempestade";
  return "Variável";
}

function emojiCodigoClima(c) {
  if (c===0) return "☀"; if (c<=3) return "⛅"; if (c<=48) return "🌫";
  if (c<=55) return "🌦"; if (c<=65) return "🌧"; return "⛈";
}

function pontuarHora(prob, precip, codigo) {
  let s = prob * 0.6 + Math.min(precip * 20, 40);
  if (codigo >= 61) s += 25; if (codigo >= 80) s += 20;
  return Math.round(s);
}

function nivelRisco(score) { return score >= 60 ? "ALTO" : score >= 30 ? "MÉDIO" : "BAIXO"; }

function corRiscoCSS(nivel) {
  return nivel === "ALTO" ? "var(--vermelho)" : nivel === "MÉDIO" ? "var(--amarelo)" : "var(--verde)";
}

function corBarraClima(nivel) {
  return nivel === "ALTO" ? "#ef4444" : nivel === "MÉDIO" ? "#f59e0b" : "#22c55e";
}

function encontrarJanelasOtimas(horas) {
  const baixas = horas.filter((h) => h.nivel === "BAIXO");
  const fonte = baixas.length ? baixas : horas.filter((h) => h.nivel === "MÉDIO");
  if (!fonte.length) return [];
  return construirJanelas(fonte, horas);
}

function construirJanelas(filtradas, todas, min = 1) {
  const janelas = [];
  let janela = [filtradas[0]];
  for (let i = 1; i < filtradas.length; i++) {
    if (filtradas[i].hora === filtradas[i-1].hora + 1) janela.push(filtradas[i]);
    else { if (janela.length >= min) janelas.push([...janela]); janela = [filtradas[i]]; }
  }
  if (janela.length >= min) janelas.push(janela);
  if (!janelas.length && min > 1) return construirJanelas(filtradas, todas, 1);
  return janelas.map((j) => ({ inicio: j[0].hora, fim: j[j.length-1].hora, scoreMedia: Math.round(j.reduce((s,h)=>s+h.score,0)/j.length), nivel: j[0].nivel })).sort((a,b)=>a.scoreMedia-b.scoreMedia).slice(0,3);
}

function formatarJanela(inicio, fim) {
  const h1 = String(inicio).padStart(2,"0");
  return inicio === fim ? `${h1}:00 às ${h1}:30` : `${h1}:00 às ${String(fim+1).padStart(2,"0")}:00`;
}

async function buscarClimaUnidade() {
  const selectU = document.getElementById("climaUnidade");
  const inputD  = document.getElementById("climaData");
  const res     = document.getElementById("climaResultado");
  if (!selectU || !res) return;
  const nome = selectU.value;
  if (!nome) { showToast("Selecione uma unidade.", "aviso"); return; }
  const coords = UNIDADES_CLIMA[nome];
  if (!coords) { res.innerHTML = "<p>Unidade sem coordenadas.</p>"; return; }
  const data = inputD?.value || obterDataHojeISO();
  res.innerHTML = `<p style="color:var(--texto-suave); padding:8px 0;">Buscando previsão para ${escaparHTML(nome)}...</p>`;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=temperature_2m,precipitation_probability,precipitation,weathercode&timezone=America%2FBelem&start_date=${data}&end_date=${data}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Falha");
    renderClimaResultado(await resp.json(), nome, data);
  } catch {
    res.innerHTML = `<p style="color:var(--vermelho); padding:8px 0;">Não foi possível buscar a previsão. Verifique sua conexão.</p>`;
  }
}

function renderClimaResultado(dados, unidade, dataISO) {
  const resultado = document.getElementById("climaResultado");
  if (!resultado || !dados.hourly) return;
  const h = dados.hourly;

  const horasAnalisadas = HORAS_ANALISE.map((hora) => {
    const pp = h.precipitation_probability[hora] || 0;
    const pr = h.precipitation[hora] || 0;
    const te = h.temperature_2m[hora] || 0;
    const co = h.weathercode[hora] || 0;
    const sc = pontuarHora(pp, pr, co);
    return { hora, precipProb: pp, precip: pr, temp: Math.round(te), codigo: co, score: sc, nivel: nivelRisco(sc) };
  });

  const resumoPeriodo = (lista) => {
    const sm = Math.max(...lista.map((h) => h.score));
    return { scoreMax: sm, probMax: Math.max(...lista.map((h) => h.precipProb)), tempMedia: Math.round(lista.reduce((s,h)=>s+h.temp,0)/lista.length), nivel: nivelRisco(sm) };
  };

  const manha = resumoPeriodo(horasAnalisadas.filter((h) => h.hora <= 11));
  const tarde  = resumoPeriodo(horasAnalisadas.filter((h) => h.hora >= 12));
  const janelas = encontrarJanelasOtimas(horasAnalisadas);
  const melhorHora = [...horasAnalisadas].sort((a,b)=>a.score-b.score)[0];
  const dataBR = formatarDataBRCompleta(dataISO);

  const timelineHTML = horasAnalisadas.map((item) => {
    const cor = corBarraClima(item.nivel);
    const altura = Math.max(8, Math.round((item.score / 100) * 68) + 8);
    return `
      <div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;min-width:0;" title="${String(item.hora).padStart(2,'0')}h — ${item.precipProb}% chuva · ${item.temp}°C">
        <span style="font-size:9px;color:var(--texto-fraco);">${item.precipProb}%</span>
        <div style="width:100%;height:${altura}px;background:${cor};border-radius:3px 3px 0 0;opacity:0.85;"></div>
        <span style="font-size:9px;color:var(--texto-fraco);">${String(item.hora).padStart(2,"0")}h</span>
        <span style="font-size:11px;">${emojiCodigoClima(item.codigo)}</span>
      </div>`;
  }).join("");

  const tabelaHTML = horasAnalisadas.map((item) => {
    const cor = corRiscoCSS(item.nivel);
    const bg = item.nivel === "BAIXO" ? "var(--verde-bg)" : item.nivel === "MÉDIO" ? "var(--amarelo-bg)" : "var(--vermelho-bg)";
    return `
      <tr style="background:${bg};border-bottom:1px solid var(--borda);">
        <td style="padding:6px 10px;font-weight:700;white-space:nowrap;">${String(item.hora).padStart(2,"0")}:00</td>
        <td style="padding:6px 8px;font-size:1rem;">${emojiCodigoClima(item.codigo)}</td>
        <td style="padding:6px 10px;color:var(--texto-suave);font-size:0.8125rem;">${escaparHTML(descricaoCodigoClima(item.codigo))}</td>
        <td style="padding:6px 10px;text-align:center;font-size:0.875rem;">${item.precipProb}%</td>
        <td style="padding:6px 10px;text-align:center;font-size:0.8125rem;color:var(--texto-suave);">${item.precip.toFixed(1)}mm</td>
        <td style="padding:6px 10px;text-align:center;font-size:0.8125rem;color:var(--texto-suave);">${item.temp}°C</td>
        <td style="padding:6px 10px;text-align:center;">
          <span style="color:${cor};font-weight:700;font-size:0.75rem;background:${bg};border:1px solid ${cor};border-radius:var(--r-pill);padding:2px 8px;">${item.nivel}</span>
        </td>
      </tr>`;
  }).join("");

  const classeBox = (n) => n === "ALTO" ? "status-box--erro" : n === "MÉDIO" ? "status-box--alerta" : "status-box--ok";

  const janelasBlocos = janelas.length ? janelas.map((j, idx) => {
    const destaque = idx === 0;
    const cor = corRiscoCSS(j.nivel);
    const bg  = destaque ? "var(--azul-bg)" : "var(--bg-input)";
    const brd = destaque ? "var(--azul-borda)" : "var(--borda-media)";
    const labels = ["Melhor janela", "2ª opção", "3ª opção"];
    return `<div style="border:1px solid ${brd};border-radius:var(--r-lg);padding:12px 14px;background:${bg};display:flex;flex-direction:column;gap:4px;">
      <span style="font-size:0.6875rem;color:var(--texto-fraco);text-transform:uppercase;letter-spacing:0.5px;">${labels[idx]}</span>
      <span style="font-size:1rem;font-weight:700;color:${destaque ? "var(--azul)" : "var(--texto)"};">${formatarJanela(j.inicio, j.fim)}</span>
      <span style="font-size:0.8125rem;color:${cor};">Risco ${j.nivel}</span>
    </div>`;
  }).join("") : `<div class="status-box status-box--erro"><strong>Dia de alto risco</strong><span>Nenhum período com risco baixo encontrado. Melhor disponível: ${String(melhorHora.hora).padStart(2,"0")}:00</span></div>`;

  resultado.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;padding-top:8px;">
      <p style="font-size:0.875rem;color:var(--texto-suave);margin:0;">
        <strong style="color:var(--texto);">${escaparHTML(unidade)}</strong> — ${escaparHTML(dataBR)}
      </p>

      <div>
        <p style="font-size:0.6875rem;color:var(--texto-fraco);margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">Probabilidade de chuva por hora</p>
        <div style="display:flex;align-items:flex-end;gap:3px;padding:12px 10px 0;background:var(--bg-input);border:1px solid var(--borda-media);border-radius:var(--r-lg);overflow:hidden;">${timelineHTML}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="status-box ${classeBox(manha.nivel)}">
          <strong>Manhã (7h–11h)</strong>
          <span>Pico: ${manha.probMax}% · Temp. ~${manha.tempMedia}°C</span>
          <span style="color:${corRiscoCSS(manha.nivel)};font-weight:700;">Risco ${manha.nivel}</span>
        </div>
        <div class="status-box ${classeBox(tarde.nivel)}">
          <strong>Tarde (12h–18h)</strong>
          <span>Pico: ${tarde.probMax}% · Temp. ~${tarde.tempMedia}°C</span>
          <span style="color:${corRiscoCSS(tarde.nivel)};font-weight:700;">Risco ${tarde.nivel}</span>
        </div>
      </div>

      <div>
        <p style="font-size:0.6875rem;color:var(--texto-fraco);margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">Janelas ideais para agendamentos</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">${janelasBlocos}</div>
      </div>

      <div>
        <p style="font-size:0.6875rem;color:var(--texto-fraco);margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">Análise hora a hora</p>
        <div style="overflow-x:auto;border-radius:var(--r-lg);border:1px solid var(--borda-media);">
          <table style="width:100%;border-collapse:collapse;font-size:0.875rem;">
            <thead>
              <tr style="background:var(--bg-input);border-bottom:1px solid var(--borda-media);">
                <th style="padding:7px 10px;text-align:left;font-size:0.6875rem;color:var(--texto-fraco);font-weight:600;">Hora</th>
                <th style="padding:7px 8px;"></th>
                <th style="padding:7px 10px;text-align:left;font-size:0.6875rem;color:var(--texto-fraco);font-weight:600;">Condição</th>
                <th style="padding:7px 10px;text-align:center;font-size:0.6875rem;color:var(--texto-fraco);font-weight:600;">Chuva</th>
                <th style="padding:7px 10px;text-align:center;font-size:0.6875rem;color:var(--texto-fraco);font-weight:600;">Precip.</th>
                <th style="padding:7px 10px;text-align:center;font-size:0.6875rem;color:var(--texto-fraco);font-weight:600;">Temp.</th>
                <th style="padding:7px 10px;text-align:center;font-size:0.6875rem;color:var(--texto-fraco);font-weight:600;">Risco</th>
              </tr>
            </thead>
            <tbody>${tabelaHTML}</tbody>
          </table>
        </div>
      </div>

      <p style="font-size:0.75rem;color:var(--texto-fraco);">Fonte: Open-Meteo · Apenas orientação — nunca bloqueia agendamentos.</p>
    </div>
  `;
}

// =========================
// INICIALIZAÇÃO
// =========================
function inicializarFormulario() {
  preencherHorarios();
  limparFormularioAgendamento();
  if (tipoAgendamentoInput) tipoAgendamentoInput.addEventListener("change", atualizarDataPadraoPorTipo);
}

// Fechar modais com ESC
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  fecharModal();
  fecharModalBanco();
  fecharModalSegmentacao();
  fecharModalEditar();
  _confirmarCancelar();
});

setTheme(temaSalvo);
normalizarAgendamentosExistentes();
salvar();
inicializarFormulario();
atualizarStatusAutomaticos();
mostrarBanco();
atualizarCampanhas();
atualizarStatusSync("Modo local ativo");
atualizarContadorProducao();

// Inicializa tab ativo no nav
trocarAba("agendamento");

// Carregar TMK salvo no campo do header
const tmkInput = document.getElementById("tmkNome");
if (tmkInput) {
  tmkInput.value = localStorage.getItem("quickleadTMK") || "";
  tmkInput.addEventListener("change", () => setTMK(tmkInput.value));
  tmkInput.addEventListener("blur", () => {
    if (tmkInput.value.trim()) {
      setTMK(tmkInput.value);
      showToast("Nome do TMK salvo.", "ok");
    }
  });
}

const generoSelect = document.getElementById("tmkGenero");
if (generoSelect) {
  generoSelect.value = getGenero();
  generoSelect.addEventListener("change", () => {
    setGenero(generoSelect.value);
    showToast(`Gênero salvo: ${generoSelect.value === "F" ? "Consultora" : "Consultor"}.`, "ok");
  });
}

// Datas padrão
const hoje = obterDataHojeISO();
if (filtroData) filtroData.value = hoje;
if (dataRelatorio) dataRelatorio.value = hoje;
const climaDataInput = document.getElementById("climaData");
if (climaDataInput) climaDataInput.value = hoje;
