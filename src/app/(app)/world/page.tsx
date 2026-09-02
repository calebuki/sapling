import { redirect } from "next/navigation";

export const metadata = { title: "World" };

export default function WorldPage() {
  redirect("/learn");
}
