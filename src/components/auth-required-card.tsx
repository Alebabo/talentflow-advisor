import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function AuthRequiredCard({ message }: { message?: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("ale.bonanno.wtc@gmail.com");
  const [password, setPassword] = useState("disruptive2026");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      await router.invalidate();
      window.location.reload();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="text-sm font-semibold text-foreground">Supabase-Anmeldung erforderlich</div>
      <p className="mt-2 text-sm text-muted-foreground">
        {message || "Bitte melde dich an, damit die geschutzten Serverfunktionen mit deiner Session laufen konnen."}
      </p>

      <form className="mt-4 space-y-4" onSubmit={handleLogin}>
        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Passwort</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={isSubmitting} className="bg-[#1f004c] text-[#fffcd9] hover:bg-[#2a0a66]">
          {isSubmitting ? "Anmeldung lauft..." : "Mit Supabase anmelden"}
        </Button>
      </form>
    </div>
  );
}
