// ═══════════════════════════════════════════════════════════════════════════
//  NEXUS: COMBAT-DEBUGGER — Complete Learning Engine v2.0
//  Load AFTER game.js. Zero modifications to existing files needed.
//  Adds: ConceptTooltips, BriefingRoom, KnowledgeVault, MistakeTracker,
//        WeaponSystem, BulletTime, Ultimates, EnemyVariants, ScreenFX,
//        Bottom-Left HUD, Points in all modals.
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  function waitForGS(cb) {
    if (window.GS && window.spawnWords && window.finishDestroyWord) { cb(); return; }
    setTimeout(() => waitForGS(cb), 200);
  }
  waitForGS(initNexus);

  // ═══ CONCEPT DATABASE ════════════════════════════════════════════════════
  const DB = {
    'print':    { what:'Outputs text to the screen.',          example:'print("Hello, World!")',    cat:'I/O',       tip:'Your program\'s voice to the user.' },
    'input':    { what:'Reads text typed by the user.',        example:'name = input("Name? ")',    cat:'I/O',       tip:'Pauses program, waits for human.' },
    'int':      { what:'Converts to a whole number.',          example:'int("5") → 5',              cat:'Type',      tip:'No decimals allowed.' },
    'float':    { what:'Converts to a decimal number.',        example:'float("3.14") → 3.14',      cat:'Type',      tip:'Use when precision matters.' },
    'str':      { what:'Converts to text.',                    example:'str(42) → "42"',            cat:'Type',      tip:'Wraps anything in quotes.' },
    'bool':     { what:'A True or False value.',               example:'bool(0) → False',           cat:'Type',      tip:'The foundation of all logic.' },
    'list':     { what:'An ordered, changeable collection.',   example:'items = [1, 2, 3]',         cat:'Structure', tip:'Like a numbered drawer set.' },
    'dict':     { what:'Key-value pairs, like a real dictionary.',example:'d = {"name": "Ali"}',   cat:'Structure', tip:'Look things up by a label.' },
    'if':       { what:'Runs code only when condition is True.',example:'if x > 0:\n    print(x)', cat:'Logic',     tip:'The fork in the road.' },
    'elif':     { what:'"Else if" — another condition to check.', example:'elif x == 0:',          cat:'Logic',     tip:'Only checks if the if above failed.' },
    'else':     { what:'Runs when ALL if/elif conditions failed.',example:'else:\n    print("no")',cat:'Logic',     tip:'The catch-all safety net.' },
    'for':      { what:'Repeats for each item in a sequence.',  example:'for i in range(3):',       cat:'Loop',      tip:'Visits every item, one by one.' },
    'while':    { what:'Repeats AS LONG AS condition is True.', example:'while x < 10:\n    x+=1', cat:'Loop',      tip:'Keeps going until told to stop.' },
    'break':    { what:'Exits the loop immediately.',           example:'if x==5: break',           cat:'Loop',      tip:'Emergency exit from any loop.' },
    'continue': { what:'Skips the rest of this loop cycle.',   example:'if x==0: continue',        cat:'Loop',      tip:'Jump to the next iteration.' },
    'def':      { what:'Defines a reusable function.',          example:'def greet(name):\n    return "Hi " + name', cat:'Function', tip:'Write once, call anywhere.' },
    'return':   { what:'Sends a value back from a function.',   example:'return x * 2',            cat:'Function',  tip:'The function\'s final answer.' },
    'class':    { what:'A blueprint for creating objects.',     example:'class Dog:\n    pass',     cat:'OOP',       tip:'Like a cookie cutter for objects.' },
    'import':   { what:'Loads an external library of tools.',   example:'import random',            cat:'Module',    tip:'Never reinvent the wheel.' },
    'random':   { what:'Library for generating random values.', example:'random.randint(1, 10)',    cat:'Module',    tip:'Chaos, on demand.' },
    'append':   { what:'Adds an item to the end of a list.',    example:'items.append("milk")',     cat:'Structure', tip:'Push something new into the list.' },
    'range':    { what:'Generates a sequence of numbers.',      example:'range(5) → 0,1,2,3,4',    cat:'Loop',      tip:'The loop counting machine.' },
    'len':      { what:'Returns the number of items in something.',example:'len([1,2,3]) → 3',     cat:'Built-in',  tip:'How big is this collection?' },
    'None':     { what:'Represents "nothing" or "no value".',   example:'x = None',                cat:'Type',      tip:'The intentional absence of data.' },
    'True':     { what:'The boolean value for yes/on.',         example:'if True: print("always")',cat:'Logic',     tip:'Always evaluates as truthy.' },
    'False':    { what:'The boolean value for no/off.',         example:'x = False',               cat:'Logic',     tip:'Always evaluates as falsy.' },
    'public':   { what:'Anyone can access this member.',        example:'public void run()',        cat:'Access',    tip:'No restrictions on this door.' },
    'private':  { what:'Only THIS class can access it.',        example:'private int age;',         cat:'Access',    tip:'Protected from outside interference.' },
    'static':   { what:'Belongs to the class, not an object.',  example:'static int count = 0;',   cat:'OOP',       tip:'Shared by all instances.' },
    'void':     { what:'This function returns nothing.',        example:'void printHi()',           cat:'Type',      tip:'No output — pure side effect.' },
    'new':      { what:'Creates a new object from a class.',    example:'Dog d = new Dog();',       cat:'OOP',       tip:'Stamps a new instance from the blueprint.' },
    'this':     { what:'Refers to the current object.',         example:'this.name = name;',        cat:'OOP',       tip:'"The object I am right now."' },
    'super':    { what:'Refers to the parent class.',           example:'super.greet();',           cat:'OOP',       tip:'Asks your parent class for help.' },
    'try':      { what:'Attempts code that might fail.',        example:'try { parseInt("x"); }',   cat:'Error',     tip:'Wrap risky code in here.' },
    'catch':    { what:'Handles the error if try fails.',       example:'catch(Exception e)',       cat:'Error',     tip:'The safety net below the trapeze.' },
    'printf':   { what:'Prints formatted text to screen.',      example:'printf("Hi %s\\n", name)',  cat:'I/O',       tip:'%s=string, %d=int, %f=float.' },
    'scanf':    { what:'Reads formatted input from user.',      example:'scanf("%d", &x);',          cat:'I/O',       tip:'The & means "address of". C needs it.' },
    'malloc':   { what:'Requests a block of memory.',           example:'malloc(sizeof(int)*5)',      cat:'Memory',   tip:'You own this memory — free it later.' },
    'free':     { what:'Returns allocated memory back.',        example:'free(ptr);',                cat:'Memory',   tip:'Forgetting this = memory leak.' },
    'struct':   { what:'Groups related data into one type.',    example:'struct Point { int x,y; }', cat:'Structure', tip:'Pre-OOP bundling of related data.' },
    'sizeof':   { what:'Returns the byte size of a type.',      example:'sizeof(int) → 4',           cat:'Memory',   tip:'How much RAM does this consume?' },
    'null':     { what:'A pointer that points to nothing.',     example:'int *p = NULL;',             cat:'Memory',   tip:'The empty address. Dereference = crash.' },
    'result':   { what:'A variable storing a computed value.',  example:'result = a + b',             cat:'Variable', tip:'Name your answers clearly.' },
    'score':    { what:'A variable tracking a running count.',  example:'score += 1',                 cat:'Variable', tip:'Accumulate, track, compare.' },
    'tasks':    { what:'A list for storing task items.',        example:'tasks = []',                 cat:'Structure', tip:'An empty list ready to fill.' },
    'contacts': { what:'A dict mapping names to values.',       example:'contacts = {}',              cat:'Structure', tip:'Empty dict, ready for entries.' },
  };

  const CAT_WEAPON = {
    'I/O':'sniper','Function':'sniper','Module':'sniper','Error':'sniper',
    'Logic':'fixer','Loop':'fixer','Access':'fixer','OOP':'fixer','Built-in':'fixer',
    'Type':'blazer','Memory':'blazer','Structure':'blazer','Variable':'blazer',
  };

  // ═══ WEAPONS ═════════════════════════════════════════════════════════════
  const WEAPONS = {
    sniper: { name:'SYNTAX SNIPER', key:'S', color:'#b57aff', glow:'rgba(181,122,255,0.9)', desc:'Hits I/O, functions, errors' },
    fixer:  { name:'LOGIC FIXER',   key:'L', color:'#00d4ff', glow:'rgba(0,212,255,0.9)',   desc:'Hits logic, loops, control' },
    blazer: { name:'TYPE BLAZER',   key:'T', color:'#ff6b35', glow:'rgba(255,107,53,0.9)',  desc:'Hits types, memory, data' },
  };

  // ═══ BRIEFINGS ════════════════════════════════════════════════════════════
  const BRIEFS = {
    python: {
      1:{ title:'INPUTS & OUTPUTS',   icon:'📡', color:'#00d4ff', text:'<code>print()</code> sends data OUT to the user. <code>input()</code> brings data IN from the user. Every program communicates — these two are your basic communication tools.', kw:['print','input','str','int','float'] },
      2:{ title:'LOGIC GATES',         icon:'⚡', color:'#ffff00', text:'<code>if/elif/else</code> creates decision branches. <code>for</code> loops through sequences. <code>while</code> loops until a condition fails. <code>break</code> exits early. These govern ALL program flow.', kw:['if','elif','else','for','while','break'] },
      3:{ title:'MEMORY BANKS',        icon:'🧠', color:'#39ff8f', text:'<code>list = []</code> stores ordered items. <code>dict = {}</code> stores labelled items. <code>append()</code> adds to a list. <code>len()</code> counts items. Real programs store and retrieve data constantly.', kw:['list','dict','append','len','range'] },
      4:{ title:'PATTERN MATCHING',    icon:'🔍', color:'#b57aff', text:'<code>def</code> creates a reusable function. <code>return</code> sends the answer back to the caller. Once defined, you can call the function from anywhere. This is how you avoid repeating yourself.', kw:['def','return','class'] },
      5:{ title:'SYSTEM MODULES',      icon:'📦', color:'#ff6b35', text:'<code>import</code> loads pre-built libraries. <code>import random</code> gives you the random module. You use <code>random.randint(1,10)</code> to get a random int. Never reinvent tools that already exist.', kw:['import','random'] },
      6:{ title:'BOSS: FULL PROGRAM',  icon:'⚠',  color:'#ff0080', text:'ALL concepts activate simultaneously. Input → process → output. Functions, loops, lists, conditions — everything at once. Prove you can hold it all in your head.', kw:[] },
    },
    java: {
      1:{ title:'PRIMITIVE TYPES',     icon:'🔩', color:'#00d4ff', text:'Java forces you to declare types. <code>int</code>=whole number, <code>double</code>=decimal, <code>String</code>=text, <code>boolean</code>=true/false. Types catch bugs at compile time before runtime.', kw:['int','double','void','boolean','char'] },
      2:{ title:'ACCESS CONTROL',      icon:'🔐', color:'#b57aff', text:'<code>public</code>=anyone, <code>private</code>=only this class, <code>static</code>=shared by all instances, <code>final</code>=immutable. These modifiers are the locks and keys of Java architecture.', kw:['public','private','static','final'] },
      3:{ title:'FLOW CONTROL',        icon:'🌊', color:'#39ff8f', text:'Same concepts as Python but with curly braces <code>{ }</code> and semicolons <code>;</code>. <code>if/else/switch</code> route. <code>for/while/do-while</code> repeat. Every statement ends with a semicolon.', kw:['if','else','for','while','switch'] },
      4:{ title:'OBJECTS',             icon:'🧱', color:'#ff6b35', text:'<code>class</code> = blueprint. <code>new</code> = create instance. <code>this</code> = current object. <code>super</code> = parent class. Java is 100% object-oriented — everything is a class.', kw:['class','new','this','super'] },
      5:{ title:'EXCEPTIONS',          icon:'💥', color:'#ff0080', text:'<code>try</code> wraps risky code. <code>catch</code> handles the failure. <code>throw</code> triggers an error manually. <code>finally</code> always runs — even after a crash. Never let programs fail silently.', kw:['try','catch','throw','finally'] },
      6:{ title:'BOSS: FULL SYNTAX',   icon:'⚠',  color:'#ff0080', text:'Method + array + loop + output. Java is strict: wrong type = compile error, missing semicolon = compile error. Every character counts.', kw:[] },
    },
    c: {
      1:{ title:'DATA TYPES',          icon:'🔩', color:'#00d4ff', text:'C types ARE their memory size. <code>int</code>=4 bytes, <code>char</code>=1 byte, <code>float</code>=4 bytes, <code>double</code>=8 bytes. You manage memory yourself. Size always matters in C.', kw:['int','char','float','double','void'] },
      2:{ title:'PREPROCESSOR',        icon:'⚙',  color:'#ff6b35', text:'<code>#include</code> pulls in header files like <code>stdio.h</code>. <code>#define</code> creates text substitutions. These run BEFORE compilation — they transform your source code before the compiler sees it.', kw:['#include','#define','main','return'] },
      3:{ title:'POINTERS',            icon:'📍', color:'#b57aff', text:'A pointer holds a memory ADDRESS, not a value. <code>int *p = &x;</code> means p holds the address of x. <code>sizeof()</code> tells you byte size. <code>NULL</code> = empty address. Pointers give C its power AND its danger.', kw:['struct','sizeof','null','malloc','free'] },
      4:{ title:'I/O STREAMS',         icon:'📺', color:'#39ff8f', text:'<code>printf</code> prints with format codes: <code>%d</code>=int, <code>%s</code>=string, <code>%f</code>=float, <code>\\n</code>=newline. <code>scanf</code> reads with <code>&variable</code> — the <code>&</code> gives the address so scanf knows where to store.', kw:['printf','scanf','puts','gets'] },
      5:{ title:'MEMORY MANAGEMENT',   icon:'🧠', color:'#ffff00', text:'<code>malloc(n)</code> allocates n bytes. You MUST call <code>free(ptr)</code> when done — forgetting creates a memory leak, the most common C bug. <code>calloc</code> also zeroes memory. <code>realloc</code> resizes.', kw:['malloc','free','calloc','realloc'] },
      6:{ title:'BOSS: STRUCT + LOOP', icon:'⚠',  color:'#ff0080', text:'Arrays, loops, functions, manual memory — simultaneously. C gives you total control and total responsibility. Every byte, every allocation, every pointer is yours.', kw:[] },
    },
  };

  // ═══ STATE ════════════════════════════════════════════════════════════════
  const NS = {
    weapon:'sniper', combo:0, streak:0,
    btActive:false, btCooldown:false, btGauge:100, btFirst:false,
    ults:{ blast:{cd:0,max:45000}, gc:{cd:0,max:30000}, overflow:{cd:0,max:60000,active:false} },
    mistakes:{}, leechTimers:new Map(), nullHits:new Map(), memZones:[],
    stormActive:false, overflowMult:1, briefingShown:new Set(), ready:false,
  };

  // ═══ FX ═══════════════════════════════════════════════════════════════════
  const FX = {
    shake(px=8,ms=300){ const c=document.getElementById('gameCanvas');if(!c)return;c.style.transition='none';c.style.transform=`translate(${(Math.random()-.5)*px}px,${(Math.random()-.5)*px}px)`;setTimeout(()=>{c.style.transition='transform 0.15s ease-out';c.style.transform='';},ms); },
    flash(rgba='rgba(255,49,49,0.22)',ms=200){ const o=document.getElementById('nx-flash');if(!o)return;o.style.background=rgba;o.style.opacity='1';setTimeout(()=>{o.style.opacity='0';},ms); },
    particles(x,y,wp,n=14){ const c=document.getElementById('gameCanvas');if(!c)return;const col=WEAPONS[wp]?.color||'#00ffff';for(let i=0;i<n;i++){const p=document.createElement('div');p.className='nx-pt';const a=(Math.PI*2*i)/n,d=20+Math.random()*40;p.style.cssText=`left:${x}px;top:${y}px;background:${col};box-shadow:0 0 3px ${col};--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d}px;`;c.appendChild(p);setTimeout(()=>p.remove(),650);} },
    shockwave(x,y,col='#b57aff'){ const c=document.getElementById('gameCanvas');if(!c)return;const r=document.createElement('div');r.className='nx-sw';r.style.cssText=`left:${x}px;top:${y}px;border-color:${col};`;c.appendChild(r);setTimeout(()=>r.remove(),800); },
    chroma(px=4,ms=350){ document.body.style.filter=`drop-shadow(${px}px 0 0 rgba(255,0,0,0.28)) drop-shadow(-${px}px 0 0 rgba(0,255,255,0.28))`;setTimeout(()=>{document.body.style.filter='';},ms); },
  };

  // ═══ NOTIFICATIONS ════════════════════════════════════════════════════════
  function notif(txt,col='#00ffff',ms=1800){
    const c=document.getElementById('nx-notif');if(!c)return;
    const el=document.createElement('div');el.className='nx-ni';el.textContent=txt;
    el.style.cssText=`color:${col};border-color:${col};text-shadow:0 0 10px ${col};`;
    c.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));
    setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),300);},ms);
  }

  // ═══ CONCEPT PANEL ════════════════════════════════════════════════════════
  function showConcept(kw){
    const panel=document.getElementById('nx-cp');if(!panel)return;
    const k=kw?.trim();
    const d=DB[k]||DB[k?.toLowerCase()]||DB[k?.split('(')[0]]||DB[k?.split(' ')[0]];
    if(!d){panel.classList.remove('vis');return;}
    document.getElementById('nx-cp-cat').textContent=d.cat.toUpperCase();
    document.getElementById('nx-cp-what').textContent=d.what;
    document.getElementById('nx-cp-ex').textContent=d.example;
    document.getElementById('nx-cp-tip').textContent='💡 '+d.tip;
    const wc=WEAPONS[CAT_WEAPON[d.cat]||'sniper'].color;
    const catEl=document.getElementById('nx-cp-cat');catEl.style.color=wc;catEl.style.borderColor=wc;
    panel.classList.add('vis');
  }
  function hideConcept(){ document.getElementById('nx-cp')?.classList.remove('vis'); }

  // ═══ MISTAKE TRACKER ══════════════════════════════════════════════════════
  const Mistakes = {
    log(t){ if(t)NS.mistakes[t]=(NS.mistakes[t]||0)+1; },
    top(n=5){ return Object.entries(NS.mistakes).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([w,c])=>({w,c})); },
    render(){
      const l=document.getElementById('nx-mk-list');if(!l)return;
      const t=this.top();
      if(!t.length){l.innerHTML='<div class="nx-mk-empty">NO ERRORS YET</div>';return;}
      l.innerHTML=t.map(m=>{const d=DB[m.w]||DB[m.w.toLowerCase()]||{};return`<div class="nx-mk-row"><span class="nx-mk-kw">${m.w}</span><span class="nx-mk-n">×${m.c}</span>${d.what?`<span class="nx-mk-def">${d.what}</span>`:''}</div>`;}).join('');
    },
  };

  // ═══ WEAPON SYSTEM ════════════════════════════════════════════════════════
  function setWeapon(w){
    if(!WEAPONS[w])return; NS.weapon=w;
    const def=WEAPONS[w];
    document.documentElement.style.setProperty('--nx-beam',def.color);
    document.documentElement.style.setProperty('--nx-glow',def.glow);
    document.querySelectorAll('.nx-wpip').forEach(p=>p.classList.toggle('act',p.dataset.w===w));
    const ne=document.getElementById('nx-wname');if(ne)ne.textContent=def.name;
    FX.flash(def.color+'1a',280); notif(`⚡ ${def.name}`,def.color,1100);
  }

  // ═══ BULLET TIME ══════════════════════════════════════════════════════════
  let btTimer=null;
  function bulletTime(){
    if(NS.btActive||NS.btCooldown)return;
    NS.btActive=true;NS.btCooldown=true;NS.btGauge=0;NS.btFirst=true;
    document.getElementById('screen-game')?.classList.add('nx-bt');
    document.querySelectorAll('.word-fall').forEach(w=>{const d=parseFloat(getComputedStyle(w).animationDuration)||8;w.style.animationDuration=(d*3.3).toFixed(1)+'s';});
    notif('⚡ BULLET TIME — READ THE CODE','#00ffff',2500);
    updateDash();
    setTimeout(()=>{
      NS.btActive=false;
      document.getElementById('screen-game')?.classList.remove('nx-bt');
      document.querySelectorAll('.word-fall').forEach(w=>w.style.animationDuration='');
      let e=0;clearInterval(btTimer);
      btTimer=setInterval(()=>{e+=100;NS.btGauge=Math.min(100,(e/8000)*100);updateDash();if(e>=8000){clearInterval(btTimer);NS.btCooldown=false;notif('DASH RECHARGED','#00ffff',900);}},100);
    },2500);
  }

  // ═══ ULTIMATES ════════════════════════════════════════════════════════════
  function compilerBlast(){
    const u=NS.ults.blast;if(Date.now()<u.cd){notif(`COMPILER CD: ${Math.ceil((u.cd-Date.now())/1000)}s`,'#555');return;}
    u.cd=Date.now()+u.max;
    const cv=document.getElementById('gameCanvas');const cr=cv?.getBoundingClientRect();let n=0;
    document.querySelectorAll('.word-fall').forEach(el=>{if(el.dataset.destroyed)return;n++;el.dataset.destroyed='1';el.style.animation='destroy-flash 0.4s ease-out forwards';el.style.pointerEvents='none';if(cr){const r=el.getBoundingClientRect();FX.particles(r.left+r.width/2-cr.left,r.top-cr.top,NS.weapon);}setTimeout(()=>el.remove(),400);});
    if(n>0&&window.apiAddPoints)apiAddPoints(n*30);
    FX.shake(18,500);FX.flash('rgba(181,122,255,0.22)',500);if(cr)FX.shockwave(cr.width/2,cr.height/2,'#b57aff');
    notif(`🔥 COMPILER BLAST — ${n} ERRORS PURGED`,'#b57aff',2000);updateUlts();
  }

  function garbageCollect(){
    const u=NS.ults.gc;if(Date.now()<u.cd){notif(`GC CD: ${Math.ceil((u.cd-Date.now())/1000)}s`,'#555');return;}
    u.cd=Date.now()+u.max;
    NS.memZones.forEach(z=>z.el?.remove());NS.memZones=[];
    if(NS.stormActive){NS.stormActive=false;document.querySelectorAll('.word-fall').forEach(w=>w.style.animationDuration='');}
    if(window.setShipHealth)setShipHealth(Math.min(100,(window.shipHealth||50)+25));
    FX.flash('rgba(57,255,143,0.14)',380);FX.shake(5,200);
    notif('♻ GARBAGE COLLECTED — MEMORY FREED','#39ff8f',2000);updateUlts();
  }

  function stackOverflow(){
    const u=NS.ults.overflow;if(Date.now()<u.cd||u.active)return;
    u.cd=Date.now()+u.max;u.active=true;NS.overflowMult=3;
    notif('🌊 STACK OVERFLOW — 3× SCORE 5s!','#ff6b35',5000);
    FX.flash('rgba(255,107,53,0.14)',500);
    setTimeout(()=>{u.active=false;NS.overflowMult=1;updateUlts();},5000);updateUlts();
  }

  // ═══ ENEMY VARIANTS ═══════════════════════════════════════════════════════
  function assignEnemy(el,lvl){
    const roll=Math.random(); let t='wraith';
    if(lvl>=2&&roll<0.17)t='leech';
    else if(lvl>=2&&roll<0.28)t='null_ptr';
    else if(lvl>=3&&roll<0.37)t='specter';
    else if(lvl>=4&&roll<0.44)t='ghost';
    el.dataset.nxt=t; el.classList.add('nx-enemy',`nx-${t}`);
    if(t==='leech')startDrain(el);
    if(t==='null_ptr'){NS.nullHits.set(el,0);nullBlink(el);}
  }

  function startDrain(el){
    const id=setInterval(()=>{
      if(!document.contains(el)||el.dataset.destroyed){clearInterval(id);return;}
      if(window.GS){GS.sessionScore=Math.max(0,(GS.sessionScore||0)-1);const s=document.getElementById('gameScore');if(s)s.textContent=GS.sessionScore;updatePts();}
    },100);
    NS.leechTimers.set(el,id);
  }

  function nullBlink(el){
    let v=true;
    const bi=setInterval(()=>{if(!document.contains(el)||el.dataset.destroyed){clearInterval(bi);return;}v=!v;el.style.opacity=v?'1':'0.12';},450);
    const ti=setInterval(()=>{if(!document.contains(el)||el.dataset.destroyed){clearInterval(ti);return;}el.style.left=(8+Math.random()*80)+'%';FX.flash('rgba(181,122,255,0.05)',100);},2400);
  }

  function handleHit(el){
    const t=el.dataset.nxt;
    if(NS.leechTimers.has(el)){clearInterval(NS.leechTimers.get(el));NS.leechTimers.delete(el);}
    if(t==='null_ptr'){const h=(NS.nullHits.get(el)||0)+1;NS.nullHits.set(el,h);if(h<2){el.classList.add('nx-hfl');setTimeout(()=>el.classList.remove('nx-hfl'),200);notif('NULL POINTER — HIT AGAIN!','#b57aff',900);return false;}NS.nullHits.delete(el);}
    if(t==='specter')splitSpecter(el);
    return true;
  }

  function splitSpecter(el){
    const c=document.getElementById('gameCanvas');if(!c)return;
    const cr=c.getBoundingClientRect(),r=el.getBoundingClientRect();
    const x=r.left+r.width/2-cr.left,y=r.top-cr.top;
    for(let i=0;i<2;i++){const m=document.createElement('div');const h=el.textContent.slice(0,Math.ceil(el.textContent.length/2));m.className='word-fall nx-enemy nx-specter nx-sm';m.textContent=h;m.dataset.target=h;m.dataset.nxt='specter';m.style.cssText=`left:${x+(i?50:-50)}px;top:${y}px;position:absolute;font-size:0.7em;`;c.appendChild(m);}
  }

  function spawnMemZone(){
    const c=document.getElementById('gameCanvas');if(!c)return;
    const z=document.createElement('div');z.className='nx-mz';z.style.cssText=`left:${8+Math.random()*60}%;top:${15+Math.random()*40}%;`;c.appendChild(z);
    NS.memZones.push({el:z});let s=180;const si=setInterval(()=>{s-=1.5;if(s<=0||!document.contains(z)){clearInterval(si);z.remove();return;}z.style.width=z.style.height=s+'px';},300);
  }

  // ═══ KILL / BREACH ════════════════════════════════════════════════════════
  function onKill(el){
    NS.combo++;NS.streak++;
    if(NS.btFirst){NS.btFirst=false;notif('🎯 PRECISION SHOT +50','#00ffff',1200);if(window.apiAddPoints)apiAddPoints(50);}
    if(NS.overflowMult>1&&window.apiAddPoints)apiAddPoints(10*(NS.overflowMult-1));
    const tgt=(el.dataset.target||el.dataset.original||'').split('(')[0].split(' ')[0].trim();
    const d=DB[tgt]||DB[tgt.toLowerCase()];
    if(d){const cw=CAT_WEAPON[d.cat];if(cw===NS.weapon&&window.apiAddPoints)apiAddPoints(20);}
    const cv=document.getElementById('gameCanvas'),cr=cv?.getBoundingClientRect();
    if(cr){const r=el.getBoundingClientRect();FX.particles(r.left+r.width/2-cr.left,r.top-cr.top,NS.weapon);}
    const LBL={5:'NICE!',10:'SICK!',15:'DEADLY!',20:'GODLIKE!',30:'COMPILE GOD!'};
    if(LBL[NS.combo])notif(`${NS.combo}× — ${LBL[NS.combo]}`,'#ffff00',1400);
    if(NS.combo===10)stackOverflow();
    updatePts();updateCombo();Mistakes.render();
  }

  function onBreach(el){
    NS.combo=0;NS.streak=0;
    FX.shake(8,300);FX.chroma(4,380);
    Mistakes.log(el.dataset.target||'');
    if(el.dataset.nxt==='ghost')spawnMemZone();
    updateCombo();Mistakes.render();
  }

  // ═══ BRIEFING ROOM ════════════════════════════════════════════════════════
  function showBriefing(lvl,onClose){
    const lang=window.GS?.language||'python';
    const b=BRIEFS[lang]?.[lvl];
    if(!b||NS.briefingShown.has(`${lang}_${lvl}`)){onClose();return;}
    NS.briefingShown.add(`${lang}_${lvl}`);
    const ov=document.getElementById('nx-brief');if(!ov){onClose();return;}
    document.getElementById('nx-bi').textContent=b.icon;
    const te=document.getElementById('nx-bt');te.textContent=`LVL ${lvl}: ${b.title}`;te.style.color=b.color;
    document.getElementById('nx-bl').innerHTML=b.text;
    const ke=document.getElementById('nx-bk');
    ke.innerHTML=b.kw.slice(0,5).map(k=>{const d=DB[k]||{};return`<div class="nx-bki"><code class="nx-bkw" style="color:${b.color}">${k}</code><span class="nx-bkd">${d.what||''}</span></div>`;}).join('');
    ov.style.borderColor=b.color;ov.style.boxShadow=`0 0 40px ${b.color}44`;ov.classList.add('open');
    const close=()=>{ov.classList.remove('open');setTimeout(onClose,300);};
    document.getElementById('nx-bc').onclick=close;
    const ac=setTimeout(close,14000);
    document.getElementById('nx-bc').addEventListener('click',()=>clearTimeout(ac),{once:true});
  }

  // ═══ KNOWLEDGE VAULT ══════════════════════════════════════════════════════
  function showVault(lvl){
    const lang=window.GS?.language||'python';
    const b=BRIEFS[lang]?.[lvl];
    const v=document.getElementById('nx-vault');if(!v)return;
    const tl=document.getElementById('nx-vt'),bd=document.getElementById('nx-vb');
    if(tl)tl.textContent=b?`LVL ${lvl} — ${b.title} DEBRIEF`:`LEVEL ${lvl} COMPLETE`;
    if(bd){
      const learned=(b?.kw||[]).map(k=>{const d=DB[k];if(!d)return'';return`<div class="nx-vr"><code class="nx-vkw">${k}</code><span class="nx-vwhat">${d.what}</span><code class="nx-vex">${d.example}</code></div>`;}).join('');
      const top=Mistakes.top(3);
      const errs=top.length?`<div class="nx-vs">⚠ REVIEW THESE — YOU MISSED THEM</div>`+top.map(m=>{const d=DB[m.w]||DB[m.w.toLowerCase()]||{};return`<div class="nx-vr nx-ve"><code class="nx-vkw" style="color:#ff6060">${m.w}</code><span class="nx-vwhat">${d.what||'Review the syntax for this keyword.'}</span><span style="font-size:8px;color:#ff6060;letter-spacing:1px">MISSED ×${m.c}</span></div>`;}).join(''):'';
      bd.innerHTML=`<div class="nx-vs">📚 CONCEPTS LEARNED THIS LEVEL</div>${learned||'<p style="color:rgba(255,255,255,0.3);font-size:11px">Play more levels to build your knowledge list.</p>'}${errs}`;
    }
    v.classList.add('open');
  }

  // ═══ HUD UPDATERS ═════════════════════════════════════════════════════════
  function updatePts(){
    const p=window.GS?.sessionScore||0;
    const e=document.getElementById('nx-pv');if(e)e.textContent=p.toLocaleString();
    const b=document.getElementById('nx-builder-badge');if(b)b.textContent=p.toLocaleString();
  }
  function updateCombo(){
    const c=document.getElementById('nx-cv'),s=document.getElementById('nx-sv');
    if(c){c.textContent='×'+NS.combo;c.className='nx-cv'+(NS.combo>=10?' hot':'');}
    if(s)s.textContent=NS.streak;
  }
  function updateDash(){
    const f=document.getElementById('nx-df');if(!f)return;
    f.style.width=NS.btGauge+'%';
    f.style.background=NS.btGauge>=100?'linear-gradient(90deg,#00ffff,#b57aff)':'linear-gradient(90deg,#333,#00d4ff)';
  }
  function updateUlts(){
    [['blast','nx-uq'],['gc','nx-ue'],['overflow','nx-ua']].forEach(([k,id])=>{
      const b=document.getElementById(id);if(!b)return;
      const u=NS.ults[k];b.classList.toggle('rdy',Date.now()>=u.cd);b.classList.toggle('act',!!u.active);
    });
  }
  function updateBanner(lvl){
    const lang=window.GS?.language||'python';const b=BRIEFS[lang]?.[lvl];if(!b)return;
    const e=document.getElementById('nx-banner');if(!e)return;
    e.innerHTML=`<span style="font-size:18px">${b.icon}</span><span style="color:${b.color};font-family:'Orbitron',monospace;font-size:12px;font-weight:700;letter-spacing:2px">LVL ${lvl}: ${b.title}</span>`;
    e.style.borderColor=b.color;e.style.boxShadow=`0 0 18px ${b.color}44`;
    document.documentElement.style.setProperty('--nx-concept',b.color);
    e.classList.add('show');setTimeout(()=>e.classList.remove('show'),4000);
  }

  // ═══ DOM INJECTION ════════════════════════════════════════════════════════
  function injectDOM(){
    // Flash overlay
    const fl=document.createElement('div');fl.id='nx-flash';
    fl.style.cssText='position:fixed;inset:0;z-index:996;pointer-events:none;opacity:0;transition:opacity 0.12s ease-out;';
    document.body.appendChild(fl);

    // Notification tray
    const nc=document.createElement('div');nc.id='nx-notif';
    nc.style.cssText='position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:997;display:flex;flex-direction:column;align-items:center;gap:5px;pointer-events:none;';
    document.body.appendChild(nc);

    const gs=document.getElementById('screen-game');if(!gs)return;

    // Bottom-left HUD
    const hud=document.createElement('div');hud.id='nx-hud';hud.className='nx-hud';
    hud.innerHTML=`<div class="nx-hb"><div class="nx-hl">◈ POINTS</div><div class="nx-hv" id="nx-pv">0</div></div><div class="nx-hs">|</div><div class="nx-hb"><div class="nx-hl">COMBO</div><div class="nx-cv" id="nx-cv">×0</div></div><div class="nx-hs">|</div><div class="nx-hb"><div class="nx-hl">⚡ STREAK</div><div class="nx-hv" id="nx-sv">0</div></div>`;
    gs.appendChild(hud);

    // Concept panel
    const cp=document.createElement('div');cp.id='nx-cp';cp.className='nx-cp';
    cp.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span id="nx-cp-cat" class="nx-ccat">CATEGORY</span><span style="font-size:7px;color:rgba(255,255,255,0.2);letter-spacing:1px">CODEX</span></div><div id="nx-cp-what" class="nx-cwhat"></div><div id="nx-cp-ex" class="nx-cex"></div><div id="nx-cp-tip" class="nx-ctip"></div>`;
    gs.appendChild(cp);

    // Level concept banner
    const bn=document.createElement('div');bn.id='nx-banner';bn.className='nx-banner';
    gs.appendChild(bn);

    // Weapon HUD
    const wh=document.createElement('div');wh.id='nx-wh';wh.className='nx-wh';
    wh.innerHTML=`<div class="nx-whl">WEAPON</div><div class="nx-wps">${Object.entries(WEAPONS).map(([k,w])=>`<div class="nx-wpip${k==='sniper'?' act':''}" data-w="${k}" onclick="NX.weapon('${k}')" title="${w.desc}"><span class="nx-wk">${w.key}</span><div style="flex:1"><div class="nx-wn">${w.name.split(' ').pop()}</div><div class="nx-wd">${w.desc.split('.')[0]}</div></div></div>`).join('')}</div><div class="nx-wa" id="nx-wname">SYNTAX SNIPER</div>`;
    gs.appendChild(wh);

    // Dash gauge
    const dg=document.createElement('div');dg.id='nx-dg';dg.className='nx-dg';
    dg.innerHTML=`<span class="nx-dgl">SPACE · DASH</span><div class="nx-dgt"><div id="nx-df" style="width:100%;height:100%;border-radius:2px;background:linear-gradient(90deg,#00ffff,#b57aff);transition:width 0.1s linear,background 0.3s;"></div></div>`;
    gs.appendChild(dg);

    // Ultimate bar
    const ub=document.createElement('div');ub.id='nx-ub';ub.className='nx-ub';
    ub.innerHTML=`<div class="nx-ub-b rdy" id="nx-uq" onclick="NX.blast()" title="Destroys all enemies. Named after the real compiler."><span class="nx-uk">Q</span><span class="nx-un">COMPILER<br>BLAST</span></div><div class="nx-ub-b rdy" id="nx-ue" onclick="NX.gc()" title="Clears hazard zones + restores health. Named after real GC."><span class="nx-uk">E</span><span class="nx-un">GARBAGE<br>COLLECT</span></div><div class="nx-ub-b" id="nx-ua" title="Auto at ×10 combo. 3× score. Stack Overflow = recursion without a base case."><span class="nx-uk">AUTO</span><span class="nx-un">STACK<br>OVERFLOW</span></div>`;
    gs.appendChild(ub);

    // Mistake tracker
    const mk=document.createElement('div');mk.id='nx-mk';mk.className='nx-mk';
    mk.innerHTML=`<div class="nx-mkh">⚠ WEAK SPOTS</div><div id="nx-mk-list"><div class="nx-mk-empty">NO ERRORS YET</div></div>`;
    gs.appendChild(mk);

    // Pre-mission briefing
    const brf=document.createElement('div');brf.id='nx-brief';brf.className='nx-brief';
    brf.innerHTML=`<div class="nx-bri"><div class="nx-brg">PRE-MISSION BRIEFING</div><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;"><span id="nx-bi" style="font-size:30px">📡</span><div id="nx-bt" class="nx-btitle"></div></div><div id="nx-bl" class="nx-bless"></div><div id="nx-bk" class="nx-bkw"></div><button id="nx-bc" class="nx-bbtn">▶ BEGIN MISSION</button></div>`;
    gs.appendChild(brf);

    // Knowledge vault
    const kv=document.createElement('div');kv.id='nx-vault';kv.className='nx-vault';
    kv.innerHTML=`<div class="nx-vi"><div class="nx-vtag">KNOWLEDGE VAULT</div><div id="nx-vt" class="nx-vtitle">MISSION DEBRIEF</div><div id="nx-vb" class="nx-vbody"></div><button class="nx-vclose" onclick="document.getElementById('nx-vault').classList.remove('open')">✕ CLOSE DEBRIEF</button></div>`;
    document.body.appendChild(kv);

    // ── MODAL PATCHES ──────────────────────────────────────────────────────
    // How To Play — points table + live session points
    const htp=document.getElementById('howToPlayModal');
    if(htp){const mb=htp.querySelector('.modal-body');if(mb){const d=document.createElement('div');d.className='nx-modal-pts';d.innerHTML=`<div class="nx-mps-hd">◈ SESSION POINTS: <span id="nx-htp-pts" style="font-family:'Orbitron',monospace;font-size:14px;color:#00d4ff;text-shadow:0 0 8px rgba(0,212,255,0.6)">0</span></div><div class="nx-ptrow"><span>Destroy enemy (correct weapon)</span><span class="nx-p+">+10–30 pts</span></div><div class="nx-ptrow"><span>Correct weapon bonus</span><span class="nx-p+">+20 pts</span></div><div class="nx-ptrow"><span>Precision shot (Bullet Time)</span><span class="nx-p+">+50 pts</span></div><div class="nx-ptrow"><span>Compiler Blast (per enemy)</span><span class="nx-p+">+30 pts</span></div><div class="nx-ptrow"><span>Level clear bonus</span><span class="nx-p+">+100 pts</span></div><div class="nx-ptrow"><span>Logic Leech drain (per 0.1s)</span><span class="nx-p-">−1 pt</span></div>`;mb.prepend(d);}}

    // Points / Rank modal — position bar
    const ptm=document.getElementById('pointsModal');
    if(ptm){const mb=ptm.querySelector('.modal-body');if(mb){const d=document.createElement('div');d.className='nx-rb';d.innerHTML=`<div class="nx-rb-hd">YOUR POINTS: <span id="nx-rank-pts" style="font-family:'Orbitron',monospace;font-size:14px;color:#00d4ff">0</span></div><div class="nx-rbt"><div id="nx-rbf" style="height:100%;width:0%;background:linear-gradient(90deg,#00d4ff,#b57aff);border-radius:2px;transition:width 0.5s ease;box-shadow:0 0 8px rgba(0,212,255,0.5)"></div></div><div class="nx-rbc"><span>0</span><span>500</span><span>2K</span><span>5K</span><span>10K+</span></div>`;mb.prepend(d);}}

    // Profile modal — XP display
    const prof=document.getElementById('profileModal');
    if(prof){const ph=prof.querySelector('.modal-header');if(ph){const d=document.createElement('div');d.style.cssText='display:flex;align-items:baseline;gap:5px;margin-left:auto;padding:3px 10px;background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.2);border-radius:3px;';d.innerHTML=`<span style="font-size:8px;letter-spacing:2px;color:rgba(0,212,255,0.5);font-family:'Share Tech Mono',monospace">SESSION XP</span><span id="nx-prof-pts" style="font-family:'Orbitron',monospace;font-size:16px;font-weight:700;color:#00d4ff;text-shadow:0 0 8px rgba(0,212,255,0.6)">0</span>`;ph.appendChild(d);}}
  }

  // ═══ INJECT CSS ═══════════════════════════════════════════════════════════
  function injectCSS(){
    const s=document.createElement('style');
    s.textContent=`
:root{--nx-beam:#b57aff;--nx-glow:rgba(181,122,255,0.9);--nx-concept:#00d4ff;}
/* Bottom-Left HUD */
.nx-hud{position:absolute;bottom:20px;left:20px;z-index:999;display:flex;align-items:center;gap:12px;padding:7px 14px;background:rgba(2,3,14,0.92);border:1px solid rgba(0,212,255,0.18);border-radius:3px;font-family:'Share Tech Mono',monospace;pointer-events:none;box-shadow:0 0 10px rgba(0,212,255,0.2);transition:box-shadow 0.1s;}
.nx-hb{display:flex;flex-direction:column;align-items:center;gap:2px;}
.nx-hl{font-size:8px;letter-spacing:2px;color:rgba(0,212,255,0.45);}
.nx-hv{font-family:'Orbitron',monospace;font-size:15px;font-weight:700;color:#00d4ff;text-shadow:0 0 10px rgba(0,212,255,0.7);}
.nx-cv{font-family:'Orbitron',monospace;font-size:15px;font-weight:900;color:#ffff00;text-shadow:0 0 10px rgba(255,255,0,0.7);transition:transform 0.15s,color 0.2s;}
.nx-cv.hot{color:#ff6b35;text-shadow:0 0 16px rgba(255,107,53,0.9);animation:nx-cpulse 0.4s ease infinite alternate;}
@keyframes nx-cpulse{from{transform:scale(1)}to{transform:scale(1.18)}}
.nx-hs{color:rgba(0,212,255,0.18);font-size:16px;}
/* Notifications */
.nx-ni{font-family:'Orbitron',monospace;font-size:10px;font-weight:700;letter-spacing:2px;padding:5px 16px;background:rgba(2,3,14,0.92);border:1px solid currentColor;border-radius:3px;opacity:0;transform:translateY(-8px);transition:opacity 0.22s,transform 0.22s;white-space:nowrap;}
.nx-ni.show{opacity:1;transform:translateY(0);}
/* Concept panel */
.nx-cp{position:absolute;bottom:20px;left:200px;z-index:80;width:220px;padding:10px 14px;background:rgba(2,3,14,0.95);border:1px solid rgba(0,212,255,0.15);border-radius:3px;font-family:'Share Tech Mono',monospace;pointer-events:none;opacity:0;transform:translateY(6px);transition:opacity 0.25s,transform 0.25s;}
.nx-cp.vis{opacity:1;transform:translateY(0);}
.nx-ccat{font-size:8px;letter-spacing:2.5px;padding:2px 6px;border:1px solid;border-radius:2px;}
.nx-cwhat{font-size:10px;color:rgba(255,255,255,0.85);margin:6px 0 4px;line-height:1.5;}
.nx-cex{font-family:'Share Tech Mono',monospace;font-size:9px;color:#39ff8f;background:rgba(57,255,143,0.06);padding:4px 6px;border-left:2px solid rgba(57,255,143,0.4);display:block;white-space:pre;}
.nx-ctip{font-size:9px;color:rgba(255,220,80,0.8);margin-top:5px;}
/* Concept banner */
.nx-banner{position:absolute;top:58px;left:50%;transform:translateX(-50%) translateY(-10px);z-index:120;display:flex;align-items:center;gap:12px;padding:8px 20px;background:rgba(2,3,14,0.96);border:1px solid;border-radius:3px;pointer-events:none;opacity:0;transition:opacity 0.3s,transform 0.3s;white-space:nowrap;}
.nx-banner.show{opacity:1;transform:translateX(-50%) translateY(0);}
/* Weapon HUD */
.nx-wh{position:absolute;top:80px;right:14px;z-index:999;display:flex;flex-direction:column;align-items:flex-end;gap:5px;pointer-events:auto;}
.nx-whl{font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:3px;color:rgba(0,212,255,0.35);}
.nx-wps{display:flex;flex-direction:column;gap:4px;}
.nx-wpip{display:flex;align-items:center;gap:8px;padding:5px 9px;background:rgba(0,0,0,0.65);border:1px solid rgba(255,255,255,0.07);border-radius:3px;cursor:pointer;opacity:0.4;transition:all 0.15s;font-family:'Share Tech Mono',monospace;}
.nx-wpip:hover{opacity:0.75;transform:translateX(-3px);}
.nx-wpip.act{opacity:1;border-color:var(--nx-beam);box-shadow:0 0 10px var(--nx-beam);transform:translateX(-4px);}
.nx-wk{font-family:'Orbitron',monospace;font-size:10px;font-weight:900;color:rgba(0,212,255,0.65);width:13px;text-align:center;}
.nx-wn{font-size:9px;letter-spacing:1.5px;color:rgba(255,255,255,0.7);}
.nx-wd{font-size:8px;color:rgba(255,255,255,0.3);}
.nx-wa{font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:2px;color:var(--nx-beam);text-shadow:0 0 8px var(--nx-beam);text-align:right;}
/* Dash gauge */
.nx-dg{position:absolute;bottom:58px;left:50%;transform:translateX(-50%);z-index:80;display:flex;align-items:center;gap:8px;pointer-events:none;}
.nx-dgl{font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:2px;color:rgba(0,255,255,0.5);white-space:nowrap;}
.nx-dgt{width:110px;height:4px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden;}
/* Ultimate bar */
.nx-ub{position:absolute;bottom:75px;right:14px;z-index:80;display:flex;flex-direction:column;gap:5px;pointer-events:auto;}
.nx-ub-b{display:flex;align-items:center;gap:8px;padding:6px 11px;background:rgba(0,0,0,0.72);border:1px solid rgba(255,255,255,0.08);border-radius:3px;cursor:pointer;opacity:0.38;transition:all 0.2s;font-family:'Share Tech Mono',monospace;}
.nx-ub-b.rdy{opacity:1;border-color:rgba(0,212,255,0.45);box-shadow:0 0 8px rgba(0,212,255,0.18);cursor:pointer;}
.nx-ub-b.rdy:hover{border-color:rgba(0,212,255,0.85);box-shadow:0 0 16px rgba(0,212,255,0.38);transform:translateX(-3px);}
.nx-ub-b.act{border-color:#ff6b35;box-shadow:0 0 18px rgba(255,107,53,0.5);animation:nx-upulse 0.5s ease infinite alternate;}
@keyframes nx-upulse{from{box-shadow:0 0 8px rgba(255,107,53,0.35)}to{box-shadow:0 0 22px rgba(255,107,53,0.75)}}
.nx-uk{font-family:'Orbitron',monospace;font-size:10px;font-weight:900;color:#00d4ff;min-width:22px;text-align:center;}
.nx-un{font-size:8px;letter-spacing:1.5px;color:rgba(255,255,255,0.6);line-height:1.4;}
/* Mistake tracker */
.nx-mk{position:absolute;top:80px;left:14px;z-index:80;width:185px;padding:8px 12px;background:rgba(2,3,14,0.9);border:1px solid rgba(255,100,100,0.18);border-radius:3px;font-family:'Share Tech Mono',monospace;}
.nx-mkh{font-size:8px;letter-spacing:2px;color:rgba(255,100,100,0.55);margin-bottom:7px;}
.nx-mk-row{display:flex;align-items:baseline;gap:6px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04);}
.nx-mk-kw{font-size:10px;color:#ff6060;flex-shrink:0;}
.nx-mk-n{font-size:8px;color:rgba(255,100,100,0.5);flex-shrink:0;}
.nx-mk-def{font-size:8px;color:rgba(255,255,255,0.3);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.nx-mk-empty{color:rgba(255,255,255,0.25);font-size:8px;letter-spacing:1px;}
/* Laser override */
.laser-beam{background:linear-gradient(to top,transparent 0%,var(--nx-beam) 40%,rgba(255,255,255,0.95) 50%,var(--nx-beam) 60%,transparent 100%) !important;box-shadow:0 0 8px var(--nx-glow),0 0 2px rgba(255,255,255,0.8) !important;}
/* Bullet time */
#screen-game.nx-bt{filter:saturate(0.28) brightness(0.88);}
#screen-game.nx-bt::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,255,255,0.1) 100%);pointer-events:none;z-index:90;}
/* Enemy variants */
.word-fall.nx-leech{color:rgba(255,55,55,0.95)!important;text-shadow:0 0 10px rgba(255,49,49,0.9)!important;animation-name:word-fall,nx-leech-p!important;animation-duration:var(--fall-dur,8s),0.85s!important;animation-iteration-count:1,infinite!important;}
@keyframes nx-leech-p{0%,100%{text-shadow:0 0 8px rgba(255,49,49,0.7)}50%{text-shadow:0 0 22px rgba(255,49,49,1),0 0 36px rgba(255,0,0,0.5)}}
.word-fall.nx-null_ptr{color:rgba(181,122,255,0.9)!important;}
.word-fall.nx-specter{color:rgba(255,107,53,0.95)!important;outline:1px solid rgba(255,107,53,0.3)!important;outline-offset:4px!important;animation-name:word-fall,nx-spec-o!important;animation-duration:var(--fall-dur,8s),2s!important;animation-iteration-count:1,infinite!important;}
.nx-sm{animation-duration:5s!important;}
@keyframes nx-spec-o{0%,100%{outline-offset:4px;outline-color:rgba(255,107,53,0.3)}50%{outline-offset:9px;outline-color:rgba(255,107,53,0.65)}}
.word-fall.nx-ghost{color:rgba(57,255,143,0.65)!important;text-shadow:0 0 14px rgba(57,255,143,0.4)!important;filter:blur(0.35px)!important;animation-name:word-fall,nx-gf!important;animation-duration:var(--fall-dur,8s),4s!important;animation-iteration-count:1,infinite!important;}
@keyframes nx-gf{0%,100%{opacity:0.65;filter:blur(0.35px)}50%{opacity:0.38;filter:blur(1.1px)}}
.nx-hfl{animation:nx-hf 0.2s ease-out!important;}
@keyframes nx-hf{0%{background:rgba(181,122,255,0.45)}100%{background:transparent}}
/* Memory leak zone */
.nx-mz{position:absolute;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(255,49,49,0.06) 0%,rgba(255,49,49,0.02) 60%,transparent 100%);border:1px solid rgba(255,49,49,0.3);transform:translate(-50%,-50%);pointer-events:none;animation:nx-mzp 2s ease-in-out infinite;z-index:5;}
@keyframes nx-mzp{0%,100%{border-color:rgba(255,49,49,0.3)}50%{border-color:rgba(255,49,49,0.65);box-shadow:0 0 18px rgba(255,49,49,0.18)}}
/* Kill particles */
.nx-pt{position:absolute;width:5px;height:5px;border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);animation:nx-pta 0.65s ease-out forwards;}
@keyframes nx-pta{0%{transform:translate(-50%,-50%) translate(0,0);opacity:1}100%{transform:translate(-50%,-50%) translate(var(--dx),var(--dy));opacity:0}}
/* Shockwave */
.nx-sw{position:absolute;width:0;height:0;border-radius:50%;border:3px solid;transform:translate(-50%,-50%);pointer-events:none;animation:nx-swa 0.8s ease-out forwards;}
@keyframes nx-swa{0%{width:0;height:0;opacity:1}100%{width:550px;height:550px;opacity:0}}
/* Pre-mission briefing */
.nx-brief{position:absolute;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.72);opacity:0;pointer-events:none;transition:opacity 0.28s;}
.nx-brief.open{opacity:1;pointer-events:auto;}
.nx-bri{max-width:540px;width:90%;background:rgba(2,3,14,0.97);border:1px solid rgba(0,212,255,0.2);border-radius:4px;padding:28px 32px;font-family:'Share Tech Mono',monospace;}
.nx-brg{font-size:8px;letter-spacing:4px;color:rgba(0,212,255,0.45);margin-bottom:14px;}
.nx-btitle{font-family:'Orbitron',monospace;font-size:15px;font-weight:700;letter-spacing:2px;}
.nx-bless{font-size:11px;color:rgba(255,255,255,0.75);line-height:1.7;margin-bottom:14px;}
.nx-bless code{color:#39ff8f;background:rgba(57,255,143,0.08);padding:1px 4px;border-radius:2px;}
.nx-bkw{display:flex;flex-direction:column;gap:5px;margin-bottom:18px;}
.nx-bki{display:flex;align-items:baseline;gap:10px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.05);}
.nx-bkw code{font-size:11px;font-weight:700;flex-shrink:0;min-width:80px;}
.nx-bkd{font-size:9px;color:rgba(255,255,255,0.45);}
.nx-bbtn{font-family:'Orbitron',monospace;font-size:10px;font-weight:700;letter-spacing:3px;padding:10px 28px;background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.5);color:#00d4ff;cursor:pointer;transition:all 0.18s;border-radius:2px;text-shadow:0 0 8px rgba(0,212,255,0.5);}
.nx-bbtn:hover{background:rgba(0,212,255,0.15);box-shadow:0 0 18px rgba(0,212,255,0.3);}
/* Knowledge vault */
.nx-vault{position:fixed;inset:0;z-index:995;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.78);opacity:0;pointer-events:none;transition:opacity 0.3s;}
.nx-vault.open{opacity:1;pointer-events:auto;}
.nx-vi{max-width:600px;width:92%;max-height:80vh;background:rgba(2,3,14,0.98);border:1px solid rgba(0,212,255,0.2);border-radius:4px;padding:26px 30px;font-family:'Share Tech Mono',monospace;overflow-y:auto;}
.nx-vtag{font-size:8px;letter-spacing:4px;color:rgba(0,212,255,0.45);margin-bottom:10px;}
.nx-vtitle{font-family:'Orbitron',monospace;font-size:14px;font-weight:700;color:#00d4ff;letter-spacing:2px;margin-bottom:16px;}
.nx-vs{font-size:9px;letter-spacing:2.5px;color:rgba(0,212,255,0.5);margin:14px 0 8px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.05);}
.nx-vr{display:flex;align-items:baseline;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);flex-wrap:wrap;}
.nx-vkw{font-size:11px;color:#00d4ff;flex-shrink:0;min-width:90px;}
.nx-vkw.err{color:#ff6060;}
.nx-vwhat{font-size:10px;color:rgba(255,255,255,0.55);flex:1;}
.nx-vex{font-size:9px;color:#39ff8f;background:rgba(57,255,143,0.06);padding:2px 5px;}
.nx-vclose{font-family:'Orbitron',monospace;font-size:9px;font-weight:700;letter-spacing:3px;padding:9px 22px;background:rgba(0,212,255,0.06);border:1px solid rgba(0,212,255,0.4);color:#00d4ff;cursor:pointer;transition:all 0.18s;margin-top:18px;border-radius:2px;}
.nx-vclose:hover{background:rgba(0,212,255,0.12);}
/* Modal patches */
.nx-modal-pts{padding:10px 14px;background:rgba(0,212,255,0.04);border:1px solid rgba(0,212,255,0.12);border-radius:3px;margin-bottom:14px;font-family:'Share Tech Mono',monospace;}
.nx-mps-hd{font-size:9px;letter-spacing:2px;color:rgba(0,212,255,0.55);margin-bottom:9px;}
.nx-ptrow{display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:9px;color:rgba(255,255,255,0.55);}
.nx-p\+{font-family:'Orbitron',monospace;font-size:10px;color:#00d4ff;text-shadow:0 0 5px rgba(0,212,255,0.5);}
.nx-p-{font-family:'Orbitron',monospace;font-size:10px;color:#ff3131;text-shadow:0 0 5px rgba(255,49,49,0.5);}
.nx-rb{padding:10px 14px;background:rgba(0,212,255,0.04);border:1px solid rgba(0,212,255,0.12);border-radius:3px;margin-bottom:14px;font-family:'Share Tech Mono',monospace;}
.nx-rb-hd{font-size:9px;letter-spacing:2px;color:rgba(0,212,255,0.55);margin-bottom:8px;}
.nx-rbt{height:6px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden;margin-bottom:5px;}
.nx-rbc{display:flex;justify-content:space-between;font-size:7px;color:rgba(255,255,255,0.2);letter-spacing:1px;}
@media(max-width:800px){.nx-wh,.nx-ub,.nx-mk{display:none;}.nx-cp{display:none;}.nx-hud{font-size:9px;padding:5px 9px;gap:8px;}.nx-hv,.nx-cv{font-size:12px;}}
`;
    document.head.appendChild(s);
  }

  // ═══ KEYBOARD BINDINGS ════════════════════════════════════════════════════
  function bindKeys(){
    document.addEventListener('keydown',e=>{
      const active=document.getElementById('screen-game')?.classList.contains('active');
      if(!active)return;
      if(e.key==='q'||e.key==='Q'){e.preventDefault();compilerBlast();}
      if(e.key==='e'||e.key==='E'){e.preventDefault();garbageCollect();}
      if(e.key==='s'||e.key==='S'){e.preventDefault();setWeapon('sniper');}
      if(e.key==='l'||e.key==='L'){e.preventDefault();setWeapon('fixer');}
      if(e.key==='t'||e.key==='T'){e.preventDefault();setWeapon('blazer');}
      if(e.code==='Space'&&e.target.tagName!=='INPUT'){e.preventDefault();bulletTime();}
    }, { capture: true });
  }

  // ═══ PATCH EXISTING FUNCTIONS ════════════════════════════════════════════
  function patchAll(){
    // finishDestroyWord
    const oFin=window.finishDestroyWord;
    if(oFin){window.finishDestroyWord=function(el){const ok=handleHit(el);if(!ok)return;onKill(el);oFin.call(this,el);const kw=(el.dataset.target||el.dataset.original||el.textContent||'').split('(')[0].split(' ')[0].trim();showConcept(kw);}; console.log("NEXUS: patch finishDestroyWord OK");}

    // updateTargetHUD
    const oHUD=window.updateTargetHUD;
    if(oHUD){window.updateTargetHUD=function(wo){oHUD.call(this,wo);if(wo){const k=(wo.target||wo.orig||'').split('(')[0].split(' ')[0].trim();showConcept(k);}else{hideConcept();}}; console.log("NEXUS: patch updateTargetHUD OK");}

    // goTo
    const oGoTo=window.goTo;
    if(oGoTo){window.goTo=function(id){oGoTo.call(this,id);if(id==='screen-game'){const lvl=window.GS?.levelId||1;setTimeout(()=>{document.querySelectorAll('.word-fall').forEach(el=>{if(!el.dataset.nxt)assignEnemy(el,lvl);});updatePts();updateCombo();updateDash();updateUlts();updateBanner(lvl);NS.combo=0;NS.streak=0;},320);}}; console.log("NEXUS: patch goTo OK");}

    // spawnWords
    const oSpawn=window.spawnWords;
    if(oSpawn){window.spawnWords=function(...a){oSpawn.apply(this,a);setTimeout(()=>{const lvl=window.GS?.levelId||1;document.querySelectorAll('.word-fall').forEach(el=>{if(!el.dataset.nxt)assignEnemy(el,lvl);});},110);}; console.log("NEXUS: patch spawnWords OK");}

    // onLevelComplete — show vault
    const oComp=window.onLevelComplete;
    if(oComp){window.onLevelComplete=async function(){const lvl=window.GS?.levelId||1;await oComp.call(this);setTimeout(()=>showVault(lvl),1900);}; console.log("NEXUS: patch onLevelComplete OK");}

    // apiStartGame — show briefing
    const oStart=window.apiStartGame;
    if(oStart){window.apiStartGame=async function(...a){await oStart.apply(this,a);if(window.GS?.mode==='classic'){const lvl=window.GS?.levelId||1;document.querySelectorAll('.word-fall').forEach(w=>w.style.animationPlayState='paused');showBriefing(lvl,()=>{document.querySelectorAll('.word-fall').forEach(w=>w.style.animationPlayState='running');});}}; console.log("NEXUS: patch apiStartGame OK");}

    // MutationObserver for breach detection
    const cv=document.getElementById('gameCanvas');
    if(cv){new MutationObserver(ms=>ms.forEach(m=>m.removedNodes.forEach(n=>{if(n.nodeType===1&&n.classList?.contains('word-fall')&&n.style?.opacity==='0')onBreach(n);}))).observe(cv,{childList:true}); console.log("NEXUS: patch BreachObserver OK");}
    console.log('⚡ NEXUS: ALL SYSTEMS PATCHED');
  }

  // ═══ LIVE SYNC ════════════════════════════════════════════════════════════
  setInterval(()=>{
    const p=window.GS?.sessionScore||0;
    updatePts();updateUlts();
    ['nx-htp-pts','nx-prof-pts','nx-rank-pts'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=p.toLocaleString();});
    const f=document.getElementById('nx-rbf');if(f)f.style.width=Math.min(100,(p/10000)*100)+'%';
  },500);

  // ═══ PUBLIC API ═══════════════════════════════════════════════════════════
  window.NX={
    weapon:setWeapon, blast:compilerBlast, gc:garbageCollect,
    dash:bulletTime, vault:showVault, brief:showBriefing,
  };

  // ═══ INIT ═════════════════════════════════════════════════════════════════
  function initNexus(){
    if(NS.ready)return; NS.ready=true;
    injectCSS();
    injectDOM();
    bindKeys();
    patchAll();
    document.documentElement.style.setProperty('--nx-beam',WEAPONS.sniper.color);
    document.documentElement.style.setProperty('--nx-glow',WEAPONS.sniper.glow);
    console.log('%c⚡ NEXUS LEARNING ENGINE v2.0','color:#00ffff;font-size:12px;font-weight:bold;background:#02030a;padding:3px 8px;');
  }

})();
