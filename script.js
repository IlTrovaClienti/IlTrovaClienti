const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaX-3LmEul1O2Zv6-_1eyg4bmZBhl6EvfhyD9OiGZZ_jE3yjFwkyuWKRodR3GCvG_wTGx4JnvCIGud/pub?output=csv";

let clientiVisibili = 5;
let tuttiClienti = [];

fetch(sheetURL)
  .then(res => res.text())
  .then(data => {
    const righe = data.split("\n").slice(1);
    tuttiClienti = righe.map(r => r.split(",")).filter(r => r.length > 1);
    mostraClienti();
  });

function mostraClienti() {
  const contenitore = document.getElementById("clienti-container");
  contenitore.innerHTML = "";
  const visibili = tuttiClienti.slice(0, clientiVisibili);
  visibili.forEach(c => {
    const div = document.createElement("div");
    div.className = "client-item";
    div.innerHTML = `<strong>${c[0]}</strong><br>${c[1]} - ${c[2]} - ${c[3] || ''}`;
    contenitore.appendChild(div);
  });
}

document.getElementById("mostra-altri").addEventListener("click", () => {
  clientiVisibili += 5;
  mostraClienti();
});
