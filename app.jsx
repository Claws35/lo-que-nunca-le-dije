// Main React app for "Lo que nunca le dije"
// Depends on: data.js (window.HOGUERA_DATA), hoguera3d.js (window.Hoguera)

(function () {

const { useState, useEffect, useRef, useCallback } = React;
const HD = window.HOGUERA_DATA;
const CATEGORIES     = HD.CATEGORIES;
const CATEGORY_ORDER = HD.CATEGORY_ORDER;

const sb = window.supabase.createClient(
  'https://gumsprpxtoywqvolkuem.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1bXNwcnB4dG95d3F2b2xrdWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjI3MDksImV4cCI6MjA5MjA5ODcwOX0.SlYCtp94Uo946cbXWZaEoh65KLW1Md4hCssW7w51SFs'
);

// ---------------------------------------------------------------------------
// Tweak defaults
// ---------------------------------------------------------------------------
const TWEAKS = {
  glowIntensity: 1.0,
  serifFont: 'Cormorant Garamond',
  baseHue: 22,
  showCounterTicker: true,
};

// ---------------------------------------------------------------------------
// Realtime total count
// ---------------------------------------------------------------------------
function useRealtimeCount() {
  const [count, setCount] = useState(null);
  useEffect(() => {
    sb.from('secrets').select('*', { count: 'exact', head: true })
      .then(({ count: n }) => { if (n != null) setCount(n); });
    const ch = sb.channel('rt-count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'secrets' },
        () => setCount(c => (c ?? 0) + 1))
      .subscribe();
    return () => sb.removeChannel(ch);
  }, []);
  return count;
}

function formatN(n) {
  if (n == null) return '…';
  return n.toLocaleString('es-ES');
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------
function CategoryPill({ cat, active, onClick, dim }) {
  const c = CATEGORIES[cat];
  return (
    <button
      onClick={onClick}
      className={`cat-pill ${active ? 'active' : ''} ${dim ? 'dim' : ''}`}
      style={{ '--cat-color': c.color }}
    >
      <span className="cat-dot" />
      <span>{c.label.toLowerCase()}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------
function Navbar({ screen, go }) {
  const links = [
    { id: 'hoguera',  label: 'la hoguera' },
    { id: 'escribir', label: 'escribir' },
    { id: 'mosaico',  label: 'mosaico' },
    { id: 'sobre',    label: 'sobre' },
  ];
  return (
    <nav className="nav">
      <button className="brand" onClick={() => go('inicio')}>
        <span className="brand-ember" />
        <span className="brand-name">lo que nunca le dije</span>
      </button>
      <div className="nav-links">
        {links.map(l => (
          <button
            key={l.id}
            className={`nav-link ${screen === l.id ? 'active' : ''}`}
            onClick={() => go(l.id)}
          >{l.label}</button>
        ))}
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Screen 1: INICIO
// ---------------------------------------------------------------------------
function Inicio({ go }) {
  const canvasRef = useRef(null);
  const count = useRealtimeCount();

  useEffect(() => {
    const inst = window.Hoguera.mount(canvasRef.current, { mode: 'hero' });
    return () => inst.dispose();
  }, []);

  return (
    <div className="screen inicio">
      <canvas ref={canvasRef} className="hoguera-bg" />
      <div className="vignette" />
      <div className="inicio-content">
        <div className="inicio-topline">
          <span className="dot-pulse" />
          <span>hoguera colectiva · anónima · encendida ahora</span>
        </div>
        <h1 className="hero-title">Lo que nunca<br/>le dije</h1>
        <p className="hero-tagline">
          Hay cosas que nunca dijiste.<br/>
          Este es el lugar para soltarlas.
        </p>
        <button className="cta" onClick={() => go('escribir')}>
          <span className="cta-ember" />
          <span>Escribir lo que nunca dije</span>
        </button>
        <div className="inicio-counter">
          <div className="counter-n">{formatN(count)}</div>
          <div className="counter-label">brasas ardiendo</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen 2: ESCRIBIR
// ---------------------------------------------------------------------------
function Escribir({ go, onSubmit }) {
  const [text, setText] = useState('');
  const [cat, setCat] = useState('amor');
  const [sending, setSending] = useState(false);
  const MAX = 300;
  const remaining = MAX - text.length;
  const canSubmit = text.trim().length >= 4 && !sending;

  async function handleSubmit() {
    setSending(true);
    await onSubmit({ text: text.trim(), cat });
    go('confirmacion');
  }

  return (
    <div className="screen escribir">
      <div className="escribir-inner">
        <div className="escribir-header">
          <div className="eyebrow">paso 1 de 2 · escribir</div>
          <h2 className="screen-title">Dilo aquí.<br/>Nadie sabrá que fuiste tú.</h2>
        </div>
        <div className="textarea-wrap">
          <textarea
            className="secret-input"
            placeholder="Nunca te dije que…"
            value={text}
            maxLength={MAX}
            onChange={e => setText(e.target.value)}
            autoFocus
          />
          <div className={`counter ${remaining < 40 ? 'warn' : ''}`}>
            {remaining} <span className="counter-sub">caracteres</span>
          </div>
        </div>
        <div className="cat-select">
          <div className="field-label">¿De qué se trata?</div>
          <div className="cat-pills">
            {CATEGORY_ORDER.map(c => (
              <CategoryPill key={c} cat={c} active={cat === c} onClick={() => setCat(c)} />
            ))}
          </div>
        </div>
        <div className="escribir-foot">
          <div className="anon-note">
            <span className="anon-dot" />
            <span>Anónimo. No guardamos IP, cuenta, ni huella. Tu brasa no tiene nombre.</span>
          </div>
          <button className="cta cta-primary" disabled={!canSubmit} onClick={handleSubmit}>
            {sending ? 'Soltando…' : 'Soltar esta palabra'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen 3: CONFIRMACIÓN
// ---------------------------------------------------------------------------
function Confirmacion({ go, pending }) {
  const cat = pending?.cat || 'amor';
  const c = CATEGORIES[cat];
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 150);
    const t2 = setTimeout(() => setPhase(2), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="screen confirmacion">
      <div className="conf-inner">
        <div className={`ember-birth p${phase}`} style={{ '--cat-color': c.color }}>
          <div className="eb-core" />
          <div className="eb-halo" />
          <div className="eb-spark eb-spark-1" />
          <div className="eb-spark eb-spark-2" />
          <div className="eb-spark eb-spark-3" />
        </div>
        <h2 className="conf-title">Tu brasa ya está en la hoguera.</h2>
        <p className="conf-sub">
          Se va a elevar sola. Se va a mezclar con otras. Nadie sabrá cuál es la tuya —
          ni siquiera tú, dentro de unos segundos.
        </p>
        <div className="conf-actions">
          <button className="cta cta-primary" onClick={() => go('hoguera')}>Ver la hoguera</button>
          <button className="cta cta-ghost" onClick={() => go('ecos')}>Ver ecos parecidos</button>
        </div>
        <button className="link-quiet" onClick={() => go('escribir')}>soltar otra</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen 4: LA HOGUERA (fullscreen 3D)
// ---------------------------------------------------------------------------
function LaHoguera({ secrets }) {
  const canvasRef = useRef(null);
  const instRef = useRef(null);
  const tooltipRef = useRef(null);
  const [filter, setFilter] = useState(null);
  const [hover, setHover] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [mobileSecret, setMobileSecret] = useState(null);
  const [mobileVisible, setMobileVisible] = useState(false);
  const count = useRealtimeCount();

  // Detectar touch real — guardado en ref para no cambiar entre renders
  const isMobileRef = useRef(
    window.matchMedia('(hover: none) and (pointer: coarse)').matches
  );
  const isMobile = isMobileRef.current;

  // Mueve el tooltip DOM directamente, sin re-render React
  const onMobilePosition = useCallback((sx, sy) => {
    const el = tooltipRef.current;
    if (!el) return;
    const w = el.offsetWidth  || 180;
    const h = el.offsetHeight || 60;
    const x = Math.max(8, Math.min(sx - w / 2, window.innerWidth  - w - 8));
    const y = Math.max(8, Math.min(sy - h - 18, window.innerHeight - h - 8));
    el.style.transform = `translate(${x}px, ${y}px)`;
  }, []);

  // Montar hoguera — hover SIEMPRE activo (desktop y mobile)
  useEffect(() => {
    instRef.current = window.Hoguera.mount(canvasRef.current, {
      mode: 'full',
      getSecrets: () => secrets,
      onHover: (info) => setHover(info),
      onMobilePosition,
    });
    return () => instRef.current?.dispose();
  }, []);

  useEffect(() => {
    instRef.current?.setFilter(filter);
  }, [filter]);

  // Ciclo automático mobile — arranca cuando llegan los secretos
  useEffect(() => {
    if (!isMobile || secrets.length === 0) return;
    const real = secrets.filter(s => s.text);
    if (real.length === 0) return;

    let idx = Math.floor(Math.random() * real.length);
    let showTimer, hideTimer;

    function cycle() {
      const secret = real[idx % real.length];
      idx = (idx + 1) % real.length;
      const emberIdx = secrets.findIndex(s => s.id === secret.id);
      if (emberIdx >= 0) instRef.current?.setMobileEmber(emberIdx);
      setMobileSecret(secret);
      setMobileVisible(true);
      hideTimer = setTimeout(() => {
        setMobileVisible(false);
        showTimer = setTimeout(cycle, 3000);
      }, 3000);
    }

    showTimer = setTimeout(cycle, 1000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [secrets.length]); // re-arranca cuando cargan secretos de Supabase

  return (
    <div className="screen hoguera-full"
         onMouseMove={e => setMouse({ x: e.clientX, y: e.clientY })}>
      <canvas ref={canvasRef} className="hoguera-bg" />
      <div className="vignette strong" />
      <div className="full-overlay">
        <div className="full-top">
          <div className="full-top-left">
            <div className="eyebrow">la hoguera</div>
            <div className="full-count">{formatN(count)} <span>brasas</span></div>
          </div>
          <div className="full-top-right">
            <span className="hint">
              {isMobile ? 'arrastrá para girar' : 'arrastrá · hacé hover sobre una brasa'}
            </span>
          </div>
        </div>
        <div className="full-filters">
          <button
            className={`cat-pill filter-all ${filter === null ? 'active' : ''}`}
            onClick={() => setFilter(null)}
          >
            <span>todas</span>
          </button>
          {CATEGORY_ORDER.map(c => (
            <CategoryPill
              key={c} cat={c}
              active={filter === c}
              onClick={() => setFilter(filter === c ? null : c)}
            />
          ))}
        </div>
      </div>

      {/* Tooltip desktop — sigue el cursor (hover) */}
      {hover && (
        <div
          className="ember-tooltip"
          style={{
            left: Math.min(mouse.x + 18, window.innerWidth - 360),
            top:  Math.min(mouse.y + 18, window.innerHeight - 160),
            '--cat-color': CATEGORIES[hover.cat].color,
          }}
        >
          <div className="tip-cat">
            <span className="tip-dot" />
            <span>{CATEGORIES[hover.cat].label.toLowerCase()}</span>
          </div>
          <div className="tip-text">{hover.secret.text}</div>
        </div>
      )}

      {/* Tooltip mobile — sigue la brasa en 3D */}
      {isMobile && mobileSecret && (
        <div
          ref={tooltipRef}
          className={`ember-tooltip-mobile ${mobileVisible ? 'visible' : ''}`}
          style={{ '--cat-color': CATEGORIES[mobileSecret.cat].color }}
        >
          <div className="tip-cat">
            <span className="tip-dot" />
            <span>{CATEGORIES[mobileSecret.cat].label.toLowerCase()}</span>
          </div>
          <div className="tip-text">{mobileSecret.text}</div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen 5: ECOS
// ---------------------------------------------------------------------------
function Ecos({ go, pending }) {
  const [ecos, setEcos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pending) { setLoading(false); return; }
    sb.from('secrets')
      .select('id, cat, text')
      .eq('cat', pending.cat)
      .neq('id', pending.id)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setEcos(data || []);
        setLoading(false);
      });
  }, [pending?.id]);

  return (
    <div className="screen ecos">
      <div className="ecos-inner">
        <div className="eyebrow">ecos</div>
        <h2 className="screen-title">
          Otras brasas<br/>que laten parecido a la tuya.
        </h2>
        <p className="ecos-lede">
          Personas, en algún lugar del mundo, escribieron algo que resuena
          con lo que vos dejaste. No sabés quiénes son. Ellos tampoco.
        </p>

        {pending && (
          <div className="your-ember">
            <div className="your-ember-label">lo tuyo</div>
            <div className="your-ember-text" style={{ '--cat-color': CATEGORIES[pending.cat].color }}>
              <span className="your-ember-dot" />
              <span>"{pending.text}"</span>
            </div>
          </div>
        )}

        <div className="eco-list">
          {loading && <p style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>Buscando ecos…</p>}
          {!loading && ecos.length === 0 && (
            <p style={{ color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--serif-family)', fontSize: 18 }}>
              Todavía sos el primero en soltar algo de esta categoría. Pronto habrá ecos.
            </p>
          )}
          {ecos.map(eco => (
            <article key={eco.id} className="eco-card" style={{ '--cat-color': CATEGORIES[eco.cat].color }}>
              <div className="eco-head">
                <div className="eco-cat">
                  <span className="eco-dot" />
                  <span>{CATEGORIES[eco.cat].label.toLowerCase()}</span>
                </div>
              </div>
              <p className="eco-text">"{eco.text}"</p>
            </article>
          ))}
        </div>

        <div className="ecos-actions">
          <button className="cta cta-ghost" onClick={() => go('hoguera')}>Volver a la hoguera</button>
          <button className="cta" onClick={() => go('escribir')}>Soltar otra</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen 6: MOSAICO EMOCIONAL
// ---------------------------------------------------------------------------
function Mosaico() {
  const total = useRealtimeCount();
  const [hoy, setHoy] = useState(null);
  const [distribucion, setDistribucion] = useState(null);

  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    sb.from('secrets').select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())
      .then(({ count: n }) => setHoy(n ?? 0));

    sb.from('secrets').select('cat')
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const counts = {};
        CATEGORY_ORDER.forEach(c => counts[c] = 0);
        data.forEach(({ cat }) => { if (counts[cat] !== undefined) counts[cat]++; });
        const t = data.length;
        const pcts = {};
        CATEGORY_ORDER.forEach(c => pcts[c] = Math.round((counts[c] / t) * 100));
        setDistribucion(pcts);
      });
  }, []);

  const dist = distribucion || { amor: 0, despedida: 0, gratitud: 0, perdon: 0, enojo: 0, verdad: 0 };

  return (
    <div className="screen mosaico">
      <div className="mosaico-inner">
        <div className="eyebrow">mosaico emocional</div>
        <h2 className="screen-title">Un retrato del silencio,<br/>hecho con las brasas de todos.</h2>
        <div className="stat-row">
          <div className="stat-big">
            <div className="stat-n">{formatN(total)}</div>
            <div className="stat-label">brasas en total</div>
          </div>
          <div className="stat-big">
            <div className="stat-n">{hoy == null ? '…' : `+${hoy}`}</div>
            <div className="stat-label">hoy, en las últimas horas</div>
          </div>
          <div className="stat-big">
            <div className="stat-n">{CATEGORY_ORDER.filter(c => (distribucion || {})[c] > 0).length || '…'}</div>
            <div className="stat-label">categorías activas</div>
          </div>
        </div>
        <div className="breakdown">
          <div className="breakdown-head">
            <div>Qué se está callando</div>
            <div className="breakdown-total">{formatN(total)} · 100%</div>
          </div>
          {CATEGORY_ORDER.map(c => {
            const pct = dist[c];
            return (
              <div className="bar-row" key={c} style={{ '--cat-color': CATEGORIES[c].color }}>
                <div className="bar-label">
                  <span className="bar-dot" />
                  <span>{CATEGORIES[c].label.toLowerCase()}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${pct * 1.8}%` }} />
                </div>
                <div className="bar-pct">{pct}%</div>
              </div>
            );
          })}
        </div>
        <div className="mosaico-note">
          Lo no dicho pesa más que lo dicho. Cada brasa es real, de alguien que estuvo aquí.
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen 7: SOBRE EL PROYECTO
// ---------------------------------------------------------------------------
function Sobre() {
  return (
    <div className="screen sobre">
      <div className="sobre-inner">
        <div className="eyebrow">sobre el proyecto</div>
        <h2 className="screen-title">Un lugar para soltar lo que nunca<br/>pudiste decirle a nadie.</h2>
        <section className="manifiesto">
          <p>
            Todos cargamos cosas que nunca dijimos. Un "te quiero" que se quedó en
            la garganta. Un "perdón" que llegó tarde. Un "gracias" que no alcanzamos
            a pronunciar. Un enojo que nos acompañó más de lo debido.
          </p>
          <p>
            <em>Lo que nunca le dije</em> es una hoguera colectiva y anónima.
            Cada secreto se convierte en una brasa que flota con las demás.
            Nadie te ve. Nadie te juzga. El fuego solo recibe.
          </p>
          <p>
            Escribir algo aquí no lo resuelve. Pero lo saca del cuerpo.
            Y eso, a veces, ya es suficiente.
          </p>
        </section>
        <section className="sobre-grid">
          <div className="sobre-card">
            <div className="sobre-card-head">Privacidad</div>
            <ul className="sobre-list">
              <li>No hay cuentas, login, ni registro.</li>
              <li>No guardamos IP, huella del navegador, ni cookies identificatorias.</li>
              <li>Tu brasa queda en la hoguera sin vínculo contigo.</li>
              <li>Código abierto, auditable.</li>
            </ul>
          </div>
          <div className="sobre-card">
            <div className="sobre-card-head">Moderación</div>
            <ul className="sobre-list">
              <li>Filtros automáticos para violencia explícita, datos personales, y discurso de odio.</li>
              <li>Un equipo pequeño revisa reportes humanamente.</li>
              <li>No publicamos nombres, direcciones, números ni datos de terceros.</li>
              <li>Si lo que escribiste era un pedido de ayuda: por favor, llamá a una línea de emergencia en tu país.</li>
            </ul>
          </div>
        </section>
        <div className="sobre-foot">
          <span>— hecho con cuidado, en silencio.</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App shell
// ---------------------------------------------------------------------------
function App() {
  const [screen, setScreen] = useState('inicio');
  const [pending, setPending] = useState(null);
  const [secrets, setSecrets] = useState([]);
  const [tweaks, setTweaks] = useState(TWEAKS);
  const [editMode, setEditMode] = useState(false);

  // Load secrets from Supabase on mount
  useEffect(() => {
    sb.from('secrets').select('id, cat, text')
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data }) => { if (data) setSecrets(data); });
  }, []);

  // Apply tweaks to CSS vars
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--glow-mult', tweaks.glowIntensity);
    r.style.setProperty('--serif-family', `'${tweaks.serifFont}', Georgia, serif`);
    r.style.setProperty('--base-hue', tweaks.baseHue);
  }, [tweaks]);

  // Edit mode protocol
  useEffect(() => {
    function onMsg(e) {
      if (e.data?.type === '__activate_edit_mode')   setEditMode(true);
      if (e.data?.type === '__deactivate_edit_mode') setEditMode(false);
    }
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const setTweak = useCallback((k, v) => {
    setTweaks(t => ({ ...t, [k]: v }));
  }, []);

  const go = useCallback((s) => setScreen(s), []);

  const handleSubmit = useCallback(async ({ text, cat }) => {
    const { data, error } = await sb.from('secrets').insert({ text, cat }).select().single();
    if (data) {
      setPending(data);
      setSecrets(s => [data, ...s]);
    }
  }, []);

  const showNav = screen !== 'inicio';
  const navScreen =
    screen === 'hoguera' ? 'hoguera' :
    screen === 'escribir' || screen === 'confirmacion' ? 'escribir' :
    screen === 'mosaico' ? 'mosaico' :
    screen === 'sobre' ? 'sobre' : '';

  return (
    <div className="app" data-screen={screen}>
      {showNav && <Navbar screen={navScreen} go={go} />}
      <div key={screen} className="screen-wrap fade-in">
        {screen === 'inicio'       && <Inicio go={go} />}
        {screen === 'escribir'     && <Escribir go={go} onSubmit={handleSubmit} />}
        {screen === 'confirmacion' && <Confirmacion go={go} pending={pending} />}
        {screen === 'hoguera'      && <LaHoguera secrets={secrets} />}
        {screen === 'ecos'         && <Ecos go={go} pending={pending} />}
        {screen === 'mosaico'      && <Mosaico />}
        {screen === 'sobre'        && <Sobre />}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

})();
