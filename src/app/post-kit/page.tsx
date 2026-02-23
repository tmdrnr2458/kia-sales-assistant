import { redirect } from "next/navigation";
// Redirect /post-kit to inventory so user can pick a vehicle
export default function PostKitIndex() {
  redirect("/inventory");
}
