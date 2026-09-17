const SUPABASE_URL='https://jjqhvruppafpumcthmwe.supabase.co';
const SUPABASE_KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
const app=document.getElementById('teamApp');
const q=new URLSearchParams(location.search);const teamId=q.get('id');
function esc(s){return String(s??'').replace(/[&<>\"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[x]))}
async function api(path){const r=await fetch(SUPABASE_URL+'/rest/v1/'+path,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}});if(!r.ok)throw new Error('Supabase: '+r.status);return r.json()}
function localTeams(){return JSON.parse(localStorage.getItem('afrn_master_teams')||'[]')}
function stat(v){return Number(v||0)}
async function load(){
 if(!teamId){app.innerHTML='<div class="empty">Timu haijachaguliwa.</div>';return}
 const local=localTeams().find(t=>String(t.id)===String(teamId));
 let club=null,players=[],matches=[];
 try{
  const clubs=await api('clubs?select=*&order=name');
  club=clubs.find(c=>String(c.id)===String(teamId)||String(c.afrn_club_id||'')===String(teamId)||String(c.name||'').toLowerCase()===String(teamId).toLowerCase())||null;
  if(club){
   const pid=encodeURIComponent(club.id);
   try{players=await api(`players?club_id=eq.${pid}&select=*`)}catch(e){players=[]}
   try{matches=await api(`matches?or=(home_team_id.eq.${pid},away_team_id.eq.${pid})&select=id,competition_id,home_team_id,away_team_id,match_date,match_time,venue,home_score,away_score,status&order=match_date.desc&limit=20`)}catch(e){matches=[]}
  }
 }catch(e){}
 const t=local||club||{};const name=t.jina||t.name||t.short_name||'Timu';
 const division=t.division||'—',zone=t.zone||'—',clubCode=t.afrn_club_id||t.club_code||t.id||'—';
 const logo=t.logo_url||'';
 const p=stat(t.P),w=stat(t.W||t.wins),d=stat(t.D||t.draws),l=stat(t.L||t.losses),gf=stat(t.GF||t.goals_for),ga=stat(t.GA||t.goals_against),pts=stat(t.Pts||t.points),gd=gf-ga;
 const playerRows=players.map((x,i)=>{const n=x.name||x.full_name||x.player_name||[x.first_name,x.last_name].filter(Boolean).join(' ')||`Mchezaji ${i+1}`;return `<a class="club-row" href="player.html?id=${encodeURIComponent(x.id)}"><span>${i+1}. ${esc(n)}</span><small>${esc(x.position||x.role||'Mchezaji')}</small></a>`}).join('');
 const matchRows=matches.map(m=>{const home=String(m.home_team_id)===String(club?.id);const opponent=home?(m.away_team_id||'Mpinzani'):(m.home_team_id||'Mpinzani');const score=m.home_score==null?'—':`${m.home_score} - ${m.away_score}`;return `<a class="match-row-link" href="match.html?id=${encodeURIComponent(m.id)}"><span><small>${esc(m.match_date||'—')} • ${esc(m.status||'')}</small><strong>${home?'vs':'@'} ${esc(opponent)}</strong></span><b>${esc(score)}</b></a>`}).join('');
 app.innerHTML=`<section class="competition-hero"><span class="eyebrow">AFRN TEAM CENTRE</span><div class="team-profile-head">${logo?`<img class="team-logo" src="${esc(logo)}" alt="">`:'<div class="team-logo team-logo-empty">⚽</div>'}<div><h1>${esc(name)}</h1><p class="match-meta">${esc(division)} • ${esc(zone)}</p><small>AFRN Club ID: ${esc(clubCode)}</small></div></div></section>
 <nav class="fm-tabs"><a href="#overview">Muhtasari</a><a href="#squad">Kikosi</a><a href="#matches">Mechi</a><a href="#stats">Stats</a><a href="#history">Historia</a></nav>
 <section id="overview" class="card"><h2>🏟️ Muhtasari wa Timu</h2><div class="quick-grid"><div><b>${p}</b><span>Mechi</span></div><div><b>${w}</b><span>Ushindi</span></div><div><b>${d}</b><span>Sare</span></div><div><b>${l}</b><span>Kushindwa</span></div></div><div class="stats-list"><div><span>Division</span><b>${esc(division)}</b></div><div><span>Zone</span><b>${esc(zone)}</b></div><div><span>GF / GA / GD</span><b>${gf} / ${ga} / ${gd}</b></div><div><span>Points</span><b>${pts}</b></div></div></section>
 <section id="squad" class="card"><h2>👥 Kikosi</h2>${playerRows||'<div class="empty">Hakuna wachezaji waliounganishwa na timu hii bado.</div>'}</section>
 <section id="matches" class="card"><h2>📅 Mechi</h2>${matchRows||'<div class="empty">Hakuna mechi za timu hii zilizopatikana bado.</div>'}</section>
 <section id="stats" class="card"><h2>📊 Takwimu</h2><div class="quick-grid"><div><b>${gf}</b><span>Goals For</span></div><div><b>${ga}</b><span>Goals Against</span></div><div><b>${gd}</b><span>Goal Difference</span></div><div><b>${pts}</b><span>Points</span></div></div></section>
 <section id="history" class="card"><h2>📚 Historia</h2><p class="muted">Historia ya timu itaunganishwa na misimu, mashindano, matokeo na vikombe bila kuchanganya timu nyingine.</p></section>`;
}
load();
