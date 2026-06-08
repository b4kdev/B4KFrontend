// B4K — Home / Feed Page

const HERO_SLIDES = [
  { badge:'New Release', title:'K-Culture\nImmersive 2024', desc:'From backstreet jazz bars in Hongdae to private tea ceremonies in Insadong.', cta:'Discover Private Access', grad:'linear-gradient(160deg,#0c1a3a 0%,#1a2d5a 40%,#3d2a06 80%,#6b4708 100%)', glow:'radial-gradient(ellipse at 65% 85%,rgba(255,180,30,0.28) 0%,transparent 55%)' },
  { badge:'Seasonal',    title:'Boseong Tea\nFields in Mist',  desc:'Rolling green terraces blanketed in morning fog. Korea\'s most serene landscape.', cta:'Explore Boseong', grad:'linear-gradient(160deg,#0a1f0a 0%,#1a4a0f 50%,#366e18 100%)', glow:'radial-gradient(ellipse at 40% 20%,rgba(200,255,180,0.12) 0%,transparent 60%)' },
  { badge:'Nightlife',   title:'Seoul After\nMidnight',        desc:'The city transforms when the sun sets. Rooftop bars, lantern-lit alleys, neon horizons.', cta:'Plan the Night', grad:'linear-gradient(180deg,#020210 0%,#080825 40%,#091832 100%)', glow:'radial-gradient(ellipse at 50% 45%,rgba(0,180,255,0.22) 0%,transparent 45%)' },
];

const POIS = [
  { name:'Gyeongbokgung Palace', loc:'Jongno-gu, Seoul', cat:'Heritage', grad:'linear-gradient(160deg,#0c1a3a,#6b4708)' },
  { name:'Boseong Green Tea Fields', loc:'Boseong, South Jeolla', cat:'Nature', grad:'linear-gradient(160deg,#0a1f0a,#366e18)' },
  { name:'N Seoul Tower Night', loc:'Namsan, Seoul', cat:'Landmark', grad:'linear-gradient(180deg,#020210,#091832)', glow:'radial-gradient(ellipse at 50% 40%,rgba(0,180,255,0.28) 0%,transparent 50%)' },
  { name:'Jeonju Hanok Village', loc:'Jeonju, North Jeolla', cat:'Culture', grad:'linear-gradient(145deg,#8fa0b0,#ccd4da)' },
  { name:'Bukhansan National Park', loc:'Seoul Metropolitan', cat:'Nature', grad:'linear-gradient(150deg,#1a2f10,#4a6e2c)' },
  { name:'Haeundae Beach', loc:'Busan', cat:'Beach', grad:'linear-gradient(155deg,#0a1832,#243a64)' },
];

const PACKAGES = [
  { name:'Seoul Cultural Immersion', dur:'5D4N', loc:'Seoul & Gyeonggi', price:'from $649', grad:'linear-gradient(150deg,#0c1a3a,#6b4708)' },
  { name:'Jeju Island Escape',        dur:'4D3N', loc:'Jeju Island',       price:'from $499', grad:'linear-gradient(160deg,#0a1f0a,#366e18)' },
  { name:'Busan Coastal Road Trip',   dur:'3D2N', loc:'Busan & Gyeongnam', price:'from $389', grad:'linear-gradient(155deg,#0a1832,#243a64)' },
  { name:'Gyeongju Heritage Trail',   dur:'2D1N', loc:'Gyeongju',          price:'from $259', grad:'linear-gradient(150deg,#2a1a0a,#8a6030)' },
];

const TOP_ITINS = [
  { title:'Seoul BTS Trail · 5 Stops', creator:'@yuna_travels', likes:284, saves:91, grad:'linear-gradient(150deg,#0c1a3a,#4a2a8a)' },
  { title:'Jeju Sunrise to Sunset',    creator:'@jiho_explore', likes:197, saves:64, grad:'linear-gradient(160deg,#0a1f0a,#366e18)' },
  { title:'Gyeongju in a Day',         creator:'@seoultaste',   likes:152, saves:48, grad:'linear-gradient(150deg,#2a1a0a,#8a6030)' },
];

const HomePage = ({ onNav, isMobile }) => {
  const [slide, setSlide] = React.useState(0);
  const [toast, setToast] = React.useState(null);
  const total = HERO_SLIDES.length;

  React.useEffect(()=>{
    const t = setInterval(()=>setSlide(s=>(s+1)%total), 5000);
    return ()=>clearInterval(t);
  },[]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(()=>setToast(null), 2500);
  };

  const S = HERO_SLIDES[slide];

  return (
    <div style={{padding: isMobile?'16px 14px 24px':'28px 32px 60px', maxWidth:1200}}>

      {/* Breadcrumb */}
      <div style={{display:'flex',gap:6,alignItems:'center',fontSize:10,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:20}}>
        <span style={{color:'var(--text-2)'}}>B4K</span>
        <span>›</span>
        <span style={{color:'var(--text)'}}>Home</span>
      </div>

      {/* ── HERO CAROUSEL ── */}
      <div style={{position:'relative',borderRadius:10,overflow:'hidden',marginBottom:44,aspectRatio: isMobile?'4/3':'2.6/1'}}>
        {HERO_SLIDES.map((sl,i)=>(
          <div key={i} style={{
            position:'absolute',inset:0,
            background:sl.grad,
            opacity: i===slide?1:0,
            transition:'opacity 700ms ease',
          }}>
            {sl.glow && <div style={{position:'absolute',inset:0,background:sl.glow}}/>}
          </div>
        ))}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.25) 55%,transparent 100%)'}}/>
        <div style={{position:'absolute',inset:0,padding: isMobile?'20px 20px 24px':'36px 44px',display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
          <div style={{display:'inline-flex',alignItems:'center',background:'#fff',color:'#111',fontSize:9,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',padding:'4px 10px',borderRadius:2,marginBottom:14,width:'fit-content'}}>{S.badge}</div>
          <h1 style={{fontSize: isMobile?26:clamp(28,48),fontWeight:900,lineHeight:1.05,letterSpacing:'-0.02em',color:'#fff',marginBottom:12,whiteSpace:'pre-line',maxWidth:520}}>{S.title}</h1>
          {!isMobile && <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',lineHeight:1.6,marginBottom:24,maxWidth:400}}>{S.desc}</p>}
          <button style={{display:'inline-flex',alignItems:'center',height:40,padding:'0 22px',background:'#fff',color:'#111',fontSize:12,fontWeight:600,letterSpacing:'0.02em',borderRadius:4,border:'none',cursor:'pointer',fontFamily:'var(--font)',width:'fit-content'}}>
            {S.cta}
          </button>
        </div>
        {/* Dots */}
        <div style={{position:'absolute',bottom: isMobile?18:24,left: isMobile?20:44,display:'flex',gap:6}}>
          {HERO_SLIDES.map((_,i)=>(
            <button key={i} onClick={()=>setSlide(i)} style={{width:i===slide?28:16,height:3,borderRadius:2,background:i===slide?'#fff':'rgba(255,255,255,0.35)',border:'none',cursor:'pointer',padding:0,transition:'width 300ms,background 300ms'}}/>
          ))}
        </div>
        {/* Arrows */}
        {!isMobile && (
          <div style={{position:'absolute',bottom:20,right:24,display:'flex',gap:8}}>
            {['chevL','chevR'].map((ic,i)=>(
              <button key={i} onClick={()=>setSlide(s=>(s+(i?1:-1)+total)%total)} style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.25)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',backdropFilter:'blur(4px)'}}>
                <Icon name={ic} size={13} stroke={2}/>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── TOP ITINERARIES ── */}
      <SectionHead title="This week's top itineraries" sub="Curated by the B4K community" onSeeAll={()=>onNav('community')}/>
      <div style={{display:'grid',gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)',gap:14,marginBottom:44}}>
        {TOP_ITINS.map((it,i)=>(
          <div key={i} style={{background:'var(--surf-1)',borderRadius:8,overflow:'hidden',cursor:'pointer',border:'1px solid var(--border)'}} onClick={()=>onNav('map')}>
            <div style={{aspectRatio:'3/2',background:it.grad,position:'relative'}}>
              <span style={{position:'absolute',top:10,right:10,fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',background:'rgba(0,0,0,0.55)',color:'#fff',padding:'3px 8px',borderRadius:2}}>Itinerary</span>
            </div>
            <div style={{padding:'12px 14px'}}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:3}}>{it.title}</div>
              <div style={{fontSize:11,color:'var(--text-3)',display:'flex',gap:12}}>
                <span>{it.creator}</span>
                <span>♥ {it.likes}</span>
                <span>🔖 {it.saves}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── B4K BEST PACKAGES ── */}
      <SectionHead title="B4K Best Packages" sub="Handpicked tours from verified Korean travel partners" onSeeAll={()=>onNav('packages')}/>
      <div style={{display:'grid',gridTemplateColumns: isMobile?'1fr 1fr':'repeat(4,1fr)',gap:10,marginBottom:44}}>
        {PACKAGES.map((pk,i)=>(
          <div key={i} onClick={()=>onNav('pkg-detail')} style={{background:'var(--surf-1)',borderRadius:8,overflow:'hidden',cursor:'pointer',border:'1px solid var(--border)',transition:'transform 250ms'}}>
            <div style={{aspectRatio:'16/9',background:pk.grad}}/>
            <div style={{padding:'10px 12px'}}>
              <div style={{fontSize:12,fontWeight:600,color:'var(--text)',marginBottom:3,lineHeight:1.3}}>{pk.name}</div>
              <div style={{fontSize:10,color:'var(--text-3)',marginBottom:6}}>{pk.dur} · {pk.loc}</div>
              <div style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{pk.price} <span style={{fontSize:10,fontWeight:400,color:'var(--text-3)'}}>/ person</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* ── LEADERBOARD STRIP ── */}
      <div onClick={()=>onNav('community')} style={{background:'var(--surf-1)',border:'1px solid var(--border)',borderRadius:8,padding:'18px 24px',display:'flex',alignItems:'center',gap:20,marginBottom:44,cursor:'pointer'}}>
        <div style={{fontSize:28,flexShrink:0}}>🏆</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:3}}>Community Leaderboard — Week 18</div>
          <div style={{fontSize:12,color:'var(--text-3)'}}>Top contributors earn badges, featured placement, and partner perks. Climb the board.</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:4,color:'var(--text-2)',fontSize:11,fontWeight:600,letterSpacing:'0.05em',flexShrink:0}}>
          View Rankings <Icon name="arrow" size={12}/>
        </div>
      </div>

      {/* ── SEASONAL POIS ── */}
      <SectionHead title="Seasonal Korea POIs" sub="Curated locations for the shifting landscapes of the peninsula" onSeeAll={()=>onNav('map')}/>
      <div style={{display:'grid',gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)',gap:14,marginBottom:44}}>
        {POIS.map((p,i)=>(
          <div key={i} onClick={()=>onNav('map')} style={{background:'var(--surf-1)',borderRadius:8,overflow:'hidden',cursor:'pointer',border:'1px solid var(--border)'}}>
            <div style={{aspectRatio:'3/2',background:p.grad,position:'relative'}}>
              {p.glow && <div style={{position:'absolute',inset:0,background:p.glow}}/>}
              <span style={{position:'absolute',top:10,right:10,fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',background:'rgba(0,0,0,0.55)',color:'#fff',padding:'3px 8px',borderRadius:2}}>{p.cat}</span>
            </div>
            <div style={{padding:'10px 14px'}}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:3}}>{p.name}</div>
              <div style={{fontSize:11,color:'var(--text-3)',display:'flex',alignItems:'center',gap:4}}>
                <Icon name="pin" size={10}/>{p.loc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {toast && <Toast message={toast} visible type="success"/>}
    </div>
  );
};

// Helper
const clamp = (min,max) => `clamp(${min}px, 3.5vw, ${max}px)`;

const SectionHead = ({ title, sub, onSeeAll }) => (
  <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:16}}>
    <div>
      <div style={{fontSize:16,fontWeight:800,letterSpacing:'0.04em',textTransform:'uppercase',color:'var(--text)',marginBottom:4}}>{title}</div>
      {sub && <div style={{fontSize:12,color:'var(--text-3)',lineHeight:1.5}}>{sub}</div>}
    </div>
    <button onClick={onSeeAll} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--text-2)',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)',whiteSpace:'nowrap'}}>
      See All <Icon name="arrow" size={12}/>
    </button>
  </div>
);

Object.assign(window, { HomePage, SectionHead });
