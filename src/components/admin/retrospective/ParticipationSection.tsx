import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Users, UserX, CheckCircle, XCircle, Laugh, Info } from 'lucide-react';
import type { useRetrospectiveData } from './useRetrospectiveData';

type Data = ReturnType<typeof useRetrospectiveData>;

export function ParticipationSection({
  votedList, notVotedList, usedList, notUsedList, jokesCount,
}: Pick<Data, 'votedList' | 'notVotedList' | 'usedList' | 'notUsedList' | 'jokesCount'>) {
  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-indigo-500" />
            Quem Votou / Quem Não Votou
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <ParticipantList title={`Votaram (${votedList.length})`} icon={<CheckCircle className="w-3.5 h-3.5" />}
            tone="indigo" people={votedList} emptyMsg="Ninguém ainda." filled />
          <ParticipantList title={`Não votaram (${notVotedList.length})`} icon={<XCircle className="w-3.5 h-3.5" />}
            tone="muted" people={notVotedList} emptyMsg="Todos votaram! 🎉" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Laugh className="w-4 h-4 text-pink-500" />
            Piadas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>O contador de piadas é local (cada celular tem o seu). Não há ranking global.</span>
          </div>
          <p className="text-sm">
            Total neste dispositivo: <span className="font-bold text-lg">{jokesCount}</span> 😂
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-green-500" />
            Quem Usou / Quem Não Usou
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <ParticipantList title={`Participaram (${usedList.length})`} icon={<Users className="w-3.5 h-3.5" />}
            tone="green" people={usedList} emptyMsg="Ninguém ainda." filled />
          <ParticipantList title={`Não participaram (${notUsedList.length})`} icon={<UserX className="w-3.5 h-3.5" />}
            tone="muted" people={notUsedList} emptyMsg="Todos participaram! 🎉" />
        </CardContent>
      </Card>
    </>
  );
}

const TONES = {
  indigo: { title: 'text-indigo-600', badge: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20' },
  green: { title: 'text-green-600', badge: 'bg-green-500/10 text-green-700 border-green-500/20' },
  muted: { title: 'text-muted-foreground', badge: '' },
};

function ParticipantList({
  title, icon, tone, people, emptyMsg, filled = false,
}: {
  title: string; icon: React.ReactNode; tone: 'indigo' | 'green' | 'muted';
  people: { id: string; name: string }[]; emptyMsg: string; filled?: boolean;
}) {
  const t = TONES[tone];
  return (
    <div>
      <h4 className={`text-sm font-semibold mb-1 flex items-center gap-1 ${t.title}`}>
        {icon}{title}
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {people.map(p => (
          <Badge key={p.id} variant={filled ? 'secondary' : 'outline'} className={filled ? t.badge : 'text-muted-foreground'}>
            {filled ? '✅' : '⚪'} {p.name}
          </Badge>
        ))}
        {people.length === 0 && <p className="text-sm text-muted-foreground">{emptyMsg}</p>}
      </div>
    </div>
  );
}
