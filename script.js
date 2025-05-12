
document.addEventListener("DOMContentLoaded", function () {
    const clienti = [
        { regione: "Abruzzo", citta: "L'Aquila", categoria: "Impianto Fotovoltaico", tipo: "Appuntamento", budget: 11392, prezzo: 80, descrizione: "Installazione con accumulo 10kWh" },
    ];

    let crediti = 8;
    let carrello = [];

    function aggiornaCrediti() {
        document.getElementById("creditiTotali").textContent = crediti;
        document.getElementById("valoreCrediti").textContent = (crediti * 40).toFixed(2);
    }

    function aggiornaCarrello() {
        const ul = document.getElementById("listaCarrello");
        ul.innerHTML = "";
        let totale = 0;
        carrello.forEach((c, i) => {
            const li = document.createElement("li");
            li.textContent = `${c.categoria} – ${c.citta} – €${c.prezzo.toFixed(2)}`;
            const annulla = document.createElement("button");
            annulla.textContent = "Annulla";
            annulla.onclick = function () {
                crediti += c.prezzo / 40;
                clienti.push(c);
                carrello.splice(i, 1);
                aggiornaCrediti();
                aggiornaClienti();
                aggiornaCarrello();
            };
            li.appendChild(annulla);
            ul.appendChild(li);
            totale += c.prezzo;
        });
        document.getElementById("totaleCarrello").textContent = totale.toFixed(2);
    }

    function aggiornaClienti() {
        const lista = document.getElementById("listaClienti");
        lista.innerHTML = "";
        clienti.forEach((c, i) => {
            const div = document.createElement("div");
            div.innerHTML = `<h3>${c.categoria}</h3><p>📍 ${c.regione}, ${c.citta} | 💬 ${c.tipo} | 💶 €${c.budget}</p><p>${c.descrizione}</p><p>Prezzo Acquisto: €${c.prezzo}</p>`;
            const btn = document.createElement("button");
            btn.textContent = "Acquisisci Cliente";
            btn.onclick = function () {
                if (crediti >= c.prezzo / 40) {
                    crediti -= c.prezzo / 40;
                    carrello.push(c);
                    clienti.splice(i, 1);
                    aggiornaCrediti();
                    aggiornaClienti();
                    aggiornaCarrello();
                } else {
                    alert("Crediti insufficienti!");
                }
            };
            div.appendChild(btn);
            lista.appendChild(div);
        });
    }

    window.ricaricaCrediti = function () {
        crediti += 8;
        aggiornaCrediti();
    };

    aggiornaCrediti();
    aggiornaClienti();
    aggiornaCarrello();
});
