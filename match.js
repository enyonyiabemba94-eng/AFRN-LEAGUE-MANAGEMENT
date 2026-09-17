const SUPABASE_URL='https://jjqhvruppafpumcthmwe.supabase.co';
const SUPABASE_KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
const matchId=new URLSearchParams(location.search).get('id');
const box=document.getElementById('matchApp');
function esc(s){return String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[x]))}
async function api(path){const r=await fetch(SUPABASE_URL+'/rest/v1/'+path,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}});if(!r.ok)throw Error('Supabase '+r.status);return r.json()}
function eventIcon(e){const x=String(e.event_type||'').toLowerCase();if(x.includes('goal'))return '⚽';if(x.includes('red'))return '🟥';if(x.includes('yellow'))return '🟨';if(x.includes('sub'))return '🔄';return '•'}
async function load(){if(!matchId){box.innerHTML='<div class="empty">Mechi haijachaguliwa.</div>';return}try{
const [matches,clubs,events,players]=await Promise.all([
api(`matches?id=eq.${encodeURIComponent(matchId)}&select=id,competition_id,home_team_id,away_team_id,match_date,match_time,venue,home_score,away_score,status,match_number,notes,home_penalties,away_penalties`),
api('clubs?select=id,name,afrn_club_id,logo_url,division,zone'),
api(`match_events?match_id=eq.${encodeURIComponent(matchId)}&select=id,player_id,club_id,event_type,minute,description&order=minute,id`),
api('players?select=id,first_name,last_name,full_name,shirt_number,position,club_id')
]);
if(!matches.length){box.innerHTML='<div class="empty">Mechi haijapatikana.</div>';return}
const m=matches[0], names=Object.fromEntries(clubs.map(c=>[c.id,c.name])), playerNames=Object.fromEntries(players.map(p=>[p.id,p.full_name||[p.first_name,p.last_name].filter(Boolean).join(' ')||('Mchezaji #'+(p.shirt_number||''))]));
const score=m.home_score==null?'—':`${m.home_score} - ${m.away_score}`;
const ev=events.map(e=>`<div class="timeline"><span class="minute">${esc(e.minute??'')}’</span><span class="event-icon">${eventIcon(e)}</span><div><b>${esc(e.description||playerNames[e.player_id]||e.event_type)}</b>${e.player_id?`<small>${esc(playerNames[e.player_id]||'')}</small>`:''}</div></div>`).join('');
const status=String(m.status||'').toUpperCase();
box.innerHTML=`<section class="match-hero"><div class="match-meta">${esc(m.match_date||'Tarehe haijawekwa')} ${m.match_time?'• '+esc(m.match_time):''} ${m.venue?'• '+esc(m.venue):''}</div><div class="match-teams"><div><div class="crest">⚽</div><h2>${esc(names[m.home_team_id]||m.home_team_id)}</h2><small>NYUMBANI</small></div><div class="big-score"><strong>${score}</strong><span>${esc(status||'MATOKEO')}</span></div><div><div class="crest">⚽</div><h2>${esc(names[m.away_team_id]||m.away_team_id)}</h2><small>UGENINI</small></div></div></section>
<nav class="match-tabs"><a href="#overview">Muhtasari</a><a href="#events">Matukio</a><a href="#lineups">Lineups</a><a href="#stats">Takwimu</a></nav>
<section id="overview" class="card"><h2>📋 Muhtasari wa Mchezo</h2><div class="quick-grid"><div><b>🏟️ Uwanja</b><span>${esc(m.venue||'—')}</span></div><div><b>📅 Tarehe</b><span>${esc(m.match_date||'—')}</span></div><div><b>⏱️ Muda</b><span>${esc(m.match_time||'—')}</span></div><div><b>🔢 Mechi</b><span>${esc(m.match_number??'—')}</span></div></div></section>
<section id="events" class="card"><h2>⏱️ Matukio ya Mchezo</h2>${ev||'<div class="empty">Hakuna matukio yaliyorekodiwa.</div>'}</section>
<section id="lineups" class="card"><h2>👥 Lineups</h2><p class="empty">Lineups zitaonyeshwa kutoka kwenye events za lineup za mchezo huu.</p></section>
<section id="stats" class="card"><h2>📊 Takwimu</h2><div class="stats-list"><div><span>Goals</span><b>${m.home_score??0} — ${m.away_score??0}</b></div><div><span>Matukio</span><b>${events.length}</b></div><div><span>🟨 Kadi za njano</span><b>${events.filter(e=>String(e.event_type).toLowerCase().includes('yellow')).length}</b></div><div><span>🟥 Kadi nyekundu</span><b>${events.filter(e=>String(e.event_type).toLowerCase().includes('red')).length}</b></div></div></section>`;
}catch(e){box.innerHTML=`<div class="empty">❌ ${esc(e.message)}</div>`}}
load();