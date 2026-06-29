const $ = (id) => document.getElementById(id);
let payload = null;

function normalizeName(name){return String(name || '').trim().replace(/\s+/g,' ').toLowerCase();}
function b64urlDecode(str){
  try{
    str = String(str || '').replace(/-/g,'+').replace(/_/g,'/');
    while(str.length % 4) str += '=';
    const bin = atob(str);
    const bytes = new Uint8Array([...bin].map(c => c.charCodeAt(0)));
    return JSON.parse(new TextDecoder().decode(bytes));
  }catch(e){return null;}
}
async function shaShort(text){
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const arr = Array.from(new Uint8Array(digest));
  return arr.map(b => b.toString(16).padStart(2,'0')).join('').slice(0,18);
}
function getPayload(){
  const p = new URLSearchParams(location.search);
  return b64urlDecode(p.get('d'));
}
function escapeHtml(s){return String(s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function setResult(status,msg,isWin){
  const cls = isWin === true ? 'win' : isWin === false ? 'lose' : '';
  $('resultBox').classList.remove('checking');
  $('resultBox').innerHTML = `<div class="resultLabel">RESULT</div><div class="statusText ${cls}">${escapeHtml(status)}</div><div class="message ${cls}">${escapeHtml(msg)}</div>`;
}
function animateStatus(finalIsWin, done){
  const box = $('resultBox');
  box.classList.add('checking');
  let i=0; const total=20;
  function tick(){
    const w = i % 2 === 0;
    box.innerHTML = `<div class="resultLabel">CHECKING</div><div class="statusText ${w?'win':'lose'}">${w?'당첨':'미당첨'}</div><div class="message">결과를 확인하고 있습니다.</div>`;
    i++;
    if(i <= total) setTimeout(tick, 80 + i*13);
    else { box.classList.remove('checking'); done && done(); }
  }
  tick();
}
function confetti(){
  const box=$('confetti'); box.innerHTML='';
  const colors=['#ff5a00','#facc15','#22c55e','#60a5fa','#f472b6'];
  for(let i=0;i<90;i++){
    const p=document.createElement('i');
    p.style.left=Math.random()*100+'%';
    p.style.top=(-20-Math.random()*160)+'px';
    p.style.background=colors[Math.floor(Math.random()*colors.length)];
    p.style.animationDelay=(Math.random()*0.45)+'s';
    box.appendChild(p);
  }
  setTimeout(()=>box.innerHTML='',2200);
}
async function check(){
  if(!payload){ setResult('확인 불가','올바른 결과 링크가 아닙니다. 관리자에게 링크를 다시 요청해주세요.',false); return; }
  const name = $('nameInput').value.trim();
  if(!name){ alert('이름을 입력해주세요.'); return; }
  const hash = await shaShort(payload.s + '|' + normalizeName(name));
  const exists = Array.isArray(payload.h) && payload.h.includes(hash);
  if(!exists){ setResult('확인 불가','등록된 참여자 명단에서 확인되지 않습니다.',false); return; }
  const isWin = hash === payload.w;
  animateStatus(isWin, () => {
    setResult(isWin ? '당첨' : '미당첨', isWin ? payload.wm : payload.lm, isWin);
    if(isWin) confetti();
  });
}
function boot(){
  payload = getPayload();
  if(payload && payload.t){
    $('pageTitle').textContent = payload.t;
    $('stageTitle').textContent = payload.t;
  }else{
    setResult('확인 불가','결과 데이터가 포함되지 않은 링크입니다. 관리자에게 결과 링크를 다시 요청해주세요.',false);
  }
}
$('checkBtn').addEventListener('click',check);
$('nameInput').addEventListener('keydown',e=>{if(e.key==='Enter') check();});
boot();
