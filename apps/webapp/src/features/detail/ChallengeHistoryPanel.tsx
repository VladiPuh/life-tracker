import { getStatusEmoji } from "../../shared/statusMeta";
import { useAsyncResource } from "../../shared/hooks/useAsyncResource";
import {
  fetchChallengeHistory,
  readChallengeHistoryCache,
  type ChallengeHistoryItem,
} from "./challengeHistoryResource";

type Item = ChallengeHistoryItem;

const RU_DAY_MONTH = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

function fmtDayMonth(dateIso: string) {
  const d = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateIso;
  return RU_DAY_MONTH.format(d);
}

function StatusMark(props: { v: Item["status_view"] }) {
  return (
    <span
      style={{
        fontSize: 14,
        lineHeight: 1,
        opacity: 0.9,
      }}
      aria-label={props.v}
      title={props.v}
    >
      {getStatusEmoji(props.v)}
    </span>
  );
}

export function ChallengeHistoryPanel(props: { challengeId: number; days?: number }) {
  const days = props.days ?? 30;
  const initial = readChallengeHistoryCache(props.challengeId, days);

  const resource = useAsyncResource<Item[]>({
    loader: () => fetchChallengeHistory(props.challengeId, days),
    deps: [props.challengeId, days],
    initialData: initial,
  });

  const hasData = resource.data !== null;
  const items = resource.error ? [] : resource.data ?? [];
  const loading = resource.loading;
  const err = resource.error;

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 8, color: "var(--lt-text)" }}>
        История
      </div>

      {loading ? <div style={{ height: 0 }} /> : null}

      {err && (
        <div style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(255,0,0,0.25)" }}>
          Ошибка: {err}
        </div>
      )}

      {!loading && !err && hasData && items.length === 0 && (
        <div style={{ opacity: 0.7, lineHeight: 1.4 }}>
          Пока нет записей по этому челленджу.
        </div>
      )}

      {!loading && !err && hasData && items.length > 0 && (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((it) => (
            <div
              key={it.date}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid var(--lt-border)",
                background: "transparent",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.8, color: "var(--lt-text)" }}>
                  {fmtDayMonth(it.date)}
                </div>
                <StatusMark v={it.status_view} />
              </div>

              {typeof it.minutes_fact === "number" && (
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                  {it.minutes_fact} мин
                </div>
              )}

              {it.comment && it.comment.trim() !== "" && (
                <div
                  style={{
                    marginTop: 8,
                    lineHeight: 1.35,
                    opacity: 0.8,
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                  }}
                >
                  {it.comment}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
