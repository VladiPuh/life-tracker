export type StatusView = "MIN" | "BONUS" | "SKIP" | "FAIL" | null;

export type TodayItem = {
  challenge_id: number;
  title: string;
  status_view: StatusView | null;
};

export type TodayResponse = {
  date: string;
  first_uncompleted: TodayItem | null;
  all: TodayItem[];
};

export type TemplateItem = {
  id: number;
  title: string;
  description?: string | null;
  miss_policy: "FAIL" | "MIN";
};

export type HistoryItem = {
  date: string;
  status_view: StatusView;
  minutes_fact: number | null;
  comment: string | null;
};

export type HistoryResponse = {
  challenge_id: number;
  items: HistoryItem[];
};

export type ChallengePatch = {
  title?: string | null;
  description?: string | null;
  miss_policy?: "FAIL" | "MIN";
  is_active?: boolean;
};

export type ChallengeFull = {
  id: number;
  title: string;
  description: string | null;
  miss_policy: "FAIL" | "MIN";
  is_active: boolean;
};

export type Screen =
  | "TODAY"
  | "ADD"
  | "DETAIL"
  | "HISTORY"
  | "TEMPLATES"
  | "PROFILE"
  | "CHALLENGES"
  | "CHALLENGES_LIST"
;

