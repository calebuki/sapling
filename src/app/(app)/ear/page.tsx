import { redirect } from "next/navigation";

export const metadata = { title: "Listen & Speak" };

export default function ListenSpeakPage() {
  redirect("/practice?mode=listening");
}
