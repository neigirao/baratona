import { Link } from 'react-router-dom';
import { useSeo } from '@/hooks/useSeo';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ChevronLeft } from 'lucide-react';
import { PLATFORM_BASE_URL } from '@/lib/constants';

const faqItems = [
  {
    q: 'O que é uma Baratona?',
    a: 'É um roteiro de bares que você e seus amigos percorrem juntos num dia. Em cada bar vocês fazem check-in, registram o que consumiram e votam no bar. No final, a plataforma gera um ranking e uma retrospectiva completa do evento.',
  },
  {
    q: 'A plataforma é gratuita?',
    a: 'Sim! Na versão 1 a Baratona é totalmente gratuita para criar e participar. Não tem taxa nem limite de participantes.',
  },
  {
    q: 'Preciso criar conta?',
    a: 'Para criar uma baratona, sim — basta entrar com sua conta Google. Para participar de um evento, depende do organizador: eventos públicos podem ter participação aberta.',
  },
  {
    q: 'Posso criar uma baratona privada?',
    a: 'Sim. Ao criar o evento você escolhe entre público (aparece na página Explorar) ou privado (só quem tem o link ou convite acessa).',
  },
  {
    q: 'Como adiciono os bares no roteiro?',
    a: 'No momento da criação, há um passo para adicionar bares com nome, endereço e horário previsto. Você define a ordem do roteiro e pode editar depois.',
  },
  {
    q: 'O que é Comida de Boteco / circuito especial?',
    a: 'Além da baratona aberta (roteiro livre de bares), você pode criar um circuito especial — ideal para eventos como Comida de Boteco, onde um conjunto fixo de bares participa de uma competição.',
  },
  {
    q: 'Como funciona o ranking?',
    a: 'Cada participante vota em 4 critérios por bar: bebida, comida, ambiente e atendimento (notas de 1 a 5). A média geral determina o bar campeão.',
  },
  {
    q: 'O que é o Wrapped?',
    a: 'Inspirado no Spotify Wrapped, é um resumo visual do seu evento: quantos bares visitou, o que mais bebeu, conquistas desbloqueadas, comparação com o grupo — tudo em cards animados.',
  },
  {
    q: 'Funciona sem internet?',
    a: 'O app é otimizado para cenários de rede ruim (comum em bares lotados). Ações são salvas localmente e sincronizadas quando a conexão voltar.',
  },
  {
    q: 'Quem pode acessar o painel de administração?',
    a: 'O criador do evento tem acesso ao painel admin, onde pode mudar o status (em trânsito, no bar), enviar mensagens de broadcast e ver a retrospectiva completa.',
  },
  {
    q: 'Posso ver o mapa dos bares?',
    a: 'Sim! A aba Mapa mostra todos os bares do roteiro com localização no OpenStreetMap. Cada bar tem um botão para abrir a rota no Google Maps.',
  },
  {
    q: 'Quantos participantes podem entrar?',
    a: 'Não há limite técnico. A Baratona foi testada com grupos de até 30 pessoas, mas suporta qualquer tamanho.',
  },
  {
    q: 'Como compartilho minha baratona?',
    a: `Após criar, você recebe um link único (ex: ${PLATFORM_BASE_URL}/baratona/meu-evento). Basta enviar esse link pros amigos.`,
  },
  {
    q: 'Posso editar o evento depois de criado?',
    a: 'O painel admin permite gerenciar o evento em andamento. Funcionalidades de edição de bares e dados do evento estão em desenvolvimento.',
  },
];

export default function FAQ() {
  useSeo(
    'FAQ — Perguntas frequentes | Baratona',
    'Tire suas dúvidas sobre como criar, participar e organizar baratonas: check-in, votação, ranking e retrospectiva.',
    {
      image: `${PLATFORM_BASE_URL}/og-faq.jpg`,
      url: `${PLATFORM_BASE_URL}/faq`,
      type: 'article',
      locale: 'pt_BR',
      keywords: 'faq baratona, dúvidas, como criar baratona, organizar evento de bar',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    }
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-3xl font-bold">Perguntas frequentes</h1>
        </div>

        <Accordion type="multiple" className="space-y-2">
          {faqItems.map(({ q, a }, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border border-border/50 rounded-lg px-4">
              <AccordionTrigger className="text-left font-semibold text-sm md:text-base hover:no-underline">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center pt-4">
          <Button asChild>
            <Link to="/criar">Criar minha Baratona</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
