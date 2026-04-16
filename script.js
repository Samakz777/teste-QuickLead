let bancoLeads = JSON.parse(localStorage.getItem("bancoLeads")) || [];
let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
let temaSalvo = localStorage.getItem("quickleadTema") || "dark";

let agendamentoAtual = null;
let leadSelecionadoIndex = null;
let tipoComprovanteAtual = "paciente";

// ELEMENTOS
const nomeInput = document.getElementById("nome");
const numeroInput = document.getElementById("numero");
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
  const [ano, mes, dia] = dataISO.split("-");
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
  const data = new Date();
  data.setDate(data.getDate() + 1);

  const diaSemana = data.getDay(); // 0 domingo, 6 sábado
  if (diaSemana === 6) {
    data.setDate(data.getDate() + 2);
  } else if (diaSemana === 0) {
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

  horaInput.innerHTML = `<option value="">Selecionar horário</option>` +
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

  if (!bruto) return "NOVO";

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

  return bruto;
}

function decomporStatus(status = "") {
  const s = normalizarStatus(status);

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
    status: s,
    segmento: "OUTRO",
    baseTipo: s,
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
  bancoLeads = bancoLeads.map((lead) => {
    if (!lead.criadoEm) {
      lead.criadoEm = agoraISO();
    }

    if (!lead.baseTipo) {
      const info = decomporStatus(lead.tipo);
      lead.baseTipo = info.baseTipo;
      lead.baseValor = info.baseValor;
    }

    return atualizarStatusDinamicoLead(lead);
  });

  ordenarBanco();
  salvar();
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
  const textoSemNumero = texto.replace(/(?:\+?55\s*)?\d[\d\s().-]{7,}\d/g, " ").replace(/[–—]/g, "-").trim();

  const partes = textoSemNumero
    .split("-")
    .map((parte) => parte.trim())
    .filter(Boolean);

  let statusBruto = "NOVO";
  if (partes.length > 0) {
    statusBruto = partes[partes.length - 1];
  } else if (textoSemNumero) {
    statusBruto = textoSemNumero;
  }

  const statusNormalizado = normalizarStatus(statusBruto);
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

  alert(
    `✅ Banco atualizado!\n\nAdicionados: ${adicionados}\nAtualizados: ${atualizados}\nIgnorados: ${ignorados}`
  );
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
`RESUMO DA TRIAGEM
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

  for (let i = 1; i <= 30; i++) reedMap[`D${i}`] = [];
  for (let i = 1; i <= 12; i++) proMap[`M${i}`] = [];

  bancoLeads.forEach((lead) => {
    const info = decomporStatus(lead.tipo);
    const numero = limparNumero(lead.numero);

    if (info.segmento === "REED") {
      reedMap[`D${info.baseValor}`].push(numero);
    }

    if (info.segmento === "PRO") {
      proMap[`M${info.baseValor}`].push(numero);
    }
  });

  const visualizacao = campanhaVisualizacao?.value || "todas";

  if (painelReed) {
    painelReed.value = visualizacao === "pro" ? "" : Object.keys(reedMap)
      .map((dia) => `${dia} (${reedMap[dia].length})\n${reedMap[dia].join("\n")}`.trim())
      .join("\n\n");
  }

  if (painelPro) {
    painelPro.value = visualizacao === "reed" ? "" : Object.keys(proMap)
      .map((mes) => `${mes} (${proMap[mes].length})\n${proMap[mes].join("\n")}`.trim())
      .join("\n\n");
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
  const dataFormatada = formatarDataBRCompleta(agendamento.data);
  const horaFormatada = formatarHorario(agendamento.hora);
  const nomes = juntarNomes(agendamento.pessoas);
  const senhas = agendamento.pessoas.map((p) => p.senha).join(" e ");

  return `*SEU AGENDAMENTO FOI CONFIRMADO!✅*

*Consultor: PAULO LOBATO*

*Pacientes: ${nomes.toUpperCase()}*

*Senhas: ${senhas}*

*UNIDADE: ${agendamento.unidade}*

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
  const dataFormatada = formatarDataBRCompleta(agendamento.data);
  const horaFormatada = formatarHorario(agendamento.hora);

  let texto = `CRM / CONTROLE INTERNO

Tipo: ${agendamento.tipo.toUpperCase()}
Unidade: ${agendamento.unidade}
Data: ${dataFormatada}
Hora: ${horaFormatada}

Pessoas:
`;

  agendamento.pessoas.forEach((pessoa, index) => {
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

  mostrarModalComprovante(novoAgendamento, "paciente");
  limparFormularioAgendamento();
}

function mostrarModalComprovante(agendamento, tipo = "paciente") {
  agendamentoAtual = agendamento;
  tipoComprovanteAtual = tipo;
  textoComprovante.value = gerarMensagem(agendamento, tipo);
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
  const agendamento = agendamentos[index];
  if (!agendamento) return;

  const numero = limparNumero(agendamento.pessoas?.[0]?.numero || "");
  const mensagem = gerarMensagem(agendamento, tipo);
  const link = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`;
  window.open(link, "_blank");
}

function transformarEmReagendamento(index) {
  const agendamento = agendamentos[index];
  if (!agendamento) return;

  if (!confirm(`Marcar este registro como reagendamento?\n\n${juntarNomes(agendamento.pessoas)}`)) {
    return;
  }

  agendamento.tipo = "reagendamento";
  salvar();
  filtrarAgenda();
}

function excluir(index) {
  const agendamento = agendamentos[index];
  if (!agendamento) return;

  if (!confirm(`Excluir o registro de ${juntarNomes(agendamento.pessoas)}?`)) return;

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
    listaAgenda.innerHTML = "<p>Nenhum registro para esta data.</p>";
    return;
  }

  listaAgenda.innerHTML = listaDoDia.map((item) => {
    const nomes = juntarNomes(item.pessoas);
    const numeros = item.pessoas.map((p) => formatarNumero(p.numero)).join(" / ");
    const senhas = item.pessoas.map((p) => p.senha).join(" / ");

    return `
      <div class="agenda-item">
        <p><strong>${escaparHTML(nomes)}</strong> — ${escaparHTML(item.unidade)} — ${escaparHTML(item.hora)}</p>
        <p>Tipo: <strong>${escaparHTML(item.tipo.toUpperCase())}</strong></p>
        <p>Senhas: <strong>${escaparHTML(senhas)}</strong></p>
        <p>Números: <strong>${escaparHTML(numeros)}</strong></p>

        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
          <button type="button" onclick="verComprovante(${item.indexOriginal}, 'paciente')">📋 Comprovante Paciente</button>
          <button type="button" onclick="verComprovante(${item.indexOriginal}, 'crm')">📝 Comprovante CRM</button>
          <button type="button" onclick="reenviarWhats(${item.indexOriginal}, 'paciente')">📱 Reenviar WhatsApp</button>
          <button type="button" onclick="transformarEmReagendamento(${item.indexOriginal})">🔁 Marcar Reagendamento</button>
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

  const registros = agendamentos.filter((item) => item.data === dataSelecionada);

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
      contagemPorUnidade[registro.unidade] = (contagemPorUnidade[registro.unidade] || 0) + quantidadePessoas;
    } else if (registro.tipo === "reagendamento") {
      totalReagendamentos += quantidadePessoas;
    } else if (registro.tipo === "inclusao") {
      totalInclusoes += quantidadePessoas;
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
inicializarFormulario();
atualizarStatusAutomaticos();
mostrarBanco();
atualizarCampanhas();
atualizarStatusSync("Modo local ativo");
