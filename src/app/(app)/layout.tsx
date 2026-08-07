import { AppShell } from "@/components/app-shell";
import { LearningModelProvider } from "@/components/providers/learning-model-provider";

export default function ProductLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <LearningModelProvider>
      <AppShell>{children}</AppShell>
    </LearningModelProvider>
  );
}

