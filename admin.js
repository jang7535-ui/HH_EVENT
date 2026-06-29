const ADMIN_PIN = 'hhc2026';
const $ = (id) => document.getElementById(id);
let eventSalt = makeSalt();
let lastPayload = null;
let animating = false;

function normalizeName(name){
  return String(name || '').trim().replace(/\s+/g,' ').toLowerCase();
}
function parseNames(raw){
  const parts = String(raw || '').split(/[\n\r,，、;\t]+/).map(v => v.trim()).filter(Boolean);
  const seen = new Set();
  const out = [];
  for(const n of parts){
    const key = normalizeName(n);
    if(!seen.has(key)){seen.add(key); out.push(n);}
  }
  return out;
}
function randomInt(max){
  if(max <= 0) return 0;
  if(window.crypto && crypto.getRandomValues){
    const arr = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    do { crypto.getRandomValues(arr); } while(arr[0] >= limit);
    return arr[0] % max;
  }
  return Math.floor(Math.random() * max);
}
function makeSalt(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let s='';
  for(let i=0;i<10;i++) s += chars[randomInt(chars.length)];
  return s;
}
async function shaShort(text){
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const arr = Array.from(new Uint8Array(digest));
  return arr.map(b => b.toString(16).padStart(2,'0')).join('').slice(0,18);
}
function b64urlEncode(obj){
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function resultUrl(payload){
  const base = location.href.replace(/index\.html.*$/,'').split('?')[0].split('#')[0];
  return base + 'result.html?d=' + b64urlEncode(payload);
}
function renderNames(){
  const names = parseNames($('names').value);
  $('countPill').textContent = `참여자 ${names.length}명`;
  $('stageTitle').textContent = $('eventTitle').value.trim() || '헥토헬스케어 이벤트 추첨';
  const box = $('participants');
  box.innerHTML = '';
  names.forEach(n => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.dataset.name = n;
    chip.textContent = n;
    box.appendChild(chip);
  });
}
function setResult(name,msg,type){
  const cls = type === 'win' ? 'win' : type === 'lose' ? 'lose' : '';
  $('adminResult').innerHTML = `<div class="resultLabel">RESULT</div><div class="winnerName ${cls}">${escapeHtml(name)}</div><div class="message ${cls}">${escapeHtml(msg)}</div>`;
}
function escapeHtml(s){return String(s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function clearChipClasses(){
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('spin','winner','dim'));
}
function animateWinner(winner, done){
  if(animating) return;
  animating = true;
  const chips = Array.from(document.querySelectorAll('.chip'));
  clearChipClasses();
  if(!chips.length){animating=false; done && done(); return;}
  let idx=0;
  let total=Math.min(72, Math.max(30, chips.length*2));
  let delay=34;
  function tick(){
    chips.forEach(c=>c.classList.remove('spin'));
    chips[idx % chips.length].classList.add('spin');
    idx++;
    delay += 4;
    if(idx < total){
      setTimeout(tick, delay);
    }else{
      chips.forEach(c=>c.classList.remove('spin'));
      chips.forEach(c=>{
        if(c.dataset.name === winner) c.classList.add('winner');
        else c.classList.add('dim');
      });
      animating=false;
      done && done();
    }
  }
  tick();
}
function confetti(){
  const box = $('confetti'); box.innerHTML='';
  const colors=['#ff5a00','#facc15','#22c55e','#60a5fa','#f472b6'];
  for(let i=0;i<90;i++){
    const p=document.createElement('i');
    p.style.left=Math.random()*100+'%';
    p.style.top=(-20-Math.random()*160)+'px';
    p.style.background=colors[randomInt(colors.length)];
    p.style.animationDelay=(Math.random()*0.45)+'s';
    box.appendChild(p);
  }
  setTimeout(()=>box.innerHTML='',2200);
}
async function buildPayload(names,winner){
  const salt = eventSalt;
  const hashes = [];
  for(const n of names) hashes.push(await shaShort(salt + '|' + normalizeName(n)));
  const winnerHash = await shaShort(salt + '|' + normalizeName(winner));
  return {
    v:3,
    t:$('eventTitle').value.trim() || '헥토헬스케어 이벤트 추첨',
    s:salt,
    h:hashes,
    w:winnerHash,
    wm:$('winMsg').value.trim() || '축하합니다! 당첨되었습니다.',
    lm:$('loseMsg').value.trim() || '아쉽지만 이번 추첨에서는 미당첨입니다.',
    c:names.length,
    at:Date.now()
  };
}
async function draw(){
  const names = parseNames($('names').value);
  if(!$('pinInput').value || $('pinInput').value !== ADMIN_PIN){ alert('관리자 PIN을 확인해주세요.'); return; }
  if(!names.length){ alert('참여자 명단을 입력해주세요.'); return; }
  eventSalt = makeSalt();
  const winner = names[randomInt(names.length)];
  $('winnerPill').textContent = '추첨 중';
  setResult('추첨 중','후보자를 확인하고 있습니다.','');
  animateWinner(winner, async () => {
    lastPayload = await buildPayload(names,winner);
    $('resultLink').value = resultUrl(lastPayload);
    $('winnerPill').textContent = '당첨자: ' + winner;
    setResult(winner, $('winMsg').value.trim() || '축하합니다! 당첨되었습니다.','win');
    confetti();
  });
}
function copyLink(){
  const val = $('resultLink').value;
  if(!val){ alert('먼저 추첨을 실행해주세요.'); return; }
  navigator.clipboard?.writeText(val).then(()=>alert('참여자 결과 링크를 복사했습니다.')).catch(()=>{
    $('resultLink').select(); document.execCommand('copy'); alert('참여자 결과 링크를 복사했습니다.');
  });
}
function clearDraw(){
  eventSalt = makeSalt();
  lastPayload = null;
  $('resultLink').value='';
  $('winnerPill').textContent='당첨자 미선정';
  clearChipClasses();
  setResult('대기 중','추첨을 시작하면 당첨자가 표시됩니다.','');
}
function resetAll(){
  if(confirm('입력값과 추첨 결과를 초기화할까요?')){
    $('eventTitle').value='헥토헬스케어 이벤트 추첨';
    $('names').value='';
    $('winMsg').value='축하합니다! 당첨되었습니다.';
    $('loseMsg').value='아쉽지만 이번 추첨에서는 미당첨입니다.';
    clearDraw(); renderNames();
  }
}
function login(){
  if($('pinInput').value !== ADMIN_PIN){ alert('관리자 PIN이 올바르지 않습니다.'); return; }
  $('lockView').classList.add('hidden');
  $('adminView').classList.remove('hidden');
  renderNames();
}
['eventTitle','names','winMsg','loseMsg'].forEach(id=>$(id).addEventListener('input',renderNames));
$('loginBtn').addEventListener('click',login);
$('pinInput').addEventListener('keydown',e=>{if(e.key==='Enter') login();});
$('drawBtn').addEventListener('click',draw);
$('copyBtn').addEventListener('click',copyLink);
$('clearDrawBtn').addEventListener('click',clearDraw);
$('resetAllBtn').addEventListener('click',resetAll);
renderNames();
