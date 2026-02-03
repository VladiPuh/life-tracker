import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { apiGet } from "../../shared/api/client";
import { HistoryDaysList } from "./HistoryDaysList";
import { HistoryDayView } from "./HistoryDayView";
import { formatDateRu } from "./formatDateRu";
import { statusLabel } from "./statusLabel";

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

  if (selectedDay && detail) {
    return (
      <HistoryDayView
        shellStyle={shellStyle}
        dateLabel={formatDateRu(detail.date)}
        detail={detail}
        err={err}
        statusLabel={statusLabel}
        onPatchItem={(challenge_id, patch) => {
          setDetail((prev) => {
            if (!prev) return prev;
            if (prev.date !== detail.date) return prev;
            return {
              ...prev,
              items: prev.items.map((x) =>
                x.challenge_id === challenge_id ? { ...x, ...patch } : x
              ),
            };
          });
        }}
      />
    );
  }

  // LIST VIEW
  return (
    <HistoryDaysList
      shellStyle={shellStyle}
      days={days}
      openingDay={openingDay}
      hasAny={hasAny}
      err={err}
      loading={loading}
      daysDataIsNull={daysData === null}
      onOpenDay={(day) => void openDay(day)}
    />
  );
}
