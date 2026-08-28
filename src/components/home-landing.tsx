"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useLearningModel } from "@/components/providers/learning-model-provider";
import { SwedishPracticeWorld } from "@/components/swedish-practice-world";

export function HomeLanding() {
  const router = useRouter();
  const { isLoading, targetLanguage } = useLearningModel();

  useEffect(() => {
    if (!isLoading && targetLanguage.code !== "sv") {
      router.replace("/learn");
    }
  }, [isLoading, router, targetLanguage.code]);

  if (isLoading || targetLanguage.code !== "sv") {
    return <div className="min-h-[70dvh] animate-pulse bg-moss-300/10" />;
  }

  return <SwedishPracticeWorld />;
}
