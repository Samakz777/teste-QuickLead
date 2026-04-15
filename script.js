let bancoLeads = JSON.parse(localStorage.getItem("bancoLeads")) || [];
let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
let agendamentoAtual = null;

// ELEMENTOS
const nomeInput = document.getElementById("nome");
const numeroInput = document.getElementById("numero");
const unidade = document.getElementById("unidade");
const dataInput = document.getElementById("data");
const horaInput = document.getElementById("hora");
const entradaFiltro = document.getElementById("entradaFiltro");
const saidaFiltro = document.getElementById("saidaFiltro");
const removidosFiltro = document.getElementById("removidosFiltro");
const entradaBanco = document.getElementById("entradaBanco");
const listaBanco = document.getElementById("listaBanco");
const filtroData = document.getElementById("filtroData");
const listaAgenda = document.getElementById("listaAgenda");
const dataRelatorio = document.getElementById("dataRelatorio");
const resultadoRelatorio = document.getElementById("resultadoRelatorio");
const modal = document.getElementById("modalComprovante");
const textoComprovante = document.getElementById("textoComprovante");
const importarTexto = document.getElementById("importarTexto");

// FUNÇÕES BÁSICAS
function salvar() {
  localStorage.setItem("bancoLeads", JSON.stringify(bancoLeads));
  localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
}

function trocarAba(id) {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("ativa"));
  document.getElementById(id).classList.add("ativa");
}

function limparNumero(t) {
  return t.replace(/\D/g, "").replace(/^55/, "");
}

function getPhoneKey(n) {
  return n ? n.slice(-8) : null;
}

// DATA AUTOMÁTICA
function setDataHoje() {
  if (!dataInput.value) {
    dataInput.value = new Date().toISOString().split("T")[0];
  }
}

// NOVA LÓGICA DE CLASSIFICAÇÃO (TEMPO + LOCALIZAÇÃO)
function classificarLead(numero, tipo, dataEntrada) {
  if (!tipo) return "DESCONHECIDO";

  const ruins = ["DES", "LON", "FOR", "PAT"];
  if (ruins.includes(tipo)) return "REMOVER";

  if (tipo === "PROM4") return "REMOVER"; // só usar após 4 meses

  const hoje = new Date();
  const entrada = dataEntrada ? new Date(dataEntrada) : hoje;
  const dias = Math.floor((hoje - entrada) / (1000 * 60 * 60 * 24));

  if (dias <= 0) return "NOVO";           // hoje ou futuro
  if (dias === 1) return "REED1";         // 1 dia atrás
  if (dias === 2) return "REED2";         // 2 dias atrás
  if (dias <= 29) return "REED29";        // até 29 dias
  return "PROM4";                         // mais antigo
}

// FILTRO INTELIGENTE (NOVA LÓGICA)
function filtrarLeads() {
  let entrada = entradaFiltro.value.split("\n");
  let filtrados = [];   // Novos + REED1
  let removidos = [];   // Tudo o resto

  let usados = new Set();

  entrada.forEach(l => {
    let n = limparNumero(l);
    if (!n) return;

    let key = getPhoneKey(n);
    if (usados.has(key)) {
      removidos.push(`${n} (DUPLICADO)`);
      return;
    }
    usados.add(key);

    // Procura no banco
    let leadBanco = bancoLeads.find(x => getPhoneKey(x.numero) === key);
    let tipo = leadBanco ? leadBanco.tipo : "NOVO";
    let dataEntrada = leadBanco ? leadBanco.data : null;

    let status = classificarLead(n, tipo, dataEntrada);

    if (status === "NOVO" || status === "REED1") {
      filtrados.push(n);
    } else {
      removidos.push(`${n} (${status})`);
    }
  });

  saidaFiltro.value = filtrados.join("\n") || "Nenhum lead prioritário encontrado.";
  
  removidosFiltro.value = removidos.length 
    ? removidos.join("\n") 
    : "Nenhum lead removido.";
}

// BANCO
function salvarBanco() {
  let linhas = entradaBanco.value.split("\n");
  linhas.forEach(l => {
    let p = l.split("-");
    if (p.length < 2) return;
    let n = limparNumero(p[0]);
    if (!n) return;
    let resto = p[1].trim().split(" ");
    let tipo = resto[0];
    let data = resto[1] || new Date().toISOString().split("T")[0];
    bancoLeads.push({ numero: n, tipo: tipo, data: data });
  });
  salvar();
  entradaBanco.value = "";
  mostrarBanco();
}

function mostrarBanco() {
  listaBanco.innerHTML = "";
  bancoLeads.forEach(l => {
    listaBanco.innerHTML += `<p>${l.numero} - ${l.tipo} ${l.data || ''}</p>`;
  });
}

// Funções restantes (agendamento, modal, agenda, etc.) mantidas iguais à versão anterior
// (copie do script anterior ou avise se quiser que eu envie o arquivo completo)

function agendar() { /* mesmo código anterior */ }
function gerarMensagem(a) { /* mesmo código anterior com horário completo */ }
function mostrarModalComprovante(a) { /* mesmo */ }
function copiarComprovante() { /* mesmo */ }
function enviarWhats() { /* mesmo */ }
function fecharModal() { modal.style.display = "none"; agendamentoAtual = null; } // sem confirmação

// Export / Import, Agenda, Relatório... (mesmo da versão anterior)

// INICIALIZAÇÃO
setDataHoje();
mostrarBanco();
