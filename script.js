const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaX-3LmEul1O2Zv6-_1eyg4bmZBhl6EvfhyD9OiGZZ_jE3yjFwkyuWKRodR3GCvG_wTGx4JnvCIGud/pub?output=csv";

let crediti = 8;
let clienti = [];
let carrello = [];
const prezzi = { chiamare: 40, appuntamento: 80 };

function aggiornaUI() {
  document.getElementById("crediti").textContent = crediti;
  let totale = carrello.reduce((acc, c) => acc + c.prezzo, 0);
  document.getElementById("totaleCarrello").textContent = totale;
  const ul = document.getElementById("carrello");
  ul.innerHTML = "";
  carrello.forEach((c, i) => {
    const li = document.createElement("li");
    li.textContent = `${c.nome} – €${c.prezzo}`;
    ul.appendChild(li);
  });
}

function caricaDati() {
  fetch(sheetURL)
    .then(r => r.text())
    .then(text => {
      const righe = text.split("\n").slice(1);
      clienti = righe.map(r => {
        const [nome, regione, citta, categoria, tipo, valore] = r.split(",");
        return { nome, regione, citta, categoria, tipo, valore: parseFloat(valore) };
      });
      mostraClienti();
    });
}

function mostraClienti() {
  const container = document.getElementById("clienti-container");
  container.innerHTML = "";
  clienti.forEach((c, i) => {
    const box = document.createElement("div");
    box.className = "client-item";
    const prezzo = c.tipo.toLowerCase() === "chiamare" ? prezzi.chiamare :
                   c.tipo.toLowerCase() === "appuntamento" ? prezzi.appuntamento :
                   c.tipo.toLowerCase() === "contratto" ? c.valore * 0.1 : 0;
    const btn = document.createElement("button");
    btn.textContent = "Acquisisci Cliente";
    btn.onclick = () => {
      if (crediti * 40 < prezzo) {
        alert("Credito insufficiente!");
        return;
      }
      crediti -= Math.ceil(prezzo / 40);
      carrello.push({ nome: c.nome, prezzo: prezzo });
      aggiornaUI();
      btn.disabled = true;
    };
    box.innerHTML = `<strong>${c.nome}</strong><br>
      📍 ${c.regione}, ${c.citta} | 💬 ${c.tipo} | 💶 €${c.valore}<br>
      Prezzo: €${prezzo.toFixed(2)}<br>`;
    box.appendChild(btn);
    container.appendChild(box);
  });
}

function ricarica(qty) {
  crediti += qty;
  aggiornaUI();
  chiudiModal();
}

function chiudiModal() {
  document.getElementById("modal").classList.add("hidden");
}
document.getElementById("ricaricaBtn").onclick = () => {
  document.getElementById("modal").classList.remove("hidden");
};

caricaDati();
aggiornaUI();
