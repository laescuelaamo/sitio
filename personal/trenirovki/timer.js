/* Таймер для тренировок: всегда внизу экрана, пресеты, старт/стоп, звук по окончании.
   Один файл для страниц Антона и Даши. */
(function(){
"use strict";
if(window.__tmrLoaded)return;window.__tmrLoaded=true;

/* ---------- память ---------- */
var LS={
  get:function(k,d){try{var v=localStorage.getItem("tmr:"+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
  set:function(k,v){try{localStorage.setItem("tmr:"+k,JSON.stringify(v));}catch(e){}}
};
var PRESETS=[[30,"30с"],[40,"40с"],[45,"45с"],[60,"60с"],[90,"90с"],[120,"2м"],[180,"3м"]];
var dur=+LS.get("dur",30)||30, mute=!!LS.get("mute",false), mini=!!LS.get("mini",false);
var state="idle";            /* idle | run | done */
var left=dur*1000, endAt=0, loop=null, endTimer=null, lastSec=null, flashT=null, wake=null, actx=null;

/* ---------- стили ---------- */
var css="\
.tm,.tm *{box-sizing:border-box}\
.tm{position:fixed;left:0;right:0;bottom:0;z-index:60;display:flex;justify-content:center;padding:0 8px calc(8px + env(safe-area-inset-bottom));pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}\
.tm-bar{pointer-events:auto;width:min(600px,100%);background:rgba(33,27,31,.97);color:#fff;border-radius:20px;box-shadow:0 10px 34px rgba(0,0,0,.35);padding:8px 10px;display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px}\
.tm-row{display:flex;align-items:center;gap:8px;width:100%}\
.tm-time{font:800 34px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums;min-width:86px;letter-spacing:-.5px}\
.tm-bar.warn .tm-time{color:#ffbf47}\
.tm-bar.done .tm-time{color:#ff6b57}\
.tm-bar.flash{animation:tmflash .5s ease-in-out 8}\
@keyframes tmflash{50%{background:rgba(190,45,30,.97)}}\
.tm button{font:inherit;color:inherit;cursor:pointer;border:0;touch-action:manipulation}\
.tm-go{flex:1;min-width:104px;height:50px;border-radius:14px;font-weight:800;font-size:18px;background:#2f8a57;color:#fff}\
.tm-go.run{background:#d9822b}\
.tm-go:active{transform:scale(.97)}\
.tm-ic{width:44px;height:50px;border-radius:14px;background:rgba(255,255,255,.12);font-size:20px}\
.tm-ic:active{background:rgba(255,255,255,.25)}\
.tm-chips{display:flex;gap:5px;width:100%}\
.tm-chip{flex:1 1 0;min-width:0;height:38px;border-radius:11px;background:rgba(255,255,255,.12);font-weight:700;font-size:14px}\
.tm-chip[aria-pressed=true]{background:#fff;color:#231d20}\
.tm-chip:active{transform:scale(.96)}\
.tm-pill{position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:60;height:52px;padding:0 16px;border-radius:26px;background:rgba(33,27,31,.97);color:#fff;font:800 20px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;box-shadow:0 8px 26px rgba(0,0,0,.35);border:0;cursor:pointer;display:flex;align-items:center;gap:8px;touch-action:manipulation}\
.tm-pill.warn{color:#ffbf47}.tm-pill.done{background:#b8321f}\
.tm-pill.run{outline:3px solid #2f8a57}\
@media (min-width:640px){.tm-chips{width:auto;flex:1 1 280px}.tm-time{font-size:38px}}\
@media (prefers-reduced-motion:reduce){.tm-bar.flash{animation:none;background:rgba(190,45,30,.97)}}";
var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

/* ---------- разметка ---------- */
var root=document.createElement("div");root.className="tm";root.setAttribute("role","region");root.setAttribute("aria-label","Таймер");
root.innerHTML='<div class="tm-bar" id="tmBar">'+
 '<div class="tm-row">'+
   '<div class="tm-time" id="tmTime" role="timer" aria-live="off">0:30</div>'+
   '<button class="tm-go" id="tmGo" type="button">▶ Старт</button>'+
   '<button class="tm-ic" id="tmReset" type="button" aria-label="Сбросить">↺</button>'+
   '<button class="tm-ic" id="tmSnd" type="button" aria-label="Звук">🔔</button>'+
   '<button class="tm-ic" id="tmMin" type="button" aria-label="Свернуть таймер">▾</button>'+
 '</div>'+
 '<div class="tm-chips" id="tmChips">'+PRESETS.map(function(p){return '<button class="tm-chip" type="button" data-s="'+p[0]+'" aria-pressed="false">'+p[1]+'</button>';}).join("")+'</div>'+
'</div>';
var pill=document.createElement("button");pill.type="button";pill.className="tm-pill";pill.id="tmPill";pill.setAttribute("aria-label","Открыть таймер");
document.body.appendChild(root);document.body.appendChild(pill);
var $=function(id){return document.getElementById(id);};
var bar=$("tmBar"),timeEl=$("tmTime"),goBtn=$("tmGo"),sndBtn=$("tmSnd");

/* ---------- звук ---------- */
function ac(){
  try{
    if(!actx){var A=window.AudioContext||window.webkitAudioContext;if(A)actx=new A();}
    if(actx&&actx.state==="suspended")actx.resume();
  }catch(e){}
  return actx;
}
function beep(freq,t0,d,vol){
  var c=ac();if(!c)return;
  try{
    var o=c.createOscillator(),g=c.createGain(),t=c.currentTime+t0;
    o.type="sine";o.frequency.value=freq;
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol||0.5,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
    o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+0.05);
  }catch(e){}
}
function doneSound(){if(mute)return;beep(988,0,0.22,0.6);beep(988,0.3,0.22,0.6);beep(988,0.6,0.22,0.6);beep(1318,0.95,0.6,0.6);}
function tickSound(){if(!mute)beep(660,0,0.09,0.3);}
function buzz(){try{if(navigator.vibrate)navigator.vibrate([250,120,250,120,500]);}catch(e){}}

/* ---------- не гасить экран во время отсчёта ---------- */
function lock(){try{if(navigator.wakeLock&&navigator.wakeLock.request)navigator.wakeLock.request("screen").then(function(w){wake=w;}).catch(function(){});}catch(e){}}
function unlock(){try{if(wake){wake.release();wake=null;}}catch(e){}}

/* ---------- логика ---------- */
function fmt(ms){var s=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(s/60);return m+":"+(s%60<10?"0":"")+(s%60);}
function render(){
  var secs=Math.ceil(left/1000);
  var t=fmt(left);
  timeEl.textContent=t;
  var warn=state==="run"&&secs<=5&&secs>0;
  bar.className="tm-bar"+(warn?" warn":"")+(state==="done"?" done":"")+(flashT?" flash":"");
  pill.className="tm-pill"+(warn?" warn":"")+(state==="done"?" done":"")+(state==="run"?" run":"");
  pill.textContent="⏱ "+t;
  if(state==="run"){goBtn.textContent="⏸ Стоп";goBtn.className="tm-go run";}
  else if(state==="done"){goBtn.textContent="▶ Ещё раз";goBtn.className="tm-go";}
  else{goBtn.textContent=(left<dur*1000&&left>0)?"▶ Дальше":"▶ Старт";goBtn.className="tm-go";}
  document.querySelectorAll(".tm-chip").forEach(function(b){b.setAttribute("aria-pressed",String(+b.dataset.s===dur));});
  sndBtn.textContent=mute?"🔕":"🔔";sndBtn.setAttribute("aria-pressed",String(!mute));
  root.style.display=mini?"none":"flex";pill.style.display=mini?"flex":"none";
  pad();
}
function pad(){
  var h=mini?76:(bar.offsetHeight+24);
  document.body.style.paddingBottom=h+"px";
}
function clearTimers(){if(loop){clearInterval(loop);loop=null;}if(endTimer){clearTimeout(endTimer);endTimer=null;}}
function update(){
  if(state!=="run")return;
  left=endAt-Date.now();
  var secs=Math.ceil(left/1000);
  if(secs!==lastSec){lastSec=secs;if(secs>=1&&secs<=3)tickSound();}
  if(left<=0){finish();return;}
  render();
}
function start(){
  if(state==="done"||left<=0)left=dur*1000;
  ac();
  state="run";endAt=Date.now()+left;lastSec=null;
  clearTimers();
  loop=setInterval(update,100);
  endTimer=setTimeout(update,left+30);
  lock();render();
}
function stop(){
  if(state==="run")left=Math.max(0,endAt-Date.now());
  state="idle";clearTimers();unlock();render();
}
function reset(){
  state="idle";clearTimers();unlock();left=dur*1000;
  if(flashT){clearTimeout(flashT);flashT=null;}
  render();
}
function finish(){
  clearTimers();unlock();
  state="done";left=0;
  doneSound();buzz();
  if(flashT)clearTimeout(flashT);
  flashT=setTimeout(function(){flashT=null;render();},4200);
  render();
}
function pick(s){
  dur=s;LS.set("dur",s);
  state="idle";clearTimers();unlock();left=s*1000;
  if(flashT){clearTimeout(flashT);flashT=null;}
  render();
}

goBtn.addEventListener("click",function(){if(state==="run")stop();else start();});
$("tmReset").addEventListener("click",reset);
$("tmChips").addEventListener("click",function(e){var b=e.target.closest(".tm-chip");if(b)pick(+b.dataset.s);});
sndBtn.addEventListener("click",function(){mute=!mute;LS.set("mute",mute);if(!mute){ac();beep(880,0,0.15,0.4);}render();});
$("tmMin").addEventListener("click",function(){mini=true;LS.set("mini",true);render();});
pill.addEventListener("click",function(){mini=false;LS.set("mini",false);render();});
document.addEventListener("visibilitychange",function(){
  if(document.visibilityState==="visible"&&state==="run"){update();lock();}
});
window.addEventListener("resize",pad);
render();
setTimeout(pad,300);
})();
