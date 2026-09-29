const WORDS = [
  {word:'cat', type:'short'}, {word:'hat', type:'short'}, {word:'snake', type:'magic'},
  {word:'lake', type:'magic'}, {word:'man', type:'short'}, {word:'mane', type:'magic'},
  {word:'plan', type:'short'}, {word:'plane', type:'magic'}, {word:'can', type:'short'},
  {word:'tap', type:'short'}, {word:'mat', type:'short'}, {word:'game', type:'magic'},
  {word:'gate', type:'magic'}, {word:'cap', type:'short'}
];

const $ = s => document.querySelector(s);
const game = $('#gameShell'), cookie = $('#cookie'), wordEl = $('#word'), feedback = $('#feedback');
const shortMonster = $('#shortMonster'), magicMonster = $('#magicMonster');
const scoreEl = $('#score'), streakEl = $('#streak');
const startCard = $('#startCard'), endCard = $('#endCard');
let deck=[], round=0, score=0, streak=0, current=null, locked=true, soundOn=true, fallTimer=null;
let ctx=null;

function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}

function initAudio(){
  if(!ctx) ctx = new (window.AudioContext||window.webkitAudioContext)();
  if(ctx.state==='suspended') ctx.resume();
}
function tone(freq=440,dur=.12,type='sine',vol=.05,delay=0){
  if(!soundOn) return;
  initAudio();
  const o=ctx.createOscillator(), g=ctx.createGain(), t=ctx.currentTime+delay;
  o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+dur);
}
function goodSound(){tone(523,.12,'sine',.06);tone(659,.12,'sine',.06,.1);tone(784,.18,'sine',.06,.2)}
function badSound(){tone(180,.12,'square',.035);tone(145,.18,'square',.03,.1)}
function crunch(){tone(95,.07,'square',.025);tone(70,.09,'square',.02,.06)}

function startGame(){
  initAudio();
  deck=shuffle(WORDS); round=0; score=0; streak=0; locked=false;
  scoreEl.textContent='0'; streakEl.textContent='0';
  startCard.classList.add('hidden'); endCard.classList.add('hidden');
  nextCookie();
}

function nextCookie(){
  clearTimeout(fallTimer);
  if(round>=deck.length){finish();return}
  current=deck[round]; locked=false;
  wordEl.textContent=current.word;
  cookie.className='cookie'; cookie.style.transition='none'; cookie.style.opacity='1';
  const x = 24 + Math.random()*52;
  cookie.style.setProperty('--x',`${x}%`);
  cookie.style.left=`${x}%`; cookie.style.top='-120px'; cookie.style.transform='translateX(-50%) rotate(-4deg) scale(1)';
  cookie.style.setProperty('--drop',`${5.8 + Math.random()*1.5}s`);
  void cookie.offsetWidth;
  cookie.classList.add('falling');
  fallTimer=setTimeout(()=>{ if(!locked) missed(); }, 6500);
}

function missed(){
  locked=true; streak=0; streakEl.textContent='0';
  showFeedback('Too slow! 🍪','bad'); badSound();
  cookie.classList.remove('falling');
  cookie.style.transition='.35s ease'; cookie.style.opacity='0';
  setTimeout(()=>{round++;nextCookie()},700);
}

function choose(type, monster){
  if(locked||!current) return;
  if(type===current.type) correct(monster); else wrong(monster);
}
function wrong(monster){
  streak=0; streakEl.textContent='0'; badSound();
  monster.classList.remove('bad'); void monster.offsetWidth; monster.classList.add('bad');
  cookie.classList.remove('wrong'); void cookie.offsetWidth; cookie.classList.add('wrong');
  showFeedback('Try again!','bad');
}
function correct(monster){
  locked=true; clearTimeout(fallTimer); score++; streak++;
  scoreEl.textContent=score; streakEl.textContent=streak;
  goodSound(); monster.classList.remove('good'); void monster.offsetWidth; monster.classList.add('good');
  cookie.classList.remove('falling','wrong');
  flyCookie(monster).then(()=>{
    crunch(); showFeedback(streak>=3?`Super! ×${streak}`:'Yum! ✓','good');
    if(streak>=4) burst(18);
    setTimeout(()=>{round++;nextCookie()},430);
  });
}
function flyCookie(monster){
  return new Promise(resolve=>{
    const c=cookie.getBoundingClientRect(), m=monster.getBoundingClientRect(), g=game.getBoundingClientRect();
    const targetX = (m.left + m.width/2) - g.left;
    const targetY = (m.top + m.height*.40) - g.top;
    const centerX=(c.left+c.width/2)-g.left, centerY=(c.top+c.height/2)-g.top;
    cookie.style.left=`${centerX}px`; cookie.style.top=`${centerY}px`; cookie.style.transform='translate(-50%,-50%) rotate(0) scale(1)';
    void cookie.offsetWidth;
    cookie.style.transition='left .58s cubic-bezier(.2,.8,.2,1), top .58s cubic-bezier(.2,.8,.2,1), transform .58s ease, opacity .5s ease';
    cookie.style.left=`${targetX}px`; cookie.style.top=`${targetY}px`; cookie.style.transform='translate(-50%,-50%) rotate(22deg) scale(.23)'; cookie.style.opacity='.18';
    setTimeout(resolve,590);
  });
}
function showFeedback(text,kind){
  feedback.textContent=text; feedback.className=`feedback show ${kind==='bad'?'bad':''}`;
  setTimeout(()=>feedback.className='feedback',520);
}
function finish(){
  cookie.className='cookie'; cookie.style.opacity='0';
  $('#finalScore').textContent=score;
  $('#endTitle').textContent = score===14 ? 'Monster Master!' : score>=11 ? 'Fantastic!' : score>=8 ? 'Great job!' : 'Nice try!';
  $('#endText').textContent = score===14 ? 'Perfect! Every cookie found the right monster.' : `You sorted ${score} of ${WORDS.length} cookies correctly.`;
  endCard.classList.remove('hidden'); burst(48);
}
function burst(n=30){
  const box=$('#confetti');
  const colors=['#ffde3d','#ff6b4a','#4bb5f6','#7ddf5b','#a96df2','#ff7ac8'];
  for(let i=0;i<n;i++){
    const p=document.createElement('i'); p.style.left=`${Math.random()*100}%`; p.style.background=colors[i%colors.length];
    p.style.setProperty('--dx',`${-120+Math.random()*240}px`); p.style.animationDelay=`${Math.random()*.25}s`; box.appendChild(p);
    setTimeout(()=>p.remove(),2200);
  }
}

shortMonster.addEventListener('click',()=>choose('short',shortMonster));
magicMonster.addEventListener('click',()=>choose('magic',magicMonster));
$('#startBtn').addEventListener('click',startGame); $('#againBtn').addEventListener('click',startGame);
$('#soundBtn').addEventListener('click',e=>{soundOn=!soundOn;e.currentTarget.textContent=soundOn?'🔊':'🔇';e.currentTarget.setAttribute('aria-label',soundOn?'Sound on':'Sound off')});
$('#fullBtn').addEventListener('click',()=>{if(!document.fullscreenElement) game.requestFullscreen?.(); else document.exitFullscreen?.()});
document.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')choose('short',shortMonster);if(e.key==='ArrowRight')choose('magic',magicMonster)});
