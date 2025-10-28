'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

type Win = { line: number[]; symbol: string; count: number; pay: number; win: number };

const COLS = 5;
const ROWS = 3;
const SYMBOLS = ['💎','7️⃣','🍋','🍒','🍀','⭐','💰','🍇','🍊','🔔'];
const FIXED = '🔷';
const LINE_COLORS = ['#22d3ee','#f59e0b','#a78bfa','#34d399','#f472b6','#38bdf8','#f43f5e'];
const wait = (ms:number)=>new Promise(r=>setTimeout(r,ms));
const randSym = () => SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)];

export default function RaspaySlots(){
  const [busy,setBusy]=useState(false);
  const [bet,setBet]=useState(100);
  const [credit,setCredit]=useState(500000);
  const [nonce,setNonce]=useState(1);
  const [turbo,setTurbo]=useState(false);
  const [autospin,setAutospin]=useState<number|null>(null);
  const clientSeed=useMemo(()=> 'roger-raspay', []);
  const [wins,setWins]=useState<Win[]>([]);
  const [totalWin,setTotalWin]=useState(0);
  const [mounted,setMounted]=useState(false);

  const [shake,setShake]=useState(false);
  const [midWin,setMidWin]=useState(false);
  const [bigWin,setBigWin]=useState(false);

  const [spinGrid,setSpinGrid]=useState<string[][]>(()=>Array.from({length:COLS},()=>Array.from({length:ROWS},()=>FIXED)));
  const [highlight,setHighlight]=useState<Record<string,boolean>>({});

  const gridWrapRef=useRef<HTMLDivElement|null>(null);
  const cellRefs=useRef<HTMLDivElement[][]>(Array.from({length:COLS},()=>Array.from({length:ROWS},()=>null as any)));
  const [segments,setSegments]=useState<Array<{x1:number,y1:number,x2:number,y2:number,color:string}>>([]);

  const spinIntervals=useRef<NodeJS.Timeout[]>([]);
  const stopTimeouts=useRef<NodeJS.Timeout[]>([]);
  const [flash,setFlash]=useState(false);

  // WebAudio
  const audioCtxRef=useRef<AudioContext|null>(null);
  const clickIntervalRef=useRef<NodeJS.Timeout|null>(null);
  function ensureAudio(){ if(!audioCtxRef.current){ const Ctx=(window as any).AudioContext||(window as any).webkitAudioContext; audioCtxRef.current=new Ctx(); } if(audioCtxRef.current.state==='suspended') audioCtxRef.current.resume(); }
  function beep(freq:number,durMs:number,type:OscillatorType='square',gain=0.035){ ensureAudio(); const ctx=audioCtxRef.current!; const o=ctx.createOscillator(); const g=ctx.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=gain; o.connect(g); g.connect(ctx.destination); const t=ctx.currentTime; o.start(t); g.gain.setValueAtTime(gain,t); g.gain.exponentialRampToValueAtTime(0.0001,t+durMs/1000); o.stop(t+durMs/1000); }
  function startSpinClicks(){ stopSpinClicks(); clickIntervalRef.current=setInterval(()=>{ const f=760+Math.random()*360; beep(f,28,'square',0.03); }, turbo?34:55); }
  function stopSpinClicks(){ if(clickIntervalRef.current) clearInterval(clickIntervalRef.current); clickIntervalRef.current=null; }
  const playStop=()=>{ beep(820,60,'triangle',0.06); setTimeout(()=>beep(560,80,'triangle',0.06),70); };
  const playWin=(big=false)=>{ (big?[880,1046,1318,1567,1760,1976]:[880,1046,880]).forEach((f,i)=>setTimeout(()=>beep(f,110,'sine',0.075),i*100)); };
  const playCoins=()=>{ for(let i=0;i<8;i++){ setTimeout(()=>{ beep(1200+Math.random()*400,90,'square',0.06); }, i*90); } };

  useEffect(()=>{ setMounted(true); },[]);
  useEffect(()=>{ if(!mounted) return; setSpinGrid(Array.from({length:COLS},()=>Array.from({length:ROWS},()=>randSym()))); },[mounted]);
  useEffect(()=>()=>{ stopAllTimers(); stopSpinClicks(); audioCtxRef.current?.close(); },[]);

  function stopAllTimers(){ spinIntervals.current.forEach(clearInterval); spinIntervals.current=[]; stopTimeouts.current.forEach(clearTimeout); stopTimeouts.current=[]; }

  function startSpinAnimation(){
    stopAllTimers(); setHighlight({}); setSegments([]); setShake(false); setMidWin(false); setBigWin(false);
    for(let c=0;c<COLS;c++){
      const t=setInterval(()=>{ setSpinGrid(prev=>{ const cp=prev.map(col=>[...col]); for(let r=0;r<ROWS;r++) cp[c][r]=randSym(); return cp; }); }, (turbo?34:48)+c*9);
      spinIntervals.current.push(t);
    }
    startSpinClicks();
  }

  function computeSegments(w:Win[]){
    const wrap=gridWrapRef.current; if(!wrap) return setSegments([]);
    const wrapRect=wrap.getBoundingClientRect(); const segs:Array<{x1:number,y1:number,x2:number,y2:number,color:string}>=[];
    w.forEach((win,idx)=>{ const color=LINE_COLORS[idx%LINE_COLORS.length];
      for(let i=0;i<win.count-1;i++){
        const from=cellRefs.current[i][win.line[i]]; const to=cellRefs.current[i+1][win.line[i+1]]; if(!from||!to) continue;
        const a=from.getBoundingClientRect(); const b=to.getBoundingClientRect();
        segs.push({
          x1:a.left+a.width/2-wrapRect.left, y1:a.top+a.height/2-wrapRect.top,
          x2:b.left+b.width/2-wrapRect.left, y2:b.top+b.height/2-wrapRect.top, color
        });
      }
    });
    setSegments(segs);
  }

  function stopWithResult(result:string[][], w:Win[], winAmt:number){
    stopAllTimers(); let d=0;
    for(let c=0;c<COLS;c++){
      const t=setTimeout(()=>{
        setSpinGrid(prev=>{ const cp=prev.map(col=>[...col]); for(let r=0;r<ROWS;r++) cp[c][r]=result[c][r]; return cp; });
        playStop();
        if(c===COLS-1){
          stopSpinClicks();
          setFlash(true); setTimeout(()=>setFlash(false),600);
          if(winAmt>0){
            const marks:Record<string,boolean>={}; for(const it of w){ for(let i=0;i<it.count;i++) marks[`${i}-${it.line[i]}`]=true; }
            setHighlight(marks); computeSegments(w);
            setShake(true); setMidWin(winAmt>=bet*5); const isBig=winAmt>=bet*15; setBigWin(isBig);
            playWin(isBig); playCoins();
            setTimeout(()=>setShake(false),620);
          }
        }
      }, d);
      stopTimeouts.current.push(t);
      d += turbo?105:185;
    }
  }

  async function doSpinOnce(){
    setBusy(true); setWins([]); setTotalWin(0); startSpinAnimation();
    const minSpin=wait(turbo?420:760);
    try{
      const req=fetch('/api/games/slot/spin',{ method:'POST', headers:{'content-type':'application/json'}, credentials:'include',
        body:JSON.stringify({ game_code:'raspay_slots', bet, nonce, client_seed:clientSeed }) });
      const [res]=await Promise.all([req,minSpin]); const data=await res.json(); if(data.error) throw new Error(data.error);
      setWins(data.wins||[]); setTotalWin(data.win||0); setNonce(n=>n+1); setCredit(p=>p-bet+(data.win||0));
      stopWithResult(data.grid as string[][], data.wins||[], data.win||0);
    }catch(e:any){ alert(e.message||'Error'); stopAllTimers(); stopSpinClicks(); setAutospin(null); }
    finally{ setTimeout(()=>setBusy(false),200); }
  }
  async function spin(){
    ensureAudio();
    if (navigator.vibrate) navigator.vibrate(90);
    await doSpinOnce();
  }

  useEffect(()=>{ if(autospin && !busy){ doSpinOnce().then(()=>setTimeout(()=>{ setAutospin(prev=>{ if(!prev) return null; const nxt=prev-1; return nxt>0?nxt:null; }); }, turbo?180:330)); } },[autospin,busy]);

  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 -z-30 bg-casino-velvet" />
      <div className="absolute inset-0 -z-20 aurora" />
      <div className="absolute inset-0 -z-10 sparks" />

      {bigWin && <BigWin amount={totalWin} onClose={()=>setBigWin(false)} />}

      <div className="max-w-6xl mx-auto p-6 pb-28 md:pb-10">
        {/* TICKER */}
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-ledge">
          <div className="ticker">
            <span>🎰 WIN THE GRAND JACKPOT • BONO x2 FREE SPINS • PAGO 3.2M ÚLTIMAS 24H • RASPAY PROVABLY FAIR •</span>
            <span>🎰 WIN THE GRAND JACKPOT • BONO x2 FREE SPINS • PAGO 3.2M ÚLTIMAS 24H • RASPAY PROVABLY FAIR •</span>
          </div>
        </div>

        {/* TITLE */}
        <div className="mb-6 flex items-center gap-3">
          <div className="glow-orb" />
          <h1 className="title-casino">Raspay Slots</h1>
        </div>

        {/* CABINET */}
        <div className={`cabinet-pro ${shake?'shake':''}`}>
          <div className="bevel" />
          <div className="edge-glow" />

          {/* Controls */}
          <div className="hidden md:flex items-center gap-3 mb-4 relative z-10">
            <label className="text-sm opacity-90">Apuesta
              <input type="number" value={bet} min={10} step={10} onChange={(e)=>setBet(parseInt(e.target.value))}
                     className="ml-2 w-28 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 outline-none"/>
            </label>
            <label className="flex items-center gap-2 text-sm ml-2">
              <input type="checkbox" checked={turbo} onChange={e=>setTurbo(e.target.checked)}/> Turbo
            </label>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm opacity-80">Autospin</span>
              {[10,25,50].map(n=>(
                <button key={n} onClick={()=>setAutospin(n)} disabled={busy||!!autospin}
                        className="chip">{`×${n}`}</button>
              ))}
              {autospin && <span className="text-xs opacity-80 ml-1">Restante: {autospin}</span>}
              {autospin && <button onClick={()=>setAutospin(null)} className="chip-danger">Detener</button>}
            </div>
          </div>

          {/* GRID + PAYLINES */}
          <div className="relative w-fit mx-auto" ref={gridWrapRef}>
            <div className="panel-shine" />
            <svg className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${(gridWrapRef.current?.clientWidth)||100} ${(gridWrapRef.current?.clientHeight)||100}`}
              preserveAspectRatio="none">
              {segments.map((s,i)=>(
                <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                      stroke={s.color} strokeWidth="8" strokeLinecap="round"
                      className="payline" />
              ))}
            </svg>

            <div className="grid grid-cols-5 gap-4 w-fit mx-auto" suppressHydrationWarning>
              {Array.from({length:COLS}).map((_,c)=>(
                <div key={c} className="reel-pro">
                  <div className="reel-halo"/>
                  <div className="reel-top"/>
                  {spinGrid[c].map((s,r)=>{
                    const isWin=!!highlight[`${c}-${r}`];
                    return (
                      <div key={r}
                        ref={(el)=>{ cellRefs.current[c][r]=el as HTMLDivElement; }}
                        className={`cell-pro ${isWin?'cell-win':''}`}>
                        {s}
                      </div>
                    );
                  })}
                  <div className="reel-bot"/>
                </div>
              ))}
            </div>
          </div>

          {/* HUD */}
          <div className={`hidden md:flex mt-6 hud ${midWin?'hud-win':''}`}>
            <Stat label="CREDIT" value={credit} color="text-cyan-300"/>
            <Stat label="BET" value={bet} color="text-amber-300"/>
            <Stat label="WIN" value={totalWin} color="text-emerald-300"/>
            <div className="ml-auto text-sm opacity-90">Provably Fair • RasPay</div>
          </div>
        </div>

        {/* JACKPOT BANNER */}
        <JackpotBanner />

        {/* DESKTOP SPIN */}
        <div className="hidden md:flex justify-center mt-4">
          <button onClick={spin} disabled={busy}
            className={`spin-xl ${flash?'flash':''} ${busy?'disabled':''}`}>
            <span className="txt">{busy?'GIRANDO…':'GIRAR 🎰'}</span>
            <span className="shine"/><span className="bg"/><span className="halo"/>
          </button>
        </div>
      </div>

      {/* MOBILE DOCK */}
      <div className="fixed md:hidden bottom-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-6xl px-4 pb-4">
          <div className="dock">
            <div className="p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-[11px] opacity-80">Apuesta</div>
                <input type="number" value={bet} min={10} step={10} onChange={(e)=>setBet(parseInt(e.target.value))}
                       className="mt-0.5 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none"/>
              </div>
              <div className="flex flex-col items-center justify-center gap-1">
                <label className="text-[11px] opacity-80 flex items-center gap-1">
                  <input type="checkbox" checked={turbo} onChange={e=>setTurbo(e.target.checked)}/> Turbo
                </label>
                <button onClick={()=>setAutospin(10)} disabled={busy||!!autospin} className="chip">Auto ×10</button>
              </div>
            </div>
            <div className="p-3 pt-0">
              <button onClick={spin} disabled={busy}
                className={`spin-lg ${flash?'flash':''} ${busy?'disabled':''}`}>
                <span className="txt">{busy?'GIRANDO…':'GIRAR 🎰'}</span>
                <span className="shine"/><span className="bg"/><span className="halo"/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STYLES (incluye banner con fuego) */}
      <style jsx global>{`
        .bg-casino-velvet{
          background:
            radial-gradient(1200px 650px at 50% 15%, rgba(217,70,239,.30), transparent 60%),
            radial-gradient(900px 700px at 10% 90%, rgba(34,211,238,.26), transparent 65%),
            radial-gradient(900px 700px at 95% 85%, rgba(245,158,11,.18), transparent 65%),
            linear-gradient(180deg,#0a0f1f 0%, #090e1b 45%, #070b16 100%);
        }
        .aurora{ background:
          radial-gradient(60% 120% at 50% -10%, rgba(255,255,255,.08), transparent 60%),
          conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,.06), transparent 18%, rgba(255,255,255,.06) 36%, transparent 54%, rgba(255,255,255,.06) 72%, transparent 90%, rgba(255,255,255,.06));
          mix-blend-mode: screen; animation: aSpin 12s linear infinite; opacity:.9; pointer-events:none; }
        @keyframes aSpin{ to{ transform: rotate(360deg);} }
        .sparks{
          background:
            radial-gradient(3px 3px at 20% 20%, #fff 60%, transparent 61%),
            radial-gradient(4px 4px at 80% 30%, #ffd166 70%, transparent 71%),
            radial-gradient(3px 3px at 30% 70%, #a855f7 60%, transparent 61%),
            radial-gradient(4px 4px at 70% 80%, #22d3ee 70%, transparent 71%);
          animation: float 8s ease-in-out infinite alternate; opacity:.8; pointer-events:none;
        }
        @keyframes float{ from{ transform:translateY(-10px)} to{ transform:translateY(10px)} }

        .title-casino{
          font-size: clamp(36px,4.5vw,56px);
          font-weight: 900;
          letter-spacing: .5px;
          background: linear-gradient(180deg,#eaffff 0%,#b6f0ff 40%,#6ee7ff 60%,#b6f0ff 100%);
          -webkit-background-clip: text; background-clip:text; color: transparent;
          -webkit-text-stroke: 1px rgba(17,24,39,.65);
          text-shadow: 0 2px 0 rgba(255,255,255,.9), 0 10px 20px rgba(0,0,0,.45), 0 0 30px rgba(99,102,241,.35);
        }
        .glow-orb{ width:34px;height:34px;border-radius:50%;
          background: radial-gradient(circle at 30% 30%, #fff, #ffd166 45%, #67e8f9 70%, #a78bfa 90%);
          box-shadow: 0 0 28px #ffe28a77, 0 0 36px #67e8f977; }

        .ticker{ display:flex; gap:40px; white-space:nowrap; font-weight:800; letter-spacing:.6px;
          color:#fff; text-shadow:0 0 16px rgba(255,255,255,.35);
          background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
          padding:.6rem 0; overflow:hidden; position:relative; }
        .ticker>span{ animation: marquee 18s linear infinite; padding-left:40px; }
        @keyframes marquee{ to{ transform: translateX(-100%);} }

        .cabinet-pro{ position:relative; border-radius:28px; padding:22px;
          background: linear-gradient(180deg, rgba(24,32,56,.96), rgba(10,14,30,.98));
          border:1px solid rgba(255,255,255,.10);
          box-shadow: 0 30px 80px rgba(0,0,0,.65), 0 0 60px rgba(59,130,246,.20), 0 0 60px rgba(168,85,247,.20), inset 0 0 0 1px rgba(255,255,255,.05); }
        .cabinet-pro.shake{ animation: shake .6s ease; }
        @keyframes shake{0%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}100%{transform:translateX(0)}}

        .bevel{ position:absolute; inset:6px; border-radius:22px; pointer-events:none;
          background: linear-gradient(180deg, rgba(255,255,255,.08), transparent 35%, transparent 65%, rgba(255,255,255,.08)),
                      repeating-linear-gradient(135deg, rgba(255,255,255,.03) 0 8px, rgba(255,255,255,.01) 8px 16px); mix-blend-mode: overlay; }
        .edge-glow{ position:absolute; inset:-16px; border-radius:40px; filter: blur(16px); pointer-events:none;
          background: radial-gradient(220px 120px at 0% 0%, rgba(168,85,247,.45), transparent 60%),
                      radial-gradient(220px 120px at 100% 0%, rgba(34,211,238,.45), transparent 60%),
                      radial-gradient(240px 140px at 50% 100%, rgba(245,158,11,.35), transparent 65%); }

        .panel-shine{ position:absolute; inset:0; border-radius:18px;
          background: radial-gradient(80% 200% at 50% -80%, rgba(255,255,255,.08), transparent 60%),
                      linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,0)); pointer-events:none; }

        .reel-pro{ position:relative; width:8rem; height:16rem; padding:.6rem; border-radius:18px;
          background: linear-gradient(180deg, rgba(7,12,28,.9), rgba(5,9,20,.96));
          border:1px solid rgba(255,255,255,.10);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), 0 16px 40px rgba(0,0,0,.55);
          display:flex; flex-direction:column; gap:.7rem; align-items:center; justify-content:center; overflow:hidden; }
        .reel-halo{ position:absolute; inset:-2px; border-radius:20px; filter: blur(12px);
          background: radial-gradient(120% 60% at 50% -10%, rgba(255,255,255,.18), transparent 60%); pointer-events:none; }
        .reel-top,.reel-bot{ position:absolute; left:0; right:0; height:44px; pointer-events:none; }
        .reel-top{ top:0; background:linear-gradient(180deg, rgba(255,255,255,.16), transparent); }
        .reel-bot{ bottom:0; background:linear-gradient(0deg, rgba(255,255,255,.10), transparent); }

        .cell-pro{ flex:1; width:100%; border-radius:14px; display:flex; align-items:center; justify-content:center;
          font-size:2.05rem;
          background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.06)),
                     repeating-linear-gradient(45deg, rgba(255,255,255,.04) 0 8px, rgba(0,0,0,.00) 8px 16px);
          border:1px solid rgba(255,255,255,.10);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.05);
          transition: transform .12s ease, box-shadow .2s ease, background .2s ease; }
        .cell-win{ box-shadow:0 0 28px rgba(16,185,129,.7), inset 0 0 0 1px rgba(16,185,129,.7);
          background:linear-gradient(180deg, rgba(16,185,129,.25), rgba(16,185,129,.18)); animation:bounce .55s ease; }
        @keyframes bounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}

        .payline{ stroke-dasharray:14 10; animation: dash 1.05s linear infinite; filter: drop-shadow(0 0 10px rgba(255,255,255,.9)); }
        @keyframes dash{ to{ stroke-dashoffset:-24; } }

        .hud{ border:1px solid rgba(255,255,255,.12); border-radius:16px; padding:.7rem 1rem;
          backdrop-filter: blur(8px); background:rgba(0,0,0,.38); align-items:center; gap:1.2rem; }
        .hud-win{ background:rgba(16,185,129,.18); box-shadow:0 0 30px rgba(16,185,129,.35); }

        .chip{ padding:.35rem .6rem; border-radius:10px; border:1px solid rgba(255,255,255,.16); background:rgba(255,255,255,.08); font-size:.85rem; }
        .chip-danger{ padding:.35rem .6rem; border-radius:10px; border:1px solid rgba(248,113,113,.5); background:rgba(248,113,113,.22); color:#fecaca; font-size:.8rem; }

        /* Spin Buttons */
        .spin-xl,.spin-lg{ position:relative; border:none; color:#0b0b0b; font-weight:900; letter-spacing:.5px;
          display:inline-flex; align-items:center; justify-content:center; overflow:hidden; }
        .spin-xl{ width:520px; height:74px; border-radius:26px; }
        .spin-lg{ width:100%; height:64px; border-radius:22px; }
        .spin-xl .bg,.spin-lg .bg{ position:absolute; inset:0; border-radius:inherit;
          background: linear-gradient(90deg,#ffe066 0%,#ffd166 20%,#ffb86b 60%,#ffa94d 100%); }
        .spin-xl .shine,.spin-lg .shine{ position:absolute; inset:0; border-radius:inherit;
          background: radial-gradient(60% 120% at 50% -10%, rgba(255,255,255,.95), transparent); mix-blend-mode: screen; }
        .spin-xl .halo,.spin-lg .halo{ position:absolute; inset:-2px; border-radius:inherit; filter: blur(18px);
          background: linear-gradient(90deg, rgba(255,255,255,.4), rgba(255,214,102,.7), rgba(255,255,255,.4)); opacity:.95; pointer-events:none; }
        .spin-xl .txt,.spin-lg .txt{ position:relative; z-index:2; text-shadow:0 2px 0 rgba(255,255,255,.85); }
        .spin-xl:not(.disabled), .spin-lg:not(.disabled){ animation:pulse 1.2s ease-in-out infinite; }
        .spin-xl:active, .spin-lg:active{ transform: scale(.98); }
        .disabled{ opacity:.6; animation:none; }
        @keyframes pulse{ 0%,100%{ transform:scale(1);} 50%{ transform:scale(1.02);} }
        .spin-xl.flash, .spin-lg.flash { animation: flashBtn 0.6s ease; }
        @keyframes flashBtn { 40%{ box-shadow:0 0 60px rgba(255,255,255,0.95),0 0 120px rgba(255,214,102,0.9);} }

        /* Dock móvil */
        .dock{ border:1px solid rgba(255,255,255,.18); border-radius:28px; background:rgba(0,0,0,.66); backdrop-filter: blur(14px);
          box-shadow:0 -12px 40px rgba(0,0,0,.6), 0 0 28px rgba(168,85,247,.40), 0 0 28px rgba(34,211,238,.35), 0 0 28px rgba(245,158,11,.40); }
      `}</style>
    </div>
  );
}

/* === JACKPOT BANNER CON FUEGO === */
function JackpotBanner(){
  return (
    <div className="relative mt-6 mb-4">
      <div className="banner-wrap">
        <div className="flames" aria-hidden />
        <div className="banner-text">WIN THE GRAND JACKPOT!</div>
      </div>
      <style jsx>{`
        .banner-wrap{
          position:relative; display:flex; align-items:center; justify-content:center;
          border-radius:22px; overflow:hidden;
          border:1px solid rgba(255,255,255,.12);
          background: linear-gradient(180deg, rgba(9,14,28,.9), rgba(7,10,20,.95));
          box-shadow: 0 18px 50px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.05);
          min-height: 92px;
        }
        .banner-text{
          position:relative; z-index:2;
          font-weight: 1000;
          letter-spacing: 1px;
          font-size: clamp(28px, 5vw, 44px);
          padding: 10px 18px;
          background: linear-gradient(180deg,#fff9e6 0%, #ffe08a 35%, #ffc14d 65%, #ff9f2a 100%);
          -webkit-background-clip:text; background-clip:text; color:transparent;
          text-shadow:
            0 2px 0 rgba(255,255,255,.95),
            0 4px 0 #b45309,
            0 10px 18px rgba(0,0,0,.55),
            0 0 28px rgba(255,196,86,.55);
          -webkit-text-stroke: 1px #3b1f0a;
        }
        /* Llamas animadas detrás del texto */
        .flames{
          position:absolute; inset:0; z-index:1; opacity:.9; pointer-events:none;
          background:
            radial-gradient(120px 50px at 10% 100%, rgba(255,185,60,.9), transparent 60%),
            radial-gradient(160px 60px at 40% 100%, rgba(255,110,40,.85), transparent 62%),
            radial-gradient(140px 50px at 70% 100%, rgba(255,185,60,.9), transparent 60%),
            radial-gradient(120px 55px at 90% 100%, rgba(255,110,40,.85), transparent 62%);
          mask: linear-gradient(#0000, #000 20% 80%, #0000 100%);
          animation: rise 2.6s ease-in-out infinite alternate;
          filter: blur(6px) saturate(1.2);
        }
        @keyframes rise{
          from { transform: translateY(6px) scaleY(0.95); }
          to   { transform: translateY(-6px) scaleY(1.05); }
        }
      `}</style>
    </div>
  );
}

/* Big Win Overlay */
function BigWin({amount,onClose}:{amount:number; onClose:()=>void}){
  const coins=Array.from({length:42});
  useEffect(()=>{ const t=setTimeout(onClose,2500); return()=>clearTimeout(t); },[onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm"/>
      <div className="relative px-8 py-6 rounded-3xl border border-yellow-300/60 text-black
                      bg-gradient-to-b from-yellow-300 via-amber-200 to-amber-300 shadow-[0_0_80px_rgba(245,158,11,0.6)]">
        <div className="text-center">
          <div className="text-4xl font-black drop-shadow">BIG WIN!</div>
          <div className="mt-1 text-2xl font-extrabold">+{amount}</div>
        </div>
        <div className="pointer-events-none absolute -inset-1 rounded-[28px] bg-gradient-to-r from-yellow-300/40 via-white/25 to-yellow-300/40 blur-xl"/>
      </div>
      {coins.map((_,i)=>(
        <span key={i} className="absolute w-5 h-5 rounded-full coin"
          style={{ left:`${(i*233)%100}%`, animationDelay:`${(i%12)*0.11}s`, top:'-20px'}}/>
      ))}
      <style jsx>{`
        @keyframes coinFall{ 0%{ transform: translateY(-40px) rotate(0deg); opacity:0; }
                             15%{ opacity:1; }
                             100%{ transform: translateY(110vh) rotate(540deg); opacity:0; } }
        .coin{
          background:
            radial-gradient(circle at 35% 35%, #fff 6%, transparent 7%),
            radial-gradient(circle at 60% 40%, rgba(255,255,255,.6) 12%, transparent 13%),
            radial-gradient(circle at 50% 50%, #ffd54a 60%, #f59e0b 62%);
          box-shadow:0 0 12px rgba(245,158,11,.7); animation: coinFall 2.4s ease-in forwards;
        }
      `}</style>
    </div>
  );
}

function Stat({label,value,color}:{label:string; value:number; color:string}){
  return (<div className="flex items-baseline gap-2">
    <span className={`text-xs font-semibold tracking-wider ${color}`}>{label}</span>
    <span className="text-lg font-extrabold">{value}</span>
  </div>);
}
