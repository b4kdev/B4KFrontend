// B4K — Map Page (Default · POI Selected · Plan Active · AI Overlay)

const MAP_POIS = [
  { id:1, name:'Gyeongbokgung Palace',   cat:'Heritage', loc:'Jongno-gu',   rating:4.7, reviews:2841, hours:'09:00–18:00', x:38, y:32 },
  { id:2, name:'N Seoul Tower',          cat:'Landmark', loc:'Namsan',      rating:4.6, reviews:5120, hours:'10:00–23:00', x:48, y:42 },
  { id:3, name:'Bukchon Hanok Village',  cat:'Culture',  loc:'Jongno-gu',   rating:4.4, reviews:1930, hours:'Always open', x:44, y:28 },
  { id:4, name:'Hongdae Street',         cat:'Nightlife',loc:'Mapo-gu',     rating:4.5, reviews:3210, hours:'12:00–04:00', x:28, y:38 },
  { id:5, name:'Insadong',               cat:'Culture',  loc:'Jongno-gu',   rating:4.3, reviews:1540, hours:'10:00–22:00', x:42, y:34 },
  { id:6, name:'Dongdaemun Design Plaza',cat:'Design',   loc:'Jung-gu',     rating:4.5, reviews:2120, hours:'10:00–21:00', x:56, y:36 },
  { id:7, name:'Myeongdong Market',      cat:'Shopping', loc:'Jung-gu',     rating:4.2, reviews:4300, hours:'11:00–23:00', x:50, y:44 },
  { id:8, name:'Lotte World',            cat:'Attraction',loc:'Songpa-gu',  rating:4.4, reviews:6200, hours:'09:30–22:00', x:62, y:56 },
];

const FILTER_CHIPS = ['All','Heritage','Culture','Nightlife','Shopping','Nature','Food','Design'];

const AI_PROMPTS = ['Find BTS-related places','Plan my K-Drama day','Best street food near me','Hidden hanok gems'];

const MapPage = ({ onNav, isMobile }) => {
  const [state, setState] = React.useState('default'); // default | poi | plan | ai
  const [selectedPoi, setSelectedPoi] = React.useState(null);
  const [activeFilter, setActiveFilter] = React.useState('All');
  const [plan, setPlan] = React.useState([]); // array of POI ids
  const [transport, setTransport] = React.useState('car');
  const [aiInput, setAiInput] = React.useState('');
  const [aiMessages, setAiMessages] = React.useState([]);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [sheetState, setSheetState] = React.useState('peek'); // peek|mid|full (mobile)
  const inputRef = React.useRef();

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(null),2500); };

  const filteredPois = activeFilter==='All' ? MAP_POIS : MAP_POIS.filter(p=>p.cat===activeFilter);

  const addToPlan = (poi) => {
    if(plan.includes(poi.id)) return;
    if(plan.length>=10) { showToast('Maximum 10 stops reached'); return; }
    setPlan(p=>[...p,poi.id]);
    setState('plan');
    showToast(`Added: ${poi.name}`);
    if(isMobile) setSheetState('mid');
  };

  const removeFromPlan = (id) => setPlan(p=>p.filter(x=>x!==id));

  const planPois = plan.map(id=>MAP_POIS.find(p=>p.id===id)).filter(Boolean);

  const sendAI = async () => {
    const q = aiInput.trim(); if(!q) return;
    setAiMessages(m=>[...m,{role:'user',text:q}]);
    setAiInput('');
    setAiLoading(true);
    try {
      const resp = await window.claude.complete(`You are B4K, a Korea travel AI assistant. The user asked: "${q}". Reply with 2-3 Korean POI suggestions relevant to their query. For each, give name, category, and 1 sentence why. Keep it concise and travel-focused.`);
      setAiMessages(m=>[...m,{role:'ai',text:resp}]);
    } catch(e) {
      setAiMessages(m=>[...m,{role:'ai',text:'Something went wrong. Try again?',error:true}]);
    }
    setAiLoading(false);
  };

  const POI = selectedPoi ? MAP_POIS.find(p=>p.id===selectedPoi) : null;
  const inPlan = POI && plan.includes(POI.id);

  // ── MAP RENDER ──
  const MapCanvas = () => (
    <div style={{position:'relative',width:'100%',height:'100%',background:'linear-gradient(160deg,#0f1a0f 0%,#1a2f1a 35%,#0d1f1a 60%,#111820 100%)',overflow:'hidden',flexShrink:0}}>
      {/* Grid overlay */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.08}}>
        {Array.from({length:12},(_,i)=><line key={`h${i}`} x1="0%" y1={`${i*9}%`} x2="100%" y2={`${i*9}%`} stroke="#fff" strokeWidth="0.5"/>)}
        {Array.from({length:16},(_,i)=><line key={`v${i}`} x1={`${i*7}%`} y1="0%" x2={`${i*7}%`} y2="100%" stroke="#fff" strokeWidth="0.5"/>)}
      </svg>
      {/* Streets */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.15}}>
        <path d="M0 40% L100% 42%" stroke="#60a5fa" strokeWidth="2" fill="none"/>
        <path d="M40% 0 L42% 100%" stroke="#60a5fa" strokeWidth="2" fill="none"/>
        <path d="M0 60% L100% 58%" stroke="#a3a39f" strokeWidth="1" fill="none"/>
      </svg>

      {/* Plan route */}
      {plan.length>1 && (
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}>
          {planPois.map((p,i)=>{
            if(i===0) return null;
            const prev = planPois[i-1];
            return <line key={i} x1={`${prev.x}%`} y1={`${prev.y}%`} x2={`${p.x}%`} y2={`${p.y}%`} stroke="var(--accent)" strokeWidth="2.5" strokeDasharray={i===planPois.length-1?'none':'8,4'}/>;
          })}
        </svg>
      )}

      {/* POI Markers */}
      {filteredPois.map((p,i)=>{
        const inPlanIdx = plan.indexOf(p.id);
        const isSelected = p.id===selectedPoi;
        const isTrending = i<2;
        return (
          <button key={p.id} onClick={()=>{ setSelectedPoi(p.id); setState('poi'); if(isMobile) setSheetState('mid'); }}
            style={{
              position:'absolute',left:`${p.x}%`,top:`${p.y}%`,
              transform:'translate(-50%,-50%)',
              width: isSelected?20:inPlanIdx>=0?18:isTrending?14:12,
              height: isSelected?20:inPlanIdx>=0?18:isTrending?14:12,
              borderRadius:'50%',
              background: inPlanIdx>=0?'var(--accent)':isSelected?'var(--accent)':'rgba(124,106,247,0.7)',
              border:`2px solid ${isSelected?'#fff':'rgba(255,255,255,0.4)'}`,
              cursor:'pointer',padding:0,
              boxShadow: isSelected?'0 0 0 4px var(--accent-mid)':isTrending?'0 0 0 6px rgba(124,106,247,0.2)':'none',
              transition:'all 200ms',display:'flex',alignItems:'center',justifyContent:'center',
              color:'#fff',fontSize:8,fontWeight:800,
              zIndex: isSelected?10:inPlanIdx>=0?8:1,
            }}>
            {inPlanIdx>=0 ? inPlanIdx+1 : ''}
          </button>
        );
      })}

      {/* Zoom controls */}
      <div style={{position:'absolute',bottom:24,right:16,display:'flex',flexDirection:'column',gap:4}}>
        {['+','−'].map((lbl,i)=>(
          <button key={i} style={{width:32,height:32,borderRadius:6,background:'var(--bg-panel)',border:'1px solid var(--border-s)',color:'var(--text)',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:300}}>{lbl}</button>
        ))}
      </div>

      {/* AI pill (when plan built from AI) */}
      {state==='plan' && aiMessages.length>0 && (
        <button onClick={()=>setState('ai')} style={{
          position:'absolute',bottom:24,left:'50%',transform:'translateX(-50%)',
          background:'var(--accent)',color:'#fff',border:'none',borderRadius:20,
          padding:'6px 16px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)',
          display:'flex',alignItems:'center',gap:6,
        }}>
          ✦ AI Assistant ·
        </button>
      )}

      {/* AI FAB (mobile) */}
      {isMobile && state!=='ai' && (
        <button onClick={()=>setState('ai')} style={{
          position:'absolute',bottom: state==='plan'?140:80,right:16,
          width:52,height:52,borderRadius:'50%',
          background:'var(--accent)',border:'2px solid var(--accent-mid)',
          color:'#fff',fontSize:12,fontWeight:800,cursor:'pointer',
          boxShadow:'0 4px 16px rgba(124,106,247,0.4)',
          display:'flex',alignItems:'center',justifyContent:'center',
        }}>AI</button>
      )}
    </div>
  );

  // ── LEFT PANEL CONTENT (desktop) ──
  const LeftPanelContent = () => (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {/* Filter chips */}
      <div style={{padding:'12px 12px 8px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {FILTER_CHIPS.map(f=>(
            <button key={f} onClick={()=>setActiveFilter(f)} style={{
              padding:'4px 10px',borderRadius:10,border:'1px solid',
              fontSize:11,fontWeight:500,cursor:'pointer',fontFamily:'var(--font)',
              background: f===activeFilter?'var(--accent-lt)':'none',
              borderColor: f===activeFilter?'var(--accent-mid)':'var(--border-s)',
              color: f===activeFilter?'var(--accent)':'var(--text-3)',
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* State: default — region list */}
      {state==='default' && (
        <div style={{flex:1,overflow:'auto',padding:'12px'}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:10}}>Trending Regions</div>
          {['Seoul','Busan','Jeju Island','Gyeongju','Incheon'].map((r,i)=>(
            <div key={r} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--border)',cursor:'pointer'}}>
              <span style={{fontSize:13,color:'var(--text-2)'}}>{r}</span>
              <Icon name="arrow" size={12}/>
            </div>
          ))}
        </div>
      )}

      {/* State: POI selected */}
      {state==='poi' && POI && (
        <div style={{flex:1,overflow:'auto',padding:'16px'}}>
          <div style={{fontSize:16,fontWeight:800,color:'var(--text)',lineHeight:1.2,marginBottom:10}}>{POI.name}</div>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
            <span style={{color:'var(--warning)',fontSize:12}}>★★★★☆</span>
            <span style={{fontSize:12,fontWeight:600,color:'var(--text)'}}>{POI.rating}</span>
            <span style={{fontSize:11,color:'var(--text-3)'}}>({POI.reviews.toLocaleString()} reviews)</span>
          </div>
          <div style={{display:'inline-flex',padding:'3px 10px',borderRadius:10,background:'var(--accent-lt)',border:'1px solid var(--accent-mid)',fontSize:11,color:'var(--accent)',fontWeight:500,marginBottom:8}}>{POI.cat} · {POI.loc}</div>
          <div style={{fontSize:12,color:'var(--text-2)',marginBottom:16,display:'flex',alignItems:'center',gap:4}}>
            <Icon name="clock" size={12}/>
            <span>{POI.hours}</span>
          </div>
          {/* Sponsored label */}
          {POI.id===3 && <div style={{fontSize:10,color:'var(--text-3)',marginBottom:12,letterSpacing:'0.05em'}}>Sponsored</div>}
          <button onClick={()=>addToPlan(POI)} style={{
            width:'100%',height:40,borderRadius:8,border:'none',cursor:'pointer',
            fontFamily:'var(--font)',fontSize:13,fontWeight:600,
            background: inPlan?'var(--success-bg)':plan.length>=10?'var(--surf-3)':'var(--accent)',
            color: inPlan?'var(--success)':plan.length>=10?'var(--text-3)':'#fff',
            marginBottom:10,
          }} disabled={plan.length>=10 && !inPlan}>
            {inPlan ? '✓ Added' : plan.length>=10 ? 'Max 10 stops' : '+ Add to Itinerary'}
          </button>
          <button style={{
            width:'100%',height:36,borderRadius:8,border:'1px solid var(--border-s)',
            background:'none',color:'var(--text-2)',fontSize:13,cursor:'pointer',fontFamily:'var(--font)',
            display:'flex',alignItems:'center',justifyContent:'center',gap:6,
          }}>
            <Icon name="bookmark" size={14}/> Save POI
          </button>
        </div>
      )}

      {/* State: plan active */}
      {state==='plan' && (
        <div style={{flex:1,overflow:'auto',padding:'12px',display:'flex',flexDirection:'column'}}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--text)',marginBottom:10}}>{plan.length} stops · Your Plan</div>
          <div style={{flex:1}}>
            {planPois.map((p,i)=>(
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{width:22,height:22,borderRadius:'50%',background:'var(--accent)',color:'#fff',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                  <div style={{fontSize:10,color:'var(--text-3)'}}>60 min</div>
                </div>
                <button onClick={()=>removeFromPlan(p.id)} style={{background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',padding:2,flexShrink:0}}>
                  <Icon name="x" size={13}/>
                </button>
              </div>
            ))}
          </div>
          {/* Total duration */}
          <div style={{padding:'10px 0',borderTop:'1px solid var(--border)',fontSize:12,color:'var(--text-2)',display:'flex',justifyContent:'space-between'}}>
            <span>Total duration</span>
            <span style={{fontWeight:600}}>{plan.length}h {plan.length*10}m est.</span>
          </div>
          {/* Transport */}
          <div style={{display:'flex',gap:6,marginBottom:10}}>
            {[['car','Car'],['bus','Transit']].map(([id,lbl])=>(
              <button key={id} onClick={()=>setTransport(id)} style={{
                flex:1,height:32,borderRadius:6,border:'1px solid',cursor:'pointer',
                fontSize:11,fontWeight:500,fontFamily:'var(--font)',
                background: transport===id?'var(--accent-lt)':'none',
                borderColor: transport===id?'var(--accent-mid)':'var(--border-s)',
                color: transport===id?'var(--accent)':'var(--text-3)',
                display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              }}>
                <Icon name={id} size={13}/>{lbl}
              </button>
            ))}
          </div>
          <button onClick={()=>setAuthOpen(true)} style={{
            width:'100%',height:40,borderRadius:8,border:'none',
            background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:600,
            cursor:'pointer',fontFamily:'var(--font)',
          }}>Save Plan</button>
        </div>
      )}

      {/* State: AI (desktop panel preview) */}
      {state==='ai' && (
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:20,flexDirection:'column',gap:8}}>
          <div style={{fontSize:12,color:'var(--text-3)',textAlign:'center'}}>AI Overlay is open</div>
          <button onClick={()=>setState(plan.length?'plan':'default')} style={{fontSize:12,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)'}}>← Back to plan</button>
        </div>
      )}
    </div>
  );

  // ── AI OVERLAY ──
  const AiOverlay = () => (
    <div style={{
      position:'absolute', right:0, top:0, bottom:0,
      width: isMobile?'100%':400,
      background:'var(--bg-panel)',
      borderLeft:'1px solid var(--border)',
      display:'flex',flexDirection:'column',
      zIndex:20,
    }}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:28,height:28,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff'}}>✦</div>
          <div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>AI Planner</div>
        </div>
        <button onClick={()=>setState(plan.length?'plan':'default')} style={{background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',padding:4}}>
          {isMobile ? <Icon name="chevD" size={18}/> : <Icon name="x" size={16}/>}
        </button>
      </div>
      {/* Messages */}
      <div style={{flex:1,overflow:'auto',padding:'12px 16px',display:'flex',flexDirection:'column',gap:12}}>
        {aiMessages.length===0 && (
          <div style={{textAlign:'center',padding:'24px 0'}}>
            <div style={{fontSize:13,color:'var(--text-2)',marginBottom:16}}>Ask me to find places or build a plan</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
              {AI_PROMPTS.map(p=>(
                <button key={p} onClick={()=>{ setAiInput(p); setTimeout(()=>inputRef.current?.focus(),50); }} style={{
                  padding:'6px 12px',borderRadius:16,border:'1px solid var(--border-s)',
                  background:'var(--surf-2)',color:'var(--text-2)',fontSize:11,cursor:'pointer',fontFamily:'var(--font)',
                }}>{p}</button>
              ))}
            </div>
          </div>
        )}
        {aiMessages.map((m,i)=>(
          <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
            <div style={{
              maxWidth:'85%',padding:'10px 14px',borderRadius:10,
              background: m.role==='user'?'var(--accent)':'var(--surf-2)',
              color: m.role==='user'?'#fff':'var(--text)',
              fontSize:13,lineHeight:1.6,
              border: m.role==='ai'?'1px solid var(--border)':'none',
            }}>{m.text}</div>
          </div>
        ))}
        {aiLoading && (
          <div style={{display:'flex',gap:6,padding:'8px 14px'}}>
            {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)',opacity:0.6,animation:`bounce 1s ${i*0.2}s infinite`}}/>)}
          </div>
        )}
      </div>
      {/* Input */}
      <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',flexShrink:0}}>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input ref={inputRef} value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendAI()}
            placeholder="Ask me to find places, build a plan…"
            style={{flex:1,height:38,background:'var(--surf-2)',border:'1px solid var(--border-s)',borderRadius:19,padding:'0 16px',fontFamily:'var(--font)',fontSize:13,color:'var(--text)',outline:'none'}}
          />
          <button onClick={sendAI} style={{width:38,height:38,borderRadius:'50%',background:'var(--accent)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Icon name="send" size={15}/>
          </button>
        </div>
      </div>
    </div>
  );

  // ── MOBILE BOTTOM SHEET ──
  const MobileSheet = () => {
    if(state==='ai') return null;
    const heights = { peek:'76px', mid:'50%', full:'88%' };
    return (
      <div style={{
        position:'absolute',bottom:56,left:0,right:0,
        height:heights[sheetState],
        background:'var(--surf-1)',borderRadius:'14px 14px 0 0',
        border:'1px solid var(--border-s)',borderBottom:'none',
        transition:'height var(--dur-lg) var(--ease)',
        zIndex:15,display:'flex',flexDirection:'column',overflow:'hidden',
      }}>
        <div onClick={()=>setSheetState(s=>s==='peek'?'mid':s==='mid'?'full':'peek')} style={{padding:'10px 16px 0',cursor:'pointer',flexShrink:0}}>
          <div style={{width:36,height:4,background:'var(--border-m)',borderRadius:2,margin:'0 auto 10px'}}/>
        </div>
        <div style={{flex:1,overflow:'auto',padding:'0 16px 16px'}}>
          {(state==='default'||state==='poi'&&!POI) && (
            <div>
              <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:4}}>Seoul</div>
              <div style={{fontSize:12,color:'var(--text-3)',marginBottom:12}}>{filteredPois.length} places nearby</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {FILTER_CHIPS.slice(0,5).map(f=>(
                  <button key={f} onClick={()=>setActiveFilter(f)} style={{padding:'4px 10px',borderRadius:10,border:'1px solid',fontSize:11,background:f===activeFilter?'var(--accent-lt)':'none',borderColor:f===activeFilter?'var(--accent-mid)':'var(--border-s)',color:f===activeFilter?'var(--accent)':'var(--text-3)',cursor:'pointer',fontFamily:'var(--font)'}}>{f}</button>
                ))}
              </div>
            </div>
          )}
          {state==='poi' && POI && (
            <div>
              <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:6}}>{POI.name}</div>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                <span style={{color:'var(--warning)',fontSize:12}}>★★★★☆</span>
                <span style={{fontSize:12,fontWeight:600}}>{POI.rating}</span>
                <span style={{fontSize:11,color:'var(--text-3)'}}>· {POI.hours}</span>
              </div>
              <button onClick={()=>addToPlan(POI)} style={{width:'100%',height:42,borderRadius:8,border:'none',background:inPlan?'var(--success-bg)':'var(--accent)',color:inPlan?'var(--success)':'#fff',fontWeight:600,fontSize:14,cursor:'pointer',fontFamily:'var(--font)',marginBottom:8}}>
                {inPlan?'✓ Added to Plan':'+ Add to Itinerary'}
              </button>
            </div>
          )}
          {state==='plan' && (
            <div>
              <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:8}}>{plan.length} stops</div>
              {planPois.map((p,i)=>(
                <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <div style={{width:22,height:22,borderRadius:'50%',background:'var(--accent)',color:'#fff',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</div>
                  <span style={{flex:1,fontSize:13,color:'var(--text)'}}>{p.name}</span>
                  <button onClick={()=>removeFromPlan(p.id)} style={{background:'none',border:'none',color:'var(--text-3)',cursor:'pointer'}}><Icon name="x" size={13}/></button>
                </div>
              ))}
              <div style={{display:'flex',gap:6,marginTop:10,marginBottom:10}}>
                {[['car','Car'],['bus','Transit']].map(([id,lbl])=>(
                  <button key={id} onClick={()=>setTransport(id)} style={{flex:1,height:36,borderRadius:8,border:'1px solid',fontSize:12,fontWeight:500,background:transport===id?'var(--accent-lt)':'none',borderColor:transport===id?'var(--accent-mid)':'var(--border-s)',color:transport===id?'var(--accent)':'var(--text-3)',cursor:'pointer',fontFamily:'var(--font)',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                    <Icon name={id} size={13}/>{lbl}
                  </button>
                ))}
              </div>
              <button onClick={()=>setAuthOpen(true)} style={{width:'100%',height:44,borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontWeight:600,fontSize:14,cursor:'pointer',fontFamily:'var(--font)'}}>Save Plan</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{position:'relative',height:'100%',display:'flex',overflow:'hidden'}}>
      {/* Desktop left panel */}
      {!isMobile && (
        <div style={{width:240,background:'var(--bg-panel)',borderRight:'1px solid var(--border)',flexShrink:0,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <LeftPanelContent/>
        </div>
      )}

      {/* Map + overlay */}
      <div style={{flex:1,position:'relative',overflow:'hidden'}}>
        <MapCanvas/>
        {state==='ai' && <AiOverlay/>}
        {isMobile && <MobileSheet/>}
        {/* AI button (desktop) */}
        {!isMobile && state!=='ai' && (
          <button onClick={()=>setState('ai')} style={{
            position:'absolute',top:16,right:16,
            background:'var(--accent)',color:'#fff',border:'none',borderRadius:20,
            padding:'8px 18px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'var(--font)',
            display:'flex',alignItems:'center',gap:6,
          }}>✦ AI Planner</button>
        )}
      </div>

      {/* Auth gate */}
      <AuthGate open={authOpen} onClose={()=>setAuthOpen(false)} onSignIn={()=>{setAuthOpen(false);showToast('Plan saved! 🎉');}} isMobile={isMobile}/>
      {toast && <Toast message={toast} visible type="success"/>}

      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
    </div>
  );
};

Object.assign(window, { MapPage });
