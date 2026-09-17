const AFRN_STATS_URL='https://jjqhvruppafpumcthmwe.supabase.co';
const AFRN_STATS_KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
const AFRN_MATCH_ID=new URLSearchParams(location.search).get('id');
const AFRN_STAT_FIELDS='home_possession,away_possession,home_shots,away_shots,home_shots_on_target,away_shots_on_target,home_shots_off_target,away_shots_off_target,home_blocked_shots,away_blocked_shots,home_corners,away_corners,home_fouls,away_fouls,home_offsides,away_offsides,home_big_chances,away_big_chances,home_xg,away_xg,home_passes,away_passes,home_pass_accuracy,away_pass_accuracy,home_saves,away_saves,home_crosses,away_crosses,home_duels_won,away_duels_won,home_momentum,away_momentum,updated_at';
const statNames={possession:'Possession',shots:'Shots',shots_on_target:'Shots on target',shots_off_target:'Shots off target',blocked_shots:'Blocked shots',corners:'Corners',fouls:'Fouls',offsides:'Offsides',big_chances:'Big chances',xg:'xG',passes:'Passes',pass_accuracy:'Pass accuracy',saves:'Saves',crosses:'Crosses',duels_won:'Duels won',momentum:'Momentum'};
const intFields=['shots','shots_on_target','shots_off_target','blocked_shots','corners','fouls','offsides','big_chances','passes','saves','crosses','duels_won'];
const pctFields=['possession','pass_accuracy','momentum'];
const statGroups=[
 ['⚽ Mashambulizi',['shots','shots_on_target','shots_off_target','blocked_shots','corners','big_chances','xg']],
 ['🛡️ Ulinzi & Nidhamu',['fouls','offsides','saves']],
 ['🎯 Passing',['passes','pass_accuracy']],
 ['📈 Nyingine',['crosses','duels_won','momentum']]
];
function sEsc(v){return String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[x]))}
async function loadStats(){
 if(!AFRN_MATCH_ID)return null;
 const r=await fetch(`${AFRN_STATS_URL}/rest/v1/match_statistics?match_id=eq.${encodeURIComponent(AFRN_MATCH_ID)}&select=${AFRN_STAT_FIELDS}&limit=1`,{headers:{apikey:AFRN_STATS_KEY,Authorization:'Bearer '+AFRN_STATS_KEY}});
 if(!r.ok)throw Error('Stats '+r.status);const rows=await r.json();return rows[0]||null;
}
function pair(stem,s){return [s?.[`home_${stem}`],s?.[`away_${stem}`]]}
function has(v){return v!==null&&v!==undefined&&v!==''}
function fmt(stem,v){if(!has(v))return '—';if(stem==='possession'||stem==='pass_accuracy'||stem==='momentum')return `${Number(v).toFixed(Number(v)%1?1:0)}%`;if(stem==='xg')return Number(v).toFixed(2);return Number(v).toLocaleString('en-US')}
function statRow(stem,s){const [h,a]=pair(stem,s);if(!has(h)&&!has(a))return '';return `<div class="afrn-stat-row"><div class="afrn-stat-value">${fmt(stem,h)}</div><div class="afrn-stat-label">${sEsc(statNames[stem]||stem)}</div><div class="afrn-stat-value">${fmt(stem,a)}</div></div>`}
function possession(stem,s){const [h,a]=pair(stem,s);if(!has(h)&&!has(a))return '';const hn=Number(h)||0,an=Number(a)||0,total=hn+an||100,hp=Math.max(0,Math.min(100,hn/total*100));return `<div class="afrn-possession"><div class="afrn-pos-head"><b>${fmt(stem,h)}</b><span>Possession</span><b>${fmt(stem,a)}</b></div><div class="afrn-pos-bar"><i style="width:${hp}%"></i></div></div>`}
function renderStats(s){
 const target=document.getElementById('stats');if(!target)return;
 if(!s){target.innerHTML='<div class="section-head"><h2>📊 Takwimu za Mchezo</h2><button class="afrn-edit-stats" onclick="openStatsEditor()">✏️ Ingiza Takwimu</button></div><div class="empty">Hakuna takwimu za kina zilizorekodiwa bado. Zitaonekana hapa mara tu zitakapoingizwa.</div>';return}
 const rows=['shots','shots_on_target','shots_off_target','blocked_shots','corners','fouls','offsides','big_chances','xg','passes','pass_accuracy','saves','crosses','duels_won'].map(x=>statRow(x,s)).join('');
 const extra=statRow('momentum',s);
 target.innerHTML=`<div class="section-head"><h2>📊 Takwimu za Mchezo</h2><div><span class="event-count">LIVE STATS</span><button class="afrn-edit-stats" onclick="openStatsEditor()">✏️ Hariri</button></div></div>${possession('possession',s)}<div class="afrn-stat-card"><div class="afrn-stat-head"><span>NYUMBANI</span><span>TAKWIMU</span><span>UGENINI</span></div>${rows}${extra}</div><div class="updated-at">Stats updated: ${sEsc(s.updated_at?new Date(s.updated_at).toLocaleTimeString('sw-TZ',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'—')}</div>`;
}
function valueOf(s,stem,side){const v=s?.[`${side}_${stem}`];return has(v)?v:''}
function editorField(stem,s){const type=stem==='xg'?'number':'number';const step=stem==='xg'?'0.01':'1';const min=0;const max=pctFields.includes(stem)?100:'';return `<div class="afrn-edit-row"><label>${sEsc(statNames[stem])}</label><input data-stat="${stem}" data-side="home" type="${type}" min="${min}" ${max!==''?`max="${max}"`:''} step="${step}" value="${sEsc(valueOf(s,stem,'home'))}" placeholder="—"><input data-stat="${stem}" data-side="away" type="${type}" min="${min}" ${max!==''?`max="${max}"`:''} step="${step}" value="${sEsc(valueOf(s,stem,'away'))}" placeholder="—"></div>`}
async function openStatsEditor(){
 let s=null;try{s=await loadStats()}catch(e){alert('Imeshindikana kusoma takwimu.');return}
 const target=document.getElementById('stats');if(!target)return;
 const groups=statGroups.map(g=>`<div class="afrn-edit-group"><h3>${g[0]}</h3>${g[1].map(x=>editorField(x,s)).join('')}</div>`).join('');
 target.innerHTML=`<div class="section-head"><h2>✏️ Ingiza Takwimu</h2><span class="event-count">MATCH STATS</span></div><div class="afrn-edit-head"><span>TAKWIMU</span><b>NYUMBANI</b><b>UGENINI</b></div>${editorField('possession',s)}${groups}<div id="afrn-save-msg" class="afrn-save-msg"></div><div class="afrn-edit-actions"><button class="afrn-cancel-stats" onclick="refreshMatchStats()">✕ Ghairi</button><button class="afrn-save-stats" onclick="saveStats()">💾 Hifadhi Takwimu</button></div>`;
}
function readNum(input){if(!input||input.value==='')return null;const n=Number(input.value);return Number.isFinite(n)?n:null}
function collectStats(){const data={match_id:AFRN_MATCH_ID};document.querySelectorAll('#stats [data-stat]').forEach(i=>{const v=readNum(i);data[`${i.dataset.side}_${i.dataset.stat}`]=v});return data}
function validateStats(d){
 for(const f of pctFields){for(const side of ['home','away']){const v=d[`${side}_${f}`];if(v!==null&&v!==undefined&&(v<0||v>100))return `${statNames[f]} ya ${side==='home'?'NYUMBANI':'UGENINI'} lazima iwe 0–100.`}}
 const hp=d.home_possession,ap=d.away_possession;if(hp!==null&&ap!==null&&Math.abs(hp+ap-100)>0.01)return 'Possession ya timu zote mbili lazima iwe jumla ya 100%.';
 for(const f of intFields){for(const side of ['home','away']){const v=d[`${side}_${f}`];if(v!==null&&v!==undefined&&(!Number.isInteger(v)||v<0))return `${statNames[f]} lazima iwe namba kamili isiyo chini ya 0.`}}
 for(const side of ['home','away']){const v=d[`${side}_xg`];if(v!==null&&v!==undefined&&(v<0||!Number.isFinite(v)))return 'xG haiwezi kuwa chini ya 0.'}
 return null;
}
async function saveStats(){
 const msg=document.getElementById('afrn-save-msg');const d=collectStats();const err=validateStats(d);if(err){msg.textContent='❌ '+err;msg.className='afrn-save-msg error';return}
 msg.textContent='⏳ Inahifadhi...';msg.className='afrn-save-msg';
 try{
  const r=await fetch(`${AFRN_STATS_URL}/rest/v1/match_statistics?on_conflict=match_id`,{method:'POST',headers:{apikey:AFRN_STATS_KEY,Authorization:'Bearer '+AFRN_STATS_KEY,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(d)});
  if(!r.ok){const text=await r.text();throw Error(text||`HTTP ${r.status}`)}
  msg.textContent='✅ Takwimu zimehifadhiwa.';msg.className='afrn-save-msg success';setTimeout(refreshMatchStats,700);
 }catch(e){console.error(e);msg.textContent='❌ Imeshindikana kuhifadhi takwimu. '+String(e.message||'');msg.className='afrn-save-msg error'}
}
async function refreshMatchStats(){try{renderStats(await loadStats())}catch(e){console.warn('AFRN match statistics:',e)}}
refreshMatchStats();
setInterval(refreshMatchStats,15000);
new MutationObserver(()=>{if(document.getElementById('stats')&&!document.querySelector('#stats .afrn-stat-card')&&!document.querySelector('#stats .afrn-edit-row'))refreshMatchStats()}).observe(document.getElementById('matchApp')||document.body,{childList:true,subtree:true});
