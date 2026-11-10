/* Серия дней (daily streak) для страниц Антона и Даши.
   Всё хранится в браузере (localStorage), отдельно для каждого человека. */
(function(){
"use strict";
if(window.Streak)return;

/* Стартовая серия: «у нас уже три дня» (8–10 ноября 2026). Записывается один раз при первом открытии. */
var SEEDS={anton:["2026-11-08","2026-11-09","2026-11-10"],dasha:["2026-11-08","2026-11-09","2026-11-10"]};
var NAMES={anton:"Антон",dasha:"Даша"};

/* ---------- даты ---------- */
function pad(n){return String(n).padStart(2,"0");}
function fd(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
function pd(s){var a=s.split("-").map(Number);return new Date(a[0],a[1]-1,a[2],12);}
function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x;}
function mondayOf(d){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);x.setDate(x.getDate()-((x.getDay()+6)%7));return x;}
function today(){return fd(new Date());}

/* ---------- память ---------- */
var storageOK=true;
function save(p,v){try{localStorage.setItem("strk:"+p,JSON.stringify(v));}catch(e){storageOK=false;}}
var cache={};
function load(p){
  if(cache[p])return cache[p];
  var v=null;
  try{v=JSON.parse(localStorage.getItem("strk:"+p));}catch(e){v=null;}
  if(!v||typeof v!=="object")v={};
  v.days=v.days||{};v.freeze=v.freeze||{};v.rest=v.rest||{};v.cel=v.cel||"";
  if(!v.seeded){(SEEDS[p]||[]).forEach(function(d){v.days[d]=1;});v.seeded=true;save(p,v);}
  cache[p]=v;return v;
}
function stat(v,k){return v.days[k]?"done":(v.freeze[k]?"frozen":(v.rest[k]?"rest":"none"));}
function calc(v){
  var keys=Object.keys(v.days).concat(Object.keys(v.freeze)).sort();
  if(!keys.length)return {cur:0,best:0,start:""};
  var min=keys[0],t=today(),n=0,start="",d=new Date();
  for(var i=0;i<6000;i++){
    var k=fd(d);if(k<min)break;
    var s=stat(v,k);
    if(s==="done"){n++;start=k;}
    else if(s==="none"){if(i>0)break;}   /* сегодня ещё можно успеть */
    d=addDays(d,-1);
  }
  var cur=0,best=0,dd=pd(min),end=pd(t);
  while(dd<=end){
    var kk=fd(dd),ss=stat(v,kk);
    if(ss==="done"){cur++;if(cur>best)best=cur;}
    else if(ss==="none"&&kk!==t)cur=0;
    dd=addDays(dd,1);
  }
  return {cur:n,best:Math.max(best,n),start:start};
}
function dayWord(n){
  var a=n%10,b=n%100;
  if(a===1&&b!==11)return "день подряд";
  if(a>=2&&a<=4&&(b<12||b>14))return "дня подряд";
  return "дней подряд";
}
function isMilestone(n){return n>0&&(n%5===0||(n>=7&&n%7===0));}

/* ---------- похвала ---------- */
var P={
  1:"Первый день серии! Самое трудное уже сделано 🔥",
  2:"Два дня подряд: привычка просыпается 🌱",
  3:"Три дня подряд! Тело уже говорит спасибо 💪",
  4:"Четыре дня! Вы в ритме ✨",
  6:"Шесть дней: до недели один шаг 👏",
  8:"Восемь дней! Серия набирает силу 🚀",
  9:"Девять дней! Ещё чуть-чуть до десяти 🔥"
};
var BIG={
  5:["5 дней подряд!","Это уже не случайность, а ритм 🎉"],
  7:["Неделя подряд!","Вот это характер 🏆"],
  10:["10 дней подряд!","Двузначная серия! Вы молодцы 🚀"],
  14:["2 недели подряд!","Без пропусков. Так держать 👏"],
  15:["15 дней подряд!","Половина месяца в кармане 🔥"],
  20:["20 дней подряд!","Привычка закрепляется 💫"],
  21:["21 день подряд!","Говорят, именно столько нужно, чтобы привычка прижилась ✨"],
  25:["25 дней подряд!","Почти месяц. Невероятно 🌟"],
  28:["4 недели подряд!","Месяц без пропусков 🏅"],
  30:["30 дней подряд!","Месяц подряд! Вы настоящие чемпионы 👑"],
  50:["50 дней подряд!","Полсотни! Это уже образ жизни 🏆"],
  100:["100 дней подряд!","Сто дней! Легенда 👑🔥"]
};
var GEN=["Ещё один день в копилку 💪","Серия растёт, и вы вместе с ней 🌱","Маленькие шаги — большие перемены ✨","Тело благодарит за заботу 🙌","Стабильность — вот секрет 💫","Так держать! 🔥"];
function praise(n,name){return P[n]||(GEN[n%GEN.length].replace("Так держать!","Так держать, "+name+"!"));}
function bigTexts(n){
  if(BIG[n])return BIG[n];
  if(n%5===0)return [n+" "+dayWord(n)+"!","Каждый день на счету. Так держать 🎉"];
  return [n+" "+dayWord(n)+"!","Ровный ритм — главный секрет 🎉"];
}

/* ---------- стили ---------- */
var css="\
.sk-card,.sk-card *,.sk-side,.sk-toast,.sk-big,.sk-big *{box-sizing:border-box}\
.sk-card{display:grid;grid-template-columns:auto 1fr auto;gap:14px 18px;align-items:center;background:linear-gradient(135deg,#fff3e2,#ffe0cc);color:#3b2a1f;border-radius:22px;padding:18px 20px;margin:0 0 28px;box-shadow:0 1px 0 rgba(0,0,0,.05),0 10px 30px rgba(190,90,30,.16);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;scroll-margin-top:16px}\
.sk-card.t0{background:linear-gradient(135deg,#f1f1f1,#e6e6e6)}\
.sk-card.t2{background:linear-gradient(135deg,#fff0cf,#ffd28a)}\
.sk-card.t3{background:linear-gradient(135deg,#ffe3c2,#ff9f6b);box-shadow:0 10px 36px rgba(230,90,30,.35)}\
.sk-card.t4{background:linear-gradient(135deg,#ece0ff,#c9a8ff);box-shadow:0 10px 36px rgba(120,70,220,.35)}\
.sk-left{display:flex;align-items:center;gap:8px}\
.sk-flame{font-size:46px;line-height:1;animation:skflick 1.6s ease-in-out infinite;transform-origin:50% 90%}\
.sk-card.t0 .sk-flame{animation:none;filter:grayscale(1);opacity:.6}\
@keyframes skflick{0%,100%{transform:scale(1) rotate(-2deg)}50%{transform:scale(1.1) rotate(2deg)}}\
.sk-num{font:800 64px/1 ui-rounded,'SF Pro Rounded',system-ui,sans-serif;font-variant-numeric:tabular-nums;color:#c2410c}\
.sk-card.t2 .sk-num,.sk-card.t3 .sk-num{color:#b53a00}.sk-card.t4 .sk-num{color:#5b21b6}\
.sk-num.pop{animation:skpop .7s cubic-bezier(.2,1.6,.4,1)}\
@keyframes skpop{0%{transform:scale(.4)}60%{transform:scale(1.35)}100%{transform:scale(1)}}\
.sk-title{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline;font-size:20px;font-weight:800}\
.sk-best{font-size:13px;font-weight:600;opacity:.7}\
.sk-msg{font-size:15px;margin:4px 0 10px;opacity:.9}\
.sk-week{display:flex;gap:6px;flex-wrap:wrap}\
.sk-dot{width:34px;height:42px;border-radius:12px;background:rgba(255,255,255,.65);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#7a6455;gap:1px}\
.sk-dot b{font-size:15px;line-height:1}\
.sk-dot.done{background:#f97316;color:#fff}\
.sk-dot.frozen{background:#bfe3ff;color:#144d78}\
.sk-dot.rest{background:#e9dcff;color:#4c2a85}\
.sk-dot.today{outline:3px solid #3b2a1f;outline-offset:1px}\
.sk-dot.future{opacity:.45}\
.sk-dot.miss{opacity:.55}\
.sk-right{display:flex;flex-direction:column;gap:8px;min-width:190px}\
.sk-btn{border:0;border-radius:14px;padding:13px 16px;font-weight:800;font-size:16px;font-family:inherit;background:#16a34a;color:#fff;cursor:pointer;touch-action:manipulation}\
.sk-btn:active{transform:scale(.97)}\
.sk-btn.on{background:#fff;color:#16a34a;box-shadow:inset 0 0 0 2px #16a34a}\
.sk-sec{border:0;border-radius:12px;padding:8px 12px;font-weight:700;font-size:13px;font-family:inherit;background:rgba(255,255,255,.7);color:#3b2a1f;cursor:pointer}\
.sk-sec[disabled]{opacity:.45;cursor:default}\
.sk-edit{grid-column:1/-1;font-size:13px}\
.sk-edit summary{cursor:pointer;opacity:.75;font-weight:600}\
.sk-edit .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px}\
.sk-edit input{width:80px;font:inherit;font-size:16px;padding:6px 8px;border-radius:10px;border:1.5px solid rgba(0,0,0,.2)}\
@media (max-width:680px){.sk-card{grid-template-columns:1fr;text-align:left}.sk-right{min-width:0}.sk-num{font-size:56px}}\
.sk-side{position:fixed;right:0;top:120px;z-index:55;display:flex;flex-direction:column;align-items:center;gap:0;width:46px;padding:8px 0 7px;border-radius:16px 0 0 16px;border:0;background:#fff;color:#c2410c;box-shadow:-3px 4px 16px rgba(0,0,0,.22);cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;touch-action:manipulation}\
.sk-side span{font-size:20px;line-height:1}.sk-side b{font:800 20px/1.1 ui-rounded,system-ui,sans-serif;font-variant-numeric:tabular-nums}\
.sk-side small{font-size:9px;font-weight:700;opacity:.7;margin-top:1px}\
.sk-side.t0{color:#777}.sk-side.t0 span{filter:grayscale(1);opacity:.6}\
.sk-side.t2{background:#fff3d6}.sk-side.t3{background:#ffe0cc;color:#b53a00}.sk-side.t4{background:#efe5ff;color:#5b21b6}\
.sk-side.bump{animation:skbump .8s ease}\
@keyframes skbump{30%{transform:translateX(-10px) scale(1.15)}}\
.sk-toast{position:fixed;left:50%;top:16px;transform:translate(-50%,-140%);z-index:70;background:#fff;color:#3b2a1f;border-radius:18px;padding:12px 18px 12px 14px;box-shadow:0 12px 36px rgba(0,0,0,.28);display:flex;gap:12px;align-items:center;max-width:min(440px,calc(100% - 24px));transition:transform .45s cubic-bezier(.2,1.4,.4,1);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;pointer-events:none}\
.sk-toast.show{transform:translate(-50%,0)}\
.sk-toast .e{font-size:34px;animation:skflick 1s ease-in-out infinite}\
.sk-toast b{display:block;font-size:17px}.sk-toast span{font-size:14px;opacity:.85}\
.sk-big{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(20,10,30,.55);opacity:0;transition:opacity .3s;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}\
.sk-big.show{opacity:1}\
.sk-big .box{background:linear-gradient(160deg,#fff7e8,#ffd9b0);color:#3b2a1f;border-radius:28px;padding:30px 28px 24px;text-align:center;width:min(380px,calc(100% - 32px));box-shadow:0 20px 60px rgba(0,0,0,.45);transform:scale(.6);transition:transform .5s cubic-bezier(.2,1.5,.4,1)}\
.sk-big.show .box{transform:scale(1)}\
.sk-big .fl{font-size:70px;line-height:1;animation:skflick 1.2s ease-in-out infinite}\
.sk-big .n{font:900 110px/1 ui-rounded,system-ui,sans-serif;color:#c2410c;text-shadow:0 4px 0 rgba(255,255,255,.7);animation:skpop .9s cubic-bezier(.2,1.6,.4,1)}\
.sk-big h3{margin:4px 0 6px;font-size:24px}.sk-big p{margin:0 0 18px;font-size:16px;opacity:.9}\
.sk-big button{border:0;border-radius:14px;padding:13px 26px;font-weight:800;font-size:17px;font-family:inherit;background:#f97316;color:#fff;cursor:pointer}\
.sk-conf{position:fixed;inset:0;z-index:90;pointer-events:none}\
.sk-mini{display:inline-flex;align-items:center;gap:4px;margin-top:8px;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,.2);font-weight:800;font-size:15px}\
@media (prefers-reduced-motion:reduce){.sk-flame,.sk-toast .e,.sk-big .fl,.sk-big .n,.sk-num.pop,.sk-side.bump{animation:none}.sk-toast,.sk-big .box{transition:none}}";
var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

/* ---------- конфетти ---------- */
var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function confetti(){
  if(reduce)return;
  var cv=document.createElement("canvas");cv.className="sk-conf";document.body.appendChild(cv);
  var W=cv.width=window.innerWidth,H=cv.height=window.innerHeight,ctx=cv.getContext("2d");
  var colors=["#f97316","#facc15","#22c55e","#38bdf8","#a855f7","#f43f5e","#fff"],ps=[];
  for(var i=0;i<170;i++){
    var side=i%2?1:-1,x=W/2+side*(W*0.1*Math.random());
    ps.push({x:x,y:H*0.45,vx:(Math.random()-0.5)*14+side*3,vy:-8-Math.random()*13,w:6+Math.random()*7,h:9+Math.random()*9,r:Math.random()*6,vr:(Math.random()-0.5)*0.4,c:colors[i%colors.length]});
  }
  var t0=performance.now();
  (function frame(now){
    var t=(now-t0)/1000;ctx.clearRect(0,0,W,H);
    ps.forEach(function(p){
      p.vy+=0.38;p.vx*=0.992;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.globalAlpha=Math.max(0,1-Math.max(0,t-2.6)/1.2);
      ctx.fillStyle=p.c;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();
    });
    if(t<3.9)requestAnimationFrame(frame);else cv.remove();
  })(t0);
}

/* ---------- DOM ---------- */
var cfg=null,person="dasha",nodes={};
function tier(n){return n<=0?0:(n<5?1:(n<10?2:(n<30?3:4)));}
function toast(emoji,title,text){
  if(!nodes.toast){var t=document.createElement("div");t.className="sk-toast";t.setAttribute("role","status");document.body.appendChild(t);nodes.toast=t;}
  var t=nodes.toast;t.innerHTML='<div class="e">'+emoji+'</div><div><b>'+title+'</b><span>'+text+'</span></div>';
  void t.offsetWidth;t.classList.add("show");clearTimeout(nodes.tt);
  nodes.tt=setTimeout(function(){t.classList.remove("show");},3800);
}
function big(n){
  var tt=bigTexts(n);
  var o=document.createElement("div");o.className="sk-big";o.setAttribute("role","dialog");o.setAttribute("aria-label","Новая отметка серии");
  o.innerHTML='<div class="box"><div class="fl">'+(n>=30?"👑":"🔥")+'</div><div class="n">'+n+'</div><h3>'+tt[0]+'</h3><p>'+tt[1]+'</p><button type="button">Продолжаем! 💪</button></div>';
  document.body.appendChild(o);void o.offsetWidth;o.classList.add("show");
  function close(){o.classList.remove("show");setTimeout(function(){o.remove();},350);}
  o.querySelector("button").onclick=close;o.addEventListener("click",function(e){if(e.target===o)close();});
  setTimeout(close,9000);
  confetti();
  try{if(navigator.vibrate)navigator.vibrate([80,60,80,60,200]);}catch(e){}
}
function weekHTML(v){
  var mon=mondayOf(new Date()),t=today(),names=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"],h="";
  for(var i=0;i<7;i++){
    var d=addDays(mon,i),k=fd(d),s=stat(v,k),cls="sk-dot";
    var sym=s==="done"?"✓":(s==="frozen"?"❄":(s==="rest"?"🌙":(k<t?"·":"")));
    if(s==="done")cls+=" done";else if(s==="frozen")cls+=" frozen";else if(s==="rest")cls+=" rest";
    else if(k>t)cls+=" future";else if(k<t)cls+=" miss";
    if(k===t)cls+=" today";
    h+='<div class="'+cls+'" title="'+k+'"><span>'+names[i]+'</span><b>'+sym+'</b></div>';
  }
  return h;
}
function freezeUsedThisWeek(v){
  var mon=mondayOf(new Date()),c=0;
  for(var i=0;i<7;i++){if(v.freeze[fd(addDays(mon,i))])c++;}
  return c;
}
function render(bump){
  var v=load(person),c=calc(v),n=c.cur,t=today(),done=!!v.days[t],frozen=!!v.freeze[t],tr=tier(n);
  if(nodes.card){
    nodes.card.className="sk-card t"+tr;
    nodes.num.textContent=n;
    nodes.word.textContent=dayWord(n);
    nodes.best.textContent="Рекорд: "+c.best;
    nodes.flame.textContent=n>=30?"👑":(n>0?"🔥":"🌱");
    nodes.msg.textContent=n===0?"Серия начнётся с первой отметки. Сегодня отличный день для старта!":
      (done?praise(n,NAMES[person]||""):(frozen?"Сегодня день отдыха: серия сохранена ❄":"Серия идёт. Сегодня ещё нет отметки, не прерывай её 💪"));
    nodes.week.innerHTML=weekHTML(v);
    nodes.btn.textContent=done?"✓ Сегодня засчитано":"✅ Сегодня сделано";
    nodes.btn.className="sk-btn"+(done?" on":"");
    var canFreeze=!done&&!frozen&&freezeUsedThisWeek(v)===0&&!v.rest[t];
    nodes.frz.disabled=!(frozen||canFreeze);
    nodes.frz.textContent=frozen?"↩ Отменить пропуск":"❄ Пропустить день (1 в неделю)";
    if(bump){nodes.num.classList.remove("pop");void nodes.num.offsetWidth;nodes.num.classList.add("pop");}
  }
  if(nodes.side){
    nodes.side.className="sk-side t"+tr;
    nodes.side.innerHTML='<span>'+(n>=30?"👑":(n>0?"🔥":"🌱"))+'</span><b>'+n+'</b><small>'+dayWord(n).split(" ")[0]+'</small>';
    nodes.side.setAttribute("aria-label","Серия: "+n+" "+dayWord(n)+". Открыть");
    if(bump){nodes.side.classList.remove("bump");void nodes.side.offsetWidth;nodes.side.classList.add("bump");}
  }
  document.querySelectorAll("[data-streak]").forEach(function(el){
    var vv=load(el.dataset.streak),cc=calc(vv);
    el.innerHTML=cc.cur>0?'🔥 '+cc.cur+' '+dayWord(cc.cur):'🌱 серия ещё не началась';
  });
}

/* ---------- действия ---------- */
function set(k,val,opts){
  opts=opts||{};
  var v=load(person),was=!!v.days[k];
  if(val){v.days[k]=1;delete v.freeze[k];}else delete v.days[k];
  save(person,v);
  var c=calc(v),isToday=k===today();
  if(val&&!was&&isToday&&!opts.silent){
    if(isMilestone(c.cur)&&v.cel!==c.cur+"@"+c.start){v.cel=c.cur+"@"+c.start;save(person,v);render(true);big(c.cur);}
    else{render(true);toast("🔥","+1 день! Серия: "+c.cur,praise(c.cur,NAMES[person]||""));}
  }else render(false);
  if(!opts.noCallback&&cfg&&cfg.afterMark)try{cfg.afterMark(k,!!val);}catch(e){}
}
function toggleFreeze(){
  var v=load(person),t=today();
  if(v.freeze[t])delete v.freeze[t];
  else if(!v.days[t]&&freezeUsedThisWeek(v)===0)v.freeze[t]=1;
  save(person,v);render(false);
}
function applyN(n){
  n=Math.max(0,Math.min(3650,parseInt(n,10)||0));
  var v=load(person),t=today(),doneToday=!!v.days[t];
  v.days={};v.freeze={};
  var end=doneToday?new Date():addDays(new Date(),-1);
  for(var i=0;i<n;i++)v.days[fd(addDays(end,-i))]=1;
  v.cel="";save(person,v);render(false);
}

function build(){
  var card=document.createElement("section");card.className="sk-card";card.id="skCard";card.setAttribute("aria-label","Серия дней подряд");
  card.innerHTML='<div class="sk-left"><div class="sk-flame" id="skFlame">🔥</div><div class="sk-num" id="skNum">0</div></div>'+
   '<div class="sk-mid"><div class="sk-title"><span id="skWord">дней подряд</span><span class="sk-best" id="skBest"></span></div>'+
   '<div class="sk-msg" id="skMsg"></div><div class="sk-week" id="skWeek"></div></div>'+
   '<div class="sk-right"><button class="sk-btn" id="skBtn" type="button"></button><button class="sk-sec" id="skFrz" type="button"></button></div>'+
   '<details class="sk-edit"><summary>⚙ Исправить серию</summary><div class="row"><label>Дней подряд сейчас: <input id="skN" type="number" min="0" max="3650" inputmode="numeric"></label><button class="sk-sec" id="skApply" type="button">Применить</button></div>'+
   '<div style="opacity:.7;margin-top:6px">Если сегодня уже отмечено, оно входит в это число. Данные хранятся в браузере этого устройства.</div></details>';
  var mount=cfg.mount&&document.querySelector(cfg.mount);
  if(mount){if(cfg.mountMode==="after")mount.insertAdjacentElement("afterend",card);else mount.insertBefore(card,mount.firstChild);}
  else document.body.insertBefore(card,document.body.firstChild);
  var q=function(id){return card.querySelector("#"+id);};
  nodes={card:card,num:q("skNum"),word:q("skWord"),best:q("skBest"),flame:q("skFlame"),msg:q("skMsg"),week:q("skWeek"),btn:q("skBtn"),frz:q("skFrz")};
  nodes.btn.onclick=function(){var t=today(),v=load(person);set(t,!v.days[t]);};
  nodes.frz.onclick=toggleFreeze;
  card.querySelector("#skApply").onclick=function(){applyN(card.querySelector("#skN").value);card.querySelector("details").open=false;};
  var side=document.createElement("button");side.type="button";side.className="sk-side";
  side.onclick=function(){card.scrollIntoView({behavior:reduce?"auto":"smooth",block:"center"});};
  document.body.appendChild(side);nodes.side=side;
}

window.Streak={
  init:function(c){cfg=c||{};person=cfg.person||"dasha";load(person);build();render(false);
    var inp=document.getElementById("skN");if(inp)inp.value=calc(load(person)).cur;},
  set:function(k,val,o){set(k,val,Object.assign({noCallback:true},o||{}));},
  setRest:function(list){var v=load(person),m={};(list||[]).forEach(function(d){m[d]=1;});v.rest=m;save(person,v);render(false);},
  todayKey:today,
  info:function(){return calc(load(person));},
  exportData:function(){return load(person);},
  importData:function(d){if(d&&typeof d==="object"){var v=load(person);Object.assign(v.days,d.days||{});Object.assign(v.freeze,d.freeze||{});v.seeded=true;save(person,v);render(false);}}
};

/* значки на странице выбора (Антон / Даша) */
document.addEventListener("DOMContentLoaded",function(){
  if(document.querySelector("[data-streak]")&&!cfg)render(false);
});
if(document.readyState!=="loading"&&document.querySelector("[data-streak]")&&!cfg)render(false);
})();
