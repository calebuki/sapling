"use client";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import {
  islandInvitations,
  type IslandActivity,
} from "@/lib/island/progression";
import Vocab from "./vocab";

export function IslandInvitations({
  recommended,
  onOpen,
}: {
  recommended: string;
  onOpen: (activity: IslandActivity) => void;
}) {
  const { practiceSnapshot } = useLearningModel();
  const completed = new Set(practiceSnapshot.completedScenarioIds);
  return (
    <div className="island-invitations">
      <div className="island-letter">
        <span aria-hidden="true">✉</span>
        <p>
          <b>Hej!</b> I saved you a seat. Come over whenever you like.
          <br />
          <em>— Elin</em>
        </p>
      </div>
      <div className="island-invitation-grid">
        {islandInvitations.map((q, i) => (
          <article
            className={`island-invitation ${q.id === recommended ? "is-suggested" : ""}`}
            key={q.id}
          >
            <div className={`island-postcard postcard-${i}`}>
              <span>{q.icon}</span>
              <small>{q.place}</small>
              {completed.has(q.id) && (
                <b className="island-postmark">✓ {q.title}</b>
              )}
            </div>
            <div className="island-invitation-copy">
              <small>
                {q.id === recommended
                  ? "A good next adventure"
                  : completed.has(q.id)
                    ? "Always welcome back"
                    : "An invitation for you"}
              </small>
              <h3>
                <Vocab sv={q.target} en={q.title} />
              </h3>
              <p>{q.description}</p>
              <footer>
                <span>
                  {completed.has(q.id)
                    ? "Journal stamp collected"
                    : `🐚 ${q.reward} + building supplies`}
                </span>
                <button onClick={() => onOpen(q.id)}>
                  {completed.has(q.id) ? "Visit again" : "Let’s go"} →
                </button>
              </footer>
            </div>
          </article>
        ))}
      </div>
      <button className="island-lesson-link" onClick={() => onOpen("learn")}>
        🌱 Find your words first · visit the language workshop →
      </button>
    </div>
  );
}
