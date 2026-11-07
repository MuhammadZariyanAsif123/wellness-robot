import { notFound } from "next/navigation";
import { DevPanel } from "@/dev/DevPanel";

export default function DevPage() {
  // Dev tool only: not served in production builds.
  if (process.env.NODE_ENV === "production") notFound();
  return <DevPanel />;
}
