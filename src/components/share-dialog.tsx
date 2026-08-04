import { useState } from "react";
import { Check, Copy, Facebook, Link2, Mail, MessageCircle, Send, Twitter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ShareDialog({
  open,
  onOpenChange,
  url,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const text = `${title} — made with ForgeBloxAI`;
  const e = encodeURIComponent;

  const targets = [
    { label: "Discord", icon: MessageCircle, href: `https://discord.com/channels/@me?text=${e(`${text} ${url}`)}` },
    { label: "Telegram", icon: Send, href: `https://t.me/share/url?url=${e(url)}&text=${e(text)}` },
    { label: "X (Twitter)", icon: Twitter, href: `https://twitter.com/intent/tweet?url=${e(url)}&text=${e(text)}` },
    { label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}` },
    { label: "Email", icon: Mail, href: `mailto:?subject=${e(title)}&body=${e(`${text}\n${url}`)}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="panel max-w-md border-border bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Share your game</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Anyone with the link can view this generated project.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-background/60 p-2">
          <Link2 className="ml-1 size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate font-mono text-xs text-muted-foreground">{url}</span>
          <button
            type="button"
            onClick={() => void copy()}
            className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy Link"}
          </button>
        </div>
        {copied && <p className="text-sm text-primary">Link copied successfully!</p>}

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {targets.map((t) => (
            <a
              key={t.label}
              href={t.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <t.icon className="size-4 text-primary" />
              {t.label}
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
