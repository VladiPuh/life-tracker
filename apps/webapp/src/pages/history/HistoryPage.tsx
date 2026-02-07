import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { apiGet } from "../../shared/api/client";
import { HistoryDaysList } from "./HistoryDaysList";
import { HistoryDayView } from "./HistoryDayView";
import { formatDateRu } from "./formatDateRu";
import { statusLabel } from "./statusLabel";
import { useAsyncResource } from "../../shared/hooks/useAsyncResource";

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
const MIN_NAV_DELAY_MS = 260;

function waitRafMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const dt = performance.now() - t0;
      if (dt >= ms) {
        if (raf) cancelAnimationFrame(raf);
        resolve();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  });
}


export function HistoryPage() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null); // committed (router state)
  const [detail, setDetail] = useState<HistoryDayDetailDto | null>(null);

  const [openingDay, setOpeningDay] = useState<string | null>(null); // UX-only (pressed/highlighted)
  const openingSeq = useRef(0);

  const [prefetchErr, setPrefetchErr] = useState<string | null>(null);

  const daysResource = useAsyncResource<HistoryDayDto[]>({
    loader: async () => {
      const json = await apiGet<HistoryDayDto[]>("/history/days");
      return Array.isArray(json) ? json : [];
    },
    deps: [],
  });

  const needsDetailLoad = Boolean(selectedDay) && (!detail || detail.date !== selectedDay);
  const detailResource = useAsyncResource<HistoryDayDetailDto>({
    loader: async () => {
      return apiGet<HistoryDayDetailDto>(`/history/day/${selectedDay}`);
    },
    deps: [selectedDay],
    enabled: needsDetailLoad,
  });

  useEffect(() => {
    if (!selectedDay) return;
    setPrefetchErr(null);
  }, [selectedDay]);

  useEffect(() => {
    if (!detailResource.data) return;
    if (!selectedDay) return;
    if (detailResource.data.date !== selectedDay) return;
    setDetail(detailResource.data);
  }, [detailResource.data, selectedDay]);

  const daysData = daysResource.data ?? (daysResource.error ? [] : null);
  const err = selectedDay
    ? prefetchErr ?? detailResource.error
    : prefetchErr ?? daysResource.error;
  const loading = selectedDay ? detailResource.loading : daysResource.loading;

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
      setPrefetchErr(null);
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const days = useMemo(() => {
    return (daysData ?? []).map((x) => ({ ...x, dateLabel: formatDateRu(x.date) }));
  }, [daysData]);

  const hasAny = days.length > 0;

  const shellStyle: CSSProperties = {};

  const openDay = async (day: string) => {
    if (openingDay || selectedDay) return; // prevent double-nav / spamming
    setPrefetchErr(null);
    setOpeningDay(day);

    const seq = (openingSeq.current += 1);

    // 1) minimum delay (intentional)
    const minDelay = waitRafMs(MIN_NAV_DELAY_MS);

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
      setPrefetchErr(e instanceof Error ? e.message : String(e));
      setOpeningDay(null);
    } finally {
      // Keep highlight for a tiny moment even if detail is instant
      if (openingSeq.current === seq) {
        void waitRafMs(80).then(() => {
          if (openingSeq.current === seq) setOpeningDay(null);
        });
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

  // HARD GATE: do not render intermediate LIST UI before first /history/days payload.
  if (daysData === null) {
    return <div />;
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
