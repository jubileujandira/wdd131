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
        imageUrl:
            "https://churchofjesuschristtemples.org/assets/img/temples/aba-nigeria-temple/aba-nigeria-temple-5087-main.jpg"
    },
    {
        templeName: "Manti Utah",
        location: "Manti, Utah, United States",
        dedicated: "1888, May, 21",
        area: 74792,
        imageUrl:
            "https://churchofjesuschristtemples.org/assets/img/temples/manti-utah-temple/manti-utah-temple-40551-main.jpg"
    },
    {
        templeName: "Payson Utah",
        location: "Payson, Utah, United States",
        dedicated: "2015, June, 7",
        area: 96630,
        imageUrl:
            "https://churchofjesuschristtemples.org/assets/img/temples/payson-utah-temple/payson-utah-temple-3849-main.jpg"
    },
    {
        templeName: "Yigo Guam",
        location: "Yigo, Guam",
        dedicated: "2020, May, 2",
        area: 6861,
        imageUrl:
            "https://churchofjesuschristtemples.org/assets/img/temples/yigo-guam-temple/yigo-guam-temple-2642-main.jpg"
    },
    {
        templeName: "Washington D.C.",
        location: "Kensington, Maryland, United States",
        dedicated: "1974, November, 19",
        area: 156558,
        imageUrl:
            "https://churchofjesuschristtemples.org/assets/img/temples/washington-d.c.-temple/washington-d.c.-temple-4007-main.jpg"
    },
    {
        templeName: "Lima Peru",
        location: "Lima, Peru",
        dedicated: "1986, January, 10",
        area: 9600,
        imageUrl:
            "https://churchofjesuschristtemples.org/assets/img/temples/lima-peru-temple/lima-peru-temple-1277-main.jpg"
    },
    {
        templeName: "Mexico City Mexico",
        location: "Mexico City, Mexico",
        dedicated: "1983, December, 2",
        area: 116642,
        imageUrl:
            "https://churchofjesuschristtemples.org/assets/img/temples/mexico-city-mexico-temple/mexico-city-mexico-temple-1567-main.jpg"
    },
    {
        templeName: "Recife Brazil",
        location: "Recife, Pernambuco, Brazil",
        dedicated: "2000, December, 15",
        area: 37200,
        imageUrl:
            "https://churchofjesuschristtemples.org/assets/img/temples/recife-brazil-temple/recife-brazil-temple-4367-main.jpg"
    },
    {
        templeName: "Fortaleza Brazil",
        location: "Fortaleza, Ceará, Brazil",
        dedicated: "2019, June, 2",
        area: 36000,
        imageUrl:
            "https://churchofjesuschristtemples.org/assets/img/temples/fortaleza-brazil-temple/fortaleza-brazil-temple-7843-main.jpg"
    },
    {
        templeName: "Belém Brazil",
        location: "Belém, Pará, Brazil",
        dedicated: "2022, November, 20",
        area: 28675,
        imageUrl:
            "https://churchofjesuschristtemples.org/assets/img/temples/belem-brazil-temple/belem-brazil-temple-21914-main.jpg"
    }
];
function displayTemples(templesToDisplay) {
    templeCards.innerHTML = "";

    templesToDisplay.forEach((temple) => {

        const card = document.createElement("article");
        card.classList.add("temple-card");

        card.innerHTML = `
            <h3>${temple.templeName}</h3>

            <p><span class="label">Localização:</span> ${temple.location}</p>

            <p><span class="label">Consagrado:</span> ${temple.dedicated}</p>

            <p><span class="label">Área:</span> ${temple.area.toLocaleString()} pés²</p>

            <img
                src="${temple.imageUrl}"
                alt="${temple.templeName}"
                loading="lazy"
                width="400"
                height="250">
        `;

        templeCards.appendChild(card);
    });
}

displayTemples(temples);

document.querySelector("#home").addEventListener("click", (event) => {
    event.preventDefault();
    pageTitle.textContent = "Todos os Templos";
    displayTemples(temples);
});

document.querySelector("#old").addEventListener("click", (event) => {
    event.preventDefault();

    pageTitle.textContent = "Templos Antigos";

    const filtered = temples.filter((temple) => {
        const year = Number(temple.dedicated.match(/\d{4}/)[0]);
        return year < 1900;
    });

    displayTemples(filtered);
});

document.querySelector("#new").addEventListener("click", (event) => {
    event.preventDefault();

    pageTitle.textContent = "Templos Novos";

    const filtered = temples.filter((temple) => {
        const year = Number(temple.dedicated.match(/\d{4}/)[0]);
        return year > 2000;
    });

    displayTemples(filtered);
});

document.querySelector("#large").addEventListener("click", (event) => {
    event.preventDefault();

    pageTitle.textContent = "Templos Grandes";

    const filtered = temples.filter((temple) => temple.area > 90000);

    displayTemples(filtered);
});

document.querySelector("#small").addEventListener("click", (event) => {
    event.preventDefault();

    pageTitle.textContent = "Templos Pequenos";

    const filtered = temples.filter((temple) => temple.area < 10000);

    displayTemples(filtered);
});