import type { TodayResponse } from "../../shared/domain/types";
import { StatusPill } from "../../shared/ui/StatusPill";
import { FlagButtons } from "../../shared/ui/FlagButtons";

type Props = {
  today: TodayResponse | null;
  showAll: boolean;
  onToggleShowAll: () => void;

  onGoDetail: (challengeId: number) => void;
  onSetFlagFirst: (flag: "MIN" | "BONUS" | "SKIP" | "FAIL") => void;
};

export function TodayScreen(props: Props) {
  const { today, showAll, onToggleShowAll, onGoDetail, onSetFlagFirst } = props;

  return (
    <>
      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, opacity: 0.7 }}>Первый невыполненный</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {today
                  ? (today.first_uncompleted ? today.first_uncompleted.title : "Все выполнено ✅")
                  : "Загрузка..."}
              </div>
            </div>
            <StatusPill s={today ? (today.first_uncompleted?.status_view ?? "WAITING") : "WAITING"} />
          </div>

          {today?.first_uncompleted ? (
            <div style={{ marginTop: 10 }}>
              <FlagButtons onSet={onSetFlagFirst} />
            </div>
          ) : (
            <div style={{ marginTop: 10, opacity: 0.6, fontSize: 12 }}>
              На сегодня всё отмечено. Нажми “Показать все”, чтобы увидеть список.
            </div>
          )}
        </div>

        <button onClick={onToggleShowAll}>
          {showAll ? "Скрыть" : "Показать все"}
        </button>
      </div>

      {showAll && (
        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {today?.all.map((ch) => (
            <div
              key={ch.challenge_id}
              style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12, cursor: "pointer" }}
              onClick={() => onGoDetail(ch.challenge_id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 600 }}>{ch.title}</div>
                <StatusPill s={ch.status_view} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
