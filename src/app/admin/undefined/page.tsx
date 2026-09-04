import { redirect } from "next/navigation"

export default function UndefinedRedirect() {
  redirect("/?modal=explorer")
}
