import { redirect } from "next/navigation"

export default function ActivityDetailRedirect() {
  redirect("/?modal=explorer")
}
