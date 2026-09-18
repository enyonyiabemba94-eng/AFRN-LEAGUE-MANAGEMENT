const SUPABASE_URL='https://jjqhvruppafpumcthmwe.supabase.co';
const SUPABASE_KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
const app=document.getElementById('playerApp');
const id=new URLSearchParams(location.search).get('id');

function esc(s){return String(s??'').replace(/[&<>\\"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\"':'&quot;',"'":'&#039;'}[x]))}
async function api(path){const r=await fetch(SUPABASE_URL+'/rest/v1/'+path,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}});if(!r.ok)throw new Error('Supabase: '+r.status);return r.json()}
function etype(e){return String(e.event_type||'').toLowerCase().trim().replace(/[\\s-]+/g,'_')}
function playerName(p){return p?.full_name||[p?.first_name,p?.last_name].filter(Boolean).join(' ')||p?.name||'Mchezaji'}
function eventLabel(e){const t=etype(e);if(['goal','goals','goal_scored'].includes(t))return '⚽ Goal';if(['own_goal','own-goal'].includes(t))return '⚽ Own Goal';if(t.includes('assist'))return '🅰️ Assist';if(t.includes('yellow'))return '🟨 Yellow Card';if(t.includes('red'))return '🟥 Red Card';if(t.includes('substitution')||t==='sub'||t==='sub_in'||t==='sub_out')return '🔄 Substitution';return e.event_type||'Event'}
function resultForPlayer(m,clubId){if(m.home_score==null||m.away_score==null)return '—';const home=String(m.home_team_id)===String(clubId),own=home?Number(m.home_score):Number(m.away_score),other=home?Number(m.away_score):Number(m.home_score);return own>other?'W':own<other?'L':'D'}
function dateText(v){return v?new Date(v+'T00:00:00').toLocaleDateString('sw-TZ',{day:'2-digit',month:'short',year:'numeric'}):'—'}

async function load(){
 if(!id){app.innerHTML='<div class="empty">Mchezaji hajachaguliwa.</div>';return}
 try{
  const players=await api(`players?id=eq.${encodeURIComponent(id)}&select=*`);
  const p=players[0];
  if(!p){app.innerHTML='<div class="empty">Mchezaji hakupatikana.</div>';return}

  let clubs=[];try{clubs=await api('clubs?select=id,name,short_name,division,zone,logo_url,afrn_club_id&order=name')}catch(e){}
  const clubById=Object.fromEntries(clubs.map(c=>[c.id,c]));
  const currentClub=clubById[p.club_id]||null;
  const name=playerName(p);
  const number=p.jersey_number??'—',position=p.position||'—',division=p.division||currentClub?.division||'—';
  const clubName=currentClub?.name||'Free agent / Haijaunganishwa';
  const photo=p.photo_url||'';

  let events=[],shots=[],contracts=[],transfers=[],lineups=[];
  try{events=await api(`match_events?player_id=eq.${encodeURIComponent(id)}&select=id,match_id,club_id,event_type,minute,description&order=minute.asc,id.asc`)}catch(e){}
  try{shots=await api(`match_shots?player_id=eq.${encodeURIComponent(id)}&select=id,match_id,shot_type,xg,minute,description&order=minute.asc,created_at.asc`)}catch(e){}
  try{contracts=await api(`player_contracts?player_id=eq.${encodeURIComponent(id)}&select=id,club_id,contract_number,start_date,end_date,status,league_name,loan_type,registration_type,from_club_id,transfer_id,notes&order=start_date.desc.nullslast,created_at.desc`)}catch(e){}
  try{transfers=await api(`transfers?player_id=eq.${encodeURIComponent(id)}&select=id,from_club_id,to_club_id,transfer_date,transfer_number,status,transfer_type,loan_end_date,contract_start_date,contract_end_date,contract_years,notes&order=transfer_date.desc.nullslast,created_at.desc`)}catch(e){}
  // match_lineups uses legacy bigint IDs while players.id is UUID; do not query it with a UUID.
  // Lineup records will be linked when a valid UUID-compatible mapping is available.
  lineups=[];

  const matchIds=[...new Set([...events.map(e=>e.match_id),...shots.map(s=>s.match_id)].filter(Boolean))];
  let matches=[];
  if(matchIds.length){try{matches=await api(`matches?id=in.(${matchIds.map(encodeURIComponent).join(',')})&select=id,home_team_id,away_team_id,match_date,match_time,venue,home_score,away_score,status,competition_id&order=match_date.desc`)}catch(e){}}
  const matchById=Object.fromEntries(matches.map(m=>[m.id,m]));
  const appearanceIds=new Set(events.map(e=>e.match_id).filter(Boolean));
  const goals=events.filter(e=>['goal','goals','goal_scored'].includes(etype(e))).length;
  const assists=events.filter(e=>etype(e).includes('assist')).length;
  const yellow=events.filter(e=>etype(e).includes('yellow')).length;
  const red=events.filter(e=>etype(e).includes('red')).length;
  const shotGoals=shots.filter(s=>s.shot_type==='goal').length;
  const shotsOnTarget=shots.filter(s=>s.shot_type==='on_target'||s.shot_type==='goal').length;
  const xg=shots.reduce((sum,s)=>sum+(Number(s.xg)||0),0);

  const matchRows=matches.map(m=>{
    const home=String(m.home_team_id)===String(p.club_id),opp=home?m.away_team_id:m.home_team_id;
    const res=resultForPlayer(m,p.club_id);
    return `<a class="player-match-row" href="match.html?id=${encodeURIComponent(m.id)}"><span><small>${esc(dateText(m.match_date))} • ${esc(m.venue||'')}</small><b>${home?'vs':'@'} ${esc(clubById[opp]?.name||clubById[opp]?.short_name||'Timu')}</b></span><strong>${m.home_score==null?'—':`${m.home_score} - ${m.away_score}`}</strong><em class="form-${res.toLowerCase()}">${res}</em></a>`
  }).join('');

  const eventRows=events.map(e=>`<a class="timeline-item player-event-link" href="match.html?id=${encodeURIComponent(e.match_id||'')}"><span>${esc(e.minute??'—')}'</span><b>${esc(eventLabel(e))}</b><small>${esc(e.description||'')}</small></a>`).join('');
  const shotRows=shots.map(s=>`<a class="timeline-item player-event-link" href="match.html?id=${encodeURIComponent(s.match_id||'')}"><span>${esc(s.minute??'—')}'</span><b>🎯 ${esc(s.shot_type||'shot')}</b><small>${s.xg!==null&&s.xg!==undefined?'xG '+Number(s.xg).toFixed(2):''} ${esc(s.description||'')}</small></a>`).join('');

  const lineupRows=lineups.map(l=>{
    const m=matchById[l.match_id],home=m&&String(m.home_team_id)===String(l.club_id),opp=m?(home?m.away_team_id:m.home_team_id):null;
    const role=l.starter?'Starter':l.substitute?'Substitute':'Squad';
    const flags=[l.captain?'Captain':'',l.goalkeeper?'GK':''].filter(Boolean).join(' • ');
    return `<a class="player-match-row" href="match.html?id=${encodeURIComponent(l.match_id||'')}"><span><small>${esc(dateText(m?.match_date))} • ${esc(role)}${flags?' • '+flags:''}</small><b>${esc(clubById[opp]?.name||clubById[opp]?.short_name||'Mchezo')}</b></span><strong>${l.entered_minute!=null?l.entered_minute+'′':''}${l.left_minute!=null?' → '+l.left_minute+'′':''}</strong><em>${esc(l.position||'—')}</em></a>`
  }).join('');

  const contractRows=contracts.map(c=>{
    const cn=clubById[c.club_id]?.name||clubById[c.club_id]?.short_name||'Timu haijulikani';
    const type=[c.registration_type,c.loan_type].filter(Boolean).join(' • ');
    return `<div class="timeline-item"><span>${esc(dateText(c.start_date))}</span><b>${esc(cn)}</b><small>${esc(c.status||'')} ${type?'• '+esc(type):''} ${c.end_date?'• hadi '+esc(dateText(c.end_date)):''}</small></div>`
  }).join('');

  const transferRows=transfers.map(t=>{
    const from=clubById[t.from_club_id]?.name||clubById[t.from_club_id]?.short_name||'—',to=clubById[t.to_club_id]?.name||clubById[t.to_club_id]?.short_name||'—';
    return `<div class="timeline-item"><span>${esc(dateText(t.transfer_date))}</span><b>${esc(from)} → ${esc(to)}</b><small>${esc(t.transfer_type||t.status||'Transfer')} ${t.loan_end_date?'• mkopo hadi '+esc(dateText(t.loan_end_date)):''}</small></div>`
  }).join('');

  app.innerHTML=`<section class="competition-hero"><span class="eyebrow">AFRN PLAYER CENTRE</span><div class="team-profile-head">${photo?`<img class="team-logo" src="${esc(photo)}" alt="${esc(name)}" loading="lazy">`:'<div class="team-logo team-logo-empty">👤</div>'}<div><h1>${esc(name)}</h1><p class="match-meta">${esc(position)} • ${currentClub?`<a class="hero-link" href="team.html?id=${encodeURIComponent(currentClub.id)}">${esc(clubName)}</a>`:esc(clubName)}</p><small>Namba: ${esc(number)} • Division: ${esc(division)}</small></div></div></section>
  <nav class="fm-tabs"><a href="#overview">Muhtasari</a><a href="#stats">Stats</a><a href="#matches">Mechi</a><a href="#lineups">Lineups</a><a href="#events">Events</a><a href="#shots">Shots</a><a href="#history">Historia</a></nav>
  <section id="overview" class="card"><h2>👤 Wasifu</h2><div class="stats-list"><div><span>Jina</span><b>${esc(name)}</b></div><div><span>Timu</span><b>${currentClub?`<a class="inline-link" href="team.html?id=${encodeURIComponent(currentClub.id)}">${esc(clubName)}</a>`:esc(clubName)}</b></div><div><span>Division</span><b>${esc(division)}</b></div><div><span>Nafasi</span><b>${esc(position)}</b></div><div><span>Namba</span><b>${esc(number)}</b></div><div><span>Status</span><b>${esc(p.status||'—')}</b></div></div></section>
  <section id="stats" class="card"><h2>📊 Utendaji</h2><div class="quick-grid"><div><b>${appearanceIds.size}</b><span>Appearances</span></div><div><b>${goals}</b><span>Goals</span></div><div><b>${assists}</b><span>Assists</span></div><div><b>${yellow}</b><span>Yellow</span></div><div><b>${red}</b><span>Red</span></div><div><b>${shots.length}</b><span>Shots</span></div><div><b>${shotsOnTarget}</b><span>On target</span></div><div><b>${xg.toFixed(2)}</b><span>xG</span></div></div><div class="info">Takwimu hutokana na data iliyorekodiwa na AFRN; hakuna rating au takwimu za kubuniwa.</div></section>
  <section id="matches" class="card"><div class="section-head"><h2>📅 Mechi</h2><span class="event-count">${matches.length}</span></div>${matchRows||'<div class="empty">Hakuna mechi iliyounganishwa na mchezaji huyu bado.</div>'}</section>
  <section id="lineups" class="card"><div class="section-head"><h2>👥 Lineups</h2></div><div class="empty">Lineup ya mchezaji itaonekana hapa pindi AFRN itakapokuwa na rekodi inayounganishwa moja kwa moja na Player ID ya UUID.</div></section>
  <section id="events" class="card"><h2>⚽ Match Events</h2>${eventRows||'<div class="empty">Hakuna event iliyorekodiwa kwa mchezaji huyu bado.</div>'}</section>
  <section id="shots" class="card"><h2>🎯 Shots</h2><div class="quick-grid"><div><b>${shots.length}</b><span>Total shots</span></div><div><b>${shotGoals}</b><span>Goals</span></div><div><b>${shotsOnTarget}</b><span>On target</span></div><div><b>${xg.toFixed(2)}</b><span>xG</span></div></div>${shotRows||'<div class="empty">Hakuna shot iliyorekodiwa kwa mchezaji huyu bado.</div>'}</section>
  <section id="history" class="card"><h2>📚 Historia</h2><h3>📄 Contracts</h3>${contractRows||'<div class="empty">Hakuna mkataba uliounganishwa na mchezaji huyu.</div>'}<h3 style="margin-top:18px">🔄 Transfers</h3>${transferRows||'<div class="empty">Hakuna transfer iliyorekodiwa kwa mchezaji huyu.</div>'}</section>`;
 }catch(e){app.innerHTML=`<div class="empty">⚠️ ${esc(e.message)}</div>`}
}
load();