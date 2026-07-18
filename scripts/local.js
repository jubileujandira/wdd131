// Footer

document.getElementById("currentyear").textContent = new Date().getFullYear();

document.getElementById("lastModified").textContent =
    "Last Modification: " + document.lastModified;


// Weather Values

const temperature = 8;
const windSpeed = 10;


// Wind Chill Function (Metric)

function calcularSensacaoTermica(temp, vento) {
    return (
        13.12 +
        (0.6215 * temp) -
        (11.37 * Math.pow(vento, 0.16)) +
        (0.3965 * temp * Math.pow(vento, 0.16))
    ).toFixed(1);
}


// Display Wind Chill

const windChill = document.getElementById("windChill");

if (temperature <= 10 && windSpeed > 4.8) {
    windChill.textContent = `${calcularSensacaoTermica(temperature, windSpeed)} °C`;
} else {
    windChill.textContent = "N/A";
}