const SUPABASE_URL='https://jjqhvruppafpumcthmwe.supabase.co';
const SUPABASE_KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
const matchId=new URLSearchParams(location.search).get('id');
const box=document.getElementById('matchApp');
let liveChannel=null,refreshTimer=null,lastRendered='',realtimeState='connecting';
function esc(s){return String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[x]))}
async function api(path){const r=await fetch(SUPABASE_URL+'/rest/v1/'+path,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}});if(!r.ok)throw Error('Supabase '+r.status);return r.json()}
function type(e){return String(e.event_type||'').toLowerCase().replace(/\s+/g,'_')}
function eventIcon(e){const x=type(e);if(x==='goal'||(x.includes('goal')&&!x.includes('own')))return '⚽';if(x.includes('red'))return '🟥';if(x.includes('yellow'))return '🟨';if(x.includes('sub'))return '🔄';return '•'}
function playerName(p){return p?.full_name||[p?.first_name,p?.last_name].filter(Boolean).join(' ')||('Mchezaji #'+(p?.shirt_number||''))}
function completed(m){return m.home_score!=null&&m.away_score!=null}
function setRealtimeState(state){realtimeState=state;const el=document.getElementById('realtimeState');if(!el)return;el.textContent=state==='connected'?'🟢 LIVE CONNECTION':state==='connecting'?'🟡 Inaunganisha…':'🟠 Fallback: refresh 15s';el.className='realtime-state '+state}
async function render(){
 if(!matchId){box.innerHTML='<div class="empty">Mechi haijachaguliwa.</div>';return}
 const [matches,clubs,events,players]=await Promise.all([
  api(`matches?id=eq.${encodeURIComponent(matchId)}&select=id,competition_id,home_team_id,away_team_id,match_date,match_time,venue,home_score,away_score,status,match_number,notes,home_penalties,away_penalties`),
  api('clubs?select=id,name,short_name,afrn_club_id,logo_url,division,zone'),
  api(`match_events?match_id=eq.${encodeURIComponent(matchId)}&select=id,player_id,club_id,event_type,minute,description&order=minute,id`),
  api('players?select=id,first_name,last_name,full_name,shirt_number,position,club_id')
 ]);
 if(!matches.length){box.innerHTML='<div class="empty">Mechi haijapatikana.</div>';return}
 const m=matches[0],names=Object.fromEntries(clubs.map(c=>[c.id,c.name||c.short_name])),byPlayer=Object.fromEntries(players.map(p=>[p.id,p]));
 const homeEvents=events.filter(e=>String(e.club_id)===String(m.home_team_id)),awayEvents=events.filter(e=>String(e.club_id)===String(m.away_team_id));
 const score=m.home_score==null?'—':`${m.home_score} - ${m.away_score}`;
 const ev=events.map(e=>`<div class="timeline"><span class="minute">${esc(e.minute??'')}’</span><span class="event-icon">${eventIcon(e)}</span><div><b>${esc(e.description||playerName(byPlayer[e.player_id])||e.event_type)}</b>${e.player_id?`<small>${esc(playerName(byPlayer[e.player_id]))}</small>`:''}</div></div>`).join('');
 const starters=clubId=>events.filter(e=>String(e.club_id)===String(clubId)&&['starting_xi','starter','lineup_start','starting','starting11','lineup'].includes(type(e))).map(e=>byPlayer[e.player_id]).filter(Boolean);
 const subs=clubId=>events.filter(e=>String(e.club_id)===String(clubId)&&['substitute','bench','sub','substitution'].includes(type(e))).map(e=>byPlayer[e.player_id]).filter(Boolean);
 const lineup=clubId=>{const st=starters(clubId),sb=subs(clubId);return `<div class="lineup-side"><h3>${esc(names[clubId]||'Timu')}</h3><h4>Starting XI</h4>${st.length?`<div class="player-list">${st.map(p=>`<a class="club-row" href="player.html?id=${encodeURIComponent(p.id)}"><span>${p.shirt_number?`#${esc(p.shirt_number)} `:''}${esc(playerName(p))}</span><small>${esc(p.position||'')}</small></a>`).join('')}</div>`:'<div class="empty">Starting XI haijawekwa.</div>'}<h4>Substitutes</h4>${sb.length?`<div class="player-list">${sb.map(p=>`<a class="club-row" href="player.html?id=${encodeURIComponent(p.id)}"><span>${p.shirt_number?`#${esc(p.shirt_number)} `:''}${esc(playerName(p))}</span><small>${esc(p.position||'')}</small></a>`).join('')}</div>`:'<div class="empty">Substitutes hawajawekwa.</div>'}</div>`};
 const count=(arr,keys)=>arr.filter(e=>keys.includes(type(e))).length;
 const live=!completed(m)&&['LIVE','IN_PLAY','1H','2H','HT','ET','PAUSED'].includes(String(m.status||'').toUpperCase());
 const status=String(m.status||'').toUpperCase()||(live?'LIVE':'');
 const key=JSON.stringify([m.home_score,m.away_score,m.status,events.map(e=>e.id)]);
 if(key===lastRendered)return;lastRendered=key;
 box.innerHTML=`<section class="match-hero"><div class="match-meta">${esc(m.match_date||'Tarehe haijawekwa')} ${m.match_time?'• '+esc(m.match_time):''} ${m.venue?'• '+esc(m.venue):''}</div><div class="live-row">${live?'<div class="live-pill">🔴 LIVE — Inasasishwa moja kwa moja</div>':''}<div id="realtimeState" class="realtime-state ${realtimeState}">${realtimeState==='connected'?'🟢 LIVE CONNECTION':realtimeState==='connecting'?'🟡 Inaunganisha…':'🟠 Fallback: refresh 15s'}</div></div><div class="match-teams"><div><div class="crest">⚽</div><h2>${esc(names[m.home_team_id]||m.home_team_id)}</h2><small>NYUMBANI</small></div><div class="big-score"><strong>${score}</strong><span>${esc(status||'MATOKEO')}</span></div><div><div class="crest">⚽</div><h2>${esc(names[m.away_team_id]||m.away_team_id)}</h2><small>UGENINI</small></div></div></section>
 <nav class="match-tabs"><a href="#overview">Muhtasari</a><a href="#events">Matukio</a><a href="#lineups">Lineups</a><a href="#stats">Takwimu</a></nav>
 <section id="overview" class="card"><h2>📋 Muhtasari wa Mchezo</h2><div class="quick-grid"><div><b>🏟️ Uwanja</b><span>${esc(m.venue||'—')}</span></div><div><b>📅 Tarehe</b><span>${esc(m.match_date||'—')}</span></div><div><b>⏱️ Muda</b><span>${esc(m.match_time||'—')}</span></div><div><b>🔢 Mechi</b><span>${esc(m.match_number??'—')}</span></div></div></section>
 <section id="events" class="card"><h2>⏱️ Matukio ya Mchezo</h2>${ev||'<div class="empty">Hakuna matukio yaliyorekodiwa.</div>'}</section>
 <section id="lineups" class="card"><h2>👥 Lineups</h2><div class="lineups-grid">${lineup(m.home_team_id)}${lineup(m.away_team_id)}</div></section>
 <section id="stats" class="card"><h2>📊 Takwimu za Mchezo</h2><div class="stats-list"><div><span>⚽ Goals</span><b>${count(homeEvents,['goal'])} — ${count(awayEvents,['goal'])}</b></div><div><span>🟨 Yellow Cards</span><b>${count(homeEvents,['yellow_card','yellow'])} — ${count(awayEvents,['yellow_card','yellow'])}</b></div><div><span>🟥 Red Cards</span><b>${count(homeEvents,['red_card','red'])} — ${count(awayEvents,['red_card','red'])}</b></div><div><span>⏱️ Matukio</span><b>${events.length}</b></div><div><span>🔄 Substitutions</span><b>${count(homeEvents,['substitution','sub'])} — ${count(awayEvents,['substitution','sub'])}</b></div></div><p class="muted">Possession, shots, corners, xG na takwimu nyingine zitaonekana hapa tu pale zinaporekodiwa kwenye mfumo.</p></section>`;
}
function startLive(){
 if(!matchId||!window.supabase){setRealtimeState('fallback');return}
 try{
  const client=window.supabase;
  liveChannel=client.channel('afrn-live-match-'+matchId)
   .on('postgres_changes',{event:'*',schema:'public',table:'matches',filter:'id=eq.'+matchId},()=>render().catch(console.warn))
   .on('postgres_changes',{event:'*',schema:'public',table:'match_events',filter:'match_id=eq.'+matchId},()=>render().catch(console.warn))
   .subscribe((status)=>{if(status==='SUBSCRIBED')setRealtimeState('connected');else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status))setRealtimeState('fallback')});
 }catch(e){console.warn('Realtime:',e);setRealtimeState('fallback')}
 clearInterval(refreshTimer);refreshTimer=setInterval(()=>render().catch(console.warn),15000);
}
function cleanup(){clearInterval(refreshTimer);if(liveChannel&&window.supabase)window.supabase.removeChannel(liveChannel)}
window.addEventListener('beforeunload',cleanup);
render().then(startLive).catch(e=>{box.innerHTML=`<div class="empty">❌ ${esc(e.message)}</div>`});