import { redirect } from "next/navigation"

export default function LogActivityRedirect() {
  redirect("/?modal=log")
}
