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
let wrongResumeTimer = null;
let fallDeadline = 0;
let fallDurationMs = 0;
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

  $$('.letter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.letter === selectedLetter));
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
  clearTimeout(wrongResumeTimer);
  if (round >= deck.length) { finish(); return; }

  current = deck[round];
  locked = false;
  wordEl.textContent = current.word;
  cookie.className = 'cookie';
  cookie.style.transition = 'none';
  cookie.style.marginLeft = '0px';
  cookie.style.opacity = '1';

  const x = 25 + Math.random() * 50;
  fallDurationMs = 7200 + Math.random() * 1250;
  cookie.style.left = x + '%';
  cookie.style.top = '-135px';
  cookie.style.transform = 'translateX(-50%) rotate(-5deg) scale(1)';
  cookie.style.setProperty('--drop', (fallDurationMs / 1000) + 's');
  void cookie.offsetWidth;
  cookie.classList.add('falling');

  progressBar.style.width = (round / deck.length * 100) + '%';
  fallDeadline = performance.now() + fallDurationMs;
  fallTimer = setTimeout(function(){ if (!locked) missed(); }, fallDurationMs + 120);
}

function showFeedback(text, bad) {
  feedback.textContent = text;
  feedback.className = 'feedback show' + (bad ? ' bad' : '');
  setTimeout(function(){ feedback.className = 'feedback'; }, 650);
}

function missed() {
  locked = true;
  clearTimeout(fallTimer);
  clearTimeout(wrongResumeTimer);
  streak = 0; streakEl.textContent = '0';
  showFeedback('Too slow! 🍪', true); badSound();
  cookie.classList.remove('falling');
  cookie.getAnimations().forEach(function(a){ a.cancel(); });
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
  if (locked || !current) return;

  locked = true;
  streak = 0;
  streakEl.textContent = '0';
  badSound();

  const itemAtMistake = current;
  const animations = cookie.getAnimations();
  const fallAnimation = animations.find(function(a){ return a.animationName === 'drop'; }) || animations[0];
  const remaining = Math.max(1100, fallDeadline - performance.now());

  clearTimeout(fallTimer);
  clearTimeout(wrongResumeTimer);
  if (fallAnimation) fallAnimation.pause();

  monster.classList.remove('good','bad','feeding');
  void monster.offsetWidth;
  monster.classList.add('bad');
  setTimeout(function(){ monster.classList.remove('bad'); }, 620);

  cookie.animate(
    [
      { marginLeft: '0px' },
      { marginLeft: '-18px' },
      { marginLeft: '18px' },
      { marginLeft: '-12px' },
      { marginLeft: '12px' },
      { marginLeft: '0px' }
    ],
    { duration: 430, easing: 'ease-in-out' }
  );

  showFeedback('Try again!', true);

  wrongResumeTimer = setTimeout(function(){
    if (current !== itemAtMistake || startScreen.classList.contains('hidden') === false) return;
    if (fallAnimation) fallAnimation.play();
    locked = false;
    fallDeadline = performance.now() + remaining;
    fallTimer = setTimeout(function(){ if (!locked) missed(); }, remaining + 120);
  }, 720);
}

function correct(monster) {
  locked = true;
  clearTimeout(fallTimer);
  clearTimeout(wrongResumeTimer);

  score++;
  streak++;
  scoreEl.textContent = String(score);
  streakEl.textContent = String(streak);
  goodSound();

  monster.classList.remove('good','bad','feeding');
  void monster.offsetWidth;
  monster.classList.add('feeding');

  cookie.classList.remove('falling','wrong');
  cookie.getAnimations().forEach(function(a){ a.cancel(); });

  flyCookie(monster).then(function(){
    monster.classList.remove('feeding');
    void monster.offsetWidth;
    monster.classList.add('good');
    setTimeout(function(){ monster.classList.remove('good'); }, 780);

    crunch();
    showFeedback(streak >= 5 ? 'AMAZING! ×' + streak : streak >= 3 ? 'Super! ×' + streak : 'Yum! ✓', false);
    if (streak >= 3) burst(Math.min(26, 10 + streak * 2));
    round++;
    progressBar.style.width = (round / deck.length * 100) + '%';
    setTimeout(nextCookie, 520);
  });
}

function flyCookie(monster) {
  return new Promise(function(resolve){
    const c = cookie.getBoundingClientRect();
    const img = monster.querySelector('.monster-base') || monster;
    const m = img.getBoundingClientRect();
    const g = game.getBoundingClientRect();

    const targetX = (m.left + m.width * .50) - g.left;
    const targetY = (m.top + m.height * .50) - g.top;
    const centerX = (c.left + c.width / 2) - g.left;
    const centerY = (c.top + c.height / 2) - g.top;

    cookie.style.left = centerX + 'px';
    cookie.style.top = centerY + 'px';
    cookie.style.marginLeft = '0px';
    cookie.style.transform = 'translate(-50%,-50%) rotate(0deg) scale(1)';
    cookie.style.opacity = '1';
    void cookie.offsetWidth;

    cookie.style.transition =
      'left .58s cubic-bezier(.22,.9,.24,1), ' +
      'top .58s cubic-bezier(.22,.9,.24,1), ' +
      'transform .58s ease-in, opacity .14s linear .43s';

    cookie.style.left = targetX + 'px';
    cookie.style.top = targetY + 'px';
    cookie.style.transform = 'translate(-50%,-50%) rotate(18deg) scale(.12)';
    cookie.style.opacity = '0';

    setTimeout(resolve, 600);
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
  clearTimeout(wrongResumeTimer);
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

$$('.letter-btn').forEach(btn => btn.addEventListener('click', function(){
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
