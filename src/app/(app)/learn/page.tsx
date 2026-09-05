import { LearnSession } from "@/components/learn-session";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <div className="life-page life-learn-page">
      <div className="life-learn-intro">
        <div>
          <p className="life-eyebrow">A little progress, every day</p>
          <h1>Let’s grow something.</h1>
        </div>
        <Link className="life-text-link" href="/practice">
          Use it in Practice
          <ArrowRight size={16} />
        </Link>
      </div>
      <LearnSession />
    </div>
  );
}
