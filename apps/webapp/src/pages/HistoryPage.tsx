import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../shared/api/client";

type HistoryDayDto = {
  date: string; // YYYY-MM-DD
  total: number;
  min: number;
  bonus: number;
  skip: number;
  fail: number;
};

type HistoryDayDetailItemDto = {
  challenge_id: number;
  title: string;
  status_view: "MIN" | "BONUS" | "SKIP" | "FAIL";
  minutes_fact: number | null;
  comment: string | null;
};

type HistoryDayDetailDto = {
  date: string; // YYYY-MM-DD
  items: HistoryDayDetailItemDto[];
};

function formatDateRu(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map((x) => parseInt(x, 10));
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function statusLabel(s: HistoryDayDetailItemDto["status_view"]) {
  if (s === "MIN") return "✅ MIN";
  if (s === "BONUS") return "⭐ BONUS";
  if (s === "SKIP") return "↩️ SKIP";
  return "⚑ FAIL";
}

export function HistoryPage() {
  const [daysData, setDaysData] = useState<HistoryDayDto[] | null>(null);
  const [detail, setDetail] = useState<HistoryDayDetailDto | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
    // When user goes back from HISTORY_DAY -> LIST, we must reflect it in local state
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = (e.state ?? null) as any;

      if (st && st.screen === "HISTORY_DAY") {
        const day = typeof st.day === "string" ? st.day : null;
        setSelectedDay(day);
        return;
      }

      // Any other state (HISTORY/TODAY/...) means we are not inside a day
      setSelectedDay(null);
      setDetail(null);
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);


  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // load list
  useEffect(() => {
    let cancelled = false;

    async function loadDays() {
      setLoading(true);
      setErr(null);
      try {
        const json = await apiGet<HistoryDayDto[]>("/history/days");
        if (!cancelled) setDaysData(Array.isArray(json) ? json : []);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : String(e));
          setDaysData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDays();
    return () => {
      cancelled = true;
    };
  }, []);

  // load detail when selected
  useEffect(() => {
    if (!selectedDay) {
      setDetail(null);
      return;
    }
    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      setErr(null);
      try {
        const json = await apiGet<HistoryDayDetailDto>(`/history/day/${selectedDay}`);
        if (!cancelled) setDetail(json);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedDay]);

  const days = useMemo(() => {
    return (daysData ?? []).map((x) => ({ ...x, dateLabel: formatDateRu(x.date) }));
  }, [daysData]);

  const hasAny = days.length > 0;

  // DETAIL VIEW
  if (selectedDay && detail) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: 16, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
          {formatDateRu(detail.date)}
        </div>

        {loading && <div style={{ opacity: 0.7 }}>Загрузка…</div>}
        {err && (
          <div style={{ marginTop: 10, padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(0,0,0,0.02)", fontSize: 12 }}>
            Не удалось загрузить день: {err}
          </div>
        )}

        {detail.items.length === 0 ? (
          <div style={{ opacity: 0.7 }}>Нет фактов за этот день.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {detail.items.map((it) => (
              <div
                key={`${it.challenge_id}`}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{it.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.8, whiteSpace: "nowrap" }}>
                    {statusLabel(it.status_view)}
                  </div>
                </div>

                {(it.minutes_fact != null || (it.comment ?? "").trim().length > 0) && (
                  <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8, lineHeight: 1.35 }}>
                    {it.minutes_fact != null && <div>Минут: {it.minutes_fact}</div>}
                    {(it.comment ?? "").trim().length > 0 && <div>Комментарий: {it.comment}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 16, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>История</div>

      <div style={{ fontSize: 13, opacity: 0.7, maxWidth: 420, marginBottom: 14 }}>
        Факты по дням. Нажми на день — увидишь детали.
      </div>

      {loading && <div style={{ opacity: 0.7 }}>Загрузка…</div>}

      {err && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(0,0,0,0.02)", fontSize: 12, opacity: 0.8 }}>
          Не удалось загрузить историю: {err}
        </div>
      )}

      {!hasAny ? (
        <div style={{ padding: 14, borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Пока здесь нет фактов</div>
          <div style={{ fontSize: 13, opacity: 0.75, maxWidth: 420 }}>История появится после первых отметок в Today.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {days.map((x) => (
            <div
              key={x.date}
              onClick={() => {
              window.history.pushState({ screen: "HISTORY_DAY", day: x.date }, "");
              setSelectedDay(x.date);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  window.history.pushState({ screen: "HISTORY_DAY", day: x.date }, "");
                  setSelectedDay(x.date);
                }
              }}
              style={{
                padding: 14,
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(0,0,0,0.02)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{x.dateLabel}</div>
                <div style={{ fontSize: 12, opacity: 0.65, whiteSpace: "nowrap" }}>записей: {x.total}</div>
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>✅ {x.min}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>⭐ {x.bonus}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>↩️ {x.skip}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>⚑ {x.fail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
