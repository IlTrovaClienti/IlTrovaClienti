
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaX-3LmEul1O2Zv6-_1eyg4bmZBhl6EvfhyD9OiGZZ_jE3yjFwkyuWKRodR3GCvG_wTGx4JnvCIGud/pub?output=tsv";
let clienti = [];
let carrello = [];
let crediti = 8;
let esclusi = [];

document.addEventListener("DOMContentLoaded", () => {
  fetch(sheetURL)
    .then(res => res.text())
    .then(data => {
      const righe = data.split("\n").slice(1);
      clienti = righe.map(r => {
        const [regione, citta, categoria, tipo, budget, prezzo] = r.split("\t");
        return {
          id: regione + citta + categoria + tipo + budget,
          regione, citta, categoria, tipo,
          budget: parseFloat(budget), prezzo: parseFloat(prezzo)
        };
      });
      popolaFiltri();
      mostraClienti();
    });

  ["regioneFilter", "cittaFilter", "categoriaFilter", "tipoFilter"].forEach(id => {
    document.getElementById(id).addEventListener("change", mostraClienti);
  });
});

function popolaFiltri() {
  const unici = (lista, key) => [...new Set(lista.map(e => e[key]))].sort();
  const fill = (id, label) => {
    const select = document.getElementById(id);
    const key = id.replace("Filter", "");
    unici(clienti, key).forEach(v => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      select.appendChild(o);
    });
  };
  fill("regioneFilter");
  fill("cittaFilter");
  fill("categoriaFilter");
  fill("tipoFilter");
}

function mostraClienti() {
  const ctn = document.getElementById("clienti");
  ctn.innerHTML = "";
  const rf = document.getElementById("regioneFilter").value;
  const cf = document.getElementById("cittaFilter").value;
  const catf = document.getElementById("categoriaFilter").value;
  const tf = document.getElementById("tipoFilter").value;

  clienti.filter(c =>
    !esclusi.includes(c.id) &&
    (!rf || c.regione === rf) &&
    (!cf || c.citta === cf) &&
    (!catf || c.categoria === catf) &&
    (!tf || c.tipo === tf)
  ).forEach(c => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <strong>${c.categoria}</strong><br>
      📍 ${c.regione}, ${c.citta} | 💬 ${c.tipo} | 💶 €${c.budget.toFixed(2)}<br>
      Prezzo Acquisto: €${c.prezzo.toFixed(2)}
    `;
    const acq = document.createElement("button");
    acq.textContent = "Acquisisci Cliente";
    acq.className = "btn-blu";
    acq.onclick = () => {
      if (crediti * 40 >= c.prezzo) {
        carrello.push(c);
        esclusi.push(c.id);
        crediti -= Math.ceil(c.prezzo / 40);
        aggiornaUI();
        mostraClienti();
      }
    };
    const annulla = document.createElement("button");
    annulla.textContent = "Annulla";
    annulla.className = "btn-rosso";
    annulla.onclick = () => {
      const i = carrello.findIndex(x => x.id === c.id);
      if (i >= 0) {
        carrello.splice(i, 1);
        const ind = esclusi.indexOf(c.id);
        if (ind >= 0) esclusi.splice(ind, 1);
        crediti += Math.ceil(c.prezzo / 40);
        aggiornaUI();
        mostraClienti();
      }
    };
    div.appendChild(acq);
    div.appendChild(annulla);
    ctn.appendChild(div);
  });
}

function aggiornaUI() {
  document.getElementById("crediti").textContent = crediti;
  document.getElementById("valoreCrediti").textContent = (crediti * 40).toFixed(2);
  const ul = document.getElementById("carrello");
  ul.innerHTML = "";
  carrello.forEach(c => {
    const li = document.createElement("li");
    li.textContent = `${c.categoria} – ${c.citta} – €${c.prezzo.toFixed(2)}`;
    ul.appendChild(li);
  });
  const tot = carrello.reduce((s, x) => s + x.prezzo, 0);
  document.getElementById("totaleCarrello").textContent = tot.toFixed(2);
}

function svuotaCarrello() {
  carrello.forEach(c => {
    crediti += Math.ceil(c.prezzo / 40);
    const i = esclusi.indexOf(c.id);
    if (i >= 0) esclusi.splice(i, 1);
  });
  carrello = [];
  aggiornaUI();
  mostraClienti();
}

function ricaricaCrediti() {
  crediti += 8;
  aggiornaUI();
}
