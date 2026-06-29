const ADMIN_PIN = 'hhc2026';
const $ = (id) => document.getElementById(id);
let animating = false;
function uniq(arr){return [...new Set(arr.map(v=>v.trim()).filter(Boolean))];}
function parseNames(){return uniq(($('names').value || '').split(/[\n\r,，、;\t]+/));}
function escapeHtml(s){return String(s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function encodeData(obj){return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function resultBase(){return new URL('./result.html', window.location.href).href;}
function makePayload(winner){
  const names = parseNames();
  return {
    v:2,
    title:$('eventTitle').value.trim() || '헥토헬스케어 이벤트 추첨',
    names,
    winner,
    winMsg:$('winMsg').value.trim() || '축하합니다! 당첨되었습니다.',
    loseMsg:$('loseMsg').value.trim() || '아쉽지만 이번 추첨에서는 미당첨입니다.',
    createdAt:new Date().toISOString()
  };
}
function makeResultUrl(payload){return resultBase() + '?d=' + encodeData(payload);}
function renderChips(){
  const names=parseNames();
  $('countPill').textContent='참여자 '+names.length+'명';
  $('stageTitle').textContent=$('eventTitle').value.trim() || '헥토헬스케어 이벤트 추첨';
  $('chips').innerHTML=names.map(n=>`<div class="chip" data-name="${escapeHtml(n)}">${escapeHtml(n)}</div>`).join('');
}
function setAdminResult(name,msg,isWin){
  $('adminResult').innerHTML=`<span class="label-small">RESULT</span><strong>${escapeHtml(name)}</strong><p>${escapeHtml(msg)}</p>`;
  $('adminResult').classList.toggle('status-win',!!isWin);
}
function animateWinner(winner, done){
  if(animating) return;
  animating=true;
  const chips=[...document.querySelectorAll('.chip')];
  chips.forEach(c=>c.classList.remove('spin','winner','loser'));
  if(!chips.length){animating=false; done&&done(); return;}
  let idx=0, rounds=Math.min(70,Math.max(28,chips.length*2)), delay=35;
  function tick(){
    chips.forEach(c=>c.classList.remove('spin'));
    chips[idx%chips.length].classList.add('spin');
    idx++; delay += 4;
    if(idx<rounds) setTimeout(tick,delay);
    else{
      chips.forEach(c=>c.classList.remove('spin'));
      chips.forEach(c=> c.classList.add(c.dataset.name===winner ? 'winner':'loser'));
      animating=false; done&&done();
    }
  }
  tick();
}
function draw(){
  if($('pin').value !== ADMIN_PIN){alert('관리자 PIN이 일치하지 않습니다.'); return;}
  const names=parseNames();
  if(!names.length){alert('참여자 명단을 입력해주세요.'); return;}
  const winner = names[Math.floor(Math.random()*names.length)];
  renderChips();
  setAdminResult('추첨 중','후보자를 확인하고 있습니다.',false);
  animateWinner(winner,()=>{
    const payload=makePayload(winner);
    const url=makeResultUrl(payload);
    $('resultUrl').value=url;
    $('openBtn').href=url;
    setAdminResult(winner,payload.winMsg,true);
  });
}
async function copyUrl(){
  const url=$('resultUrl').value;
  if(!url){alert('먼저 추첨을 시작해주세요.'); return;}
  try{await navigator.clipboard.writeText(url); alert('결과 링크를 복사했습니다.');}
  catch(e){$('resultUrl').select(); document.execCommand('copy'); alert('결과 링크를 복사했습니다.');}
}
function resetAll(){
  $('resultUrl').value=''; $('openBtn').href='#';
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('spin','winner','loser'));
  $('adminResult').className='result-panel';
  $('adminResult').innerHTML='<span class="label-small">RESULT</span><strong>대기 중</strong><p>추첨을 시작하면 최종 당첨자가 표시됩니다.</p>';
  renderChips();
}
['names','eventTitle'].forEach(id=>$(id).addEventListener('input',renderChips));
$('drawBtn').addEventListener('click',draw);
$('copyBtn').addEventListener('click',copyUrl);
$('resetBtn').addEventListener('click',resetAll);
renderChips();
