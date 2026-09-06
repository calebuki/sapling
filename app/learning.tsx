'use client';
import { useEffect, useRef, useState } from 'react';
import { ITEMS, type State } from '@/lib/game';
import Vocab from './vocab';
export function saySwedish(text: string) {
  if (!('speechSynthesis' in window)) return false;
  const voice = window.speechSynthesis
    .getVoices()
    .find((v) => v.lang.toLowerCase().startsWith('sv'));
  if (!voice) return false;
  window.speechSynthesis.cancel();
  const line = new SpeechSynthesisUtterance(text);
  line.lang = 'sv-SE';
  line.voice = voice;
  line.rate = 0.85;
  window.speechSynthesis.speak(line);
  return true;
}
const extra = [
  [
    'golv',
    'floor',
    'golvet · golv',
    'Golvet är av trä.',
    'The floor is made of wood.',
  ],
  ['vägg', 'wall', 'väggen · väggar', 'Väggen är hög.', 'The wall is tall.'],
  [
    'fönster',
    'window',
    'fönstret · fönster',
    'Jag öppnar fönstret.',
    'I open the window.',
  ],
  ['dörr', 'door', 'dörren · dörrar', 'Dörren är blå.', 'The door is blue.'],
  [
    'dörröppning',
    'doorway',
    'dörröppningen · dörröppningar',
    'Här är dörröppningen.',
    'Here is the doorway.',
  ],
  ['tak', 'roof', 'taket · tak', 'Huset har ett tak.', 'The house has a roof.'],
  [
    'trappa',
    'stairs',
    'trappan · trappor',
    'Trappan går upp.',
    'The stairs go up.',
  ],
  [
    'hylla',
    'shelf',
    'hyllan · hyllor',
    'Boken står på hyllan.',
    'The book is on the shelf.',
  ],
  [
    'arbetsbänk',
    'workbench',
    'arbetsbänken · arbetsbänkar',
    'Jag bygger vid arbetsbänken.',
    'I build at the workbench.',
  ],
  ['hus', 'house', 'huset · hus', 'Det här är mitt hus.', 'This is my house.'],
  ['rum', 'room', 'rummet · rum', 'Rummet är stort.', 'The room is big.'],
  [
    'verkstad',
    'workshop',
    'verkstaden · verkstäder',
    'Min verkstad växer.',
    'My workshop is growing.',
  ],
  [
    'bygga',
    'build',
    'bygger · byggde · byggt',
    'Jag byggde ett bord.',
    'I built a table.',
  ],
  [
    'bredvid',
    'beside',
    '',
    'Stolen står bredvid bordet.',
    'The chair is beside the table.',
  ],
  [
    'mellan',
    'between',
    '',
    'Bordet står mellan stolarna.',
    'The table is between the chairs.',
  ],
  [
    'på',
    'on',
    '',
    'Blomkrukan står på bordet.',
    'The flowerpot is on the table.',
  ],
  [
    'under',
    'under',
    '',
    'Stenen ligger under bordet.',
    'The stone is under the table.',
  ],
  ['röd', 'red', 'rött · röda', 'Jag har en röd stol.', 'I have a red chair.'],
  [
    'blå',
    'blue',
    'blått · blåa',
    'Jag har ett blått bord.',
    'I have a blue table.',
  ],
  [
    'stor',
    'big',
    'stort · stora',
    'Det är ett stort rum.',
    'It is a big room.',
  ],
  [
    'liten',
    'small',
    'litet · små',
    'Jag har ett litet hus.',
    'I have a small house.',
  ],
  [
    'ovanför',
    'above',
    '',
    'Fönstret är ovanför bordet.',
    'The window is above the table.',
  ],
  [
    'nedanför',
    'below',
    '',
    'Bordet är nedanför fönstret.',
    'The table is below the window.',
  ],
];
const forms: Record<string, string> = {
  wood: 'träet',
  apple: 'äpplet · äpplen',
  stone: 'stenen · stenar',
  flower: 'blomman · blommor',
  chair: 'stolen · stolar',
  table: 'bordet · bord',
  planter: 'blomkrukan · blomkrukor',
};
export function WordBook({
  state,
  onHelp,
}: {
  state: State;
  onHelp: (key: string) => void;
}) {
  const [query, setQuery] = useState(''),
    [notice, setNotice] = useState('');
  const entries = new Map<
    string,
    {
      key: string;
      sv: string;
      en: string;
      forms: string;
      example: string;
      translation: string;
    }
  >();
  Object.entries(ITEMS).forEach(([key, w]) =>
    entries.set(w.sv, {
      key,
      sv: w.sv,
      en: w.name,
      forms: forms[key],
      example: `Jag behöver ${key === 'wood' ? 'trä' : w.unit + ' ' + w.sv}.`,
      translation: `I need ${key === 'wood' ? 'wood' : 'a ' + w.name.toLowerCase()}.`,
    }),
  );
  extra.forEach(([sv, en, forms, example, translation]) =>
    entries.set(sv, { key: sv, sv, en, forms, example, translation }),
  );
  Object.entries(state.words).forEach(([key, w]) => {
    if (!entries.has(w.sv))
      entries.set(w.sv, {
        key,
        sv: w.sv,
        en: w.en,
        forms: '',
        example: '',
        translation: '',
      });
  });
  const clean = (s: string) =>
    s
      .toLocaleLowerCase('sv')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  const results = [...entries.values()]
    .filter((w) =>
      clean([w.sv, w.en, w.forms].join(' ')).includes(clean(query)),
    )
    .sort((a, b) => a.sv.localeCompare(b.sv, 'sv'));
  return (
    <>
      <label className="dictionary-search">
        Sök ord · Search Swedish or English
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="stol, stolar, chair…"
        />
      </label>
      <p className="fine">
        {results.length} words · Lookups do not count as learned words.
      </p>
      {notice && <output>{notice}</output>}
      <div className="word-list">
        {results.map((w) => (
          <article className="journal-word dictionary-entry" key={w.key}>
            <div>
              <b>
                <Vocab sv={w.sv} en={w.en} onReveal={() => onHelp(w.key)} />
              </b>
              <small>{w.forms}</small>
              {w.example && (
                <p>
                  <Vocab sv={w.example} en={w.translation} />
                </p>
              )}
            </div>
            <div>
              <button
                className="text-button"
                aria-label={`Listen to ${w.sv}`}
                onClick={() =>
                  setNotice(
                    saySwedish(w.sv)
                      ? ''
                      : 'A Swedish voice is not available on this device.',
                  )
                }
              >
                🔊
              </button>
              <small>
                {state.words[w.key]
                  ? state.words[w.key].successes >= 3
                    ? 'Familiar'
                    : 'Encountered'
                  : 'Discover'}
              </small>
            </div>
          </article>
        ))}
      </div>
      {!results.length && (
        <p>No matching word in this island dictionary yet.</p>
      )}
    </>
  );
}
export function VoicePractice({
  line,
  translation,
}: {
  line: string;
  translation: string;
}) {
  const [status, setStatus] = useState(''),
    [recording, setRecording] = useState(false),
    [requesting, setRequesting] = useState(false),
    [url, setUrl] = useState('');
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    audioUrl = useRef(''),
    stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (stopTimer.current) clearTimeout(stopTimer.current);
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);
  async function record() {
    if (recording) {
      if (recorder.current?.state === 'recording') recorder.current.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !('MediaRecorder' in window)) {
      setStatus(
        'Recording is unavailable here. You can still listen and repeat aloud.',
      );
      return;
    }
    setRequesting(true);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current) {
        mic.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = mic;
      const r = new MediaRecorder(mic);
      recorder.current = r;
      const chunks: BlobPart[] = [];
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onstop = () => {
        if (stopTimer.current) clearTimeout(stopTimer.current);
        mic.getTracks().forEach((t) => t.stop());
        recorder.current = null;
        if (!alive.current) return;
        if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
        const result = URL.createObjectURL(
          new Blob(chunks, { type: r.mimeType }),
        );
        audioUrl.current = result;
        setUrl(result);
        setRecording(false);
        setStatus(
          'Listen back and compare. This is practice, not a pronunciation score.',
        );
      };
      r.start();
      stopTimer.current = setTimeout(() => {
        if (r.state === 'recording') r.stop();
      }, 60000);
      setRecording(true);
      setStatus('Recording… stop when you finish.');
    } catch {
      stream.current?.getTracks().forEach((t) => t.stop());
      setStatus(
        'Microphone access was unavailable. You can still repeat the line aloud.',
      );
    } finally {
      if (alive.current) setRequesting(false);
    }
  }
  return (
    <div className="voice-practice">
      <span className="eyebrow">SÄG DET · SAY IT</span>
      <h3>
        <Vocab sv={line} en={translation} />
      </h3>
      <div className="practice-actions">
        <button
          className="text-button"
          onClick={() =>
            setStatus(
              saySwedish(line)
                ? 'Listen, then try it yourself.'
                : 'A Swedish voice is not available on this device.',
            )
          }
        >
          🔊 Hear Swedish
        </button>
        <button className="primary" disabled={requesting} onClick={record}>
          {recording ? '■ Stop recording' : '🎙 Record yourself'}
        </button>
      </div>
      {status && <output aria-live="polite">{status}</output>}
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption -- This is the user’s local recording; no transcript is inferred from the practice prompt. */}
      {url && <audio controls aria-label="Your practice recording" src={url} />}
      <p className="fine">
        Optional. Your recording stays in this browser and is discarded when you
        close this practice.
      </p>
    </div>
  );
}
