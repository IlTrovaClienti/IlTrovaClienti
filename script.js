let userCrediti=5;
const sheetURL='https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/gviz/tq?tqx=out:tsv';let data=[],carrello=[];const cols=['Regione','Città','Categoria','Tipo'],sids=['regione','citta','categoria','tipo'];window.addEventListener('DOMContentLoaded',()=>{fetch(sheetURL).then(r=>r.text()).then(parseTSV).then(parsed=>{data=parsed;setupFilters();drawCards(data);paypal.Buttons().render('#paypal-button-container');}).catch(console.error);});function parseTSV(tsv){const lines=tsv.trim().split('\n'),headers=lines.shift().split('\t');return lines.map(l=>{const v=l.split('\t');return Object.fromEntries(headers.map((h,i)=>[h.trim(),v[i]?.trim()||'']));});}function setupFilters(){cols.forEach((c,i)=>{const sel=document.getElementById(sids[i]);sel.querySelectorAll('option:not(:first-child)').forEach(o=>o.remove());[...new Set(data.map(r=>r[c]))].sort().forEach(v=>{const o=document.createElement('option');o.value=o.textContent=v;sel.appendChild(o);});sel.addEventListener('change',()=>drawCards(applyFilters()));});}function applyFilters(){const crit={};cols.forEach((c,i)=>crit[c]=document.getElementById(sids[i]).value);return data.filter(r=>cols.every(c=>crit[c]==='Tutti'||r[c]===crit[c]));}function drawCards(list){const main=document.getElementById('clienti');main.innerHTML='';list.forEach(r=>{const tipo = r.Tipo.toLowerCase();
const cls = tipo.includes('lead') ? 'lead'
          : tipo.includes('appuntamento') ? 'appuntamento'
          : 'contratto';const card=document.createElement('div');card.className=`cliente-card ${cls}`;card.innerHTML=`<span class="badge ${cls}">${r.Categoria}</span><h3>${r.Tipo}</h3><p class="desc">${r.Descrizione}</p><p><strong>${r.Città}, ${r.Regione}</strong></p><p class="commission">Tel: ${r.Telefono} – Budget: €${r["Budget (€)"]} – Costo: ${r["Costo (crediti)"]} crediti</p><div class="actions"><button class="acquisisci" onclick="addToCart('${r.Telefono}',${r["Costo (crediti)"]})">Acquisisci</button><button class="annulla" onclick="removeFromCart('${r.Telefono}')">Annulla</button></div>`;main.appendChild(card);});}function addToCart(id, credStr){
  const cred = parseInt(credStr) || 0;  // trattativa riservata = 0
  if(!carrello.find(x=>x.id===id)){
     carrello.push({id, crediti: cred}););
     aggiornaCarrello();
     if(cred===0){ displayPhone(id);} // trattativa gratis
  }
}); displayPhone(id);}function removeFromCart(id){carrello=carrello.filter(x=>x.id!==id),updateCart(); displayPhone(id);}function updateCart(){document.getElementById('carrello').innerHTML=carrello.map(x=>`<li>${x.id} – ${x.cred} crediti</li>`).join('');document.getElementById('totale').textContent=`Totale: €${carrello.reduce((s,x)=>s+x.cred,0)}`;}function resetFilters(){['regione','citta','categoria','tipo'].forEach(id=>document.getElementById(id).value='Tutti');drawCards(data);}function filterByCategoria(cat){drawCards(data.filter(r=>r.Categoria.includes(cat)));}function openRicarica(){alert('Apri ricarica PayPal');}

function displayPhone(id){
  const cards=document.querySelectorAll('.cliente-card');
  cards.forEach(c=>{
     if(c.innerHTML.includes(id)){
        c.querySelector('.phone').textContent='Tel: '+id;
     }
  });
}

function openFormModal(id){
  document.getElementById('form-modal').style.display='flex';
  document.getElementById('reserve-form').dataset.phone=id;
}
function closeFormModal(){
  document.getElementById('form-modal').style.display='none';
}
document.getElementById('reserve-form').addEventListener('submit',e=>{
  e.preventDefault();
  const phone=e.target.dataset.phone;
  // Save request or send email (stub)
  alert('Richiesta inviata! Verrai ricontattato.');
  closeFormModal();
  displayPhone(phone); // opzionale mostra numero
});
