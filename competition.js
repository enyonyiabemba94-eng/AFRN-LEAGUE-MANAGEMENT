const leagues=JSON.parse(localStorage.getItem('afrn_leagues')||'[]');
const teams=JSON.parse(localStorage.getItem('afrn_master_teams')||'[]');
const id=Number(new URLSearchParams(location.search).get('id'));
const c=leagues[id];
const app=document.getElementById('app');
function esc(s){return String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[x]))}
if(!c){app.innerHTML='<div class="empty">Mashindano hayajapatikana.</div>'}else{
 const eligible=c.division==='Open'?teams:teams.filter(t=>t.division===c.division);
 const cup=c.type==='Tournament';
 const groups=['A','B','C','D','E','F'];
 app.innerHTML=`<section class="card"><h1>${esc(cup?'🏆 '+c.name:'🏟️ '+c.name)}</h1><p class="season">Msimu: <b>${esc(c.season)}</b> • Aina: <b>${esc(cup?'Mashindano / Cup':'Ligi')}</b> • Timu zinazostahili: <b>${eligible.length}</b> • ${esc(c.division)}</p></section>
 <section class="card"><h2>⚡ Mfumo wa Mashindano</h2>${cup?'<div class="cup-flow large">Makundi → Hatua ya 16 → Robo Fainali → Nusu Fainali → Mshindi wa 3 → Fainali</div><p class="info">Hapa ndipo tutaingiza timu, kupanga makundi, kutengeneza ratiba, kurekodi matokeo na kusogeza washindi hatua kwa hatua. Kanuni ya kufuzu haijawekewa thamani ya kubahatisha.</p>':'<p class="info">Ligi hii inatumia timu za <b>'+esc(c.division)+'</b> pekee. Ratiba, matokeo na msimamo vitaunganishwa hapa.</p>'}</section>
 <section class="card"><h2>👥 Timu</h2><div class="team-grid">${eligible.length?eligible.map(t=>`<div class="team-chip"><b>${esc(t.jina)}</b><small>${esc(t.division)}${t.zone?' • '+esc(t.zone):''}</small></div>`).join(''):'<div class="empty">Hakuna timu zinazostahili bado.</div>'}</div></section>
 ${cup?`<section class="card"><h2>📊 Classement ya Makundi</h2><p class="season">Muonekano unaofuata: <b># | Timu | P | GF | GA | Pts</b>. GD, Red na Yellow zitahifadhiwa ndani kwa ajili ya kanuni za kupanga.</p><div class="groups-grid">${groups.map(g=>`<div class="group-card"><div class="group-header"><strong>GROUP ${g}</strong><span class="group-count">0 timu</span></div><div class="empty-group">Bado hakuna timu zilizowekwa kwenye kundi ${g}.</div></div>`).join('')}</div></section>
 <section class="card"><h2>🏆 Hatua za Mtoano</h2><div class="knockout-grid">${['BEST LOSERS','HATUA YA 16','ROBO FAINALI','NUSU FAINALI','MSHINDI WA 3','FAINALI'].map(x=>`<div class="module"><b>${x}</b><br><span class="season">Bado hakuna mechi</span></div>`).join('')}</div></section>`:''}
 <section class="card"><h2>📅 Ratiba & Matokeo</h2><div class="empty">Hakuna mechi zilizorekodiwa bado. Moduli hii itatumika kuhifadhi tarehe, muda, uwanja, score na events.</div></section>
 <section class="card"><h2>⚽ Wafungaji • 🟨🟥 Kadi • 📈 Statistics • 📚 Historia • 📄 Reports • ⚖️ Nidhamu</h2><div class="modules"><div class="module">⚽ Wafungaji</div><div class="module">🟨🟥 Kadi</div><div class="module">📈 Statistics</div><div class="module">📚 Historia</div><div class="module">📄 Reports</div><div class="module">⚖️ Nidhamu</div></div></section>`;
}