'use client';
import { useEffect, useRef, useState } from 'react';

/** ====== Tipos & Constantes ====== */
type Cell = { sym: string; multi?: number };
type Win = { lineIdx: number; count: number; sym: string; pay: number; coords: [number,number][] };

const COLS=5, ROWS=3;
const ANGEL='😇', SINNER='😈', WILD='🔥', SCAT='🧿';
const HIGH=['💖','👑','🌹']; const LOW=['A','K','Q','J'];
const REEL_SYMBOLS=[ANGEL,SINNER,WILD,SCAT,...HIGH,...LOW];
const WILD_MULTIS=[2,3,5,7];
const BASE_PAY: Record<string,number[]> = {
  [ANGEL]:[0,0,10,40,200], [SINNER]:[0,0,10,40,200],
  [WILD]: [0,0,12,50,250], [SCAT]: [0,0,0,0,0],
  '💖':[0,0,8,30,120],'👑':[0,0,8,30,120],'🌹':[0,0,6,24,100],
  'A':[0,0,4,16,60],'K':[0,0,4,16,60],'Q':[0,0,3,12,50],'J':[0,0,3,12,50],
};
const LINES=[[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2]];
const rnd=(n:number)=>Math.floor(Math.random()*n);
const choice=<T,>(a:T[])=>a[rnd(a.length)];
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));

export default function AngelVsSinner(){
  const [busy,setBusy]=useState(false);
  const [bet,setBet]=useState(100);
  const [credit,setCredit]=useState(500000);
  const [freeSpins,setFreeSpins]=useState(0);
  const [totalWin,setTotalWin]=useState(0);
  const [flash,setFlash]=useState(false);
  const [isSpinning,setIsSpinning]=useState(false);

  const [grid,setGrid]=useState<Cell[][]>(()=>Array.from({length:COLS},()=>Array.from({length:ROWS},()=>({sym:'❔'}))));
  const wrapRef=useRef<HTMLDivElement|null>(null);
  const cellRefs=useRef<HTMLDivElement[][]>(Array.from({length:COLS},()=>Array.from({length:ROWS},()=>null as any)));
  const [segments,setSegments]=useState<Array<{x1:number,y1:number,x2:number,y2:number}>>([]);

  // Timers animación
  const spinIntervals=useRef<NodeJS.Timeout[]>([]);
  const stopTimeouts=useRef<NodeJS.Timeout[]>([]);

  // Audio simple
  const ctxRef=useRef<AudioContext|null>(null);
  function audio(){ if(!ctxRef.current){ const C=(window as any).AudioContext||(window as any).webkitAudioContext; ctxRef.current=new C(); } if(ctxRef.current.state==='suspended') ctxRef.current.resume(); return ctxRef.current; }
  function beep(f=880,d=90,t:OscillatorType='sine',g=0.05){ const ctx=audio(); const o=ctx.createOscillator(); const gain=ctx.createGain(); o.type=t; o.frequency.value=f; gain.gain.value=g; o.connect(gain); gain.connect(ctx.destination); const now=ctx.currentTime; o.start(now); gain.gain.exponentialRampToValueAtTime(0.0001, now+d/1000); o.stop(now+d/1000); }

  useEffect(()=>{
    setGrid(Array.from({length:COLS},()=>Array.from({length:ROWS},()=>({sym:choice([ANGEL,SINNER,...HIGH,...LOW])}))));
    return ()=>{ stopAllTimers(); ctxRef.current?.close(); };
  },[]);

  function stopAllTimers(){
    spinIntervals.current.forEach(clearInterval); spinIntervals.current=[];
    stopTimeouts.current.forEach(clearTimeout); stopTimeouts.current=[];
  }

  // RNG de resultado (prototipo)
  function spinRNG(): {grid:Cell[][]; scatters:number} {
    const g:Cell[][]=Array.from({length:COLS},()=>Array.from({length:ROWS},()=>({sym:choice(REEL_SYMBOLS)})));
    for(let c=0;c<COLS;c++) for(let r=0;r<ROWS;r++) if(g[c][r].sym===WILD) g[c][r].multi=choice(WILD_MULTIS);
    const expandCount = Math.random()<0.6?1:(Math.random()<0.35?2:0);
    const used=new Set<number>();
    for(let i=0;i<expandCount;i++){ const col=rnd(COLS); if(used.has(col)) continue; used.add(col); const who=Math.random()<0.5?ANGEL:SINNER; for(let r=0;r<ROWS;r++) g[col][r]={sym:who}; }
    if(Math.random()<0.35){ const rr=rnd(ROWS); g[2][rr]={sym:WILD,multi:choice(WILD_MULTIS)}; }
    let scat=0; for(let c=0;c<COLS;c++)for(let r=0;r<ROWS;r++) if(g[c][r].sym===SCAT) scat++;
    return {grid:g, scatters:scat};
  }

  // Evaluación de líneas
  function evaluate(g:Cell[][]){
    const wins:Win[]=[];
    for(let li=0;li<LINES.length;li++){
      const path=LINES[li];
      let base:string|undefined;
      for(let c=0;c<COLS;c++){ const s=g[c][path[c]].sym; if(s!==WILD && s!==SCAT){ base=s; break; } }
      if(!base) continue;
      let cnt=0, coords:[number,number][]=[]; let mult=1;
      for(let c=0;c<COLS;c++){ const cell=g[c][path[c]]; if(cell.sym===base||cell.sym===WILD){ cnt++; coords.push([c,path[c]]); if(cell.sym===WILD&&cell.multi) mult*=cell.multi; } else break; }
      if(cnt>=3){ const pay=(BASE_PAY[base]??[0,0,3,10,40])[cnt]; const linePay=Math.round(pay*(bet/10)*mult); if(linePay>0) wins.push({lineIdx:li,count:cnt,sym:base,pay:linePay,coords}); }
    }
    const winTotal=wins.reduce((a,b)=>a+b.pay,0);
    return {wins, winTotal};
  }

  function drawSegments(wins:Win[]){
    const wrap=wrapRef.current; if(!wrap) return setSegments([]);
    const rect=wrap.getBoundingClientRect(); const segs:Array<{x1:number,y1:number,x2:number,y2:number}>=[];
    for(const w of wins){
      for(let i=0;i<w.count-1;i++){
        const [c1,r1]=w.coords[i], [c2,r2]=w.coords[i+1];
        const a=cellRefs.current[c1][r1].getBoundingClientRect(), b=cellRefs.current[c2][r2].getBoundingClientRect();
        segs.push({ x1:a.left+a.width/2-rect.left, y1:a.top+a.height/2-rect.top, x2:b.left+b.width/2-rect.left, y2:b.top+b.height/2-rect.top });
      }
    }
    setSegments(segs);
  }

  /** ==== Animación de giro por columnas ==== */
  function startSpinAnimation(){
    stopAllTimers();
    setIsSpinning(true);
    setSegments([]);
    for(let c=0;c<COLS;c++){
      const interval = setInterval(()=>{
        setGrid(prev=>{
          const next = prev.map(col=>col.map(cell=>({...cell})));
          for(let r=0;r<ROWS;r++){
            const sym = choice(REEL_SYMBOLS);
            next[c][r] = { sym, ...(sym===WILD ? { multi: choice(WILD_MULTIS)} : {}) };
          }
          return next;
        });
      }, 48 + c*10);
      spinIntervals.current.push(interval);
    }
  }

  function stopWithResult(finalGrid:Cell[][]){
    let delay=0;
    for(let c=0;c<COLS;c++){
      const t=setTimeout(()=>{
        setGrid(prev=>{
          const cp = prev.map(col=>col.map(cell=>({...cell})));
          for(let r=0;r<ROWS;r++) cp[c][r] = finalGrid[c][r];
          return cp;
        });
        beep(820,70,'triangle',0.06); setTimeout(()=>beep(560,90,'triangle',0.06),70);
        if(c===COLS-1){ stopAllTimers(); setIsSpinning(false); }
      }, delay);
      stopTimeouts.current.push(t);
      delay += 140;
    }
  }

  async function spin(){
    if(busy) return;
    setBusy(true); setTotalWin(0);
    if(freeSpins<=0) setCredit(c=>c-bet);

    const clicks = setInterval(()=>beep(700+Math.random()*250,24,'square',0.03), 55);
    startSpinAnimation();

    const min=950, t0=Date.now();
    const {grid:result, scatters} = spinRNG();
    const rest=Math.max(0, min-(Date.now()-t0)); await wait(rest);

    clearInterval(clicks);
    stopWithResult(result);

    setTimeout(()=>{
      const ev = evaluate(result);
      if(ev.winTotal>0){
        setCredit(c=>c+ev.winTotal);
        setTotalWin(ev.winTotal);
        [880,1046,1318].forEach((f,i)=>setTimeout(()=>beep(f,120,'sine',0.075),i*100));
        setFlash(true); setTimeout(()=>setFlash(false),550);
      }
      if(scatters>=3){ setFreeSpins(fs=>fs>0?fs+2:10); } else if(freeSpins>0){ setFreeSpins(fs=>Math.max(0,fs-1)); }
      setTimeout(()=>drawSegments(ev.wins), 30);
      setBusy(false);
    }, 160*COLS + 20);
  }

  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      {/* BACKGROUND cielo/infierno */}
      <div className="abs bg-split" />
      <div className="abs clouds" />
      <div className="abs heat" />

      <div className="max-w-[1180px] mx-auto px-4 md:px-6 py-6">
        {/* Header simple */}
        <div className="flex items-center gap-3 mb-4">
          <div className="logo-stakeish">Stake</div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="pill">In Play • BTC</span>
            <span className="pill">Billetera</span>
          </div>
        </div>

        {/* CABINET */}
        <div className="cabinet-avs">
          <div className="cabinet-inner grid grid-cols-12 gap-4">
            {/* REELS (izquierda) */}
            <div className="col-span-12 lg:col-span-8">
              <div className="reels-frame ornate-frame">
                <div className="reels-gold" />
                <div className="reels-gold2" />
                <div className="relative" ref={wrapRef}>
                  {/* Líneas de pago */}
                  <svg className="abs w-full h-full pointer-events-none"
                    viewBox={`0 0 ${(wrapRef.current?.clientWidth)||100} ${(wrapRef.current?.clientHeight)||100}`} preserveAspectRatio="none">
                    {segments.map((s,i)=>(
                      <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                            stroke="#ffd166" strokeWidth="8" strokeLinecap="round" className="dash" />
                    ))}
                  </svg>

                  {/* Separadores dorados */}
                  <div className="sep-lines pointer-events-none" />

                  {/* Reels sin gap (panel único) */}
                  <div className={`reels-grid grid grid-cols-5 gap-0 ${isSpinning?'spinning':''}`}>
                    {Array.from({length:COLS}).map((_,c)=>(
                      <div key={c} className="reel-col">
                        <div className={`reel-body ${isSpinning?'is-spinning':''}`}>
                          {Array.from({length:ROWS}).map((__,r)=>{
                            const cell=grid[c][r];
                            const isWild=cell.sym===WILD; const isScat=cell.sym===SCAT; const isChar=(cell.sym===ANGEL||cell.sym===SINNER);
                            return (
                              <div key={r} ref={el=>{cellRefs.current[c][r]=el as HTMLDivElement;}}
                                   className={`slot-cell ${isChar?'cell-char':''} ${isScat?'cell-scat':''}`}>
                                <span className="emoji">{cell.sym}</span>
                                {isWild && <span className="badge-gold">×{cell.multi}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* HUD + banda inferior */}
              <div className="hud mt-3">
                <Stat label="CREDIT" value={credit} color="text-cyan-300"/>
                <Stat label="BET" value={bet} color="text-amber-300"/>
                <Stat label="WIN" value={totalWin} color="text-emerald-300"/>
                {freeSpins>0 && <span className="ml-auto pill pill-green">FREE SPINS: {freeSpins}</span>}
              </div>

              <div className="hint mt-3">HIT 💙 TO GET EXPANDED WILDS WITH MULTIPLIERS</div>
            </div>

            {/* POSTER (derecha) */}
            <div className="col-span-12 lg:col-span-4">
              <div className="poster">
                <div className="poster-bg" />
                <div className="poster-title">
                  <span className="angel">Angel</span>
                  <span className="vs"> vs </span>
                  <span className="sinner">Sinner</span>
                </div>
                <div className="poster-sub">Eternal Battle</div>

                <div className="poster-characters">
                  <span className="big-emoji left">😈</span>
                  <span className="big-emoji right">😇</span>
                </div>

                {/* Botón spin circular */}
                <button onClick={spin} disabled={busy} className={`spin-circle ${busy?'disabled':''} ${flash?'flash':''}`}>
                  <span className="icon">↻</span>
                </button>

                <div className="volatility">
                  <span>VOLATILITY</span>
                  <span className="bolts">⚡⚡⚡⚡⚡</span>
                </div>

                <div className="dontshow">
                  <label>
                    <input type="checkbox" /> DON'T SHOW NEXT TIME
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ESTILOS */}
      <style jsx global>{`
        .abs{position:absolute;inset:0}

        /* ===== Fondo cielo/infierno ===== */
        .bg-split{
          background:
            radial-gradient(1200px 800px at 20% 20%, rgba(99,102,241,.28), transparent 60%),
            radial-gradient(1200px 800px at 80% 80%, rgba(34,197,94,.18), transparent 60%),
            linear-gradient(90deg,#6ecbff 0%,#c8f0ff 35%,#ffb26b 65%,#ff7b3a 100%);
          filter:saturate(1.1);
        }
        .clouds{
          background:
            radial-gradient(60% 120% at 30% 10%, rgba(255,255,255,.55), transparent 60%),
            radial-gradient(70% 100% at 75% 15%, rgba(255,255,255,.45), transparent 60%);
          mix-blend-mode:screen; opacity:.6;
        }
        .heat{
          background:
            radial-gradient(60% 70% at 10% 100%, rgba(255,140,0,.35), transparent 60%),
            radial-gradient(60% 70% at 90% 100%, rgba(255,80,0,.35), transparent 60%);
          opacity:.9; pointer-events:none;
        }

        /* ===== header pills ===== */
        .logo-stakeish{font-weight:900;letter-spacing:.5px;color:#fff;opacity:.8}
        .pill{border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);padding:.25rem .5rem;border-radius:.75rem}
        .pill-green{border-color:#86efac66;background:#16a34a22}

        /* ===== Cabinet ===== */
        .cabinet-avs{border-radius:18px; border:1px solid rgba(255,255,255,.12);
          background:linear-gradient(180deg, rgba(14,21,38,.95), rgba(8,12,24,.98));
          box-shadow:0 25px 80px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.05);
          padding:14px;}
        .cabinet-inner{position:relative}

        /* Marco general base */
        .reels-frame{position:relative;border-radius:18px;overflow:hidden}
        .reels-gold{position:absolute;inset:0;border-radius:18px;pointer-events:none;
          background:linear-gradient(180deg, rgba(255,214,120,.18), rgba(255,214,120,.06));}
        .reels-gold2{position:absolute;inset:-10px;border-radius:26px;filter:blur(12px);pointer-events:none;
          background:radial-gradient(200px 80px at 5% 0%, rgba(255,196,86,.45), transparent 60%),
                     radial-gradient(220px 100px at 95% 0%, rgba(255,236,170,.35), transparent 60%);}

        /* ===== Reels ALTOS estilo Stake ===== */
        :root{ --reelH: 560px; --cellGap: .55rem; }
        @media (max-width: 1024px){ :root{ --reelH: 460px; } }
        @media (max-width: 640px){ :root{ --reelH: 380px; } }

        .reels-grid{ display:grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap:0; }
        .reels-grid.spinning .slot-cell{ filter: blur(0.8px) brightness(1.05); }
        .reel-col{display:flex;flex-direction:column;align-items:stretch}
        .reel-body{
          height: var(--reelH);
          gap: var(--cellGap);
          display: flex;
          flex-direction: column;
          padding: 12px 10px;
          border-radius: 12px;
          background: transparent;
          border: none;
          box-shadow: none;
          will-change: transform, filter;
        }
        .reel-body.is-spinning{ animation: subtleVert .5s ease-in-out infinite alternate; }
        @keyframes subtleVert { from{ transform: translateY(-1px)} to{ transform: translateY(1px) } }

        .slot-cell{
          flex:none;
          height: calc( (var(--reelH) - (2 * var(--cellGap)) ) / 3 );
          border-radius: 12px;
          position: relative;
          display: flex; align-items: center; justify-content: center;
          background:
            radial-gradient(140% 90% at 50% -20%, rgba(255,255,255,.20), transparent 60%),
            linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.05));
          border:1px solid rgba(255,255,255,.16);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.05);
        }
        .cell-char{ box-shadow: inset 0 0 0 1px rgba(255,255,255,.08), 0 0 18px rgba(168,85,247,.25); }
        .cell-scat{ box-shadow: 0 0 26px #67e8f988, inset 0 0 0 1px rgba(59,130,246,.35); }

        .emoji{ font-size: 2.75rem; }
        .badge-gold{position:absolute;bottom:6px;right:6px;font-size:.9rem;font-weight:900;color:#111;
          padding:.1rem .35rem;border-radius:8px;background:linear-gradient(180deg,#fff9e6,#ffd166,#ffa94d);box-shadow:0 0 12px rgba(255,214,102,.8)}

        .dash{stroke-dasharray:14 10;animation:dash 1.05s linear infinite;filter:drop-shadow(0 0 10px rgba(255,255,255,.9))}
        @keyframes dash{to{stroke-dashoffset:-24}}

        .hud{display:flex;align-items:center;gap:1rem;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:.6rem .8rem;background:rgba(0,0,0,.35)}
        .hint{border:2px solid #d8a84a;border-radius:12px;padding:.5rem 1rem;text-align:center;
          color:#ffd166;font-weight:900;letter-spacing:.6px;background:linear-gradient(180deg,#3a1a00,#210d00)}

        /* ===== SKIN: MARCO DORADO + SEPARADORES ===== */
        .ornate-frame{
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          background: linear-gradient(180deg, #3c0a6c 0%, #2c0a59 45%, #24084a 100%);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), 0 18px 48px rgba(0,0,0,.55);
        }
        .ornate-frame::before{
          content:''; position:absolute; inset:0; border-radius: 18px; pointer-events:none;
          background: linear-gradient(180deg, rgba(255,214,120,.28), rgba(255,214,120,.10));
          border: 3px solid #d8a84a;
          box-shadow: inset 0 0 0 3px rgba(255,255,255,.05), 0 0 28px rgba(255,196,86,.25), 0 0 80px rgba(255,214,102,.18);
        }
        .ornate-frame::after{
          content:''; position:absolute; inset:-14px; border-radius: 26px; filter: blur(10px); pointer-events: none;
          background:
            radial-gradient(220px 120px at 0% 0%, rgba(255,224,161,.55), transparent 60%),
            radial-gradient(220px 120px at 100% 0%, rgba(255,236,180,.45), transparent 60%),
            radial-gradient(220px 120px at 0% 100%, rgba(255,205,120,.45), transparent 60%),
            radial-gradient(220px 120px at 100% 100%, rgba(255,190,90,.35), transparent 60%);
        }
        .sep-lines{
          position:absolute; inset:10px; border-radius: 12px;
          background: repeating-linear-gradient(
            to right,
            transparent 0 calc(20% - 1.5px),
            #f2cc67 calc(20% - 1.5px) calc(20% + 1.5px),
            transparent calc(20% + 1.5px) 20%
          );
          box-shadow: inset 0 0 22px rgba(255,214,102,.18);
          pointer-events:none;
        }

        /* ===== Poster ===== */
        .poster{position:relative;border-radius:14px;overflow:hidden;min-height:520px;border:2px solid #d8a84a;background:#1a0f0a}
        .poster-bg{position:absolute;inset:0;background:
          linear-gradient(180deg,#8bd9ff 0%,#dff7ff 40%,#ffb26b 70%,#ff7b3a 100%);
          filter:saturate(1.1)}
        .poster-title{position:relative;z-index:2;margin-top:18px;text-align:center;font-weight:1000;letter-spacing:1px}
        .poster-title .angel{font-size:clamp(26px,3.4vw,36px);background:linear-gradient(180deg,#ffffff,#bde8ff,#70e0ff);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;text-shadow:0 2px 0 #fff,0 6px 18px rgba(0,0,0,.35);-webkit-text-stroke:1px #234}
        .poster-title .vs{font-size:clamp(20px,2.8vw,28px);color:#fff;text-shadow:0 0 18px rgba(255,255,255,.6)}
        .poster-title .sinner{font-size:clamp(26px,3.4vw,36px);background:linear-gradient(180deg,#fff2b0,#ffc162,#ff933a);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;text-shadow:0 2px 0 #fff,0 6px 18px rgba(0,0,0,.35);-webkit-text-stroke:1px #531f0b}
        .poster-sub{position:relative;z-index:2;text-align:center;margin-top:2px;font-weight:900;letter-spacing:.8px;color:#2a0; text-shadow:0 2px 0 #fff8}
        .poster-characters{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:space-between;padding:0 16px 86px}
        .big-emoji{font-size:90px;filter:drop-shadow(0 8px 18px rgba(0,0,0,.4))}
        .big-emoji.left{transform:translateY(6px)}
        .big-emoji.right{transform:translateY(2px)}

        .spin-circle{position:absolute;left:50%;bottom:120px;transform:translateX(-50%);
          width:110px;height:110px;border-radius:9999px;border:6px solid #fff;
          background:radial-gradient(100% 100% at 50% 0%, #ffffff, #ffd166 60%, #ffa94d);
          box-shadow:0 0 30px rgba(255,255,255,.6),0 0 80px rgba(255,214,102,.55);display:flex;align-items:center;justify-content:center;font-weight:1000}
        .spin-circle .icon{font-size:42px;color:#1a1208;text-shadow:0 2px 0 #fff}
        .spin-circle.disabled{opacity:.6;filter:grayscale(.1)}
        .spin-circle.flash{animation:btnflash .6s ease}
        @keyframes btnflash{40%{box-shadow:0 0 60px rgba(255,255,255,.95),0 0 120px rgba(255,214,102,.9)}}

        .volatility{position:absolute;left:50%;bottom:64px;transform:translateX(-50%);display:flex;gap:.6rem;align-items:center;
          background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.2);padding:.25rem .6rem;border-radius:.75rem;color:#fff;font-weight:800}
        .bolts{color:#ffd166;text-shadow:0 0 10px #ffd166aa}

        .dontshow{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);font-size:.85rem;color:#fff;text-shadow:0 2px 0 #000}
      `}</style>
    </div>
  );
}

function Stat({label,value,color}:{label:string;value:number;color:string}){
  return (
    <div className="flex items-baseline gap-2">
      <span className={`text-xs font-semibold tracking-wider ${color}`}>{label}</span>
      <span className="text-lg font-extrabold">{value}</span>
    </div>
  );
}
