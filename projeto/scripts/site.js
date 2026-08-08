const menuButton = document.querySelector("#menuButton");
const mainNav = document.querySelector("#mainNav");
const currentYear = document.querySelector("#currentYear");

if (currentYear) {
    currentYear.textContent = `${new Date().getFullYear()}`;
}

if (menuButton && mainNav) {
    menuButton.addEventListener("click", () => {
        const isOpen = mainNav.classList.toggle("open");

        menuButton.setAttribute("aria-expanded", `${isOpen}`);
        menuButton.textContent = isOpen ? `✕` : `☰`;
    });
}


const topics = [
    {
        title: `Apostas esportivas`,
        icon: `⚽`,
        description: `Conheça os principais mercados esportivos e entenda como funcionam as apostas em diferentes eventos.`,
        link: `esportes.html`
    },
    {
        title: `Odds e probabilidades`,
        icon: `📊`,
        description: `Entenda o significado das odds e como elas representam a cotação de uma seleção.`,
        link: `esportes.html`
    },
    {
        title: `Jogo responsável`,
        icon: `🛡️`,
        description: `Conheça práticas importantes para manter as apostas como uma forma de entretenimento responsável.`,
        link: `cassino.html`
    }
];


function createTopicCard(topic) {
    return `
        <article class="card">
            <span class="topic-icon" aria-hidden="true">
                ${topic.icon}
            </span>

            <h3>${topic.title}</h3>

            <p>${topic.description}</p>

            <a class="text-link" href="${topic.link}">
                Saiba mais →
            </a>
        </article>
    `;
}


function renderTopics() {
    const topicCards = document.querySelector("#topicCards");

    if (topicCards) {
        topicCards.innerHTML = topics
            .map(createTopicCard)
            .join(``);
    }
}


renderTopics();

function calculatePotentialReturn() {
    const stakeInput = document.querySelector("#stake");
    const oddInput = document.querySelector("#odd");
    const result = document.querySelector("#returnResult");

    if (!stakeInput || !oddInput || !result) {
        return;
    }

    const stake = Number(stakeInput.value);
    const odd = Number(oddInput.value);

    if (stake > 0 && odd > 1) {
        const total = stake * odd;

        result.textContent =
            `Retorno bruto potencial: R$ ${total.toFixed(2).replace(`.`, `,`)}.`;
    } else {
        result.textContent =
            `Informe um valor maior que zero e uma odd superior a 1.00.`;
    }
}


function saveFavoriteTopic() {
    const favoriteTopic = document.querySelector("#favoriteTopic");
    const favoriteMessage = document.querySelector("#favoriteMessage");

    if (!favoriteTopic || !favoriteMessage) {
        return;
    }

    if (favoriteTopic.value) {
        localStorage.setItem(
            `gingaFavoriteTopic`,
            favoriteTopic.value
        );

        favoriteMessage.textContent =
            `Preferência salva: ${favoriteTopic.value}.`;
    } else {
        favoriteMessage.textContent =
            `Selecione um tema antes de salvar.`;
    }
}


function loadFavoriteTopic() {
    const favoriteTopic = document.querySelector("#favoriteTopic");
    const favoriteMessage = document.querySelector("#favoriteMessage");

    const savedTopic =
        localStorage.getItem(`gingaFavoriteTopic`);

    if (favoriteTopic && favoriteMessage && savedTopic) {
        favoriteTopic.value = savedTopic;

        favoriteMessage.textContent =
            `Sua preferência salva é: ${savedTopic}.`;
    }
}


const calculateButton =
    document.querySelector("#calculateReturn");

if (calculateButton) {
    calculateButton.addEventListener(
        "click",
        calculatePotentialReturn
    );
}


const saveFavoriteButton =
    document.querySelector("#saveFavorite");

if (saveFavoriteButton) {
    saveFavoriteButton.addEventListener(
        "click",
        saveFavoriteTopic
    );
}


loadFavoriteTopic();
function handleKnowledgeForm(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const nameInput = document.querySelector("#name");
    const selectedPractice = document.querySelector(
        `input[name="practice"]:checked`
    );
    const formMessage = document.querySelector("#formMessage");

    if (!nameInput || !selectedPractice || !formMessage) {
        return;
    }

    const userName = nameInput.value.trim();

    if (selectedPractice.value === `limites`) {
        formMessage.textContent =
            `Parabéns, ${userName}! Você identificou corretamente uma prática de jogo responsável.`;
    } else {
        formMessage.textContent =
            `${userName}, revise a seção sobre jogo responsável. Definir limites de tempo e orçamento é a alternativa correta.`;
    }

    const submissions =
        Number(localStorage.getItem(`gingaFormSubmissions`)) || 0;

    localStorage.setItem(
        `gingaFormSubmissions`,
        `${submissions + 1}`
    );

    form.reset();
}


const knowledgeForm =
    document.querySelector("#knowledgeForm");

if (knowledgeForm) {
    knowledgeForm.addEventListener(
        "submit",
        handleKnowledgeForm
    );
}