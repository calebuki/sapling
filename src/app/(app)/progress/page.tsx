import { redirect } from "next/navigation";

export const metadata = { title: "Progress" };

export default function ProgressPage() {
  redirect("/practice");
}
