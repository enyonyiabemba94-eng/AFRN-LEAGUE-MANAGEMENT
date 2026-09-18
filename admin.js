const URL='https://jjqhvruppafpumcthmwe.supabase.co';
const KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
const TOKEN_KEY='afrn_admin_access_token';
const $=id=>document.getElementById(id);
let token=localStorage.getItem(TOKEN_KEY)||'', comps=[], clubs=[], assignments=[], selected='';

let matches=[], currentLineups=[], currentEvents=[];
async function loadMatches(){
  matches=await api('matches?select=id,competition_id,home_team_id,away_team_id,match_date,match_time,venue,status,match_number&order=match_date.desc,match_time.desc');
  $('matchSelect').innerHTML='<option value="">Chagua mechi...</option>'+matches.map(m=>{
    const h=clubs.find(c=>String(c.id)===String(m.home_team_id))?.name||'Home';
    const a=clubs.find(c=>String(c.id)===String(m.away_team_id))?.name||'Away';
    return '<option value="'+esc(m.id)+'">'+esc(h)+' — '+esc(a)+' • '+esc(m.match_date||'')+' '+esc((m.match_time||'').slice(0,5))+'</option>';
  }).join('');
}
async function loadEventEditor(){
  const id=$('eventMatchSelect').value;
  if(!id){$('eventMeta').textContent='';$('eventClub').innerHTML='<option value="">Chagua timu...</option>';$('eventPlayer').innerHTML='<option value="">Chagua mchezaji...</option>';$('eventList').innerHTML='';return;}
  const m=matches.find(x=>String(x.id)===String(id));if(!m)return;
  const h=clubs.find(c=>String(c.id)===String(m.home_team_id)),a=clubs.find(c=>String(c.id)===String(m.away_team_id));
  $('eventMeta').textContent=(h?.name||'Home')+' vs '+(a?.name||'Away')+' • '+(m.match_date||'—')+' '+(m.match_time||'').slice(0,5);
  $('eventClub').innerHTML='<option value="">Chagua timu...</option>'+[h,a].filter(Boolean).map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('');
  await loadEvents(id);
}
async function loadEvents(id){
  currentEvents=await api('match_events?match_id=eq.'+encodeURIComponent(id)+'&select=id,event_type,minute,description,player_id,club_id,created_at&order=minute.asc,created_at.asc');
  const names=new Map(clubs.map(c=>[String(c.id),c.name]));
  const ps=await api('players?select=id,first_name,last_name');
  const pn=new Map(ps.map(p=>[String(p.id),[p.first_name,p.last_name].filter(Boolean).join(' ')||'Mchezaji']));
  const labels={goal:'⚽ Goal',assist:'🅰️ Assist',yellow_card:'🟨 Yellow Card',red_card:'🟥 Red Card',substitution:'🔄 Substitution',penalty:'⚽ Penalty'};
  $('eventList').innerHTML=currentEvents.map(e=>'<div class="admin-row"><span><b>'+esc(e.minute??0)+"' • "+esc(labels[e.event_type]||e.event_type)+'</b><small>'+esc(names.get(String(e.club_id))||'')+' • '+esc(pn.get(String(e.player_id))||e.description||'')+(e.description?' • '+esc(e.description):'')+'</small></span><button class="danger" data-event-delete="'+esc(e.id)+'">Futa</button></div>').join('')||'<div class="empty">Hakuna matukio.</div>';
  document.querySelectorAll('[data-event-delete]').forEach(b=>b.onclick=()=>deleteEvent(b.dataset.eventDelete));
}
async function loadEventPlayers(){
  const club=$('eventClub').value;
  $('eventPlayer').innerHTML='<option value="">Chagua mchezaji...</option>';
  if(!club)return;
  const ps=await api('players?club_id=eq.'+encodeURIComponent(club)+'&select=id,first_name,last_name,jersey_number&order=jersey_number');
  $('eventPlayer').innerHTML+='<option value="">Hakuna mchezaji</option>'+ps.map(p=>'<option value="'+esc(p.id)+'">'+esc([p.first_name,p.last_name].filter(Boolean).join(' ')||'Mchezaji')+' #'+esc(p.jersey_number||'—')+'</option>').join('');
}
function scoringEvent(type){return ['goal','goals','goal_scored','penalty','penalty_goal','own_goal','own-goal'].includes(String(type||'').toLowerCase().trim().replace(/[\\s-]+/g,'_'))}
function scoringDelta(type,clubId,homeId,awayId){
  const t=String(type||'').toLowerCase().trim().replace(/[\\s-]+/g,'_');
  if(!scoringEvent(t))return {home:0,away:0};
  if(t==='own_goal'||t==='own-goal')return String(clubId)===String(homeId)?{home:0,away:1}:{home:1,away:0};
  return String(clubId)===String(homeId)?{home:1,away:0}:{home:0,away:1};
}
async function adjustMatchScore(matchId,deltaHome,deltaAway){
  if(!deltaHome&&!deltaAway)return;
  const rows=await api('matches?id=eq.'+encodeURIComponent(matchId)+'&select=id,home_score,away_score');
  if(!rows.length)throw new Error('Mechi haijapatikana.');
  const m=rows[0],home=Math.max(0,Number(m.home_score||0)+deltaHome),away=Math.max(0,Number(m.away_score||0)+deltaAway);
  await api('matches?id=eq.'+encodeURIComponent(matchId),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({home_score:home,away_score:away})});
}
async function addEvent(){
  const id=$('eventMatchSelect').value,type=$('eventType').value,club=$('eventClub').value,player=$('eventPlayer').value;
  const minute=Number($('eventMinute').value),description=$('eventDescription').value.trim();
  if(!id)return msgEvent('Chagua mechi kwanza.');
  if(!club)return msgEvent('Chagua timu.');
  if(!Number.isFinite(minute)||minute<0||minute>200)return msgEvent('Dakika iwe kati ya 0 na 200.');
  if(type!=='substitution'&&type!=='assist'&&!player)return msgEvent('Chagua mchezaji kwa tukio hili.');
  const m=matches.find(x=>String(x.id)===String(id));if(!m)return msgEvent('Mechi haijapatikana.');
  $('addEvent').disabled=true;msgEvent('Inahifadhi...');
  try{
    const d=scoringDelta(type,club,m.home_team_id,m.away_team_id);
    await api('match_events',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({match_id:id,event_type:type,minute:Math.round(minute),description,player_id:player||null,club_id:club})});
    if(d.home||d.away)await adjustMatchScore(id,d.home,d.away);
    $('eventDescription').value='';$('eventMinute').value='';msgEvent(d.home||d.away?'✅ Tukio limehifadhiwa na score imesasishwa.':'✅ Tukio limehifadhiwa.');
    await loadEvents(id);await loadMatches();
  }catch(e){msgEvent('❌ '+e.message)}finally{$('addEvent').disabled=false}
}
async function deleteEvent(id){
  if(!confirm('Futa tukio hili?'))return;
  try{
    const rows=await api('match_events?id=eq.'+encodeURIComponent(id)+'&select=id,match_id,event_type,club_id');
    if(!rows.length)return;
    const e=rows[0],m=matches.find(x=>String(x.id)===String(e.match_id));
    await api('match_events?id=eq.'+encodeURIComponent(id),{method:'DELETE'});
    if(m){const d=scoringDelta(e.event_type,e.club_id,m.home_team_id,m.away_team_id);if(d.home||d.away)await adjustMatchScore(e.match_id,-d.home,-d.away);}
    await loadEvents($('eventMatchSelect').value);await loadMatches();
    msgEvent('✅ Tukio limefutwa'+(m&&scoringEvent(e.event_type)?' na score imesasishwa.':'.'));
  }catch(e){msgEvent('❌ '+e.message)}
}
function msgEvent(x){$('eventMsg').textContent=x}

async function loadLineupEditor(){
  const id=$('matchSelect').value;
  if(!id){$('matchMeta').textContent='';$('homePlayers').innerHTML='';$('awayPlayers').innerHTML='';$('lineupSummary').textContent='';return;}
  const m=matches.find(x=>String(x.id)===String(id));if(!m)return;
  const home=clubs.find(c=>String(c.id)===String(m.home_team_id)),away=clubs.find(c=>String(c.id)===String(m.away_team_id));
  $('matchMeta').textContent=(m.match_date||'—')+' '+(m.match_time||'').slice(0,5)+' • '+(m.status||'—')+' • '+(m.venue||'Venue haijawekwa');
  $('homeLineupTitle').textContent=(home?.name||'Home')+' — Lineup';
  $('awayLineupTitle').textContent=(away?.name||'Away')+' — Lineup';
  const [hp,ap,rows]=await Promise.all([
    api('players?club_id=eq.'+encodeURIComponent(m.home_team_id)+'&select=id,first_name,last_name,jersey_number,position,status&order=jersey_number'),
    api('players?club_id=eq.'+encodeURIComponent(m.away_team_id)+'&select=id,first_name,last_name,jersey_number,position,status&order=jersey_number'),
    api('match_lineups_v2?match_id=eq.'+encodeURIComponent(id)+'&select=id,club_id,player_id,shirt_number,position,starter,captain,goalkeeper,substitute,entered_minute,left_minute')
  ]);
  currentLineups=rows;renderLineupSide('homePlayers',hp,m.home_team_id);renderLineupSide('awayPlayers',ap,m.away_team_id);renderLineupSummary();
}
function renderLineupSide(target,players,clubId){
  const rows=currentLineups.filter(r=>String(r.club_id)===String(clubId)),byPlayer=new Map(rows.map(r=>[String(r.player_id),r]));
  $(target).innerHTML=players.map(p=>{
    const r=byPlayer.get(String(p.id))||{};
    return '<div class="admin-row lineup-player"><span><b>'+esc([p.first_name,p.last_name].filter(Boolean).join(' ')||'Mchezaji')+'</b><small>#'+esc(p.jersey_number||'—')+' • '+esc(p.position||'—')+'</small></span>'+
      '<label class="mini-check"><input type="checkbox" data-player="'+esc(p.id)+'" data-club="'+esc(clubId)+'" data-role="starter" '+(r.starter?'checked':'')+'> XI</label>'+
      '<label class="mini-check"><input type="checkbox" data-player="'+esc(p.id)+'" data-club="'+esc(clubId)+'" data-role="captain" '+(r.captain?'checked':'')+'> C</label>'+
      '<label class="mini-check"><input type="checkbox" data-player="'+esc(p.id)+'" data-club="'+esc(clubId)+'" data-role="goalkeeper" '+(r.goalkeeper?'checked':'')+'> GK</label>'+
      '<label class="mini-check"><input type="checkbox" data-player="'+esc(p.id)+'" data-club="'+esc(clubId)+'" data-role="substitute" '+(r.substitute?'checked':'')+'> SUB</label></div>';
  }).join('')||'<div class="empty">Hakuna wachezaji.</div>';
  document.querySelectorAll('#'+target+' input').forEach(x=>x.onchange=renderLineupSummary);
}
function getDraftLineups(){
  const by=new Map();
  document.querySelectorAll('#homePlayers input,#awayPlayers input').forEach(x=>{
    const key=x.dataset.player;
    if(!by.has(key))by.set(key,{player_id:key,club_id:x.dataset.club,starter:false,captain:false,goalkeeper:false,substitute:false});
    by.get(key)[x.dataset.role]=x.checked;
  });
  return [...by.values()].filter(r=>r.starter||r.captain||r.goalkeeper||r.substitute);
}
function renderLineupSummary(){
  const m=matches.find(x=>String(x.id)===String($('matchSelect').value));if(!m)return;
  const rows=getDraftLineups(),h=rows.filter(r=>String(r.club_id)===String(m.home_team_id)),a=rows.filter(r=>String(r.club_id)===String(m.away_team_id));
  $('lineupSummary').textContent='Home: '+h.filter(r=>r.starter).length+' XI / '+h.filter(r=>r.substitute).length+' SUB • Away: '+a.filter(r=>r.starter).length+' XI / '+a.filter(r=>r.substitute).length+' SUB';
}
async function saveLineups(){
  const id=$('matchSelect').value;if(!id)return msgLineup('Chagua mechi kwanza.');
  const m=matches.find(x=>String(x.id)===String(id)),rows=getDraftLineups(),h=rows.filter(r=>String(r.club_id)===String(m.home_team_id)),a=rows.filter(r=>String(r.club_id)===String(m.away_team_id));
  if(h.filter(r=>r.starter).length>11||a.filter(r=>r.starter).length>11)return msgLineup('Kila timu haiwezi kuwa na zaidi ya Starting XI 11.');
  if(h.filter(r=>r.captain).length>1||a.filter(r=>r.captain).length>1)return msgLineup('Kila timu iwe na Captain mmoja tu.');
  if(h.filter(r=>r.goalkeeper).length>1||a.filter(r=>r.goalkeeper).length>1)return msgLineup('Kila timu iwe na Goalkeeper mmoja tu.');
  $('saveLineups').disabled=true;msgLineup('Inahifadhi...');
  try{
    await api('match_lineups_v2?match_id=eq.'+encodeURIComponent(id),{method:'DELETE'});
    if(rows.length)await api('match_lineups_v2',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(rows.map(r=>({...r,match_id:id})))});
    msgLineup('✅ Lineup imehifadhiwa.');await loadLineupEditor();
  }catch(e){msgLineup('❌ '+e.message)}finally{$('saveLineups').disabled=false}
}
function msgLineup(x){$('lineupMsg').textContent=x}

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function api(path,opt={}){const h={apikey:KEY,Authorization:'Bearer '+(token||KEY),'Content-Type':'application/json',...(opt.headers||{})};const r=await fetch(URL+'/rest/v1/'+path,{...opt,headers:h});if(!r.ok){const t=await r.text();throw new Error(r.status+' '+t)}const t=await r.text();return t?JSON.parse(t):[]}
async function login(){const email=$('email').value.trim(),password=$('password').value;if(!email||!password)return msg('Jaza email na password.');$('login').disabled=true;msg('Inathibitisha...');try{const r=await fetch(URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password})});const data=await r.json();if(!r.ok)throw new Error(data.error_description||data.msg||'Login imekataa');token=data.access_token;localStorage.setItem(TOKEN_KEY,token);$('loginCard').classList.add('hidden');$('adminApp').classList.remove('hidden');await load()}catch(e){token='';localStorage.removeItem(TOKEN_KEY);msg('❌ '+e.message)}finally{$('login').disabled=false}}
function msg(x){$('loginMsg').textContent=x}
async function load(){try{[comps,clubs]=await Promise.all([api('competitions?select=id,name,season,competition_type,division,status,logo_url&order=name'),api('clubs?select=id,name,short_name,division,zone,logo_url,afrn_club_id&order=name')]);$('competition').innerHTML=comps.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+' • '+esc(c.season||'')+'</option>').join('');if(!comps.length){$('compMeta').textContent='Hakuna mashindano yaliyohifadhiwa online.';return}selected=$('competition').value;await refresh();await loadMatches();$('eventMatchSelect').innerHTML=$('matchSelect').innerHTML;}catch(e){if(String(e.message).startsWith('401')||String(e.message).startsWith('403'))logout();else alert('Admin data: '+e.message)}}
async function refresh(){selected=$('competition').value;const c=comps.find(x=>String(x.id)===String(selected));$('compMeta').textContent=c?('Msimu: '+(c.season||'—')+' • Aina: '+(c.competition_type||'—')+' • Daraja: '+(c.division||'—')):'';assignments=await api('competition_teams?competition_id=eq.'+encodeURIComponent(selected)+'&select=id,competition_id,club_id,group_name');renderLists()}
function renderLists(){const ids=new Set(assignments.map(a=>String(a.club_id)));$('registered').innerHTML=assignments.map(a=>{const c=clubs.find(x=>String(x.id)===String(a.club_id));return '<div class="admin-row"><span><b>'+esc(c?.name||a.club_id)+'</b><small>'+esc(c?.division||'')+(a.group_name?' • Group '+esc(a.group_name):'')+'</small></span><button class="danger" data-remove="'+esc(a.id)+'">Ondoa</button></div>'}).join('')||'<div class="empty">Hakuna timu iliyosajiliwa.</div>';filterAvailable(ids);document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>removeTeam(b.dataset.remove))}
function filterAvailable(ids){const q=$('teamSearch').value.trim().toLowerCase();const list=clubs.filter(c=>!ids.has(String(c.id))&&((c.name||'').toLowerCase().includes(q)||(c.short_name||'').toLowerCase().includes(q)));$('available').innerHTML=list.slice(0,80).map(c=>'<div class="admin-row"><span><b>'+esc(c.name||c.short_name)+'</b><small>'+esc(c.division||'')+(c.zone?' • '+esc(c.zone):'')+'</small></span><button data-add="'+esc(c.id)+'">＋ Ongeza</button></div>').join('')||'<div class="empty">Hakuna timu nyingine.</div>';document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addTeam(b.dataset.add))}
async function addTeam(clubId){try{const c=comps.find(x=>String(x.id)===String(selected));let group=null;if(String(c?.name||'').toLowerCase().includes('upendo')){const n=assignments.length;group=String.fromCharCode(65+Math.floor(n/4));if(group>'F')group=null}await api('competition_teams',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({competition_id:selected,club_id:clubId,group_name:group})});await refresh()}catch(e){alert('Timu haijaongezwa: '+e.message)}}
async function removeTeam(id){if(!confirm('Ondoa timu hii kwenye mashindano?'))return;try{await api('competition_teams?id=eq.'+encodeURIComponent(id),{method:'DELETE'});await refresh()}catch(e){alert('Timu haijaondolewa: '+e.message)}}
function logout(){token='';localStorage.removeItem(TOKEN_KEY);$('adminApp').classList.add('hidden');$('loginCard').classList.remove('hidden');}
$('login').onclick=login;$('logout').onclick=logout;$('competition').onchange=refresh;$('teamSearch').oninput=()=>{const ids=new Set(assignments.map(a=>String(a.club_id)));filterAvailable(ids)};if(token){$('loginCard').classList.add('hidden');$('adminApp').classList.remove('hidden');load().then(loadMatches).then(()=>{ $('eventMatchSelect').innerHTML=$('matchSelect').innerHTML; }).catch(()=>logout())}
$('matchSelect').onchange=loadLineupEditor;
$('eventMatchSelect').onchange=loadEventEditor;
$('eventClub').onchange=loadEventPlayers;
$('addEvent').onclick=addEvent;$('saveLineups').onclick=saveLineups;