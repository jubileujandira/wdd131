import { db, autenticarAnonimamente } from "./firebase.js";

import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  serverTimestamp,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


/* =========================================
   FIREBASE
========================================= */

const reuniaoRef = doc(
  db,
  "reunioes",
  "reuniaoAtual"
);

let conectado = false;
let carregandoDados = false;
let temporizadorAutosave = null;


/* =========================================
   ELEMENTOS
========================================= */

const botoesMenu =
  document.querySelectorAll(".menu-item");

const telas =
  document.querySelectorAll(".tela");

const listaApoios =
  document.getElementById("listaApoios");

const listaDesobrigacoes =
  document.getElementById("listaDesobrigacoes");

const adicionarApoio =
  document.getElementById("adicionarApoio");

const adicionarDesobrigacao =
  document.getElementById("adicionarDesobrigacao");

const salvarReuniao =
  document.getElementById("salvarReuniao");

const finalizarReuniao =
  document.getElementById("finalizarReuniao");

const listaHistorico =
  document.getElementById("listaHistorico");

const contadorHistorico =
  document.getElementById("contadorHistorico");

const statusPonto =
  document.getElementById("statusPonto");

const statusTitulo =
  document.getElementById("statusTitulo");

const statusSalvamento =
  document.getElementById("statusSalvamento");

const dataTopo =
  document.getElementById("dataTopo");

const horaTopo =
  document.getElementById("horaTopo");

const modalHistorico =
  document.getElementById("modalHistorico");

const modalTitulo =
  document.getElementById("modalTitulo");

const modalCorpo =
  document.getElementById("modalCorpo");

const fecharModal =
  document.getElementById("fecharModal");


/* =========================================
   CAMPOS
========================================= */

const idsCampos = [
  "dataReuniao",
  "horarioReuniao",
  "preside",
  "dirige",
  "pianista",
  "regente",
  "hinoAbertura",
  "oracaoAbertura",
  "anuncios",
  "hinoSacramental",
  "discursante1",
  "tema1",
  "discursante2",
  "tema2",
  "hinoIntermediario",
  "discursante3",
  "tema3",
  "hinoEncerramento",
  "oracaoEncerramento",
  "observacoes"
];


/* =========================================
   FUNÇÕES BÁSICAS
========================================= */

function hojeISO() {

  const agora = new Date();

  const ano =
    agora.getFullYear();

  const mes =
    String(
      agora.getMonth() + 1
    ).padStart(2, "0");

  const dia =
    String(
      agora.getDate()
    ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}


function formatarData(data) {

  if (!data) {
    return "Data da reunião";
  }

  const partes =
    data.split("-");

  if (partes.length !== 3) {
    return data;
  }

  return (
    `${partes[2]}/` +
    `${partes[1]}/` +
    `${partes[0]}`
  );
}


function escaparHTML(texto) {

  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function valor(id) {

  const campo =
    document.getElementById(id);

  if (!campo) {
    return "";
  }

  return campo.value.trim();
}


/* =========================================
   STATUS
========================================= */

function atualizarStatus(
  titulo,
  mensagem,
  tipo = "ok"
) {

  if (statusTitulo) {
    statusTitulo.textContent = titulo;
  }

  if (statusSalvamento) {
    statusSalvamento.textContent = mensagem;
  }

  if (!statusPonto) {
    return;
  }

  if (tipo === "erro") {

    statusPonto.style.background =
      "#ef4444";

  } else if (tipo === "salvando") {

    statusPonto.style.background =
      "#f59e0b";

  } else {

    statusPonto.style.background =
      "#22c55e";

  }
}


/* =========================================
   CABEÇALHO
========================================= */

function atualizarCabecalho() {

  const data =
    valor("dataReuniao");

  const horario =
    valor("horarioReuniao");

  if (dataTopo) {

    dataTopo.textContent =
      formatarData(data);

  }

  if (horaTopo) {

    horaTopo.textContent =
      horario || "--:--";

  }
}


/* =========================================
   REUNIÃO VAZIA
========================================= */

function criarReuniaoVazia() {

  return {

    dataReuniao: hojeISO(),

    horarioReuniao: "09:00",

    preside: "",
    dirige: "",
    pianista: "",
    regente: "",

    hinoAbertura: "",
    oracaoAbertura: "",

    anuncios: "",

    apoios: [],

    desobrigacoes: [],

    hinoSacramental: "",

    discursante1: "",
    tema1: "",

    discursante2: "",
    tema2: "",

    hinoIntermediario: "",

    discursante3: "",
    tema3: "",

    hinoEncerramento: "",
    oracaoEncerramento: "",

    observacoes: "",

    finalizada: false

  };

}


/* =========================================
   APOIOS / DESOBRIGAÇÕES
========================================= */

function criarLinhaRegistro(
  container,
  dados = {}
) {

  if (!container) {
    return;
  }

  const linha =
    document.createElement("div");

  linha.className =
    "linha-registro";


  const numero =
    document.createElement("span");

  numero.className =
    "registro-numero";


  const nome =
    document.createElement("input");

  nome.type = "text";

  nome.placeholder =
    "Nome do membro";

  nome.value =
    dados.nome || "";


  const chamado =
    document.createElement("input");

  chamado.type = "text";

  chamado.placeholder =
    "Chamado";

  chamado.value =
    dados.chamado || "";


  const remover =
    document.createElement("button");

  remover.type = "button";

  remover.className =
    "botao-remover";

  remover.textContent = "×";

  remover.setAttribute(
    "aria-label",
    "Remover"
  );


  nome.addEventListener(
    "input",
    agendarAutosave
  );

  chamado.addEventListener(
    "input",
    agendarAutosave
  );


  remover.addEventListener(
    "click",
    () => {

      linha.remove();

      atualizarNumeracao(
        container
      );

      agendarAutosave();

    }
  );


  linha.appendChild(numero);

  linha.appendChild(nome);

  linha.appendChild(chamado);

  linha.appendChild(remover);

  container.appendChild(linha);

  atualizarNumeracao(container);

}


function atualizarNumeracao(container) {

  const linhas =
    container.querySelectorAll(
      ".linha-registro"
    );

  linhas.forEach(
    (linha, indice) => {

      const numero =
        linha.querySelector(
          ".registro-numero"
        );

      if (numero) {

        numero.textContent =
          indice + 1;

      }

    }
  );

}


/*
  IMPORTANTE:
  Mantemos inclusive as linhas vazias.

  Isso impede que uma linha recém-adicionada em
  Apoios ou Desobrigações desapareça quando o
  Firebase fizer a sincronização em tempo real.
*/

function coletarLista(container) {

  if (!container) {
    return [];
  }

  return [
    ...container.querySelectorAll(
      ".linha-registro"
    )
  ]
    .map((linha) => {

      const inputs =
        linha.querySelectorAll(
          "input"
        );

      return {

        nome:
          inputs[0]
            ? inputs[0].value.trim()
            : "",

        chamado:
          inputs[1]
            ? inputs[1].value.trim()
            : ""

      };

    });

}


function preencherLista(
  container,
  itens = []
) {

  if (!container) {
    return;
  }

  container.innerHTML = "";

  itens.forEach(
    (item) => {

      if (
        typeof item === "string"
      ) {

        criarLinhaRegistro(
          container,
          {
            nome: item,
            chamado: ""
          }
        );

      } else {

        criarLinhaRegistro(
          container,
          item
        );

      }

    }
  );

}


/* =========================================
   COLETAR DADOS
========================================= */

function coletarReuniao() {

  const reuniao =
    criarReuniaoVazia();

  idsCampos.forEach(
    (id) => {

      reuniao[id] =
        valor(id);

    }
  );

  reuniao.apoios =
    coletarLista(
      listaApoios
    );

  reuniao.desobrigacoes =
    coletarLista(
      listaDesobrigacoes
    );

  reuniao.finalizada =
    false;

  return reuniao;

}


/* =========================================
   PREENCHER FORMULÁRIO
========================================= */

function preencherFormulario(
  reuniao
) {

  carregandoDados = true;

  idsCampos.forEach(
    (id) => {

      const campo =
        document.getElementById(id);

      if (campo) {

        campo.value =
          reuniao?.[id] ?? "";

      }

    }
  );


  preencherLista(
    listaApoios,
    reuniao?.apoios || []
  );


  preencherLista(
    listaDesobrigacoes,
    reuniao?.desobrigacoes || []
  );


  atualizarCabecalho();

  carregandoDados = false;

}


/* =========================================
   SALVAR FIREBASE
========================================= */

async function salvarNaNuvem(
  mostrarMensagem = false
) {

  if (
    !conectado ||
    carregandoDados
  ) {

    return;

  }

  try {

    atualizarStatus(
      "Reunião em edição",
      "Salvando na nuvem...",
      "salvando"
    );


    const reuniao =
      coletarReuniao();


    await setDoc(
      reuniaoRef,
      {
        ...reuniao,

        atualizadoEm:
          serverTimestamp()
      },
      {
        merge: true
      }
    );


    atualizarStatus(
      "Reunião em edição",
      "Sincronizado em tempo real",
      "ok"
    );


    if (mostrarMensagem) {

      alert(
        "Reunião salva na nuvem com sucesso."
      );

    }

  } catch (erro) {

    console.error(
      "Erro ao salvar:",
      erro
    );


    atualizarStatus(
      "Erro de sincronização",
      "Não foi possível salvar",
      "erro"
    );


    if (mostrarMensagem) {

      alert(
        "Não foi possível salvar a reunião."
      );

    }

  }

}


function agendarAutosave() {

  atualizarCabecalho();

  if (
    !conectado ||
    carregandoDados
  ) {

    return;

  }


  atualizarStatus(
    "Reunião em edição",
    "Salvando...",
    "salvando"
  );


  clearTimeout(
    temporizadorAutosave
  );


  temporizadorAutosave =
    setTimeout(
      () => {

        salvarNaNuvem(false);

      },
      700
    );

}


/* =========================================
   HISTÓRICO
========================================= */

function textoOuTraco(texto) {

  if (!texto) {
    return "—";
  }

  return escaparHTML(texto);

}


function renderizarListaAta(
  titulo,
  itens
) {

  if (
    !Array.isArray(itens) ||
    itens.length === 0
  ) {

    return `
      <div class="ata-secao">
        <h3>${escaparHTML(titulo)}</h3>
        <p>—</p>
      </div>
    `;

  }


  const linhas =
    itens
      .filter(
        (item) => {

          if (
            typeof item === "string"
          ) {

            return item.trim();

          }

          return (
            item?.nome ||
            item?.chamado
          );

        }
      )
      .map(
        (item) => {

          if (
            typeof item === "string"
          ) {

            return `
              <li>
                ${escaparHTML(item)}
              </li>
            `;

          }

          const nome =
            escaparHTML(
              item.nome || ""
            );

          const chamado =
            escaparHTML(
              item.chamado || ""
            );

          return `
            <li>
              ${nome}
              ${
                chamado
                  ? ` — ${chamado}`
                  : ""
              }
            </li>
          `;

        }
      )
      .join("");


  if (!linhas) {

    return `
      <div class="ata-secao">

        <h3>
          ${escaparHTML(titulo)}
        </h3>

        <p>—</p>

      </div>
    `;

  }


  return `
    <div class="ata-secao">

      <h3>
        ${escaparHTML(titulo)}
      </h3>

      <ul>
        ${linhas}
      </ul>

    </div>
  `;

}


function abrirAta(reuniao) {

  if (
    !modalHistorico ||
    !modalTitulo ||
    !modalCorpo
  ) {

    return;

  }


  modalTitulo.textContent =
    `Reunião Sacramental — ${
      formatarData(
        reuniao.dataReuniao
      )
    }`;


  modalCorpo.innerHTML = `

    <div class="ata-secao">

      <h3>
        Dados da reunião
      </h3>

      <p>
        <strong>Horário:</strong>
        ${textoOuTraco(
          reuniao.horarioReuniao
        )}
      </p>

      <p>
        <strong>Preside:</strong>
        ${textoOuTraco(
          reuniao.preside
        )}
      </p>

      <p>
        <strong>Dirige:</strong>
        ${textoOuTraco(
          reuniao.dirige
        )}
      </p>

      <p>
        <strong>Pianista:</strong>
        ${textoOuTraco(
          reuniao.pianista
        )}
      </p>

      <p>
        <strong>Regente:</strong>
        ${textoOuTraco(
          reuniao.regente
        )}
      </p>

    </div>


    <div class="ata-secao">

      <h3>Abertura</h3>

      <p>
        <strong>Hino:</strong>
        ${textoOuTraco(
          reuniao.hinoAbertura
        )}
      </p>

      <p>
        <strong>Oração:</strong>
        ${textoOuTraco(
          reuniao.oracaoAbertura
        )}
      </p>

    </div>


    <div class="ata-secao">

      <h3>Assuntos da Ala</h3>

      <p>
        <strong>Anúncios:</strong>
        ${textoOuTraco(
          reuniao.anuncios
        )}
      </p>

    </div>


    ${renderizarListaAta(
      "Apoios",
      reuniao.apoios
    )}


    ${renderizarListaAta(
      "Desobrigações",
      reuniao.desobrigacoes
    )}


    <div class="ata-secao">

      <h3>
        Administração do Sacramento
      </h3>

      <p>
        <strong>
          Hino sacramental:
        </strong>

        ${textoOuTraco(
          reuniao.hinoSacramental
        )}
      </p>

    </div>


    <div class="ata-secao">

      <h3>Discursos</h3>

      <p>
        <strong>1º discursante:</strong>

        ${textoOuTraco(
          reuniao.discursante1
        )}

        —
        ${textoOuTraco(
          reuniao.tema1
        )}
      </p>

      <p>
        <strong>2º discursante:</strong>

        ${textoOuTraco(
          reuniao.discursante2
        )}

        —
        ${textoOuTraco(
          reuniao.tema2
        )}
      </p>

      <p>
        <strong>
          Hino intermediário:
        </strong>

        ${textoOuTraco(
          reuniao.hinoIntermediario
        )}
      </p>

      <p>
        <strong>3º discursante:</strong>

        ${textoOuTraco(
          reuniao.discursante3
        )}

        —
        ${textoOuTraco(
          reuniao.tema3
        )}
      </p>

    </div>


    <div class="ata-secao">

      <h3>Encerramento</h3>

      <p>
        <strong>Hino:</strong>

        ${textoOuTraco(
          reuniao.hinoEncerramento
        )}
      </p>

      <p>
        <strong>Oração:</strong>

        ${textoOuTraco(
          reuniao.oracaoEncerramento
        )}
      </p>

    </div>


    <div class="ata-secao">

      <h3>Observações</h3>

      <p>
        ${textoOuTraco(
          reuniao.observacoes
        )}
      </p>

    </div>

  `;


  modalHistorico.classList.remove(
    "oculto"
  );

}


function fecharAta() {

  if (modalHistorico) {

    modalHistorico.classList.add(
      "oculto"
    );

  }

}


function renderizarHistorico(
  snapshot
) {

  if (
    !listaHistorico ||
    !contadorHistorico
  ) {

    return;

  }


  const reunioes = [];


  snapshot.forEach(
    (documento) => {

      reunioes.push({
        id: documento.id,
        ...documento.data()
      });

    }
  );


  contadorHistorico.textContent =
    `${reunioes.length} ${
      reunioes.length === 1
        ? "reunião"
        : "reuniões"
    }`;


  if (
    reunioes.length === 0
  ) {

    listaHistorico.innerHTML = `
      <div class="historico-vazio">
        Nenhuma reunião finalizada ainda.
      </div>
    `;

    return;

  }


  listaHistorico.innerHTML = "";


  reunioes.forEach(
    (reuniao) => {

      const item =
        document.createElement(
          "article"
        );

      item.className =
        "historico-item";


      item.innerHTML = `

        <div>

          <strong>
            ${escaparHTML(
              formatarData(
                reuniao.dataReuniao
              )
            )}
          </strong>

          <span>
            ${escaparHTML(
              reuniao.horarioReuniao ||
              ""
            )}
          </span>

        </div>


        <button
          type="button"
          class="botao-visualizar"
        >
          Visualizar ata
        </button>

      `;


      const botao =
        item.querySelector("button");


      botao.addEventListener(
        "click",
        () => {

          abrirAta(reuniao);

        }
      );


      listaHistorico.appendChild(
        item
      );

    }
  );

}


/* =========================================
   FINALIZAR
========================================= */

async function finalizar() {

  if (!conectado) {

    alert(
      "Aguarde a conexão com o Firebase."
    );

    return;

  }


  const reuniao =
    coletarReuniao();


  if (!reuniao.dataReuniao) {

    alert(
      "Informe a data da reunião antes de finalizar."
    );

    return;

  }


  const confirmar =
    confirm(
      "Deseja realmente finalizar esta reunião?\n\n" +
      "Ela será enviada ao Histórico e ficará " +
      "bloqueada para edição."
    );


  if (!confirmar) {
    return;
  }


  try {

    atualizarStatus(
      "Finalizando reunião",
      "Salvando ata...",
      "salvando"
    );


    const historicoRef =
      doc(
        collection(
          db,
          "historico"
        )
      );


    await runTransaction(
      db,
      async (transacao) => {

        const snapshot =
          await transacao.get(
            reuniaoRef
          );


        const dadosFirebase =
          snapshot.exists()
            ? snapshot.data()
            : {};


        const ataFinal = {

          ...dadosFirebase,

          ...reuniao,

          finalizada: true,

          finalizadaEm:
            serverTimestamp()

        };


        const novaReuniao = {

          ...criarReuniaoVazia(),

          atualizadoEm:
            serverTimestamp()

        };


        transacao.set(
          historicoRef,
          ataFinal
        );


        transacao.set(
          reuniaoRef,
          novaReuniao
        );

      }
    );


    atualizarStatus(
      "Reunião em edição",
      "Sincronizado em tempo real",
      "ok"
    );


    alert(
      "Reunião finalizada com sucesso.\n\n" +
      "A ata foi enviada ao Histórico."
    );


    const botaoHistorico =
      document.querySelector(
        '[data-tela="historico"]'
      );


    if (botaoHistorico) {

      botaoHistorico.click();

    }

  } catch (erro) {

    console.error(
      "Erro ao finalizar:",
      erro
    );


    atualizarStatus(
      "Erro",
      "Não foi possível finalizar",
      "erro"
    );


    alert(
      "Não foi possível finalizar a reunião."
    );

  }

}


/* =========================================
   MENU
========================================= */

function configurarMenu() {

  botoesMenu.forEach(
    (botao) => {

      botao.addEventListener(
        "click",
        () => {

          const destino =
            botao.dataset.tela;


          botoesMenu.forEach(
            (item) => {

              item.classList.remove(
                "ativo"
              );

            }
          );


          botao.classList.add(
            "ativo"
          );


          telas.forEach(
            (tela) => {

              tela.classList.remove(
                "ativa"
              );

            }
          );


          const telaDestino =
            document.getElementById(
              `tela-${destino}`
            );


          if (telaDestino) {

            telaDestino.classList.add(
              "ativa"
            );

          }

        }
      );

    }
  );

}


/* =========================================
   EVENTOS
========================================= */

function configurarEventos() {

  idsCampos.forEach(
    (id) => {

      const campo =
        document.getElementById(id);


      if (campo) {

        campo.addEventListener(
          "input",
          agendarAutosave
        );


        campo.addEventListener(
          "change",
          agendarAutosave
        );

      }

    }
  );


  if (adicionarApoio) {

    adicionarApoio.addEventListener(
      "click",
      () => {

        criarLinhaRegistro(
          listaApoios
        );

        agendarAutosave();

      }
    );

  }


  if (adicionarDesobrigacao) {

    adicionarDesobrigacao.addEventListener(
      "click",
      () => {

        criarLinhaRegistro(
          listaDesobrigacoes
        );

        agendarAutosave();

      }
    );

  }


  if (salvarReuniao) {

    salvarReuniao.addEventListener(
      "click",
      () => {

        salvarNaNuvem(true);

      }
    );

  }


  if (finalizarReuniao) {

    finalizarReuniao.addEventListener(
      "click",
      finalizar
    );

  }


  if (fecharModal) {

    fecharModal.addEventListener(
      "click",
      fecharAta
    );

  }


  if (modalHistorico) {

    const fundo =
      modalHistorico.querySelector(
        ".modal-fundo"
      );


    if (fundo) {

      fundo.addEventListener(
        "click",
        fecharAta
      );

    }

  }


  document.addEventListener(
    "keydown",
    (evento) => {

      if (
        evento.key === "Escape"
      ) {

        fecharAta();

      }

    }
  );

}


/* =========================================
   CRIAR REUNIÃO INICIAL
========================================= */

async function garantirReuniaoAtual() {

  const snapshot =
    await getDoc(
      reuniaoRef
    );


  if (snapshot.exists()) {

    return;

  }


  await setDoc(
    reuniaoRef,
    {
      ...criarReuniaoVazia(),

      atualizadoEm:
        serverTimestamp()
    }
  );

}


/* =========================================
   TEMPO REAL
========================================= */

function iniciarTempoReal() {

  onSnapshot(
    reuniaoRef,

    (snapshot) => {

      if (!snapshot.exists()) {
        return;
      }


      preencherFormulario(
        snapshot.data()
      );


      conectado = true;


      atualizarStatus(
        "Reunião em edição",
        "Sincronizado em tempo real",
        "ok"
      );

    },

    (erro) => {

      console.error(
        "Erro na reunião em tempo real:",
        erro
      );


      conectado = false;


      atualizarStatus(
        "Sem conexão",
        "Falha na sincronização",
        "erro"
      );

    }
  );


  const consultaHistorico =
    query(
      collection(
        db,
        "historico"
      ),

      orderBy(
        "dataReuniao",
        "desc"
      )
    );


  onSnapshot(
    consultaHistorico,

    (snapshot) => {

      renderizarHistorico(
        snapshot
      );

    },

    (erro) => {

      console.error(
        "Erro no histórico:",
        erro
      );

    }
  );

}


/* =========================================
   INICIALIZAÇÃO
========================================= */

async function iniciar() {

  configurarMenu();

  configurarEventos();

  atualizarCabecalho();


  atualizarStatus(
    "Conectando",
    "Conectando ao Firebase...",
    "salvando"
  );


  try {

    await autenticarAnonimamente();


    await garantirReuniaoAtual();


    iniciarTempoReal();


    console.log(
      "Firebase conectado com sucesso."
    );

  } catch (erro) {

    console.error(
      "Erro ao iniciar Firebase:",
      erro
    );


    atualizarStatus(
      "Erro de conexão",
      "Firebase indisponível",
      "erro"
    );


    alert(
      "Não foi possível conectar ao Firebase."
    );

  }

}


iniciar();