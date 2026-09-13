import LoggedOutExperience from "@/components/logged-out/LoggedOutExperience";

// Swap this for your real auth check once accounts are wired up, e.g.:
//
// import { getServerSession } from "@/lib/auth";
// export default async function Home() {
//   const session = await getServerSession();
//   if (session) redirect("/home");
//   return <LoggedOutExperience />;
// }

export default function Home() {
  return <LoggedOutExperience />;
}
