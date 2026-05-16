import { redirect } from "next/navigation";

export default function PlaylistsRedirect() {
  redirect("/lists/trending");
}
