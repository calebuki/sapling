"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useLearningModel } from "@/components/providers/learning-model-provider";
import dynamic from "next/dynamic";
const IslandHome = dynamic(() => import("@/components/island/island-home"), {
  ssr: false,
  loading: () => (
    <div className="island-loading" role="status">
      Sailing home…
    </div>
  ),
});

export function HomeLanding() {
  const router = useRouter();
  const { isLoading, targetLanguage } = useLearningModel();

  useEffect(() => {
    if (!isLoading && targetLanguage.code !== "sv") {
      router.replace("/learn");
    }
  }, [isLoading, router, targetLanguage.code]);

  if (isLoading || targetLanguage.code !== "sv") {
    return <div className="min-h-dvh animate-pulse bg-[#d6e4df]" />;
  }

  return <IslandHome />;
}
