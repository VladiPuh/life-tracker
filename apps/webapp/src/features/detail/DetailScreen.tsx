import type {
  TodayResponse,
  ChallengeFull,
  HistoryResponse,
} from "../../shared/domain/types";
import { StatusPill } from "../../shared/ui/StatusPill";
import { FlagButtons } from "../../shared/ui/FlagButtons";

type Flag = "MIN" | "BONUS" | "SKIP" | "FAIL";

type Props = {
  selected: TodayResponse["all"][number];
  challengeFull: ChallengeFull | null;
  history: HistoryResponse | null;

  editTitle: string;
  setEditTitle: (v: string) => void;

  editDesc: string;
  setEditDesc: (v: string) => void;

  editMiss: "FAIL" | "MIN" | "BONUS" | "SKIP";
  setEditMiss: (v: "FAIL" | "MIN" | "BONUS" | "SKIP") => void;

  editActive: boolean;
  setEditActive: (v: boolean) => void;

  onBack: () => void;
  onSetFlag: (flag: Flag) => void;

  onSaveTitle: () => void;
  onSaveDesc: () => void;
  onSavePolicyAndActive: () => void;
};

export function DetailScreen(props: Props) {
  const {
    selected,
    challengeFull,
    history,
    editTitle,
    setEditTitle,
    editDesc,
    setEditDesc,
    editMiss,
    setEditMiss,
    editActive,
    setEditActive,
    onBack,
    onSetFlag,
    onSaveTitle,
    onSaveDesc,
    onSavePolicyAndActive,
  } = props;

  return (
    <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
      <button onClick={onBack}>← Назад</button>

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{selected.title}</div>
          <StatusPill s={selected.status_view} />
        </div>

        <div style={{ marginTop: 12, width: "100%" }}>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Название</div>

            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />

            <button style={{ alignSelf: "flex-start" }} onClick={onSaveTitle}>
              Сохранить
            </button>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Если не отметил до конца дня</div>

            <select
              value={editMiss}
              onChange={(e) => setEditMiss(e.target.value as any)}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            >
              <option value="FAIL">FAIL</option>
              <option value="SKIP">SKIP</option>
              <option value="MIN">MIN</option>
              <option value="BONUS">BONUS</option>
            </select>

            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
              />
              Активен
            </label>

            <button style={{ alignSelf: "flex-start" }} onClick={onSavePolicyAndActive}>
              Сохранить политику и активность
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <FlagButtons onSet={onSetFlag} />
        </div>

        <div style={{ marginTop: 12, width: "100%" }}>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Описание</div>

            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
              rows={4}
              placeholder="Что именно делать"
            />

            <button style={{ alignSelf: "flex-start" }} onClick={onSaveDesc}>
              Сохранить описание
            </button>

            <div style={{ opacity: 0.7, fontSize: 12 }}>
              Текущее:{" "}
              {challengeFull && challengeFull.id === selected.challenge_id
                ? (challengeFull.description ?? "— нет описания —")
                : "Загрузка..."}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12 }}>
          История и редактор — следующий шаг (подключим /history и PATCH).
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>История (30 дней)</div>

        {!history || history.challenge_id !== selected.challenge_id ? (
          <div style={{ opacity: 0.7, fontSize: 12 }}>Загрузка...</div>
        ) : history.items.length === 0 ? (
          <div style={{ opacity: 0.7, fontSize: 12 }}>Пока нет записей</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {history.items.map((it) => (
              <div key={it.date} style={{ padding: 10, border: "1px solid #eee", borderRadius: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13 }}>{it.date}</div>
                  <StatusPill s={it.status_view} />
                </div>

                {(it.minutes_fact != null || it.comment) && (
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                    {it.minutes_fact != null ? `Мин: ${it.minutes_fact}` : ""}
                    {it.minutes_fact != null && it.comment ? " • " : ""}
                    {it.comment ?? ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
