const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaX-3LmEul1O2Zv6-_1eyg4bmZBhl6EvfhyD9OiGZZ_jE3yjFwkyuWKRodR3GCvG_wTGx4JnvCIGud/pub?output=csv";
let crediti = 8;
let euro = crediti * 40;
let clienti = [];
let visibili = 5;
const prezzi = { chiamare: 1, appuntamento: 2 };

const creditoEl = document.getElementById("credito");
const euroEl = document.getElementById("euro");
const container = document.getElementById("clienti-container");
const carrelloEl = document.getElementById("carrello");

function aggiornaCredito() {
  creditoEl.textContent = crediti;
  euroEl.textContent = (crediti * 40).toFixed(2);
}

function caricaClienti() {
  fetch(sheetURL).then(r => r.text()).then(data => {
    const righe = data.trim().split("\n").slice(1);
    clienti = righe.map(r => r.split(","));
    popolaFiltri();
    mostraClienti();
  });
}

function popolaFiltri() {
  const regioneSet = new Set(), cittaSet = new Set(), categoriaSet = new Set(), tipoSet = new Set();
  clienti.forEach(c => {
    regioneSet.add(c[1]); cittaSet.add(c[2]);
    categoriaSet.add(c[3]); tipoSet.add(c[4]);
  });
  aggiungiOpzioni("regioneFilter", regioneSet);
  aggiungiOpzioni("cittaFilter", cittaSet);
  aggiungiOpzioni("categoriaFilter", categoriaSet);
  aggiungiOpzioni("tipoFilter", tipoSet);
}

function aggiungiOpzioni(id, set) {
  const sel = document.getElementById(id);
  [...set].sort().forEach(val => {
    const opt = document.createElement("option");
    opt.value = val; opt.textContent = val;
    sel.appendChild(opt);
  });
}

function mostraClienti() {
  container.innerHTML = "";
  const regione = document.getElementById("regioneFilter").value;
  const citta = document.getElementById("cittaFilter").value;
  const categoria = document.getElementById("categoriaFilter").value;
  const tipo = document.getElementById("tipoFilter").value;

  const filtrati = clienti.filter(c =>
    (!regione || c[1] === regione) &&
    (!citta || c[2] === citta) &&
    (!categoria || c[3] === categoria) &&
    (!tipo || c[4] === tipo)
  ).slice(0, visibili);

  filtrati.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "client-item";
    const id = c.join("-");
    const tipoLead = c[4].toLowerCase();
    const lavorazione = parseFloat(c[5]) || 0;
    let prezzoCredito = 0, euroPrezzo = 0, descrizionePrezzo = "";

    if (tipoLead === "chiamare") {
      prezzoCredito = prezzi.chiamare;
      euroPrezzo = 40;
      descrizionePrezzo = `1 credito – €40`;
    } else if (tipoLead === "appuntamento") {
      prezzoCredito = prezzi.appuntamento;
      euroPrezzo = 80;
      descrizionePrezzo = `2 crediti – €80`;
    } else if (tipoLead === "contratto") {
      descrizionePrezzo = `10% della lavorazione: €${(lavorazione * 0.10).toFixed(2)}`;
    }

    const acquisito = localStorage.getItem(id);
    div.innerHTML = `<strong>${c[0]}</strong><br>
    ${c[1]} – ${c[2]} – ${c[3]}<br>
    <em>Tipo: ${c[4]}</em><br>
    Valore lavorazione: €${lavorazione.toLocaleString()}<br>
    Prezzo: ${descrizionePrezzo}<br>`;

    const btn = document.createElement("button");
    btn.textContent = acquisito ? "Acquisito" : "Acquisisci cliente";
    btn.disabled = acquisito || tipoLead === "contratto";

    btn.onclick = () => {
      if (crediti < prezzoCredito) return alert("Crediti insufficienti!");
      crediti -= prezzoCredito;
      aggiornaCredito();
      aggiungiAlCarrello(id, c, euroPrezzo);
      localStorage.setItem(id, "acquisito");
      btn.textContent = "Acquisito";
      btn.disabled = true;
    };

    if (tipoLead === "contratto") {
      btn.textContent = "Solo per interni";
    }

    div.appendChild(btn);
    container.appendChild(div);
  });
}

function aggiungiAlCarrello(id, cliente, prezzo) {
  const li = document.createElement("li");
  li.innerHTML = `${cliente[0]} – €${prezzo}`;
  const rimuovi = document.createElement("button");
  rimuovi.textContent = "Rimuovi";
  rimuovi.onclick = () => {
    crediti += prezzo === 80 ? 2 : 1;
    aggiornaCredito();
    localStorage.removeItem(id);
    li.remove();
    mostraClienti();
  };
  li.appendChild(rimuovi);
  carrelloEl.appendChild(li);
}

document.getElementById("mostra-altri").onclick = () => {
  visibili += 5;
  mostraClienti();
};

["regioneFilter", "cittaFilter", "categoriaFilter", "tipoFilter"].forEach(id =>
  document.getElementById(id).addEventListener("change", mostraClienti)
);

caricaClienti();
aggiornaCredito();
