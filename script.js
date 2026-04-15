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
  if (!n) return null;
  return n.slice(-8);
}

// DATA AUTOMÁTICA HOJE
function setDataHoje() {
  if (!dataInput.value) {
    dataInput.value = new Date().toISOString().split("T")[0];
  }
}

// FORMATAR HORÁRIO COM MANHÃ/TARDE
function formatarHorario(hora) {
  let [h, m] = hora.split(":");
  let horaNum = parseInt(h);
  let periodo = horaNum < 12 ? "DA MANHÃ" : "DA TARDE";
  return `${h}:${m}H ${periodo}`;
}

// GERAR MENSAGEM DO COMPROVANTE
function gerarMensagem(a) {
  let dataFormatada = a.data.split("-").reverse().join("/");
  let horaFormatada = formatarHorario(a.hora);
  return `*SEU AGENDAMENTO FOI CONFIRMADO!✅*

*Consultor: PAULO LOBATO*

*Pacientes: ${a.nome.toUpperCase()}*

Senha:
*${a.senha}*

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

// AGENDAR
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

  nomeInput.value = numeroInput.value = unidade.value = dataInput.value = horaInput.value = "";

  mostrarModalComprovante(ag);
}

function gerarSenha(data) {
  let total = agendamentos.filter(a => a.data === data).length + 1;
  let [ano, mes, dia] = data.split("-");
  return `PJ${dia}${mes}-${String(total).padStart(2, "0")}`;
}

// MODAL
function mostrarModalComprovante(a) {
  agendamentoAtual = a;
  textoComprovante.value = gerarMensagem(a);
  modal.style.display = "flex";
}

function copiarComprovante() {
  textoComprovante.select();
  document.execCommand("copy");
  alert("✅ Comprovante copiado!");
}

function enviarWhats() {
  if (!agendamentoAtual) return;
  let link = `https://wa.me/55${agendamentoAtual.numero}?text=${encodeURIComponent(textoComprovante.value)}`;
  window.open(link, "_blank");
}

function fecharModal() {
  if (confirm("Deseja fechar o comprovante?\n\n(O agendamento já foi salvo com sucesso)")) {
    modal.style.display = "none";
    agendamentoAtual = null;
  }
}

// FILTRO INTELIGENTE + LISTA DE REMOVIDOS
function filtrarLeads() {
  let entrada = entradaFiltro.value.split("\n");
  let resultado = [];
  let usados = new Set();
  let dup = 0;
  let ruins = 0;
  let duplicadosLista = [];
  let ruinsLista = [];
  let ruinsPorTipo = { DES: 0, LON: 0, FOR: 0, PAT: 0 };

  entrada.forEach(l => {
    let n = limparNumero(l);
    if (!n) return;

    let key = getPhoneKey(n);

    if (usados.has(key)) {
      dup++;
      duplicadosLista.push(n);
      return;
    }

    let ex = bancoLeads.find(x => getPhoneKey(x.numero) === key);
    if (ex && ["DES","LON","FOR","PAT"].includes(ex.tipo)) {
      ruins++;
      ruinsPorTipo[ex.tipo]++;
      ruinsLista.push(`${n} (${ex.tipo})`);
      return;
    }

    usados.add(key);
    resultado.push(n);
  });

  let texto = resultado.join("\n");

  if (duplicadosLista.length || ruinsLista.length) {
    texto += "\n\n--- LEADS REMOVIDOS ---";
    if (duplicadosLista.length) {
      texto += `\n\nDuplicados (${dup}):\n${duplicadosLista.join("\n")}`;
    }
    if (ruinsLista.length) {
      texto += `\n\nLeads ruins (${ruins}):\n${ruinsLista.join("\n")}`;
    }
  }

  texto += `\n\nResumo:\nDuplicados removidos: ${dup}\nLeads ruins removidos: ${ruins}`;

  saidaFiltro.value = texto;
}

// EXPORT / IMPORT (sincronização)
function exportarDados() {
  const dados = { bancoLeads, agendamentos };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quicklead-dados.json";
  a.click();
  URL.revokeObjectURL(url);
  alert("✅ Arquivo JSON baixado! Transfira para o outro dispositivo.");
}

function importarDados() {
  let texto = importarTexto.value.trim();
  if (!texto) {
    alert("Cole o conteúdo do JSON primeiro!");
    return;
  }
  if (!confirm("Importar esses dados? Os dados atuais serão substituídos.")) return;

  try {
    let dados = JSON.parse(texto);
    if (dados.bancoLeads) bancoLeads = dados.bancoLeads;
    if (dados.agendamentos) agendamentos = dados.agendamentos;
    salvar();
    mostrarBanco();
    importarTexto.value = "";
    alert("✅ Dados importados com sucesso!");
  } catch (e) {
    alert("❌ JSON inválido! Verifique o arquivo.");
  }
}

// BANCO, AGENDA, RELATÓRIO (mantidos e funcionais)
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
  entradaBanco.value = "";
  mostrarBanco();
}

function mostrarBanco() {
  listaBanco.innerHTML = "";
  bancoLeads.forEach(l => {
    listaBanco.innerHTML += `<p>${l.numero} - ${l.tipo}</p>`;
  });
}

function copiarNumero(num) {
  navigator.clipboard.writeText(num).then(() => alert("✅ Número copiado!"));
}

function verComprovante(idx) {
  mostrarModalComprovante(agendamentos[idx]);
}

function reenviarWhats(idx) {
  let a = agendamentos[idx];
  let msg = gerarMensagem(a);
  let link = `https://wa.me/55${a.numero}?text=${encodeURIComponent(msg)}`;
  window.open(link, "_blank");
}

function filtrarAgenda() {
  let d = filtroData.value;
  if (!d) { alert("Selecione uma data!"); return; }
  listaAgenda.innerHTML = "";
  agendamentos.filter(a => a.data === d).forEach(a => {
    let idx = agendamentos.indexOf(a);
    listaAgenda.innerHTML += `
      <div class="agenda-item">
        <p><strong>${a.nome}</strong> — ${a.unidade} — ${a.hora}</p>
        <p>Número: <strong>${a.numero}</strong> <button onclick="copiarNumero('${a.numero}')">Copiar Número</button></p>
        <button onclick="verComprovante(${idx})">📋 Ver Comprovante</button>
        <button onclick="reenviarWhats(${idx})">📱 Re-enviar WhatsApp</button>
        <button onclick="excluir(${idx})">Excluir</button>
        <hr>
      </div>`;
  });
  if (listaAgenda.innerHTML === "") listaAgenda.innerHTML = "<p>Nenhum agendamento para esta data.</p>";
}

function excluir(i) {
  if (!confirm("Excluir este agendamento?")) return;
  agendamentos.splice(i, 1);
  salvar();
  filtrarAgenda();
}

function gerarRelatorio() {
  let d = dataRelatorio.value;
  if (!d) { alert("Selecione uma data!"); return; }
  let lista = agendamentos.filter(a => a.data === d);
  let cont = {};
  lista.forEach(a => cont[a.unidade] = (cont[a.unidade] || 0) + 1);
  let txt = `Relatório ${d}\n\n`;
  for (let u in cont) txt += `${u}: ${cont[u]}\n`;
  txt += `\nTotal do dia: ${lista.length}`;
  resultadoRelatorio.textContent = txt;
}

// INICIALIZAÇÃO
setDataHoje();
mostrarBanco();
