const btnIniciar = document.getElementById("btnIniciar");
const telaInicial = document.getElementById("telaInicial");
const quizArea = document.getElementById("quizArea");
const form = document.getElementById("quizForm");
const resultado = document.getElementById("resultado");
const nomeAnalistaInput = document.getElementById("nomeAnalista");
const erroNome = document.getElementById("erroNome");

const EMAIL_DESTINO = "leandroarcres@gmail.com";
const ENDPOINT = `https://formsubmit.co/ajax/${EMAIL_DESTINO}`;

let monitoramentoAtivo = false;
let enqueteEncerrada = false;
let envioFinalizado = false;
let nomeAnalista = "";

const respostasCorretas = {
  q1: "A", q2: "B", q3: "C", q4: "C", q5: "B", q6: "A",
  q7: "C", q8: "A", q9: "B", q10: "A", q11: "C", q12: "B"
};

function dataHoraBrasil() {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Recife"
  });
}

function coletarRespostas() {
  const respostas = {};
  for (let i = 1; i <= 12; i++) {
    const marcada = document.querySelector(`input[name="q${i}"]:checked`);
    respostas[`Pergunta ${i}`] = marcada ? marcada.value : "Não respondida";
  }
  return respostas;
}

function calcularAcertos() {
  let acertos = 0;

  Object.keys(respostasCorretas).forEach(pergunta => {
    const marcada = document.querySelector(`input[name="${pergunta}"]:checked`);
    if (marcada && marcada.value === respostasCorretas[pergunta]) {
      acertos++;
    }
  });

  return acertos;
}

async function enviarResultado(dados, manterAoSair = false) {
  const resposta = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(dados),
    keepalive: manterAoSair
  });

  if (!resposta.ok) {
    throw new Error("Falha ao enviar o resultado.");
  }

  return resposta.json();
}

btnIniciar.addEventListener("click", () => {
  nomeAnalista = nomeAnalistaInput.value.trim();

  if (!nomeAnalista) {
    erroNome.classList.remove("escondido");
    nomeAnalistaInput.focus();
    return;
  }

  erroNome.classList.add("escondido");
  nomeAnalistaInput.disabled = true;

  telaInicial.classList.add("escondido");
  quizArea.classList.remove("escondido");

  setTimeout(() => {
    monitoramentoAtivo = true;
  }, 1000);
});

async function encerrarComZero(motivo) {
  if (!monitoramentoAtivo || enqueteEncerrada || envioFinalizado) return;

  enqueteEncerrada = true;
  monitoramentoAtivo = false;

  const respostas = coletarRespostas();

  quizArea.classList.add("escondido");
  resultado.classList.remove("escondido");
  resultado.classList.add("zero");
  resultado.innerHTML = `
    <h2>Enquete encerrada — Nota 0</h2>
    <p>A página detectou que a tela da enquete perdeu o foco.</p>
    <p><strong>Resultado: 0 de 12.</strong></p>
  `;

  const dados = {
    _subject: `Enquete iGaming - ZERO - ${nomeAnalista}`,
    _template: "table",
    "Analista": nomeAnalista,
    "Nota": "0/12",
    "Acertos": "0",
    "Status": "ENCERRADA COM ZERO",
    "Motivo": motivo,
    "Data e hora": dataHoraBrasil(),
    ...respostas
  };

  try {
    await enviarResultado(dados, true);
  } catch (erro) {
    console.error("Não foi possível enviar o zero por e-mail:", erro);
  }
}

document.addEventListener("visibilitychange", () => {
  if (monitoramentoAtivo && document.hidden) {
    encerrarComZero("Troca de aba, página oculta ou navegador minimizado");
  }
});

window.addEventListener("blur", () => {
  if (!monitoramentoAtivo) return;

  setTimeout(() => {
    if (monitoramentoAtivo && !document.hasFocus()) {
      encerrarComZero("A janela da enquete perdeu o foco");
    }
  }, 400);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (enqueteEncerrada || envioFinalizado) return;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  envioFinalizado = true;
  monitoramentoAtivo = false;

  const acertos = calcularAcertos();
  const respostas = coletarRespostas();

  const dados = {
    _subject: `Enquete iGaming - ${acertos}/12 - ${nomeAnalista}`,
    _template: "table",
    "Analista": nomeAnalista,
    "Nota": `${acertos}/12`,
    "Acertos": acertos,
    "Status": "FINALIZADA NORMALMENTE",
    "Data e hora": dataHoraBrasil(),
    ...respostas
  };

  quizArea.classList.add("escondido");
  resultado.classList.remove("escondido", "zero");
  resultado.innerHTML = `
    <h2>Enviando respostas...</h2>
    <p>Aguarde alguns segundos.</p>
  `;

  try {
    await enviarResultado(dados);

    resultado.innerHTML = `
      <h2>Enquete finalizada ✅</h2>
      <p>Suas respostas foram registradas e enviadas.</p>
      <p>O resultado não é exibido nesta tela.</p>
    `;
  } catch (erro) {
    console.error(erro);

    // Permite tentar de novo sem perder as respostas.
    envioFinalizado = false;
    quizArea.classList.remove("escondido");
    resultado.classList.add("escondido");

    alert(
      "Não foi possível enviar o resultado. Verifique a conexão com a internet e tente finalizar novamente."
    );
  }
});
