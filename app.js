const key='afrn_leagues';
const defaults=[{name:'Ligi Kuu',season:'2026/2027',teams:[]},{name:'Daraja la I',season:'2026/2027',teams:[]},{name:'Daraja la II',season:'2026/2027',teams:[]},{name:'Daraja la III',season:'2026/2027',teams:[]}];
function getLeagues(){const x=localStorage.getItem(key);if(!x){localStorage.setItem(key,JSON.stringify(defaults));return defaults}return JSON.parse(x)}

// MSIMAMO UNAOONEKANA - P, GF, GA, Pts
function renderMsimamo(timu){
  timu.sort((a,b)=>{
    if(b.Pts!==a.Pts)return b.Pts-a.Pts;
    if(b.GF!==a.GF)return b.GF-a.GF;
    if(a.GA!==b.GA)return a.GA-b.GA;
    if(a.Red!==b.Red)return a.Red-b.Red;
    return a.Yellow-b.Yellow;
  });
  return `<div class="table-wrap"><table><thead><tr><th>#</th><th>Timu</th><th>P</th><th>GF</th><th>GA</th><th>Pts</th></tr></thead><tbody>${timu.map((t,i)=>`<tr><td>${i+1}</td><td>${esc(t.jina)}</td><td>${t.P}</td><td>${t.GF}</td><td>${t.GA}</td><td><b>${t.Pts}</b></td></tr>`).join('')}</tbody></table></div>`;
}

// Data mfano; GD, Red na Yellow vinatumika kwa upangaji lakini havionekani
const timuData={jina:'Q1 MTETEZI',P:4,GF:8,GA:1,Pts:12,GD:7,Red:0,Yellow:2};

function render(){const box=document.getElementById('leagues');box.innerHTML=getLeagues().map((l,i)=>`<article class="card"><h2>${esc(l.name)}</h2><div class="season">Msimu: ${esc(l.season)}</div><div class="modules"><div class="module">👥 Timu</div><div class="module">📅 Ratiba</div><div class="module">🏁 Matokeo</div><div class="module">📊 Standings</div><div class="module">⚽ Wafungaji</div><div class="module">🟨🟥 Kadi</div><div class="module">📈 Statistics</div><div class="module">📚 Historia</div><div class="module">📄 Reports</div><div class="module">⚖️ Nidhamu</div></div><h3>Msimamo</h3>${renderMsimamo(l.teams||[timuData])}<button class="open" onclick="openLeague(${i})">Fungua Ligi</button></article>`).join('')}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function openLeague(i){const l=getLeagues()[i];alert(`Ligi: ${l.name}\nMsimu: ${l.season}\n\nMsimamo unaonyesha: P | GF | GA | Pts.\nGD, Red na Yellow vinatumika kwa upangaji lakini vimefichwa.`)}
const modal=document.getElementById('modal');document.getElementById('newLeague').onclick=()=>modal.classList.remove('hidden');document.getElementById('close').onclick=()=>modal.classList.add('hidden');document.getElementById('save').onclick=()=>{const name=document.getElementById('leagueName').value.trim(),season=document.getElementById('season').value.trim();if(!name)return alert('Andika jina la ligi.');const leagues=getLeagues();leagues.push({name,season:season||'2026/2027',teams:[]});localStorage.setItem(key,JSON.stringify(leagues));modal.classList.add('hidden');document.getElementById('leagueName').value='';render()};render();