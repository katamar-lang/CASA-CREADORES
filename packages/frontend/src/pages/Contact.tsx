import { CircleCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { getContactEmail } from "@/lib/site";
import { toUserMessage } from "@/lib/errors";

export function Contact() {
  const contactEmail = getContactEmail();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/contact", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ name, email, message }),
      });
      setSent(true);
    } catch (err) {
      setError(toUserMessage(err, "No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos."));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="container flex min-h-[calc(100vh-4rem)] max-w-md items-center py-16">
        <Card className="w-full border-none text-center shadow-none sm:border">
          <CardHeader className="items-center">
            <CircleCheck className="mb-2 h-8 w-8 text-emerald-600" strokeWidth={1.5} />
            <CardTitle className="text-xl">Mensaje enviado</CardTitle>
            <CardDescription>Gracias por escribirnos. Te responderemos pronto.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-xl py-16">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Contacto</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          ¿Eres una marca que quiere lanzar una campaña, o un creador con preguntas? Déjanos tu mensaje y te
          respondemos.
          {contactEmail && (
            <>
              {" "}
              También puedes escribirnos a{" "}
              <a href={`mailto:${contactEmail}`} className="font-medium text-foreground hover:underline">
                {contactEmail}
              </a>
              .
            </>
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre o el de tu empresa"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="message">Mensaje</Label>
          <Textarea
            id="message"
            required
            minLength={10}
            className="min-h-[140px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Cuéntanos en qué podemos ayudarte..."
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading} className="self-start">
          {loading ? "Enviando..." : "Enviar mensaje"}
        </Button>
      </form>
    </div>
  );
}
