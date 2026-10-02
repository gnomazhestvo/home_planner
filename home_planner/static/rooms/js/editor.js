const app = document.getElementById('app');
const PLAN_URL = app.dataset.planUrl;
const CSRF = app.dataset.csrf;
const CREATE_URL = app.dataset.createUrl;
const EDITOR_URL = app.dataset.editorUrl;
let W = Number(app.dataset.w), H = Number(app.dataset.h);
const SNAP=5;
const OPEN={window:[55,175],arch:[55,175]};
const KINDS={
  bed:{name:'Кровать',w:181,h:215,fill:'--bed',ink:'--bedink'},
  stand:{name:'Тумба',w:45,h:45,fill:'--store',ink:'--storeink'},
  shelf:{name:'Стеллаж',w:100,h:35,fill:'--store',ink:'--storeink'},
  desk:{name:'Стол',w:160,h:50,fill:'--desk',ink:'--deskink'},
  chair:{name:'Стул',w:45,h:45,fill:'--chair',ink:'--chairink'},
  tv:{name:'ТВ',w:97,h:6,fill:'--tv',ink:'--tv',wall:true},
  other:{name:'Предмет',w:60,h:40,fill:'--chair',ink:'--chairink'}
};
const mk=(id,kind,x,y,extra={})=>Object.assign({id,kind,x,y},KINDS[kind],extra);
let items=[], sel=null;
const uid=()=>'i'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const cur=()=>items.find(i=>i.id===sel);

const NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
const svg=$('svg');
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);parent&&parent.appendChild(e);return e}

function wardrobe(){return[[W-160,H],[W-160,H-60],[W,H-100],[W,H]]}

function drawFixed(){
  const WARD=wardrobe();
  const g=$('fixed');g.innerHTML='';
  el('rect',{x:0,y:0,width:W,height:H,fill:'none',stroke:'var(--ink)','stroke-width':3},g);
  el('polygon',{points:WARD.map(p=>p.join(',')).join(' '),fill:'var(--fixed)',stroke:'var(--muted)','stroke-width':1},g);
  const t=el('text',{x:W-75,y:H-28,'text-anchor':'middle',class:'lbl',fill:'var(--muted)'},g);t.textContent='Шкаф';
  el('line',{x1:0,y1:OPEN.window[0],x2:0,y2:OPEN.window[1],stroke:'var(--window)','stroke-width':6},g);
  el('line',{x1:W,y1:OPEN.arch[0],x2:W,y2:OPEN.arch[1],stroke:'var(--arch)','stroke-width':6},g);
  const a=el('text',{x:-8,y:118,'text-anchor':'end',class:'sz',fill:'var(--muted)'},g);a.textContent='окно';
  const b=el('text',{x:W+8,y:118,class:'sz',fill:'var(--muted)'},g);b.textContent='арка';
  const c=el('text',{x:W/2,y:-12,'text-anchor':'middle',class:'dim-t',style:'fill:var(--muted)'},g);c.textContent=String(W);
  const d=el('text',{x:-8,y:H-6,'text-anchor':'end',class:'dim-t',style:'fill:var(--muted)'},g);d.textContent=String(H);
}

function rectPoly(r){return[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]]}
function sat(A,B){for(const P of[A,B]){for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length];const nx=q[1]-p[1],ny=p[0]-q[0];let a1=Infinity,a2=-Infinity,b1=Infinity,b2=-Infinity;for(const v of A){const d=v[0]*nx+v[1]*ny;a1=Math.min(a1,d);a2=Math.max(a2,d)}for(const v of B){const d=v[0]*nx+v[1]*ny;b1=Math.min(b1,d);b2=Math.max(b2,d)}if(a2<=b1+0.01||b2<=a1+0.01)return false}}return true}
function conflicts(){
  const bad=new Set(),floor=items.filter(i=>!i.wall);
  for(let i=0;i<floor.length;i++){
    if(sat(rectPoly(floor[i]),wardrobe()))bad.add(floor[i].id);
    for(let j=i+1;j<floor.length;j++)if(sat(rectPoly(floor[i]),rectPoly(floor[j]))){bad.add(floor[i].id);bad.add(floor[j].id)}
  }
  return bad;
}
function wardTopAt(x){const x0=W-160;return(x>=x0&&x<=W)?H-60-(x-x0)/4:null}
function wardLeftAt(y){const x0=W-160;if(y>=H-60)return x0;if(y>=H-100)return x0+(H-60-y)*4;return null}
function rays(it){
  const others=items.filter(o=>o!==it&&!o.wall&&!it.wall);
  const cx=it.x+it.w/2,cy=it.y+it.h/2,res=[];
  let l=0;for(const o of others)if(cy>o.y&&cy<o.y+o.h&&o.x+o.w<=it.x+0.01)l=Math.max(l,o.x+o.w);
  res.push({x1:l,y1:cy,x2:it.x,y2:cy,d:it.x-l});
  let r=W;for(const o of others)if(cy>o.y&&cy<o.y+o.h&&o.x>=it.x+it.w-0.01)r=Math.min(r,o.x);
  if(!it.wall){const wl=wardLeftAt(cy);if(wl!==null&&wl>=it.x+it.w-0.01)r=Math.min(r,wl)}
  res.push({x1:it.x+it.w,y1:cy,x2:r,y2:cy,d:r-it.x-it.w});
  let t=0;for(const o of others)if(cx>o.x&&cx<o.x+o.w&&o.y+o.h<=it.y+0.01)t=Math.max(t,o.y+o.h);
  res.push({x1:cx,y1:t,x2:cx,y2:it.y,d:it.y-t});
  let b=H;for(const o of others)if(cx>o.x&&cx<o.x+o.w&&o.y>=it.y+it.h-0.01)b=Math.min(b,o.y);
  if(!it.wall){const wt=wardTopAt(cx);if(wt!==null&&wt>=it.y+it.h-0.01)b=Math.min(b,wt)}
  res.push({x1:cx,y1:it.y+it.h,x2:cx,y2:b,d:b-it.y-it.h});
  return res;
}

function draw(){
  const g=$('items');g.innerHTML='';
  const bad=conflicts();
  for(const it of items){
    const grp=el('g',{class:'item','data-id':it.id,tabindex:0,role:'button','aria-label':it.name+' '+it.w+' на '+it.h},g);
    const isBad=bad.has(it.id),isSel=it.id===sel;
    el('rect',{x:it.x,y:it.y,width:it.w,height:it.h,rx:it.wall?1:3,fill:isBad?'var(--dangerbg)':`var(${it.fill})`,stroke:isBad?'var(--danger)':isSel?'var(--accent)':`var(${it.ink})`,'stroke-width':isSel?2.2:0.8},grp);
    const small=Math.min(it.w,it.h)<28,tx=it.x+it.w/2;
    if(small){
      const ly=it.wall?it.y+it.h+12:it.y+it.h/2+4;
      const t=el('text',{x:tx,y:ly,'text-anchor':'middle',class:'lbl',fill:`var(${it.wall?'--muted':it.ink})`},grp);t.textContent=it.name+(it.wall?' '+it.w:'');
    }else{
      const t=el('text',{x:tx,y:it.y+it.h/2-(it.h>40?2:-3),'text-anchor':'middle',class:'lbl',fill:`var(${it.ink})`},grp);t.textContent=it.name;
      if(it.h>40){const s=el('text',{x:tx,y:it.y+it.h/2+12,'text-anchor':'middle',class:'sz',fill:`var(${it.ink})`},grp);s.textContent=it.w+'×'+it.h}
    }
    if(isSel){
      const hx=it.x+it.w,hy=it.y+it.h;
      el('rect',{x:hx-6,y:hy-6,width:12,height:12,rx:2,fill:'var(--accent)',stroke:'var(--sheet)','stroke-width':1.5,class:'handle','data-handle':it.id},grp);
    }
  }
  drawDims();panel(bad);
}
function drawDims(){
  const g=$('dims');g.innerHTML='';
  const it=cur();if(!it)return;
  for(const r of rays(it)){
    if(r.d<1)continue;
    el('line',{x1:r.x1,y1:r.y1,x2:r.x2,y2:r.y2,stroke:'var(--accent)','stroke-width':0.9,'stroke-dasharray':'3 3'},g);
    const mx=(r.x1+r.x2)/2,my=(r.y1+r.y2)/2,label=String(Math.round(r.d)),bw=label.length*7+6;
    el('rect',{x:mx-bw/2,y:my-8,width:bw,height:15,rx:3,fill:'var(--sheet)',stroke:'var(--accent)','stroke-width':0.6},g);
    const t=el('text',{x:mx,y:my+3.5,'text-anchor':'middle',class:'dim-t'},g);t.textContent=label;
  }
}
function panel(bad){
  const it=cur(),off=!it;
  for(const id of['inName','inW','inH','rot','dup','del'])$(id).disabled=off;
  if(off){$('inName').value='';$('inW').value='';$('inH').value='';$('pos').textContent='Ничего не выбрано: нажми на предмет на плане или добавь новый';}
  else{
    if(document.activeElement!==$('inName'))$('inName').value=it.name;
    if(document.activeElement!==$('inW'))$('inW').value=it.w;
    if(document.activeElement!==$('inH'))$('inH').value=it.h;
    $('pos').textContent=`от левой стены ${it.x} · от верхней ${it.y}`;
  }
  const w=$('warn');
  if(bad.size){const names=[...new Set(items.filter(i=>bad.has(i.id)).map(i=>i.name))];w.textContent='Пересекаются: '+names.join(', ')+'. Подвинь, пока красное не пропадёт.';w.hidden=false}else w.hidden=true;
}
function clamp(it){
  it.w=Math.max(2,Math.min(W,it.w));it.h=Math.max(2,Math.min(H,it.h));
  it.x=Math.max(0,Math.min(W-it.w,it.x));it.y=Math.max(0,Math.min(H-it.h,it.y));
}
function place(it){
  for(let k=0;k<12;k++){clamp(it);if(!items.some(o=>o!==it&&o.x===it.x&&o.y===it.y))break;it.x+=20;it.y+=20}
}

let drag=null;
function pt(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())}
svg.addEventListener('pointerdown',e=>{
  const g=e.target.closest('.item');
  if(!g){sel=null;draw();return}
  sel=g.dataset.id;const it=cur(),p=pt(e);
  drag=e.target.dataset.handle?{it,mode:'size',x0:it.x,y0:it.y}:{it,mode:'move',dx:p.x-it.x,dy:p.y-it.y};
  svg.setPointerCapture(e.pointerId);draw();e.preventDefault();
});
svg.addEventListener('pointermove',e=>{
  if(!drag)return;const p=pt(e),it=drag.it;
  if(drag.mode==='size'){
    it.w=Math.max(SNAP,Math.min(W-it.x,Math.round((p.x-it.x)/SNAP)*SNAP));
    it.h=Math.max(it.wall?2:SNAP,Math.min(H-it.y,Math.round((p.y-it.y)/SNAP)*SNAP));
  }else{
    it.x=Math.round((p.x-drag.dx)/SNAP)*SNAP;it.y=Math.round((p.y-drag.dy)/SNAP)*SNAP;
    clamp(it);if(it.x>W-it.w-SNAP)it.x=W-it.w;if(it.y>H-it.h-SNAP)it.y=H-it.h;
  }
  draw();
});
['pointerup','pointercancel'].forEach(t=>svg.addEventListener(t,()=>{drag=null}));
svg.addEventListener('keydown',e=>{
  const g=e.target.closest('.item');if(!g)return;sel=g.dataset.id;const it=cur();
  if(e.key==='Delete'||e.key==='Backspace'){remove();e.preventDefault();return}
  const st=e.shiftKey?1:SNAP,m={ArrowLeft:[-st,0],ArrowRight:[st,0],ArrowUp:[0,-st],ArrowDown:[0,st]}[e.key];
  if(m){it.x+=m[0];it.y+=m[1];clamp(it);draw();svg.querySelector(`[data-id="${sel}"]`).focus();e.preventDefault()}
});

function remove(){const i=items.findIndex(x=>x.id===sel);if(i<0)return;items.splice(i,1);sel=null;draw()}
function duplicate(){const it=cur();if(!it)return;const c=Object.assign({},it,{id:uid(),x:it.x+20,y:it.y+20});place(c);items.push(c);sel=c.id;draw()}
function addKind(kind){const c=mk(uid(),kind,(W-KINDS[kind].w)/2,KINDS[kind].wall?0:(H-KINDS[kind].h)/2);c.x=Math.round(c.x/SNAP)*SNAP;c.y=Math.round(c.y/SNAP)*SNAP;place(c);items.push(c);sel=c.id;draw()}

for(const k in KINDS){const b=document.createElement('button');b.type='button';b.id='add-'+k;b.textContent=KINDS[k].name;b.onclick=()=>addKind(k);$('add').appendChild(b)}
$('rot').onclick=()=>{const it=cur();if(!it)return;const cx=it.x+it.w/2,cy=it.y+it.h/2;[it.w,it.h]=[it.h,it.w];it.x=Math.round((cx-it.w/2)/SNAP)*SNAP;it.y=Math.round((cy-it.h/2)/SNAP)*SNAP;clamp(it);draw()};
$('dup').onclick=duplicate;
if($('save'))$('save').onclick=savePlan;
$('del').onclick=remove;
$('reset').onclick=loadPlan;
$('inName').oninput=e=>{const it=cur();if(it){it.name=e.target.value||'Без названия';draw()}};
$('inW').oninput=e=>{const v=+e.target.value;const it=cur();if(it&&v>0){it.w=v;clamp(it);draw()}};
$('inH').oninput=e=>{const v=+e.target.value;const it=cur();if(it&&v>0){it.h=v;clamp(it);draw()}};

function applyPlan(data){
  W=data.room.w;H=data.room.h;
  svg.setAttribute('viewBox',`-34 -30 ${W+72} ${H+62}`);
  items=data.items.map(it=>Object.assign({},KINDS[it.kind]||KINDS.other,it,{id:String(it.id)}));
  sel=null;drawFixed();draw();
}

function setMsg(text,isErr){
  const m=$('saveMsg');if(!m)return;
  m.textContent=text;m.className=isErr?'warn':'note';m.hidden=!text;
}

function planPayload(){
  return {items:items.map(i=>({kind:i.kind,name:i.name,x:Math.round(i.x),y:Math.round(i.y),w:Math.round(i.w),h:Math.round(i.h),wall:!!i.wall}))};
}

// Отправляет JSON на сервер. Возвращает ответ сервера или бросает ошибку с понятным текстом.
async function postJSON(url,payload){
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-CSRFToken':CSRF||''},body:JSON.stringify(payload)});
  let data=null;try{data=await r.json()}catch(e){}
  if(r.ok&&data)return data;
  if(r.status===403)throw new Error('сервер отклонил запрос (403). Проверь, что в шаблоне есть data-csrf');
  if(data&&Array.isArray(data.errors)){
    const lines=data.errors.map(er=>{
      const it=(payload.items||[])[er.index];
      const msgs=Object.values(er.messages||{}).flat().join(' ');
      return (it?it.name:'План')+': '+msgs;
    });
    throw new Error(lines.join('; '));
  }
  if(data&&data.error)throw new Error(data.error);
  throw new Error('сервер ответил '+r.status);
}

function savePlan(){
  const btn=$('save');btn.disabled=true;setMsg('Сохраняю…',false);
  postJSON(PLAN_URL,planPayload())
    .then(data=>{applyPlan(data);setMsg('Сохранено',false)})
    .catch(e=>setMsg('Не сохранилось: '+e.message,true))
    .finally(()=>{btn.disabled=false});
}

// «Сохранить как…»: маленькая форма с названием появляется рядом с кнопками
function setupSaveAs(){
  const save=$('save');
  const missing=[];
  if(!CREATE_URL)missing.push('data-create-url');
  if(!EDITOR_URL)missing.push('data-editor-url');
  if(missing.length)console.warn('«Сохранить как…» не настроено: в <div id="app"> нет '+missing.join(' и '));
  const open=document.createElement('button');
  open.type='button';open.id='saveAs';open.textContent='Сохранить как…';
  if(save)save.after(open);else $('panel').querySelector('.btns').prepend(open);

  const box=document.createElement('div');
  box.id='saveAsBox';box.className='saveas';box.hidden=true;
  box.innerHTML='<label class="field" for="saveAsName">Название варианта <input id="saveAsName" class="name" type="text" maxlength="256"></label>'+
    '<button id="saveAsOk" class="primary" type="button">Создать</button>'+
    '<button id="saveAsCancel" type="button">Отмена</button>';
  $('panel').appendChild(box);

  const name=$('saveAsName'),ok=$('saveAsOk');
  const close=()=>{box.hidden=true;open.disabled=false};
  open.onclick=()=>{
    if(missing.length){setMsg('«Сохранить как…» не настроено: в шаблоне в <div id="app"> не хватает '+missing.join(' и '),true);return}
    box.hidden=false;open.disabled=true;setMsg('',false);name.focus();name.select()};
  $('saveAsCancel').onclick=close;
  name.onkeydown=e=>{if(e.key==='Enter')ok.click();if(e.key==='Escape')close()};
  name.oninput=()=>setMsg('',false);
  ok.onclick=()=>{
    const title=name.value.trim();
    if(!title){setMsg('Введи название варианта',true);name.focus();return}
    ok.disabled=true;setMsg('Создаю вариант…',false);
    postJSON(CREATE_URL,Object.assign({title},planPayload()))
      .then(data=>{setMsg('Вариант создан, открываю…',false);window.location.href=EDITOR_URL.replace('/0/','/'+data.layout.id+'/')})
      .catch(e=>{setMsg('Не создано: '+e.message,true);name.focus()})
      .finally(()=>{ok.disabled=false});
  };
}

function loadPlan(){
  const err=$('loadErr');err.hidden=true;
  fetch(PLAN_URL)
    .then(r=>{if(!r.ok)throw new Error('сервер ответил '+r.status);return r.json()})
    .then(applyPlan)
    .catch(e=>{err.textContent='Не удалось загрузить план: '+e.message+'. Проверь, что runserver запущен.';err.hidden=false});
}

setupSaveAs();
drawFixed();draw();loadPlan();
