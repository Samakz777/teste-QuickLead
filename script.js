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
      .then(() => alert(mensagem))
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
  alert(mensagem);
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

function preencherHorarios() {
  if (!horaInput) return;

  const horarios = [];
  for (let hora = 7; hora <= 19; hora++) {
    for (let minuto = 0; minuto < 60; minuto += 10) {
      const h = String(hora).padStart(2, "0");
      const m = String(minuto).padStart(2, "0");
      horarios.push(`${h}:${m}`);
    }
  }

  horaInput.innerHTML =
    `<option value="">Selecionar horário</option>` +
    horarios.map((h) => `<option value="${h}">${h}</option>`).join("");
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
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px;">
        <strong>Pessoa ${index + 1}</strong>
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
    alert("É necessário manter pelo menos uma pessoa no agendamento.");
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
    nome: (bloco.querySelector(".pessoa-nome")?.value || "").trim(),
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

// =========================
// STATUS / SEGMENTAÇÃO
// =========================
function normalizarStatus(texto = "") {
  const bruto = normalizarTexto(texto).replace(/[\s._-]+/g, "");

  if (!bruto) return null;

  if (["NOVO", "NEW", "LEADNOVO", "LEAD"].includes(bruto)) return "NOVO";
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
  const s = normalizarStatus(status) || "NOVO";

  if (s === "NOVO" || s === "DES" || s === "LON" || s === "FOR" || s === "PAT") {
    return {
      status: s,
      segmento: s,
      baseTipo: s,
      baseValor: null
    };
  }

  const reed = s.match(/^REEDD(\d{1,2})$/);
  if (reed) {
    return {
      status: `REED D${Number(reed[1])}`,
      segmento: "REED",
      baseTipo: "REED",
      baseValor: Number(reed[1])
    };
  }

  const pro = s.match(/^PROM(\d{1,2})$/);
  if (pro) {
    return {
      status: `PRO M${Number(pro[1])}`,
      segmento: "PRO",
      baseTipo: "PRO",
      baseValor: Number(pro[1])
    };
  }

  return {
    status: "NOVO",
    segmento: "NOVO",
    baseTipo: "NOVO",
    baseValor: null
  };
}

function formatarStatusExibicao(status = "") {
  return decomporStatus(status).status;
}

function categoriaDoStatus(status = "") {
  const info = decomporStatus(status);

  if (info.segmento === "REED") {
    if (info.baseValor === 1) return "UTIL_AGORA";
    return "IGNORAR_AGORA";
  }

  if (info.segmento === "PRO") {
    return "IGNORAR_AGORA";
  }

  if (info.segmento === "NOVO") return "UTIL_AGORA";
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
// ATUALIZAÇÃO AUTOMÁTICA DE CAMPANHAS
// =========================
function atualizarStatusDinamicoLead(lead) {
  if (!lead || !lead.baseTipo) return lead;

  if (lead.baseTipo === "REED") {
    const diasPassados = diferencaEmDias(lead.criadoEm || agoraISO());

    if (diasPassados >= lead.baseValor) {
      lead.tipo = "DES";
      lead.baseTipo = "DES";
      lead.baseValor = null;
      lead.atualizadoAutomaticamente = true;
      return lead;
    }

    const restante = Math.max(1, lead.baseValor - diasPassados);
    lead.tipo = `REEDD${restante}`;
    return lead;
  }

  if (lead.baseTipo === "PRO") {
    const mesesPassados = diferencaEmMeses(lead.criadoEm || agoraISO());
    const restante = lead.baseValor - mesesPassados;

    if (restante <= 0) {
      lead.tipo = "NOVO";
      lead.baseTipo = "NOVO";
      lead.baseValor = null;
      lead.atualizadoAutomaticamente = true;
      return lead;
    }

    lead.tipo = `PROM${restante}`;
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

    if (!dado.tipo) {
      ignorados++;
      return;
    }

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
  entradaBanco.value = "";
  mostrarBanco();
  atualizarCampanhas();
  salvar();

  alert(
    `✅ Banco atualizado!\n\nAdicionados: ${adicionados}\nAtualizados: ${atualizados}\nIgnorados: ${ignorados}`
  );
}

function abrirSegmentacaoEmMassa() {
  if (!entradaBanco.value.trim()) {
    alert("Cole uma lista no banco antes de aplicar segmentação em massa.");
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
    alert("Cole uma lista no campo do banco primeiro.");
    return;
  }

  const numeros = extrairTodosNumerosValidos(texto);
  if (!numeros.length) {
    alert("Nenhum número válido foi encontrado.");
    return;
  }

  const statusSelecionado = normalizarStatus(segmentacaoEmMassa?.value || "DES");

  if (!statusSelecionado) {
    alert("Selecione uma segmentação válida.");
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

  alert(
    `✅ Segmentação em massa aplicada!\n\nNovos inseridos: ${adicionados}\nMantidos sem sobrescrever: ${mantidos}`
  );
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

function renderBanco(lista = bancoLeads) {
  if (!listaBanco) return;

  if (!lista.length) {
    listaBanco.innerHTML = "<p>Nenhum lead encontrado no banco.</p>";
    atualizarResumoBanco([]);
    return;
  }

  listaBanco.innerHTML = lista.map((lead) => {
    const categoria = categoriaDoStatus(lead.tipo);
    const classe = categoriaParaClasse(categoria);
    const indexOriginal = bancoLeads.findIndex(
      (item) => getPhoneKey(item.numero) === getPhoneKey(lead.numero)
    );

    return `
      <div class="agenda-item ${classe}">
        <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
          <div>
            <p><strong>${escaparHTML(formatarNumero(lead.numero))}</strong></p>
            <p>Status: <strong>${escaparHTML(formatarStatusExibicao(lead.tipo))}</strong></p>
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

  atualizarResumoBanco(lista);
}

function atualizarResumoBanco(lista = bancoLeads) {
  if (!resumoBanco) return;

  const resumo = {
    NOVO: 0,
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

NOVO: ${resumo.NOVO}
REED: ${resumo.REED}
PRO: ${resumo.PRO}
DES: ${resumo.DES}
LON: ${resumo.LON}
FOR: ${resumo.FOR}
PAT: ${resumo.PAT}`;
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

function limparBancoCompleto() {
  if (!bancoLeads.length) {
    alert("O banco já está vazio.");
    return;
  }

  if (!confirm("Tem certeza que deseja apagar todo o banco de leads?")) return;

  bancoLeads = [];
  salvar();
  mostrarBanco();
  atualizarCampanhas();

  if (buscaBanco) buscaBanco.value = "";
  if (filtroSegmentacaoBanco) filtroSegmentacaoBanco.value = "";
  if (filtroDiaReed) filtroDiaReed.value = "";
  if (filtroMesPro) filtroMesPro.value = "";

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
    "Editar status:\n\nExemplos:\nNOVO\nREED D1\nREED D15\nPRO M3\nDES\nLON\nFOR\nPAT",
    formatarStatusExibicao(lead.tipo)
  );
  if (novoStatus === null) return;

  const numeroLimpo = limparNumero(novoNumero);
  const statusNormalizado = normalizarStatus(novoStatus);

  if (!statusNormalizado) {
    alert("Status inválido.");
    return;
  }

  const info = decomporStatus(statusNormalizado);

  if (!numeroLimpo) {
    alert("Número inválido.");
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

  alert("✅ Lead atualizado com sucesso.");
}

function excluirLeadSelecionado() {
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

  alert("✅ Lead excluído com sucesso.");
}

function copiarBancoEmFileira() {
  if (!bancoLeads.length) {
    alert("O banco está vazio.");
    return;
  }

  const texto = obterListaBancoFiltrada()
    .map((lead) => limparNumero(lead.numero))
    .join("\n");

  copiarTexto(texto, "✅ Banco copiado em fileira.");
}

function sincronizarAgora() {
  atualizarStatusSync("Sincronização online ainda não configurada");
  alert("A estrutura já está pronta, mas a sincronização em tempo real depende de um banco online.");
}

// =========================
// FILTRO ANTI-LIXO WHATSAPP
// =========================
function filtrarLeads() {
  atualizarStatusAutomaticos();
  atualizarCampanhas();

  const textoOriginal = entradaFiltro.value || "";
  const numerosExtraidos = extrairTodosNumerosValidos(textoOriginal);

  const aprovados = [];
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
      aprovados.push(`${numero} - NOVO`);
      totalNovos++;
      return;
    }

    const categoria = categoriaDoStatus(leadBanco.tipo);
    const statusExibido = formatarStatusExibicao(leadBanco.tipo);

    if (categoria === "UTIL_AGORA") {
      aprovados.push(`${numero} - ${statusExibido}`);
      if (statusExibido === "NOVO") totalNovos++;
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

  const totalLixoIgnorado = Math.max(
    0,
    textoOriginal.split(/\n+/).filter((l) => l.trim()).length - numerosExtraidos.length
  );

  saidaFiltro.value = aprovados.join("\n");
  saidaBloqueados.value = bloqueados.join("\n");

  resumoFiltro.value =
`RESUMO DA EXTRAÇÃO
====================
Aprovados: ${aprovados.length}
- Novos: ${totalNovos}
- REED D1: ${totalReed1}

Bloqueados: ${bloqueados.length}
- Duplicados: ${totalDuplicados}
- Ignorados no momento: ${totalIgnorados}
- Desqualificados: ${totalDesqualificados}

Lixo de WhatsApp ignorado: ${totalLixoIgnorado}
Números válidos encontrados: ${numerosExtraidos.length}

REGRAS ATIVAS
====================
TRABALHAR AGORA:
- NOVO
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
// CAMPANHAS
// =========================
function atualizarCampanhas() {
  atualizarStatusAutomaticos();

  const reedMap = {};
  const proMap = {};

  for (let i = 1; i <= 30; i++) {
    reedMap[`D${i}`] = [];
  }

  for (let i = 1; i <= 12; i++) {
    proMap[`M${i}`] = [];
  }

  bancoLeads.forEach((lead) => {
    const info = decomporStatus(lead.tipo);
    const numero = limparNumero(lead.numero);

    if (info.segmento === "REED" && info.baseValor >= 1 && info.baseValor <= 30) {
      reedMap[`D${info.baseValor}`].push(numero);
    }

    if (info.segmento === "PRO" && info.baseValor >= 1 && info.baseValor <= 12) {
      proMap[`M${info.baseValor}`].push(numero);
    }
  });

  const visualizacao = campanhaVisualizacao?.value || "todas";

  if (painelReed) {
    const textoReed = Object.keys(reedMap)
      .map((dia) => `${dia} (${reedMap[dia].length})\n${reedMap[dia].join("\n")}`.trim())
      .join("\n\n");

    painelReed.value = visualizacao === "pro" ? "" : textoReed;
  }

  if (painelPro) {
    const textoPro = Object.keys(proMap)
      .map((mes) => `${mes} (${proMap[mes].length})\n${proMap[mes].join("\n")}`.trim())
      .join("\n\n");

    painelPro.value = visualizacao === "reed" ? "" : textoPro;
  }
}

function copiarPainelReed() {
  const texto = painelReed?.value?.trim() || "";
  if (!texto) {
    alert("Não há REED para copiar.");
    return;
  }
  copiarTexto(texto, "✅ Painel REED copiado.");
}

function copiarPainelPro() {
  const texto = painelPro?.value?.trim() || "";
  if (!texto) {
    alert("Não há PRO para copiar.");
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

function gerarSenhasParaAgendamento(data, quantidadePessoas) {
  const totalBase = agendamentos
    .map((item) => normalizarAgendamento(item))
    .filter((item) => item.data === data)
    .reduce((acc, item) => acc + (item.pessoas?.length || 1), 0);

  const [, mes, dia] = data.split("-");
  const prefixo = `PJ${dia}${mes}`;

  return Array.from({ length: quantidadePessoas }, (_, index) => {
    return `${prefixo}-${String(totalBase + index + 1).padStart(2, "0")}`;
  });
}

function validarAgendamento(dados) {
  if (!dados.unidade || !dados.data || !dados.hora) {
    alert("Preencha unidade, data e horário.");
    return false;
  }

  if (!dados.pessoas.length) {
    alert("Adicione pelo menos uma pessoa.");
    return false;
  }

  for (const pessoa of dados.pessoas) {
    if (!pessoa.nome || pessoa.nome.length < 3) {
      alert("Preencha um nome válido para cada pessoa.");
      return false;
    }

    if (!pessoa.numero || pessoa.numero.length < 10) {
      alert("Preencha um número válido para cada pessoa.");
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
  const senhas = ag.pessoas.map((p) => p.senha).join(" e ");

  return `*SEU AGENDAMENTO FOI CONFIRMADO!✅*

*Consultor: PAULO LOBATO*

*Pacientes: ${nomes.toUpperCase()}*

*Senhas: ${senhas}*

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
  const dataFormatada = formatarDataBRCompleta(ag.data);
  const horaFormatada = formatarHorario(ag.hora);

  let texto = `CRM / CONTROLE INTERNO

Tipo: ${ag.tipo.toUpperCase()}
Unidade: ${ag.unidade}
Data: ${dataFormatada}
Hora: ${horaFormatada}

Pessoas:
`;

  ag.pessoas.forEach((pessoa, index) => {
    texto += `
${index + 1}. ${pessoa.nome}
Número: ${formatarNumero(pessoa.numero)}
Senha: ${pessoa.senha}
Obs: ${pessoa.observacao || "Sem observação"}
`;
  });

  texto += `
TMK: PAULO LOBATO`;

  return texto.trim();
}

function gerarMensagem(agendamento, tipo = "paciente") {
  if (tipo === "crm") {
    return gerarMensagemCRM(agendamento);
  }
  return gerarMensagemPaciente(agendamento);
}

function agendar() {
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
  if (!confirm("Confirmar agendamento?")) return;

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

function transformarEmReagendamento(index) {
  const agendamento = normalizarAgendamento(agendamentos[index]);
  if (!agendamento) return;

  if (!confirm(`Marcar este registro como reagendamento?\n\n${juntarNomes(agendamento.pessoas)}`)) {
    return;
  }

  agendamentos[index] = {
    ...agendamento,
    tipo: "reagendamento"
  };

  salvar();
  filtrarAgenda();

  if (dataRelatorio && dataRelatorio.value === agendamento.data) {
    gerarRelatorio();
  }
}

function excluir(index) {
  const agendamento = normalizarAgendamento(agendamentos[index]);
  if (!agendamento) return;

  if (!confirm(`Excluir o registro de ${juntarNomes(agendamento.pessoas)}?`)) return;

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
    alert("Selecione uma data.");
    return;
  }

  const listaDoDia = agendamentos
    .map((item, index) => ({ ...normalizarAgendamento(item), indexOriginal: index }))
    .filter((item) => item.data === dataSelecionada)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  if (!listaDoDia.length) {
    listaAgenda.innerHTML = "<p>Nenhum registro para esta data.</p>";
    return;
  }

  listaAgenda.innerHTML = listaDoDia.map((item) => {
    const nomes = juntarNomes(item.pessoas);
    const senhas = item.pessoas.map((p) => p.senha).join(" / ");

    // Bloco por pessoa com cópia individual de nome e número
    const pessoasHTML = item.pessoas.map((p) => {
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
            <span style="font-weight:700; color:var(--texto);">${nomeSafe}</span>
            <span style="color:var(--texto-suave); margin-left:8px;">${numeroFormatado}</span>
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
      <div class="agenda-item">
        <p>
          <strong>${escaparHTML(nomes)}</strong>
          — ${escaparHTML(item.unidade)}
          — ${escaparHTML(item.hora)}
        </p>
        <p style="margin-bottom:10px;">
          Tipo: <strong>${escaparHTML(item.tipo.toUpperCase())}</strong>
          &nbsp;|&nbsp; Senhas: <strong>${escaparHTML(senhas)}</strong>
        </p>

        <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;">
          ${pessoasHTML}
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" onclick="verComprovante(${item.indexOriginal}, 'paciente')">Comprovante Paciente</button>
          <button type="button" onclick="verComprovante(${item.indexOriginal}, 'crm')">Comprovante CRM</button>
          <button type="button" onclick="reenviarWhats(${item.indexOriginal}, 'paciente')">Reenviar WhatsApp</button>
          <button type="button" onclick="transformarEmReagendamento(${item.indexOriginal})">Marcar Reagendamento</button>
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
  const mapa = {
    "Augusto Montenegro": "AUGUSTO",
    "Marabá": "MARABÁ",
    "Ananindeua": "ANANINDEUA",
    "Telégrafo": "TELÉGRAFO",
    "Marambaia": "MARAMBAIA",
    "José Bonifácio": "J.BONIFÁCIO",
    "Cidade Nova": "CIDADE NOVA",
    "Jurunas": "JURUNAS",
    "Castanhal": "CASTANHAL",
    "Capanema": "CAPANEMA"
  };

  return mapa[unidade] || unidade.toUpperCase();
}

function gerarRelatorio() {
  const dataSelecionada = dataRelatorio.value;

  if (!dataSelecionada) {
    alert("Selecione uma data.");
    return;
  }

  const registros = agendamentos.map(normalizarAgendamento).filter((item) => item.data === dataSelecionada);

  const unidadesOrdem = [
    "Augusto Montenegro",
    "Marabá",
    "Ananindeua",
    "Telégrafo",
    "Marambaia",
    "José Bonifácio",
    "Cidade Nova",
    "Jurunas",
    "Castanhal",
    "Capanema"
  ];

  const contagemPorUnidade = {};
  unidadesOrdem.forEach((u) => { contagemPorUnidade[u] = 0; });

  let totalAgendamentos = 0;
  let totalReagendamentos = 0;
  let totalInclusoes = 0;

  registros.forEach((registro) => {
    const quantidadePessoas = registro.pessoas?.length || 1;

    if (registro.tipo === "agendamento") {
      totalAgendamentos += quantidadePessoas;
      contagemPorUnidade[registro.unidade] =
        (contagemPorUnidade[registro.unidade] || 0) + quantidadePessoas;
    } else if (registro.tipo === "reagendamento") {
      totalReagendamentos += quantidadePessoas;
    } else if (registro.tipo === "inclusao") {
      totalInclusoes += quantidadePessoas;
      contagemPorUnidade[registro.unidade] =
        (contagemPorUnidade[registro.unidade] || 0) + quantidadePessoas;
    }
  });

  const nomeDia = capitalizar(obterNomeDiaSemana(dataSelecionada));
  const dataCurta = formatarDataBR(dataSelecionada);

  let texto = `*DIÁRIO*\n_*${nomeDia} ${dataCurta}*_\n`;

  unidadesOrdem.forEach((unidade) => {
    const nomeRelatorio = normalizarNomeUnidadeRelatorio(unidade);
    const total = contagemPorUnidade[unidade] || 0;
    texto += `\nDIA ${dataCurta} *(${String(total).padStart(2, "0")}) ${nomeRelatorio}*`;
  });

  texto += `\n*${totalAgendamentos} AGENDAMENTOS*`;
  texto += `\n*${totalReagendamentos} REAGENDAMENTO*`;
  texto += `\n*+ ${totalInclusoes} INCLUSÃO*`;
  texto += `\n\n*TOTAL = ${totalAgendamentos}*`;
  texto += `\n*TMK: PAULO LOBATO*`;

  resultadoRelatorio.textContent = texto;
}

function copiarRelatorio() {
  const texto = resultadoRelatorio.textContent.trim();
  if (!texto) {
    alert("Gere um relatório primeiro.");
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
  "Ananindeua":         { lat: -1.3700, lon: -48.4010 },
  "Telégrafo":          { lat: -1.4400, lon: -48.4700 },
  "Marambaia":          { lat: -1.4300, lon: -48.4650 },
  "José Bonifácio":     { lat: -1.4580, lon: -48.4700 },
  "Cidade Nova":        { lat: -1.4050, lon: -48.4300 },
  "Jurunas":            { lat: -1.4610, lon: -48.4780 },
  "Castanhal":          { lat: -1.2972, lon: -47.9218 },
  "Capanema":           { lat: -1.1951, lon: -47.1819 }
};

// Horas operacionais analisadas (índices = hora do dia)
const HORAS_ANALISE = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

function descricaoCodigoClima(codigo) {
  if (codigo === 0) return "Céu limpo";
  if (codigo <= 3) return "Parcialmente nublado";
  if (codigo <= 48) return "Neblina";
  if (codigo <= 55) return "Garoa";
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
  if (!unidadeNome) { alert("Selecione uma unidade."); return; }

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
      `?latitude=${coords.lat}`,
      `&longitude=${coords.lon}`,
      "&hourly=temperature_2m,precipitation_probability,precipitation,weathercode",
      "&timezone=America%2FBelem",
      `&start_date=${dataAlvo}`,
      `&end_date=${dataAlvo}`
    ].join("");

    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Falha na API");
    const dados = await resp.json();
    renderClimaResultado(dados, unidadeNome, dataAlvo);
  } catch {
    resultado.innerHTML = `<p style="color:var(--vermelho)">Não foi possível buscar a previsão. Verifique sua conexão.</p>`;
  }
}

function renderClimaResultado(dados, unidade, dataISO) {
  const resultado = document.getElementById("climaResultado");
  if (!resultado || !dados.hourly) return;

  const h = dados.hourly;

  // Monta array de horas analisadas com score e nível
  const horasAnalisadas = HORAS_ANALISE.map((hora) => {
    const i = hora; // índice = hora do dia para consulta de 1 dia
    const precipProb = h.precipitation_probability[i] || 0;
    const precip     = h.precipitation[i] || 0;
    const temp       = h.temperature_2m[i] || 0;
    const codigo     = h.weathercode[i] || 0;
    const score      = pontuarHora(precipProb, precip, codigo);
    const nivel      = nivelRisco(score);

    return { hora, precipProb, precip, temp: Math.round(temp), codigo, score, nivel };
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
}

setTheme(temaSalvo);
normalizarAgendamentosExistentes();
salvar();
inicializarFormulario();
atualizarStatusAutomaticos();
mostrarBanco();
atualizarCampanhas();
atualizarStatusSync("Modo local ativo");

// Define data padrão de hoje no campo clima
const climaDataInput = document.getElementById("climaData");
if (climaDataInput) climaDataInput.value = obterDataHojeISO();
