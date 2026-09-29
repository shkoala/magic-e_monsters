const SHORT_WORDS = [
  'cat','hat','bat','rat','mat','cap','map','tap','nap','can','man','pan',
  'fan','van','jam','ham','bag','tag','sad','mad','dad','plan','clap','flag'
];

const MAGIC_WORDS = [
  'cape','tape','hate','rate','mate','cane','mane','plane','snake','lake',
  'game','gate','name','same','make','take','cake','date','late','face',
  'race','place','page','cage','wave','cave','save','skate','shape','grape'
];

const ALL_WORDS = [
  ...SHORT_WORDS.map(word => ({word, type:'short'})),
  ...MAGIC_WORDS.map(word => ({word, type:'magic'}))
];

const $ = s => document.querySelector(s);
const game = $('#gameShell'), cookie = $('#cookie'), wordEl = $('#word'), feedback = $('#feedback');
const shortMonster = $('#shortMonster'), magicMonster = $('#magicMonster');
const scoreEl = $('#score'), streakEl = $('#streak'), totalCountEl = $('#totalCount');
const progressBar = $('#progressBar');
const startCard = $('#startCard'), endCard = $('#endCard');

let deck=[], round=0, score=0, streak=0, current=null, locked=true, soundOn=true, fallTimer=null;
let selectedCount=24, ctx=null;

function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function buildDeck(count){
  if(count==='all') return shuffle(ALL_WORDS);
  const half=Math.floor(Number(count)/2);
  const shorts=shuffle(SHORT_WORDS).slice(0,half).map(word=>({word,type:'short'}));
  const magics=shuffle(MAGIC_WORDS).slice(0,Number(count)-half).map(word=>({word,type:'magic'}));
  return shuffle([...shorts,...magics]);
}

function initAudio(){
  if(!ctx) ctx = new (window.AudioContext||window.webkitAudioContext)();
  if(ctx.state==='suspended') ctx.resume();
}
function tone(freq=440,dur=.12,type='sine',vol=.05,delay=0){
  if(!soundOn) return;
  initAudio();
  const o=ctx.createOscillator(), g=ctx.createGain(), t=ctx.currentTime+delay;
  o.type=type;o.frequency.setValueAtTime(freq,t);
  g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+dur);
}
function goodSound(){tone(523,.10,'sine',.055);tone(659,.11,'sine',.055,.08);tone(784,.17,'sine',.055,.16)}
function badSound(){tone(185,.10,'triangle',.04);tone(148,.16,'triangle',.035,.09)}
function crunch(){tone(110,.055,'square',.022);tone(80,.08,'square',.018,.05)}

function startGame(){
  initAudio();
  deck=buildDeck(selectedCount);
  round=0;score=0;streak=0;locked=false;
  scoreEl.textContent='0';streakEl.textContent='0';
  totalCountEl.textContent=deck.length;
  $('#finalTotal').textContent=deck.length;
  progressBar.style.width='0%';
  startCard.classList.add('hidden');
  endCard.classList.add('hidden');
  nextCookie();
}

function nextCookie(){
  clearTimeout(fallTimer);
  if(round>=deck.length){finish();return;}
  current=deck[round];locked=false;
  wordEl.textContent=current.word;
  cookie.className='cookie';
  cookie.style.transition='none';
  cookie.style.opacity='1';

  const x=25+Math.random()*50;
  cookie.style.setProperty('--x',`${x}%`);
  cookie.style.left=`${x}%`;
  cookie.style.top='-130px';
  cookie.style.transform='translateX(-50%) rotate(-4deg) scale(1)';
  cookie.style.setProperty('--drop',`${7.2+Math.random()*1.3}s`);
  void cookie.offsetWidth;
  cookie.classList.add('falling');

  progressBar.style.width=`${(round/deck.length)*100}%`;
  fallTimer=setTimeout(()=>{if(!locked) missed();},7900);
}

function missed(){
  locked=true;streak=0;streakEl.textContent='0';
  showFeedback('Oops! Catch the next one!','bad');badSound();
  cookie.classList.remove('falling');
  cookie.style.transition='.35s ease';
  cookie.style.opacity='0';
  setTimeout(()=>{round++;nextCookie();},760);
}

function choose(type,monster){
  if(locked||!current) return;
  type===current.type ? correct(monster) : wrong(monster);
}

function wrong(monster){
  streak=0;streakEl.textContent='0';badSound();
  monster.classList.remove('bad');void monster.offsetWidth;monster.classList.add('bad');
  cookie.classList.remove('wrong');void cookie.offsetWidth;cookie.classList.add('wrong');
  showFeedback('Try the other monster!','bad');
}

function correct(monster){
  locked=true;clearTimeout(fallTimer);score++;streak++;
  scoreEl.textContent=score;streakEl.textContent=streak;
  goodSound();
  monster.classList.remove('good');void monster.offsetWidth;monster.classList.add('good');
  cookie.classList.remove('falling','wrong');
  flyCookie(monster).then(()=>{
    crunch();
    showFeedback(streak>=5?`AMAZING! ×${streak}`:streak>=3?`Super! ×${streak}`:'Yum! ✓','good');
    if(streak>=4) burst(Math.min(28,10+streak*2));
    progressBar.style.width=`${((round+1)/deck.length)*100}%`;
    setTimeout(()=>{round++;nextCookie();},470);
  });
}

function flyCookie(monster){
  return new Promise(resolve=>{
    const c=cookie.getBoundingClientRect(),m=monster.getBoundingClientRect(),g=game.getBoundingClientRect();
    const targetX=(m.left+m.width/2)-g.left;
    const targetY=(m.top+m.height*.36)-g.top;
    const centerX=(c.left+c.width/2)-g.left;
    const centerY=(c.top+c.height/2)-g.top;
    cookie.style.left=`${centerX}px`;
    cookie.style.top=`${centerY}px`;
    cookie.style.transform='translate(-50%,-50%) rotate(0) scale(1)';
    void cookie.offsetWidth;
    cookie.style.transition='left .62s cubic-bezier(.2,.9,.2,1), top .62s cubic-bezier(.2,.9,.2,1), transform .62s ease, opacity .56s ease';
    cookie.style.left=`${targetX}px`;
    cookie.style.top=`${targetY}px`;
    cookie.style.transform='translate(-50%,-50%) rotate(25deg) scale(.18)';
    cookie.style.opacity='.05';
    setTimeout(resolve,635);
  });
}

function showFeedback(text,kind){
  feedback.textContent=text;
  feedback.className=`feedback show ${kind==='bad'?'bad':''}`;
  setTimeout(()=>feedback.className='feedback',620);
}

function finish(){
  cookie.className='cookie';cookie.style.opacity='0';
  progressBar.style.width='100%';
  $('#finalScore').textContent=score;
  const pct=Math.round(score/deck.length*100);
  $('#endTitle').textContent=pct===100?'Monster Master!':pct>=85?'Fantastic!':pct>=65?'Great job!':'Good try!';
  $('#endText').textContent=pct===100
    ? 'Perfect! Every cookie found the right monster.'
    : `You fed ${score} of ${deck.length} cookies correctly.`;
  endCard.classList.remove('hidden');
  burst(pct===100?70:42);
}

function burst(n=30){
  const box=$('#confetti');
  const colors=['#ffde3d','#ff6b4a','#4bb5f6','#7ddf5b','#a96df2','#ff7ac8'];
  for(let i=0;i<n;i++){
    const p=document.createElement('i');
    p.style.left=`${Math.random()*100}%`;
    p.style.background=colors[i%colors.length];
    p.style.setProperty('--dx',`${-140+Math.random()*280}px`);
    p.style.animationDelay=`${Math.random()*.28}s`;
    box.appendChild(p);
    setTimeout(()=>p.remove(),2300);
  }
}

document.querySelectorAll('.mode-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    selectedCount=btn.dataset.count==='all'?'all':Number(btn.dataset.count);
  });
});

shortMonster.addEventListener('click',()=>choose('short',shortMonster));
magicMonster.addEventListener('click',()=>choose('magic',magicMonster));
$('#startBtn').addEventListener('click',startGame);
$('#againBtn').addEventListener('click',()=>{endCard.classList.add('hidden');startCard.classList.remove('hidden');});
$('#soundBtn').addEventListener('click',e=>{
  soundOn=!soundOn;
  e.currentTarget.textContent=soundOn?'🔊':'🔇';
  e.currentTarget.setAttribute('aria-label',soundOn?'Sound on':'Sound off');
});
$('#fullBtn').addEventListener('click',()=>{
  if(!document.fullscreenElement) game.requestFullscreen?.();
  else document.exitFullscreen?.();
});
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft') choose('short',shortMonster);
  if(e.key==='ArrowRight') choose('magic',magicMonster);
});
