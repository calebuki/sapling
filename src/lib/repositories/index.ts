import { hasSupabase } from "@/lib/env";
import { createDemoLearningRepository } from "@/lib/repositories/demo-learning-repository";
import { createSupabaseLearningRepository } from "@/lib/repositories/supabase-learning-repository";

export function createLearningRepository() {
  return hasSupabase
    ? createSupabaseLearningRepository()
    : createDemoLearningRepository();
}
