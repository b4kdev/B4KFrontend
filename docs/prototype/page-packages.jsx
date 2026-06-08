// B4K — Packages Grid + Package Detail

const ALL_PACKAGES = [
  { id:1, name:'Seoul Cultural Immersion',    dur:'5D4N', loc:'Seoul & Gyeonggi', price:649,  cat:'K-Culture', stops:8,  rating:4.8, reviews:312,  tag:'',          grad:'linear-gradient(150deg,#0c1a3a,#6b4708)' },
  { id:2, name:'Jeju Island Escape',           dur:'4D3N', loc:'Jeju Island',      price:499,  cat:'K-Culture', stops:6,  rating:4.7, reviews:289,  tag:'Best Seller',grad:'linear-gradient(160deg,#0a1f0a,#366e18)' },
  { id:3, name:'Busan Coastal Road Trip',      dur:'3D2N', loc:'Busan & Gyeongnam',price:389,  cat:'K-Drama',   stops:5,  rating:4.6, reviews:198,  tag:'',          grad:'linear-gradient(155deg,#0a1832,#243a64)' },
  { id:4, name:'Gyeongju Heritage Trail',      dur:'2D1N', loc:'Gyeongju',         price:259,  cat:'K-Culture', stops:4,  rating:4.5, reviews:154,  tag:'',          grad:'linear-gradient(150deg,#2a1a0a,#8a6030)' },
  { id:5, name:'BTS Seoul Fan Pilgrimage',     dur:'3D2N', loc:'Seoul',            price:549,  cat:'K-Pop',     stops:7,  rating:4.9, reviews:891,  tag:'Limited',   grad:'linear-gradient(150deg,#1a0a3a,#4a2a8a)' },
  { id:6, name:'K-Beauty & Wellness Circuit',  dur:'4D3N', loc:'Seoul',            price:729,  cat:'K-Beauty',  stops:9,  rating:4.7, reviews:203,  tag:'Exclusive', grad:'linear-gradient(150deg,#2a0a1a,#5a1a3a)' },
  { id:7, name:'Crash Landing Filming Tour',   dur:'2D1N', loc:'Seoul & Paju',     price:319,  cat:'K-Drama',   stops:5,  rating:4.6, reviews:445,  tag:'Popular',   grad:'linear-gradient(150deg,#0a1a2a,#1a3a4a)' },
  { id:8, name:'Bespoke Hanok & Heritage',     dur:'5D4N', loc:'Jeonju & Gyeongju',price:899,  cat:'K-Culture', stops:10, rating:4.9, reviews:87,   tag:'Bespoke',   grad:'linear-gradient(150deg,#1a0a00,#3d2000)' },
];

const PKG_STOPS = [
  { name:'Gyeongbokgung Palace',    dur:'2h',  desc:'Changing of the guards ceremony + inner palace tour' },
  { name:'Bukchon Hanok Village',   dur:'1.5h',desc:'Traditional village walk, best at dawn' },
  { name:'Insadong Art Street',     dur:'1h',  desc:'Galleries, tea houses, and indie craft shops' },
  { name:'N Seoul Tower',           dur:'1.5h',desc:'Sunset views + lovelock bridge' },
  { name:'Myeongdong Street Food',  dur:'2h',  desc:'Tteokbokki, hotteok, and the famous egg bread' },
];

const PackagesPage = ({ onNav, isMobile }) => {
  const [activeCat, setActiveCat] = React.useState('All');
  const cats = ['All','K-Pop','K-Drama','K-Beauty','K-Culture'];
  const filtered = activeCat==='All' ? ALL_PACKAGES : ALL_PACKAGES.filter(p=>p.cat===activeCat);

  const tagColor = t => ({
    'Best Seller':'var(--success)', Limited:'var(--warning)',
    Exclusive:'var(--gold)', Popular:'var(--accent)', Bespoke:'var(--teal)'
  }[t]||'');
  const tagBg = t => ({
    'Best Seller':'var(--success-bg)', Limited:'var(--warning-bg)',
    Exclusive:'var(--gold-bg)', Popular:'var(--accent-lt)', Bespoke:'var(--teal-bg)'
  }[t]||'');

  return (
    <div style={{padding: isMobile?'16px 14px':'28px 32px',maxWidth:1200}}>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontSize: isMobile?20:26,fontWeight:900,letterSpacing:'-0.01em',color:'var(--text)',marginBottom:6}}>B4K Packages</h1>
          <p style={{fontSize:13,color:'var(--text-3)'}}>Handpicked tours from verified Korean travel partners</p>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setActiveCat(c)} style={{
              padding:'6px 14px',borderRadius:16,border:'1px solid',fontSize:12,fontWeight:500,
              background: c===activeCat?'var(--accent-lt)':'none',
              borderColor: c===activeCat?'var(--accent-mid)':'var(--border-s)',
              color: c===activeCat?'var(--accent)':'var(--text-2)',
              cursor:'pointer',fontFamily:'var(--font)',
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Packages grid */}
      <div style={{display:'grid',gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)',gap:16,marginBottom:44}}>
        {filtered.map(pk=>(
          <div key={pk.id} onClick={()=>onNav('pkg-detail')} style={{
            background:'var(--surf-1)',borderRadius:10,overflow:'hidden',cursor:'pointer',
            border:'1px solid var(--border)',transition:'transform 250ms var(--ease)',
          }}>
            <div style={{aspectRatio:'16/9',background:pk.grad,position:'relative'}}>
              <span style={{position:'absolute',top:10,left:10,fontSize:9,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',background:'rgba(0,0,0,0.6)',color:'#fff',padding:'3px 8px',borderRadius:2}}>{pk.cat}</span>
              {pk.tag && <span style={{position:'absolute',top:10,right:10,fontSize:9,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',background:tagBg(pk.tag),color:tagColor(pk.tag),border:`1px solid ${tagColor(pk.tag)}`,padding:'3px 8px',borderRadius:3}}>{pk.tag}</span>}
            </div>
            <div style={{padding:'14px 16px'}}>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text)',marginBottom:4,lineHeight:1.3}}>{pk.name}</div>
              <div style={{fontSize:11,color:'var(--text-3)',marginBottom:8}}>{pk.dur} · {pk.loc} · {pk.stops} stops</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:'var(--text)'}}>${pk.price}</div>
                  <div style={{fontSize:10,color:'var(--text-3)'}}>per person</div>
                </div>
                <button style={{height:34,padding:'0 16px',borderRadius:6,background:'var(--accent)',border:'none',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)'}}>Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bespoke CTA */}
      <div style={{background:'linear-gradient(135deg,#0c1a3a 0%,#1a0a3a 50%,#2a0a1a 100%)',borderRadius:12,padding: isMobile?'24px 20px':'32px 40px',position:'relative',overflow:'hidden',border:'1px solid var(--border-s)'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 70% 50%,rgba(124,106,247,0.2) 0%,transparent 60%)'}}/>
        <div style={{position:'relative'}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)',marginBottom:12}}>Bespoke Journeys</div>
          <div style={{fontSize: isMobile?20:28,fontWeight:800,color:'#fff',marginBottom:10,letterSpacing:'-0.01em',lineHeight:1.2}}>Your Korea,<br/>entirely your own.</div>
          <p style={{fontSize:13,color:'rgba(255,255,255,0.65)',marginBottom:24,maxWidth:480,lineHeight:1.6}}>Our master curators will design a completely unique itinerary for you — private access, custom timing, zero crowds.</p>
          <button style={{height:44,padding:'0 28px',borderRadius:8,background:'#fff',color:'#111',border:'none',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'var(--font)',display:'inline-flex',alignItems:'center',gap:8}}>
            Consult with an expert <Icon name="arrow" size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
};

// ── PACKAGE DETAIL ──────────────────────────────────────────────────────
const PackageDetailPage = ({ onNav, isMobile }) => {
  const pk = ALL_PACKAGES[1]; // Jeju Island Escape as demo

  return (
    <div style={{maxWidth:800,margin:'0 auto',padding: isMobile?'0 0 100px':'0 32px 60px'}}>
      {/* Hero image */}
      <div style={{aspectRatio: isMobile?'4/3':'2.5/1',background:pk.grad,position:'relative'}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.6) 100%)'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,padding: isMobile?'16px':'24px 32px'}}>
          <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',background:'var(--accent-lt)',color:'var(--accent)',border:'1px solid var(--accent-mid)',padding:'3px 10px',borderRadius:3,marginBottom:10,display:'inline-block'}}>{pk.cat}</span>
          <h1 style={{fontSize: isMobile?22:32,fontWeight:900,color:'#fff',marginBottom:6,letterSpacing:'-0.01em'}}>{pk.name}</h1>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.75)',display:'flex',gap:16,flexWrap:'wrap'}}>
            <span>{pk.dur}</span><span>·</span><span>{pk.loc}</span><span>·</span><span>{pk.stops} stops</span>
          </div>
        </div>
        {!isMobile && (
          <button onClick={()=>onNav('packages')} style={{position:'absolute',top:16,left:16,background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',borderRadius:8,padding:'6px 12px',fontSize:12,cursor:'pointer',fontFamily:'var(--font)',display:'flex',alignItems:'center',gap:6,backdropFilter:'blur(4px)'}}>
            <Icon name="chevL" size={14}/> All Packages
          </button>
        )}
      </div>

      <div style={{padding: isMobile?'20px 16px':'32px 0'}}>
        {/* Rating + meta */}
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{color:'var(--warning)',fontSize:14}}>★★★★★</span>
            <span style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>{pk.rating}</span>
            <span style={{fontSize:12,color:'var(--text-3)'}}>({pk.reviews} reviews)</span>
          </div>
          <div style={{display:'flex',gap:8}}>
            {['Verified Partner','Best Seller','Family Friendly'].map(t=>(
              <span key={t} style={{fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:4,background:'var(--surf-2)',border:'1px solid var(--border-s)',color:'var(--text-2)'}}>{t}</span>
            ))}
          </div>
        </div>

        {/* Itinerary map preview */}
        <div style={{marginBottom:28}}>
          <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:12}}>Route Preview</div>
          <div style={{borderRadius:8,overflow:'hidden',aspectRatio: isMobile?'2/1':'3/1',background:'linear-gradient(160deg,#0f1a0f 0%,#1a2f1a 35%,#0d1f1a 60%,#111820 100%)',position:'relative',border:'1px solid var(--border)'}}>
            <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.1}}>
              {Array.from({length:8},(_,i)=><line key={i} x1="0%" y1={`${i*14}%`} x2="100%" y2={`${i*14}%`} stroke="#fff" strokeWidth="0.5"/>)}
              {Array.from({length:10},(_,i)=><line key={i} x1={`${i*11}%`} y1="0%" x2={`${i*11}%`} y2="100%" stroke="#fff" strokeWidth="0.5"/>)}
            </svg>
            {PKG_STOPS.map((s,i)=>{
              const x=[20,35,55,70,50]; const y=[30,55,40,65,80];
              return (
                <g key={i}>
                  {i>0&&<line x1={`${x[i-1]}%`} y1={`${y[i-1]}%`} x2={`${x[i]}%`} y2={`${y[i]}%`} stroke="var(--accent)" strokeWidth="2" style={{position:'absolute'}}/>}
                </g>
              );
            })}
            <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
              {PKG_STOPS.map((_,i)=>{
                const x=[20,35,55,70,50]; const y=[30,55,40,65,80];
                return (
                  <g key={i}>
                    {i>0&&<line x1={`${x[i-1]}%`} y1={`${y[i-1]}%`} x2={`${x[i]}%`} y2={`${y[i]}%`} stroke="var(--accent)" strokeWidth="2"/>}
                    <circle cx={`${x[i]}%`} cy={`${y[i]}%`} r="10" fill="var(--accent)"/>
                    <text x={`${x[i]}%`} y={`${y[i]}%`} textAnchor="middle" dy="4" fontSize="10" fontWeight="700" fill="white">{i+1}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Stop list */}
        <div style={{marginBottom:28}}>
          <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:12}}>Itinerary</div>
          {PKG_STOPS.map((s,i)=>(
            <div key={i} style={{display:'flex',gap:12,padding:'14px 0',borderBottom:'1px solid var(--border)'}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:'var(--accent-lt)',border:'1px solid var(--accent-mid)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'var(--accent)',flexShrink:0}}>{i+1}</div>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:'var(--text)',marginBottom:3}}>{s.name}</div>
                <div style={{fontSize:12,color:'var(--text-3)',marginBottom:4}}>{s.desc}</div>
                <div style={{fontSize:11,color:'var(--text-3)',display:'flex',alignItems:'center',gap:4}}>
                  <Icon name="clock" size={11}/>{s.dur}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div style={{background:'var(--surf-1)',border:'1px solid var(--border)',borderRadius:10,padding:'20px 24px',marginBottom:24}}>
          <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:12}}>Pricing</div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:12}}>
            <div>
              <div style={{fontSize:28,fontWeight:900,color:'var(--text)',letterSpacing:'-0.02em'}}>${pk.price}</div>
              <div style={{fontSize:12,color:'var(--text-3)'}}>per person · includes accommodation + guide</div>
            </div>
            <div style={{fontSize:12,color:'var(--text-3)',maxWidth:240}}>Currency adapts to your language/region settings. Prices shown in USD.</div>
          </div>
        </div>

        {/* Partner CTA */}
        <a href="#" style={{
          display:'flex',alignItems:'center',justifyContent:'center',gap:8,
          width:'100%',height:52,borderRadius:10,
          background:'var(--accent)',color:'#fff',
          fontSize:15,fontWeight:700,textDecoration:'none',
          fontFamily:'var(--font)',
        }}>
          View on partner site <Icon name="arrow" size={16}/>
        </a>
        <div style={{textAlign:'center',marginTop:10,fontSize:11,color:'var(--text-3)'}}>Opens partner's website in a new tab. No in-app payment required.</div>
      </div>

      {/* Mobile sticky CTA */}
      {isMobile && (
        <div style={{position:'fixed',bottom:56,left:0,right:0,padding:'10px 16px',background:'var(--bg-panel)',borderTop:'1px solid var(--border)',zIndex:80}}>
          <button style={{width:'100%',height:48,borderRadius:10,background:'var(--accent)',border:'none',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'var(--font)'}}>
            View on Partner Site →
          </button>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { PackagesPage, PackageDetailPage });
