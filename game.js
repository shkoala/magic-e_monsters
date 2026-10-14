const LEVEL_ORDER = ['easy', 'medium', 'hard'];

const VOWELS = {
  A: {
    shortTitle: 'SHORT A', longTitle: 'MAGIC A_E',
    shortSound: '/æ/', longSound: '/eɪ/',
    menuShort: 'a /æ/', menuLong: 'a_e /eɪ/',
    shortExamples: 'bat • map • fan', longExamples: 'cake • gate • name',
    levels: {
      easy: { rounds: 16, addShort: ['bat','rat','map','fan','van','ham','bag','sad'], addLong: ['cape','cane','name','mate','cake','gate','tape','cave'] },
      medium: { rounds: 24, addShort: ['clap','nap','pan','mad'], addLong: ['hate','rate','late','same','snake'] },
      hard: { rounds: 30, addShort: ['jam','flag'], addLong: ['date','face','race','place','page','cage','wave','save','skate','grape'] }
    }
  },
  E: {
    shortTitle: 'SHORT E', longTitle: 'LONG E',
    shortSound: '/e/', longSound: '/iː/',
    menuShort: 'e /e/', menuLong: 'long e /iː/',
    shortExamples: 'bed • hen • jet', longExamples: 'me • she • tree',
    levels: {
      easy: { rounds: 16, addShort: ['bed','red','hen','pen','ten','net','leg','jet'], addLong: ['me','he','she','we','be','tree','sheep','feet'] },
      medium: { rounds: 24, addShort: ['pet','wet','bell','nest'], addLong: ['see','seed','green','jeep'] },
      hard: { rounds: 30, addShort: ['vest','desk','step'], addLong: ['queen','sleep','teeth'] }
    }
  },
  I: {
    shortTitle: 'SHORT I', longTitle: 'MAGIC I_E',
    shortSound: '/ɪ/', longSound: '/aɪ/',
    menuShort: 'i /ɪ/', menuLong: 'i_e /aɪ/',
    shortExamples: 'pig • sit • fish', longExamples: 'bike • kite • time',
    levels: {
      easy: { rounds: 16, addShort: ['pig','sit','pin','fin','kit','lip','six','fish'], addLong: ['bike','kite','five','nine','time','line','ride','hide'] },
      medium: { rounds: 24, addShort: ['ship','milk','swim','hill'], addLong: ['smile','white','slide','drive'] },
      hard: { rounds: 30, addShort: ['gift','stick','print'], addLong: ['prize','shine','stripe'] }
    }
  },
  O: {
    shortTitle: 'SHORT O', longTitle: 'MAGIC O_E',
    shortSound: '/ɒ/', longSound: '/əʊ/',
    menuShort: 'o /ɒ/', menuLong: 'o_e /əʊ/',
    shortExamples: 'dog • hot • fox', longExamples: 'home • nose • rope',
    levels: {
      easy: { rounds: 16, addShort: ['dog','hot','fox','box','pot','log','hop','top'], addLong: ['home','nose','rope','note','bone','rose','cone','hope'] },
      medium: { rounds: 24, addShort: ['frog','shop','clock','pond'], addLong: ['stone','phone','globe','smoke'] },
      hard: { rounds: 30, addShort: ['spot','rock','drop'], addLong: ['joke','zone','stove'] }
    }
  },
  U: {
    shortTitle: 'SHORT U', longTitle: 'MAGIC U_E',
    shortSound: '/ʌ/', longSound: '/juː/ • /uː/',
    menuShort: 'u /ʌ/', menuLong: 'u_e /juː/ • /uː/',
    shortExamples: 'sun • cup • bug', longExamples: 'cube • cute • tube',
    levels: {
      easy: { rounds: 16, addShort: ['sun','bus','cup','bug','run','cut','nut','mud'], addLong: ['cube','tube','cute','mule','tune','June','huge','use'] },
      medium: { rounds: 24, addShort: ['duck','jump','drum','plum'], addLong: ['rule','flute','rude','dune'] },
      hard: { rounds: 30, addShort: ['truck','brush','lunch'], addLong: ['mute','fume','prune'] }
    }
  }
};

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const game = $('#gameShell');
const startScreen = $('#startScreen');
const endScreen = $('#endScreen');
const shortMonster = $('#shortMonster');
const longMonster = $('#longMonster');
const cookie = $('#cookie');
const wordEl = $('#word');
const feedback = $('#feedback');
const progressBar = $('#progressBar');
const scoreEl = $('#score');
const totalEl = $('#total');
const streakEl = $('#streak');
const menuBtn = $('#menuBtn');

let selectedLetter = 'A';
let selectedLevel = 'easy';
let deck = [];
let round = 0;
let score = 0;
let streak = 0;
let current = null;
let locked = true;
let fallTimer = null;
let soundOn = true;
let ctx = null;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function initAudio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
}

function tone(freq, dur, type, vol, delay) {
  if (!soundOn) return;
  initAudio();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const t = ctx.currentTime + (delay || 0);
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq || 440, t);
  g.gain.setValueAtTime(vol || .05, t);
  g.gain.exponentialRampToValueAtTime(.001, t + (dur || .12));
  o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + (dur || .12));
}

function goodSound() {
  tone(523,.10,'sine',.055,0); tone(659,.11,'sine',.055,.08);
  tone(784,.16,'sine',.055,.16); tone(988,.13,'sine',.045,.27);
}
function badSound() {
  tone(185,.10,'triangle',.04,0); tone(150,.15,'triangle',.032,.08);
  tone(132,.14,'triangle',.025,.17);
}
function crunch() { tone(105,.055,'square',.022,0); tone(76,.08,'square',.018,.05); }

function wordsBefore(letter, level) {
  const short = [], long = [];
  const target = LEVEL_ORDER.indexOf(level);
  for (let i = 0; i < target; i++) {
    const cfg = VOWELS[letter].levels[LEVEL_ORDER[i]];
    short.push.apply(short, cfg.addShort);
    long.push.apply(long, cfg.addLong);
  }
  return { short: short, long: long };
}

function wordsThrough(letter, level) {
  const short = [], long = [];
  const target = LEVEL_ORDER.indexOf(level);
  for (let i = 0; i <= target; i++) {
    const cfg = VOWELS[letter].levels[LEVEL_ORDER[i]];
    short.push.apply(short, cfg.addShort);
    long.push.apply(long, cfg.addLong);
  }
  return { short: short, long: long };
}

function buildDeck() {
  const cfg = VOWELS[selectedLetter].levels[selectedLevel];
  const previous = wordsBefore(selectedLetter, selectedLevel);
  const mandatory = [];
  cfg.addShort.forEach(word => mandatory.push({word: word, type: 'short'}));
  cfg.addLong.forEach(word => mandatory.push({word: word, type: 'long'}));
  const oldPool = [];
  previous.short.forEach(word => oldPool.push({word: word, type: 'short'}));
  previous.long.forEach(word => oldPool.push({word: word, type: 'long'}));
  const needOld = Math.max(0, cfg.rounds - mandatory.length);
  return shuffle(mandatory.concat(shuffle(oldPool).slice(0, needOld)));
}

function updateSelectionUI() {
  const vowel = VOWELS[selectedLetter];
  const cfg = vowel.levels[selectedLevel];
  const bank = wordsThrough(selectedLetter, selectedLevel);
  const bankSize = bank.short.length + bank.long.length;

  $$$('.letter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.letter === selectedLetter));
  $$('.level-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.level === selectedLevel));

  $('#currentMode').textContent = selectedLetter + ' • ' + selectedLevel.toUpperCase();
  $('#shortTitle').textContent = vowel.shortTitle;
  $('#shortSound').textContent = vowel.shortSound;
  $('#shortExamples').textContent = vowel.shortExamples;
  $('#longTitle').textContent = vowel.longTitle;
  $('#longSound').textContent = vowel.longSound;
  $('#longExamples').textContent = vowel.longExamples;
  $('#menuShort').textContent = vowel.menuShort;
  $('#menuLong').textContent = vowel.menuLong;

  const newWords = cfg.addShort.concat(cfg.addLong).join(' • ');
  const variation = bankSize > cfg.rounds ? ' • ' + cfg.rounds + ' cookies from a ' + bankSize + '-word bank' : '';
  $('#levelPreview').innerHTML = '<b>' + selectedLetter + ' • ' + selectedLevel.toUpperCase() + '</b> — ' +
    cfg.rounds + ' cookies' + variation + '<br><span>New words: ' + newWords + '</span>';

  game.dataset.vowel = selectedLetter.toLowerCase();
}

function startGame() {
  initAudio();
  deck = buildDeck();
  round = 0; score = 0; streak = 0; current = null; locked = false;
  scoreEl.textContent = '0'; streakEl.textContent = '0';
  totalEl.textContent = String(deck.length);
  $('#finalTotal').textContent = String(deck.length);
  progressBar.style.width = '0%';
  startScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  nextCookie();
}

function nextCookie() {
  clearTimeout(fallTimer);
  if (round >= deck.length) { finish(); return; }

  current = deck[round];
  locked = false;
  wordEl.textContent = current.word;
  cookie.className = 'cookie';
  cookie.style.transition = 'none';
  cookie.style.opacity = '1';

  const x = 25 + Math.random() * 50;
  cookie.style.left = x + '%';
  cookie.style.top = '-135px';
  cookie.style.transform = 'translateX(-50%) rotate(-5deg) scale(1)';
  cookie.style.setProperty('--drop', (7.2 + Math.random() * 1.25) + 's');
  void cookie.offsetWidth;
  cookie.classList.add('falling');

  progressBar.style.width = (round / deck.length * 100) + '%';
  fallTimer = setTimeout(function(){ if (!locked) missed(); }, 8100);
}

function showFeedback(text, bad) {
  feedback.textContent = text;
  feedback.className = 'feedback show' + (bad ? ' bad' : '');
  setTimeout(function(){ feedback.className = 'feedback'; }, 650);
}

function missed() {
  locked = true; streak = 0; streakEl.textContent = '0';
  showFeedback('Too slow! 🍪', true); badSound();
  cookie.classList.remove('falling');
  cookie.style.transition = '.35s ease';
  cookie.style.opacity = '0';
  setTimeout(function(){ round++; nextCookie(); }, 730);
}

function choose(type, monster) {
  if (locked || !current) return;
  if (type === current.type) correct(monster);
  else wrong(monster);
}

function wrong(monster) {
  streak = 0; streakEl.textContent = '0'; badSound();
  monster.classList.remove('good','bad');
  void monster.offsetWidth;
  monster.classList.add('bad');
  setTimeout(function(){ monster.classList.remove('bad'); }, 650);
  cookie.classList.remove('wrong');
  void cookie.offsetWidth;
  cookie.classList.add('wrong');
  showFeedback('Try the other monster!', true);
}

function correct(monster) {
  locked = true; clearTimeout(fallTimer);
  score++; streak++;
  scoreEl.textContent = String(score);
  streakEl.textContent = String(streak);
  goodSound();

  monster.classList.remove('good','bad');
  void monster.offsetWidth;
  monster.classList.add('good');
  setTimeout(function(){ monster.classList.remove('good'); }, 820);

  cookie.classList.remove('falling','wrong');
  flyCookie(monster).then(function(){
    crunch();
    showFeedback(streak >= 5 ? 'AMAZING! ×' + streak : streak >= 3 ? 'Super! ×' + streak : 'Yum! ✓', false);
    if (streak >= 3) burst(Math.min(26, 10 + streak * 2));
    round++;
    progressBar.style.width = (round / deck.length * 100) + '%';
    setTimeout(nextCookie, 470);
  });
}

function flyCookie(monster) {
  return new Promise(function(resolve){
    const c = cookie.getBoundingClientRect();
    const m = monster.getBoundingClientRect();
    const g = game.getBoundingClientRect();
    const targetX = (m.left + m.width / 2) - g.left;
    const targetY = (m.top + m.height * .37) - g.top;
    const centerX = (c.left + c.width / 2) - g.left;
    const centerY = (c.top + c.height / 2) - g.top;

    cookie.style.left = centerX + 'px';
    cookie.style.top = centerY + 'px';
    cookie.style.transform = 'translate(-50%,-50%) rotate(0) scale(1)';
    void cookie.offsetWidth;
    cookie.style.transition = 'left .62s cubic-bezier(.2,.9,.2,1), top .62s cubic-bezier(.2,.9,.2,1), transform .62s ease, opacity .56s ease';
    cookie.style.left = targetX + 'px';
    cookie.style.top = targetY + 'px';
    cookie.style.transform = 'translate(-50%,-50%) rotate(25deg) scale(.16)';
    cookie.style.opacity = '.04';
    setTimeout(resolve, 640);
  });
}

function finish() {
  cookie.style.opacity = '0';
  progressBar.style.width = '100%';
  $('#finalScore').textContent = String(score);
  const pct = Math.round(score / deck.length * 100);
  $('#endTitle').textContent = pct === 100 ? 'Monster Master!' : pct >= 85 ? 'Fantastic!' : pct >= 65 ? 'Great job!' : 'Good try!';
  $('#endText').textContent = pct === 100
    ? 'Perfect! You completed ' + selectedLetter + ' • ' + selectedLevel.toUpperCase() + '!'
    : 'You fed ' + score + ' of ' + deck.length + ' cookies correctly.';
  endScreen.classList.remove('hidden');
  burst(pct === 100 ? 70 : 42);
}

function burst(n) {
  const box = $('#confetti');
  const colors = ['#ffde3d','#ff6b4a','#4bb5f6','#7ddf5b','#a96df2','#ff7ac8'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.style.left = (Math.random() * 100) + '%';
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--dx', (-140 + Math.random() * 280) + 'px');
    p.style.animationDelay = (Math.random() * .28) + 's';
    box.appendChild(p);
    setTimeout(function(){ p.remove(); }, 2300);
  }
}

function returnToMenu() {
  clearTimeout(fallTimer);
  locked = true;
  current = null;
  deck = [];
  round = 0;
  score = 0;
  streak = 0;

  scoreEl.textContent = '0';
  streakEl.textContent = '0';
  progressBar.style.width = '0%';

  cookie.className = 'cookie';
  cookie.style.opacity = '0';
  cookie.style.transition = 'none';
  cookie.style.top = '-135px';

  feedback.className = 'feedback';
  endScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
  updateSelectionUI();
}

$('.letter-btn').forEach(btn => btn.addEventListener('click', function(){
  selectedLetter = btn.dataset.letter;
  updateSelectionUI();
}));
$$('.level-btn').forEach(btn => btn.addEventListener('click', function(){
  selectedLevel = btn.dataset.level;
  updateSelectionUI();
}));

shortMonster.addEventListener('click', function(){ choose('short', shortMonster); });
longMonster.addEventListener('click', function(){ choose('long', longMonster); });
$('#startBtn').addEventListener('click', startGame);
menuBtn.addEventListener('click', function(){
  if (confirm('Return to menu? The current game will end.')) returnToMenu();
});
$('#playAgainBtn').addEventListener('click', function(){
  endScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
  updateSelectionUI();
});
$('#soundBtn').addEventListener('click', function(e){
  soundOn = !soundOn;
  e.currentTarget.textContent = soundOn ? '🔊' : '🔇';
});
$('#fullBtn').addEventListener('click', function(){
  if (!document.fullscreenElement) game.requestFullscreen && game.requestFullscreen();
  else document.exitFullscreen && document.exitFullscreen();
});
document.addEventListener('keydown', function(e){
  if (e.key === 'ArrowLeft') choose('short', shortMonster);
  if (e.key === 'ArrowRight') choose('long', longMonster);
  if (e.key === 'Escape') returnToMenu();
});

updateSelectionUI();
