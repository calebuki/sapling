'use client';
import { useEffect, useRef, useState } from 'react';
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
    [offer, setOffer] = useState<Inventory>(emptyBag),
    [revealed, setRevealed] = useState<string[]>([]),
    [subtitles, setSubtitles] = useState(false),
    [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]),
    [saving, setSaving] = useState(true),
    [place, setPlace] = useState<Item>('chair'),
    [helpOpen, setHelpOpen] = useState(false);
  const req = makeRequest(state.completed, state.cycle);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voice = voices.find((v) => /^sv([_-]|$)/i.test(v.lang));
  useEffect(() => {
    const openBag = (event: KeyboardEvent) => {
      if (
        panel ||
        dialog ||
        helpOpen ||
        /INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement)?.tagName)
      )
        return;
      if (/^[1-7]$/.test(event.key) || event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setPanel('bag');
      }
    };
    window.addEventListener('keydown', openBag);
    return () => window.removeEventListener('keydown', openBag);
  }, [panel, dialog, helpOpen]);
  function act(action: Action) {
    const result = transition(current.current, action);
    current.current = result.state;
    setState(result.state);
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
      setHelpOpen(!s.welcomed);
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
      act({ type: 'gather', item: id as Item, now: Date.now() });
    else if (id === 'visitor') openVisitor();
    else if (id === 'workshop') setPanel('workshop');
  }
  function travel(id: string) {
    setPanel(null);
    setDialog(false);
    setCommand({ id, nonce: Date.now() });
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
        paused={!loaded || !!panel || dialog || helpOpen}
        command={command}
      />
      <header className="topbar">
        <div className="brand">
          lilla<span>ISLAND WORKSHOP</span>
        </div>
        <div className="top-right">
          <div className="pill language">
            <span className="flag">🇸🇪</span> Swedish <span className="dot" />{' '}
            <span className="soft">
              {state.mode === 'guided'
                ? 'Guided'
                : state.mode === 'listening'
                  ? 'Listening first'
                  : 'Immersive'}
            </span>
          </div>
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
        <h1>
          Your island,
          <br />
          one word at a time.
        </h1>
        <div className="island-progress">
          <Sprout size={16} />
          <span>{state.completed} neighbors helped</span>
          <i /> <span>{learned} familiar words</span>
        </div>
      </section>
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
        <p>A little help goes a long way.</p>
        <button className="primary" onClick={() => travel('visitor')}>
          Go say hello <ArrowRight size={17} />
        </button>
        <div className="reward">
          <Shell size={14} /> {req.reward} shells for helping
        </div>
      </aside>
      <nav className="side-tools" aria-label="Island tools">
        <button onClick={() => travel('workshop')}>
          <Hammer size={20} />
          <span>Workshop</span>
        </button>
        <button onClick={() => setPanel('decorate')}>
          <Sprout size={20} />
          <span>Decorate</span>
        </button>
        <button onClick={() => setPanel('journal')}>
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
          <div className="bag-label">
            <Backpack size={22} />
            <span>YOUR BAG</span>
          </div>
          {(Object.keys(ITEMS) as Item[]).map((id, i) => (
            <button
              key={id}
              className="bag-slot"
              title={`${ITEMS[id].name}: ${state.bag[id]}`}
              onClick={() => {
                setPanel('bag');
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
      {toast && (
        <output className="toast" aria-live="polite">
          {toast}
        </output>
      )}
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
          <div className="sentence-area">
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
            <p className="empty-note">
              Your bag is empty. Gather a few things around the island first.
            </p>
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
                              <span
                                className={
                                  state.bag[k as Item] < n! ? 'missing' : ''
                                }
                                key={k}
                              >
                                {ITEMS[k as Item].icon} {state.bag[k as Item]}/
                                {n}
                              </span>
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
