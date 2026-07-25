const currentYear = document.querySelector("#currentyear");
const lastModified = document.querySelector("#lastModified");
const menuButton = document.querySelector("#menuButton");
const menu = document.querySelector("#menu");
const templeCards = document.querySelector("#templeCards");
const pageTitle = document.querySelector("#pageTitle");

currentYear.textContent = new Date().getFullYear();
lastModified.textContent = document.lastModified;

menuButton.addEventListener("click", () => {
    menu.classList.toggle("open");

    const menuIsOpen = menu.classList.contains("open");

    menuButton.textContent = menuIsOpen ? "✖" : "☰";
    menuButton.setAttribute(
        "aria-label",
        menuIsOpen ? "Fechar menu" : "Abrir menu"
    );
    menuButton.setAttribute("aria-expanded", menuIsOpen);
});

const temples = [
    {
        templeName: "Aba Nigeria",
        location: "Aba, Nigeria",
        dedicated: "2005, August, 7",
        area: 11500,
        imageUrl: "imagens/aba-nigeria.jpg"
    },
    {
        templeName: "Manti Utah",
        location: "Manti, Utah, United States",
        dedicated: "1888, May, 21",
        area: 74792,
        imageUrl: "imagens/manti-utah.jpg"
    },
    {
        templeName: "Payson Utah",
        location: "Payson, Utah, United States",
        dedicated: "2015, June, 7",
        area: 96630,
        imageUrl: "imagens/payson-utah.jpg"
    },
    {
        templeName: "Yigo Guam",
        location: "Yigo, Guam",
        dedicated: "2020, May, 2",
        area: 6861,
        imageUrl: "imagens/yigo-guam.jpg"
    },
    {
        templeName: "Washington D.C.",
        location: "Kensington, Maryland, United States",
        dedicated: "1974, November, 19",
        area: 156558,
        imageUrl: "imagens/washington-dc.jpg"
    },
    {
        templeName: "Lima Peru",
        location: "Lima, Peru",
        dedicated: "1986, January, 10",
        area: 9600,
        imageUrl: "imagens/lima-peru.jpg"
    },
    {
        templeName: "Mexico City Mexico",
        location: "Mexico City, Mexico",
        dedicated: "1983, December, 2",
        area: 116642,
        imageUrl: "imagens/mexico-city.jpg"
    },
    {
        templeName: "Recife Brazil",
        location: "Recife, Pernambuco, Brazil",
        dedicated: "2000, December, 15",
        area: 37200,
        imageUrl: "imagens/recife.jpg"
    },
    {
        templeName: "Fortaleza Brazil",
        location: "Fortaleza, Ceará, Brazil",
        dedicated: "2019, June, 2",
        area: 36000,
        imageUrl: "imagens/fortaleza.jpg"
    },
    {
        templeName: "Belém Brazil",
        location: "Belém, Pará, Brazil",
        dedicated: "2022, November, 20",
        area: 28675,
        imageUrl: "imagens/belem.jpg"
    }
];

function displayTemples(templesToDisplay) {
    templeCards.innerHTML = "";

    templesToDisplay.forEach((temple) => {
        const card = document.createElement("article");
        card.classList.add("temple-card");

        const templeName = document.createElement("h2");
        templeName.textContent = temple.templeName;

        const location = document.createElement("p");
        location.innerHTML = `
            <span class="label">Localização:</span>
            ${temple.location}
        `;

        const dedicated = document.createElement("p");
        dedicated.innerHTML = `
            <span class="label">Consagrado:</span>
            ${temple.dedicated}
        `;

        const area = document.createElement("p");
        area.innerHTML = `
            <span class="label">Área:</span>
            ${temple.area.toLocaleString("pt-BR")} pés²
        `;

        const image = document.createElement("img");
        image.src = temple.imageUrl;
        image.alt = `Templo de ${temple.templeName}`;
        image.loading = "lazy";
        image.width = 400;
        image.height = 250;

        card.appendChild(templeName);
        card.appendChild(location);
        card.appendChild(dedicated);
        card.appendChild(area);
        card.appendChild(image);

        templeCards.appendChild(card);
    });
}

function closeMobileMenu() {
    menu.classList.remove("open");
    menuButton.textContent = "☰";
    menuButton.setAttribute("aria-label", "Abrir menu");
    menuButton.setAttribute("aria-expanded", "false");
}

function getDedicationYear(temple) {
    return Number(temple.dedicated.match(/\d{4}/)[0]);
}

function applyFilter(title, filteredTemples) {
    pageTitle.textContent = title;
    displayTemples(filteredTemples);
    closeMobileMenu();
}

document.querySelector("#home").addEventListener("click", (event) => {
    event.preventDefault();

    applyFilter("Todos os Templos", temples);
});

document.querySelector("#old").addEventListener("click", (event) => {
    event.preventDefault();

    const oldTemples = temples.filter(
        (temple) => getDedicationYear(temple) < 1900
    );

    applyFilter("Templos Antigos", oldTemples);
});

document.querySelector("#new").addEventListener("click", (event) => {
    event.preventDefault();

    const newTemples = temples.filter(
        (temple) => getDedicationYear(temple) > 2000
    );

    applyFilter("Templos Novos", newTemples);
});

document.querySelector("#large").addEventListener("click", (event) => {
    event.preventDefault();

    const largeTemples = temples.filter(
        (temple) => temple.area > 90000
    );

    applyFilter("Templos Grandes", largeTemples);
});

document.querySelector("#small").addEventListener("click", (event) => {
    event.preventDefault();

    const smallTemples = temples.filter(
        (temple) => temple.area < 10000
    );

    applyFilter("Templos Pequenos", smallTemples);
});

displayTemples(temples);