// B4K Shared Components
// Exports: AppShell, TopBar, SideNav, MobileNav, HamburgerDrawer,
//          Modal, BottomSheet, Toast, AuthGate, NotifPanel, HelpPanel

// ── ICONS (inline SVG helpers) ────────────────────────────────────────
const Icon = ({ name, size=18, stroke=1.6 }) => {
  const paths = {
    home:     <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    map:      <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>,
    grid:     <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    package:  <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    profile:  <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    bell:     <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    globe:    <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
    help:     <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    search:   <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    x:        <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    menu:     <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    chevR:    <polyline points="9 18 15 12 9 6"/>,
    chevL:    <polyline points="15 18 9 12 15 6"/>,
    chevD:    <polyline points="6 9 12 15 18 9"/>,
    chevU:    <polyline points="18 15 12 9 6 15"/>,
    arrow:    <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>,
    heart:    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>,
    star:     <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
    pin:      <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
    clock:    <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    drag:     <><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></>,
    send:     <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    edit:     <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash:    <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>,
    share:    <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
    check:    <polyline points="20 6 9 17 4 12"/>,
    plus:     <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    minus:    <line x1="5" y1="12" x2="19" y2="12"/>,
    car:      <><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
    bus:      <><rect x="2" y="3" width="20" height="16" rx="2"/><path d="M16 3v4M8 3v4M2 11h20M7 15h.01M17 15h.01"/></>,
    info:     <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    trophy:   <><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></>,
    award:    <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{display:'block',flexShrink:0}}>
      {paths[name]}
    </svg>
  );
};

// ── TOPBAR ────────────────────────────────────────────────────────────
const TopBar = ({ onNav, onHamburger, notifCount=3, isMobile, currentPage }) => {
  const [searchVal, setSearchVal] = React.useState('');
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <>
      <header style={{
        height:52, display:'flex', alignItems:'center', padding:'0 16px',
        gap:10, borderBottom:'1px solid var(--border)', flexShrink:0,
        background:'var(--bg-panel)', position:'sticky', top:0, zIndex:80,
      }}>
        {isMobile ? (
          <button onClick={onHamburger} style={{
            width:36,height:36,borderRadius:8,background:'none',border:'none',
            color:'var(--text-2)',cursor:'pointer',display:'flex',alignItems:'center',
            justifyContent:'center',position:'relative',flexShrink:0
          }} aria-label="Menu">
            <Icon name="menu" size={20}/>
            {notifCount>0 && <span style={{
              position:'absolute',top:4,right:4,width:16,height:16,borderRadius:'50%',
              background:'var(--danger)',color:'#fff',fontSize:9,fontWeight:700,
              display:'flex',alignItems:'center',justifyContent:'center'
            }}>{notifCount}</span>}
          </button>
        ) : (
          <div onClick={()=>onNav('home')} style={{
            fontSize:13,fontWeight:900,letterSpacing:'0.04em',color:'var(--text)',
            cursor:'pointer',flexShrink:0,userSelect:'none',padding:'0 8px'
          }}>B4K</div>
        )}

        {/* Search */}
        <div style={{flex:1,maxWidth:480,margin:'0 auto',position:'relative'}}>
          <div style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text-3)',pointerEvents:'none'}}>
            <Icon name="search" size={14} stroke={2}/>
          </div>
          <input
            value={searchVal}
            onChange={e=>setSearchVal(e.target.value)}
            onFocus={()=>isMobile && setSearchOpen(true)}
            placeholder={isMobile ? 'B4K  · Search...' : 'Search itineraries, places, creators…'}
            style={{
              width:'100%',height:32,background:'var(--surf-2)',border:'1px solid var(--border-s)',
              borderRadius:16,padding:'0 32px 0 32px',fontFamily:'var(--font)',
              fontSize:12,color:'var(--text)',outline:'none',
            }}
          />
          {searchVal && (
            <button onClick={()=>setSearchVal('')} style={{
              position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',
              background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',
              display:'flex',alignItems:'center',padding:2
            }}><Icon name="x" size={12}/></button>
          )}
        </div>

        {/* Actions */}
        <div style={{display:'flex',alignItems:'center',gap:4,marginLeft:'auto',flexShrink:0}}>
          {!isMobile && <>
            <button onClick={()=>onNav('notifications')} aria-label="Notifications" style={{
              width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',
              borderRadius:8,color:'var(--text-3)',background:'none',border:'none',cursor:'pointer',
              position:'relative'
            }}>
              <Icon name="bell" size={17}/>
              {notifCount>0 && <span style={{
                position:'absolute',top:4,right:4,width:16,height:16,borderRadius:'50%',
                background:'var(--danger)',color:'#fff',fontSize:9,fontWeight:700,
                display:'flex',alignItems:'center',justifyContent:'center'
              }}>{notifCount}</span>}
            </button>
            <button aria-label="Language" style={{width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,color:'var(--text-3)',background:'none',border:'none',cursor:'pointer'}}>
              <Icon name="globe" size={17}/>
            </button>
            <button onClick={()=>onNav('help')} aria-label="Help" style={{width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,color:'var(--text-3)',background:'none',border:'none',cursor:'pointer'}}>
              <Icon name="help" size={17}/>
            </button>
          </>}
          <div onClick={()=>onNav('profile')} style={{
            width:28,height:28,borderRadius:'50%',background:'var(--accent-lt)',
            border:'1px solid var(--accent-mid)',display:'flex',alignItems:'center',
            justifyContent:'center',fontSize:11,fontWeight:700,color:'var(--accent)',
            cursor:'pointer',marginLeft:4,flexShrink:0
          }}>JK</div>
        </div>
      </header>

      {/* Mobile search overlay */}
      {isMobile && searchOpen && (
        <div style={{
          position:'fixed',inset:0,background:'var(--bg)',zIndex:200,
          display:'flex',flexDirection:'column'
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderBottom:'1px solid var(--border)'}}>
            <button onClick={()=>setSearchOpen(false)} style={{background:'none',border:'none',color:'var(--text-2)',cursor:'pointer',padding:4}}>
              <Icon name="chevL" size={20}/>
            </button>
            <input autoFocus placeholder="Search itineraries, places…" style={{
              flex:1,height:36,background:'var(--surf-2)',border:'1px solid var(--border-s)',
              borderRadius:18,padding:'0 16px',fontFamily:'var(--font)',fontSize:14,
              color:'var(--text)',outline:'none',
            }}/>
          </div>
          <div style={{padding:16}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:12}}>Recent Searches</div>
            {['BTS Seoul trail','Gyeongju heritage','Jeju 3 days'].map(q=>(
              <div key={q} style={{padding:'10px 0',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                <Icon name="clock" size={14} stroke={1.5}/>
                <span style={{fontSize:13,color:'var(--text-2)'}}>{q}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// ── SIDE NAV (desktop) ────────────────────────────────────────────────
const SideNav = ({ currentPage, onNav }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const navItems = [
    { id:'home',     icon:'home',    label:'Home' },
    { id:'map',      icon:'map',     label:'Map' },
    { id:'contents', icon:'grid',    label:'Contents' },
    { id:'packages', icon:'package', label:'Packages' },
    { id:'about',    icon:'info',    label:'About' },
  ];
  const w = collapsed ? 52 : 52; // rail only — panel is separate
  return (
    <div style={{
      width:52,background:'var(--bg-panel)',borderRight:'1px solid var(--border)',
      display:'flex',flexDirection:'column',alignItems:'center',
      padding:'0 0 12px',flexShrink:0,
    }}>
      {/* Logo */}
      <div onClick={()=>onNav('home')} style={{
        width:52,height:52,display:'flex',alignItems:'center',justifyContent:'center',
        borderBottom:'1px solid var(--border)',cursor:'pointer',flexShrink:0
      }}>
        <div style={{fontSize:11,fontWeight:900,lineHeight:1.1,textAlign:'center',letterSpacing:'0.02em',color:'var(--text)'}}>B4K</div>
      </div>

      {/* Nav items */}
      <nav style={{display:'flex',flexDirection:'column',gap:2,flex:1,padding:'8px 6px',width:'100%'}}>
        {navItems.map(({id,icon,label})=>(
          <button key={id} onClick={()=>onNav(id)} aria-label={label} style={{
            width:40,height:40,display:'flex',flexDirection:'column',alignItems:'center',
            justifyContent:'center',borderRadius:8,border:'none',cursor:'pointer',
            background: currentPage===id ? 'var(--accent-lt)' : 'none',
            color: currentPage===id ? 'var(--accent)' : 'var(--text-3)',
            gap:2,transition:'background 150ms,color 150ms',
          }}>
            <Icon name={icon} size={17}/>
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{display:'flex',flexDirection:'column',gap:4,padding:'0 6px',width:'100%',alignItems:'center'}}>
        <button onClick={()=>onNav('profile')} aria-label="Profile" style={{
          width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',
          borderRadius:8,border:'none',cursor:'pointer',
          background: currentPage==='profile' ? 'var(--accent-lt)' : 'none',
          color: currentPage==='profile' ? 'var(--accent)' : 'var(--text-3)',
        }}>
          <Icon name="profile" size={17}/>
        </button>
      </div>
    </div>
  );
};

// ── LEFT PANEL ────────────────────────────────────────────────────────
const LeftPanel = ({ page, children }) => (
  <div style={{
    width:224,background:'var(--bg-panel)',borderRight:'1px solid var(--border)',
    overflow:'hidden auto',flexShrink:0,display:'flex',flexDirection:'column',
  }}>
    {children}
  </div>
);

// ── MOBILE BOTTOM NAV ─────────────────────────────────────────────────
const MobileNav = ({ currentPage, onNav }) => {
  const tabs = [
    { id:'home',     icon:'home',    label:'Home' },
    { id:'map',      icon:'map',     label:'Map' },
    { id:'contents', icon:'grid',    label:'Contents' },
    { id:'profile',  icon:'profile', label:'Profile' },
  ];
  return (
    <nav style={{
      position:'fixed',bottom:0,left:0,right:0,height:56,
      background:'var(--bg-panel)',borderTop:'1px solid var(--border)',
      zIndex:90,display:'flex',alignItems:'center',justifyContent:'space-around',
      padding:'0 8px',
    }}>
      {tabs.map(({id,icon,label})=>(
        <button key={id} onClick={()=>onNav(id)} style={{
          display:'flex',flexDirection:'column',alignItems:'center',gap:3,
          padding:'4px 16px',borderRadius:8,border:'none',cursor:'pointer',
          background:'none',
          color: currentPage===id ? 'var(--accent)' : 'var(--text-3)',
          flex:1,
        }}>
          <Icon name={icon} size={20}/>
          <span style={{fontSize:9,fontWeight:600,letterSpacing:'0.04em'}}>{label}</span>
        </button>
      ))}
    </nav>
  );
};

// ── HAMBURGER DRAWER (mobile) ─────────────────────────────────────────
const HamburgerDrawer = ({ open, onClose, onNav, user }) => {
  const items = [
    { id:'notifications', icon:'bell',     label:'Notifications', badge:3 },
    { id:'packages',      icon:'package',  label:'Packages' },
    { id:'help',          icon:'help',     label:'Help' },
    { id:'settings',      icon:'settings', label:'Settings' },
    { id:'about',         icon:'info',     label:'About' },
  ];
  return (
    <>
      {open && <div onClick={onClose} style={{position:'fixed',inset:0,background:'var(--scrim)',zIndex:110,}}/>}
      <div style={{
        position:'fixed',top:0,left:0,bottom:0,width:280,
        background:'var(--bg-panel)',zIndex:120,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform var(--dur-lg) var(--ease)',
        borderRight:'1px solid var(--border)',
        display:'flex',flexDirection:'column',overflowY:'auto',
      }}>
        {/* Account */}
        <div style={{padding:'20px 20px 16px',borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:44,height:44,borderRadius:'50%',background:'var(--accent-lt)',border:'2px solid var(--accent-mid)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'var(--accent)'}}>JK</div>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>sunmin</div>
              <div style={{fontSize:11,color:'var(--accent)',fontWeight:500}}>Social tier</div>
            </div>
          </div>
        </div>
        {/* Nav */}
        <div style={{flex:1,padding:'8px 0'}}>
          {items.map(({id,icon,label,badge})=>(
            <button key={id} onClick={()=>{onNav(id);onClose();}} style={{
              width:'100%',display:'flex',alignItems:'center',gap:12,
              padding:'12px 20px',border:'none',background:'none',
              color:'var(--text-2)',cursor:'pointer',fontSize:14,fontFamily:'var(--font)',
              textAlign:'left',
            }}>
              <Icon name={icon} size={18}/>
              <span style={{flex:1}}>{label}</span>
              {badge && <span style={{background:'var(--danger)',color:'#fff',borderRadius:'50%',width:18,height:18,fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{badge}</span>}
              <Icon name="chevR" size={14}/>
            </button>
          ))}
        </div>
        {/* Language */}
        <div style={{padding:'12px 20px',borderTop:'1px solid var(--border)'}}>
          <div style={{fontSize:11,color:'var(--text-3)',marginBottom:8,fontWeight:600,letterSpacing:'0.05em',textTransform:'uppercase'}}>Language</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {['EN','KO','ZH','PT-BR','FR','RU','TW'].map(l=>(
              <button key={l} style={{
                padding:'4px 10px',borderRadius:4,border:'1px solid',fontSize:11,fontWeight:500,
                background: l==='EN'?'var(--accent-lt)':'none',
                borderColor: l==='EN'?'var(--accent-mid)':'var(--border-s)',
                color: l==='EN'?'var(--accent)':'var(--text-3)',cursor:'pointer',fontFamily:'var(--font)',
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// ── MODAL ─────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, maxWidth=480 }) => {
  if(!open) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'var(--scrim)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'var(--surf-1)',border:'1px solid var(--border-s)',
        borderRadius:12,width:'100%',maxWidth,
        boxShadow:'0 24px 64px rgba(0,0,0,0.5)',
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:15,fontWeight:700,color:'var(--text)'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',padding:4}}><Icon name="x" size={16}/></button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  );
};

// ── BOTTOM SHEET (mobile) ─────────────────────────────────────────────
const BottomSheet = ({ open, onClose, children, height='50%', title }) => (
  <>
    {open && <div onClick={onClose} style={{position:'fixed',inset:0,background:'var(--scrim)',zIndex:150}}/>}
    <div style={{
      position:'fixed',bottom:0,left:0,right:0,
      height:open?height:0,overflow:'hidden',
      background:'var(--surf-1)',borderRadius:'14px 14px 0 0',
      zIndex:160,transition:'height var(--dur-lg) var(--ease)',
      border:'1px solid var(--border-s)',borderBottom:'none',
    }}>
      <div style={{padding:'10px 16px 0',display:'flex',flexDirection:'column',height:'100%',overflow:'hidden auto'}}>
        <div style={{width:36,height:4,background:'var(--border-m)',borderRadius:2,margin:'0 auto 12px'}}/>
        {title && <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:12}}>{title}</div>}
        {children}
      </div>
    </div>
  </>
);

// ── TOAST ─────────────────────────────────────────────────────────────
const Toast = ({ message, type='success', visible }) => (
  <div style={{
    position:'fixed',bottom:80,left:'50%',transform:'translateX(-50%)',
    background: type==='success'?'var(--success-bg)':'var(--danger-bg)',
    border:`1px solid ${type==='success'?'var(--success)':'var(--danger)'}`,
    color: type==='success'?'var(--success)':'var(--danger)',
    borderRadius:8,padding:'10px 20px',fontSize:13,fontWeight:500,
    zIndex:300,whiteSpace:'nowrap',
    opacity: visible?1:0, transition:'opacity 300ms',
    pointerEvents:'none',
  }}>{message}</div>
);

// ── AUTH GATE ─────────────────────────────────────────────────────────
const AuthGate = ({ open, onClose, onSignIn, isMobile }) => {
  const content = (
    <div style={{textAlign:'center',padding:'8px 0 4px'}}>
      <div style={{fontSize:32,marginBottom:12}}>✦</div>
      <div style={{fontSize:17,fontWeight:700,color:'var(--text)',marginBottom:8}}>Join B4K</div>
      <div style={{fontSize:13,color:'var(--text-2)',marginBottom:24,lineHeight:1.6}}>
        Save your plan · unlock leaderboards<br/>earn badges · share with the world
      </div>
      <button onClick={onSignIn} style={{
        display:'flex',alignItems:'center',justifyContent:'center',gap:10,
        width:'100%',height:44,borderRadius:8,border:'1px solid var(--border-s)',
        background:'var(--surf-2)',color:'var(--text)',fontSize:14,fontWeight:500,
        cursor:'pointer',fontFamily:'var(--font)',marginBottom:12,
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
        Continue with Google
      </button>
      <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',fontSize:12,fontFamily:'var(--font)'}}>
        Maybe later
      </button>
    </div>
  );
  if(isMobile) return <BottomSheet open={open} onClose={onClose} height="380px">{content}</BottomSheet>;
  return <Modal open={open} onClose={onClose} title="" maxWidth={380}>{content}</Modal>;
};

// ── NOTIFICATIONS PANEL ───────────────────────────────────────────────
const NotifPanel = ({ open, onClose }) => {
  const notifs = [
    { type:'like',  icon:'heart',  text:'sunwoo liked your itinerary', sub:'Seoul Night Circuit · 2h ago' },
    { type:'badge', icon:'award',  text:'You earned the K-Pop Pilgrim badge!', sub:'Tap to view · 5h ago' },
    { type:'rank',  icon:'trophy', text:'You moved to #4 on K-Pop leaderboard', sub:'This week · Yesterday' },
    { type:'event', icon:'bell',   text:'New K-Pop concert drop: aespa Seoul', sub:'Platform · 2d ago' },
    { type:'like',  icon:'heart',  text:'2 people liked your Busan Coastal trip', sub:'3d ago' },
  ];
  return (
    <>
      {open && <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:109}}/>}
      <div style={{
        position:'fixed',top:52,right:0,width:340,bottom:0,
        background:'var(--bg-panel)',borderLeft:'1px solid var(--border)',
        zIndex:110,transform: open?'translateX(0)':'translateX(100%)',
        transition:'transform var(--dur-lg) var(--ease)',
        display:'flex',flexDirection:'column',
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:15,fontWeight:700,color:'var(--text)'}}>Notifications</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',padding:4}}><Icon name="x" size={16}/></button>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {notifs.map((n,i)=>(
            <div key={i} style={{display:'flex',gap:12,padding:'14px 20px',borderBottom:'1px solid var(--border)',cursor:'pointer'}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'var(--accent-lt)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'var(--accent)'}}>
                <Icon name={n.icon} size={16}/>
              </div>
              <div>
                <div style={{fontSize:13,color:'var(--text)',lineHeight:1.4,marginBottom:3}}>{n.text}</div>
                <div style={{fontSize:11,color:'var(--text-3)'}}>{n.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// ── HELP PANEL ────────────────────────────────────────────────────────
const HelpPanel = ({ open, onClose }) => {
  const [openFaq, setOpenFaq] = React.useState(null);
  const faqs = [
    { q:'How do I save an itinerary?', a:'Tap "Save plan" in the planning panel. You\'ll need a B4K account to save permanently.' },
    { q:'What is the AI planner?', a:'The AI planner builds a custom day-plan from your prompt. Try "Plan my K-Drama day in Seoul".' },
    { q:'How do I earn badges?', a:'Complete travel milestones like saving your first itinerary, visiting 5 cities, or completing the BTS trail.' },
    { q:'How do leaderboards work?', a:'Rankings are based on likes + saves on your published itineraries. Only Social/Creator tier users appear.' },
    { q:'What languages are supported?', a:'EN · KO · ZH · PT-BR · FR · RU · TW. Change via the globe icon in the topbar.' },
  ];
  return (
    <>
      {open && <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:109}}/>}
      <div style={{
        position:'fixed',top:52,right:0,width:340,bottom:0,
        background:'var(--bg-panel)',borderLeft:'1px solid var(--border)',
        zIndex:110,transform: open?'translateX(0)':'translateX(100%)',
        transition:'transform var(--dur-lg) var(--ease)',
        display:'flex',flexDirection:'column',
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:15,fontWeight:700,color:'var(--text)'}}>Help</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',padding:4}}><Icon name="x" size={16}/></button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'16px 0'}}>
          <div style={{padding:'0 20px 12px',fontSize:11,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--text-3)'}}>FAQ</div>
          {faqs.map((f,i)=>(
            <div key={i} style={{borderBottom:'1px solid var(--border)'}}>
              <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{
                width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',
                padding:'12px 20px',background:'none',border:'none',cursor:'pointer',
                color:'var(--text)',fontSize:13,fontFamily:'var(--font)',textAlign:'left',gap:12,
              }}>
                <span>{f.q}</span>
                <Icon name={openFaq===i?'chevU':'chevD'} size={14}/>
              </button>
              {openFaq===i && <div style={{padding:'0 20px 12px',fontSize:12,color:'var(--text-2)',lineHeight:1.6}}>{f.a}</div>}
            </div>
          ))}
          <div style={{padding:'20px 20px 0'}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:12}}>Contact Support</div>
            <textarea placeholder="Describe your issue…" style={{
              width:'100%',height:80,background:'var(--surf-2)',border:'1px solid var(--border-s)',
              borderRadius:8,padding:'8px 12px',fontFamily:'var(--font)',fontSize:12,
              color:'var(--text)',resize:'none',outline:'none',
            }}/>
            <button style={{
              marginTop:8,width:'100%',height:36,borderRadius:6,
              background:'var(--accent-lt)',border:'1px solid var(--accent-mid)',
              color:'var(--accent)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)',
            }}>Send Message</button>
          </div>
        </div>
      </div>
    </>
  );
};

// ── ONBOARDING ────────────────────────────────────────────────────────
const Onboarding = ({ onComplete }) => {
  const [selected, setSelected] = React.useState([]);
  const cats = [
    { id:'kpop',    label:'K-Pop',    color:'var(--accent)',  desc:'Concerts · Agencies · Merch' },
    { id:'kdrama',  label:'K-Drama',  color:'var(--teal)',    desc:'Filming locations · Set tours' },
    { id:'kbeauty', label:'K-Beauty', color:'#e879a8',        desc:'Flagship stores · Skincare routes' },
    { id:'kculture',label:'K-Culture',color:'var(--gold)',    desc:'Heritage · Food · Seasonal events' },
  ];
  const toggle = id => setSelected(s => s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  return (
    <div style={{position:'fixed',inset:0,background:'var(--bg)',zIndex:300,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32}}>
      <div style={{fontSize:28,fontWeight:800,letterSpacing:'-0.02em',color:'var(--text)',marginBottom:8,textAlign:'center'}}>What brings you to Korea?</div>
      <div style={{fontSize:14,color:'var(--text-2)',marginBottom:36,textAlign:'center'}}>Pick your interests to personalise your B4K experience</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,width:'100%',maxWidth:600,marginBottom:32}}>
        {cats.map(c=>{
          const on = selected.includes(c.id);
          return (
            <button key={c.id} onClick={()=>toggle(c.id)} style={{
              padding:'24px 20px',borderRadius:12,border:`2px solid ${on?c.color:'var(--border-s)'}`,
              background: on?`color-mix(in oklch, ${c.color} 12%, var(--bg))`:'var(--surf-1)',
              cursor:'pointer',textAlign:'left',transition:'all 150ms',fontFamily:'var(--font)',
            }}>
              <div style={{fontSize:20,fontWeight:800,color: on?c.color:'var(--text)',marginBottom:6}}>{c.label}</div>
              <div style={{fontSize:12,color:'var(--text-3)',lineHeight:1.5}}>{c.desc}</div>
              {on && <div style={{marginTop:8,color:c.color,fontSize:13,fontWeight:600}}>✓ Selected</div>}
            </button>
          );
        })}
      </div>
      <div style={{display:'flex',gap:12}}>
        <button onClick={onComplete} style={{height:44,padding:'0 32px',borderRadius:8,border:'1px solid var(--border-s)',background:'none',color:'var(--text-2)',cursor:'pointer',fontSize:13,fontFamily:'var(--font)'}}>Skip</button>
        <button onClick={onComplete} style={{height:44,padding:'0 32px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',cursor:'pointer',fontSize:14,fontWeight:600,fontFamily:'var(--font)'}}>Continue →</button>
      </div>
    </div>
  );
};

// ── APP SHELL ─────────────────────────────────────────────────────────
const AppShell = ({ currentPage, onNav, isMobile, children, showLeftPanel, leftPanelContent }) => {
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleNav = (page) => {
    if(page==='notifications') { setNotifOpen(true); return; }
    if(page==='help') { setHelpOpen(true); return; }
    onNav(page);
  };

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'var(--bg)'}}>
      {!isMobile && <SideNav currentPage={currentPage} onNav={handleNav}/>}
      {!isMobile && showLeftPanel && <LeftPanel>{leftPanelContent}</LeftPanel>}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        <TopBar onNav={handleNav} onHamburger={()=>setDrawerOpen(true)} isMobile={isMobile} currentPage={currentPage} notifCount={3}/>
        <div style={{flex:1,overflow:'hidden auto',...(isMobile&&{paddingBottom:56})}}>
          {children}
        </div>
      </div>
      {isMobile && <MobileNav currentPage={currentPage} onNav={handleNav}/>}
      {isMobile && <HamburgerDrawer open={drawerOpen} onClose={()=>setDrawerOpen(false)} onNav={handleNav}/>}
      {!isMobile && <NotifPanel open={notifOpen} onClose={()=>setNotifOpen(false)}/>}
      {!isMobile && <HelpPanel open={helpOpen} onClose={()=>setHelpOpen(false)}/>}
    </div>
  );
};

Object.assign(window, {
  Icon, TopBar, SideNav, LeftPanel, MobileNav,
  HamburgerDrawer, Modal, BottomSheet, Toast,
  AuthGate, NotifPanel, HelpPanel, Onboarding, AppShell,
});
