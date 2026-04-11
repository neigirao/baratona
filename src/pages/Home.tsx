import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSeo } from '@/hooks/useSeo';

export default function Home() {
  useSeo('Baratona Platform | Crie e compartilhe sua baratona', 'Plataforma para criar baratonas públicas e privadas, com ranking, check-in, consumo, mapa e FAQ.');

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-5xl mx-auto px-4 py-10 space-y-8">
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Baratona Platform</h1>
          <p className="text-muted-foreground">Crie, compartilhe e administre sua baratona com tudo que já existe na app original.</p>
          <div className="flex justify-center gap-3">
            <Button asChild><Link to="/criar">Criar minha Baratona</Link></Button>
            <Button variant="outline" asChild><Link to="/explorar">Explorar baratonas</Link></Button>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          {['Pública ou privada', 'Ranqueamento completo', 'Mapa + operação em tempo real'].map((item) => (
            <Card key={item}><CardHeader><CardTitle className="text-lg">{item}</CardTitle></CardHeader></Card>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">FAQ rápido</h2>
          <Card>
            <CardContent className="pt-6 space-y-3 text-sm">
              <p><strong>Precisa pagar?</strong> Não, a plataforma é gratuita na v1.</p>
              <p><strong>Posso criar evento privado?</strong> Sim, com convite.</p>
              <p><strong>Como criar?</strong> Faça login com Google e use o criador.</p>
              <Button variant="link" asChild className="px-0"><Link to="/faq">Ver FAQ completo</Link></Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
