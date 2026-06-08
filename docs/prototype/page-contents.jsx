// B4K — Contents Hub (K-Pop · K-Drama · K-Beauty · K-Culture)

const CONTENT_CATS = [
  { id:'kpop',    label:'K-Pop',    color:'#a78bfa', sub:['Concerts','Tours','Agencies','Merchandise'] },
  { id:'kdrama',  label:'K-Drama',  color:'var(--teal)',   sub:['Filming Locations','Set Tours','Season Guides','Location Itineraries'] },
  { id:'kbeauty', label:'K-Beauty', color:'#f472b6',  sub:['Brand Flagships','Skincare Routes','Beauty Clinics','New Releases'] },
  { id:'kculture',label:'K-Culture',color:'var(--gold)',   sub:['Food & Dining','Heritage Sites','Cultural Experiences','Seasonal Events'] },
];

const CONTENT_HEROES = {
  kpop:    { title:'aespa World Tour\n— Seoul Dates',  desc:'Exclusive B4K access to pre-show venues, backstage-adjacent fan zones, and HYBE neighbourhood trails.', grad:'linear-gradient(150deg,#1a0a3a 0%,#3d1a6b 50%,#0a0a2a 100%)', glow:'radial-gradient(ellipse at 60% 70%,rgba(167,139,250,0.35) 0%,transparent 55%)' },
  kdrama:  { title:'Crash Landing\non You Trail',     desc:'Walk the actual filming locations from Korea\'s most-loved romance drama, from the DMZ to Itaewon alleyways.', grad:'linear-gradient(150deg,#0a1a2a 0%,#1a3a4a 50%,#0a2030 100%)', glow:'radial-gradient(ellipse at 50% 60%,rgba(45,212,191,0.25) 0%,transparent 55%)' },
  kbeauty: { title:'K-Beauty District\nMaster Route',  desc:'Clinique La Prairie, Sulwhasoo flagships, and the skincare streets of Myeongdong — all in one curated half-day.', grad:'linear-gradient(150deg,#2a0a1a 0%,#5a1a3a 50%,#1a0a14 100%)', glow:'radial-gradient(ellipse at 55% 65%,rgba(244,114,182,0.30) 0%,transparent 55%)' },
  kculture:{ title:'Hansik Pilgrim:\nSeoul Food Trail', desc:'From pojangmacha street stalls to three-Michelin-star banchan — the definitive Korean food journey.', grad:'linear-gradient(150deg,#1a0f00 0%,#3d2000 50%,#1a0a00 100%)', glow:'radial-gradient(ellipse at 60% 70%,rgba(245,158,11,0.30) 0%,transparent 55%)' },
};

const CONTENT_CARDS = {
  kpop: [
    { sub:'Concerts',    title:'BTS Seoul Trail — Full Route',    meta:'7 stops · Itinerary', tag:'Popular' },
    { sub:'Concerts',    title:'BLACKPINK Arena Photo Spots',      meta:'4 stops · Photo guide', tag:'' },
    { sub:'Tours',       title:'HYBE HQ & Entertainment District', meta:'Half-day tour', tag:'Exclusive' },
    { sub:'Agencies',    title:'SM Entertainment Campus Walk',      meta:'2 stops · Self-guided', tag:'' },
    { sub:'Merchandise', title:'Line Friends & Official K-Pop Stores', meta:'Shopping itinerary', tag:'' },
    { sub:'Merchandise', title:'Vinyl & Limited Drops: Hongdae',   meta:'Record shops guide', tag:'New' },
  ],
  kdrama: [
    { sub:'Filming Locations', title:'Goblin Filming Sites — Incheon + Seoul', meta:'6 stops · 2 days', tag:'Popular' },
    { sub:'Filming Locations', title:'Itaewon Class Street by Street',          meta:'4 stops · Walking', tag:'' },
    { sub:'Set Tours',         title:'Daejanggeum Theme Park Day Tour',          meta:'Full-day package', tag:'Exclusive' },
    { sub:'Season Guides',     title:'Cherry Blossom Drama Locations',           meta:'Spring guide', tag:'Seasonal' },
    { sub:'Location Itineraries', title:'My Love from the Star — Busan',         meta:'3D2N itinerary', tag:'' },
    { sub:'Location Itineraries', title:'Twenty-Five Twenty-One School Walks',   meta:'4 stops', tag:'New' },
  ],
  kbeauty: [
    { sub:'Brand Flagships',  title:'Sulwhasoo Flagship — Insadong',           meta:'1 stop · 2h experience', tag:'Exclusive' },
    { sub:'Brand Flagships',  title:'Innisfree Flagship Café, Myeongdong',     meta:'1 stop', tag:'' },
    { sub:'Skincare Routes',  title:'The Myeongdong Beauty Mile',               meta:'Shopping route · 8 stops', tag:'Popular' },
    { sub:'Beauty Clinics',   title:'Apgujeong Aesthetic Clinics District',     meta:'Guide + map', tag:'' },
    { sub:'New Releases',     title:'Olive Young Grand — Latest Drops',         meta:'Shopping guide', tag:'New' },
    { sub:'Beauty Clinics',   title:'Gangnam Skin Clinic + Recovery Café Loop', meta:'Half-day', tag:'' },
  ],
  kculture: [
    { sub:'Food & Dining',    title:'Gwangjang Market Street Food Deep Dive',   meta:'2h walking food tour', tag:'Popular' },
    { sub:'Heritage Sites',   title:'Joseon Palaces Full Circuit',               meta:'5 palaces · 2 days', tag:'' },
    { sub:'Cultural Experiences', title:'Jongmyo Royal Ritual — Seasonal',      meta:'Seasonal event', tag:'Seasonal' },
    { sub:'Food & Dining',    title:'Michelin Seoul: All 3-Star Restaurants',   meta:'Tasting itinerary', tag:'Exclusive' },
    { sub:'Seasonal Events',  title:'Busan International Film Festival Guide',   meta:'Festival map', tag:'' },
    { sub:'Heritage Sites',   title:'Buddhist Temple Stay — Templestay Program',meta:'Overnight experience', tag:'New' },
  ],
};

const LEADERBOARD_TEASERS = {
  kpop:    [{rank:1,user:'@btsarmy_tours',   itin:'Ultimate BTS Seoul',  likes:1284},{rank:2,user:'@kpop_trails',    itin:'HYBE District Walk',   likes:892},{rank:3,user:'@yuna_travels',  itin:'aespa Night Route',   likes:631}],
  kdrama:  [{rank:1,user:'@drama_mapper',    itin:'Crash Landing Trail', likes:943},{rank:2,user:'@seoulfilm',      itin:'Goblin Locations',     likes:712},{rank:3,user:'@jiho_explore',  itin:'Itaewon Class Walk',  likes:488}],
  kbeauty: [{rank:1,user:'@beauty_routes',   itin:'Myeongdong Mile',     likes:756},{rank:2,user:'@glow_trails',    itin:'Apgujeong Circuit',    likes:521},{rank:3,user:'@skincare_map',  itin:'Olive Young Run',     likes:344}],
  kculture:[{rank:1,user:'@hansik_hunter',   itin:'Gwangjang Deep Dive', likes:1102},{rank:2,user:'@palace_walks',  itin:'Joseon Circuit',       likes:678},{rank:3,user:'@temple_stay',   itin:'Buddhist Trail',      likes:445}],
};

const ContentsPage = ({ onNav, isMobile }) => {
  const [activeCat, setActiveCat] = React.useState('kpop');
  const [activeSub, setActiveSub] = React.useState('All');

  const cat = CONTENT_CATS.find(c=>c.id===activeCat);
  const hero = CONTENT_HEROES[activeCat];
  const cards = CONTENT_CARDS[activeCat];
  const lb = LEADERBOARD_TEASERS[activeCat];

  React.useEffect(()=>{ setActiveSub('All'); },[activeCat]);

  const subFilters = ['All',...cat.sub];
  const filtered = activeSub==='All' ? cards : cards.filter(c=>c.sub===activeSub);

  const tagColor = t => t==='Popular'?'var(--accent)':t==='Exclusive'?'var(--gold)':t==='New'?'var(--success)':t==='Seasonal'?'var(--teal)':'';
  const tagBg = t => t==='Popular'?'var(--accent-lt)':t==='Exclusive'?'var(--gold-bg)':t==='New'?'var(--success-bg)':t==='Seasonal'?'var(--teal-bg)':'';

  return (
    <div style={{minHeight:'100%'}}>
      {/* Category tabs */}
      <div style={{display:'flex',borderBottom:'1px solid var(--border)',background:'var(--bg-panel)',padding:'0 16px',overflowX:'auto',flexShrink:0}}>
        {CONTENT_CATS.map(c=>(
          <button key={c.id} onClick={()=>setActiveCat(c.id)} style={{
            padding:'14px 20px',border:'none',background:'none',cursor:'pointer',
            fontSize:13,fontWeight:activeCat===c.id?700:500,
            color: activeCat===c.id?c.color:'var(--text-3)',
            borderBottom:`2px solid ${activeCat===c.id?c.color:'transparent'}`,
            fontFamily:'var(--font)',whiteSpace:'nowrap',transition:'color 150ms',
          }}>{c.label}</button>
        ))}
      </div>

      <div style={{padding: isMobile?'16px 14px':'28px 32px',maxWidth:1200}}>

        {/* Hero */}
        <div style={{position:'relative',borderRadius:10,overflow:'hidden',marginBottom:36,aspectRatio: isMobile?'4/3':'2.8/1'}}>
          <div style={{position:'absolute',inset:0,background:hero.grad}}/>
          <div style={{position:'absolute',inset:0,background:hero.glow}}/>
          <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,rgba(0,0,0,0.75) 0%,transparent 65%)'}}/>
          <div style={{position:'absolute',inset:0,padding: isMobile?'20px':'36px 44px',display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
            <h1 style={{fontSize: isMobile?22:36,fontWeight:900,lineHeight:1.05,letterSpacing:'-0.02em',color:'#fff',marginBottom:10,whiteSpace:'pre-line'}}>{hero.title}</h1>
            {!isMobile && <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',lineHeight:1.6,marginBottom:20,maxWidth:420}}>{hero.desc}</p>}
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button onClick={()=>onNav('pkg-detail')} style={{height:38,padding:'0 20px',background:cat.color,color:'#fff',border:'none',borderRadius:4,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)'}}>Book Exclusive Access</button>
              <button onClick={()=>onNav('packages')} style={{height:38,padding:'0 20px',background:'rgba(255,255,255,0.15)',color:'#fff',border:'1px solid rgba(255,255,255,0.3)',borderRadius:4,fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'var(--font)',backdropFilter:'blur(4px)'}}>View Details</button>
            </div>
          </div>
        </div>

        {/* Sub-category filter */}
        <div style={{display:'flex',gap:8,marginBottom:24,overflowX:'auto',paddingBottom:4}}>
          {subFilters.map(f=>(
            <button key={f} onClick={()=>setActiveSub(f)} style={{
              padding:'6px 14px',borderRadius:16,border:'1px solid',fontSize:12,fontWeight:500,
              background: f===activeSub?'var(--accent-lt)':'none',
              borderColor: f===activeSub?'var(--accent-mid)':'var(--border-s)',
              color: f===activeSub?'var(--accent)':'var(--text-2)',
              cursor:'pointer',fontFamily:'var(--font)',whiteSpace:'nowrap',transition:'all 150ms',
            }}>{f}</button>
          ))}
        </div>

        {/* Content cards grid */}
        <div style={{display:'grid',gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)',gap:14,marginBottom:44}}>
          {filtered.map((c,i)=>(
            <div key={i} onClick={()=>onNav('map')} style={{background:'var(--surf-1)',borderRadius:8,overflow:'hidden',cursor:'pointer',border:'1px solid var(--border)',transition:'transform 200ms'}}>
              <div style={{aspectRatio:'16/9',background:`linear-gradient(150deg,${activeCat==='kpop'?'#1a0a3a,#3d1a6b':activeCat==='kdrama'?'#0a1a2a,#1a3a4a':activeCat==='kbeauty'?'#2a0a1a,#5a1a3a':'#1a0f00,#3d2000'})`,position:'relative'}}>
                {c.tag && <span style={{position:'absolute',top:8,left:8,fontSize:9,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',background:tagBg(c.tag),color:tagColor(c.tag),border:`1px solid ${tagColor(c.tag)}`,padding:'2px 8px',borderRadius:3}}>{c.tag}</span>}
              </div>
              <div style={{padding:'12px 14px'}}>
                <div style={{fontSize:10,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:cat.color,marginBottom:4}}>{c.sub}</div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--text)',lineHeight:1.35,marginBottom:4}}>{c.title}</div>
                <div style={{fontSize:11,color:'var(--text-3)'}}>{c.meta}</div>
              </div>
            </div>
          ))}
        </div>

        {/* B4K Best Packages for this category */}
        <div style={{marginBottom:44}}>
          <SectionHead title={`B4K Best ${cat.label} Packages`} sub={`Exclusive partner packages for ${cat.label} fans`} onSeeAll={()=>onNav('packages')}/>
          <div style={{display:'grid',gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)',gap:12}}>
            {[1,2,3].map(i=>(
              <div key={i} onClick={()=>onNav('pkg-detail')} style={{background:'var(--surf-1)',borderRadius:8,overflow:'hidden',cursor:'pointer',border:'1px solid var(--border)'}}>
                <div style={{aspectRatio:'16/9',background:`linear-gradient(150deg,${activeCat==='kpop'?'#1a0a3a,#4a2a8a':activeCat==='kdrama'?'#0a1a2a,#0d3a4a':activeCat==='kbeauty'?'#2a0a1a,#4a1030':'#1a0f00,#2a1400'})`}}/>
                <div style={{padding:'10px 14px'}}>
                  <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',background:'var(--accent-lt)',color:'var(--accent)',padding:'2px 8px',borderRadius:3}}>{cat.label}</span>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginTop:6,marginBottom:3}}>{cat.label} Exclusive Package {i}</div>
                  <div style={{fontSize:10,color:'var(--text-3)',marginBottom:6}}>{i+2}D{i+1}N · Seoul</div>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>from ${299+i*150} <span style={{fontSize:10,fontWeight:400,color:'var(--text-3)'}}>/person</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard teaser */}
        <div style={{background:'var(--surf-1)',border:'1px solid var(--border)',borderRadius:8,padding:'20px 24px',marginBottom:32}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>Top {cat.label} routes this week</div>
            <button onClick={()=>onNav('community')} style={{fontSize:11,fontWeight:600,color:'var(--text-2)',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)',display:'flex',alignItems:'center',gap:4}}>
              View leaderboard <Icon name="arrow" size={12}/>
            </button>
          </div>
          {lb.map((r,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom: i<2?'1px solid var(--border)':'none'}}>
              <div style={{width:24,fontSize:14,fontWeight:800,color: i===0?cat.color:'var(--text-3)',textAlign:'center'}}>{r.rank}</div>
              <div style={{width:32,height:32,borderRadius:'50%',background:'var(--accent-lt)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'var(--accent)',flexShrink:0}}>
                {r.user[1].toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.itin}</div>
                <div style={{fontSize:11,color:'var(--text-3)'}}>{r.user}</div>
              </div>
              <div style={{fontSize:12,color:'var(--text-3)',flexShrink:0,display:'flex',alignItems:'center',gap:4}}>
                <Icon name="heart" size={12}/> {r.likes.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

Object.assign(window, { ContentsPage });
