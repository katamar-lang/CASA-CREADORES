import { Coins, FileText, Handshake, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const steps = [
  {
    icon: FileText,
    title: "Crea tu campaña",
    description: "Marcas publican campañas con presupuesto en USDC y requisitos claros en menos de 5 minutos.",
  },
  {
    icon: Handshake,
    title: "Matching con creadores",
    description: "Encontramos creadores verificados en nichos cripto y fintech que aplican a tu campaña.",
  },
  {
    icon: Coins,
    title: "Pago en USDC",
    description: "Paga directo en USDC, sin barreras bancarias. Cobramos una comisión del 15–20% por campaña.",
  },
];

export function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="container py-24 sm:py-32">
        <div className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
          <span className="mb-6 inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            Influencer marketing para cripto &amp; fintech
          </span>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
            Las marcas cripto no encuentran creadores confiables.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Casa Creadores conecta marcas de cripto y fintech con creadores hispanohablantes verificados, con pagos
            en USDC directos, sin fricción bancaria.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <Link to="/registro?role=MARCA">Soy marca</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/registro?role=CREADOR">Soy creador</Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* Cómo funciona */}
      <section id="como-funciona" className="container py-24">
        <div className="mb-16 max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">¿Cómo funciona?</h2>
        </div>
        <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
          {steps.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md border border-border">
                <Icon className="h-4 w-4 text-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 font-medium text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modelo de comisión */}
      <section id="modelo" className="border-y border-border bg-foreground text-background">
        <div className="container py-24 text-center">
          <h2 className="mx-auto max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
            Modelo simple, sin sorpresas
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-background/70">
            Cobramos una comisión del <span className="font-medium text-primary">15% al 20%</span> sobre cada
            campaña pagada. Las marcas premium acceden a un plan de suscripción con beneficios adicionales; para
            creadores, el registro y las primeras aplicaciones son siempre gratis.
          </p>
        </div>
      </section>

      {/* Testimonio */}
      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Quote className="mx-auto mb-6 h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-xl font-medium leading-relaxed text-foreground sm:text-2xl">
            Casa Creadores nos ayudó a encontrar creadores cripto hispanohablantes de verdad, con seguidores reales y
            contenido de calidad. El pago en USDC nos ahorró semanas de fricción bancaria en LATAM.
          </p>
          <p className="mt-8 text-sm text-muted-foreground">Equipo de Marketing</p>
        </div>
      </section>

      <Separator />

      {/* CTA final */}
      <section className="container py-24 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">¿Listo para empezar?</h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/registro?role=MARCA">Crear mi primera campaña</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/registro?role=CREADOR">Registrarme como creador</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
