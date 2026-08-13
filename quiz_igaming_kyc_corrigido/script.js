const questions = [
  {
    q: "Quais são os campos obrigatórios no cadastro inicial do cliente no site?",
    options: [
      "CPF, e-mail, senha e telefone",
      "Nome, endereço, CEP e telefone",
      "CPF, RG e comprovante de residência",
      "E-mail, nome completo e chave PIX"
    ],
    answer: 0
  },
  {
    q: "O que o cliente precisa aceitar obrigatoriamente antes de continuar o cadastro?",
    options: [
      "Apenas os Termos e Condições",
      "Termos e Condições, Política de Privacidade e Política de PLD/FTP & KYC",
      "Somente a Política de Privacidade",
      "Apenas a política de bônus"
    ],
    answer: 1
  },
  {
    q: "Qual advertência fixa aparece no cadastro, exigida pelo Ministério da Fazenda?",
    options: [
      "\"Jogue com moderação\"",
      "\"Aposta não é investimento\", com referência à Portaria SPA/MF nº 262/2025",
      "\"Apostas são apenas para maiores de 21 anos\"",
      "\"Ganhos não são garantidos\""
    ],
    answer: 1
  },
  {
    q: "Logo após o cadastro, qual etapa obrigatória o cliente encontra antes de acessar a plataforma normalmente?",
    options: [
      "Escolha de bônus",
      "Configuração de Limites - Jogo Responsável",
      "Cadastro de chave PIX",
      "Questionário de preferências esportivas"
    ],
    answer: 1
  },
  {
    q: "Quais são os dois tipos de limite que o cliente pode configurar nessa etapa?",
    options: [
      "Limite de depósito e limite de saque",
      "Limite de apostas e limite de odds",
      "Limite de tempo e limite de perda financeira",
      "Limite de bônus e limite de cashback"
    ],
    answer: 2
  },
  {
    q: "Quais são os valores padrão de limite de tempo da plataforma?",
    options: [
      "12h, 72h semanal e 360h mensal",
      "24h, 168h semanal e 720h mensal",
      "24h, 120h semanal e 600h mensal",
      "48h, 168h semanal e 744h mensal"
    ],
    answer: 1
  },
  {
    q: "O que acontece quando o cliente atinge o limite de perda financeira definido?",
    options: [
      "A conta é encerrada definitivamente",
      "O cliente pode continuar apostando apenas em esportes",
      "Novas apostas ficam indisponíveis até o próximo período",
      "O limite é aumentado automaticamente"
    ],
    answer: 2
  },
  {
    q: "Onde o cliente pode revisar ou alterar seus limites de Jogo Responsável depois do cadastro?",
    options: [
      "No menu de perfil, na área \"Jogo Responsável\"",
      "Somente através do suporte",
      "Na página de promoções",
      "No histórico de apostas"
    ],
    answer: 0
  },
  {
    q: "O cliente consegue apostar ou fazer jogos de cassino antes de concluir o KYC?",
    options: [
      "Sim, sem qualquer limitação",
      "Sim, mas somente apostas esportivas",
      "Não. O acesso fica bloqueado até a verificação de identidade ser concluída",
      "Sim, durante as primeiras 24 horas"
    ],
    answer: 2
  },
  {
    q: "Quais elementos são exigidos na etapa de verificação de identidade (KYC)?",
    options: [
      "Somente CPF e selfie",
      "Documento de identidade original, com foto e dentro da validade, mais verificação facial",
      "Comprovante de residência e cartão bancário",
      "Somente documento digitalizado"
    ],
    answer: 1
  },
  {
    q: "Qual empresa terceirizada realiza a verificação facial (biometria) no processo de KYC?",
    options: [
      "Serasa",
      "ClearSale",
      "Legitimuz",
      "Boa Vista"
    ],
    answer: 2
  },
  {
    q: "Além do fluxo de cadastro, onde mais o cliente tem acesso permanente às informações de Jogo Responsável, Termos e Condições, Política de Privacidade e autoexclusão via Governo?",
    options: [
      "Somente por e-mail após o cadastro",
      "No rodapé do site, disponível em qualquer página do nosso site",
      "Apenas na página inicial",
      "Somente dentro do atendimento ao cliente"
    ],
    answer: 1
  }
];

const introCard = document.getElementById("introCard");
const quizCard = document.getElementById("quizCard");
const endCard = document.getElementById("endCard");
const participantName = document.getElementById("participantName");
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const questionArea = document.getElementById("questionArea");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const endTitle = document.getElementById("endTitle");
const endMessage = document.getElementById("endMessage");

let started = false;
let finished = false;
let violated = false;
let current = 0;
let answers = [];
let startTime = null;

function renderQuestion() {
  const item = questions[current];
  progressText.textContent = `${current + 1}/${questions.length}`;
  progressBar.style.width = `${((current + 1) / questions.length) * 100}%`;

  questionArea.innerHTML = `
    <div class="question-text">${item.q}</div>
    <div class="options">
      ${item.options.map((option, index) => `
        <label class="option">
          <input type="radio" name="answer" value="${index}">
          <span>${option}</span>
        </label>
      `).join("")}
    </div>
    <div id="errorMessage" aria-live="polite"></div>
  `;

  nextBtn.textContent = current === questions.length - 1 ? "Finalizar avaliação" : "Próxima";
}

function nowBR() {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(new Date());
}

function buildDetails(scoreOverride = null) {
  return questions.map((item, index) => {
    const selected = answers[index];
    const selectedText = Number.isInteger(selected) ? item.options[selected] : "Não respondida";
    const correctText = item.options[item.answer];
    const status = scoreOverride === 0 && violated
      ? "Anulada por violação"
      : (selected === item.answer ? "Correta" : "Incorreta");

    return `${index + 1}. ${item.q}
Resposta marcada: ${selectedText}
Resposta correta: ${correctText}
Resultado: ${status}`;
  }).join("\n\n");
}

async function sendResult(status, score, correct, details, urgent = false) {
  const name = participantName.value.trim() || "Não informado";

  const payload = {
    _subject: `Quiz Cadastro/KYC - ${score}/${questions.length} - ${name}`,
    _template: "table",
    Nome: name,
    Nota: `${score}/${questions.length}`,
    Acertos: String(correct),
    Status: status,
    DataHora: nowBR(),
    Detalhes: details
  };

  const url = "https://formsubmit.co/ajax/leandroarcres@gmail.com";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload),
      keepalive: urgent
    });

    if (!response.ok) {
      throw new Error(`Falha no envio: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Não foi possível enviar o resultado:", error);
    return false;
  }
}

async function finishNormally() {
  if (finished || violated) return;

  finished = true;
  started = false;

  const correct = answers.reduce((total, selected, index) => {
    return total + (selected === questions[index].answer ? 1 : 0);
  }, 0);

  await sendResult("CONCLUÍDO", correct, correct, buildDetails(), false);

  quizCard.classList.add("hidden");
  endCard.classList.remove("hidden");
  endTitle.textContent = "Avaliação concluída";
  endMessage.textContent = "Suas respostas foram registradas. O resultado não é exibido nesta tela.";
}

function violate(reason) {
  if (!started || finished || violated) return;

  violated = true;
  finished = true;
  started = false;

  const details = `Motivo do encerramento: ${reason}\n\n${buildDetails(0)}`;
  void sendResult("VIOLAÇÃO - NOTA ZERO", 0, 0, details, true);

  introCard.classList.add("hidden");
  quizCard.classList.add("hidden");
  endCard.classList.remove("hidden");
  endTitle.textContent = "Avaliação encerrada";
  endMessage.textContent = "A avaliação foi encerrada por saída da página. Resultado registrado como 0.";
}

startBtn.addEventListener("click", () => {
  const name = participantName.value.trim();

  if (!name) {
    participantName.focus();
    participantName.setCustomValidity("Informe o nome antes de iniciar.");
    participantName.reportValidity();
    return;
  }

  participantName.setCustomValidity("");
  current = 0;
  answers = [];
  started = true;
  finished = false;
  violated = false;
  startTime = Date.now();

  introCard.classList.add("hidden");
  quizCard.classList.remove("hidden");
  renderQuestion();
});

nextBtn.addEventListener("click", () => {
  const selected = document.querySelector('input[name="answer"]:checked');
  const error = document.getElementById("errorMessage");

  if (!selected) {
    error.textContent = "Selecione uma alternativa antes de continuar.";
    return;
  }

  answers[current] = Number(selected.value);

  if (current < questions.length - 1) {
    current++;
    renderQuestion();
  } else {
    finishNormally();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    violate("A aba foi ocultada, trocada ou a janela foi minimizada.");
  }
});

window.addEventListener("pagehide", () => {
  violate("A página foi fechada ou abandonada.");
});
