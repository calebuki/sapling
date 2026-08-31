import { redirect } from "next/navigation";

export const metadata = { title: "Mit dansk" };

export default function MyDanishPage() {
  redirect("/progress");
}
