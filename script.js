// ================== BANCO DE DADOS ==================
let bancoLeads = JSON.parse(localStorage.getItem("bancoLeads")) || [];
let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

// ================== SALVAR ==================
function salvarDados() {
    localStorage.setItem("bancoLeads", JSON.stringify(bancoLeads));
    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
}

// ================== TROCAR ABA ==================
function trocarAba(id) {
    document.querySelectorAll(".aba").forEach(el => el.classList.remove("ativa"));
    document.getElementById(id).classList.add("ativa");
}

// ================== FORMATAR NÚMERO ==================
function limparNumero(texto) {
    let num = texto.replace(/\D/g, "");

    // remove 55 do começo
    if (num.startsWith("55") && num.length > 11) {
        num = num.substring(2);
    }

    // valida tamanho
    if (num.length < 10 || num.length > 11) return null;

    return num;
}

// ================== FILTRO INTELIGENTE ==================
function filtrarLeads() {
    let entrada = document.getElementById("entradaFiltro").value.split("\n");

    let resultado = [];
    let usados = new Set();

    entrada.forEach(linha => {
        let num = limparNumero(linha);

        if (!num) return;

        // remove duplicados
        if (usados.has(num)) return;

        // verifica se está no banco como ruim
        let existe = bancoLeads.find(l => l.numero === num);

        if (existe && ["DES", "LON", "FOR", "PAT"].includes(existe.tipo)) return;

        usados.add(num);
        resultado.push(num);
    });

    document.getElementById("saidaFiltro").value = resultado.join("\n");
}

// ================== COPIAR RESULTADO ==================
function copiarResultado() {
    let texto = document.getElementById("saidaFiltro");
    texto.select();
    document.execCommand("copy");
    alert("Copiado!");
}

// ================== SALVAR BANCO ==================
function salvarBanco() {
    let entrada = document.getElementById("entradaBanco").value.split("\n");

    entrada.forEach(linha => {
        let partes = linha.split("-");
        if (partes.length < 2) return;

        let numero = limparNumero(partes[0]);
        let info = partes[1].trim();

        if (!numero) return;

        let tipo = info.split(" ")[0];
        let tempo = info.split(" ")[1] || "";

        bancoLeads.push({ numero, tipo, tempo });
    });

    salvarDados();
    mostrarBanco();
    alert("Salvo!");
}

// ================== MOSTRAR BANCO ==================
function mostrarBanco() {
    let div = document.getElementById("listaBanco");
    div.innerHTML = "";

    bancoLeads.forEach(l => {
        div.innerHTML += `<p>${l.numero} - ${l.tipo} ${l.tempo}</p>`;
    });
}

// ================== AGENDAR ==================
function agendar() {
    let nome = document.getElementById("nome").value;
    let numero = limparNumero(document.getElementById("numero").value);
    let unidade = document.getElementById("unidade").value;
    let data = document.getElementById("data").value;
    let hora = document.getElementById("hora").value;

    if (!nome || !numero || !unidade || !data || !hora) {
        alert("Preencha tudo!");
        return;
    }

    agendamentos.push({ nome, numero, unidade, data, hora });

    salvarDados();
    alert("Agendado!");
}

// ================== FILTRAR AGENDA ==================
function filtrarAgenda() {
    let data = document.getElementById("filtroData").value;
    let div = document.getElementById("listaAgenda");

    div.innerHTML = "";

    agendamentos
        .filter(a => a.data === data)
        .forEach(a => {
            div.innerHTML += `<p>${a.nome} - ${a.unidade} - ${a.hora}</p>`;
        });
}

// ================== LEMBRETES ==================
function gerarLembretes() {
    let data = document.getElementById("dataLembrete").value;
    let div = document.getElementById("listaLembretes");

    div.innerHTML = "";

    agendamentos
        .filter(a => a.data === data)
        .forEach(a => {

            let mensagem = `*SEU AGENDAMENTO FOI CONFIRMADO!*\n\nPaciente: ${a.nome}\nUnidade: ${a.unidade}\nData: ${a.data} às ${a.hora}\n\nLevar documento com foto`;

            let link = `https://wa.me/55${a.numero}?text=${encodeURIComponent(mensagem)}`;

            div.innerHTML += `
                <p>${a.nome} - ${a.hora}</p>
                <a href="${link}" target="_blank">Enviar WhatsApp</a>
                <hr>
            `;
        });
}

// ================== RELATÓRIO ==================
function gerarRelatorio() {
    let data = document.getElementById("dataRelatorio").value;
    let resultado = document.getElementById("resultadoRelatorio");

    let lista = agendamentos.filter(a => a.data === data);

    let contagem = {};

    lista.forEach(a => {
        contagem[a.unidade] = (contagem[a.unidade] || 0) + 1;
    });

    let texto = `📅 Relatório - ${data}\n\n`;

    for (let unidade in contagem) {
        texto += `${unidade}: ${contagem[unidade]}\n`;
    }

    texto += `\nTotal: ${lista.length}`;

    resultado.textContent = texto;
}

// ================== INICIAR ==================
mostrarBanco();