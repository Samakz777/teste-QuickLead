let bancoLeads = JSON.parse(localStorage.getItem("bancoLeads")) || [];
let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

function salvar() {
localStorage.setItem("bancoLeads", JSON.stringify(bancoLeads));
localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
}

function trocarAba(id){
document.querySelectorAll(".aba").forEach(a=>a.classList.remove("ativa"));
document.getElementById(id).classList.add("ativa");
}

function limparNumero(t){
let n=t.replace(/\D/g,"");
if(n.startsWith("55") && n.length>11) n=n.slice(2);
if(n.length<10||n.length>11) return null;
return n;
}

// SENHA INTELIGENTE
function gerarSenha(data){
let [ano,mes,dia]=data.split("-");
let total=agendamentos.filter(a=>a.data===data).length+1;
return `PJ${dia}${mes}-${String(total).padStart(2,"0")}`;
}

// AGENDAR
function agendar(){
let nome=nomeInput.value.trim();
let numero=limparNumero(numeroInput.value);
let unidade=unidade.value;
let data=dataInput.value;
let hora=horaInput.value;

if(!nome||!numero||!unidade||!data||!hora){
alert("Preencha tudo");
return;
}

if(!confirm("Confirmar agendamento?")) return;

let senha=gerarSenha(data);

let ag={nome,numero,unidade,data,hora,senha};
agendamentos.push(ag);
salvar();

nomeInput.value="";
numeroInput.value="";
unidade.value="";
dataInput.value="";
horaInput.value="";

gerarComprovante(ag);
}

// COMPROVANTE
function gerarComprovante(a){
let dataFormatada=a.data.split("-").reverse().join("/");

let msg=`*SEU AGENDAMENTO FOI CONFIRMADO!✅*

*Consultor: PAULO LOBATO*

*Pacientes: ${a.nome.toUpperCase()}*

Senha:
*${a.senha}*

*DATA: ${dataFormatada} às ${a.hora}H DA TARDE!*

*LEVAR UM DOCUMENTO OFICIAL COM FOTO*

*Não realizam o exame:*
* Crianças menores de 6 anos
* Lactantes e Gestantes
* Menores de idade ir acompanhado(a) com responsável
* Atendimento por ordem de chegada

*Tenha um excelente exame!😃*

Projeto Enxergar 🌐`;

let link=`https://wa.me/55${a.numero}?text=${encodeURIComponent(msg)}`;

if(confirm("Enviar no WhatsApp?")){
window.open(link,"_blank");
}
}

// FILTRO
function filtrarLeads(){
let entrada=entradaFiltro.value.split("\n");

let resultado=[];
let usados=new Set();

let dup=0;
let ruins=0;

entrada.forEach(l=>{
let n=limparNumero(l);
if(!n) return;

if(usados.has(n)){dup++;return;}

let ex=bancoLeads.find(x=>x.numero===n);
if(ex && ["DES","LON","FOR","PAT"].includes(ex.tipo)){ruins++;return;}

usados.add(n);
resultado.push(n);
});

saidaFiltro.value=resultado.join("\n")+
`\n\nDuplicados: ${dup}\nRemovidos: ${ruins}`;
}

// BANCO
function salvarBanco(){
let linhas=entradaBanco.value.split("\n");

linhas.forEach(l=>{
let p=l.split("-");
if(p.length<2) return;

let n=limparNumero(p[0]);
let info=p[1].trim().split(" ");

bancoLeads.push({numero:n,tipo:info[0]});
});

salvar();
mostrarBanco();
}

function mostrarBanco(){
listaBanco.innerHTML="";
bancoLeads.forEach(l=>{
listaBanco.innerHTML+=`<p>${l.numero} - ${l.tipo}</p>`;
});
}

// AGENDA
function filtrarAgenda(){
let d=filtroData.value;
listaAgenda.innerHTML="";

agendamentos.filter(a=>a.data===d).forEach((a,i)=>{
listaAgenda.innerHTML+=`
<p>${a.nome} - ${a.unidade} - ${a.hora}</p>
<button onclick="excluir(${i})">Excluir</button><hr>`;
});
}

function excluir(i){
if(!confirm("Excluir?")) return;
agendamentos.splice(i,1);
salvar();
filtrarAgenda();
}

// RELATÓRIO
function gerarRelatorio(){
let d=dataRelatorio.value;

let lista=agendamentos.filter(a=>a.data===d);

let cont={};

lista.forEach(a=>{
cont[a.unidade]=(cont[a.unidade]||0)+1;
});

let txt=`Relatório ${d}\n\n`;

for(let u in cont){
txt+=`${u}: ${cont[u]}\n`;
}

txt+=`\nTotal: ${lista.length}`;

resultadoRelatorio.textContent=txt;
}

mostrarBanco();
