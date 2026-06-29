const HHC = (() => {
  const ADMIN_PIN = 'hhc2026';
  const $ = (id) => document.getElementById(id);
  const enc = new TextEncoder();
  const safeJson = (obj) => JSON.stringify(obj);
  const normalizeName = (s) => String(s || '').trim().replace(/\s+/g, '');
  const uniqueNames = (txt) => [...new Set(String(txt || '').split(/[\n\r,，、;\t]+/).map(v => v.trim()).filter(Boolean))];
  const escapeHtml = (s) => String(s).replace(/[&<>\"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const randomId = (len=10) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    return [...arr].map(n => chars[n % chars.length]).join('');
  };
  const randomIndex = (max) => {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  };
  async function sha256Hex(text){
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
  }
  function toB64Url(str){
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function fromB64Url(str){
    try{
      str = String(str || '').replace(/-/g,'+').replace(/_/g,'/');
      while(str.length % 4) str += '=';
      return decodeURIComponent(escape(atob(str)));
    }catch(e){ return ''; }
  }
  function dataParam(){ return new URLSearchParams(location.search).get('d') || ''; }
  function parsePayload(){
    const raw = fromB64Url(dataParam());
    if(!raw) return null;
    try{return JSON.parse(raw)}catch(e){return null}
  }
  function setResult(el, title, msg, type){
    if(!el) return;
    el.classList.remove('checking');
    const cls = type === 'win' ? 'win' : type === 'lose' ? 'lose' : '';
    el.innerHTML = `<div class="label">RESULT</div><div class="big ${cls}">${escapeHtml(title)}</div><div class="msg ${cls}">${escapeHtml(msg)}</div>`;
  }
  function confetti(el){
    if(!el) return;
    el.innerHTML = '';
    const colors = ['#ff5a00','#facc15','#22c55e','#60a5fa','#f472b6'];
    for(let i=0;i<90;i++){
      const p=document.createElement('i');
      p.style.left = Math.random()*100 + '%';
      p.style.top = (-40 - Math.random()*160) + 'px';
      p.style.background = colors[Math.floor(Math.random()*colors.length)];
      p.style.animationDelay = Math.random()*0.5 + 's';
      el.appendChild(p);
    }
    setTimeout(()=>{el.innerHTML=''},2300);
  }
  return { $, ADMIN_PIN, normalizeName, uniqueNames, randomId, randomIndex, sha256Hex, toB64Url, safeJson, parsePayload, setResult, confetti, escapeHtml };
})();

const LotteryAdmin = (() => {
  let animating = false;
  const { $, ADMIN_PIN, normalizeName, uniqueNames, randomId, randomIndex, sha256Hex, toB64Url, safeJson, setResult, confetti } = HHC;
  function renderChips(names){
    const box = $('chips'); box.innerHTML = '';
    names.forEach(n => {
      const d = document.createElement('div');
      d.className = 'chip'; d.textContent = n; d.dataset.name = n;
      box.appendChild(d);
    });
    $('count').textContent = `참여자 ${names.length}명`;
  }
  function formData(){
    return {
      title: $('eventTitle').value.trim() || '헥토헬스케어 이벤트 추첨',
      names: uniqueNames($('participants').value),
      winMsg: $('winMsg').value.trim() || '축하합니다! 당첨되었습니다.',
      loseMsg: $('loseMsg').value.trim() || '아쉽지만 이번 추첨에서는 미당첨입니다.'
    };
  }
  function animateWinner(winner, done){
    if(animating) return;
    animating = true;
    const chips = [...document.querySelectorAll('.chip')];
    chips.forEach(c => c.classList.remove('spin','winner','loser'));
    let i=0, delay=38;
    const total = Math.min(72, Math.max(30, chips.length * 3));
    function tick(){
      chips.forEach(c => c.classList.remove('spin'));
      chips[i % chips.length]?.classList.add('spin');
      i++; delay += 4;
      if(i < total) setTimeout(tick, delay);
      else{
        chips.forEach(c => c.classList.remove('spin'));
        chips.forEach(c => c.classList.toggle('winner', c.dataset.name === winner));
        chips.forEach(c => c.classList.toggle('loser', c.dataset.name !== winner));
        animating = false; done && done();
      }
    }
    tick();
  }
  async function makePayload(data, winner){
    const salt = randomId(16);
    const hashes = [];
    for(const name of data.names){ hashes.push(await sha256Hex(salt + '|' + normalizeName(name))); }
    const winnerHash = await sha256Hex(salt + '|' + normalizeName(winner));
    return {
      v:2,
      eventId: randomId(8),
      title: data.title,
      salt,
      hashes,
      winnerHash,
      winMsg: data.winMsg,
      loseMsg: data.loseMsg,
      createdAt: new Date().toISOString()
    };
  }
  function resultUrl(payload){
    const base = location.href.replace(/index\.html.*$/,'').replace(/[#?].*$/,'');
    return `${base}result.html?d=${toB64Url(safeJson(payload))}`;
  }
  async function draw(){
    if($('pin').value !== ADMIN_PIN){ alert('관리자 PIN이 올바르지 않습니다.'); return; }
    const data = formData();
    if(data.names.length < 2){ alert('참여자를 2명 이상 입력해주세요.'); return; }
    renderChips(data.names);
    $('stageTitle').textContent = data.title;
    const winner = data.names[randomIndex(data.names.length)];
    $('winnerStatus').textContent = '추첨 중';
    setResult($('result'), '추첨 중', '후보자를 확인하고 있습니다.', null);
    animateWinner(winner, async () => {
      const payload = await makePayload(data, winner);
      $('resultUrl').value = resultUrl(payload);
      $('winnerStatus').textContent = `당첨자: ${winner}`;
      setResult($('result'), winner, data.winMsg, 'win');
      confetti($('confetti'));
    });
  }
  function copyUrl(){
    const input = $('resultUrl');
    if(!input.value){ alert('추첨 후 결과 링크가 생성됩니다.'); return; }
    navigator.clipboard?.writeText(input.value).then(()=>alert('결과 링크를 복사했습니다.')).catch(()=>{input.select();document.execCommand('copy');alert('결과 링크를 복사했습니다.');});
  }
  function reset(){
    $('resultUrl').value = '';
    $('winnerStatus').textContent = '당첨자 미선정';
    renderChips(formData().names);
    setResult($('result'), '대기 중', '참여자를 등록하고 추첨을 시작하세요.', null);
  }
  function init(){
    renderChips(formData().names);
    $('stageTitle').textContent = $('eventTitle').value;
    $('participants').addEventListener('input', () => renderChips(formData().names));
    $('eventTitle').addEventListener('input', () => $('stageTitle').textContent = $('eventTitle').value || '헥토헬스케어 이벤트 추첨');
    $('drawBtn').addEventListener('click', draw);
    $('copyBtn').addEventListener('click', copyUrl);
    $('resetBtn').addEventListener('click', reset);
  }
  return { init };
})();

const LotteryResult = (() => {
  const { $, normalizeName, sha256Hex, parsePayload, setResult, confetti, escapeHtml } = HHC;
  let payload = null;
  function renderMissing(){
    setResult($('toggleBox'), '확인 불가', '결과 링크 정보가 없습니다. 관리자에게 받은 결과 링크로 다시 접속해주세요.', 'lose');
    $('checkBtn').disabled = true;
  }
  function toggleAnimation(finalIsWin, done){
    const box = $('toggleBox');
    box.classList.add('checking');
    let i = 0; const total = 20;
    function tick(){
      const winText = i % 2 === 0;
      box.innerHTML = `<div class="label">CHECKING</div><div class="big ${winText?'statusWin':'statusLose'}">${winText?'당첨':'미당첨'}</div><div class="msg">결과를 확인하고 있습니다.</div>`;
      i++;
      if(i <= total) setTimeout(tick, 75 + i * 13);
      else { box.classList.remove('checking'); done && done(); }
    }
    tick();
  }
  async function check(){
    const name = $('checkName').value.trim();
    if(!name){ alert('이름을 입력해주세요.'); return; }
    if(!payload){ renderMissing(); return; }
    const hash = await sha256Hex(payload.salt + '|' + normalizeName(name));
    const exists = payload.hashes.includes(hash);
    if(!exists){
      setResult($('toggleBox'), '확인 불가', '등록된 참여자 명단에서 확인되지 않습니다.', 'lose');
      return;
    }
    const isWin = hash === payload.winnerHash;
    toggleAnimation(isWin, () => {
      setResult($('toggleBox'), isWin ? '당첨' : '미당첨', isWin ? payload.winMsg : payload.loseMsg, isWin ? 'win' : 'lose');
      if(isWin) confetti($('publicConfetti'));
    });
  }
  function init(){
    payload = parsePayload();
    if(!payload){ renderMissing(); return; }
    $('publicTitle').textContent = payload.title || '헥토헬스케어 이벤트 추첨';
    $('resultEventTitle').textContent = payload.title || '결과 확인';
    $('checkBtn').addEventListener('click', check);
    $('checkName').addEventListener('keydown', (e) => { if(e.key === 'Enter') check(); });
  }
  return { init };
})();
