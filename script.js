const SHEET_ID = '1MudKA6z5i5FjVs3tUEpEoR8tv4zz_M9yv4LMLkIQ6RA';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
const JSONP_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json;responseHandler:handleSheetData`;
const monthNames = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];

function parseCSV(text){
  const rows=[]; let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i],next=text[i+1];
    if(c==='"'&&quoted&&next==='"'){cell+='"';i++;}
    else if(c==='"'){quoted=!quoted;}
    else if(c===','&&!quoted){row.push(cell);cell='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&next==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(cell||row.length){row.push(cell);rows.push(row)}
  const headers=rows.shift()||[];
  return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));
}

const fmt = value => {
  if(value===null||value===undefined||value==='')return '—';
  const normalized=String(value).replace(/[\s\u00a0]/g,'').replace(',','.');
  const numeric=Number(normalized);
  return Number.isFinite(numeric)?new Intl.NumberFormat('ru-RU').format(numeric):String(value);
};
const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value||'—'};
const ranked=(pairs)=>pairs.filter(x=>x[0]).map((x,i)=>`<div class="rank-row"><span>${i+1}</span><b>${x[0]}</b><strong>${fmt(x[1])}</strong></div>`).join('');

function render(rows){
  const first=rows[0]||{};
  set('plusKubki',fmt(first.plus_kubki)); set('allKubki',fmt(first.obchie_kubki));
  set('updateDate',first.obnova); set('liveUpdateDate',first.obnova); set('startDate','01.07.2026 00:00:00');
  document.getElementById('topClubs').innerHTML=ranked(rows.slice(0,3).map(r=>[r.top_club,r.top_club77]));
  set('antiClub',first.antitop_club); set('antiClubValue',fmt(first.antitop_club77));
  const realClubRows=rows.filter(r=>{
    const name=String(r.top_club_playrs||'').trim();
    const members=Number(String(r.top_club_playrs77||'').replace(/\s/g,''));
    return name&&!/^нет клуба$/i.test(name)&&Number.isFinite(members)&&members>=0&&members<=30;
  });
  document.getElementById('topPlayers').innerHTML=ranked(realClubRows.slice(0,10).map(r=>[r.top_club_playrs,r.top_club_playrs77]));
  document.getElementById('effectiveClubs').innerHTML=ranked(rows.filter(r=>r.club_efect).slice(0,10).map(r=>[r.club_efect,`${fmt(r.club_efect_cubki)} / ${fmt(r.club_efect77)} ⚡`]));
  const clubPushers=Array.from({length:10},(_,i)=>({club:i+1,name:first[`top_push${i+1}`],value:first[`top_push_k${i+1}`]}));
  document.getElementById('pushers').innerHTML=clubPushers.filter(x=>x.name).map(x=>`<article class="player"><small>Топ пушер клуба #${x.club}</small><b>${x.name}</b><span>+${fmt(x.value)} 🏆</span></article>`).join('');
  document.getElementById('top3x3').innerHTML=ranked(rows.slice(0,3).map(r=>[r.top_3x3,r.top_3x3_77]));
  set('topSolo',first.top_solo);set('topSoloValue',fmt(first.top_solo_77));set('topShd',first.top_shd);set('topShdValue',fmt(first.top_shd_77));
  set('anti3x3',first.antitop_3x3);set('anti3x3Value',fmt(first.antitop_3x3_77));
  set('topWins',first.top_win);set('topWinsValue',fmt(first.top_win_77));set('antiWins',first.antitop_win);set('antiWinsValue',fmt(first.antitop_win_77));
  const brawlerLeaders=rows.filter(r=>r.top_pers).slice(0,3);
  document.getElementById('topBrawlers').innerHTML=brawlerLeaders.map((r,i)=>`<article class="brawler-leader place-${i+1}"><span>${i+1}</span><small>${r.top_pers_00||'Боец'}</small><b>${r.top_pers}</b><strong>${fmt(r.top_pers_77)} 🏆</strong></article>`).join('');
  set('antiBrawler',first.antitop_pers_00);set('antiBrawlerPlayer',first.antitop_pers);set('antiBrawlerValue',fmt(first.antitop_pers_77));
  set('antiPusher',first.antitop_push);set('antiPusherValue',fmt(first.antitop_push77));
  document.getElementById('top10').innerHTML=ranked(rows.filter(r=>r.top10).slice(0,10).map(r=>[r.top10,r.top1010]));
  set('nomPush',first.top_push);set('nomPushValue',`+${fmt(first.top_push77)} 🏆`);
  set('nom3x3',first.top_3x3);set('nom3x3Value',fmt(first.top_3x3_77));
  set('nomWins',first.top_win);set('nomWinsValue',fmt(first.top_win_77));
  set('nomBrawler',first.top_pers);set('nomBrawlerValue',`${first.top_pers_00||'Боец'} · ${fmt(first.top_pers_77)}`);
  set('nomSolo',first.top_solo);set('nomSoloValue',fmt(first.top_solo_77));
  set('nomShd',first.top_shd);set('nomShdValue',fmt(first.top_shd_77));
}

async function loadData(){
  const status=document.getElementById('status');
  try{const response=await fetch(`${CSV_URL}&_=${Date.now()}`,{cache:'no-store'});if(!response.ok)throw new Error(response.status);const rows=parseCSV(await response.text());render(rows);status.textContent='Данные обновлены из бота @VooPooRUS_bot';status.className='status ok';setTimeout(()=>status.remove(),3500)}
  catch(error){
    const tag=document.createElement('script');
    tag.src=JSONP_URL; tag.onerror=()=>{status.textContent='Не удалось прочитать таблицу. Проверьте доступ по ссылке.';status.className='status error'};
    document.head.appendChild(tag);
  }
}

window.handleSheetData=function(response){
  const headers=response.table.cols.map(c=>c.label);
  const rows=response.table.rows.map(row=>Object.fromEntries(headers.map((h,i)=>[h,row.c[i]?.f??row.c[i]?.v??''])));
  render(rows);
  const status=document.getElementById('status');status.textContent='Данные обновлены из бота @VooPooRUS_bot';status.className='status ok';setTimeout(()=>status.remove(),3500);
};

const homeView=document.getElementById('home');
const monthView=document.getElementById('monthView');
const capitalize=value=>value.charAt(0).toUpperCase()+value.slice(1);
const isUnavailableMonth=monthIndex=>monthIndex===0||monthIndex===1||monthIndex>new Date().getMonth();
const archiveMonths={
  2:{src:'archive/march-v7.jpg?v=1',alt:'Итоги VooPooFamily за март'},
  3:{src:'archive/april-v1.jpg?v=1',alt:'Итоги VooPooFamily за апрель'},
  4:{src:'archive/may-v1.jpg?v=1',alt:'Итоги VooPooFamily за май'},
  5:{src:'archive/june-v3.jpg?v=4',alt:'Итоги VooPooFamily за июнь'}
};
let archiveSwapTimer;
function centerMobileArchive(){
  if(!matchMedia('(max-width:760px)').matches)return;
  const archiveBox=document.getElementById('archiveMonth');
  requestAnimationFrame(()=>{archiveBox.scrollLeft=Math.max(0,(archiveBox.scrollWidth-archiveBox.clientWidth)/2)});
}
function setArchiveImage(archive){
  const image=document.getElementById('archiveImage');
  const target=new URL(archive.src,location.href).href;
  if(image.src===target){image.alt=archive.alt;image.classList.remove('is-switching');centerMobileArchive();return}
  const preload=new Image();
  preload.onload=()=>{image.classList.add('is-switching');clearTimeout(archiveSwapTimer);archiveSwapTimer=setTimeout(()=>{image.src=archive.src;image.alt=archive.alt;requestAnimationFrame(()=>requestAnimationFrame(()=>{image.classList.remove('is-switching');centerMobileArchive()}))},220)};
  preload.src=archive.src;
}

function openMonth(monthIndex,{historyUpdate=true}={}){
  const month=monthNames[monthIndex];
  document.querySelector('.months .active')?.classList.remove('active');
  const selected=document.querySelector(`.months button[data-month="${monthIndex}"]`);
  selected?.classList.add('active'); selected?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
  set('monthName',month); set('viewMonthLabel',capitalize(month));
  const unavailable=isUnavailableMonth(monthIndex);
  monthView.classList.toggle('month-unavailable',unavailable);
  const archive=archiveMonths[monthIndex];
  monthView.classList.toggle('month-archive',Boolean(archive));
  document.body.classList.toggle('archive-open',Boolean(archive));
  if(archive)setArchiveImage(archive);
  document.body.classList.toggle('month-empty',unavailable);
  const reveal=()=>{homeView.hidden=true;homeView.classList.remove('is-leaving');monthView.hidden=false;document.body.classList.add('month-open');window.scrollTo({top:0,behavior:'smooth'});if(archive)setTimeout(centerMobileArchive,50)};
  if(monthView.hidden){homeView.classList.add('is-leaving');setTimeout(reveal,280)}else reveal();
  if(historyUpdate)history.pushState({month:monthIndex},'',`#month-${monthIndex+1}`);
}

function showHome({historyUpdate=true}={}){
  monthView.hidden=true;homeView.hidden=false;homeView.classList.remove('is-leaving');document.body.classList.remove('month-open');
  document.body.classList.remove('month-empty');
  document.body.classList.remove('archive-open');
  document.querySelector('.months .active')?.classList.remove('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(historyUpdate)history.pushState({home:true},'','#home');
}

document.querySelectorAll('.months button').forEach(btn=>btn.addEventListener('click',()=>openMonth(+btn.dataset.month)));

const monthRail=document.querySelector('.months');
let railDragging=false,railStartX=0,railStartScroll=0,railMoved=false;
if(matchMedia('(pointer:fine)').matches){
  monthRail?.addEventListener('pointerdown',event=>{railDragging=true;railMoved=false;railStartX=event.clientX;railStartScroll=monthRail.scrollLeft;monthRail.classList.add('is-dragging')});
  monthRail?.addEventListener('pointermove',event=>{if(!railDragging)return;const distance=event.clientX-railStartX;if(Math.abs(distance)>5)railMoved=true;monthRail.scrollLeft=railStartScroll-distance});
  monthRail?.addEventListener('pointerup',()=>{railDragging=false;monthRail.classList.remove('is-dragging')});
  monthRail?.addEventListener('pointercancel',()=>{railDragging=false;monthRail.classList.remove('is-dragging')});
  window.addEventListener('pointerup',()=>{railDragging=false;monthRail?.classList.remove('is-dragging')});
}
monthRail?.addEventListener('wheel',event=>{if(Math.abs(event.deltaY)>Math.abs(event.deltaX)){event.preventDefault();monthRail.scrollLeft+=event.deltaY}},{passive:false});
monthRail?.addEventListener('click',event=>{if(railMoved){event.preventDefault();event.stopPropagation();railMoved=false}},true);
document.querySelector('.hero-cta')?.addEventListener('click',()=>openMonth(+(document.querySelector('.months .active')?.dataset.month||6)));
document.querySelector('.brand')?.addEventListener('click',event=>{event.preventDefault();showHome()});
document.getElementById('backHome')?.addEventListener('click',()=>showHome());
window.addEventListener('popstate',()=>{const match=location.hash.match(/^#month-(\d{1,2})$/);match?openMonth(Math.min(11,Math.max(0,+match[1]-1)),{historyUpdate:false}):showHome({historyUpdate:false})});

const hero=document.querySelector('.intro');
const heroKing=document.getElementById('heroKing');
if(hero&&heroKing&&matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
  hero.addEventListener('pointermove',event=>{const box=hero.getBoundingClientRect();const x=(event.clientX-box.left)/box.width-.5;const y=(event.clientY-box.top)/box.height-.5;heroKing.style.setProperty('--px',`${x*13}px`);heroKing.style.setProperty('--py',`${y*9}px`);heroKing.style.transform=`translate(${x*13}px,${y*9}px)`});
  hero.addEventListener('pointerleave',()=>heroKing.style.transform='');
}
const initialMonth=location.hash.match(/^#month-(\d{1,2})$/);
if(initialMonth)openMonth(Math.min(11,Math.max(0,+initialMonth[1]-1)),{historyUpdate:false});
function syncHeaderHeight(){document.documentElement.style.setProperty('--header-height',`${document.getElementById('siteHeader')?.offsetHeight||158}px`)}
syncHeaderHeight();window.addEventListener('resize',syncHeaderHeight);window.addEventListener('load',syncHeaderHeight);
if('ResizeObserver'in window)new ResizeObserver(syncHeaderHeight).observe(document.getElementById('siteHeader'));
const backToTop=document.getElementById('backToTop');
function syncBackToTop(){backToTop?.classList.toggle('visible',window.scrollY>500&&!document.body.classList.contains('month-empty'))}
window.addEventListener('scroll',syncBackToTop,{passive:true});
backToTop?.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
syncBackToTop();
loadData();
