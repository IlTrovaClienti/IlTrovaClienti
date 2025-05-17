/* IlTrovaClienti 1.1.0 */

// ====== CONFIG ======
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv";
const CREDITS_PER_TEST_RECHARGE = 10;

// ====== STATE ======
let rawData = [];
let currentUser = null;
let userCredits = 0;
let cart = [];

// ====== DOM ======
const regioneSel = document.getElementById("regioneFilter");
const cittaSel   = document.getElementById("cittaFilter");
const catSel     = document.getElementById("categoriaFilter");
const tipoSel    = document.getElementById("tipoFilter");
const resetBtn   = document.getElementById("resetFilters");

const cardsEl    = document.getElementById("cards");
const cartListEl = document.getElementById("cartList");
const cartTotal  = document.getElementById("cartTotal");
const creditsEl  = document.getElementById("credits");
const welcomeEl  = document.getElementById("welcome");

const loginModal     = document.getElementById("loginModal");
const rechargeModal  = document.getElementById("rechargeModal");

// ====== FIREBASE PLACEHOLDER ======
// firebase-init.js must export: firebaseConfig
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

// ====== AUTH ======
auth.onAuthStateChanged(user => {
    currentUser = user;
    if(user){
        welcomeEl.textContent = `Ciao, ${user.email}`;
        document.getElementById("loginBtn").style.display='none';
        document.getElementById("logoutBtn").style.display='inline-block';
        loadCredits();
    }else{
        welcomeEl.textContent = '';
        document.getElementById("loginBtn").style.display='inline-block';
        document.getElementById("logoutBtn").style.display='none';
        userCredits = 0;
        updateCreditsUI();
    }
});

document.getElementById("loginBtn").onclick = () => openModal(loginModal);
document.getElementById("logoutBtn").onclick = () => auth.signOut();
document.getElementById("doLogin").onclick = async () => {
    const email = document.getElementById("authEmail").value;
    const pass  = document.getElementById("authPass").value;
    try {
        await auth.signInWithEmailAndPassword(email,pass);
        closeModals();
    }catch(err){alert(err.message);}
};
document.getElementById("doRegister").onclick = async () => {
    const email = document.getElementById("authEmail").value;
    const pass  = document.getElementById("authPass").value;
    try {
        await auth.createUserWithEmailAndPassword(email,pass);
        await db.collection('users').doc(auth.currentUser.uid).set({credits:0});
        closeModals();
    }catch(err){alert(err.message);}
};

// ====== CREDITS ======
async function loadCredits(){
    const snap = await db.collection('users').doc(currentUser.uid).get();
    userCredits = snap.exists ? snap.data().credits : 0;
    updateCreditsUI();
}
function updateCredits(n){
    userCredits = n;
    updateCreditsUI();
    if(currentUser){
        db.collection('users').doc(currentUser.uid).set({credits:userCredits});
    }
}
function updateCreditsUI(){
    creditsEl.textContent = userCredits;
}

// ====== RECHARGE TEST ======
document.getElementById("rechargeBtn").onclick = ()=>openModal(rechargeModal);
document.getElementById("addCredits").onclick = () => {
    updateCredits(userCredits + CREDITS_PER_TEST_RECHARGE);
    closeModals();
};

// ====== FILTERS ======
resetBtn.onclick = () => {
    [regioneSel,cittaSel,catSel,tipoSel].forEach(sel=>sel.value='');
    renderCards();
};
[regioneSel,cittaSel,catSel,tipoSel].forEach(sel=>sel.onchange = renderCards);

// ====== TABS ======
document.querySelectorAll(".tabs .tab").forEach(btn=>btn.onclick = (e)=>{
    document.querySelectorAll(".tabs .tab").forEach(b=>b.classList.remove("active"));
    e.currentTarget.classList.add("active");
    tipoSel.value = e.currentTarget.dataset.type;
    renderCards();
});

// ====== TSV LOADING ======
fetch(SHEET_URL)
    .then(r=>r.text())
    .then(tsv=>parseTSV(tsv))
    .then(data=>{
        rawData = data;
        populateSelects();
        renderCards();
    })
    .catch(err=>console.error(err));

function parseTSV(tsv){
    const rows = tsv.trim().split('\n').map(r=>r.split('\t'));
    const headers = rows.shift();
    return rows.map((r,i)=>{
        const obj = {};
        headers.forEach((h,idx)=>obj[h.trim()] = r[idx] || '');
        obj.__id = 'row'+i;
        return obj;
    });
}

// ====== UI RENDER ======
function populateSelects(){
    const regs = unique(rawData.map(d=>d.Regione));
    const cities = unique(rawData.map(d=>d.Città));
    const cats = unique(rawData.map(d=>d.Categoria));
    const types = unique(rawData.map(d=>d.Tipo));

    fillSelect(regioneSel, regs);
    fillSelect(cittaSel, cities);
    fillSelect(catSel, cats);
    fillSelect(tipoSel, types);
}
function fillSelect(sel, arr){
    sel.innerHTML = '<option value="">Tutti</option>' + arr.map(v=>`<option value="${v}">${v}</option>`).join('');
}
function unique(arr){
    return [...new Set(arr.filter(Boolean))].sort();
}

function renderCards(){
    const filt = {
        reg: regioneSel.value,
        cit: cittaSel.value,
        cat: catSel.value,
        tipo: tipoSel.value
    };
    const list = rawData.filter(d=>
        (!filt.reg||d.Regione===filt.reg) &&
        (!filt.cit||d.Città===filt.cit) &&
        (!filt.cat||d.Categoria===filt.cat) &&
        (!filt.tipo||d.Tipo===filt.tipo)
    );
    cardsEl.innerHTML = list.map(cardHTML).join('');
}

function cardHTML(d){
    const cls = d.Tipo==='Lead'?'lead':(d.Tipo==='Appuntamenti'?'app':'contr');
    const crediti = d['Costo (crediti)'] || 0;
    return `<div class="card ${cls}">
        <h4>${d.Categoria}</h4>
        <small>${d.Tipo} – ${d.Città}, ${d.Regione}</small>
        <p>${d.Descrizione}</p>
        <p><b>Budget:</b> €${d['Budget (€)']}</p>
        <p><b>Costo:</b> ${crediti} crediti</p>
        <button class="btn btn-primary" onclick="addToCart('${d.__id}', ${crediti})">Aggiungi</button>
    </div>`;
}

function addToCart(id, cost){
    if(cost>userCredits){alert('Crediti insufficienti');return;}
    if(cart.find(c=>c.id===id))return;
    cart.push({id, cost});
    updateCredits(userCredits - cost);
    renderCart();
}
function removeFromCart(idx){
    const item = cart[idx];
    cart.splice(idx,1);
    updateCredits(userCredits + item.cost);
    renderCart();
}
function renderCart(){
    cartListEl.innerHTML = cart.map((c,i)=>`<li>${c.id} – ${c.cost} <button class="btn btn-secondary small" onclick="removeFromCart(${i})">Annulla</button></li>`).join('');
    cartTotal.textContent = cart.reduce((s,c)=>s+c.cost,0);
}

// ====== MODAL UTILS ======
function openModal(m){m.classList.remove('hidden');}
function closeModals(){document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden'));}
document.querySelectorAll('[data-close]').forEach(btn=>btn.onclick = closeModals);
