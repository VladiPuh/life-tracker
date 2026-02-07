type ChallengeType = "DO" | "NO_DO";

type Props = {
  newTitle: string;
  setNewTitle: (v: string) => void;

  newDesc: string;
  setNewDesc: (v: string) => void;

  newType: ChallengeType;
  setNewType: (v: ChallengeType) => void;

  onCreate: () => void | Promise<void>;
  error?: string | null;
};

export function AddScreen(props: Props) {
  const { newTitle, setNewTitle, newDesc, setNewDesc, newType, setNewType, onCreate } = props;

  return (
    <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
      <div
        style={{
          padding: 12,
          border: "1px solid var(--lt-border)",
          borderRadius: 12,
          background: "var(--lt-card)",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700 }}>Добавить челендж</div>
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <label>
            Название*
            <input
              value={newTitle}
              maxLength={48}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 10,
                borderRadius: 10,
                border: "1px solid var(--lt-border)",
                background: "var(--lt-bg)",
                color: "var(--lt-text)",
                
              }}
              placeholder="Читать / Спорт / Не курить"
            />
          </label>

          <label>
            Описание (опционально)
            <textarea
              value={newDesc}
              maxLength={240}
              onChange={(e) => setNewDesc(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 10,
                borderRadius: 10,
                border: "1px solid var(--lt-border)",
                background: "var(--lt-bg)",
                color: "var(--lt-text)",
              }}
              placeholder="Что именно делать или НЕ делать / Цель"
              rows={3}
            />
          </label>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Тип</div>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: 10,
                borderRadius: 12,
                border: "1px solid var(--lt-border)",
                background: newType === "DO" ? "var(--lt-card2)" : "transparent",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="challenge_type"
                checked={newType === "DO"}
                onChange={() => setNewType("DO")}
                style={{ marginTop: 3 }}
              />
              <div>
                <div style={{ fontWeight: 800 }}>Активный</div>
                <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.3, marginTop: 2 }}>
                  Нужно отмечать каждый день. Если ничего не отметил до конца дня — ❌
                </div>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: 10,
                borderRadius: 12,
                border: "1px solid var(--lt-border)",
                background: newType === "NO_DO" ? "var(--lt-card2)" : "transparent",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="challenge_type"
                checked={newType === "NO_DO"}
                onChange={() => setNewType("NO_DO")}
                style={{ marginTop: 3 }}
              />
              <div>
                <div style={{ fontWeight: 800 }}>Постоянный</div>
                <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.3, marginTop: 2 }}>
                  Если ничего не отметил до конца дня, то автоматически — ✅
                </div>
              </div>
            </label>
          </div>
          
          {props.error ? (
            <div style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(255,0,0,0.25)" }}>
              {props.error}
            </div>
          ) : null}

          <button onClick={onCreate}>Создать</button>
        </div>
      </div>
    </div>
  );
}
