const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaX-3LmEul1O2Zv6-_1eyg4bmZBhl6EvfhyD9OiGZZ_jE3yjFwkyuWKRodR3GCvG_wTGx4JnvCIGud/pub?output=tsv";

let crediti = 8;
let clienti = [];
let carrello = [];

function aggiornaUI() {
  document.getElementById("crediti").textContent = crediti;
  document.getElementById("euro").textContent = "€" + (crediti * 40).toFixed(2);
  let totale = carrello.reduce((acc, c) => acc + c.prezzo, 0);
  document.getElementById("totaleCarrello").textContent = totale.toFixed(2);
  const ul = document.getElementById("carrello");
  ul.innerHTML = "";
  carrello.forEach(c => {
    const li = document.createElement("li");
    li.textContent = `${c.nome} – €${c.prezzo.toFixed(2)}`;
    ul.appendChild(li);
  });
}

function caricaDati() {
  fetch(sheetURL).then(r => r.text()).then(text => {
    const righe = text.trim().split("\n").slice(1);
    clienti = righe.map(r => {
      const [regione, citta, categoria, tipo, budget, prezzo] = r.split("\t");
      return {
        regione, citta, categoria, tipo,
        budget: parseFloat(budget),
        prezzo: parseFloat(prezzo),
        nome: `${categoria} – ${citta}`
      };
    });
    popolaFiltri();
    mostraClienti();
  });
}

function popolaFiltri() {
  const regSet = new Set(), citSet = new Set(), tipSet = new Set();
  clienti.forEach(c => {
    regSet.add(c.regione);
    citSet.add(c.citta);
    tipSet.add(c.tipo);
  });
  fillSelect("regioneFilter", regSet);
  fillSelect("cittaFilter", citSet);
  fillSelect("tipoFilter", tipSet);
}

function fillSelect(id, values) {
  const select = document.getElementById(id);
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
}

function mostraClienti() {
  const container = document.getElementById("clienti-container");
  container.innerHTML = "";
  const rf = document.getElementById("regioneFilter").value;
  const cf = document.getElementById("cittaFilter").value;
  const caf = document.getElementById("categoriaFilter").value;
  const tf = document.getElementById("tipoFilter").value;
  clienti.filter(c =>
    (!rf || c.regione === rf) &&
    (!cf || c.citta === cf) &&
    (!caf || c.categoria === caf) &&
    (!tf || c.tipo === tf)
  ).forEach(c => {
    const div = document.createElement("div");
    div.className = "client-item";
    const btn = document.createElement("button");
    btn.textContent = "Acquisisci Cliente";
    btn.onclick = () => {
      const creditiNecessari = Math.ceil(c.prezzo / 40);
      if (crediti < creditiNecessari) {
        alert("Crediti insufficienti!");
        return;
      }
      crediti -= creditiNecessari;
      carrello.push({ nome: `${c.categoria} - ${c.citta}`, prezzo: c.prezzo });
      aggiornaUI();
      btn.disabled = true;
    };
    div.innerHTML = `<strong>${c.categoria}</strong><br>
    📍 ${c.regione}, ${c.citta} | 💬 ${c.tipo} | 💶 €${c.budget}<br>
    Prezzo Acquisto: €${c.prezzo}<br>`;
    div.appendChild(btn);
    container.appendChild(div);
  });
}

function ricarica(qty) {
  crediti += qty;
  chiudiModal();
  aggiornaUI();
}
function chiudiModal() {
  document.getElementById("modal").classList.add("hidden");
}
document.getElementById("ricaricaBtn").onclick = () =>
  document.getElementById("modal").classList.remove("hidden");

["regioneFilter", "cittaFilter", "categoriaFilter", "tipoFilter"].forEach(id =>
  document.getElementById(id).addEventListener("change", mostraClienti)
);

caricaDati();
aggiornaUI();
