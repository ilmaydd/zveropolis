const $=id=>document.getElementById(id);
const stages=[
  {
    name:'Жалған эфир',place:'Саванна орталығы',topic:'A* · 2-апта',
    speaker:'🐰 Джуди',intro:'Жалған хабар таратқан фургон алаңнан қашып барады. Жолын кесіп, артқы панелін тексер.',
    win:'Фургон тоқтады. Радиодағы белгі Тропик ауданындағы ескі релеге нұсқайды.',
    lesson:'A* жүрген қадамдарды және қалған жолдың шамасын бірге қарайды. Біз алгоритмді фургонның болашақ тұрған жерлеріне қолданып, уақытында жететін нүктені іздедік.'
  },
  {
    name:'Қараңғы реле',place:'Тропик ауданы',topic:'CSP · 3-апта',
    speaker:'🦊 Ник',intro:'Дауыл релеге зақым келтіріпті. Төрт сымды дұрыс ұяларға қос: шын жазба сол кезде ашылады.',
    win:'Алғашқы жазба ашылды. Бого ешқандай бұйрық бермеген. Беллуэзердің жалған хабары мұнараға жіберіліп жатыр.',
    lesson:'CSP барлық ережеге сай шешім іздейді. Алгоритм бос ұяға түс таңдап көреді, ал қайшылық шықса, алдыңғы таңдауға оралады.'
  },
  {
    name:'Мұнарадағы айқас',place:'Тундратаун',topic:'Минимакс · 4-апта',
    speaker:'🐑 Беллуэзер',intro:'«Шын жазбаны эфирге жібере алмайсың!» Беллуэзер алдыңдағы жолақты жауып отырады. Джудиді жасыл пультке жеткіз.',
    win:'Джуди шын жазбаны эфирге қосты. Богоның даусы бүкіл алаңға тарады. Фестиваль жалғасты, ал Беллуэзердің жоспары әшкереленді.',
    lesson:'Минимакс екі жақтың да мүмкін жүрістерін қарайды. Беллуэзер Джудиге ең қиын тосқауылды, ал кеңес Джудиге ұту мүмкіндігі бар бағытты таңдайды.'
  }
];
const vanRoute=Array.from({length:7},(_,i)=>[5+i,3]);
const cityWalls=[
  [0,0,3,2],[4,0,3,2],[9,0,3,2],
  [0,5,2,2],[3,5,3,2],[7,5,2,2],[10,5,2,2]
];
const directions={up:[0,-1],left:[-1,0],down:[0,1],right:[1,0]};
const keys={KeyW:'up',KeyA:'left',KeyS:'down',KeyD:'right',ArrowUp:'up',ArrowLeft:'left',ArrowDown:'down',ArrowRight:'right'};
const colors={red:['Қызыл','#f3a395'],blue:['Көк','#8ec4fc'],green:['Жасыл','#91dbac'],yellow:['Сары','#f6d681']};
const sockets=['Дыбыс','Экран','Дабыл','Антенна'];
const allowed=[['red','blue'],['green','blue'],['yellow'],['green','red']];
const duel={lanes:4,exit:2,blocked:[[],[0],[2],[],[],[0,1,3]]};
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const gap=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
const saveKey='zveropolis-night-broadcast';
const dpad=`<div class="dpad" aria-label="Қозғалыс">${Object.entries({up:'↑',left:'←',down:'↓',right:'→'}).map(([dir,icon])=>
  `<button class="move" data-action="move" data-value="${dir}" aria-label="${{up:'Жоғары',left:'Солға',down:'Төмен',right:'Оңға'}[dir]}">${icon}</button>`).join('')}</div>`;
let chapter=0, unlocked=readSave(), won=false, failed=false, showHint=false, message='';
let judy, turns, gate, wires, column, lane, guard;

function readSave() {
  try {
    const value=Number(localStorage.getItem(saveKey));
    if(Number.isInteger(value)&&value>0&&value<=stages.length) return value;
  } catch {}
  return 0;
}
function save() {
  try {localStorage.setItem(saveKey,unlocked);} catch {}
}
function start(index) {
  chapter=index;
  won=false;failed=false;showHint=false;message='';
  judy=[2,4];turns=0;gate=true;wires=['','','',''];column=0;lane=1;guard=0;
  $('intro').hidden=true;
  $('campaign').hidden=false;
  render();
  $('chapter-title').focus();
}
function finish() {
  won=true;
  message='';
  unlocked=Math.max(unlocked,chapter+1);
  save();
  render();
  $('debrief-title').focus();
}
function lose(text) {
  failed=true;
  message=text;
  render();
  $('retry').focus();
}
function render() {
  const current=stages[chapter];
  $('location').textContent=current.place;
  $('chapter-title').textContent=current.name;
  $('counter').textContent=`Кезең ${chapter+1} / ${stages.length}`;
  $('chapters').innerHTML=stages.map((stage,i)=>`<button class="chapter" data-action="chapter" data-value="${i}" aria-current="${i===chapter}" ${i>unlocked?'disabled':''}>${i<unlocked?'✓ ':''}${stage.place}<small>${stage.name}</small></button>`).join('');
  $('brief').innerHTML=`<h2>${current.speaker}</h2><p>${current.intro}</p>`;
  $('feedback').textContent=message;
  if(chapter===0) renderChase();
  if(chapter===1) renderWires();
  if(chapter===2) renderDuel();
  if(failed) $('controls').innerHTML='<div class="actions"><button id="retry" class="primary" data-action="retry">Қайта көру</button></div>';
  if(won) $('controls').innerHTML='';
  $('debrief').hidden=!won;
  if(won) $('debrief').innerHTML=`<h2 id="debrief-title" tabindex="-1">${chapter===2?'Іс жабылды!':'Миссия орындалды'}</h2>
    <p>${current.win}</p><p><b>${current.topic}</b> · ${current.lesson}</p>
    <div class="actions"><button class="primary" data-action="${chapter===2?'home':'next'}">${chapter===2?'Басты бетке қайту':'Келесі кезең'}</button></div>`;
}

function streetOpen(x,y) {
  return x>=0&&x<12&&y>=0&&y<7&&!(gate&&x===4&&(y===3||y===4))
    && !cityWalls.some(([a,b,w,h])=>x>=a&&x<a+w&&y>=b&&y<b+h);
}
function chaseVan() {return vanRoute[Math.min(Math.floor(turns/2),vanRoute.length-1)];}
function renderChase() {
  const van=chaseVan();
  const hint=showHint?interceptRoute(judy,vanRoute,turns,streetOpen):null;
  const cells=[];
  for(let y=0;y<7;y++) for(let x=0;x<12;x++) {
    const at=[x,y], isJudy=same(at,judy), isVan=same(at,van);
    const open=streetOpen(x,y), adjacent=open&&gap(at,judy)===1;
    const onRoute=hint?.route.some(point=>same(point,at));
    const closedGate=gate&&x===4&&(y===3||y===4);
    const kind=isJudy?'player':isVan?'van':onRoute?'route':open?(y===3?'street':''):'wall';
    const icon=isJudy?'🐰':isVan?'🚐':closedGate?'▧':same(at,vanRoute.at(-1))?'⚑':onRoute?'·':'';
    cells.push(`<button class="cell ${kind} ${adjacent?'next':''}" aria-label="${isJudy?'Джуди':isVan?'Фургон':closedGate?'Жабық қақпа':open?'Көше':'Ғимарат'} · ${x+1}, ${y+1}" data-action="step" data-value="${x},${y}" ${adjacent&&!won&&!failed?'':'disabled'}>${icon}</button>`);
  }
  $('board').innerHTML=`<div class="section-head"><h2>Фестиваль көшесі</h2><span class="chip">Қадам ${turns}</span></div>
    <div class="grid chase-grid">${cells.join('')}</div><div class="legend"><span>🐰 Джуди</span><span>🚐 Фургон</span><span>▧ Қақпа</span><span>⚑ Шығатын жол</span></div>`;
  const left=Math.max(0,vanRoute.length*2-turns);
  $('controls').innerHTML=`<p>Фургон сенің әр екі қадамыңнан кейін бір ұяшық жылжиды.</p><div class="meter" aria-hidden="true"><i style="width:${left/(vanRoute.length*2)*100}%"></i></div>
    ${dpad}<div class="actions"><button class="quiet" data-action="hint">${showHint?'Бағытты жасыру':'A* бағытын көрсету'}</button>
    <button class="quiet" data-action="gate">${gate?'Ашық қақпамен қайта бастау':'Жабық қақпамен қайта бастау'}</button></div>`;
  if(showHint&&!hint&&!won&&!failed) $('feedback').textContent='Фургонға уақытында жететін жол қалмады. Қайта бастап, жасыл бағытпен жүр.';
}
function chaseStep(to) {
  if(!streetOpen(...to)||gap(judy,to)!==1) return;
  judy=to;
  turns++;
  if(turns===vanRoute.length*2) {lose('Фургон көшеден шығып кетті. Бұрышты қысқартып көр немесе A* бағытын қос.');return;}
  if(same(judy,chaseVan())) {finish();return;}
  render();
}

function renderWires() {
  $('board').innerHTML=`<h2>Эфир релесі</h2><div class="wires">${sockets.map((socket,i)=>`<div class="wire-row"><b>${socket}</b>${Object.entries(colors).map(([id,[label,color]])=>
    `<button class="color-choice" style="--wire:${color}" data-action="wire" data-value="${i},${id}" aria-label="${socket} · ${label}" aria-pressed="${wires[i]===id}" ${won?'disabled':''}><span class="wire-dot">●</span>${label}</button>`
  ).join('')}</div>`).join('')}</div>`;
  $('controls').innerHTML=`<ul class="wire-rules">
    <li>Төрт түс бір реттен қолданылады.</li><li>Дыбысқа қызыл не көк.</li><li>Экранға жасыл не көк.</li><li>Дабылға сары.</li><li>Антеннаға жасыл не қызыл.</li>
    </ul><div class="actions"><button class="primary" data-action="check">Релені қосу</button><button class="quiet" data-action="hint">Кеңес</button><button class="quiet" data-action="retry">Тазалау</button></div>`;
}
function wireHint() {
  const solved=solveWires(wires,allowed);
  const next=wires.indexOf('');
  if(!solved) message='Бір түс қайталанды немесе ұяға сәйкес келмеді. Қосылған түсті қайта басып алып таста.';
  else if(next>=0) message=`${sockets[next]} ұясына ${colors[solved[next]][0].toLowerCase()} сым сәйкес келеді.`;
  else message='Барлық сым дұрыс. Релені қос.';
  render();
}

function renderDuel() {
  const moves=duelMoves(duel,column,lane,guard);
  const best=showHint?minimax(duel,column,lane,guard):null;
  const cells=[];
  for(let y=0;y<duel.lanes;y++) for(let x=0;x<duel.blocked.length;x++) {
    const player=x===column&&y===lane, end=x===5&&y===duel.exit;
    const barrier=x===column+1&&y===guard&&x<5;
    const block=duel.blocked[x].includes(y);
    const valid=x===column+1&&moves.includes(y)&&!won&&!failed;
    const kind=player?'player':end?'exit':barrier?'guard':block?'blocked':valid?'valid':'';
    const icon=player?'🐰':end?'◉':barrier?'🔒':block?'×':valid?'·':'';
    cells.push(`<button class="cell ${kind} ${valid&&best?.move===y&&best.score===1?'hint':''}" aria-label="${y+1}-жолақ, ${x+1}-баған${end?' · Пульт':''}" data-action="lane" data-value="${y}" ${valid?'':'disabled'}>${icon}</button>`);
  }
  $('board').innerHTML=`<div class="section-head"><h2>Эфир мұнарасы</h2><span class="chip">${column} / 5</span></div><div class="grid duel-grid">${cells.join('')}</div>
    <div class="legend"><span>🐰 Джуди</span><span>🔒 Беллуэзердің тосқауылы</span><span>◉ Пульт</span></div>`;
  $('controls').innerHTML='<p>Келесі бағаннан жаныңдағы не дәл алдыңдағы ашық жолақты таңда. Беллуэзер әр жүрістен кейін тосқауылды бір жолаққа жылжыта алады. Соңғы жасыл пультке жет.</p><div class="actions"><button class="quiet" data-action="hint">Кеңес</button><button class="quiet" data-action="retry">Қайта бастау</button></div>';
  if(showHint&&!won&&!failed) $('feedback').textContent=best.score===1?`Кеңес: ${best.move+1}-жолақты таңда. Ұяшық сары жиекпен белгіленді.`:'Бұл күйде қарсылас жолды жаба алады. Басқа бірінші жүрісті байқап көр.';
}
function duelStep(next) {
  if(!duelMoves(duel,column,lane,guard).includes(next)) return;
  lane=next;
  column++;
  if(column===5) {finish();return;}
  guard=minimax(duel,column,lane,guard,false).move;
  if(!duelMoves(duel,column,lane,guard).length) {lose('Дәліз жабылды. Қайта бастап, бірінші бұрылысты өзгерт.');return;}
  message=`Беллуэзер ${guard+1}-жолақты жапты.`;
  render();
}

function home() {
  $('campaign').hidden=true;
  $('intro').hidden=false;
  $('resume').hidden=unlocked===0;
}
$('start').addEventListener('click',()=>start(0));
$('resume').addEventListener('click',()=>start(Math.min(unlocked,stages.length-1)));
$('help').addEventListener('click',()=>$('dialog').showModal());
document.addEventListener('keydown',e=>{
  if(chapter!==0||won||failed||$('campaign').hidden||$('dialog').open||e.ctrlKey||e.metaKey||e.altKey) return;
  const direction=keys[e.code];
  if(!direction) return;
  e.preventDefault();
  const [dx,dy]=directions[direction];
  chaseStep([judy[0]+dx,judy[1]+dy]);
});
$('campaign').addEventListener('click',e=>{
  const button=e.target.closest('[data-action]');
  if(!button) return;
  const {action,value}=button.dataset;
  if(action==='chapter'&&Number(value)<=unlocked) start(Number(value));
  if(action==='retry') start(chapter);
  if(action==='next') start(chapter+1);
  if(action==='home') home();
  if(won||failed) return;
  if(action==='move') {
    const [dx,dy]=directions[value];
    chaseStep([judy[0]+dx,judy[1]+dy]);
  }
  if(action==='step') chaseStep(value.split(',').map(Number));
  if(action==='lane') duelStep(Number(value));
  if(action==='gate') {const next=!gate;start(0);gate=next;render();}
  if(action==='wire') {
    const [index,color]=value.split(',');
    wires[index]=wires[index]===color?'':color;
    message='';
    render();
    $('board').querySelector(`[data-value="${value}"]`)?.focus();
  }
  if(action==='check') {
    if(wires.every(Boolean)&&wireFits(wires,allowed)) finish();
    else {message='Төрт ұяны және түс ережелерін тексер.';render();}
  }
  if(action==='hint') {
    if(chapter===1) wireHint();
    else {showHint=!showHint;render();}
  }
});
home();
