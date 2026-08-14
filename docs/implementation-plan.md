# Staged implementation plan

## Phase 1 — foundation and evidence loop

- [x] Record architecture and security decisions
- [x] Scaffold the Next.js, TypeScript, Tailwind, and Supabase-ready project
- [x] Define concepts, learner concept state, sessions, and raw evidence schema
- [x] Add a basic retrieval → reveal → compare → repair Learn flow
- [x] Add a basic My Danish growth and dimension visualization
- [x] Add small Ear and World product direction screens
- [ ] Provision and link a new Sapling Supabase project
- [ ] Create the private learner account and verify RLS with two test identities
- [ ] Create and deploy a new Vercel project
- [ ] Attach Sapling's custom domain

## Phase 2 — adaptive daily sessions

- Build session planning from due concepts, weak dimensions, and recent errors
- Persist full sessions and session items
- Add cold recall, contextual input, transfer, and short retelling activities
- Replace the initial projection heuristic with tested, replayable estimators
- Add an evidence inspector for debugging why a concept has its current state

## Learn / Practice product loop

- [x] Reduce primary navigation to Learn and Practice
- [x] Select the best next Practice scenario from encountered concept evidence
- [x] Add push-to-talk conversations with recurring language-specific guides
- [x] Resolve likely speech-recognition substitutions against scenario context
- [x] Attach one conversation turn to multiple demonstrated concepts
- [x] Capture visible and deletable personal memories automatically
- [x] Persist character continuity and concise encounter summaries
- [ ] Expand Learn with family, workplace, routine, and activity capability
  bundles that unlock deeper personal and professional Practice scenarios
- [ ] Add dynamic TTS for character replies after provider quality and retention
  are reviewed

## Phase 3 — listening depth inside Learn and Practice

- Model audio samples, speakers, recording conditions, and listening phenomena
- Add isolated-word and careful-sentence listening attempts
- Track text recognition and audio recognition independently
- Progress toward natural reduction, unfamiliar speakers, conversation, and
  noise only as evidence supports it

## Phase 4 — richer recurring continuity

- Add learner-owned characters, stories, and chronological story events
- Continue a small cast across days
- Let the scheduler place due language into narratively plausible contexts
- Record story encounters and transfer evidence without making stories lessons

## Phase 5 — generation and speech adapters

- Define provider-neutral interfaces for content generation, TTS, STT, and
  pronunciation evidence
- Process learner recordings ephemerally and persist only transcripts,
  alignments, scores, and other derived evidence; do not store learner audio
- Review and minimize each speech provider's own data-retention behavior
- Store prompts, model/provider versions, and provenance where needed
- Add evaluation and fallback paths before relying on generated material
- Keep provider IDs and scores outside the core learner model

## Phase 6 — broader access

- Add opt-in onboarding for more learners and target languages
- Validate language-specific concept and audio pipelines
- Add operational monitoring, backups, retention decisions, and privacy export
- Defer teams, subscriptions, social features, leagues, stores, and XP systems
  until a real product requirement exists
