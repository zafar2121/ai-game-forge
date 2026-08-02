import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/auth-page";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Roblox AI Builder" },
      {
        name: "description",
        content: "Log in to your Roblox AI Builder account to save projects and credits.",
      },
      { property: "og:title", content: "Log in — Roblox AI Builder" },
      {
        property: "og:description",
        content: "Log in to your Roblox AI Builder account to save projects and credits.",
      },
    ],
  }),
  component: () => <AuthPage defaultMode="login" />,
});
