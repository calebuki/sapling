"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { LearnSession } from "@/components/learn-session";
export function IslandLearningEntry() {
  const { isLoading, targetLanguage } = useLearningModel(),
    router = useRouter();
  useEffect(() => {
    if (!isLoading && targetLanguage.code === "sv")
      router.replace("/?activity=learn");
  }, [isLoading, targetLanguage.code, router]);
  if (isLoading || targetLanguage.code === "sv")
    return (
      <div className="island-loading" role="status">
        Opening the language workshop…
      </div>
    );
  return (
    <div className="life-page life-learn-page">
      <div className="life-learn-intro">
        <h1>Let’s grow something.</h1>
      </div>
      <LearnSession />
    </div>
  );
}
