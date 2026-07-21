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
const formatSheetDateTime=value=>{
  const text=String(value||'').trim();
  if(!text)return '—';
  return /^\d{2}\.\d{2}\.\d{4}$/.test(text)?`${text} 00:00:00`:text;
};
const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value||'—'};
const ranked=(pairs)=>pairs.filter(x=>x[0]).map((x,i)=>`<div class="rank-row"><span>${i+1}</span><b>${x[0]}</b><strong>${fmt(x[1])}</strong></div>`).join('');

let liveRows=[];
function render(rows){
  liveRows=rows;
  const first=rows[0]||{};
  set('plusKubki',fmt(first.plus_kubki)); set('allKubki',fmt(first.obchie_kubki));
 const updateStamp=formatSheetDateTime(first.obnova);
  set('updateDate',updateStamp); set('liveUpdateDate',updateStamp); set('startDate','01.07.2026 00:00:00');
  document.getElementById('topClubs').innerHTML=ranked(rows.slice(0,3).map(r=>[r.top_club,r.top_club77]));
  set('antiClub',first.antitop_club); set('antiClubValue',fmt(first.antitop_club77));
  const realClubRows=rows.filter(r=>{
    const name=String(r.top_club_playrs||'').trim();
    const members=Number(String(r.top_club_playrs77||'').replace(/\s/g,''));
    return name&&!/^нет клуба$/i.test(name)&&Number.isFinite(members)&&members>=0&&members<=30;
  });
  document.getElementById('topPlayers').innerHTML=ranked(realClubRows.slice(0,10).map(r=>[r.top_club_playrs,r.top_club_playrs77]));
  document.getElementById('effectiveClubs').innerHTML=ranked(rows.filter(r=>r.club_efect).slice(0,10).map(r=>[r.club_efect,`${fmt(r.club_efect_cubki)} / ${fmt(r.club_efect77)} ⚡`]));
  const clubPushers=Array.from({length:11},(_,i)=>({club:i+1,name:first[`top_push${i+1}`],value:first[`top_push_k${i+1}`]}));
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

let dataLoadStarted=false;
async function loadData(){
  if(dataLoadStarted){if(liveRows.length)render(liveRows);return}
  dataLoadStarted=true;
  const status=document.getElementById('status');
  status.hidden=false;status.textContent='Получаем свежие данные…';status.className='status';
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
const historicalMonths={
  2:{name:'март',where:'марте',start:'10.03.2026 · 01:29:53',updated:'01.04.2026 · 00:02:34',plus:431353,total:7353533,
    topClubs:[['VooPooFamily #2',89889],['VooPooFamily #5',85816],['VooPooFamily #8',62779]],antiClub:['VooPooFamily #7',19072],
    members:[['VooPooFamily #5',27],['VooPooFamily #8',22],['VooPooFamily #2',20],['VooPooFamily #1',12],['VooPooFamily #4',12],['VooPooFamily #3',11],['VooPooFamily #6',11],['VooPooFamily #7',7]],
    effective:[['VooPooFamily #2','89 889 / 4 494 ⚡'],['VooPooFamily #1','52 582 / 4 382 ⚡'],['VooPooFamily #3','47 346 / 4 304 ⚡'],['VooPooFamily #4','41 817 / 3 485 ⚡'],['VooPooFamily #5','85 816 / 3 178 ⚡'],['VooPooFamily #8','62 779 / 2 854 ⚡'],['VooPooFamily #7','19 072 / 2 725 ⚡'],['VooPooFamily #6','24 058 / 2 187 ⚡']],
    pushers:[['VPF|nekocrystal',18691],['VPF | Kiyuu',16340],['VPF | Versys',12739]],antiPusher:['VPF | SOKOL',16],
    x3:[['VPF | Kiyuu',1776],['VPF|RIZET',1565],['VPF|nekocrystal',928]],anti3:['VPF|Cronos',1],solo:[['VPF|nekocrystal',542],['VPF|SOREX#1',504],['VPF | DODO',312]],shd:[['VPF|nekocrystal',557],['VPF|SOREX#1',512],['VPF | Versys',377]],wins:[['VPF | Kiyuu',1905],['VPF|RIZET',1867],['VPF|nekocrystal',1485]],antiWins:['VPF|Cronos',2],
    brawlers:[['VPF|FoNu','SIRIUS',2776],['VPF|lonzen','BUZZ',2662],['VPF|RIZET','SIRIUS',2500]],antiBrawler:['VPF|R!velse','EDGAR',821],
    top10:[['VPF|nekocrystal',18691],['VPF | Kiyuu',16340],['VPF | Versys',12739],['VPF | [BAN]VIP',10241],['VPF | МУЖ АНН',10133],['VPF | Inside',9693],['VPF|SOREX#1',9590],['VPF|RIZET',8933],['VPF | Very Good',8620],['VPF | Skeet',8483]],
    tournament:['БАРБАРИСКИ','Matrix Masters','HOMIXIDE']},
  3:{name:'апрель',where:'апреле',start:'01.04.2026 · 00:02:34',updated:'01.05.2026 · 00:58:22',plus:643952,total:9695513,
    topClubs:[['VooPooFamily #5',125667],['VooPooFamily #1',105194],['VooPooFamily #8',72927]],antiClub:['VooPooFamily #9',584],
    members:[['VooPooFamily #5',27],['VooPooFamily #8',23],['VooPooFamily #1',15],['VooPooFamily #2',15],['VooPooFamily #6',15],['VooPooFamily #10',14],['VooPooFamily #11',12],['VooPooFamily #4',8],['VooPooFamily #3',7],['VooPooFamily #7',4],['VooPooFamily #9',1]],
    effective:[['VooPooFamily #1','105 194 / 7 013 ⚡'],['VooPooFamily #7','22 999 / 5 750 ⚡'],['VooPooFamily #10','71 200 / 5 086 ⚡'],['VooPooFamily #5','125 667 / 4 654 ⚡'],['VooPooFamily #2','63 766 / 4 251 ⚡'],['VooPooFamily #6','61 290 / 4 086 ⚡'],['VooPooFamily #11','40 604 / 3 384 ⚡'],['VooPooFamily #8','72 927 / 3 171 ⚡'],['VooPooFamily #4','20 329 / 2 541 ⚡'],['VooPooFamily #3','15 949 / 2 278 ⚡'],['VooPooFamily #9','584 / 584 ⚡']],
    pushers:[['VPF|Samurai',34204],['VPF | FASTER',16570],['VPF | Бочка00',14789]],antiPusher:['VPF | Vozdux',34],x3:[['VPF|RIZET',1725],['VPF|Samurai',1714],['VPF | SLASH',1502]],anti3:['VPF | shua',3],solo:[['VPF|Samurai',752],['VPF | MikaS',666],['VPF|FoNu',579]],shd:[['VPF|Samurai',993],['VPF|FoNu',751],['VPF | MikaS',715]],wins:[['VPF|Samurai',2707],['VPF|RIZET',1728],['VPF | FASTER',1559]],antiWins:['VPF | shua',6],brawlers:[['VPF|FoNu','SIRIUS',2760],['VPF | MikaS','DAMIAN',2719],['VPF|RIZET','SIRIUS',2518]],antiBrawler:['VPF|Enhepen','BUZZ',867],top10:[['VPF|Samurai',34204],['VPF | FASTER',16570],['VPF | Бочка00',14789],['VPF | SLASH',12704],['VPF | Pivo',12362],['VPF | DarkKnight',11892],['VPF | HM Ghost',11458],['VPF | MikaS',11219],['VPF | IVA4N',10978],['VPF | игрок месяца',10945]],tournament:['Strange Masters','GGs Team','Team Spirit']},
  4:{name:'май',where:'мае',start:'01.05.2026 · 00:58:22',updated:'01.06.2026 · 00:02:27',plus:692429,total:11385693,
    topClubs:[['VooPooFamily #5',128187],['VooPooFamily #1',103683],['VooPooFamily #2',81936]],antiClub:['VooPooFamily #11',8516],members:[['VooPooFamily #5',28],['VooPooFamily #11',22],['VooPooFamily #8',21],['VooPooFamily #1',17],['VooPooFamily #2',17],['VooPooFamily #6',16],['VooPooFamily #10',14],['VooPooFamily #4',9],['VooPooFamily #3',7],['VooPooFamily #7',5],['VooPooFamily #9',3]],effective:[['VooPooFamily #1','103 683 / 6 099 ⚡'],['VooPooFamily #2','81 936 / 4 820 ⚡'],['VooPooFamily #5','128 187 / 4 578 ⚡'],['VooPooFamily #10','61 125 / 4 366 ⚡'],['VooPooFamily #3','26 483 / 3 783 ⚡'],['VooPooFamily #11','75 108 / 3 414 ⚡'],['VooPooFamily #4','27 146 / 3 016 ⚡'],['VooPooFamily #6','45 640 / 2 853 ⚡'],['VooPooFamily #9','8 516 / 2 839 ⚡'],['VooPooFamily #8','56 891 / 2 709 ⚡'],['VooPooFamily #7','11 542 / 2 308 ⚡']],pushers:[['VPF|Samurai',25910],['VPF|SLASH',25507],['VPF | °TWISTI™',16544]],antiPusher:['VPF|Ivanchike',8],x3:[['VPF|SLASH',2527],['VPF|LostPrime',1063],['VPF|TRIZExxx',1016]],anti3:['VPF|Ivanchike',5],solo:[['VPF|Samurai',942],['VPF|Sanik9517',391],['VPF|Vee',355]],shd:[['VPF|Samurai',1452],['VPF | °TWISTI™',926],['VPF | Ma$TeR',495]],wins:[['VPF|SLASH',2650],['VPF|Samurai',1946],['VPF|Vee',1299]],antiWins:['VPF|Ivanchike',5],brawlers:[['VPF | MikaS','DAMIAN',2679],['VPF | ZéRoX','DAMIAN',2609],['VPF|ddoonnyy','BUSTER',2563]],antiBrawler:['VPF | ariworr','COLT',1004],top10:[['VPF|Samurai',25910],['VPF|SLASH',25507],['VPF | °TWISTI™',16544],['VPF | FASTER',14714],['VPF|LostPrime',12271],['VPF | Ma$TeR',11481],['VPF|Pivo',11003],['VPF | [BAN]VIP',10356],['VPF|Sanik9517',9558],['VPF | Бочка00',9102]],clubPushers:[['#1','VPF|Samurai',25910],['#2','VPF|SLASH',25507],['#3','VPF|Woodw1N',4676],['#4','VPF | Legend',5830],['#5','VPF | FASTER',14714],['#6','VPF | Smakyhчuk',6732],['#7','VPF | стуслик',5387],['#8','VPF|SCREAM',7119],['#9','VPF|R3coil 2.0',6967],['#10','VPF|Vee',8954],['#11','VPF|LostPrime',12271]],tournament:['vW Team','HOMIXIDE','Team Spirit']},
  5:{name:'июнь',where:'июне',start:'01.06.2026 · 00:02:27',updated:'01.07.2026 · 00:00:00',plus:506536,total:11143857,
    topClubs:[['VooPooFamily #8',90179],['VooPooFamily #10',66500],['VooPooFamily #6',57227]],antiClub:['VooPooFamily #3',3147],members:[['VooPooFamily #6',25],['VooPooFamily #8',19],['VooPooFamily #10',17],['VooPooFamily #2',16],['VooPooFamily #1',11],['VooPooFamily #5',11],['VooPooFamily #7',9],['VooPooFamily #3',7],['VooPooFamily #4',7],['VooPooFamily #9',5],['VooPooFamily #11',4]],effective:[['VooPooFamily #8','90 179 / 4 746 ⚡'],['VooPooFamily #1','46 493 / 4 227 ⚡'],['VooPooFamily #7','37 407 / 4 156 ⚡'],['VooPooFamily #10','66 500 / 3 912 ⚡'],['VooPooFamily #5','40 372 / 3 670 ⚡'],['VooPooFamily #4','21 367 / 3 052 ⚡'],['VooPooFamily #2','47 062 / 2 941 ⚡'],['VooPooFamily #3','17 899 / 2 557 ⚡'],['VooPooFamily #6','57 227 / 2 289 ⚡'],['VooPooFamily #9','8 643 / 1 729 ⚡'],['VooPooFamily #11','3 147 / 787 ⚡']],pushers:[['VPF|ごめんね少年',18325],['VPF|LostPrime',16727],['VPF|Sayori',15076]],antiPusher:['VPF | LUNO',8],x3:[['VPF|ごめんね少年',1843],['VPF|LostPrime',1665],['VPF|Vee',1107]],anti3:['VPF|$-winner-$',1],solo:[['VPF|$hark',409],['VPF|Sayori',252],['VPF | Playtop_0',145]],shd:[['VPF|code: nIT',744],['VPF | °TWISTI™',711],['VPF|$hark',441]],wins:[['VPF|ごめんね少年',1891],['VPF|LostPrime',1733],['VPF|Vee',1182]],antiWins:['VPF|$-winner-$',1],brawlers:[['VPF | MikaS','FINX',2674],['VPF | Tarask','OTIS',2605],['VPF|ddoonnyy','BUSTER',2545]],antiBrawler:['VPF | Yenn','COLT',1004],top10:[['VPF|ごめんね少年',18325],['VPF|LostPrime',16727],['VPF|Sayori',15076],['VPF|code: nIT',14810],['VPF|$hark',14261],['VPF | °TWISTI™',11816],['VPF|Feng',10182],['VPF|Vee',9999],['VPF|Peetrix',8844],['VPF | стуслик',8481]],clubPushers:[['#1','VPF|Feng',10182],['#2','VPF|Peetrix',8844],['#3','VPF|NiceColt',5225],['#4','VPF|Very Good',5318],['#5','VPF | MikaS',6446],['#6','VPF|code: nIT',14810],['#7','VPF|$hark',14261],['#8','VPF|ごめんね少年',18325],['#9','VPF | ZéRoX',4470],['#10','VPF|LostPrime',16727],['#11','VPF|камень',2194]],tournament:['Monte Cristo','Nivada Team','Eclipsar team']}
};

function renderHistorical(data){
  set('startDate',data.start);set('updateDate',data.updated);set('liveUpdateDate',data.updated);
  set('plusKubki',fmt(data.plus));set('allKubki',fmt(data.total));
  set('dataBadge',`◆ АРХИВ · ${data.name.toUpperCase()}`);set('dataTitle',`Итоги VPF за ${data.name}`);set('dataSubtitle','Зафиксированные данные из ежемесячного архива VooPooFamily');
  set('clubsChapterTitle',`Кто отличился в ${data.where}`);set('nominationsTitle',`НОМИНАЦИИ · ${data.name.toUpperCase()}`);
  document.getElementById('topClubs').innerHTML=ranked(data.topClubs||[]);set('antiClub',data.antiClub?.[0]);set('antiClubValue',fmt(data.antiClub?.[1]));
  document.getElementById('topPlayers').innerHTML=ranked(data.members||[]);document.getElementById('effectiveClubs').innerHTML=ranked(data.effective||[]);
  document.getElementById('pushers').innerHTML=(data.pushers||[]).map((x,i)=>`<article class="player"><small>${i+1} место по пушу</small><b>${x[0]}</b><span>+${fmt(x[1])} 🏆</span></article>`).join('');
  const clubPushers=document.getElementById('clubPushers');clubPushers.innerHTML=(data.clubPushers||[]).map(x=>`<article><small>Клуб ${x[0]}</small><b>${x[1]}</b><strong>+${fmt(x[2])} 🏆</strong></article>`).join('');
  document.getElementById('clubPushersTitle').hidden=!(data.clubPushers||[]).length;clubPushers.hidden=!(data.clubPushers||[]).length;
  document.getElementById('top3x3').innerHTML=ranked(data.x3||[]);set('anti3x3',data.anti3?.[0]);set('anti3x3Value',fmt(data.anti3?.[1]));
  set('topSolo',data.solo?.[0]?.[0]);set('topSoloValue',fmt(data.solo?.[0]?.[1]));set('topShd',data.shd?.[0]?.[0]);set('topShdValue',fmt(data.shd?.[0]?.[1]));
  set('topWins',data.wins?.[0]?.[0]);set('topWinsValue',fmt(data.wins?.[0]?.[1]));set('antiWins',data.antiWins?.[0]);set('antiWinsValue',fmt(data.antiWins?.[1]));
  document.getElementById('topBrawlers').innerHTML=(data.brawlers||[]).map((x,i)=>`<article class="brawler-leader place-${i+1}"><span>${i+1}</span><small>${x[1]}</small><b>${x[0]}</b><strong>${fmt(x[2])} 🏆</strong></article>`).join('');
  set('antiBrawlerPlayer',data.antiBrawler?.[0]);set('antiBrawler',data.antiBrawler?.[1]);set('antiBrawlerValue',fmt(data.antiBrawler?.[2]));set('antiPusher',data.antiPusher?.[0]);set('antiPusherValue',fmt(data.antiPusher?.[1]));
  document.getElementById('top10').innerHTML=ranked(data.top10||[]);
  set('nomPush',data.pushers?.[0]?.[0]);set('nomPushValue',`+${fmt(data.pushers?.[0]?.[1])} 🏆`);set('nom3x3',data.x3?.[0]?.[0]);set('nom3x3Value',fmt(data.x3?.[0]?.[1]));set('nomWins',data.wins?.[0]?.[0]);set('nomWinsValue',fmt(data.wins?.[0]?.[1]));set('nomBrawler',data.brawlers?.[0]?.[0]);set('nomBrawlerValue',`${data.brawlers?.[0]?.[1]||'—'} · ${fmt(data.brawlers?.[0]?.[2])}`);set('nomSolo',data.solo?.[0]?.[0]);set('nomSoloValue',fmt(data.solo?.[0]?.[1]));set('nomShd',data.shd?.[0]?.[0]);set('nomShdValue',fmt(data.shd?.[0]?.[1]));
  set('tournamentTitle',`Победители турнира за ${data.name}`);document.getElementById('tournamentText').innerHTML=(data.tournament||[]).map((team,i)=>`<b>${i+1} место</b> · ${team}`).join('<br>');set('tournamentState','ЗАВЕРШЁН');
}
function openMonth(monthIndex,{historyUpdate=true}={}){
  const month=monthNames[monthIndex];
  document.querySelector('.months .active')?.classList.remove('active');
  const selected=document.querySelector(`.months button[data-month="${monthIndex}"]`);
  selected?.classList.add('active'); selected?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
  set('monthName',month); set('viewMonthLabel',capitalize(month));
  const unavailable=isUnavailableMonth(monthIndex);
  monthView.classList.toggle('month-unavailable',unavailable);
  const historical=historicalMonths[monthIndex];
  monthView.classList.remove('month-archive');
  document.body.classList.remove('archive-open');
  if(historical)renderHistorical(historical);
  if(monthIndex===new Date().getMonth()&&!historical&&!unavailable){
    set('dataBadge','LIVE · ИЮЛЬ');set('dataTitle','Свежая статистика VPF');set('dataSubtitle','Данные автоматически загружаются из бота и Google Таблицы');
    set('clubsChapterTitle','Кто отличился в июле');set('nominationsTitle','НОМИНАЦИИ ИЮЛЯ');
    set('tournamentTitle','Июльский турнир ещё продолжается');set('tournamentText','Победители появятся здесь сразу после публикации результатов.');set('tournamentState','СКОРО');
    document.getElementById('clubPushersTitle').hidden=true;document.getElementById('clubPushers').hidden=true;
    loadData();
  }
  document.body.classList.toggle('month-empty',unavailable);
  const reveal=()=>{homeView.hidden=true;homeView.classList.remove('is-leaving');monthView.hidden=false;document.body.classList.add('month-open');window.scrollTo({top:0,behavior:'smooth'})};
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
