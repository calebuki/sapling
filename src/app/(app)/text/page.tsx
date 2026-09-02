import { redirect } from "next/navigation";

export const metadata = { title: "Read & Write" };

export default function ReadWritePage() {
  redirect("/practice?mode=text");
}
