'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Settings2,
  Volume2,
  Hammer,
  Backpack,
  Sprout,
  ArrowRight,
  Headphones,
  Shell,
  Check,
  Plus,
  Minus,
  X,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import World from './world';
import {
  ITEMS,
  RECIPES,
  SLOTS,
  emptyBag,
  initialState,
  makeRequest,
  restore,
  transition,
  type Item,
  type State,
  type Action,
  type Inventory,
} from '@/lib/game';
const KEY = 'lilla.swedish.island.v1';
const resources: Item[] = ['wood', 'apple', 'stone', 'flower'];
export default function Home() {
  const [state, setState] = useState<State>(initialState),
    current = useRef(state),
    [loaded, setLoaded] = useState(false),
    [panel, setPanel] = useState<string | null>(null),
    [dialog, setDialog] = useState(false),
    [command, setCommand] = useState<{ id: string; nonce: number }>(),
    [toast, setToast] = useState(''),
    [feedback, setFeedback] = useState(''),
    [speaking, setSpeaking] = useState(false),
    [offer, setOffer] = useState<Inventory>(emptyBag),
    [revealed, setRevealed] = useState<string[]>([]),
    [subtitles, setSubtitles] = useState(false),
    [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]),
    [saving, setSaving] = useState(true),
    [place, setPlace] = useState<Item>('chair'),
    [helpOpen, setHelpOpen] = useState(false),
    [walking, setWalking] = useState<string | null>(null),
    [celebration, setCelebration] = useState<{
      name: string;
      reward: number;
    } | null>(null),
    [placement, setPlacement] = useState<Item | null>(null),
    [crafted, setCrafted] = useState<Item | null>(null),
    [pop, setPop] = useState<{ item: Item; id: number } | null>(null);
  const req = makeRequest(state.completed, state.cycle);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voice = voices.find((v) => /^sv([_-]|$)/i.test(v.lang));
  const travel = useCallback(
    (id: string) => {
      setPanel(null);
      setDialog(false);
      setPlacement(null);
      setCommand((previous) => ({ id, nonce: (previous?.nonce ?? 0) + 1 }));
    },
    [setPanel, setDialog, setPlacement, setCommand],
  );
  useEffect(() => {
    const openBag = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && placement) {
        setPlacement(null);
        return;
      }
      if (
        panel ||
        dialog ||
        helpOpen ||
        celebration ||
        placement ||
        /INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement)?.tagName)
      )
        return;
      if (/^[1-7]$/.test(event.key)) {
        event.preventDefault();
        const item = (Object.keys(ITEMS) as Item[])[Number(event.key) - 1];
        travel(resources.includes(item) ? item : 'workshop');
      } else if (event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setPanel('bag');
      }
    };
    window.addEventListener('keydown', openBag);
    return () => window.removeEventListener('keydown', openBag);
  }, [panel, dialog, helpOpen, celebration, placement, travel]);
  function act(action: Action) {
    const result = transition(current.current, action);
    current.current = result.state;
    setState(result.state);
    if (
      result.ok &&
      (action.type === 'gather' ||
        action.type === 'craft' ||
        action.type === 'trade')
    ) {
      setPop((previous) => ({
        item: action.item,
        id: (previous?.id ?? 0) + 1,
      }));
      if (action.type === 'craft') setCrafted(action.item);
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(result.state));
      setSaving(true);
    } catch {
      setSaving(false);
    }
    if (result.message) setToast(result.message);
    return result;
  }
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      let s: State;
      try {
        s = restore(localStorage.getItem(KEY));
      } catch {
        s = initialState();
        setSaving(false);
      }
      current.current = s;
      setState(s);
      setLoaded(true);
    });
    if ('speechSynthesis' in window) {
      const update = () => setVoices(window.speechSynthesis.getVoices());
      queueMicrotask(() => {
        if (!cancelled) update();
      });
      window.speechSynthesis.addEventListener('voiceschanged', update);
      return () => {
        cancelled = true;
        window.speechSynthesis.removeEventListener('voiceschanged', update);
        window.speechSynthesis.cancel();
      };
    }
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 3800);
    return () => clearTimeout(id);
  }, [toast]);
  function speak(slow = false) {
    if (!current.current.sound) return;
    if (!voice) {
      setToast(
        'No Swedish voice is installed in this browser. Subtitles are available.',
      );
      setSubtitles(true);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      makeRequest(current.current.completed, current.current.cycle)
        .tokens.map((w) => w.sv)
        .join(' '),
    );
    u.voice = voice;
    u.lang = 'sv-SE';
    u.rate = slow ? 0.64 : 0.86;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = (event) => {
      setSpeaking(false);
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setSubtitles(true);
        setToast(
          'Audio couldn’t play. Try Listen again, or use the subtitles.',
        );
      }
    };
    window.speechSynthesis.speak(u);
  }
  function openVisitor() {
    setPanel(null);
    setDialog(true);
    setFeedback('');
    setOffer(emptyBag());
    setRevealed([]);
    setSubtitles(current.current.mode === 'guided' || !voice);
    act({ type: 'hear' });
    speak();
    if (hintTimer.current) clearTimeout(hintTimer.current);
    if (current.current.mode !== 'guided') return;
    const s = current.current;
    const words = makeRequest(s.completed, s.cycle).tokens.filter((w) => {
      const p = s.words[w.key];
      return (
        !p || (p.successes < 3 && (p.encounters <= 2 || p.encounters % 3 === 1))
      );
    });
    const keys = words.map((w) => w.key);
    if (!keys.length) return;
    setRevealed(keys);
    keys.forEach((key) => act({ type: 'help', key }));
    hintTimer.current = setTimeout(() => setRevealed([]), 4500);
  }
  useEffect(
    () => () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!dialog && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, [dialog]);
  function interact(id: string) {
    if (resources.includes(id as Item))
      // oxlint-disable-next-line react/react-compiler -- Invoked by the world's input/arrival callback, never during render.
      return act({ type: 'gather', item: id as Item, now: Date.now() }).ok;
    else if (id === 'visitor') openVisitor();
    else if (id === 'workshop') setPanel('workshop');
    return false;
  }
  function hint(key?: string) {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    act({ type: 'help', key });
    setSubtitles(true);
    setRevealed(key ? [...revealed, key] : req.tokens.map((t) => t.key));
  }
  function deliver() {
    const r = act({ type: 'offer', bag: offer });
    if (r.ok) {
      setDialog(false);
      setOffer(emptyBag());
      setToast('');
      setCelebration({ name: req.visitor, reward: req.reward });
    } else {
      setFeedback(r.message);
      setToast('');
    }
  }
  const learned = Object.values(state.words).filter(
    (w) => w.successes >= 3,
  ).length;
  // A small read-only WebMCP surface shares the real saved game state.
  useEffect(() => {
    const context = (
      document as unknown as {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: unknown,
          ) => Promise<void> | void;
        };
      }
    ).modelContext;
    if (!context) return;
    const life = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'read_island_progress',
            description:
              'Read current island inventory, completed requests, decorations, and word progress.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute: (input: unknown) => {
              if (
                !input ||
                typeof input !== 'object' ||
                Object.keys(input).length
              )
                throw new Error('Expected an empty object.');
              const s = current.current;
              return {
                completed: s.completed,
                bag: s.bag,
                shells: s.coins,
                decorations: s.decorations,
                words: s.words,
              };
            },
          },
          { signal: life.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => life.abort();
  }, []);
  return (
    <main className="game">
      <World
        onInteract={interact}
        decorations={state.decorations}
        paused={
          !loaded ||
          !!panel ||
          dialog ||
          helpOpen ||
          !!celebration ||
          !!placement
        }
        command={command}
        onTravel={setWalking}
        cooldowns={state.cooldowns}
        placement={placement}
        onPlace={(slot) => {
          if (!placement) return;
          const r = act({ type: 'place', item: placement, slot });
          if (r.ok) setPlacement(null);
        }}
      />
      <header className="topbar">
        <div className="brand">
          lilla<span>ISLAND WORKSHOP</span>
        </div>
        <div className="top-right">
          <button
            className="pill language"
            aria-label="Change learning support"
            onClick={() => setPanel('settings')}
          >
            <span className="flag">🇸🇪</span> Swedish <span className="dot" />{' '}
            <span className="soft">
              {state.mode === 'guided'
                ? 'Guided'
                : state.mode === 'listening'
                  ? 'Listening first'
                  : 'Immersive'}
            </span>
          </button>
          <div className="pill currency">
            <Shell size={18} />
            <b>{state.coins}</b>
          </div>
          <button
            className="icon-button"
            aria-label="Settings"
            onClick={() => setPanel('settings')}
          >
            <Settings2 size={20} />
          </button>
        </div>
      </header>
      <section className="island-title">
        <span className="eyebrow">A LITTLE MORE LIKE HOME</span>
        <h1>A little island. All yours.</h1>
        <div className="island-progress">
          <Sprout size={16} />
          <span>{state.completed} neighbors helped</span>
          <i /> <span>{learned} familiar words</span>
        </div>
      </section>
      {loaded &&
        state.completed === 0 &&
        !dialog &&
        !panel &&
        !helpOpen &&
        !placement && (
          <section className="coach">
            <strong>
              {state.heard
                ? 'A little gathering adventure'
                : 'Your first island friend'}
            </strong>
            <p>
              {state.heard
                ? 'Tap a resource marker to gather. Come back when you have something to give.'
                : `${req.visitor} has a small request. Head to the dock and listen.`}
            </p>
            <button
              onClick={() =>
                state.heard ? setPanel('bag') : travel('visitor')
              }
            >
              {state.heard ? 'Explore your bag' : 'Meet ' + req.visitor}
              <ArrowRight size={15} />
            </button>
          </section>
        )}
      <aside className="request-card">
        <div className="request-top">
          <span className="eyebrow">AT THE DOCK</span>
          <span className="available-dot">Visitor</span>
        </div>
        <div className="visitor-intro">
          <div className="avatar">{req.visitor.slice(0, 1)}</div>
          <div>
            <h2>{req.visitor} is here</h2>
            <span>{req.role}</span>
          </div>
        </div>
        <p
          className={
            state.heard && state.mode === 'guided' ? 'request-memory' : ''
          }
        >
          {state.heard && state.mode === 'guided'
            ? req.tokens.map((w) => w.sv).join(' ')
            : state.heard
              ? 'Ready when you are.'
              : 'Someone could use a hand.'}
        </p>
        <button className="primary" onClick={() => travel('visitor')}>
          {state.heard ? 'Back to ' + req.visitor : 'Say hej!'}{' '}
          <ArrowRight size={17} />
        </button>
        <div className="reward">
          <Shell size={14} /> {req.reward} shells for helping
        </div>
      </aside>
      <nav className="side-tools" aria-label="Island tools">
        <button aria-label="Workshop" onClick={() => travel('workshop')}>
          <Hammer size={20} />
          <span>Workshop</span>
        </button>
        <button
          aria-label="Decorate island"
          onClick={() => setPanel('decorate')}
        >
          <Sprout size={20} />
          <span>Decorate</span>
        </button>
        <button aria-label="Word journal" onClick={() => setPanel('journal')}>
          <BookOpen size={20} />
          <span>Words</span>
        </button>
      </nav>
      <div className="dock-ui">
        <div className="movement">
          <span>Click to walk</span>
          <i /> <span>WASD to move · E to interact</span>
          <button aria-label="How to play" onClick={() => setHelpOpen(true)}>
            ?
          </button>
        </div>
        <div className="inventory-bar">
          <button
            className="bag-label"
            aria-label="Open your bag"
            onClick={() => setPanel('bag')}
          >
            <Backpack size={22} />
            <span>YOUR BAG</span>
          </button>
          {(Object.keys(ITEMS) as Item[]).map((id, i) => (
            <button
              key={`${id}-${pop?.item === id ? pop.id : 0}`}
              className="bag-slot"
              data-pop={pop?.item === id}
              aria-label={`${resources.includes(id) ? 'Gather ' + ITEMS[id].name : 'Visit workshop for ' + ITEMS[id].name}. ${state.bag[id]} in bag`}
              title={`${resources.includes(id) ? 'Gather ' + ITEMS[id].name : 'Craft ' + ITEMS[id].name} · ${state.bag[id]} in bag`}
              onClick={() => {
                travel(resources.includes(id) ? id : 'workshop');
              }}
            >
              <span className="slot-key">{i + 1}</span>
              <span className="item-icon">{ITEMS[id].icon}</span>
              <span className="item-count">{state.bag[id]}</span>
            </button>
          ))}
        </div>
        <div className="save-status">
          {saving
            ? 'Saved on this device'
            : 'Storage unavailable — progress will be lost when you leave'}
        </div>
      </div>
      {walking && !dialog && !panel && !placement && (
        <output className="travel-pill">
          <i />{' '}
          {walking === 'visitor'
            ? `Off to see ${req.visitor}…`
            : walking === 'workshop'
              ? 'Off to the workshop…'
              : walking === 'walk'
                ? 'A little stroll…'
                : `Finding ${ITEMS[walking as Item]?.name.toLowerCase() ?? 'a spot'}…`}
        </output>
      )}
      {placement && (
        <div className="placement-toolbar">
          <span>{ITEMS[placement].icon}</span>
          <div>
            <b>Find a home for your {ITEMS[placement].name.toLowerCase()}</b>
            <small>Tap a + spot on the island</small>
          </div>
          <button
            aria-label="Cancel furniture placement"
            onClick={() => setPlacement(null)}
          >
            <X size={19} />
          </button>
        </div>
      )}
      {toast && (
        <output className="toast" aria-live="polite">
          {toast}
        </output>
      )}
      <Dialog
        open={!!celebration}
        onOpenChange={(v) => {
          if (!v) setCelebration(null);
        }}
      >
        <DialogContent className="game-modal success-card">
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <i
                key={i}
                style={
                  {
                    '--x': `${(i * 37) % 100}%`,
                    '--c': ['#f7cd61', '#9bd9b4', '#a98ae1', '#f3a09b'][i % 4],
                    '--delay': `${(i % 6) * 0.08}s`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
          <div className="success-stamp">
            <Check size={48} strokeWidth={3} />
          </div>
          <DialogTitle className="modal-title">
            You made someone’s day.
          </DialogTitle>
          <DialogDescription>
            {celebration?.name} says “Tack så mycket!”
          </DialogDescription>
          <div className="success-reward">
            <Shell size={24} /> +{celebration?.reward} shells
          </div>
          {[2, 4].includes(state.completed) && (
            <p className="unlock-note">
              <Sparkles size={17} /> New recipe:{' '}
              {state.completed === 2 ? 'flowerpot' : 'table'}!
            </p>
          )}
          <button className="primary" onClick={() => setCelebration(null)}>
            Keep exploring <ArrowRight size={17} />
          </button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={helpOpen}
        onOpenChange={(v) => {
          setHelpOpen(v);
          if (!v) act({ type: 'welcome' });
        }}
      >
        <DialogContent className="game-modal intro-modal">
          <span className="eyebrow">VÄLKOMMEN · WELCOME</span>
          <DialogTitle className="modal-title">
            A small island.
            <br />A new language.
          </DialogTitle>
          <DialogDescription>
            Make things, help your neighbors, and make this place your own.
          </DialogDescription>
          <div className="intro-steps">
            <div>
              <span>01</span>
              <p>
                <b>Explore & gather</b>Click trees, rocks, and flowers.
                Resources grow back.
              </p>
            </div>
            <div>
              <span>02</span>
              <p>
                <b>Listen & help</b>Meet visitors at the dock. Choose what to
                give them from your bag.
              </p>
            </div>
            <div>
              <span>03</span>
              <p>
                <b>Make it yours</b>Craft furniture, decorate your island, and
                unlock new recipes.
              </p>
            </div>
          </div>
          <p className="fine">
            New words briefly show an English hint. Select any subtitle word to
            bring its hint back. No timers or lost hearts.
          </p>
          <button
            className="primary"
            onClick={() => {
              act({ type: 'welcome' });
              setHelpOpen(false);
              setToast('Your first visitor is waiting at the dock.');
            }}
          >
            Step onto your island <ArrowRight size={18} />
          </button>
        </DialogContent>
      </Dialog>
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="game-modal visitor-modal">
          <div className="speaker">
            <div className="avatar">{req.visitor[0]}</div>
            <div>
              <DialogTitle>{req.visitor}</DialogTitle>
              <DialogDescription>{req.role}</DialogDescription>
            </div>
            <span className="speech-language">SVENSKA</span>
          </div>
          <div className={`sentence-area ${speaking ? 'is-speaking' : ''}`}>
            {subtitles ? (
              <div className="sentence" lang="sv">
                {req.tokens.map((w, i) => (
                  <button
                    key={`${w.key}-${i}`}
                    onClick={() => hint(w.key)}
                    className="word"
                    aria-label={`${w.sv}, reveal English hint`}
                  >
                    <span>{w.sv}</span>
                    <small
                      className={
                        revealed.includes(w.key) ? 'gloss visible' : 'gloss'
                      }
                      aria-hidden={!revealed.includes(w.key)}
                    >
                      {w.en}
                    </small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="listen-prompt">
                <Headphones size={28} />
                <span>Listen to {req.visitor}.</span>
              </div>
            )}
          </div>
          <div className="speech-actions">
            <button onClick={() => speak()} disabled={!state.sound || !voice}>
              <Volume2 size={17} />
              Listen again
            </button>
            <button
              onClick={() => speak(true)}
              disabled={!state.sound || !voice}
            >
              Slower
            </button>
            <button
              aria-pressed={subtitles}
              onClick={() => {
                setSubtitles(!subtitles);
              }}
            >
              {subtitles ? 'Hide' : 'Show'} subtitles
            </button>
            <button onClick={() => hint()}>English hints</button>
          </div>
          {!voice && (
            <p className="fine">
              Swedish audio needs a Swedish system voice. Subtitles work on this
              device.
            </p>
          )}
          <div className="offer-heading">
            <h3>What will you give?</h3>
            <span>Choose from your bag</span>
          </div>
          <div className="offer-grid">
            {(Object.keys(ITEMS) as Item[])
              .filter((k) => state.bag[k] > 0)
              .map((k) => (
                <div className="offer-item" key={k}>
                  <span className="item-icon">{ITEMS[k].icon}</span>
                  <div>
                    <b>{ITEMS[k].name}</b>
                    <small>{state.bag[k]} in bag</small>
                  </div>
                  <div className="stepper">
                    <button
                      aria-label={`Remove one ${ITEMS[k].name}`}
                      disabled={!offer[k]}
                      onClick={() => setOffer({ ...offer, [k]: offer[k] - 1 })}
                    >
                      <Minus size={14} />
                    </button>
                    <b>{offer[k]}</b>
                    <button
                      aria-label={`Offer one ${ITEMS[k].name}`}
                      disabled={offer[k] >= state.bag[k]}
                      onClick={() => setOffer({ ...offer, [k]: offer[k] + 1 })}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
          {Object.values(state.bag).every((n) => n === 0) && (
            <>
              <p className="empty-note">
                Your bag is empty. Pick a spot to explore.
              </p>
              <div className="quick-gather">
                {resources.map((id) => (
                  <button
                    key={id}
                    aria-label={`Gather ${ITEMS[id].name}`}
                    onClick={() => travel(id)}
                  >
                    {ITEMS[id].icon}
                  </button>
                ))}
              </div>
            </>
          )}
          {Object.values(offer).some((n) => n > 0) && (
            <div className="selection-summary">
              You’re giving
              {(Object.keys(ITEMS) as Item[])
                .filter((id) => offer[id] > 0)
                .map((id) => (
                  <span key={id}>
                    {ITEMS[id].icon} × {offer[id]}
                  </span>
                ))}
            </div>
          )}
          {feedback && <output className="feedback">{feedback}</output>}
          <div className="dialog-footer">
            <button className="text-button" onClick={() => setDialog(false)}>
              I’ll be back
            </button>
            <button
              className="primary"
              disabled={Object.values(offer).every((n) => n === 0)}
              onClick={deliver}
            >
              Give items <ArrowRight size={17} />
            </button>
          </div>
          <button
            className="skip"
            onClick={() => {
              act({ type: 'skip' });
              setDialog(false);
            }}
          >
            Try a different request
          </button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!panel}
        onOpenChange={(v) => {
          if (!v) setPanel(null);
        }}
      >
        <DialogContent className="game-modal wide-modal">
          <span className="eyebrow">LILLA ISLAND</span>
          <DialogTitle className="modal-title">
            {panel === 'workshop'
              ? 'The workshop'
              : panel === 'journal'
                ? 'Words you’re meeting'
                : panel === 'decorate'
                  ? 'Make yourself at home'
                  : panel === 'bag'
                    ? 'Your bag'
                    : 'Your pace, your way'}
          </DialogTitle>
          <DialogDescription>
            {panel === 'workshop'
              ? 'Turn a few simple things into something useful.'
              : panel === 'journal'
                ? 'Familiar means three successful deliveries without a hint for that word.'
                : panel === 'decorate'
                  ? 'Craft something, then choose its spot.'
                  : panel === 'bag'
                    ? 'Gather materials or take what you’ve made to a visitor.'
                    : 'Choose how much support you want.'}
          </DialogDescription>
          {panel === 'settings' && (
            <>
              <div className="mode-options">
                {(
                  [
                    [
                      'guided',
                      'Guided',
                      'Swedish subtitles with occasional English hints.',
                    ],
                    [
                      'listening',
                      'Listening first',
                      'Listen first. Reveal subtitles whenever you want.',
                    ],
                    [
                      'immersive',
                      'Immersive',
                      'No automatic translations. Help is always available.',
                    ],
                  ] as const
                ).map(([mode, label, desc]) => (
                  <button
                    key={mode}
                    className={`mode-option ${state.mode === mode ? 'selected' : ''}`}
                    onClick={() => act({ type: 'mode', mode })}
                  >
                    <div>
                      <b>{label}</b>
                      <span>{desc}</span>
                    </div>
                    {state.mode === mode && <Check size={20} />}
                  </button>
                ))}
              </div>
              <div className="setting-row">
                <div>
                  <b>Spoken Swedish</b>
                  <p>
                    {voice
                      ? `Voice: ${voice.name}`
                      : 'No Swedish voice found on this device.'}
                  </p>
                </div>
                <Switch
                  checked={state.sound}
                  onCheckedChange={(sound) => {
                    act({ type: 'sound', sound });
                    if (!sound && 'speechSynthesis' in window)
                      window.speechSynthesis.cancel();
                  }}
                  aria-label="Spoken Swedish"
                />
              </div>
              <p className="fine">
                Progress stays in this browser. Speech uses your browser’s
                installed voices. Speaking into a microphone is not required.
              </p>
            </>
          )}
          {panel === 'workshop' && (
            <Tabs defaultValue="craft">
              <TabsList className="game-tabs">
                <TabsTrigger value="craft">Craft</TabsTrigger>
                <TabsTrigger value="supplies">Supplies</TabsTrigger>
              </TabsList>
              <TabsContent value="craft">
                <div className="recipe-list">
                  {Object.entries(RECIPES).map(([key, r]) => {
                    const id = key as Item,
                      locked = state.completed < r.unlock,
                      missing = Object.entries(r.cost).some(
                        ([k, n]) => state.bag[k as Item] < n!,
                      );
                    return (
                      <div className="recipe" key={id}>
                        <div className="recipe-picture">{ITEMS[id].icon}</div>
                        <div className="recipe-info">
                          <h3>
                            {ITEMS[id].name}{' '}
                            <span lang="sv">{ITEMS[id].sv}</span>
                          </h3>
                          <div className="costs">
                            {Object.entries(r.cost).map(([k, n]) => (
                              <button
                                className={
                                  state.bag[k as Item] < n! ? 'missing' : ''
                                }
                                key={k}
                                aria-label={`Gather ${ITEMS[k as Item].name}; ${state.bag[k as Item]} of ${n} available`}
                                onClick={() => travel(k)}
                              >
                                {ITEMS[k as Item].icon} {state.bag[k as Item]}/
                                {n}
                              </button>
                            ))}
                          </div>
                          {locked && (
                            <small>Unlocks after {r.unlock} deliveries</small>
                          )}
                        </div>
                        <button
                          className="primary compact"
                          disabled={locked || missing}
                          onClick={() => act({ type: 'craft', item: id })}
                        >
                          Craft
                        </button>
                      </div>
                    );
                  })}
                </div>
                {crafted && state.bag[crafted] > 0 && (
                  <button
                    className="primary place-crafted"
                    onClick={() => {
                      setPlacement(crafted);
                      setPanel(null);
                    }}
                  >
                    Place your {ITEMS[crafted].name.toLowerCase()} on the island{' '}
                    <Sprout size={18} />
                  </button>
                )}
              </TabsContent>
              <TabsContent value="supplies">
                <p className="fine">
                  Trade 6 shells for a bundle of 3. Visit the island to gather
                  for free.
                </p>
                <div className="supply-grid">
                  {resources.map((id) => (
                    <button
                      className="supply"
                      key={id}
                      disabled={state.coins < 6}
                      onClick={() => act({ type: 'trade', item: id })}
                    >
                      <span className="item-icon">{ITEMS[id].icon}</span>
                      <b>3 {ITEMS[id].name.toLowerCase()}</b>
                      <span>6 shells</span>
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
          {panel === 'bag' && (
            <>
              <div className="bag-grid">
                {(Object.keys(ITEMS) as Item[]).map((id) => (
                  <div className="bag-detail" key={id}>
                    <span className="item-icon">{ITEMS[id].icon}</span>
                    <b>{ITEMS[id].name}</b>
                    <span>{state.bag[id]}</span>
                    {resources.includes(id) && (
                      <button onClick={() => travel(id)}>
                        Gather <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button className="primary" onClick={() => travel('visitor')}>
                Visit the dock <ArrowRight size={17} />
              </button>
            </>
          )}
          {panel === 'journal' && (
            <>
              {Object.keys(state.words).length === 0 ? (
                <div className="empty-note">
                  Meet your first visitor to start your word collection.
                </div>
              ) : (
                <div className="word-list">
                  {Object.entries(state.words).map(([key, w]) => (
                    <div className="journal-word" key={key}>
                      <div>
                        <b lang="sv">{w.sv}</b>
                        <span>{w.en}</span>
                      </div>
                      <div className="word-evidence">
                        <span>
                          {w.successes >= 3
                            ? 'Familiar'
                            : w.successes > 0
                              ? 'Taking root'
                              : 'Just met'}
                        </span>
                        <div className="word-dots">
                          {[1, 2, 3].map((n) => (
                            <i
                              key={n}
                              className={w.successes >= n ? 'filled' : ''}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {panel === 'decorate' && (
            <>
              <div className="decoration-choices">
                {(Object.keys(RECIPES) as Item[]).map((id) => (
                  <button
                    key={id}
                    className={place === id ? 'chosen' : ''}
                    onClick={() => setPlace(id)}
                  >
                    <span className="item-icon">{ITEMS[id].icon}</span>
                    <b>{ITEMS[id].name}</b>
                    <small>{state.bag[id]} in bag</small>
                  </button>
                ))}
              </div>
              <button
                className="primary"
                disabled={
                  !state.bag[place] || state.decorations.length >= SLOTS.length
                }
                onClick={() => {
                  setPlacement(place);
                  setPanel(null);
                }}
              >
                {state.decorations.length >= SLOTS.length
                  ? 'All spots are filled'
                  : 'Choose a spot on the island'}
                <ArrowRight size={17} />
              </button>
              <div className="placement-grid">
                {SLOTS.map(([x, z], i) => {
                  const d = state.decorations.find(
                    (d) => d.x === x && d.z === z,
                  );
                  return (
                    <button
                      key={i}
                      className={d ? 'occupied' : ''}
                      disabled={!d && !state.bag[place]}
                      onClick={() =>
                        d
                          ? act({ type: 'remove', id: d.id })
                          : act({ type: 'place', item: place, slot: i })
                      }
                    >
                      <span>{d ? ITEMS[d.kind].icon : <Plus size={21} />}</span>
                      <b>
                        {i < 3 ? 'Orchard' : i < 6 ? 'Workshop' : 'Garden'}{' '}
                        {i < 3 ? i + 1 : i < 6 ? i - 2 : i - 5}
                      </b>
                      <small>{d ? 'Return to bag' : 'Place here'}</small>
                    </button>
                  );
                })}
              </div>
              <button
                className="text-button"
                onClick={() => travel('workshop')}
              >
                Need furniture? Visit the workshop <ArrowRight size={15} />
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
