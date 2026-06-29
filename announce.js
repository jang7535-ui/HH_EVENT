function dec(str){try{str=str.replace(/-/g,'+').replace(/_/g,'/');while(str.length%4)str+='=';return JSON.parse(decodeURIComponent(escape(atob(str))))}catch(e){return null}}
const p=new URLSearchParams(location.search);const ev=p.get('d')?dec(p.get('d')):null;
if(ev){document.getElementById('event').textContent=ev.t||'헥토헬스케어 이벤트 추첨';document.getElementById('winner').textContent=ev.w||'-';document.getElementById('msg').textContent=ev.wm||'축하합니다! 당첨되었습니다.';}else{document.getElementById('winner').textContent='확인 불가';document.getElementById('msg').textContent='발표 링크 데이터가 없습니다.';}
