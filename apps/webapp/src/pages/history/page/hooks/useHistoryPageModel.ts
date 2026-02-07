import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useAsyncResource } from "../../../../shared/hooks/useAsyncResource";
import type { HistoryDayDetailDto } from "../../dto";
import {
  fetchHistoryDayDetail,
  fetchHistoryDays,
  prefetchHistoryDayDetail,
  readHistoryDayDetailCache,
  readHistoryDaysCache,
  type HistoryDayDto,
} from "../../historyResource";
import { formatDateRu } from "../../formatDateRu";
import { MIN_NAV_DELAY_MS } from "../constants";
import { waitRafMs } from "../utils/waitRafMs";
import type { HistoryPatch } from "../types";

type UseHistoryPageModelResult = {
  selectedDay: string | null;
  detail: HistoryDayDetailDto | null;
  openingDay: string | null;
  err: string | null;
  loading: boolean;
  daysDataIsNull: boolean;
  days: Array<HistoryDayDto & { dateLabel: string }>;
  hasAny: boolean;
  shellStyle: CSSProperties;
  openDay: (day: string) => Promise<void>;
  patchCurrentDetail: (challenge_id: number, patch: HistoryPatch, expectedDate: string) => void;
};

export function useHistoryPageModel(): UseHistoryPageModelResult {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [detail, setDetail] = useState<HistoryDayDetailDto | null>(null);

  const [openingDay, setOpeningDay] = useState<string | null>(null);
  const openingSeq = useRef(0);

  const [prefetchErr, setPrefetchErr] = useState<string | null>(null);

  const daysResource = useAsyncResource<HistoryDayDto[]>({
    loader: fetchHistoryDays,
    deps: [],
    initialData: readHistoryDaysCache(),
  });

  const needsDetailLoad = Boolean(selectedDay) && (!detail || detail.date !== selectedDay);
  const detailResource = useAsyncResource<HistoryDayDetailDto>({
    loader: async () => fetchHistoryDayDetail(String(selectedDay)),
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

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = (e.state ?? null) as any;

      if (st && st.screen === "HISTORY_DAY") {
        const day = typeof st.day === "string" ? st.day : null;
        setSelectedDay(day);
        setDetail(day ? readHistoryDayDetailCache(day) : null);
        return;
      }

      setSelectedDay(null);
      setDetail(null);
      setOpeningDay(null);
      setPrefetchErr(null);
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const days = useMemo(() => {
    return (daysData ?? []).map((x: HistoryDayDto) => ({ ...x, dateLabel: formatDateRu(x.date) }));
  }, [daysData]);

  const hasAny = days.length > 0;
  const shellStyle: CSSProperties = {};

  const openDay = async (day: string) => {
    if (openingDay || selectedDay) return;
    setPrefetchErr(null);
    setOpeningDay(day);

    const seq = (openingSeq.current += 1);
    const minDelay = waitRafMs(MIN_NAV_DELAY_MS);

    const fetchDetail = (async () => {
      try {
        const json = await prefetchHistoryDayDetail(day);
        return json;
      } catch (e) {
        throw e instanceof Error ? e : new Error(String(e));
      }
    })();

    try {
      const [prefetched] = await Promise.all([fetchDetail, minDelay]);
      if (openingSeq.current !== seq) return;

      window.history.pushState({ screen: "HISTORY_DAY", day }, "");
      setDetail(prefetched);
      setSelectedDay(day);
    } catch (e) {
      if (openingSeq.current !== seq) return;
      setPrefetchErr(e instanceof Error ? e.message : String(e));
      setOpeningDay(null);
    } finally {
      if (openingSeq.current === seq) {
        void waitRafMs(80).then(() => {
          if (openingSeq.current === seq) setOpeningDay(null);
        });
      }
    }
  };

  const patchCurrentDetail = (challenge_id: number, patch: HistoryPatch, expectedDate: string) => {
    setDetail((prev) => {
      if (!prev) return prev;
      if (prev.date !== expectedDate) return prev;
      return {
        ...prev,
        items: prev.items.map((x) =>
          x.challenge_id === challenge_id ? { ...x, ...patch } : x
        ),
      };
    });
  };

  return {
    selectedDay,
    detail,
    openingDay,
    err,
    loading,
    daysDataIsNull: daysData === null,
    days,
    hasAny,
    shellStyle,
    openDay,
    patchCurrentDetail,
  };
}
