// B4K — Profile Hub (My Trips · Saved · Badges · Community · Settings)

const BADGES_DATA = [
  { id:'BD_01', name:'First Itinerary Saved', cat:'Milestone',   icon:'★', earned:true,  date:'Mar 12, 2025', rarity:'Common',    desc:'Save your first itinerary' },
  { id:'BD_03', name:'K-Pop Pilgrim',         cat:'Category',    icon:'♪', earned:true,  date:'Apr 2, 2025',  rarity:'Uncommon',  desc:'Visit 3 K-Pop related POIs' },
  { id:'BD_09', name:'Seoul Local',           cat:'Regional',    icon:'⬡', earned:true,  date:'Apr 18, 2025', rarity:'Rare',      desc:'Save 5+ itineraries in Seoul' },
  { id:'BD_06', name:'BTS Trail Completed',   cat:'Special',     icon:'✦', earned:false, date:'',             rarity:'Special',   desc:'Complete the full BTS Seoul trail itinerary' },
  { id:'BD_02', name:'5 Cities Explored',     cat:'Exploration', icon:'◎', earned:false, date:'',             rarity:'Uncommon',  desc:'Save itineraries in 5 different cities' },
  { id:'BD_07', name:'10 Itineraries Published',cat:'Creator',   icon:'✎', earned:false, date:'',             rarity:'Rare',      desc:'Publish 10 itineraries (Social tier)' },
  { id:'BD_08', name:'100 Likes Received',    cat:'Creator',     icon:'♥', earned:false, date:'',             rarity:'Rare',      desc:'Receive 100 total likes on itineraries' },
  { id:'BD_04', name:'Hanok Hunter',          cat:'Category',    icon:'⌂', earned:false, date:'',             rarity:'Uncommon',  desc:'Visit 3 hanok heritage sites' },
  { id:'BD_05', name:'Michelin Chaser',       cat:'Category',    icon:'◆', earned:false, date:'',             rarity:'Rare',      desc:'Visit 2 Michelin-rated restaurants' },
  { id:'BD_10', name:'Jeju Explorer',         cat:'Regional',    icon:'⬟', earned:false, date:'',             rarity:'Uncommon',  desc:'Save 3+ itineraries in Jeju' },
  { id:'BD_11', name:'Night Owl',             cat:'Lifestyle',   icon:'◑', earned:false, date:'',             rarity:'Common',    desc:'Save an itinerary with 3+ evening POIs' },
  { id:'BD_12', name:'B4K Editorial Pick',    cat:'Special',     icon:'⊛', earned:false, date:'',             rarity:'Special',   desc:'Featured by B4K editorial team' },
];

const MY_TRIPS = [
  { id:1, title:'Seoul BTS Trail',          stops:7, likes:284, saves:91,  published:true,  grad:'linear-gradient(150deg,#1a0a3a,#4a2a8a)' },
  { id:2, title:'Jeju Coastal Drive',        stops:5, likes:0,   saves:0,   published:false, grad:'linear-gradient(160deg,#0a1f0a,#366e18)' },
  { id:3, title:'Gyeongju in a Day',         stops:4, likes:152, saves:48,  published:true,  grad:'linear-gradient(150deg,#2a1a0a,#8a6030)' },
  { id:4, title:'Myeongdong Food Circuit',   stops:6, likes:0,   saves:0,   published:false, grad:'linear-gradient(155deg,#0a1832,#243a64)' },
];

const SAVED_POIS = [
  { name:'Gyeongbokgung Palace',   cat:'Heritage', dist:'2.4 km' },
  { name:'N Seoul Tower',          cat:'Landmark', dist:'3.8 km' },
  { name:'Bukchon Hanok Village',  cat:'Culture',  dist:'2.1 km' },
  { name:'Hongdae Street',         cat:'Nightlife',dist:'5.2 km' },
];

const LB_DATA = [
  { rank:1, user:'@btsarmy_tours',  itin:'Ultimate BTS Seoul',    likes:1284, cat:'K-Pop',    avatar:'B' },
  { rank:2, user:'@drama_mapper',   itin:'Crash Landing Trail',   likes:943,  cat:'K-Drama',  avatar:'D' },
  { rank:3, user:'@hansik_hunter',  itin:'Gwangjang Deep Dive',   likes:1102, cat:'K-Culture',avatar:'H' },
  { rank:4, user:'@sunmin',         itin:'Seoul BTS Trail',        likes:284,  cat:'K-Pop',    avatar:'S', isMe:true },
  { rank:5, user:'@yuna_travels',   itin:'aespa Night Route',      likes:631,  cat:'K-Pop',    avatar:'Y' },
  { rank:6, user:'@kpop_trails',    itin:'HYBE District Walk',     likes:892,  cat:'K-Pop',    avatar:'K' },
  { rank:7, user:'@seoulfilm',      itin:'Goblin Locations',       likes:712,  cat:'K-Drama',  avatar:'S' },
  { rank:8, user:'@jiho_explore',   itin:'Jeju Sunrise to Sunset', likes:197,  cat:'K-Culture',avatar:'J' },
];

const ProfilePage = ({ onNav, isMobile }) => {
  const [activeTab, setActiveTab] = React.useState('trips');
  const [badgeModal, setBadgeModal] = React.useState(null);
  const [deleteModal, setDeleteModal] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [lbCat, setLbCat] = React.useState('Overall');
  const [lbTime, setLbTime] = React.useState('This week');
  const [pinned, setPinned] = React.useState(['BD_01','BD_03','BD_09']);
  const [visibility, setVisibility] = React.useState(true);
  const [transport, setTransport] = React.useState('car');
  const [interests, setInterests] = React.useState(['kpop','kbeauty']);

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(null),2500); };

  const TABS = [
    { id:'trips',     label:'My Trips' },
    { id:'saved',     label:'Saved' },
    { id:'badges',    label:'Badges' },
    { id:'community', label:'Community' },
    { id:'settings',  label:'Settings' },
  ];

  const rarityColor = r => ({Special:'var(--gold)',Rare:'var(--accent)',Uncommon:'var(--teal)',Common:'var(--text-3)'}[r]||'var(--text-3)');
  const catColor = c => ({Pop:'var(--accent)',Drama:'var(--teal)',Beauty:'#f472b6',Culture:'var(--gold)'}[c.split('-')[1]]||'var(--accent)');

  const togglePin = (id) => {
    if(pinned.includes(id)) { setPinned(p=>p.filter(x=>x!==id)); return; }
    if(pinned.length>=3) { showToast('Max 3 badges pinned'); return; }
    setPinned(p=>[...p,id]);
    showToast('Badge pinned to profile!');
  };

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>

      {/* Profile Header */}
      <div style={{background:'var(--bg-panel)',borderBottom:'1px solid var(--border)',padding: isMobile?'20px 16px':'28px 32px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:20,flexWrap:'wrap'}}>
          {/* Avatar */}
          <div style={{position:'relative'}}>
            <div style={{width: isMobile?60:80,height: isMobile?60:80,borderRadius:'50%',background:'var(--accent-lt)',border:'2px solid var(--accent-mid)',display:'flex',alignItems:'center',justifyContent:'center',fontSize: isMobile?22:28,fontWeight:800,color:'var(--accent)',cursor:'pointer'}}>JK</div>
          </div>
          {/* Info */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4,flexWrap:'wrap'}}>
              <div style={{fontSize: isMobile?18:22,fontWeight:800,color:'var(--text)'}}>sunmin</div>
              <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:3,background:'var(--accent-lt)',color:'var(--accent)',border:'1px solid var(--accent-mid)',letterSpacing:'0.06em',textTransform:'uppercase'}}>Social</span>
            </div>
            {/* Stats */}
            <div style={{display:'flex',gap: isMobile?16:28,marginBottom:12}}>
              {[['4','Trips'],['436','Likes'],['89','Followers']].map(([n,l])=>(
                <div key={l} style={{cursor:'pointer'}}>
                  <div style={{fontSize: isMobile?16:20,fontWeight:800,color:'var(--text)',lineHeight:1.2}}>{n}</div>
                  <div style={{fontSize:11,color:'var(--text-3)'}}>{l}</div>
                </div>
              ))}
            </div>
            {/* Pinned badges */}
            <div style={{display:'flex',gap:8}}>
              {pinned.map(id=>{
                const b = BADGES_DATA.find(b=>b.id===id);
                return b ? (
                  <div key={id} title={b.name} style={{width:32,height:32,borderRadius:8,background:'var(--surf-2)',border:`1px solid ${rarityColor(b.rarity)}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,cursor:'pointer'}}>
                    {b.icon}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'1px solid var(--border)',background:'var(--bg-panel)',overflowX:'auto',flexShrink:0}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            padding:'12px 20px',border:'none',background:'none',cursor:'pointer',
            fontSize:13,fontWeight:activeTab===t.id?700:500,
            color: activeTab===t.id?'var(--text)':'var(--text-3)',
            borderBottom:`2px solid ${activeTab===t.id?'var(--accent)':'transparent'}`,
            fontFamily:'var(--font)',whiteSpace:'nowrap',transition:'color 150ms',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{flex:1,overflowY:'auto',padding: isMobile?'16px 14px':'24px 32px'}}>

        {/* MY TRIPS */}
        {activeTab==='trips' && (
          <div>
            {MY_TRIPS.length===0 ? (
              <div style={{textAlign:'center',padding:'60px 20px'}}>
                <div style={{fontSize:40,marginBottom:16}}>🗺</div>
                <div style={{fontSize:18,fontWeight:700,color:'var(--text)',marginBottom:8}}>Your adventures start here</div>
                <button onClick={()=>onNav('map')} style={{height:40,padding:'0 24px',borderRadius:8,background:'var(--accent)',border:'none',color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'var(--font)'}}>Explore the map →</button>
              </div>
            ) : (
              <>
                <div style={{display:'grid',gridTemplateColumns: isMobile?'1fr':'repeat(2,1fr)',gap:14,marginBottom:20}}>
                  {MY_TRIPS.map(t=>(
                    <div key={t.id} style={{background:'var(--surf-1)',borderRadius:8,overflow:'hidden',border:'1px solid var(--border)'}}>
                      <div style={{aspectRatio:'16/9',background:t.grad,position:'relative'}}>
                        {t.published && <span style={{position:'absolute',top:8,left:8,fontSize:9,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',background:'var(--success-bg)',color:'var(--success)',border:'1px solid var(--success)',padding:'2px 8px',borderRadius:3}}>Published</span>}
                      </div>
                      <div style={{padding:'12px 14px'}}>
                        <div style={{fontSize:14,fontWeight:600,color:'var(--text)',marginBottom:4}}>{t.title}</div>
                        <div style={{fontSize:11,color:'var(--text-3)',marginBottom:10}}>{t.stops} stops
                          {t.published && <span style={{marginLeft:12}}>♥ {t.likes} · 🔖 {t.saves}</span>}
                        </div>
                        <div style={{display:'flex',gap:8}}>
                          <button onClick={()=>onNav('map')} style={{flex:1,height:32,borderRadius:6,background:'var(--accent-lt)',border:'1px solid var(--accent-mid)',color:'var(--accent)',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'var(--font)',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                            <Icon name="edit" size={13}/> Edit
                          </button>
                          <button style={{flex:1,height:32,borderRadius:6,background:'none',border:'1px solid var(--border-s)',color:'var(--text-2)',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'var(--font)',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                            <Icon name="share" size={13}/> Share
                          </button>
                          <button onClick={()=>setDeleteModal(t)} style={{width:32,height:32,borderRadius:6,background:'none',border:'1px solid var(--border-s)',color:'var(--danger)',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <Icon name="trash" size={13}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Auto-gen nudge */}
                <div style={{background:'var(--surf-1)',border:'1px solid var(--border)',borderRadius:8,padding:'14px 18px',display:'flex',alignItems:'center',gap:12}}>
                  <div style={{fontSize:20}}>✦</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:2}}>Auto-generate a plan from your bookmarks</div>
                    <div style={{fontSize:12,color:'var(--text-3)'}}>You have 4 saved POIs — let AI build an optimised route.</div>
                  </div>
                  <button onClick={()=>onNav('map')} style={{height:34,padding:'0 14px',borderRadius:6,background:'var(--accent)',border:'none',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)',flexShrink:0}}>Try it →</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* SAVED */}
        {activeTab==='saved' && (
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>Bookmarked POIs</div>
              <button onClick={()=>onNav('map')} style={{height:32,padding:'0 14px',borderRadius:6,background:'var(--accent)',border:'none',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)'}}>Auto-generate plan</button>
            </div>
            {SAVED_POIS.map((p,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid var(--border)',cursor:'pointer'}}>
                <div style={{width:40,height:40,borderRadius:8,background:'var(--surf-2)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Icon name="pin" size={16}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,color:'var(--text)',marginBottom:2}}>{p.name}</div>
                  <div style={{fontSize:11,color:'var(--text-3)'}}>{p.cat} · {p.dist}</div>
                </div>
                <button onClick={e=>{e.stopPropagation();showToast('Bookmark removed');}} style={{background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',padding:4}}>
                  <Icon name="x" size={15}/>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* BADGES */}
        {activeTab==='badges' && (
          <div>
            <div style={{display:'grid',gridTemplateColumns: isMobile?'repeat(3,1fr)':'repeat(4,1fr)',gap:12}}>
              {BADGES_DATA.map(b=>(
                <div key={b.id} onClick={()=>setBadgeModal(b)} style={{
                  background:'var(--surf-1)',border:`1px solid ${b.earned?rarityColor(b.rarity):'var(--border)'}`,
                  borderRadius:10,padding:'16px 12px',textAlign:'center',cursor:'pointer',
                  opacity: b.earned?1:0.45,transition:'opacity 150ms',position:'relative',
                }}>
                  {b.earned && pinned.includes(b.id) && (
                    <div style={{position:'absolute',top:6,right:6,width:12,height:12,borderRadius:'50%',background:'var(--gold)',fontSize:8,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>★</div>
                  )}
                  <div style={{fontSize:28,marginBottom:8,filter:b.earned?'none':'grayscale(100%)'}}>{b.icon}</div>
                  <div style={{fontSize:11,fontWeight:600,color:'var(--text)',lineHeight:1.3,marginBottom:4}}>{b.name}</div>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:rarityColor(b.rarity)}}>{b.rarity}</div>
                  {!b.earned && <div style={{position:'absolute',top:8,left:8,fontSize:10}}>🔒</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMMUNITY / LEADERBOARD */}
        {activeTab==='community' && (
          <div>
            {/* Category filter */}
            <div style={{display:'flex',gap:6,marginBottom:12,overflowX:'auto',paddingBottom:4}}>
              {['Overall','K-Pop','K-Drama','K-Beauty','K-Culture','Top Creators'].map(c=>(
                <button key={c} onClick={()=>setLbCat(c)} style={{
                  padding:'6px 14px',borderRadius:16,border:'1px solid',fontSize:12,fontWeight:500,whiteSpace:'nowrap',
                  background: c===lbCat?'var(--accent-lt)':'none',
                  borderColor: c===lbCat?'var(--accent-mid)':'var(--border-s)',
                  color: c===lbCat?'var(--accent)':'var(--text-2)',
                  cursor:'pointer',fontFamily:'var(--font)',
                }}>{c}</button>
              ))}
            </div>
            {/* Time filter */}
            <div style={{display:'flex',gap:6,marginBottom:20}}>
              {['All-time','This month','This week'].map(t=>(
                <button key={t} onClick={()=>setLbTime(t)} style={{
                  padding:'4px 12px',borderRadius:12,border:'1px solid',fontSize:11,fontWeight:500,
                  background: t===lbTime?'var(--surf-2)':'none',
                  borderColor: t===lbTime?'var(--border-s)':'var(--border)',
                  color: t===lbTime?'var(--text)':'var(--text-3)',
                  cursor:'pointer',fontFamily:'var(--font)',
                }}>{t}</button>
              ))}
            </div>
            {LB_DATA.map((r,i)=>(
              <div key={i} style={{
                display:'flex',alignItems:'center',gap:12,padding:'12px 14px',
                borderRadius:8,marginBottom:6,cursor:'pointer',
                background: r.isMe?'var(--accent-lt)':'var(--surf-1)',
                border:`1px solid ${r.isMe?'var(--accent-mid)':'var(--border)'}`,
              }}>
                <div style={{width:28,fontSize: r.rank<=3?16:13,fontWeight:900,textAlign:'center',color: r.rank===1?'var(--gold)':r.rank===2?'var(--text-2)':r.rank===3?'#cd7f32':'var(--text-3)'}}>
                  {r.rank<=3 ? ['🥇','🥈','🥉'][r.rank-1] : r.rank}
                </div>
                <div style={{width:36,height:36,borderRadius:'50%',background:r.isMe?'var(--accent)':'var(--surf-3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:r.isMe?'#fff':'var(--text-2)',flexShrink:0}}>{r.avatar}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:r.isMe?700:500,color: r.isMe?'var(--accent)':'var(--text)',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.itin}</div>
                  <div style={{fontSize:11,color:'var(--text-3)'}}>{r.user} · {r.cat}</div>
                </div>
                <div style={{fontSize:12,color:'var(--text-3)',display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
                  <Icon name="heart" size={12}/>{r.likes.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SETTINGS */}
        {activeTab==='settings' && (
          <div style={{maxWidth:520}}>
            {/* Account */}
            <div style={{marginBottom:28}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:12}}>Account</div>
              <div style={{background:'var(--surf-1)',border:'1px solid var(--border)',borderRadius:8,padding:'14px 16px'}}>
                <div style={{fontSize:12,color:'var(--text-3)',marginBottom:2}}>Email</div>
                <div style={{fontSize:14,color:'var(--text)'}}>sunmin@gmail.com</div>
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:4}}>Managed by Google Sign-in · cannot be changed</div>
              </div>
            </div>
            {/* Preferences */}
            <div style={{marginBottom:28}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:12}}>Preferences</div>
              <div style={{background:'var(--surf-1)',border:'1px solid var(--border)',borderRadius:8,overflow:'hidden'}}>
                {/* Language */}
                <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)'}}>
                  <div style={{fontSize:12,fontWeight:500,color:'var(--text)',marginBottom:8}}>Language</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {['EN','KO','ZH','PT-BR','FR','RU','TW'].map(l=>(
                      <button key={l} style={{padding:'4px 10px',borderRadius:4,border:'1px solid',fontSize:11,fontWeight:500,background:l==='EN'?'var(--accent-lt)':'none',borderColor:l==='EN'?'var(--accent-mid)':'var(--border-s)',color:l==='EN'?'var(--accent)':'var(--text-3)',cursor:'pointer',fontFamily:'var(--font)'}}>{l}</button>
                    ))}
                  </div>
                </div>
                {/* Transport */}
                <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)'}}>
                  <div style={{fontSize:12,fontWeight:500,color:'var(--text)',marginBottom:8}}>Default Transport</div>
                  <div style={{display:'flex',gap:8}}>
                    {[['car','Car'],['bus','Public Transport']].map(([id,lbl])=>(
                      <button key={id} onClick={()=>setTransport(id)} style={{flex:1,height:36,borderRadius:6,border:'1px solid',fontSize:12,fontWeight:500,background:transport===id?'var(--accent-lt)':'none',borderColor:transport===id?'var(--accent-mid)':'var(--border-s)',color:transport===id?'var(--accent)':'var(--text-3)',cursor:'pointer',fontFamily:'var(--font)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                        <Icon name={id} size={13}/>{lbl}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Interests */}
                <div style={{padding:'14px 16px'}}>
                  <div style={{fontSize:12,fontWeight:500,color:'var(--text)',marginBottom:8}}>Content Interests</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {[['kpop','K-Pop'],['kdrama','K-Drama'],['kbeauty','K-Beauty'],['kculture','K-Culture']].map(([id,lbl])=>(
                      <button key={id} onClick={()=>setInterests(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])} style={{padding:'6px 14px',borderRadius:16,border:'1px solid',fontSize:12,fontWeight:500,background:interests.includes(id)?'var(--accent-lt)':'none',borderColor:interests.includes(id)?'var(--accent-mid)':'var(--border-s)',color:interests.includes(id)?'var(--accent)':'var(--text-2)',cursor:'pointer',fontFamily:'var(--font)'}}>{lbl}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Profile visibility */}
            <div style={{marginBottom:28}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:12}}>Profile</div>
              <div style={{background:'var(--surf-1)',border:'1px solid var(--border)',borderRadius:8,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:500,color:'var(--text)',marginBottom:2}}>Public Profile</div>
                  <div style={{fontSize:12,color:'var(--text-3)'}}>Enable Social tier · appear on leaderboards</div>
                </div>
                <button onClick={()=>setVisibility(v=>!v)} style={{
                  width:44,height:24,borderRadius:12,border:'none',cursor:'pointer',
                  background: visibility?'var(--accent)':'var(--surf-3)',
                  position:'relative',transition:'background 200ms',flexShrink:0,
                }}>
                  <div style={{width:18,height:18,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:visibility?23:3,transition:'left 200ms',}}/>
                </button>
              </div>
            </div>
            {/* Danger zone */}
            <div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--danger)',marginBottom:12}}>Danger Zone</div>
              <div style={{background:'var(--danger-bg)',border:'1px solid var(--danger)',borderRadius:8,padding:'14px 16px'}}>
                <div style={{fontSize:13,fontWeight:500,color:'var(--danger)',marginBottom:4}}>Delete Account</div>
                <div style={{fontSize:12,color:'var(--text-2)',marginBottom:12,lineHeight:1.5}}>Account will be deactivated. You have 30 days to reactivate before all data is permanently deleted.</div>
                <button style={{height:36,padding:'0 16px',borderRadius:6,background:'var(--danger)',border:'none',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)'}}>Delete my account</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Badge detail modal */}
      {badgeModal && (
        <Modal open={!!badgeModal} onClose={()=>setBadgeModal(null)} title="Badge Detail" maxWidth={380}>
          <div style={{textAlign:'center',paddingBottom:8}}>
            <div style={{fontSize:48,marginBottom:12,filter:badgeModal.earned?'none':'grayscale(100%)'}}>{badgeModal.icon}</div>
            <div style={{fontSize:18,fontWeight:800,color:'var(--text)',marginBottom:4}}>{badgeModal.name}</div>
            <div style={{display:'inline-block',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:3,background:'var(--surf-2)',color:rarityColor(badgeModal.rarity),border:`1px solid ${rarityColor(badgeModal.rarity)}`,marginBottom:12,letterSpacing:'0.06em',textTransform:'uppercase'}}>{badgeModal.rarity} · {badgeModal.cat}</div>
            <div style={{fontSize:13,color:'var(--text-2)',lineHeight:1.6,marginBottom:16}}>{badgeModal.desc}</div>
            {badgeModal.earned ? (
              <div style={{fontSize:12,color:'var(--success)',marginBottom:16}}>✓ Earned {badgeModal.date}</div>
            ) : (
              <div style={{fontSize:12,color:'var(--text-3)',marginBottom:16}}>🔒 Not yet earned</div>
            )}
            {badgeModal.earned && (
              <button onClick={()=>{togglePin(badgeModal.id);setBadgeModal(null);}} style={{
                width:'100%',height:38,borderRadius:8,border:`1px solid ${pinned.includes(badgeModal.id)?'var(--border-s)':'var(--accent-mid)'}`,
                background: pinned.includes(badgeModal.id)?'none':'var(--accent-lt)',
                color: pinned.includes(badgeModal.id)?'var(--text-3)':'var(--accent)',
                fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)',
              }}>
                {pinned.includes(badgeModal.id)?'Unpin from profile':'Pin to profile (max 3)'}
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <Modal open={!!deleteModal} onClose={()=>setDeleteModal(null)} title="Delete Itinerary">
          <div>
            <p style={{fontSize:14,color:'var(--text-2)',lineHeight:1.6,marginBottom:20}}>
              Delete <strong style={{color:'var(--text)'}}>{deleteModal.title}</strong>?<br/>This cannot be undone.
            </p>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setDeleteModal(null)} style={{flex:1,height:40,borderRadius:8,border:'1px solid var(--border-s)',background:'none',color:'var(--text-2)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'var(--font)'}}>Cancel</button>
              <button onClick={()=>{setDeleteModal(null);showToast('Itinerary deleted');}} style={{flex:1,height:40,borderRadius:8,border:'none',background:'var(--danger)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)'}}>Delete</button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} visible type="success"/>}
    </div>
  );
};

Object.assign(window, { ProfilePage });
