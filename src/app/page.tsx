import { HyperApp } from "@/components/app/hyper-app";

/**
 * HYPER TECH — single Next.js route.
 * The complete commerce experience (store, builds, maintenance,
 * cart, checkout, admin) lives inside this SPA shell driven by a
 * hash-based virtual router (see lib/router.ts).
 */
export default function Page() {
  return <HyperApp />;
}
