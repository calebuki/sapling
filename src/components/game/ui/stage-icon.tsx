import { Bean, Flower2, Leaf, Sprout } from "lucide-react";
import type { Stage } from "@/lib/game/progression";

export function StageIcon({ stage, size = 16 }: { stage: Stage; size?: number }) {
  const Icon = stage >= 4 ? Flower2 : stage === 3 ? Leaf : stage === 2 ? Sprout : Bean;
  return (
    <span className={`stage-icon stage-${stage}`} aria-hidden="true">
      <Icon size={size} />
    </span>
  );
}
