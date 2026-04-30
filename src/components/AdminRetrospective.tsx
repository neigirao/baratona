import { useRetrospectiveData } from './admin/retrospective/useRetrospectiveData';
import { StatsSection } from './admin/retrospective/StatsSection';
import { RankingsSection } from './admin/retrospective/RankingsSection';
import { BarsSection } from './admin/retrospective/BarsSection';
import { ParticipationSection } from './admin/retrospective/ParticipationSection';

/**
 * Admin retrospective dashboard — composes data hook + section components.
 * Sections: stats, rankings (people), bars (consumption/ratings), participation lists.
 */
export function AdminRetrospective() {
  const data = useRetrospectiveData();

  return (
    <div className="space-y-4">
      <StatsSection
        groupStats={data.groupStats}
        globalAverage={data.globalAverage}
        barSummary={data.barSummary}
      />
      <RankingsSection
        drinkRanking={data.drinkRanking}
        foodRanking={data.foodRanking}
        achievementRanking={data.achievementRanking}
        subtypeRankings={data.subtypeRankings}
        fidelityRanking={data.fidelityRanking}
        bars={data.bars}
      />
      <BarsSection
        consumptionPerBar={data.consumptionPerBar}
        checkinsPerBar={data.checkinsPerBar}
        barRatings={data.barRatings}
        bestBar={data.bestBar}
        peakHours={data.peakHours}
      />
      <ParticipationSection
        votedList={data.votedList}
        notVotedList={data.notVotedList}
        usedList={data.usedList}
        notUsedList={data.notUsedList}
        jokesCount={data.jokesCount}
      />
    </div>
  );
}
