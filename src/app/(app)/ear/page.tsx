import { redirect } from "next/navigation";

export const metadata = { title: "Practice" };

export default function ListenSpeakPage() {
  redirect("/practice");
}
