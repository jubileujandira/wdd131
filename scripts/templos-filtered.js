const year = document.querySelector("#currentYear");

const lastModified = document.querySelector("#lastModified");


year.textContent = new Date().getFullYear();


lastModified.textContent = document.lastModified;



const menuButton = document.querySelector("#menuButton");

const menu = document.querySelector("#menu");



menuButton.addEventListener("click", () => {

    menu.classList.toggle("open");


    if(menu.classList.contains("open")){

        menuButton.textContent = "✖";

        menuButton.setAttribute(
            "aria-label",
            "Fechar menu"
        );

    } else {

        menuButton.textContent = "☰";

        menuButton.setAttribute(
            "aria-label",
            "Abrir menu"
        );

    }

});