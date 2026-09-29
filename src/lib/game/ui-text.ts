import type { Line } from "./line";

// Interface copy in the target language; English only appears on hover.
// Every island supplies all of it, so no screen falls back to English.

type Lines =
  | "title" | "tagline" | "play" | "continue" | "signIn" | "loading" | "level" | "words" | "dictionary"
  | "soundOn" | "soundOff" | "menu" | "signOut" | "close" | "back" | "home"
  | "walkHint" | "hoverHint" | "lookAt" | "goalMeetFirst" | "goalDone" | "newWord" | "levelUp" | "treeGrows"
  | "next" | "check" | "dontKnow" | "hint" | "listen" | "listenAgain" | "slowly" | "sayIt" | "listening"
  | "writeTarget" | "sayInTarget" | "whatDoesItMean" | "whatDidYouHear" | "buildSentence" | "newPhrase"
  | "repeatAfterMe" | "youSaid" | "heardYou" | "bye" | "again" | "talkForReal" | "chatTyping" | "yourName"
  | "myNameIs" | "saving" | "xpGained" | "correct" | "phrases" | "grammar" | "littleGrammar" | "newGrammar"
  | "things" | "notFound" | "notMet" | "connecting" | "liveNow" | "mute" | "unmute" | "endCall" | "liveOver"
  | "reflect" | "typeReply" | "send" | "needsAccount" | "liveUnavailable" | "notReadyToTalk" | "error"
  | "tryAgain" | "captions" | "mic" | "youLabel" | "stageLabel" | "letters" | "controls" | "controlsMove"
  | "controlsTalk" | "controlsCamera" | "controlsRun" | "spelling" | "article" | "yourStyle" | "style"
  | "englishAuto" | "englishOn" | "englishOff" | "skip" | "tryIt" | "nowYouCanSay" | "letsGo" | "presents"
  | "welcomeTitle" | "learnedBefore" | "quickCheck" | "done" | "startFromTop" | "replyIfYouLike"
  | "askForBill" | "fillTray" | "ready" | "option" | "yourTray" | "flowers" | "units" | "locked"
  | "notes" | "conversation" | "situation";

export type UiText = Record<Lines, Line> & {
  talkTo(name: string): Line;
  goalTalk(name: string, place: Line): Line;
  goalLearnMore(name: string): Line;
  newFriend(name: string): Line;
  welcomeBack(name: string): Line;
  wordGrows(stage: Line): Line;
  startWith(name: string): Line;
  callAndTalk(name: string): Line;
};

// "Lyssna (listen)": the target language first, English for screen readers too.
export function aria(line: Line) {
  return `${line.t} (${line.en.toLocaleLowerCase("en")})`;
}
