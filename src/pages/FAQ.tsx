import { useSeo } from '@/hooks/useSeo';

export default function FAQ() {
  useSeo('FAQ | Baratona Platform', 'Perguntas frequentes sobre criação, compartilhamento e administração de baratonas.');

  const faq = [
    ['A plataforma é gratuita?', 'Sim, gratuita na v1.'],
    ['Preciso de login?', 'Sim, login com Google para criar baratonas.'],
    ['Posso criar evento privado?', 'Sim, você escolhe público ou privado.'],
    ['Onde vejo eventos?', 'Na página Explorar.'],
  ];

  return (
    <div className="container max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">FAQ</h1>
      <div className="space-y-4">
        {faq.map(([q, a]) => (
          <div key={q} className="border rounded-lg p-4">
            <h2 className="font-semibold">{q}</h2>
            <p className="text-muted-foreground text-sm mt-2">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
