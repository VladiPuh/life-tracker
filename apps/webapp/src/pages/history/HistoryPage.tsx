import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { apiGet } from "../../shared/api/client";

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

function statusLabel(s: unknown) {
  if (s === "MIN") return "✅ MIN";
  if (s === "BONUS") return "⭐ BONUS";
  if (s === "SKIP") return "↩️ SKIP";
  if (s === "FAIL") return "⚑ FAIL";

  // Канон: других значений быть не должно.
  // Не прячем расхождение: показываем нейтрально + сигналим в консоль.
  // eslint-disable-next-line no-console
  console.warn("[History] unexpected status_view:", s);
  return "❓ UNKNOWN";
}

// We keep LIST visible, highlight the clicked day,
// and only switch to DETAIL after:
// 1) a small minimum delay (intentional transition)
// 2) the detail data is ready (no "white flash" between screens)
const MIN_NAV_DELAY_MS = 120;

export function HistoryPage() {
  const [daysData, setDaysData] = useState<HistoryDayDto[] | null>(null);

  const [selectedDay, setSelectedDay] = useState<string | null>(null); // committed (router state)
  const [detail, setDetail] = useState<HistoryDayDetailDto | null>(null);

  const [openingDay, setOpeningDay] = useState<string | null>(null); // UX-only (pressed/highlighted)
  const openingSeq = useRef(0);

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setOpeningDay(null);
      setErr(null);
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

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

  // load detail when selected (e.g. on browser Back/Forward)
  useEffect(() => {
    if (!selectedDay) {
      setDetail(null);
      return;
    }
    if (detail?.date === selectedDay) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  const days = useMemo(() => {
    return (daysData ?? []).map((x) => ({ ...x, dateLabel: formatDateRu(x.date) }));
  }, [daysData]);

  const hasAny = days.length > 0;

  const shellStyle: CSSProperties = {
    maxWidth: 520,
    margin: "0 auto",
    padding: 16,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
  };

  const openDay = async (day: string) => {
    if (openingDay || selectedDay) return; // prevent double-nav / spamming
    setErr(null);
    setOpeningDay(day);

    const seq = (openingSeq.current += 1);

    // 1) minimum delay (intentional)
    const minDelay = new Promise((r) => setTimeout(r, MIN_NAV_DELAY_MS));

    // 2) prefetch detail while list is still visible (no flash)
    const fetchDetail = (async () => {
      try {
        const json = await apiGet<HistoryDayDetailDto>(`/history/day/${day}`);
        return json;
      } catch (e) {
        throw e instanceof Error ? e : new Error(String(e));
      }
    })();

    try {
      const [prefetched] = await Promise.all([fetchDetail, minDelay]);

      // Outdated click (user clicked another day or went back)
      if (openingSeq.current !== seq) return;

      window.history.pushState({ screen: "HISTORY_DAY", day }, "");
      setDetail(prefetched);
      setSelectedDay(day);
    } catch (e) {
      if (openingSeq.current !== seq) return;
      setErr(e instanceof Error ? e.message : String(e));
      setOpeningDay(null);
    } finally {
      // Keep highlight for a tiny moment even if detail is instant
      if (openingSeq.current === seq) {
        window.setTimeout(() => {
          if (openingSeq.current === seq) setOpeningDay(null);
        }, 60);
      }
    }
  };

  // DETAIL VIEW (committed)
  if (selectedDay && detail) {
    return (
      <div style={shellStyle}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
          {formatDateRu(detail.date)}
        </div>

        {/* No full-screen loader here on purpose (UX polish). */}
        {err && (
          <div
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "rgba(0,0,0,0.02)",
              fontSize: 12,
            }}
          >
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
    <div style={shellStyle}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>История</div>

      <div style={{ fontSize: 13, opacity: 0.7, maxWidth: 420, marginBottom: 14 }}>
        Факты по дням. Нажми на день — увидишь детали.
      </div>

      {err && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "rgba(0,0,0,0.02)",
            fontSize: 12,
            opacity: 0.8,
          }}
        >
          Не удалось загрузить историю: {err}
        </div>
      )}

      {!hasAny ? (
        <div
          style={{
            padding: 14,
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Пока здесь нет фактов</div>
          <div style={{ fontSize: 13, opacity: 0.75, maxWidth: 420 }}>
            История появится после первых отметок в Today.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {days.map((x) => {
            const isOpening = openingDay === x.date;
            return (
              <div
                key={x.date}
                role="button"
                tabIndex={0}
                aria-disabled={Boolean(openingDay)}
                onClick={() => void openDay(x.date)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") void openDay(x.date);
                }}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  border: isOpening ? "1px solid rgba(0,0,0,0.20)" : "1px solid rgba(0,0,0,0.08)",
                  background: isOpening ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.02)",
                  cursor: openingDay ? "default" : "pointer",
                  userSelect: "none",
                  transform: isOpening ? "scale(0.985)" : "scale(1)",
                  transition: "transform 140ms ease, background 140ms ease, border-color 140ms ease",
                  willChange: "transform",
                  opacity: openingDay && !isOpening ? 0.85 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{x.dateLabel}</div>
                  <div style={{ fontSize: 12, opacity: 0.65, whiteSpace: "nowrap" }}>
                    {isOpening ? "открываю…" : `записей: ${x.total}`}
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>✅ {x.min}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>⭐ {x.bonus}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>↩️ {x.skip}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>⚑ {x.fail}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List loading stays subtle: we avoid full-screen loaders in this UX-polish task. */}
      {loading && !daysData && <div style={{ opacity: 0.7, marginTop: 10 }}>Загрузка…</div>}
    </div>
  );
}
