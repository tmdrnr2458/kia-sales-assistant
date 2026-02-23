import { redirect } from "next/navigation";

// /templates redirects customers to the public digital business card
export default function TemplatesRedirect() {
  redirect("/card");
}
