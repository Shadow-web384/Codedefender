// ═══════════════════════════════════════════════════════════════════════════════
//  CODEDEFENDER — BEGINNER ENGINE v1.0
//  Loads AFTER nexus_core.js. Zero modifications to any existing file logic.
//
//  Features integrated:
//   #2  — Sandbox Terminal (run real Python via Piston API)
//   #3  — Animated "Why Does This Matter?" explainer cards on briefing
//   #4  — Rookie Mode (4th difficulty: half-speed, always-visible hints, no penalties)
//   #6  — Visual Learning Roadmap (skill-tree map modal)
//   #7  — "Explain My Mistake" post-breach card
//   #9  — Typing Trainer mode (symbol/character muscle-memory drills)
//   #10 — Personal Progress Report tab in Profile modal
//   #11 — Guided First Mission onboarding tutorial (shows once per user)
//   #12 — "See It In The Wild" real-world examples in Knowledge Vault
// ═══════════════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ── Wait for game engine + NEXUS to be ready ──────────────────────────────
  function waitReady(cb) {
    if (window.GS && window.goTo) { cb(); return; }
    setTimeout(() => waitReady(cb), 250);
  }
  waitReady(initBE);

  // ═══════════════════════════════════════════════════════════════════════════
  //  SHARED STATE
  // ═══════════════════════════════════════════════════════════════════════════
  const BE = {
    rookieMode: false,
    tutorialDone: false,
    tutorialStep: 0,
    mistakeWord: null,        // last breached word target string
    typingTrainerActive: false,
    progressData: {},         // filled by fetchProgressReport()
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  #3 — "WHY DOES THIS MATTER?" — per-level animated explainer cards
  // ═══════════════════════════════════════════════════════════════════════════
  const WHY_CARDS = {
    python: {
      1: {
        icon: '📡', color: '#00d4ff', title: 'Why print() and input()?',
        body: 'Computers are silent by default. <code>print()</code> is how your program speaks to the world. <code>input()</code> is how it listens. Without these two, your program runs invisibly — like a conversation happening inside your head.',
        analogy: '🧠 Think of it like: <code>print</code> = talking, <code>input</code> = listening.'
      },
      2: {
        icon: '⚡', color: '#ffff00', title: 'Why if / else / for / while?',
        body: 'Real programs make decisions. Without <code>if</code>, your program does the same thing every time regardless of what happens. Without loops, you\'d have to copy-paste the same code 100 times for 100 users.',
        analogy: '🎮 Think of it like: a game that checks "did the player win?" every frame — that\'s an <code>if</code> inside a <code>while</code> loop.'
      },
      3: {
        icon: '🧠', color: '#39ff8f', title: 'Why lists and dictionaries?',
        body: 'You can\'t write a contacts app with 500 separate variables. <code>list</code> lets you store many items under one name. <code>dict</code> lets you label them. These are the backbone of almost every real program.',
        analogy: '📱 Think of it like: your phone contacts — one list, each person has a name (key) and number (value). That\'s a dict.'
      },
      4: {
        icon: '🔍', color: '#b57aff', title: 'Why functions?',
        body: 'Without <code>def</code>, you repeat the same code everywhere. If you find a bug, you fix it in 20 places. Functions let you write code once and call it anywhere. This is how professional codebases stay manageable.',
        analogy: '🍕 Think of it like: a pizza recipe. Write it once, make it 1000 times — never rewrite it.'
      },
      5: {
        icon: '📦', color: '#ff6b35', title: 'Why import modules?',
        body: 'Nobody writes everything from scratch. <code>import random</code> gives you a random number generator that took experts years to perfect. You get it in one line. This is how real developers work — build on what already exists.',
        analogy: '🔧 Think of it like: buying a drill instead of building one. <code>import</code> = buying the tool.'
      },
      6: {
        icon: '⚠', color: '#ff0080', title: 'Putting it all together',
        body: 'Level 6 combines everything: input → decision → loop → function → output. This is the shape of almost every real program ever written. Master this pattern and you can build anything.',
        analogy: '🏗️ Think of it like: architecture. Every skyscraper uses the same foundation principles — you\'re learning those foundations now.'
      },
    },
    java: {
      1: {
        icon: '🔩', color: '#00d4ff', title: 'Why declare types?',
        body: 'Java forces you to say <em>what kind of data</em> a variable holds before using it. This catches mistakes before your program runs. A typo that stores text where a number should go is caught immediately — not 6 months later in production.',
        analogy: '📦 Think of it like: labelled boxes. You wouldn\'t put a pizza in a box labelled "shoes" — Java\'s type system prevents exactly this.'
      },
      2: {
        icon: '🔐', color: '#b57aff', title: 'Why public / private / static?',
        body: 'In a team of 50 developers, you need rules about who can touch what. <code>private</code> says "only I use this". <code>public</code> says "anyone can use this". <code>static</code> says "this belongs to the idea, not a specific object". These rules prevent entire categories of bugs.',
        analogy: '🏢 Think of it like: a company where some files are public, some are confidential — access control keeps things safe.'
      },
      3: {
        icon: '🌊', color: '#39ff8f', title: 'Why semicolons and braces?',
        body: 'Java uses <code>;</code> to end statements and <code>{ }</code> to group blocks. This removes ambiguity. Python uses indentation, which is flexible. Java\'s strictness means any Java program has exactly one correct interpretation — no guessing.',
        analogy: '📝 Think of it like: punctuation in English. "Let\'s eat, Grandma" vs "Let\'s eat Grandma". Punctuation saves lives — so do semicolons.'
      },
      4: {
        icon: '🧱', color: '#ff6b35', title: 'Why classes and objects?',
        body: 'A <code>class</code> is a blueprint. An <code>object</code> is something built from that blueprint. You design a "Car" class once, then create 10,000 Car objects. Each car has its own data but shares the same behaviour. This is how Java programs model the real world.',
        analogy: '🏭 Think of it like: a factory. The blueprint (class) is designed once. The factory stamped parts (objects) are made many times.'
      },
      5: {
        icon: '💥', color: '#ff0080', title: 'Why try / catch?',
        body: 'Real programs deal with the real world: files that don\'t exist, networks that drop, users who type letters where numbers should go. <code>try/catch</code> lets you handle these situations gracefully instead of crashing.',
        analogy: '🪂 Think of it like: a parachute. The try block is your jump. The catch block is the parachute — you hope you don\'t need it, but you always pack one.'
      },
      6: {
        icon: '⚠', color: '#ff0080', title: 'Full Java architecture',
        body: 'Every Java program has classes, methods, types, and error handling working together. This is the structure that powers Android apps, bank systems, and enterprise software. You now know the foundation of one of the world\'s most used languages.',
        analogy: '🌆 Think of it like: city infrastructure. Roads (control flow), buildings (classes), utilities (libraries) — all connected.'
      },
    },
    c: {
      1: {
        icon: '🔩', color: '#00d4ff', title: 'Why do types have exact sizes in C?',
        body: 'C was designed to talk directly to hardware. An <code>int</code> is exactly 4 bytes. A <code>char</code> is 1 byte. When you\'re programming a microcontroller with 2KB of RAM, every byte counts. C gives you total control over memory layout.',
        analogy: '⚙️ Think of it like: engineering tolerances. A bolt is exactly 10mm — not "about 10mm". Precision matters at the hardware level.'
      },
      2: {
        icon: '⚙', color: '#ff6b35', title: 'Why #include and #define?',
        body: 'The <code>#include</code> directive runs before compilation — it pastes the contents of another file into yours. This is how C accesses I/O functions like <code>printf</code>. <code>#define</code> creates text substitutions. These run before the compiler even sees your code.',
        analogy: '📋 Think of it like: a form with blank spaces. <code>#define MAX 100</code> tells the preprocessor: wherever you see MAX, write 100.'
      },
      3: {
        icon: '📍', color: '#b57aff', title: 'Why pointers? (The hardest concept in C)',
        body: 'Every variable lives at a specific memory address. A pointer stores that address. This lets you pass large data structures to functions without copying them, build linked lists, and interact with hardware registers directly. Pointers are why C is still used in operating systems and embedded firmware 50 years after its creation.',
        analogy: '🏠 Think of it like: a street address vs the house itself. A pointer is the address — not the house, but it tells you exactly where the house is.'
      },
      4: {
        icon: '📺', color: '#39ff8f', title: 'Why printf uses format codes?',
        body: 'C\'s <code>printf</code> predates modern type systems. It uses <code>%d</code> for integers, <code>%s</code> for strings, <code>%f</code> for floats because C doesn\'t automatically know what type you\'re printing. You tell it explicitly — this is both C\'s power and its danger.',
        analogy: '🖨️ Think of it like: a form with typed fields. %d says "this slot is for a number" — you fill in what goes there.'
      },
      5: {
        icon: '🧠', color: '#ffff00', title: 'Why manage memory manually?',
        body: 'C has no garbage collector. When you <code>malloc</code> memory, you own it. When you\'re done, you <code>free</code> it. Forgetting to free is a memory leak. Freeing twice is a crash. This responsibility is why C programs can run for years without memory growing — if written correctly.',
        analogy: '🏨 Think of it like: renting a hotel room. You check in (malloc), use it, then check out (free). If you never check out, the hotel runs out of rooms.'
      },
      6: {
        icon: '⚠', color: '#ff0080', title: 'Full C mastery',
        body: 'You now understand types, preprocessor, pointers, I/O, and memory management — the five pillars of C programming. Linux kernel, SQLite, Python\'s own interpreter, most embedded firmware — all written in C. You are learning the language that built the modern world.',
        analogy: '🌍 Think of it like: learning the language that all other languages were built on top of.'
      },
    },
  };

  function showWhyCard(lang, lvl, onClose) {
    const card = WHY_CARDS[lang]?.[lvl];
    if (!card) { if (onClose) onClose(); return; }
    const ov = document.getElementById('be-why-overlay');
    if (!ov) { if (onClose) onClose(); return; }
    ov.querySelector('.be-why-icon').textContent = card.icon;
    const title = ov.querySelector('.be-why-title');
    title.textContent = card.title; title.style.color = card.color;
    ov.querySelector('.be-why-body').innerHTML = card.body;
    ov.querySelector('.be-why-analogy').innerHTML = card.analogy;
    ov.style.borderColor = card.color;
    ov.style.boxShadow = `0 0 40px ${card.color}44`;
    ov.classList.add('open');
    ov.querySelector('.be-why-btn').onclick = () => {
      ov.classList.remove('open');
      setTimeout(() => { if (onClose) onClose(); }, 300);
    };
    setTimeout(() => {
      ov.classList.remove('open');
      setTimeout(() => { if (onClose) onClose(); }, 300);
    }, 18000);
  }
  window.BE_showWhyCard = showWhyCard;

  // ═══════════════════════════════════════════════════════════════════════════
  //  #4 — ROOKIE MODE (REMOVED as per user request)
  // ═══════════════════════════════════════════════════════════════════════════
  function applyRookieMode() { }
  function toggleRookieMode(on) { }
  window.BE_toggleRookie = toggleRookieMode;

  // ═══════════════════════════════════════════════════════════════════════════
  //  #7 — EXPLAIN MY MISTAKE
  // ═══════════════════════════════════════════════════════════════════════════
  // We hook into the NEXUS onBreach path by watching for the nx-flash + storing
  // the last breached word from our MutationObserver.
  const _origGoTo = window.goTo;
  if (_origGoTo) {
    window.goTo = function (id) {
      _origGoTo.call(this, id);
      if (id === 'screen-game') {
        BE.mistakeWord = null;
        const cs = document.getElementById('be-cheatsheet');
        if (cs && BE.rookieMode) {
          buildCheatsheet(window.GS?.language || 'python', window.GS?.levelId || 1);
          cs.style.display = 'block';
        }
      }
    };
  }

  // Patch NEXUS onBreach (already patched via MutationObserver) —
  // intercept the NX breach to grab the word before it's cleared
  const _origFDW = window.finishDestroyWord;
  // We watch for breaches via a separate observer on gameCanvas removals
  const _breachWatcher = new MutationObserver(mutations => {
    mutations.forEach(m => m.removedNodes.forEach(n => {
      if (n.nodeType !== 1 || !n.classList?.contains('word-fall')) return;
      if (n.dataset.destroyed) return; // player shot it — not a breach
      const kw = (n.dataset.target || n.dataset.original || '').split('(')[0].split(' ')[0].trim();
      if (kw) showMistakeCard(kw);
    }));
  });

  function attachBreachWatcher() {
    const cv = document.getElementById('gameCanvas');
    if (cv) _breachWatcher.observe(cv, { childList: true });
  }

  function showMistakeCard(kw) {
    // Use NEXUS DB if available
    const DB = window.NX ? null : null; // NX doesn't expose DB directly
    // Fall back to our own mini-glossary
    const def = BE_GLOSSARY[kw] || BE_GLOSSARY[kw?.toLowerCase()];
    const card = document.getElementById('be-mistake-card');
    if (!card) return;
    card.querySelector('.be-mc-kw').textContent = kw;
    card.querySelector('.be-mc-what').textContent = def ? def.what : 'Review this keyword.';
    card.querySelector('.be-mc-ex').textContent = def ? def.example : '';
    card.querySelector('.be-mc-tip').textContent = def ? '💡 ' + def.tip : '';
    card.classList.add('show');
    clearTimeout(card._t);
    card._t = setTimeout(() => card.classList.remove('show'), 5000);
  }

  // Mini glossary for mistake card (subset of NEXUS DB)
  const BE_GLOSSARY = {
    print: { what: 'Outputs text to the screen.', example: 'print("Hello!")', tip: 'The simplest way to see your program\'s output.' },
    input: { what: 'Reads text typed by the user.', example: 'name = input("Name? ")', tip: 'Pauses the program and waits for the human to respond.' },
    int: { what: 'Converts something to a whole number.', example: 'int("5") → 5', tip: 'Use this when you need to do math with user input.' },
    float: { what: 'Converts to a decimal number.', example: 'float("3.14")', tip: 'Use when precision beyond whole numbers matters.' },
    str: { what: 'Converts to text.', example: 'str(42) → "42"', tip: 'Wraps any value in quotes so you can treat it as text.' },
    bool: { what: 'True or False — the foundation of logic.', example: 'bool(0) → False', tip: 'Everything in programming ultimately reduces to True/False.' },
    list: { what: 'An ordered collection of items.', example: 'items = [1, 2, 3]', tip: 'Like a numbered drawer set — each item has a position.' },
    dict: { what: 'Key-value pairs — a labelled store.', example: 'd = {"name": "Ali"}', tip: 'Like a real dictionary: you look up the word to get the meaning.' },
    if: { what: 'Runs code only when condition is True.', example: 'if x > 0: print(x)', tip: 'The fork in the road — code goes one way or the other.' },
    elif: { what: '"Else if" — a second condition to check.', example: 'elif x == 0:', tip: 'Only checked if the if above was False.' },
    else: { what: 'Runs when ALL conditions above failed.', example: 'else: print("no")', tip: 'The catch-all safety net.' },
    for: { what: 'Repeats for each item in a sequence.', example: 'for i in range(3):', tip: 'Visits every item, one by one.' },
    while: { what: 'Repeats as long as condition is True.', example: 'while x < 10: x+=1', tip: 'Keeps going until told to stop.' },
    break: { what: 'Exits the loop immediately.', example: 'if x==5: break', tip: 'Emergency exit from any loop.' },
    continue: { what: 'Skips the rest of this loop cycle.', example: 'if x==0: continue', tip: 'Jump to the next iteration without stopping.' },
    def: { what: 'Defines a reusable block of code.', example: 'def greet(name):', tip: 'Write once, call from anywhere.' },
    return: { what: 'Sends a value back from a function.', example: 'return x * 2', tip: 'The function\'s answer to whoever called it.' },
    class: { what: 'A blueprint for creating objects.', example: 'class Dog: pass', tip: 'Like a cookie cutter — stamp out as many objects as you need.' },
    import: { what: 'Loads a pre-built library of tools.', example: 'import random', tip: 'Never reinvent the wheel — import what already exists.' },
    random: { what: 'Library for generating random values.', example: 'random.randint(1,10)', tip: 'Chaos, on demand.' },
    append: { what: 'Adds an item to the end of a list.', example: 'items.append("milk")', tip: 'Push something new into the list.' },
    range: { what: 'Generates a sequence of numbers.', example: 'range(5) → 0,1,2,3,4', tip: 'The loop counting machine.' },
    len: { what: 'Returns the number of items in something.', example: 'len([1,2,3]) → 3', tip: 'How big is this collection?' },
    public: { what: 'Anyone can access this member.', example: 'public void run()', tip: 'No restrictions on this door.' },
    private: { what: 'Only THIS class can access it.', example: 'private int age;', tip: 'Protected from outside interference.' },
    static: { what: 'Belongs to the class, not an instance.', example: 'static int count = 0;', tip: 'Shared by all objects of this class.' },
    void: { what: 'This method returns nothing.', example: 'void printHi()', tip: 'No output — pure side effect.' },
    new: { what: 'Creates a new object from a class.', example: 'Dog d = new Dog();', tip: 'Stamps a new instance from the blueprint.' },
    try: { what: 'Attempts code that might fail.', example: 'try { ... }', tip: 'Wrap risky code in here.' },
    catch: { what: 'Handles the error if try fails.', example: 'catch(Exception e)', tip: 'The safety net below the trapeze.' },
    printf: { what: 'Prints formatted text to screen.', example: 'printf("Hi %s\\n", name)', tip: '%s=string, %d=int, %f=float.' },
    scanf: { what: 'Reads formatted input from user.', example: 'scanf("%d", &x);', tip: 'The & gives the memory address so C knows where to store it.' },
    malloc: { what: 'Requests a block of memory.', example: 'malloc(sizeof(int)*5)', tip: 'You own this memory — always free it when done.' },
    free: { what: 'Returns allocated memory back.', example: 'free(ptr);', tip: 'Forgetting this causes memory leaks — one of the most common C bugs.' },
    struct: { what: 'Groups related data into one custom type.', example: 'struct Point {int x,y;}', tip: 'Pre-OOP bundling of related data fields.' },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  #6 — VISUAL LEARNING ROADMAP
  // ═══════════════════════════════════════════════════════════════════════════
  const ROADMAP_NODES = [
    // Python Normal
    { id: 'py-1', lang: 'python', mode: 'classic', diff: 'normal', lvl: 1, label: 'PY L1', sub: 'I/O', x: 5, y: 10 },
    { id: 'py-2', lang: 'python', mode: 'classic', diff: 'normal', lvl: 2, label: 'PY L2', sub: 'Logic', x: 18, y: 10 },
    { id: 'py-3', lang: 'python', mode: 'classic', diff: 'normal', lvl: 3, label: 'PY L3', sub: 'Memory', x: 31, y: 10 },
    { id: 'py-4', lang: 'python', mode: 'classic', diff: 'normal', lvl: 4, label: 'PY L4', sub: 'Pattern', x: 44, y: 10 },
    { id: 'py-5', lang: 'python', mode: 'classic', diff: 'normal', lvl: 5, label: 'PY L5', sub: 'Modules', x: 57, y: 10 },
    { id: 'py-6', lang: 'python', mode: 'classic', diff: 'normal', lvl: 6, label: 'BOSS', sub: 'Full PY', x: 70, y: 10, boss: true },
    // Java Normal
    { id: 'ja-1', lang: 'java', mode: 'classic', diff: 'normal', lvl: 1, label: 'JV L1', sub: 'Types', x: 5, y: 38 },
    { id: 'ja-2', lang: 'java', mode: 'classic', diff: 'normal', lvl: 2, label: 'JV L2', sub: 'Access', x: 18, y: 38 },
    { id: 'ja-3', lang: 'java', mode: 'classic', diff: 'normal', lvl: 3, label: 'JV L3', sub: 'Flow', x: 31, y: 38 },
    { id: 'ja-4', lang: 'java', mode: 'classic', diff: 'normal', lvl: 4, label: 'JV L4', sub: 'Objects', x: 44, y: 38 },
    { id: 'ja-5', lang: 'java', mode: 'classic', diff: 'normal', lvl: 5, label: 'JV L5', sub: 'Errors', x: 57, y: 38 },
    { id: 'ja-6', lang: 'java', mode: 'classic', diff: 'normal', lvl: 6, label: 'BOSS', sub: 'Full JV', x: 70, y: 38, boss: true },
    // C Normal
    { id: 'c-1', lang: 'c', mode: 'classic', diff: 'normal', lvl: 1, label: 'C  L1', sub: 'Types', x: 5, y: 66 },
    { id: 'c-2', lang: 'c', mode: 'classic', diff: 'normal', lvl: 2, label: 'C  L2', sub: 'Preproc', x: 18, y: 66 },
    { id: 'c-3', lang: 'c', mode: 'classic', diff: 'normal', lvl: 3, label: 'C  L3', sub: 'Pointers', x: 31, y: 66 },
    { id: 'c-4', lang: 'c', mode: 'classic', diff: 'normal', lvl: 4, label: 'C  L4', sub: 'I/O', x: 44, y: 66 },
    { id: 'c-5', lang: 'c', mode: 'classic', diff: 'normal', lvl: 5, label: 'C  L5', sub: 'Memory', x: 57, y: 66 },
    { id: 'c-6', lang: 'c', mode: 'classic', diff: 'normal', lvl: 6, label: 'BOSS', sub: 'Full C', x: 70, y: 66, boss: true },
  ];

  function openRoadmap() {
    const modal = document.getElementById('be-roadmap-modal');
    if (!modal) return;
    renderRoadmap();
    modal.classList.add('open');
  }
  window.BE_openRoadmap = openRoadmap;

  function renderRoadmap() {
    const container = document.getElementById('be-roadmap-svg');
    if (!container) return;
    const completed = window.GS?.completedLevels || {};

    const LANGS = [
      {
        key: 'python', label: '🐍 PYTHON', col: '#39ff8f', nodes: [
          { lvl: 1, sub: 'I/O & Print' },
          { lvl: 2, sub: 'Logic Gates' },
          { lvl: 3, sub: 'Memory' },
          { lvl: 4, sub: 'Functions' },
          { lvl: 5, sub: 'Modules' },
          { lvl: 6, sub: 'Boss', boss: true },
        ]
      },
      {
        key: 'java', label: '☕ JAVA', col: '#00d4ff', nodes: [
          { lvl: 1, sub: 'Primitives' },
          { lvl: 2, sub: 'Access' },
          { lvl: 3, sub: 'Flow' },
          { lvl: 4, sub: 'Objects' },
          { lvl: 5, sub: 'Exceptions' },
          { lvl: 6, sub: 'Boss', boss: true },
        ]
      },
      {
        key: 'c', label: '⚙ C-LANG', col: '#ff6b35', nodes: [
          { lvl: 1, sub: 'Data Types' },
          { lvl: 2, sub: 'Preprocessor' },
          { lvl: 3, sub: 'Pointers' },
          { lvl: 4, sub: 'I/O Streams' },
          { lvl: 5, sub: 'Memory' },
          { lvl: 6, sub: 'Boss', boss: true },
        ]
      },
    ];

    container.innerHTML = '';
    container.style.cssText = 'display:flex;flex-direction:column;gap:28px;padding:8px 0;';

    LANGS.forEach(lang => {
      const key = `${lang.key}_classic_normal`;
      const completedArr = completed[key] || [];

      // Language row
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

      // Language header
      const header = document.createElement('div');
      header.style.cssText = `display:flex;align-items:center;gap:10px;font-family:'Orbitron',monospace;font-size:10px;font-weight:700;letter-spacing:3px;color:${lang.col};`;
      header.innerHTML = `<span style="display:inline-block;width:100%;height:1px;background:linear-gradient(90deg,${lang.col}60,transparent);max-width:40px;"></span>${lang.label}<span style="flex:1;height:1px;background:linear-gradient(90deg,${lang.col}40,transparent);"></span>`;
      row.appendChild(header);

      // Nodes track
      const track = document.createElement('div');
      track.style.cssText = 'display:grid;grid-template-columns:repeat(6,1fr);gap:8px;';

      lang.nodes.forEach(n => {
        const done = completedArr.includes(n.lvl);
        const isNext = !done && (completedArr.includes(n.lvl - 1) || n.lvl === 1);
        const locked = !done && !isNext;

        const node = document.createElement('div');
        const borderCol = done ? lang.col : isNext ? '#ffff00' : 'rgba(255,255,255,0.1)';
        const bgCol = done ? `${lang.col}18` : isNext ? 'rgba(255,255,80,0.07)' : 'rgba(0,0,0,0.3)';
        const textCol = done ? lang.col : isNext ? '#ffff00' : 'rgba(255,255,255,0.2)';
        node.style.cssText = `background:${bgCol};border:1px solid ${borderCol};border-radius:6px;padding:10px 6px;text-align:center;cursor:${(done || isNext) ? 'pointer' : 'default'};transition:all 0.2s;position:relative;overflow:hidden;`;

        if (done || isNext) {
          node.addEventListener('mouseenter', () => node.style.filter = 'brightness(1.3)');
          node.addEventListener('mouseleave', () => node.style.filter = '');
          node.addEventListener('click', () => {
            document.getElementById('be-roadmap-modal').classList.remove('open');
            setTimeout(() => {
              window.GS.mode = 'classic';
              window.GS.difficulty = 'normal';
              window.apiStartGame(lang.key, n.lvl);
            }, 300);
          });
        }

        const label = done ? '✓' : n.boss ? '⚠' : n.lvl;
        const glowStyle = done ? `text-shadow:0 0 12px ${lang.col};` : isNext ? 'text-shadow:0 0 12px #ffff0080;' : '';
        node.innerHTML = `
          <div style="font-family:'Orbitron',monospace;font-size:${n.boss ? '14' : '16'}px;font-weight:700;color:${textCol};${glowStyle}margin-bottom:5px;">${label}</div>
          <div style="font-size:8px;color:${textCol};opacity:0.85;letter-spacing:1px;font-family:'Share Tech Mono',monospace;">${n.sub}</div>
          ${done ? `<div style="position:absolute;top:3px;right:4px;font-size:7px;color:${lang.col};opacity:0.6;">DONE</div>` : ''}
          ${isNext && !done ? `<div style="position:absolute;top:3px;right:4px;font-size:7px;color:#ffff00;opacity:0.7;">NEXT</div>` : ''}
        `;
        track.appendChild(node);
      });

      row.appendChild(track);
      container.appendChild(row);
    });

    // Legend
    const legend = document.createElement('div');
    legend.style.cssText = 'display:flex;gap:20px;margin-top:8px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);';
    legend.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;font-size:9px;color:rgba(255,255,255,0.4);">
        <div style="width:10px;height:10px;border-radius:2px;background:#39ff8f;opacity:0.4;"></div>Completed
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:9px;color:rgba(255,255,255,0.4);">
        <div style="width:10px;height:10px;border-radius:2px;background:#ffff00;opacity:0.4;"></div>Next / Unlocked
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:9px;color:rgba(255,255,255,0.4);">
        <div style="width:10px;height:10px;border-radius:2px;background:rgba(255,255,255,0.1);"></div>Locked
      </div>
    `;
    container.appendChild(legend);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  #10 — PERSONAL PROGRESS REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  async function fetchProgressReport() {
    try {
      const data = await window.apiFetch('/my_rank');
      if (!data || !data.global_rank) return;
      BE.progressData.rank = data.global_rank;
      BE.progressData.badges = data.lang_badges;
      BE.progressData.score = data.total_score || 0;
      renderProgressReport();
    } catch (e) { /* silent */ }
  }

  function renderProgressReport() {
    const panel = document.getElementById('be-progress-panel');
    if (!panel) return;
    const d = BE.progressData;
    const completed = window.GS?.completedLevels || {};

    // Count unique keywords destroyed (from NEXUS mistake tracker proxy)
    const wordsTyped = window.GS?._wordsTyped || 0;

    // Count levels per language
    const langLevels = {};
    ['python', 'java', 'c'].forEach(lang => {
      let max = 0;
      ['classic_normal', 'classic_pro', 'builder_normal', 'builder_pro'].forEach(k => {
        const arr = completed[`${lang}_${k.split('_')[0]}_${k.split('_')[1]}`] || [];
        max = Math.max(max, arr.length);
      });
      langLevels[lang] = max;
    });

    const totalLevels = Object.values(langLevels).reduce((a, b) => a + b, 0);
    const strongestLang = Object.entries(langLevels).sort((a, b) => b[1] - a[1])[0];

    panel.innerHTML = `
      <div class="be-pr-header">◈ YOUR PROGRESS REPORT</div>
      <div class="be-pr-grid">
        <div class="be-pr-stat"><div class="be-pr-val" style="color:#00d4ff">${d.score || 0}</div><div class="be-pr-lbl">TOTAL POINTS</div></div>
        <div class="be-pr-stat"><div class="be-pr-val" style="color:#39ff8f">${totalLevels}</div><div class="be-pr-lbl">LEVELS CLEARED</div></div>
        <div class="be-pr-stat"><div class="be-pr-val" style="color:#ffff00">${wordsTyped}</div><div class="be-pr-lbl">KEYWORDS HIT (session)</div></div>
        <div class="be-pr-stat"><div class="be-pr-val" style="color:#b57aff">${strongestLang ? strongestLang[0].toUpperCase() : '—'}</div><div class="be-pr-lbl">STRONGEST LANGUAGE</div></div>
      </div>
      <div class="be-pr-bars">
        ${['python', 'java', 'c'].map(lang => {
      const pct = Math.min(100, Math.round((langLevels[lang] / 6) * 100));
      const col = lang === 'python' ? '#39ff8f' : lang === 'java' ? '#00d4ff' : '#ff6b35';
      const icon = lang === 'python' ? '🐍' : lang === 'java' ? '☕' : '⚙';
      return `<div class="be-pr-bar-row">
            <span class="be-pr-bar-lbl">${icon} ${lang.toUpperCase()}</span>
            <div class="be-pr-bar-track"><div class="be-pr-bar-fill" style="width:${pct}%;background:${col}"></div></div>
            <span class="be-pr-bar-pct" style="color:${col}">${langLevels[lang]}/6</span>
          </div>`;
    }).join('')}
      </div>
      <div class="be-pr-rank" style="border-color:${d.rank?.color || '#4a6080'}">
        <span style="font-size:20px">${d.rank?.icon || '⬡'}</span>
        <div>
          <div style="font-family:'Orbitron',monospace;font-size:11px;font-weight:700;color:${d.rank?.color || '#fff'}">${d.rank?.name?.toUpperCase() || 'RECRUIT'}</div>
          <div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(255,255,255,0.4);margin-top:2px;">Global Rank</div>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  #11 — GUIDED FIRST MISSION ONBOARDING TUTORIAL
  // ═══════════════════════════════════════════════════════════════════════════
  const TUTORIAL_STEPS = [
    {
      title: 'WELCOME, DEFENDER', icon: '🛡',
      body: 'CodeDefender teaches you real programming by making you <strong>type actual code keywords</strong> to destroy enemies. Before your first mission, let\'s walk through the controls together.',
      action: 'Next →', final: false
    },
    {
      title: 'STEP 1 — TYPE TO DESTROY', icon: '⌨',
      body: 'Words fall from the top of the screen. <strong>Type exactly what you see</strong> and your ship automatically fires. Try to destroy them before they reach the red line at the bottom.',
      action: 'Got it →', final: false
    },
    {
      title: 'STEP 2 — RED WORDS ARE BUGS', icon: '🔴',
      body: '<span style="color:#ff6060;font-weight:700">Red/glowing words</span> have a typo or are missing a keyword. The hint tells you what to type instead. These are the most educational moments — <strong>you\'re literally debugging code</strong>.',
      action: 'Got it →', final: false
    },
    {
      title: 'STEP 3 — BLANK WORDS', icon: '🔍',
      body: 'Words showing <code>____</code> mean "fill in the blank". The hint tells you what goes there. For example: <code>_____ ("Hello")</code> with hint <em>[Output function]</em> → type <code>print</code>.',
      action: 'Got it →', final: false
    },
    {
      title: 'STEP 4 — PICK YOUR START', icon: '🎯',
      body: 'Choose <strong>Classic Mode</strong> to learn keywords by typing them. Choose <strong>Code Builder</strong> to reconstruct full lines of real code. Start with <strong>Classic → Normal → Python</strong> if you\'ve never coded before.',
      action: 'START MY FIRST MISSION →', final: true
    },
  ];

  function checkAndShowTutorial(username) {
    const key = `cd_tutorial_${username}`;
    if (localStorage.getItem(key)) return; // already seen
    BE.tutorialDone = false;
    BE.tutorialStep = 0;
    showTutorialStep(0);
  }

  function showTutorialStep(step) {
    const ov = document.getElementById('be-tutorial-overlay');
    if (!ov) return;
    const s = TUTORIAL_STEPS[step];
    if (!s) { closeTutorial(); return; }
    ov.querySelector('.be-tut-icon').textContent = s.icon;
    ov.querySelector('.be-tut-title').textContent = s.title;
    ov.querySelector('.be-tut-body').innerHTML = s.body;
    ov.querySelector('.be-tut-btn').textContent = s.action;
    ov.querySelector('.be-tut-progress').textContent = `${step + 1} / ${TUTORIAL_STEPS.length}`;
    ov.classList.add('open');
    ov.querySelector('.be-tut-btn').onclick = () => {
      if (s.final) { closeTutorial(); }
      else { showTutorialStep(step + 1); }
    };
    ov.querySelector('.be-tut-skip').onclick = closeTutorial;
  }

  function closeTutorial() {
    const ov = document.getElementById('be-tutorial-overlay');
    if (ov) ov.classList.remove('open');
    BE.tutorialDone = true;
    if (window.GS?.username) {
      localStorage.setItem(`cd_tutorial_${window.GS.username}`, '1');
    }
  }
  window.BE_closeTutorial = closeTutorial;

  // Hook into checkSession / login to trigger tutorial for new users
  const _origCheckSession = window.checkSession;
  // We patch the goTo function to detect first login arrival at idle screen
  let _idleVisitCount = 0;
  const _origGoTo2 = window.goTo;
  window.goTo = function (id) {
    _origGoTo2?.call(this, id);
    if (id === 'screen-idle') {
      _idleVisitCount++;
      if (_idleVisitCount === 1 && window.GS?.username) {
        // Small delay to let the idle screen render first
        setTimeout(() => checkAndShowTutorial(window.GS.username), 600);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  #12 — "SEE IT IN THE WILD" — Real-world code examples
  // ═══════════════════════════════════════════════════════════════════════════
  const WILD_EXAMPLES = {
    python: {
      1: {
        title: 'Hello World Program', desc: 'The very first program every developer writes.',
        code: `# Your first complete Python program
name = input("What is your name? ")
print("Hello, " + name + "!")
print("Welcome to programming!")`,
        note: 'input() pauses the program. print() shows text. Together they make your program interactive.'
      },
      2: {
        title: 'Number Guessing Game', desc: 'Uses if/elif/else + a while loop — exactly what you just learned.',
        code: `import random
secret = random.randint(1, 10)
while True:
    guess = int(input("Guess (1-10): "))
    if guess == secret:
        print("Correct! You got it!")
        break
    elif guess < secret:
        print("Too low!")
    else:
        print("Too high!")`,
        note: 'This is a complete, real game. It uses if/elif/else and while — both from Level 2.'
      },
      3: {
        title: 'Shopping List App', desc: 'Uses lists and dictionaries — Level 3 concepts.',
        code: `shopping = {}
while True:
    item = input("Add item (or 'done'): ")
    if item == "done":
        break
    qty = int(input(f"How many {item}? "))
    shopping[item] = qty

print("\\nYour list:")
for item, qty in shopping.items():
    print(f"  {qty}x {item}")`,
        note: 'A real shopping list. The dict maps items to quantities. The for loop prints each one.'
      },
      4: {
        title: 'Temperature Converter', desc: 'Uses functions — exactly what Level 4 teaches.',
        code: `def celsius_to_fahrenheit(c):
    return (c * 9/5) + 32

def fahrenheit_to_celsius(f):
    return (f - 32) * 5/9

temp = float(input("Enter temperature: "))
unit = input("C or F? ").upper()

if unit == "C":
    print(f"{temp}°C = {celsius_to_fahrenheit(temp):.1f}°F")
else:
    print(f"{temp}°F = {fahrenheit_to_celsius(temp):.1f}°C")`,
        note: 'Two functions, each doing one job. This is how real tools are structured.'
      },
      5: {
        title: 'Dice Roller with Random', desc: 'Uses import random — what Level 5 is all about.',
        code: `import random

def roll_dice(sides=6):
    return random.randint(1, sides)

rolls = []
for i in range(5):
    result = roll_dice()
    rolls.append(result)
    print(f"Roll {i+1}: {result}")

print(f"\\nTotal: {sum(rolls)}")
print(f"Average: {sum(rolls)/len(rolls):.1f}")`,
        note: 'import random gives you a professional-grade random number generator in one line.'
      },
      6: {
        title: 'Complete Quiz App', desc: 'Everything combined — the shape of a real program.',
        code: `import random

questions = [
    ("What does print() do?", "outputs text"),
    ("What is a list?", "ordered collection"),
    ("What does input() do?", "reads user input"),
]

random.shuffle(questions)
score = 0

for q, a in questions:
    answer = input(q + " ").lower().strip()
    if answer == a:
        print("✓ Correct!")
        score += 1
    else:
        print(f"✗ Answer was: {a}")

print(f"\\nFinal: {score}/{len(questions)}")`,
        note: 'This is a real quiz app using every concept from all 6 Python levels.'
      },
    },
    java: {
      1: {
        title: 'Type Declarations', desc: 'Java requires explicit types — here\'s why that catches bugs.',
        code: `public class TypeDemo {
    public static void main(String[] args) {
        int age = 25;           // whole number
        double height = 1.75;   // decimal
        String name = "Alex";   // text
        boolean active = true;  // yes/no

        System.out.println("Name: " + name);
        System.out.println("Age: " + age);
        System.out.println("Height: " + height + "m");
    }
}`,
        note: 'Java catches type errors before your program runs. This prevents an entire class of bugs.'
      },
      2: {
        title: 'Access Control in Action', desc: 'Why public/private matters in a real class.',
        code: `public class BankAccount {
    private double balance;  // nobody outside can touch this directly

    public BankAccount(double initial) {
        this.balance = initial;
    }

    public void deposit(double amount) {
        if (amount > 0) balance += amount;  // controlled access
    }

    public double getBalance() {
        return balance;  // read-only exposure
    }
}`,
        note: 'private balance means no code outside this class can set balance to -1000000. Safety by design.'
      },
      3: {
        title: 'Flow Control — ATM Machine', desc: 'if/else/switch controlling a real system.',
        code: `int choice = 2;
switch (choice) {
    case 1:
        System.out.println("Check balance");
        break;
    case 2:
        System.out.println("Withdraw cash");
        break;
    case 3:
        System.out.println("Deposit money");
        break;
    default:
        System.out.println("Invalid option");
}`,
        note: 'ATMs, menus, game states — switch/case is everywhere in Java systems.'
      },
      4: {
        title: 'Objects — Dog Class', desc: 'class + new + this — Level 4 in action.',
        code: `public class Dog {
    private String name;
    private String breed;

    public Dog(String name, String breed) {
        this.name = name;
        this.breed = breed;
    }

    public void bark() {
        System.out.println(this.name + " says: Woof!");
    }
}

// In main:
Dog buddy = new Dog("Buddy", "Labrador");
Dog rex   = new Dog("Rex", "German Shepherd");
buddy.bark();
rex.bark();`,
        note: 'Two dogs, one blueprint. this.name refers to each dog\'s own name.'
      },
      5: {
        title: 'Exception Handling — File Reader', desc: 'try/catch preventing program crashes.',
        code: `import java.io.*;

public class SafeReader {
    public static void main(String[] args) {
        try {
            FileReader file = new FileReader("data.txt");
            System.out.println("File opened!");
            file.close();
        } catch (FileNotFoundException e) {
            System.out.println("File not found: " + e.getMessage());
        } finally {
            System.out.println("Always runs — clean up here.");
        }
    }
}`,
        note: 'Without try/catch, a missing file crashes the whole program. With it, you handle it gracefully.'
      },
      6: {
        title: 'Full Java Program — Student Grade Calculator', desc: 'All concepts together.',
        code: `import java.util.Scanner;

public class GradeCalculator {
    private static String getGrade(int score) {
        if (score >= 90) return "A";
        else if (score >= 80) return "B";
        else if (score >= 70) return "C";
        else return "F";
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] scores = new int[3];
        int total = 0;

        for (int i = 0; i < 3; i++) {
            System.out.print("Enter score " + (i+1) + ": ");
            scores[i] = sc.nextInt();
            total += scores[i];
        }

        int avg = total / scores.length;
        System.out.println("Average: " + avg + " — Grade: " + getGrade(avg));
    }
}`,
        note: 'A real grade calculator: classes, methods, arrays, loops, conditionals, I/O — all at once.'
      },
    },
    c: {
      1: {
        title: 'Types and Memory Sizes', desc: 'Why C types have exact byte sizes.',
        code: `#include <stdio.h>

int main() {
    int    age    = 25;           // 4 bytes
    char   grade  = 'A';         // 1 byte
    float  gpa    = 3.75;        // 4 bytes
    double pi     = 3.14159265;  // 8 bytes

    printf("int   = %d bytes\\n", (int)sizeof(int));
    printf("char  = %d bytes\\n", (int)sizeof(char));
    printf("float = %d bytes\\n", (int)sizeof(float));
    printf("double= %d bytes\\n", (int)sizeof(double));

    printf("Age: %d, Grade: %c, GPA: %.2f\\n", age, grade, gpa);
    return 0;
}`,
        note: 'sizeof tells you exactly how much RAM each type uses. On hardware with 2KB of RAM, this matters enormously.'
      },
      2: {
        title: 'Preprocessor in Action', desc: '#include and #define transforming code before compilation.',
        code: `#include <stdio.h>
#define MAX_STUDENTS 30
#define PASS_MARK 50

int main() {
    int scores[MAX_STUDENTS];
    int passing = 0;

    // Simulate filling scores
    for (int i = 0; i < MAX_STUDENTS; i++) {
        scores[i] = 40 + (i * 2);  // 40, 42, 44...
        if (scores[i] >= PASS_MARK) passing++;
    }

    printf("Students passing: %d / %d\\n", passing, MAX_STUDENTS);
    return 0;
}`,
        note: '#define MAX_STUDENTS 30 means you change one line and it updates everywhere in your code.'
      },
      3: {
        title: 'Pointers — The Most Important C Concept', desc: 'What they are and why they exist.',
        code: `#include <stdio.h>

void doubleValue(int *ptr) {  // receives an address
    *ptr = *ptr * 2;           // modifies what's AT that address
}

int main() {
    int x = 10;
    printf("Before: %d\\n", x);

    doubleValue(&x);            // pass the ADDRESS of x

    printf("After:  %d\\n", x); // x is now 20!
    return 0;
}`,
        note: 'Without pointers, doubleValue would modify a copy and x stays 10. With pointers, the real x is doubled.'
      },
      4: {
        title: 'printf and scanf — C I/O in depth', desc: 'Format codes in real use.',
        code: `#include <stdio.h>

int main() {
    char name[50];
    int age;
    float height;

    printf("Enter your name: ");
    fgets(name, 50, stdin);    // safe string input

    printf("Enter your age: ");
    scanf("%d", &age);         // %d = integer, & = address

    printf("Enter height (m): ");
    scanf("%f", &height);      // %f = float

    printf("\\nHello %s", name);
    printf("Age: %d, Height: %.2f m\\n", age, height);
    return 0;
}`,
        note: '%d, %f, %s are the core format codes. & gives scanf the address to store the value.'
      },
      5: {
        title: 'Dynamic Memory — malloc and free', desc: 'Manual memory management done correctly.',
        code: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int n = 5;

    // Allocate memory for 5 integers
    int *arr = (int*)malloc(n * sizeof(int));
    if (arr == NULL) {
        printf("Memory allocation failed!\\n");
        return 1;
    }

    // Fill and print
    for (int i = 0; i < n; i++) {
        arr[i] = (i + 1) * 10;  // 10, 20, 30, 40, 50
        printf("arr[%d] = %d\\n", i, arr[i]);
    }

    free(arr);  // ALWAYS free what you malloc
    return 0;
}`,
        note: 'malloc gives you a block of memory. free gives it back. Forget free = memory leak. Double free = crash.'
      },
      6: {
        title: 'Full C Program — Student Records with Struct', desc: 'Everything combined.',
        code: `#include <stdio.h>
#include <string.h>

#define MAX 3

struct Student {
    char name[50];
    int  score;
};

void printStudent(struct Student s) {
    printf("  %s: %d%%\\n", s.name, s.score);
}

int main() {
    struct Student students[MAX];

    // Hard-coded data
    strcpy(students[0].name, "Alice"); students[0].score = 92;
    strcpy(students[1].name, "Bob");   students[1].score = 78;
    strcpy(students[2].name, "Cara");  students[2].score = 85;

    printf("Student Records:\\n");
    for (int i = 0; i < MAX; i++) {
        printStudent(students[i]);
    }
    return 0;
}`,
        note: 'struct groups name+score into one type. The for loop processes all records. This is how real C databases begin.'
      },
    },
  };

  function showWildExample(lang, lvl) {
    const ex = WILD_EXAMPLES[lang]?.[lvl];
    const panel = document.getElementById('be-wild-panel');
    if (!panel || !ex) return;
    panel.querySelector('.be-wild-title').textContent = ex.title;
    panel.querySelector('.be-wild-desc').textContent = ex.desc;
    panel.querySelector('.be-wild-code').textContent = ex.code;
    panel.querySelector('.be-wild-note').textContent = '💡 ' + ex.note;
    panel.classList.add('open');
  }
  window.BE_showWild = showWildExample;

  // ═══════════════════════════════════════════════════════════════════════════
  //  #2 — SANDBOX TERMINAL (Piston API — free, no key needed)
  //  Supports: Python 3.10, Java 15, C (gcc 10)
  // ═══════════════════════════════════════════════════════════════════════════
  const SANDBOX_LANGS = {
    python: {
      pistonLang: 'python',
      pistonVer: '3.10.0',
      placeholder: `# Python 3.10 — write any code and click RUN\nname = input("Your name: ")\nprint(f"Hello, {name}! Welcome to CodeDefender.")`,
      color: '#39ff8f',
      label: '🐍 Python',
    },
    java: {
      pistonLang: 'java',
      pistonVer: '15.0.2',
      placeholder: `// Java 15 — must have a public class Main with main()\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n        int x = 42;\n        System.out.println("The answer is: " + x);\n    }\n}`,
      color: '#ff8c00',
      label: '☕ Java',
    },
    c: {
      pistonLang: 'c',
      pistonVer: '10.2.0',
      placeholder: `// C (gcc 10) — standard C program\n#include <stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n    int x = 42;\n    printf("The answer is: %d\\n", x);\n    return 0;\n}`,
      color: '#00d4ff',
      label: '⚙ C-Lang',
    },
  };
  let sandboxLang = 'python';

  function switchSandboxLang(lang) {
    sandboxLang = lang;
    const cfg = SANDBOX_LANGS[lang];
    if (!cfg) return;
    // Update tab highlights
    document.querySelectorAll('.be-sb-lang-btn').forEach(b => {
      const active = b.dataset.lang === lang;
      b.style.borderColor = active ? cfg.color : 'rgba(255,255,255,0.12)';
      b.style.color = active ? cfg.color : 'rgba(255,255,255,0.35)';
      b.style.background = active ? `${cfg.color}12` : 'transparent';
    });
    // Update subtitle
    const sub = document.querySelector('.be-sb-sub');
    if (sub) sub.textContent = `${cfg.label.toUpperCase()} · RUNS INSTANTLY IN THE CLOUD · NO LOGIN NEEDED`;
    // Update textarea placeholder (and clear if it shows another language's code)
    const ta = document.getElementById('be-sandbox-code');
    if (ta) {
      const isStillDefault = Object.values(SANDBOX_LANGS).some(c => ta.value === c.placeholder);
      if (!ta.value.trim() || isStillDefault) {
        ta.value = '';
        ta.placeholder = cfg.placeholder;
      }
    }
    // Update output
    const out = document.getElementById('be-sandbox-output');
    if (out) { out.textContent = '← Output appears here after running'; out.style.color = `${cfg.color}80`; }
    // Reset run button
    const btn = document.getElementById('be-sandbox-run-btn');
    if (btn) { btn.style.borderColor = `${cfg.color}80`; btn.style.color = cfg.color; btn.style.background = `${cfg.color}12`; }
  }
  window.BE_switchSandboxLang = switchSandboxLang;

  async function runSandboxCode() {
    const ta = document.getElementById('be-sandbox-code');
    const out = document.getElementById('be-sandbox-output');
    const btn = document.getElementById('be-sandbox-run-btn');
    if (!ta || !out || !btn) return;
    const code = ta.value.trim();
    if (!code) return;
    const cfg = SANDBOX_LANGS[sandboxLang] || SANDBOX_LANGS.python;
    btn.textContent = '⏳ RUNNING...';
    btn.disabled = true;
    out.textContent = '⚡ Running locally...';
    out.style.color = 'rgba(255,255,100,0.7)';
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: cfg.pistonLang,
          code: code
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const stdout = data.stdout || '';
      const stderr = data.stderr || '';
      const compileErr = data.compileErr || '';

      if (compileErr) {
        out.textContent = '⚠ COMPILE ERROR:\n' + compileErr;
        out.style.color = '#ff6060';
      } else {
        out.textContent = (stdout + (stderr ? '\n⚠ STDERR:\n' + stderr : '')) || '(no output)';
        out.style.color = stderr && !stdout ? '#ff6060' : cfg.color;
      }
    } catch (e) {
      out.textContent = '⚠ Could not execute code via local backend.\n\nError: ' + e.message;
      out.style.color = '#ff6060';
    }
    btn.textContent = '▶ RUN CODE';
    btn.disabled = false;
  }
  window.BE_runSandbox = runSandboxCode;

  // ═══════════════════════════════════════════════════════════════════════════
  //  CHEAT SHEET (Rookie Mode sidebar)
  // ═══════════════════════════════════════════════════════════════════════════
  function buildCheatsheet(lang, lvl) {
    const cs = document.getElementById('be-cheatsheet');
    if (!cs) return;
    const b = window.NX ? null : null;
    // Use NEXUS BRIEFS if available
    const briefs = {
      python: {
        1: ['print', 'input', 'str', 'int', 'float'], 2: ['if', 'elif', 'else', 'for', 'while', 'break'],
        3: ['list', 'dict', 'append', 'len', 'range'], 4: ['def', 'return', 'class'],
        5: ['import', 'random'], 6: []
      },
      java: {
        1: ['int', 'double', 'void', 'boolean', 'char'], 2: ['public', 'private', 'static', 'final'],
        3: ['if', 'else', 'for', 'while', 'switch'], 4: ['class', 'new', 'this', 'super'],
        5: ['try', 'catch', 'throw', 'finally'], 6: []
      },
      c: {
        1: ['int', 'char', 'float', 'double', 'void'], 2: ['#include', '#define', 'main', 'return'],
        3: ['struct', 'sizeof', 'null', 'malloc', 'free'], 4: ['printf', 'scanf', 'puts', 'fgets'],
        5: ['malloc', 'free', 'calloc', 'realloc'], 6: []
      },
    };
    const kws = briefs[lang]?.[lvl] || [];
    cs.innerHTML = `<div class="be-cs-header">📋 LEVEL ${lvl} KEYWORDS</div>` +
      kws.map(k => {
        const d = BE_GLOSSARY[k];
        return `<div class="be-cs-row"><code class="be-cs-kw">${k}</code><span class="be-cs-def">${d ? d.what : ''}</span></div>`;
      }).join('') +
      `<div class="be-cs-tip">Rookie Mode — no penalties</div>`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CSS INJECTION
  // ═══════════════════════════════════════════════════════════════════════════
  function injectBECSS() {
    const s = document.createElement('style');
    s.textContent = `
/* ── BEGINNER ENGINE GLOBAL ─────────────────────────────────────── */
.be-overlay{position:fixed;inset:0;z-index:1100;display:flex;align-items:center;justify-content:center;pointer-events:none;}
.be-overlay.open{pointer-events:all;}
.be-card{background:rgba(2,3,14,0.97);border:1px solid #00d4ff;border-radius:4px;padding:28px 32px;max-width:560px;width:90%;font-family:'Share Tech Mono',monospace;transform:translateY(30px);opacity:0;transition:all 0.3s ease;pointer-events:all;}
.be-overlay.open .be-card{transform:translateY(0);opacity:1;}

/* ── #3 WHY CARD ─────────────────────────────────────────────────── */
#be-why-overlay{position:fixed;inset:0;z-index:1050;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);pointer-events:none;transition:opacity 0.3s;}
#be-why-overlay.open{pointer-events:all;opacity:1;}
#be-why-overlay:not(.open){opacity:0;}
.be-why-inner{background:rgba(2,3,14,0.98);border:1px solid #00d4ff;border-radius:4px;padding:28px 32px;max-width:580px;width:90%;font-family:'Share Tech Mono',monospace;transform:scale(0.92);opacity:0;transition:all 0.35s ease;}
#be-why-overlay.open .be-why-inner{transform:scale(1);opacity:1;}
.be-why-icon{font-size:36px;text-align:center;display:block;margin-bottom:12px;}
.be-why-title{font-family:'Orbitron',monospace;font-size:14px;font-weight:700;letter-spacing:3px;margin-bottom:14px;display:block;}
.be-why-body{font-size:11px;color:rgba(200,220,240,0.9);line-height:1.9;margin-bottom:12px;}
.be-why-body code{color:#00d4ff;background:rgba(0,212,255,0.08);padding:1px 5px;border-radius:2px;}
.be-why-analogy{font-size:11px;color:rgba(200,220,240,0.65);line-height:1.7;padding:10px 14px;background:rgba(255,255,255,0.03);border-left:2px solid rgba(0,212,255,0.3);margin-bottom:18px;}
.be-why-btn{font-family:'Orbitron',monospace;font-size:9px;font-weight:700;letter-spacing:3px;padding:10px 24px;background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.5);color:#00d4ff;cursor:pointer;transition:all 0.2s;border-radius:2px;}
.be-why-btn:hover{background:rgba(0,212,255,0.15);}

/* ── #4 ROOKIE MODE ──────────────────────────────────────────────── */
#be-rookie-badge{display:none;position:fixed;top:58px;right:20px;z-index:1000;font-family:'Orbitron',monospace;font-size:8px;font-weight:700;letter-spacing:3px;padding:5px 12px;background:rgba(57,255,143,0.1);border:1px solid rgba(57,255,143,0.5);color:#39ff8f;border-radius:2px;}
#be-cheatsheet{display:none;position:absolute;right:10px;top:50px;z-index:990;width:200px;background:rgba(2,3,14,0.95);border:1px solid rgba(0,212,255,0.2);border-radius:3px;padding:10px 12px;font-family:'Share Tech Mono',monospace;}
.be-cs-header{font-size:8px;letter-spacing:2px;color:rgba(0,212,255,0.6);margin-bottom:8px;}
.be-cs-row{display:flex;gap:6px;align-items:baseline;margin-bottom:4px;}
.be-cs-kw{font-size:10px;color:#00d4ff;min-width:70px;flex-shrink:0;}
.be-cs-def{font-size:8px;color:rgba(255,255,255,0.45);line-height:1.4;}
.be-cs-tip{font-size:8px;color:#39ff8f;margin-top:8px;letter-spacing:1px;}

/* ── #6 ROADMAP MODAL ────────────────────────────────────────────── */
#be-roadmap-modal{position:fixed;inset:0;z-index:1080;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);pointer-events:none;opacity:0;transition:opacity 0.3s;}
#be-roadmap-modal.open{pointer-events:all;opacity:1;}
.be-roadmap-box{background:rgba(2,3,14,0.98);border:1px solid rgba(0,212,255,0.3);border-radius:4px;padding:32px 40px;width:min(900px,95vw);font-family:'Share Tech Mono',monospace;position:relative;max-height:90vh;overflow-y:auto;}
.be-roadmap-hd{font-family:'Orbitron',monospace;font-size:15px;font-weight:700;letter-spacing:3px;color:#00d4ff;margin-bottom:6px;}
.be-roadmap-sub{font-size:10px;color:rgba(0,212,255,0.5);letter-spacing:2px;margin-bottom:24px;}
#be-roadmap-svg{width:100%;overflow:visible;}
.be-roadmap-close{position:absolute;top:20px;right:25px;font-family:'Orbitron',monospace;font-size:9px;font-weight:700;letter-spacing:3px;padding:8px 20px;background:rgba(0,212,255,0.06);border:1px solid rgba(0,212,255,0.3);color:#00d4ff;cursor:pointer;border-radius:2px;transition:all 0.2s;}
.be-roadmap-close:hover{background:rgba(0,212,255,0.15);}

/* ── #7 MISTAKE CARD ──────────────────────────────────────────────── */
#be-mistake-card{position:fixed;bottom:160px;left:50%;transform:translateX(-50%) translateY(20px);z-index:1010;width:340px;background:rgba(2,3,14,0.97);border:1px solid rgba(255,96,96,0.5);border-radius:3px;padding:14px 18px;font-family:'Share Tech Mono',monospace;opacity:0;pointer-events:none;transition:all 0.3s ease;}
#be-mistake-card.show{opacity:1;transform:translateX(-50%) translateY(0);}
.be-mc-header{font-size:8px;letter-spacing:2px;color:#ff6060;margin-bottom:6px;}
.be-mc-kw{font-family:'Orbitron',monospace;font-size:14px;font-weight:700;color:#ff6060;display:block;margin-bottom:4px;}
.be-mc-what{font-size:10px;color:rgba(200,220,240,0.85);margin-bottom:5px;display:block;}
.be-mc-ex{font-size:9px;color:#39ff8f;background:rgba(57,255,143,0.06);padding:3px 7px;display:block;margin-bottom:5px;font-family:'Share Tech Mono',monospace;}
.be-mc-tip{font-size:9px;color:rgba(255,200,100,0.8);display:block;}

/* ── #10 PROGRESS REPORT ──────────────────────────────────────────── */
.be-pr-header{font-family:'Orbitron',monospace;font-size:10px;font-weight:700;letter-spacing:3px;color:#00d4ff;margin-bottom:16px;}
.be-pr-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;}
.be-pr-stat{background:rgba(0,212,255,0.04);border:1px solid rgba(0,212,255,0.12);border-radius:3px;padding:10px;text-align:center;}
.be-pr-val{font-family:'Orbitron',monospace;font-size:18px;font-weight:700;}
.be-pr-lbl{font-size:7px;letter-spacing:1.5px;color:rgba(200,220,240,0.4);margin-top:3px;}
.be-pr-bars{margin-bottom:14px;}
.be-pr-bar-row{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
.be-pr-bar-lbl{font-size:9px;width:90px;flex-shrink:0;letter-spacing:1px;}
.be-pr-bar-track{flex:1;height:5px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden;}
.be-pr-bar-fill{height:100%;border-radius:3px;transition:width 0.6s ease;}
.be-pr-bar-pct{font-size:9px;width:28px;text-align:right;}
.be-pr-rank{display:flex;align-items:center;gap:12px;padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.1);border-radius:3px;}

/* ── #11 TUTORIAL OVERLAY ──────────────────────────────────────────── */
#be-tutorial-overlay{position:fixed;inset:0;z-index:1200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);pointer-events:none;opacity:0;transition:opacity 0.4s;}
#be-tutorial-overlay.open{pointer-events:all;opacity:1;}
.be-tut-box{background:rgba(2,3,14,0.99);border:2px solid rgba(0,212,255,0.5);border-radius:6px;padding:36px 40px;max-width:560px;width:90%;font-family:'Share Tech Mono',monospace;text-align:center;}
.be-tut-icon{font-size:48px;display:block;margin-bottom:16px;}
.be-tut-title{font-family:'Orbitron',monospace;font-size:15px;font-weight:700;letter-spacing:4px;color:#00d4ff;display:block;margin-bottom:16px;}
.be-tut-body{font-size:11px;color:rgba(200,220,240,0.9);line-height:1.9;margin-bottom:20px;text-align:left;}
.be-tut-body strong{color:#00d4ff;}
.be-tut-body code{color:#39ff8f;background:rgba(57,255,143,0.08);padding:1px 6px;border-radius:2px;}
.be-tut-body em{color:#ffff00;}
.be-tut-footer{display:flex;justify-content:space-between;align-items:center;}
.be-tut-progress{font-size:9px;color:rgba(0,212,255,0.4);letter-spacing:2px;}
.be-tut-btn{font-family:'Orbitron',monospace;font-size:9px;font-weight:700;letter-spacing:3px;padding:11px 26px;background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.5);color:#00d4ff;cursor:pointer;border-radius:2px;transition:all 0.2s;}
.be-tut-btn:hover{background:rgba(0,212,255,0.2);}
.be-tut-skip{font-size:8px;color:rgba(255,255,255,0.25);cursor:pointer;letter-spacing:1px;background:none;border:none;}
.be-tut-skip:hover{color:rgba(255,255,255,0.5);}

/* ── #12 SEE IT IN THE WILD ────────────────────────────────────────── */
#be-wild-panel{position:fixed;inset:0;z-index:1090;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.88);pointer-events:none;opacity:0;transition:opacity 0.3s;}
#be-wild-panel.open{pointer-events:all;opacity:1;}
.be-wild-inner{background:rgba(2,3,14,0.99);border:1px solid rgba(57,255,143,0.3);border-radius:4px;padding:24px 28px;width:min(700px,95vw);max-height:85vh;overflow-y:auto;font-family:'Share Tech Mono',monospace;}
.be-wild-hd{font-family:'Orbitron',monospace;font-size:10px;font-weight:700;color:#39ff8f;letter-spacing:3px;margin-bottom:4px;}
.be-wild-title{font-family:'Orbitron',monospace;font-size:14px;font-weight:700;color:#fff;letter-spacing:2px;display:block;margin-bottom:4px;}
.be-wild-desc{font-size:10px;color:rgba(200,220,240,0.6);display:block;margin-bottom:16px;}
.be-wild-code{display:block;background:rgba(0,0,0,0.5);border:1px solid rgba(57,255,143,0.15);border-radius:3px;padding:16px;font-size:11px;color:#39ff8f;font-family:'Share Tech Mono',monospace;line-height:1.7;white-space:pre;overflow-x:auto;margin-bottom:12px;}
.be-wild-note{display:block;font-size:10px;color:rgba(255,200,100,0.85);padding:10px 14px;background:rgba(255,200,100,0.05);border-left:2px solid rgba(255,200,100,0.3);margin-bottom:16px;line-height:1.6;}
.be-wild-close{font-family:'Orbitron',monospace;font-size:9px;letter-spacing:3px;padding:8px 20px;background:rgba(57,255,143,0.06);border:1px solid rgba(57,255,143,0.3);color:#39ff8f;cursor:pointer;border-radius:2px;}

/* ── #2 SANDBOX TERMINAL ───────────────────────────────────────────── */
#be-sandbox-modal{position:fixed;inset:0;z-index:1080;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.88);pointer-events:none;opacity:0;transition:opacity 0.3s;}
#be-sandbox-modal.open{pointer-events:all;opacity:1;}
.be-sandbox-box{background:rgba(2,3,14,0.99);border:1px solid rgba(0,212,255,0.3);border-radius:4px;padding:24px;width:min(860px,96vw);font-family:'Share Tech Mono',monospace;}
.be-sb-hd{font-family:'Orbitron',monospace;font-size:12px;font-weight:700;color:#00d4ff;letter-spacing:3px;margin-bottom:4px;}
.be-sb-sub{font-size:9px;color:rgba(0,212,255,0.45);letter-spacing:1.5px;margin-bottom:10px;}
.be-sb-lang-bar{display:flex;gap:8px;margin-bottom:14px;}
.be-sb-lang-btn{font-family:'Orbitron',monospace;font-size:8px;font-weight:700;letter-spacing:2px;padding:5px 14px;background:transparent;border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.35);cursor:pointer;border-radius:2px;transition:all 0.2s;}
.be-sb-lang-btn:hover{border-color:rgba(0,212,255,0.4);color:rgba(0,212,255,0.8);}
.be-sandbox-split{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.be-sb-label{font-size:8px;letter-spacing:2px;color:rgba(0,212,255,0.5);margin-bottom:6px;}
#be-sandbox-code{width:100%;height:260px;background:rgba(0,0,0,0.5);border:1px solid rgba(0,212,255,0.2);border-radius:3px;color:#c8daf0;font-family:'Share Tech Mono',monospace;font-size:12px;padding:12px;resize:none;outline:none;box-sizing:border-box;line-height:1.6;tab-size:4;}
#be-sandbox-code:focus{border-color:rgba(0,212,255,0.5);box-shadow:0 0 12px rgba(0,212,255,0.05);}
#be-sandbox-output{height:260px;background:rgba(0,0,0,0.6);border:1px solid rgba(0,212,255,0.15);border-radius:3px;font-family:'Share Tech Mono',monospace;font-size:12px;padding:12px;overflow-y:auto;white-space:pre-wrap;box-sizing:border-box;line-height:1.6;}
.be-sb-actions{display:flex;gap:10px;margin-top:12px;align-items:center;flex-wrap:wrap;}
#be-sandbox-run-btn{font-family:'Orbitron',monospace;font-size:9px;font-weight:700;letter-spacing:3px;padding:10px 24px;background:rgba(57,255,143,0.1);border:1px solid rgba(57,255,143,0.5);color:#39ff8f;cursor:pointer;border-radius:2px;transition:all 0.2s;}
#be-sandbox-run-btn:hover:not(:disabled){background:rgba(57,255,143,0.2);box-shadow:0 0 12px rgba(57,255,143,0.15);}
#be-sandbox-run-btn:disabled{opacity:0.5;cursor:not-allowed;}
.be-sb-hint{font-size:9px;color:rgba(255,255,255,0.25);flex:1;}
.be-sb-clear{font-family:'Orbitron',monospace;font-size:8px;letter-spacing:2px;padding:8px 14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.3);cursor:pointer;border-radius:2px;}
.be-sb-close{font-family:'Orbitron',monospace;font-size:8px;letter-spacing:2px;padding:8px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.4);cursor:pointer;border-radius:2px;}
`;
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  DOM INJECTION
  // ═══════════════════════════════════════════════════════════════════════════
  function injectBEDOM() {
    // ── #3 Why Card overlay
    const why = document.createElement('div');
    why.id = 'be-why-overlay';
    why.innerHTML = `<div class="be-why-inner"><span class="be-why-icon">💡</span><span class="be-why-title"></span><div class="be-why-body"></div><div class="be-why-analogy"></div><button class="be-why-btn">▶ GOT IT — START MISSION</button></div>`;
    document.body.appendChild(why);

    // ── #4 Rookie badge
    const rb = document.createElement('div');
    rb.id = 'be-rookie-badge';
    rb.textContent = '🟢 ROOKIE MODE ACTIVE';
    document.body.appendChild(rb);

    // ── #4 Cheatsheet (inside game screen)
    const gs = document.getElementById('screen-game');
    if (gs) {
      const cs = document.createElement('div');
      cs.id = 'be-cheatsheet';
      gs.appendChild(cs);
    }

    // ── #6 Roadmap modal
    const rm = document.createElement('div');
    rm.id = 'be-roadmap-modal';
    rm.innerHTML = `<div class="be-roadmap-box">
      <button class="be-roadmap-close" onclick="document.getElementById('be-roadmap-modal').classList.remove('open')">✕ CLOSE MAP</button>
      <div class="be-roadmap-hd">🗺 LEARNING ROADMAP</div>
      <div class="be-roadmap-sub">CLICK ANY UNLOCKED NODE TO JUMP TO THAT LEVEL</div>
      <div id="be-roadmap-svg"></div>
    </div>`;
    document.body.appendChild(rm);

    // ── #7 Mistake card
    const mc = document.createElement('div');
    mc.id = 'be-mistake-card';
    mc.innerHTML = `<div class="be-mc-header">⚠ MISSED KEYWORD — LEARN IT</div><span class="be-mc-kw"></span><span class="be-mc-what"></span><span class="be-mc-ex"></span><span class="be-mc-tip"></span>`;
    document.body.appendChild(mc);

    // ── #10 Progress tab in profile modal
    const prof = document.getElementById('ownProfilePanel');
    if (prof) {
      const mb = prof.querySelector('.modal-body');
      if (mb) {
        const tab = document.createElement('div');
        tab.style.cssText = 'margin-top:20px;padding-top:16px;border-top:1px solid rgba(0,212,255,0.1);';
        tab.innerHTML = `<div id="be-progress-panel"><div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(0,212,255,0.4);">Loading progress...</div></div>`;
        mb.appendChild(tab);
      }
    }

    // ── #11 Tutorial overlay
    const tut = document.createElement('div');
    tut.id = 'be-tutorial-overlay';
    tut.innerHTML = `<div class="be-tut-box">
      <span class="be-tut-icon">🛡</span>
      <span class="be-tut-title">WELCOME</span>
      <div class="be-tut-body"></div>
      <div class="be-tut-footer">
        <button class="be-tut-skip" onclick="BE_closeTutorial()">skip tutorial</button>
        <span class="be-tut-progress">1 / 5</span>
        <button class="be-tut-btn">Next →</button>
      </div>
    </div>`;
    document.body.appendChild(tut);

    // ── #12 Wild examples panel
    const wp = document.createElement('div');
    wp.id = 'be-wild-panel';
    wp.innerHTML = `<div class="be-wild-inner">
      <div class="be-wild-hd">🌍 SEE IT IN THE WILD</div>
      <span class="be-wild-title"></span>
      <span class="be-wild-desc"></span>
      <code class="be-wild-code"></code>
      <span class="be-wild-note"></span>
      <button class="be-wild-close" onclick="document.getElementById('be-wild-panel').classList.remove('open')">✕ CLOSE</button>
    </div>`;
    document.body.appendChild(wp);

    // ── #2 Sandbox modal (Python + Java + C)
    const sb = document.createElement('div');
    sb.id = 'be-sandbox-modal';
    sb.innerHTML = `<div class="be-sandbox-box">
      <div class="be-sb-hd">🧪 SANDBOX TERMINAL</div>
      <div class="be-sb-sub">🐍 PYTHON · RUNS INSTANTLY IN THE CLOUD · NO LOGIN NEEDED</div>
      <div class="be-sb-lang-bar">
        <button class="be-sb-lang-btn" data-lang="python"
          style="border-color:#39ff8f;color:#39ff8f;background:rgba(57,255,143,0.08);"
          onclick="BE_switchSandboxLang('python')">🐍 Python</button>
        <button class="be-sb-lang-btn" data-lang="java"
          onclick="BE_switchSandboxLang('java')">☕ Java</button>
        <button class="be-sb-lang-btn" data-lang="c"
          onclick="BE_switchSandboxLang('c')">⚙ C-Lang</button>
      </div>
      <div class="be-sandbox-split">
        <div>
          <div class="be-sb-label">▸ YOUR CODE</div>
          <textarea id="be-sandbox-code" spellcheck="false" placeholder="# Write Python here and click RUN&#10;name = input('Your name: ')&#10;print('Hello, ' + name + '!')"></textarea>
        </div>
        <div>
          <div class="be-sb-label">▸ OUTPUT</div>
          <div id="be-sandbox-output" style="color:rgba(57,255,143,0.5)">← Output appears here after running</div>
        </div>
      </div>
      <div class="be-sb-actions">
        <button id="be-sandbox-run-btn" onclick="BE_runSandbox()">▶ RUN CODE</button>
        <span class="be-sb-hint">Powered by Piston API · Python 3.10 / Java 15 / C gcc · Free, no key required</span>
        <button class="be-sb-clear" onclick="document.getElementById('be-sandbox-code').value='';document.getElementById('be-sandbox-output').textContent='← Output appears here after running';">⌫ CLEAR</button>
        <button class="be-sb-close" onclick="document.getElementById('be-sandbox-modal').classList.remove('open')">✕ CLOSE</button>
      </div>
    </div>`;
    document.body.appendChild(sb);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  PATCH NEXUS BRIEFING to add "WHY?" button and "SEE IN WILD" to vault
  // ═══════════════════════════════════════════════════════════════════════════
  function patchNexus() {
    // Patch showBriefing to add WHY? button
    const origBrief = window.NX?.brief;
    if (origBrief) {
      window.NX.brief = function (lvl, onClose) {
        origBrief(lvl, () => {
          // After briefing closes, offer WHY card
          const lang = window.GS?.language || 'python';
          if (WHY_CARDS[lang]?.[lvl]) {
            showWhyCard(lang, lvl, onClose);
          } else {
            if (onClose) onClose();
          }
        });
      };
    }

    // Patch apiStartGame to ensure rookie mode toggles correctly
    const origStartGame = window.apiStartGame;
    if (origStartGame) {
      window.apiStartGame = async function (lang, reqLevel = null) {
        console.log("⚡ ENGINE: window.apiStartGame (patched) called with arg:", lang);
        // Evaluate Rookie state before starting
        if (window.GS && window.GS.difficulty === 'rookie') {
          toggleRookieMode(true);
        } else {
          toggleRookieMode(false);
        }
        return origStartGame.call(this, lang, reqLevel);
      };
    }

    // Patch showVault (NX.vault) to add "See It In The Wild" button
    const origVault = window.NX?.vault;
    if (origVault) {
      window.NX.vault = function (lvl) {
        origVault(lvl);
        const vault = document.getElementById('nx-vault');
        if (!vault) return;
        const lang = window.GS?.language || 'python';
        // Remove previous wild btn if exists
        const prev = vault.querySelector('.be-wild-vault-btn');
        if (prev) prev.remove();
        if (WILD_EXAMPLES[lang]?.[lvl]) {
          const btn = document.createElement('button');
          btn.className = 'be-wild-vault-btn nx-vclose';
          btn.textContent = '🌍 SEE IT IN THE WILD';
          btn.style.cssText = 'margin-left:10px;border-color:rgba(57,255,143,0.4);color:#39ff8f;';
          btn.onclick = () => {
            vault.classList.remove('open');
            setTimeout(() => showWildExample(lang, lvl), 300);
          };
          vault.querySelector('.nx-vi')?.appendChild(btn);
        }
        // Add progress report refresh
        fetchProgressReport();
      };
    }

    // Attach breach watcher after a short delay to ensure gameCanvas exists
    setTimeout(attachBreachWatcher, 1000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════════════════════════════════════
  function initBE() {
    injectBECSS();
    injectBEDOM();
    patchNexus();
    // Set sandbox initial placeholder
    setTimeout(() => {
      const ta = document.getElementById('be-sandbox-code');
      if (ta && !ta.value) ta.placeholder = SANDBOX_LANGS.python.placeholder;
    }, 500);
    // Initial progress render
    setTimeout(fetchProgressReport, 2000);
    console.log('%c🎓 BEGINNER ENGINE v2.0 — ALL SYSTEMS ACTIVE (Python + Java + C)', 'color:#39ff8f;font-size:11px;font-weight:bold;background:#02030a;padding:3px 8px;');
  }

})();
