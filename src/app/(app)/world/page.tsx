import { redirect } from "next/navigation";

export const metadata = { title: "Practice" };

export default function WorldPage() {
  redirect("/practice");
}
