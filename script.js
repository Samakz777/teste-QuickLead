let bancoLeads = JSON.parse(localStorage.getItem("bancoLeads")) || [];
let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

// ==================== ELEMENTOS DOM ====================
const nomeInput = document.getElementById("nome");
const numeroInput = document.getElementById("numero");
const unidade = document.getElementById("unidade");
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

// ==================== FUNÇÕES BÁSICAS ====================
function salvar() {
  localStorage.setItem("bancoLeads", JSON.stringify(bancoLeads));
  localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
}

function trocarAba(id) {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("ativa"));
  document.getElementById(id).classList.add("ativa");
}

function limparNumero(t) {
  let n = t.replace(/\D/g, "");
  if (n.startsWith("55") && n.length > 11) n = n.slice(2);
  if (n.length < 10 || n.length > 11) return null;
  return n;
}

// ==================== SENHA INTELIGENTE ====================
function gerarSenha(data) {
  let total = agendamentos.filter(a => a.data === data).length + 1;
  let [ano, mes, dia] = data.split("-");
  return `PJ${dia}${mes}-${String(total).padStart(2, "0")}`;
}

// ==================== AGENDAR ====================
function agendar() {
  let nome = nomeInput.value.trim();
  let numero = limparNumero(numeroInput.value);
  let unid = unidade.value;
  let data = dataInput.value;
  let hora = horaInput.value;

  if (!nome || !numero || !unid || !data || !hora) {
    alert("Preencha todos os campos!");
    return;
  }

  if (!confirm("Confirmar agendamento?")) return;

  let senha = gerarSenha(data);
  let ag = { nome, numero, unidade: unid, data, hora, senha };

  agendamentos.push(ag);
  salvar();

  // Limpar campos
  nomeInput.value = "";
  numeroInput.value = "";
  unidade.value = "";
  dataInput.value = "";
  horaInput.value = "";

  gerarComprovante(ag);
}

// ==================== COMPROVANTE + WHATSAPP ====================
function gerarComprovante(a) {
  let dataFormatada = a.data.split("-").reverse().join("/");

  let msg = `*SEU AGENDAMENTO FOI CONFIRMADO!✅*

*Consultor: PAULO LOBATO*

*Paciente: ${a.nome.toUpperCase()}*

*Senha: ${a.senha}*

*DATA: ${dataFormatada} às ${a.hora}H*

*LEVAR DOCUMENTO OFICIAL COM FOTO*

*Não realizam o exame:*
• Crianças menores de 6 anos
• Lactantes e Gestantes
• Menores de idade precisam de responsável

*Tenha um excelente exame! 😃*

Projeto Enxergar 🌐`;

  let link = `https://wa.me/55${a.numero}?text=${encodeURIComponent(msg)}`;

  if (confirm("Enviar no WhatsApp?")) {
    window.open(link, "_blank");
  }
}

// ==================== FILTRO INTELIGENTE ====================
function filtrarLeads() {
  let entrada = entradaFiltro.value.split("\n");
  let resultado = [];
  let usados = new Set();
  let dup = 0;
  let ruins = 0;

  entrada.forEach(l => {
    let n = limparNumero(l);
    if (!n) return;

    if (usados.has(n)) { dup++; return; }

    let ex = bancoLeads.find(x => x.numero === n);
    if (ex && ["DES", "LON", "FOR", "PAT"].includes(ex.tipo)) { ruins++; return; }

    usados.add(n);
    resultado.push(n);
  });

  saidaFiltro.value = resultado.join("\n") +
    `\n\nDuplicados removidos: ${dup}\nLeads ruins removidos: ${ruins}`;
}

// ==================== BANCO DE LEADS ====================
function salvarBanco() {
  let linhas = entradaBanco.value.split("\n");

  linhas.forEach(l => {
    let p = l.split("-");
    if (p.length < 2) return;

    let n = limparNumero(p[0]);
    if (!n) return;

    let info = p[1].trim().split(" ");
    bancoLeads.push({ numero: n, tipo: info[0] });
  });

  salvar();
  entradaBanco.value = ""; // limpa após salvar
  mostrarBanco();
}

function mostrarBanco() {
  listaBanco.innerHTML = "";
  bancoLeads.forEach(l => {
    listaBanco.innerHTML += `<p>${l.numero} - ${l.tipo}</p>`;
  });
}

// ==================== AGENDA ====================
function filtrarAgenda() {
  let d = filtroData.value;
  if (!d) {
    alert("Selecione uma data!");
    return;
  }

  listaAgenda.innerHTML = "";

  agendamentos
    .filter(a => a.data === d)
    .forEach(a => {
      let idx = agendamentos.indexOf(a); // índice real no array principal
      listaAgenda.innerHTML += `
        <p><strong>${a.nome}</strong> - ${a.unidade} - ${a.hora}</p>
        <button onclick="excluir(${idx})">Excluir</button>
        <hr>`;
    });

  if (listaAgenda.innerHTML === "") {
    listaAgenda.innerHTML = "<p>Nenhum agendamento para esta data.</p>";
  }
}

function excluir(i) {
  if (!confirm("Excluir este agendamento?")) return;
  agendamentos.splice(i, 1);
  salvar();
  filtrarAgenda();
}

// ==================== RELATÓRIO ====================
function gerarRelatorio() {
  let d = dataRelatorio.value;
  if (!d) {
    alert("Selecione uma data!");
    return;
  }

  let lista = agendamentos.filter(a => a.data === d);

  let cont = {};
  lista.forEach(a => {
    cont[a.unidade] = (cont[a.unidade] || 0) + 1;
  });

  let txt = `Relatório ${d}\n\n`;
  for (let u in cont) {
    txt += `${u}: ${cont[u]}\n`;
  }
  txt += `\nTotal do dia: ${lista.length}`;

  resultadoRelatorio.textContent = txt;
}

// ==================== INICIALIZAÇÃO ====================
mostrarBanco();
