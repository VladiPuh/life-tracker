import { HistoryDaysList } from "./HistoryDaysList";
import { HistoryDayView } from "./HistoryDayView";
import { formatDateRu } from "./formatDateRu";
import { statusLabel } from "./statusLabel";
import { useHistoryPageModel } from "./page/hooks/useHistoryPageModel";

export function HistoryPage() {
  const model = useHistoryPageModel();
  const detailForView = model.detail;

  if (model.selectedDay && detailForView) {
    return (
      <HistoryDayView
        shellStyle={model.shellStyle}
        dateLabel={formatDateRu(detailForView.date)}
        detail={detailForView}
        err={model.err}
        statusLabel={statusLabel}
        onPatchItem={(challenge_id, patch) => {
          model.patchCurrentDetail(challenge_id, patch, detailForView.date);
        }}
      />
    );
  }

  if (model.daysDataIsNull) {
    return <div />;
  }

  return (
    <HistoryDaysList
      shellStyle={model.shellStyle}
      days={model.days}
      openingDay={model.openingDay}
      hasAny={model.hasAny}
      err={model.err}
      loading={model.loading}
      daysDataIsNull={model.daysDataIsNull}
      onOpenDay={(day) => void model.openDay(day)}
    />
  );
}
