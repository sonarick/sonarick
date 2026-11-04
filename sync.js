(()=> {
"use strict";
const KEY="sonarick_health_v1";
const $=id=>document.getElementById(id);
const asDate=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?null:d};
const asNum=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
function normalize(raw){
 const out={sleep:[],heartRate:[],respiratoryRate:[],importedAt:new Date().toISOString(),source:"Apple Health / Sonarick Sync"};
 const addSleep=(a,b,stage)=>{a=asDate(a);b=asDate(b);if(a&&b&&b>a)out.sleep.push({start:a.toISOString(),end:b.toISOString(),stage:String(stage||"asleep")})};
 const addMetric=(arr,rec)=>{const d=asDate(rec.date||rec.startDate||rec.timestamp),v=asNum(rec.value??rec.quantity??rec.average);if(d&&v!==null)arr.push({date:d.toISOString(),value:v})};
 if(Array.isArray(raw.sleep))raw.sleep.forEach(x=>addSleep(x.startDate||x.start,x.endDate||x.end,x.stage||x.value));
 if(Array.isArray(raw.heartRate))raw.heartRate.forEach(x=>addMetric(out.heartRate,x));
 if(Array.isArray(raw.respiratoryRate))raw.respiratoryRate.forEach(x=>addMetric(out.respiratoryRate,x));
 const records=raw.records||raw.samples||raw.data||raw.healthData?.records||[];
 if(Array.isArray(records))records.forEach(x=>{
  const type=String(x.type||x.name||x.metric||x.category||"").toLowerCase();
  if(/sleep|asleep|inbed|awake|core|deep|rem/.test(type)||x.stage)addSleep(x.startDate||x.start||x.date,x.endDate||x.end||x.date,x.stage||x.value||x.type);
  else if(/heart.?rate|heartrate|pulse|пульс/.test(type))addMetric(out.heartRate,x);
  else if(/respirat|breath|дыхан/.test(type))addMetric(out.respiratoryRate,x);
 });
 const unique=a=>[...new Map(a.map(x=>[JSON.stringify(x),x])).values()];
 out.sleep=unique(out.sleep);out.heartRate=unique(out.heartRate);out.respiratoryRate=unique(out.respiratoryRate);
 return out;
}
function fmt(ms){const m=Math.round(ms/60000);return Math.floor(m/60)+" ч "+m%60+" м"}
function render(data){
 const nights=new Map();
 data.sleep.forEach(x=>{const a=new Date(x.start),b=new Date(x.end),k=a.toLocaleDateString("ru-RU");nights.set(k,(nights.get(k)||0)+(b-a))});
 const durations=[...nights.values()].filter(x=>x>0).sort((a,b)=>b-a);
 const total=durations[0]||0;
 const avg=a=>a.length?a.reduce((s,x)=>s+x.value,0)/a.length:null;
 const hr=avg(data.heartRate),rr=avg(data.respiratoryRate);
 $("sleepDuration").textContent=total?fmt(total):"Нет данных";
 $("avgHeartRate").innerHTML=hr===null?"—":Math.round(hr)+' <small style="font-size:12px;color:#9299b8">уд/мин</small>';
 $("avgRespRate").textContent=rr===null?"—":rr.toFixed(1).replace(".",",");
 $("regularity").textContent=durations.length?durations.length+" ночей":"—";
 const score=total?Math.max(0,Math.min(100,Math.round(total/28800000*100))):null;
 $("sleepScore").textContent=score===null?"—":score;
 $("scoreTitle").textContent=score===null?"Недостаточно данных":score>=85?"Достаточно времени для сна":score>=70?"Можно улучшить режим":"Стоит уделить сну больше внимания";
 $("scoreText").textContent=score===null?"Импортируйте данные сна из Apple Health.":"Ориентировочная оценка только по длительности сна, не медицинский показатель.";
 if(score!==null)$("scoreRing").style.background="conic-gradient(var(--violet) "+score+"%,#ffffff18 "+score+"% 100%)";
 $("dataStatus").textContent="Реальные данные";
 $("homeNotice").textContent="✓ Импортировано: "+data.sleep.length+" интервалов сна, "+data.heartRate.length+" измерений пульса, "+data.respiratoryRate.length+" измерений дыхания.";
 $("syncStatus").textContent="Импорт успешно выполнен";
 $("syncMeta").textContent="Обновлено: "+new Date(data.importedAt).toLocaleString("ru-RU")+". Источник: "+data.source+".";
 $("history").innerHTML=durations.length?durations.slice(0,14).map((v,i)=>'<div class="rowfield"><span>Ночь '+(i+1)+'</span><b>'+fmt(v)+'</b></div>').join(""):'<div class="empty">В файле пока нет интервалов сна.</div>';
}
document.addEventListener("DOMContentLoaded",()=>{
 const file=$("healthFile"),button=$("importHealth"),clear=$("clearHealth");
 if(!file||!button||!clear)return;
 try{const old=localStorage.getItem(KEY);if(old)render(JSON.parse(old))}catch(e){console.warn(e)}
 button.addEventListener("click",async()=>{
  if(!file.files?.[0]){alert("Сначала выбери JSON-файл.");return}
  try{const raw=JSON.parse(await file.files[0].text()),data=normalize(raw);
   if(!data.sleep.length&&!data.heartRate.length&&!data.respiratoryRate.length)throw new Error("Не найдены записи сна, пульса или дыхания. Проверь структуру JSON.");
   localStorage.setItem(KEY,JSON.stringify(data));render(data);alert("Готово! Данные сохранены локально на iPhone.");
  }catch(e){alert("Ошибка импорта: "+e.message)}
 });
 clear.addEventListener("click",()=>{if(confirm("Удалить импортированные данные с этого iPhone?")){localStorage.removeItem(KEY);location.reload()}});
});
})();