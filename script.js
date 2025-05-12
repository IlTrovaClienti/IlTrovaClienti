
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaX-3LmEul1O2Zv6-_1eyg4bmZBhl6EvfhyD9OiGZZ_jE3yjFwkyuWKRodR3GCvG_wTGx4JnvCIGud/pub?output=tsv";

let crediti = 8;
let clienti = [];
let carrello = [];

function aggiornaUI() {
  document.getElementById("crediti").textContent = crediti;
  document.getElementById("euro").textContent = `€${(crediti * 40).toFixed(2)}`;
  const ul = document.getElementById("carrello");
  ul.innerHTML = "";
  let totale = 0;
  carrello.forEach((c, i) => {
    totale += c.prezzo;
    const li = document.createElement("li");
    li.innerHTML = `${c.nome} – €${c.prezzo.toFixed(2)} <button class='btn rosso' onclick="rimuoviCliente(${i})">Annulla</button>`;
    ul.appendChild(li);
  });
  document.getElementById("totaleCarrello").textContent = totale.toFixed(2);
  aggiornaPulsanti();
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
        nome: `${categoria} – ${citta}`,
        id: `${regione}-${citta}-${categoria}-${tipo}`
      };
    });
    popolaFiltri();
    mostraClienti();
      document.getElementById("acq_" + cliente.id).disabled = false;
  });
}

function popolaFiltri() {
  const regioni = new Set(), citta = new Set(), categorie = new Set(), tipi = new Set();
  clienti.forEach(c => {
    regioni.add(c.regione);
    citta.add(c.citta);
    categorie.add(c.categoria);
    tipi.add(c.tipo);
  });
  riempi("regioneFilter", regioni);
  riempi("cittaFilter", citta);
  riempi("categoriaFilter", categorie);
  riempi("tipoFilter", tipi);
}

function riempi(id, valori) {
  const sel = document.getElementById(id);
  sel.innerHTML = `<option value="">Tutte le Regioni</option>`;
  [...valori].sort().forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  });
}

function mostraClienti() {
  const container = document.getElementById("clienti-container");
  container.innerHTML = "";
  const f1 = document.getElementById("regioneFilter").value;
  const f2 = document.getElementById("cittaFilter").value;
  const f3 = document.getElementById("categoriaFilter").value;
  const f4 = document.getElementById("tipoFilter").value;
  clienti.filter(c =>
    (!f1 || c.regione === f1) &&
    (!f2 || c.citta === f2) &&
    (!f3 || c.categoria === f3) &&
    (!f4 || c.tipo === f4)
  ).forEach(c => {
    const div = document.createElement("div");
    div.className = "client-item";
    const btn = document.createElement("button");
    btn.className = "btn blu";
    btn.textContent = "Acquisisci Cliente";
    const disabled = carrello.find(e => e.id === c.id);
    if (disabled) btn.disabled = true; btn.id = "acq_" + c.id; annullaBtn.id = "ann_" + c.id;
    
    const annullaBtn = document.createElement("button");
    annullaBtn.className = "btn rosso";
    annullaBtn.textContent = "Annulla";
    annullaBtn.style.marginLeft = "10px";
    if (!disabled) annullaBtn.disabled = true;
    annullaBtn.onclick = () => {
      const i = carrello.findIndex(e => e.id === c.id);
      if (i !== -1) {
        const creditiRecuperati = Math.ceil(c.prezzo / 40);
        crediti += creditiRecuperati;
        carrello.splice(i, 1);
        aggiornaUI();
        mostraClienti();
      document.getElementById("acq_" + cliente.id).disabled = false;
      }
    };

    btn.onclick = () => {

      const creditiNecessari = Math.ceil(c.prezzo / 40);
      if (crediti < creditiNecessari) {
        alert("Crediti insufficienti!");
        return;
      }
      crediti -= creditiNecessari;
      carrello.push({ nome: c.nome, prezzo: c.prezzo, id: c.id });
      aggiornaUI();
      mostraClienti();
      document.getElementById("acq_" + cliente.id).disabled = false;
    };
    div.innerHTML = `<strong>${c.categoria}</strong><br>📍 ${c.regione}, ${c.citta} | 💬 ${c.tipo} | 💶 €${c.budget}<br>Prezzo Acquisto: €${c.prezzo}<br>`;
    div.appendChild(btn);
    const btnGroup = document.createElement("div");
    btnGroup.className = "dual-btns";
    btnGroup.appendChild(btn);
    btnGroup.appendChild(annullaBtn);
    div.appendChild(btnGroup);
    container.appendChild(div);
  });
}

function rimuoviCliente(index) {
  const cliente = carrello[index];
  const creditiRecuperati = Math.ceil(cliente.prezzo / 40);
  crediti += creditiRecuperati;
  carrello.splice(index, 1);
  aggiornaUI();
  mostraClienti();
      document.getElementById("acq_" + cliente.id).disabled = false;
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


function aggiornaPulsanti() {
  const btn = document.getElementById("annullaOrdine");
  btn.style.display = carrello.length > 0 ? "inline-block" : "none";
}
function annullaOrdine() {
  carrello.forEach(c => {
    crediti += Math.ceil(c.prezzo / 40);
  });
  carrello = [];
  aggiornaUI();
  mostraClienti();
      document.getElementById("acq_" + cliente.id).disabled = false;
}
