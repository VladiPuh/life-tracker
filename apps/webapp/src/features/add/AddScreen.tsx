type MissPolicy = "FAIL" | "MIN" | "BONUS" | "SKIP";

type Props = {
  newTitle: string;
  setNewTitle: (v: string) => void;

  newDesc: string;
  setNewDesc: (v: string) => void;

  newMissPolicy: MissPolicy;
  setNewMissPolicy: (v: MissPolicy) => void;

  onBack: () => void;
  onCreate: () => void;
};

export function AddScreen(props: Props) {
  const {
    newTitle,
    setNewTitle,
    newDesc,
    setNewDesc,
    newMissPolicy,
    setNewMissPolicy,
    onBack,
    onCreate,
  } = props;

  return (
    <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
      <button onClick={onBack}>← Назад</button>

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Добавить челендж</div>
        <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>
          MVP: делаем короткий мастер (название + политика пропуска).
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <label>
            Название*
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
              placeholder="Напр. Reading"
            />
          </label>

          <label>
            Описание (опционально)
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
              placeholder="Что именно делать"
              rows={3}
            />
          </label>

          <label>
            Если не отметил до конца дня:
            <select
              value={newMissPolicy}
              onChange={(e) => setNewMissPolicy(e.target.value as MissPolicy)}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            >
              <option value="FAIL">FAIL</option>
              <option value="SKIP">SKIP</option>
              <option value="MIN">MIN</option>
              <option value="BONUS">BONUS</option>
            </select>
          </label>

          <button onClick={onCreate}>Создать</button>
        </div>
      </div>
    </div>
  );
}
