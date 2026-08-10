import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

export function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <span className="mb-4 inline-block rounded-full bg-primary-100 px-4 py-1.5 text-sm font-semibold text-primary-800">
            Influencer marketing para cripto & fintech
          </span>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            Las marcas cripto no encuentran creadores confiables.
            <br />
            Los creadores no encuentran marcas serias.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Casa Creadores conecta marcas de cripto y fintech con creadores hispanohablantes verificados,
            con pagos en USDC directos, sin fricción bancaria.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/registro?role=MARCA">
              <Button className="px-8 py-3 text-base">Soy marca 🚀</Button>
            </Link>
            <Link to="/registro?role=CREADOR">
              <Button variant="outline" className="px-8 py-3 text-base">
                Soy creador ✨
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-10 text-center text-3xl font-bold text-ink">¿Cómo funciona?</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <div className="mb-3 text-3xl">📝</div>
            <h3 className="mb-2 font-bold">1. Crea tu campaña</h3>
            <p className="text-sm text-gray-600">
              Marcas publican campañas con presupuesto en USDC y requisitos claros en menos de 5 minutos.
            </p>
          </Card>
          <Card>
            <div className="mb-3 text-3xl">🤝</div>
            <h3 className="mb-2 font-bold">2. Matching con creadores</h3>
            <p className="text-sm text-gray-600">
              Encontramos creadores verificados en nichos cripto y fintech que aplican a tu campaña.
            </p>
          </Card>
          <Card>
            <div className="mb-3 text-3xl">💸</div>
            <h3 className="mb-2 font-bold">3. Pago en USDC</h3>
            <p className="text-sm text-gray-600">
              Paga directo en USDC, sin barreras bancarias. Nosotros cobramos una comisión del 15-20% por campaña.
            </p>
          </Card>
        </div>
      </section>

      {/* Modelo de comisión */}
      <section className="bg-ink py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Modelo simple, sin sorpresas</h2>
          <p className="mx-auto max-w-2xl text-gray-300">
            Cobramos una comisión del <span className="font-bold text-primary">15% al 20%</span> sobre cada campaña
            pagada. Las marcas premium acceden a un plan de suscripción con beneficios adicionales; para creadores,
            el registro y las primeras aplicaciones son siempre gratis.
          </p>
        </div>
      </section>

      {/* Testimonio */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <Card className="text-center">
          <p className="mb-4 text-xl italic text-gray-700">
            “Casa Creadores nos ayudó a encontrar creadores cripto hispanohablantes de verdad, con seguidores reales
            y contenido de calidad. El pago en USDC nos ahorró semanas de fricción bancaria en LATAM.”
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-ink">
              H
            </div>
            <div className="text-left">
              <p className="font-semibold text-ink">Equipo de Marketing</p>
              <p className="text-sm text-gray-500">Hivello</p>
            </div>
          </div>
        </Card>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 pb-20 text-center">
        <h2 className="mb-4 text-2xl font-bold text-ink">¿Listo para empezar?</h2>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/registro?role=MARCA">
            <Button className="px-8 py-3 text-base">Crear mi primera campaña</Button>
          </Link>
          <Link to="/registro?role=CREADOR">
            <Button variant="outline" className="px-8 py-3 text-base">
              Registrarme como creador
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
