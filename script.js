let bancoLeads = JSON.parse(localStorage.getItem("bancoLeads")) || [];
let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
let temaSalvo = localStorage.getItem("quickleadTema") || "dark";

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
const resumoBanco = document.getElementById("resumoBanco");

const filtroSegmentacaoBanco = document.getElementById("filtroSegmentacaoBanco");
const filtroDiaReed = document.getElementById("filtroDiaReed");
const filtroMesPro = document.getElementById("filtroMesPro");

const painelReed = document.getElementById("painelReed");
const painelPro = document.getElementById("painelPro");

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

function agoraISO() {
  return new Date().toISOString();
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

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("quickleadTema", theme);
}

function alternarTema() {
  const atual = document.documentElement.getAttribute("data-theme") || "dark";
  const novo = atual === "dark" ? "light" : "dark";
  setTheme(novo);
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

  let statusBruto = "NOVO";
  if (partes.length > 0) {
    statusBruto = partes[partes.length - 1];
  } else {
    const fallback = restante.split(/\s+/).filter(Boolean).join(" ");
    if (fallback) statusBruto = fallback;
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

    const matchSegmento =
      !segmento ||
      info.segmento === segmento;

    const matchDia =
      !diaReed ||
      (info.segmento === "REED" && `D${info.baseValor}` === diaReed);

    const matchMes =
      !mesPro ||
      (info.segmento === "PRO" && `M${info.baseValor}` === mesPro);

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
// FILTRO
// =========================
function filtrarLeads() {
  atualizarStatusAutomaticos();

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
      return;
    }

    aprovados.push(`${numero} - ${statusExibido}`);
  });

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
- Inválidos: ${totalInvalidos}

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

function organizarNumerosEmFileira() {
  const fonte = (saidaFiltro.value || entradaFiltro.value || "").trim();

  if (!fonte) {
    alert("Não há números para organizar.");
    return;
  }

  const linhas = fonte.split("\n");
  const numeros = linhas
    .map((linha) => limparNumero(linha))
    .filter(Boolean);

  if (!numeros.length) {
    alert("Nenhum número válido encontrado.");
    return;
  }

  saidaFiltro.value = numeros.join("\n");
  copiarTexto(saidaFiltro.value, "✅ Números organizados em fileira e copiados.");
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

  if (painelReed) {
    painelReed.value = Object.keys(reedMap)
      .map((dia) => `${dia} (${reedMap[dia].length})\n${reedMap[dia].join("\n")}`.trim())
      .join("\n\n");
  }

  if (painelPro) {
    painelPro.value = Object.keys(proMap)
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
    criadoEm: agoraISO()
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

  if (!confirm(`Excluir o agendamento de ${agendamento.nome}?`)) return;

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
setTheme(temaSalvo);
setDataHoje();
atualizarStatusAutomaticos();
mostrarBanco();
atualizarCampanhas();
atualizarStatusSync("Modo local ativo");

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    background: #0f1115;
    color: #fff;
    padding: 20px;
    line-height: 1.5;
}

header {
    text-align: center;
    margin-bottom: 25px;
}

h1 {
    font-size: 2.6em;
    margin-bottom: 5px;
}

.subtitulo {
    color: #00c853;
    font-size: 1.1em;
}

.menu {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 30px;
}

.menu button {
    background: #1a1d23;
    color: #fff;
    border: none;
    padding: 12px 20px;
    cursor: pointer;
    border-radius: 8px;
    font-weight: bold;
    transition: 0.3s;
}

.menu button:hover {
    background: #00c853;
    color: #000;
}

.aba {
    display: none;
}

.ativa {
    display: block;
}

.card {
    background: #1a1d23;
    padding: 25px;
    border-radius: 12px;
    max-width: 560px;
    margin: 20px auto;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

input, select, textarea {
    padding: 12px;
    border: none;
    border-radius: 6px;
    background: #252a32;
    color: #fff;
    font-size: 1em;
}

textarea {
    resize: vertical;
}

.linha {
    display: flex;
    gap: 10px;
}

.linha input {
    flex: 1;
}

.btn-principal {
    background: #00c853;
    color: #000;
    font-weight: bold;
    padding: 14px;
    font-size: 1.1em;
    cursor: pointer;
    border: none;
    border-radius: 8px;
    margin-top: 5px;
}

.btn-principal:hover {
    background: #00e65c;
}

/* ==================== FILTRO - DUAS CAIXAS ==================== */
.resultado-filtro {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 15px;
}

.resultado-filtro h3 {
    color: #00c853;
    margin-bottom: 8px;
    font-size: 1.15em;
}

#saidaFiltro {
    height: 260px;
    background: #1f2a1f;
    font-family: monospace;
}

#removidosFiltro {
    height: 210px;
    background: #2a1f1f;
    font-family: monospace;
    color: #ff9999;
}

/* Responsivo - duas colunas em telas maiores */
@media (min-width: 768px) {
    .resultado-filtro {
        flex-direction: row;
    }
    .resultado-filtro > div {
        flex: 1;
    }
}

/* ==================== MODAL ==================== */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.92);
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: #1a1d23;
    padding: 25px;
    border-radius: 12px;
    width: 92%;
    max-width: 520px;
    text-align: center;
}

.modal-content textarea {
    width: 100%;
    height: 420px;
    margin: 15px 0;
    background: #252a32;
    color: #fff;
    font-size: 15px;
    line-height: 1.45;
    font-family: monospace;
}

/* Botões do modal */
.botoes button {
    padding: 12px 20px;
    margin: 6px 4px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    font-size: 1em;
}

.botoes button:nth-child(1) { background: #00c853; color: #000; }
.botoes button:nth-child(2) { background: #0099ff; color: #fff; }
.botoes button:nth-child(3) { background: #00c853; color: #000; }

/* ==================== AGENDA ==================== */
.agenda-item {
    background: #252a32;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 12px;
}

.agenda-item button {
    margin: 4px 3px;
    padding: 6px 12px;
    font-size: 0.9em;
}

/* ==================== BANCO ==================== */
#listaBanco p {
    background: #252a32;
    padding: 10px;
    border-radius: 6px;
    margin: 6px 0;
}

/* ==================== RELATÓRIO ==================== */
pre {
    background: #252a32;
    padding: 15px;
    border-radius: 8px;
    white-space: pre-wrap;
    font-family: monospace;
    font-size: 0.95em;
}
