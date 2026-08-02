import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/auth-page";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Roblox AI Builder" },
      {
        name: "description",
        content: "Create a free Roblox AI Builder account to save generated projects and credits.",
      },
      { property: "og:title", content: "Sign up — Roblox AI Builder" },
      {
        property: "og:description",
        content: "Create a free Roblox AI Builder account to save generated projects and credits.",
      },
    ],
  }),
  component: () => <AuthPage defaultMode="signup" />,
});
