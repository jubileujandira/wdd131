const contadorElemento = document.querySelector(
    "#contador-avaliacoes"
);

const anoAtual = document.querySelector("#ano-atual");

const ultimaModificacao = document.querySelector(
    "#ultima-modificacao"
);

let quantidadeAvaliacoes = Number(
    localStorage.getItem("quantidadeAvaliacoes")
) || 0;

quantidadeAvaliacoes += 1;

localStorage.setItem(
    "quantidadeAvaliacoes",
    quantidadeAvaliacoes
);

contadorElemento.textContent = quantidadeAvaliacoes;

anoAtual.textContent = new Date().getFullYear();

ultimaModificacao.textContent =
    `Última modificação: ${document.lastModified}`;