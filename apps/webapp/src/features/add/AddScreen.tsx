type ChallengeType = "DO" | "NO_DO";

type Props = {
  newTitle: string;
  setNewTitle: (v: string) => void;

  newDesc: string;
  setNewDesc: (v: string) => void;

  newType: ChallengeType;
  setNewType: (v: ChallengeType) => void;

  onCreate: () => void | Promise<void>;
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
        <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>
          Выбираешь смысл: «Активный» (делать) или «Постоянный» (не делать).
          Политика пропуска подставляется автоматически.
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <label>
            Название*
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid var(--lt-border)",
                background: "var(--lt-bg)",
                color: "var(--lt-text)",
              }}
              placeholder="Напр. Reading"
            />
          </label>

          <label>
            Описание (опционально)
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid var(--lt-border)",
                background: "var(--lt-bg)",
                color: "var(--lt-text)",
              }}
              placeholder="Что именно делать / не делать"
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
                  Нужно отмечать каждый день. Если ничего не отметил до конца дня — <b>FAIL</b>.
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
                  По умолчанию считается, что «всё ок». Если ничего не отметил до конца дня — <b>MIN</b>.
                </div>
              </div>
            </label>
          </div>

          <button onClick={onCreate}>Создать</button>
        </div>
      </div>
    </div>
  );
}
