export type HistoryDayDetailItemDto = {
  challenge_id: number;
  title: string;
  status_view: "MIN" | "BONUS" | "SKIP" | "FAIL";
  minutes_fact: number | null;
  comment: string | null;
};

export type HistoryDayDetailDto = {
  date: string;
  items: HistoryDayDetailItemDto[];
};

export type DayVm = {
  date: string;
  dateLabel: string;
  total: number;
  min: number;
  bonus: number;
  skip: number;
  fail: number;
};
