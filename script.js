
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaX-3LmEul1O2Zv6-_1eyg4bmZBhl6EvfhyD9OiGZZ_jE3yjFwkyuWKRodR3GCvG_wTGx4JnvCIGud/pub?output=tsv";
let clienti = [];
let carrello = [];
let crediti = 8;

function aggiornaInterfaccia() {
  const div = document.getElementById("clienti");
  div.innerHTML = "";
  const regioneSel = document.getElementById("regioneFilter").value;
  const cittaSel = document.getElementById("cittaFilter").value;
  const categoriaSel = document.getElementById("categoriaFilter").value;
  const tipoSel = document.getElementById("tipoFilter").value;
  clienti.forEach((c, i) => {
    if (
      (regioneSel === "Tutti" || c.regione === regioneSel) &&
      (cittaSel === "Tutti" || c.citta === cittaSel) &&
      (categoriaSel === "Tutti" || c.categoria === categoriaSel) &&
      (tipoSel === "Tutti" || c.tipo === tipoSel) &&
      !c.acquisito
    ) {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = \`
        <strong>\${c.categoria}</strong><br>
        📍 \${c.regione}, \${c.citta} | 💬 \${c.tipo} | 💶 €\${c.budget}<br>
        Prezzo Acquisto: €\${c.prezzo}<br>
        📝 \${c.descrizione}<br>
        <button class="acquisisci" onclick="acquisisci(\${i})">Acquisisci Cliente</button>
        <button class="annulla" onclick="annulla(\${i})">Annulla</button>
      \`;
      div.appendChild(card);
    }
  });
}

function acquisisci(i) {
  const cliente = clienti[i];
  if (!cliente.acquisito && crediti >= cliente.crediti) {
    cliente.acquisito = true;
    carrello.push(cliente);
    crediti -= cliente.crediti;
    aggiornaCarrello();
    aggiornaInterfaccia();
  }
}

function annulla(i) {
  const cliente = clienti[i];
  if (cliente.acquisito) {
    cliente.acquisito = false;
    const idx = carrello.indexOf(cliente);
    if (idx !== -1) carrello.splice(idx, 1);
    crediti += cliente.crediti;
    aggiornaCarrello();
    aggiornaInterfaccia();
  }
}

function aggiornaCarrello() {
  document.getElementById("crediti").textContent = crediti;
  document.getElementById("valoreCrediti").textContent = `€${crediti * 40}.00`;
  const lista = document.getElementById("listaCarrello");
  lista.innerHTML = "";
  let tot = 0;
  carrello.forEach((c) => {
    const li = document.createElement("li");
    li.textContent = `${c.categoria} – ${c.citta} – €${c.prezzo}`;
    tot += parseFloat(c.prezzo);
    lista.appendChild(li);
  });
  document.getElementById("totale").textContent = `€${tot.toFixed(2)}`;
}

function ricaricaCrediti() {
  crediti += 8;
  aggiornaCarrello();
}

function initFiltri() {
  const r = new Set(), c = new Set(), cat = new Set(), t = new Set();
  clienti.forEach(x => {
    r.add(x.regione);
    c.add(x.citta);
    cat.add(x.categoria);
    t.add(x.tipo);
  });
  populate("regioneFilter", [...r]);
  populate("cittaFilter", [...c]);
  populate("categoriaFilter", [...cat]);
  populate("tipoFilter", [...t]);
}

function populate(id, options) {
  const sel = document.getElementById(id);
  sel.innerHTML = "<option>Tutti</option>" + options.map(x => `<option>${x}</option>`).join("");
  sel.onchange = aggiornaInterfaccia;
}

fetch(sheetURL)
  .then(res => res.text())
  .then(data => {
    const righe = data.trim().split("\n").slice(1);
    clienti = righe.map(r => {
      const [regione, citta, categoria, tipo, budget, prezzo, descrizione] = r.split("\t");
      return {
        regione, citta, categoria, tipo,
        budget: parseFloat(budget),
        prezzo: parseFloat(prezzo),
        descrizione,
        crediti: prezzo == 40 ? 1 : prezzo == 80 ? 2 : Math.ceil(prezzo / 40),
        acquisito: false
      };
    });
    initFiltri();
    aggiornaInterfaccia();
  });
