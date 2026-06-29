const $ = (id) => document.getElementById(id);
function decodeData(str){
  try{
    str=str.replace(/-/g,'+').replace(/_/g,'/'); while(str.length%4) str+='=';
    return JSON.parse(decodeURIComponent(escape(atob(str))));
  }catch(e){return null;}
}
function dataFromUrl(){return decodeData(new URLSearchParams(location.search).get('d') || '');}
function escapeHtml(s){return String(s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
const data = dataFromUrl();
function setBox(status,msg,kind){
  const box=$('statusBox');
  box.className='status-box '+(kind==='win'?'status-win':kind==='lose'?'status-lose':'');
  box.innerHTML=`<span class="label-small">RESULT</span><strong>${escapeHtml(status)}</strong><p>${escapeHtml(msg)}</p>`;
}
function toggleResult(isWin, done){
  const box=$('statusBox');
  box.className='status-box checking';
  let i=0,total=18;
  function render(){
    const winText=i%2===0;
    box.innerHTML=`<span class="label-small">CHECKING</span><strong>${winText?'당첨':'미당첨'}</strong><p>결과를 확인하고 있습니다.</p>`;
    i++;
    if(i<=total) setTimeout(render,90+i*12);
    else done();
  }
  render();
}
function normalize(s){return String(s||'').trim().replace(/\s+/g,'');}
function check(){
  if(!data || !Array.isArray(data.names) || !data.winner){setBox('확인 불가','유효하지 않은 결과 링크입니다. 관리자에게 링크를 다시 요청해주세요.','lose'); return;}
  const name=$('checkName').value.trim();
  if(!name){alert('이름을 입력해주세요.'); return;}
  const names=data.names.map(normalize);
  const input=normalize(name);
  if(!names.includes(input)){setBox('확인 불가','등록된 참여자 명단에서 확인되지 않습니다.','lose'); return;}
  const isWin = input === normalize(data.winner);
  toggleResult(isWin,()=>setBox(isWin?'당첨':'미당첨',isWin?data.winMsg:data.loseMsg,isWin?'win':'lose'));
}
if(!data){setBox('확인 불가','결과 데이터가 없는 링크입니다. 관리자에게 링크를 다시 요청해주세요.','lose');}
else{$('eventTitle').textContent=data.title || '헥토헬스케어 이벤트 추첨';}
$('checkBtn').addEventListener('click',check);
$('checkName').addEventListener('keydown',e=>{if(e.key==='Enter') check();});
