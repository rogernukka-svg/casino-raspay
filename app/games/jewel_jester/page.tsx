'use client';
import { useEffect, useRef, useState } from 'react';

/** ========= Tipos & Constantes ========= */
type Cell = { sym: string; multi?: number };
type Win  = { lineIdx: number; count: number; sym: string; pay: number; coords: [number,number][] };

const COLS = 5, ROWS = 3;

// Símbolos (placeholders con emoji)
const JEST='🎭', BONUS='👑', LUTE='🎸', PINS='🎳', SHOE='👠', DIAMOND='💎', REDGEM='♦️';
const WILD='⭐';
const SYMBOLS = [JEST, BONUS, LUTE, PINS, SHOE, DIAMOND, REDGEM, WILD];

// pagos por 3/4/5 (demo)
const PAY: Record<string, number[]> = {
  [JEST]:   [0,  20, 200, 1000],
  [BONUS]:  [0,  10,  50,  250],
  [LUTE]:   [0,  10,  40,  200],
  [PINS]:   [0,  10,  40,  200],
  [SHOE]:   [0,   8,  40,  200],
  [DIAMOND]:[0,   8,  40,  200],
  [REDGEM]: [0,   8,  40,  200],
  [WILD]:   [0,  12,  60,  300],
};

// líneas sencillas
const LINES = [
  [1,1,1,1,1],
  [0,0,0,0,0],
  [2,2,2,2,2],
  [0,1,2,1,0],
  [2,1,0,1,2],
];

const rnd=(n:number)=>Math.floor(Math.random()*n);
const choice=<T,>(a:T[])=>a[rnd(a.length)];
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));

export default function JewelJester(){
  const [bet,setBet]=useState(100);
  const [credit,setCredit]=useState(999_980);
  const [totalWin,setTotalWin]=useState(0);
  const [busy,setBusy]=useState(false);
  const [flash,setFlash]=useState(false);
  const [isSpinning,setIsSpinning]=useState(false);
  const [autoplay,setAutoplay]=useState<number|null>(null);

  const [grid,setGrid]=useState<Cell[][]>(()=>Array.from({length:COLS},()=>Array.from({length:ROWS},()=>({sym:DIAMOND}))));
  const wrapRef=useRef<HTMLDivElement|null>(null);
  const cellRefs=useRef<HTMLDivElement[][]>(Array.from({length:COLS},()=>Array.from({length:ROWS},()=>null as any)));
  const [segments,setSegments]=useState<Array<{x1:number,y1:number,x2:number,y2:number}>>([]);

  // timers
  const spinIntervals=useRef<Array<ReturnType<typeof setInterval>>>([]);
  const stopTimeouts=useRef<Array<ReturnType<typeof setTimeout>>>([]);

  // Audio simple
  const ctxRef=useRef<AudioContext|null>(null);
  function audio(){ if(!ctxRef.current){ const C=(window as any).AudioContext||(window as any).webkitAudioContext; ctxRef.current=new C(); } if(ctxRef.current.state==='suspended') ctxRef.current.resume(); return ctxRef.current; }
  function beep(f=880,d=90,t:OscillatorType='sine',g=0.05){ const ctx=audio(); const o=ctx.createOscillator(); const g1=ctx.createGain(); o.type=t; o.frequency.value=f; g1.gain.value=g; o.connect(g1); g1.connect(ctx.destination); const now=ctx.currentTime; o.start(now); g1.gain.exponentialRampToValueAtTime(0.0001, now+d/1000); o.stop(now+d/1000); }

  useEffect(()=>{
    // primer grid vistoso
    const seed=[SHOE,DIAMOND,REDGEM,PINS,JEST];
    setGrid(Array.from({length:COLS},(_,c)=>Array.from({length:ROWS},()=>({sym:seed[c%seed.length]}))));
    return ()=>{ stopAll(); ctxRef.current?.close(); };
  },[]);

  function stopAll(){ spinIntervals.current.forEach(clearInterval); spinIntervals.current=[]; stopTimeouts.current.forEach(clearTimeout); stopTimeouts.current=[]; }

  /** ===== RNG del Resultado (demo) ===== */
  function spinRNG(): Cell[][] {
    const g:Cell[][]=Array.from({length:COLS},()=>Array.from({length:ROWS},()=>({sym:choice(SYMBOLS)})));
    if(Math.random()<0.5){ g[2][rnd(ROWS)]={sym:DIAMOND}; }
    return g;
  }

  /** ===== Evaluación ===== */
  function evaluate(g:Cell[][]){
    const wins:Win[]=[];
    for(let li=0; li<LINES.length; li++){
      const path=LINES[li];
      let base:string|undefined;
      for(let c=0;c<COLS;c++){ const s=g[c][path[c]].sym; if(s!==WILD){ base=s; break; } }
      if(!base) continue;

      let count=0, coords:[number,number][]=[];
      for(let c=0;c<COLS;c++){
        const s=g[c][path[c]].sym;
        if(s===base || s===WILD){ count++; coords.push([c,path[c]]); } else break;
      }
      if(count>=3){
        const pay=(PAY[base]??[0,0,5,20,80])[count]*(bet/100);
        if(pay>0) wins.push({lineIdx:li,count,sym:base,pay:Math.round(pay),coords});
      }
    }
    const total=wins.reduce((a,b)=>a+b.pay,0);
    return {wins,total};
  }

  /** ===== Dibujo de segmentos ===== */
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

  /** ===== Animación de giro por columnas ===== */
  function startSpin(){
    stopAll(); setIsSpinning(true); setSegments([]);
    for(let c=0;c<COLS;c++){
      const it=setInterval(()=>{
        setGrid(prev=>{
          const n=prev.map(col=>col.map(cell=>({...cell})));
          for(let r=0;r<ROWS;r++) n[c][r]={sym:choice(SYMBOLS)};
          return n;
        });
      }, 48 + c*10);
      spinIntervals.current.push(it);
    }
  }

  function stopWith(gridResult:Cell[][]){
    let d=0;
    for(let c=0;c<COLS;c++){
      const t=setTimeout(()=>{
        setGrid(prev=>{
          const n=prev.map(col=>col.map(cell=>({...cell})));
          for(let r=0;r<ROWS;r++) n[c][r]=gridResult[c][r];
          return n;
        });
        beep(820,70,'triangle',0.06); setTimeout(()=>beep(560,90,'triangle',0.06),70);
        if(c===COLS-1){ stopAll(); setIsSpinning(false); }
      }, d);
      stopTimeouts.current.push(t);
      d+=140;
    }
  }

  async function spin(){
    if(busy) return;
    setBusy(true); setTotalWin(0); setCredit(c=>c-bet);
    const clicks=setInterval(()=>beep(720+Math.random()*250,22,'square',0.03),55);

    startSpin();
    const min=950, t0=Date.now();
    const result=spinRNG();
    const rest=Math.max(0,min-(Date.now()-t0)); await wait(rest);

    clearInterval(clicks);
    stopWith(result);

    setTimeout(()=>{
      const ev=evaluate(result);
      if(ev.total>0){
        setCredit(c=>c+ev.total);
        setTotalWin(ev.total);
        [880,1046,1318].forEach((f,i)=>setTimeout(()=>beep(f,120,'sine',0.075),i*100));
        setFlash(true); setTimeout(()=>setFlash(false),560);
      }
      setBusy(false);
      if(autoplay && autoplay>0){ setTimeout(()=>setAutoplay(n=>!n?null:n-1), 250); }
    }, 160*COLS+40);
  }

  useEffect(()=>{ if(autoplay && !busy) spin(); },[autoplay]);

  return (
    <div className="jj">
      {/* PAYTABLE */}
      <div className="pt">
        <div className="pt-row">
          <PTBox icon={JEST}   v5={1000} v4={200} v3={20}/>
          <PTBox icon={BONUS}  v5={250}  v4={50}  v3={10}/>
          <div className="pt-title"><span className="jk">Joker’s</span><span className="jw">Jewels</span></div>
          <PTBox icon={LUTE}   v5={200}  v4={40}  v3={10}/>
          <PTBox icon={PINS}   v5={200}  v4={40}  v3={10}/>
        </div>
        <div className="pt-row">
          <PTBox icon={SHOE}   v5={40}   v4={10}  v3={4}/>
          <PTBox icon={REDGEM} v5={40}   v4={10}  v3={4}/>
          <PTBox icon={DIAMOND}v5={40}   v4={8}   v3={4}/>
          <PTBox icon={'🔵'}   v5={40}   v4={8}   v3={4}/>
          <div className="pt-note">ALL SYMBOLS PAY FROM LEFT TO RIGHT. BONUS PAYS ON ANY POSITION.</div>
        </div>
      </div>

      {/* CABINET */}
      <div className="cab">
        <div className="frame">
          {/* esquinas decoradas */}
          <span className="orn tl"/><span className="orn tr"/><span className="orn bl"/><span className="orn br"/>

          <div className="wrap" ref={wrapRef}>
            {/* líneas ganadoras */}
            <svg className="lines"
                 viewBox={`0 0 ${(wrapRef.current?.clientWidth)||100} ${(wrapRef.current?.clientHeight)||100}`} preserveAspectRatio="none">
              {segments.map((s,i)=>(<line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} className="dash"/>))}
            </svg>

            {/* overlay morado + separadores */}
            <div className="overlay"/>

            {/* REELS */}
            <div className={`reels ${isSpinning?'spinning':''}`}>
              {Array.from({length:COLS}).map((_,c)=>(
                <div key={c} className="reel">
                  <div className={`reelBody ${isSpinning?'bob':''}`}>
                    {Array.from({length:ROWS}).map((__,r)=>{
                      const cell=grid[c][r]; const isB=cell.sym===BONUS; const isJ=cell.sym===JEST;
                      return (
                        <div key={r} ref={el=>{cellRefs.current[c][r]=el as HTMLDivElement;}}
                             className={`cell ${isB?'bglow':''} ${isJ?'jglow':''}`}>
                          <span className="emoji">{cell.sym}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PANEL INFERIOR */}
        <div className="panel">
          <div className="meters">
            <Meter label="CREDIT" value={`$${credit.toLocaleString()}`}/>
            <Meter label="BET" value={`$${(bet/100).toFixed(2)}`}/>
            <Meter label="WIN" value={`$${(totalWin/100).toFixed(2)}`}/>
          </div>
          <div className="place">PLACE YOUR BETS!</div>
          <div className="ctls">
            <button className="btn small" onClick={()=>setBet(n=>Math.max(10,n-10))}>−</button>
            <button className={`btn spin ${flash?'flash':''} ${busy?'disabled':''}`} onClick={spin} disabled={busy}>↻</button>
            <button className="btn small" onClick={()=>setBet(n=>Math.min(10000,n+10))}>+</button>
            <button className={`btn auto ${autoplay?'on':''}`} onClick={()=>setAutoplay(a=>a?null:50)}>AUTOPLAY</button>
          </div>
        </div>
      </div>

      {/* ====== ESTILO LOCAL (SCOPED) ====== */}
      <style jsx>{`
        /* contenedor */
        .jj{
          --reelH: 520px;
          --cellGap: 9px;
          max-width: 1180px;
          margin: 16px auto 42px;
          padding: 0 16px;
        }

        /* Paytable */
        .pt{
          border-radius:16px; padding:12px; color:#fff;
          background:linear-gradient(180deg,#5b1a7a,#3c1459);
          box-shadow:0 8px 30px rgba(0,0,0,.5), inset 0 0 0 1px #ffffff22;
          border:1px solid #ffffff22;
        }
        .pt-row{ display:grid; grid-template-columns: repeat(5, 1fr); gap:10px; align-items:center; }
        .pt-title{ text-align:center; font-weight:1000; letter-spacing:1px; font-size:28px; }
        .pt-title .jk{ color:#ff7de9; text-shadow:0 0 14px #ff7de988; margin-right:8px; }
        .pt-title .jw{ color:#ffd166; text-shadow:0 0 14px #ffd166aa; }
        .pt-note{ grid-column: 3 / span 3; justify-self:end; font-weight:900; letter-spacing:.6px; color:#ffd166; }
        .ptbox{ border-radius:12px; padding:8px 10px; background:linear-gradient(180deg,#7a2aa9aa,#5b1a7acc);
          border:1px solid #ffd16666; box-shadow:inset 0 0 0 1px #ffffff22; display:flex; align-items:center; gap:10px;}
        .ptic{ font-size:26px; }
        .ptpay{ font-size:12px; line-height:1.1; }
        .ptpay b{ color:#ffd166; }

        /* Cabinet */
        .cab{ margin-top:14px; }
        .frame{
          position:relative; border-radius:18px; overflow:hidden;
          background:linear-gradient(180deg,#5a198a,#3a0f66 40%,#2e0a55);
          box-shadow:0 25px 80px rgba(0,0,0,.6), inset 0 0 0 1px #ffffff11;
          border:3px solid #d8a84a;
        }
        .wrap{ position:relative; padding:10px; }
        .overlay{
          position:absolute; inset:10px; border-radius:12px; z-index:1;
          background:
            repeating-linear-gradient(to right,
              transparent 0 calc(20% - 1.5px),
              #f2cc67 calc(20% - 1.5px) calc(20% + 1.5px),
              transparent calc(20% + 1.5px) 20%
            ),
            radial-gradient(200% 100% at 50% 0%, #7a2aa9 0%, #5a198a 45%, #3a0f66 70%, #2e0a55 100%);
          box-shadow:
            inset 0 0 40px rgba(0,0,0,.35),
            inset 30px 0 30px rgba(0,0,0,.25),
            inset -30px 0 30px rgba(0,0,0,.25);
        }
        .lines{ position:absolute; inset:0; z-index:2; }
        .dash{ stroke:#ffd166; stroke-width:8; stroke-linecap:round; stroke-dasharray:14 10; animation:dash 1.05s linear infinite; filter: drop-shadow(0 0 10px rgba(255,255,255,.9)); }
        @keyframes dash{ to{ stroke-dashoffset: -24; } }

        /* Reels */
        .reels{ position:relative; z-index:3; display:grid; grid-template-columns: repeat(5, 1fr); gap:0; }
        .reel{ display:flex; flex-direction:column; }
        .reelBody{
          height: var(--reelH);
          display:flex; flex-direction:column; gap: var(--cellGap); padding: 10px;
        }
        .bob{ animation: bob .5s ease-in-out infinite alternate; }
        @keyframes bob{ from{ transform:translateY(-1px)} to{ transform:translateY(1px)} }
        .reels.spinning .cell{ filter: blur(.8px) brightness(1.05); }

        .cell{
          flex:none;
          height: calc( (var(--reelH) - (2 * var(--cellGap)) ) / 3 );
          display:flex; align-items:center; justify-content:center;
          border-radius:14px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.05)),
            rgba(255,255,255,.06);
          border:1.5px solid rgba(255,255,255,.22);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.05), 0 0 16px rgba(0,0,0,.25);
        }
        .emoji{ font-size: 2.8rem; filter: drop-shadow(0 2px 0 rgba(0,0,0,.55)); }
        .bglow{ box-shadow: 0 0 26px #ffd16688, inset 0 0 0 1px #ffd16666; }
        .jglow{ box-shadow: 0 0 22px #ff4dd688, inset 0 0 0 1px #ff4dd666; }

        /* Esquinas decoradas */
        .orn{ position:absolute; width:92px; height:92px; z-index:4; pointer-events:none; filter: drop-shadow(0 0 10px rgba(255,214,102,.55));
          background: url("data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>\
<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>\
<stop offset='0' stop-color='%23fff7cf'/><stop offset='0.45' stop-color='%23ffd166'/>\
<stop offset='1' stop-color='%23ffa94d'/></linearGradient></defs>\
<path d='M5 95 C35 85 48 72 58 54 C70 32 84 22 95 5 L100 5 L100 0 L0 0 L0 100 L5 100 Z' fill='none' \
stroke='url(%23g)' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/>\
<path d='M12 88 C30 80 42 68 50 50' fill='none' stroke='url(%23g)' stroke-width='3' stroke-linecap='round'/>\
<path d='M40 60 C54 44 72 36 86 28' fill='none' stroke='url(%23g)' stroke-width='2.6' stroke-linecap='round' opacity='.9'/>\
<circle cx='60' cy='40' r='3.2' fill='url(%23g)'/>\
</svg>") center/contain no-repeat; }
        .orn.tl{ top:4px; left:4px; transform: translate(2px,2px); }
        .orn.tr{ top:4px; right:4px; transform: translate(-2px,2px) scaleX(-1); }
        .orn.bl{ bottom:4px; left:4px; transform: translate(2px,-2px) scaleY(-1); }
        .orn.br{ bottom:4px; right:4px; transform: translate(-2px,-2px) scale(-1); }

        /* Panel inferior */
        .panel{
          margin-top:12px; padding:12px;
          border:1px solid #ffffff22; border-radius:12px;
          background:linear-gradient(180deg,#2b1236,#190a25);
          display:grid; grid-template-columns: 1.2fr 1fr 1.6fr; gap:14px; align-items:center;
        }
        .meters{ display:flex; gap:18px; flex-wrap:wrap; }
        .meter{ font-weight:900; letter-spacing:.4px; color:#fff; }
        .meter .lbl{ font-size:12px; color:#ffd166; }
        .meter .val{ font-size:18px; }
        .place{ text-align:center; font-weight:1000; letter-spacing:1px; font-size:22px; color:#fff; text-shadow:0 2px 0 #000; }
        .ctls{ justify-self:end; display:flex; gap:10px; align-items:center; }
        .btn{ border-radius:999px; border:3px solid #fff; background:#0002; color:#fff; font-weight:1000; }
        .btn.small{ width:46px; height:46px; font-size:26px; }
        .btn.spin{ width:86px; height:86px; border-width:6px; font-size:40px;
          background:radial-gradient(100% 100% at 50% 0%, #ffffff, #ffd166 60%, #ffa94d);
          box-shadow:0 0 30px rgba(255,255,255,.6),0 0 80px rgba(255,214,102,.55); color:#1a1208; text-shadow:0 2px 0 #fff; }
        .btn.spin.disabled{ opacity:.6; filter:grayscale(.1); }
        .btn.spin.flash{ animation:btnflash .6s ease; }
        @keyframes btnflash{ 40%{ box-shadow:0 0 60px rgba(255,255,255,.95), 0 0 120px rgba(255,214,102,.9) } }
        .btn.auto{ padding:.5rem .9rem; border-width:3px; }
        .btn.auto.on{ background:#16a34a33; border-color:#86efacaa; }

        /* responsive */
        @media (max-width: 980px){
          .jj{ --reelH: 440px; }
          .panel{ grid-template-columns: 1fr; }
          .ctls{ justify-self:center; }
          .place{ order:-1; }
          .pt-note{ grid-column: 2 / span 4; font-size:12px; }
        }
        @media (max-width: 640px){
          .jj{ --reelH: 360px; }
          .emoji{ font-size: 2.4rem; }
        }
      `}</style>
    </div>
  );
}

/** ===== Subcomponentes UI locales ===== */
function PTBox({icon,v5,v4,v3}:{icon:string;v5:number;v4:number;v3:number}){
  return (
    <div className="ptbox">
      <div className="ptic">{icon}</div>
      <div className="ptpay">
        <div>5 - <b>${v5}</b></div>
        <div>4 - <b>${v4}</b></div>
        <div>3 - <b>${v3}</b></div>
      </div>
    </div>
  );
}
function Meter({label,value}:{label:string;value:string}){
  return (
    <div className="meter">
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
    </div>
  );
}
