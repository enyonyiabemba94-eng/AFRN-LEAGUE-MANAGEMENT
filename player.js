const SUPABASE_URL='https://jjqhvruppafpumcthmwe.supabase.co';
const SUPABASE_KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
const app=document.getElementById('playerApp');const id=new URLSearchParams(location.search).get('id');
function esc(s){return String(s??'').replace(/[&<>\"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[x]))}
async function api(path){const r=await fetch(SUPABASE_URL+'/rest/v1/'+path,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}});if(!r.ok)throw new Error('Supabase: '+r.status);return r.json()}
function etype(e){return String(e.event_type||'').toLowerCase().trim().replace(/[\s-]+/g,'_')}
function eventLabel(e){const t=etype(e);if(['goal','goals','goal_scored'].includes(t))return '⚽ Goal';if(['own_goal','own-goal'].includes(t))return '⚽ Own Goal';if(t.includes('assist'))return '🅰️ Assist';if(t.includes('yellow'))return '🟨 Yellow Card';if(t.includes('red'))return '🟥 Red Card';if(t.includes('substitution')||t==='sub'||t==='sub_in'||t==='sub_out')return '🔄 Substitution';return e.event_type||'Event'}
async function load(){
 if(!id){app.innerHTML='<div class="empty">Mchezaji hajachaguliwa.</div>';return}
 try{
  const players=await api(`players?id=eq.${encodeURIComponent(id)}&select=*`);const p=players[0];
  if(!p){app.innerHTML='<div class="empty">Mchezaji hakupatikana.</div>';return}
  let club=null;try{const clubs=await api('clubs?select=id,name,short_name,division,zone,logo_url');club=clubs.find(c=>String(c.id)===String(p.club_id))||null}catch(e){}
  const name=p.name||p.full_name||p.player_name||[p.first_name,p.last_name].filter(Boolean).join(' ')||'Mchezaji';
  const number=p.jersey_number??p.number??p.shirt_number??'—',position=p.position||p.role||'—',division=p.division||club?.division||'—',clubName=club?.name||p.club_name||'—';
  let events=[];try{events=await api(`match_events?player_id=eq.${encodeURIComponent(id)}&select=id,match_id,event_type,minute,description&order=minute`)}catch(e){}
  let shots=[];try{shots=await api(`match_shots?player_id=eq.${encodeURIComponent(id)}&select=id,match_id,shot_type,xg,minute,description&order=minute`)}catch(e){}
  let matchIds=[...new Set([...events.map(e=>e.match_id),...shots.map(s=>s.match_id)].filter(Boolean))];let matches=[];
  if(matchIds.length){try{matches=await api(`matches?id=in.(${matchIds.map(encodeURIComponent).join(',')})&select=id,home_team_id,away_team_id,match_date,match_time,venue,home_score,away_score,status,competition_id&order=match_date.desc`)}catch(e){}}
  let clubs=[];try{clubs=await api('clubs?select=id,name,short_name')}catch(e){}
  const clubNameById=Object.fromEntries(clubs.map(c=>[c.id,c.name||c.short_name]));
  const matchById=Object.fromEntries(matches.map(m=>[m.id,m]));
  const goals=events.filter(e=>['goal','goals','goal_scored'].includes(etype(e))).length;
  const yellow=events.filter(e=>etype(e).includes('yellow')).length;
  const red=events.filter(e=>etype(e).includes('red')).length;
  const assists=events.filter(e=>etype(e).includes('assist')).length;
  const appearances=new Set(events.map(e=>e.match_id).filter(Boolean));
  const shotGoals=shots.filter(s=>s.shot_type==='goal').length;
  const shotsOnTarget=shots.filter(s=>s.shot_type==='on_target'||s.shot_type==='goal').length;
  const xg=shots.reduce((sum,s)=>sum+(Number(s.xg)||0),0);
  const resultForPlayer=(m)=>{if(m.home_score==null||m.away_score==null)return '—';const own=String(m.home_team_id)===String(p.club_id)?Number(m.home_score):Number(m.away_score);const other=String(m.home_team_id)===String(p.club_id)?Number(m.away_score):Number(m.home_score);return own>other?'W':own<other?'L':'D'};
  const matchRows=matches.map(m=>{const home=String(m.home_team_id)===String(p.club_id),opp=home?m.away_team_id:m.home_team_id;return `<a class="player-match-row" href="match.html?id=${encodeURIComponent(m.id)}"><span><small>${esc(m.match_date||'—')} • ${esc(m.venue||'')}</small><b>${home?'vs':'@'} ${esc(clubNameById[opp]||'Timu')}</b></span><strong>${m.home_score==null?'—':`${m.home_score} - ${m.away_score}`}</strong><em class="form-${resultForPlayer(m).toLowerCase()}">${resultForPlayer(m)}</em></a>`}).join('');
  const eventRows=events.map(e=>`<a class="timeline-item player-event-link" href="match.html?id=${encodeURIComponent(e.match_id||'')}"><span>${esc(e.minute??'—')}'</span><b>${esc(eventLabel(e))}</b><small>${esc(e.description||'')}</small></a>`).join('');
  const shotRows=shots.map(s=>`<a class="timeline-item player-event-link" href="match.html?id=${encodeURIComponent(s.match_id||'')}"><span>${esc(s.minute??'—')}'</span><b>🎯 ${esc(s.shot_type||'shot')}</b><small>${s.xg!==null&&s.xg!==undefined?'xG '+Number(s.xg).toFixed(2):''} ${esc(s.description||'')}</small></a>`).join('');
  app.innerHTML=`<section class="competition-hero"><span class="eyebrow">AFRN PLAYER CENTRE</span><div class="team-profile-head"><div class="team-logo team-logo-empty">👤</div><div><h1>${esc(name)}</h1><p class="match-meta">${esc(position)} • <a class="hero-link" href="team.html?id=${encodeURIComponent(p.club_id||'')}">${esc(clubName)}</a></p><small>Namba: ${esc(number)} • ${esc(division)}</small></div></div></section>
  <nav class="fm-tabs"><a href="#overview">Muhtasari</a><a href="#stats">Stats</a><a href="#matches">Mechi</a><a href="#events">Events</a><a href="#shots">Shots</a><a href="#history">Historia</a></nav>
  <section id="overview" class="card"><h2>👤 Wasifu</h2><div class="stats-list"><div><span>Jina</span><b>${esc(name)}</b></div><div><span>Timu</span><b><a class="inline-link" href="team.html?id=${encodeURIComponent(p.club_id||'')}">${esc(clubName)}</a></b></div><div><span>Division</span><b>${esc(division)}</b></div><div><span>Nafasi</span><b>${esc(position)}</b></div><div><span>Namba</span><b>${esc(number)}</b></div></div></section>
  <section id="stats" class="card"><h2>📊 Utendaji</h2><div class="quick-grid"><div><b>${appearances.size}</b><span>Appearances</span></div><div><b>${goals}</b><span>Goals</span></div><div><b>${assists}</b><span>Assists</span></div><div><b>${yellow}</b><span>Yellow</span></div><div><b>${red}</b><span>Red</span></div><div><b>${shots.length}</b><span>Shots</span></div><div><b>${shotsOnTarget}</b><span>On target</span></div><div><b>${xg.toFixed(2)}</b><span>xG</span></div></div><div class="info">Takwimu hutokana na data iliyorekodiwa na AFRN; mfumo hauundi takwimu ambazo hazipo.</div></section>
  <section id="matches" class="card"><div class="section-head"><h2>📅 Mechi za Mchezaji</h2><span class="event-count">${matches.length}</span></div>${matchRows||'<div class="empty">Hakuna mechi iliyounganishwa na mchezaji huyu bado.</div>'}</section>
  <section id="events" class="card"><h2>⚽ Match Events</h2>${eventRows||'<div class="empty">Hakuna event iliyorekodiwa kwa mchezaji huyu bado.</div>'}</section>
  <section id="shots" class="card"><h2>🎯 Shots</h2><div class="quick-grid"><div><b>${shots.length}</b><span>Total shots</span></div><div><b>${shotGoals}</b><span>Goals</span></div><div><b>${shotsOnTarget}</b><span>On target</span></div><div><b>${xg.toFixed(2)}</b><span>xG</span></div></div>${shotRows||'<div class="empty">Hakuna shot iliyorekodiwa kwa mchezaji huyu bado.</div>'}</section>
  <section id="history" class="card"><h2>📚 Historia ya Mchezaji</h2><p class="muted">Historia ya usajili, timu alizowahi kuchezea, misimu na mafanikio itaunganishwa hapa kadri data ya AFRN inavyokamilishwa.</p></section>`;
 }catch(e){app.innerHTML=`<div class="empty">⚠️ ${esc(e.message)}</div>`}
}
load();