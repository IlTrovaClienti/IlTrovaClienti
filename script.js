let crediti = 8;
const euroDisplay = document.getElementById("euro");
const creditiDisplay = document.getElementById("crediti");
const clientiContainer = document.getElementById("clientiContainer");
const carrello = document.getElementById("carrello");
const totaleDisplay = document.getElementById("totale");

const leadPrezzi = {
  "Lead da chiamare": 40,
  "Appuntamento": 80,
  "Contratto": null
};
const carrelloState = [];
const acquisitiGlobali = new Set();

function aggiornaCreditiDisplay() {
  creditiDisplay.textContent = crediti;
  euroDisplay.textContent = "€" + (crediti * 40).toFixed(2);
}

function aggiungiAlCarrello(cliente, prezzo, btn) {
  if (carrelloState.includes(cliente.id)) return;
  carrelloState.push(cliente.id);
  const li = document.createElement("li");
  li.textContent = cliente.titolo + " – " + cliente.citta + " – €" + prezzo.toFixed(2);
  const btnAnnulla = document.createElement("button");
  btnAnnulla.textContent = "Annulla";
  btnAnnulla.className = "annulla";
  btnAnnulla.onclick = () => {
    carrello.removeChild(li);
    carrelloState.splice(carrelloState.indexOf(cliente.id), 1);
    crediti += prezzo / 40;
    aggiornaCreditiDisplay();
    btn.disabled = false;
    btn.textContent = "Acquisisci Cliente";
    btn.className = "acquisisci";
    acquisitiGlobali.delete(cliente.id);
    aggiornaTotale();
  };
  li.appendChild(btnAnnulla);
  carrello.appendChild(li);
  acquisitiGlobali.add(cliente.id);
  aggiornaTotale();
}

function aggiornaTotale() {
  let totale = 0;
  for (const id of carrelloState) {
    const tipo = document.getElementById("btn-" + id).dataset.tipo;
    totale += leadPrezzi[tipo] || 0;
  }
  totaleDisplay.textContent = "€" + totale.toFixed(2);
}

function creaCliente(cliente) {
  const div = document.createElement("div");
  div.className = "cliente";
  const h3 = document.createElement("h3");
  h3.textContent = cliente.titolo;
  const p = document.createElement("p");
  p.textContent = "📍 " + cliente.regione + ", " + cliente.citta + " | 💬 " + cliente.tipo + " | 🧾 €" + cliente.budget;

  const prezzo = leadPrezzi[cliente.tipo] || (parseFloat(cliente.budget) * 0.1);
  const prezzoAcquisto = document.createElement("p");
  prezzoAcquisto.innerHTML = "<strong>Prezzo Acquisto:</strong> €" + prezzo.toFixed(2);

  const btn = document.createElement("button");
  btn.textContent = "Acquisisci Cliente";
  btn.className = "acquisisci";
  btn.id = "btn-" + cliente.id;
  btn.dataset.tipo = cliente.tipo;
  btn.onclick = () => {
    if (crediti < prezzo / 40 || acquisitiGlobali.has(cliente.id)) return;
    crediti -= prezzo / 40;
    aggiornaCreditiDisplay();
    aggiungiAlCarrello(cliente, prezzo, btn);
    btn.disabled = true;
    btn.textContent = "Acquisito";
    btn.className = "acquisito";
  };

  div.appendChild(h3);
  div.appendChild(p);
  div.appendChild(prezzoAcquisto);
  div.appendChild(btn);
  clientiContainer.appendChild(div);
}

function caricaDati() {
  fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vSaX-3LmEul1O2Zv6-_1eyg4bmZBhl6EvfhyD9OiGZZ_jE3yjFwkyuWKRodR3GCvG_wTGx4JnvCIGud/pub?output=tsv")
    .then(res => res.text())
    .then(data => {
      const righe = data.trim().split("\n");
      const intestazioni = righe[0].split("\t");
      const clienti = righe.slice(1).map(r => {
        const c = r.split("\t");
        return {
          id: c[0] + "-" + c[1] + "-" + c[2],
          regione: c[0],
          citta: c[1],
          categoria: c[2],
          tipo: c[3],
          budget: c[4],
          titolo: c[2] + " – " + c[1]
        };
      });
      clienti.forEach(creaCliente);
    });
}

document.getElementById("ricaricaCrediti").onclick = () => {
  crediti += 8;
  aggiornaCreditiDisplay();
};

caricaDati();
aggiornaCreditiDisplay();
