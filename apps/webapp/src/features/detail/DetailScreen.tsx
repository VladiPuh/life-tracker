import { useEffect, useState } from "react";
import { apiDelete, apiGet, apiPatch } from "../../shared/api/client";
import { ChallengeHistoryPanel } from "./ChallengeHistoryPanel";

type ChallengeDto = {
  id: number;
  type: "DO" | "NO_DO";
  title: string;
  description?: string | null;
  is_active: boolean;
  icon?: string | null;
};

export default function DetailScreen(props: {
  challengeId: number;
  onBack: () => void;
  onEdit: (ch: { id: number; title: string; description?: string | null; type: "DO" | "NO_DO" }) => void;
}) {
  const { challengeId } = props;

  const [item, setItem] = useState<ChallengeDto | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const json = await apiGet<ChallengeDto>(`/challenges/${challengeId}`);
        if (!cancelled) setItem(json);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : String(e));
          setItem(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [challengeId]);

  async function togglePause() {
    if (!item) return;
    const next = !item.is_active;

    await apiPatch(`/challenges/${item.id}`, { is_active: next });
    setItem({ ...item, is_active: next });
  }

  async function onDelete() {
    if (!item) return;

    const ok = confirm("Удалить челлендж? Он исчезнет из приложения, но история сохранится на время.");
    if (!ok) return;

    await apiDelete(`/challenges/${item.id}`);

    // после удаления — уходим назад системным back bar
    (window as any).__LT_BACK_OVERRIDE__?.(); // если есть
    // если override нет — просто назад через history
    try { window.history.back(); } catch {}
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 16, fontFamily: "system-ui, Arial" }}>

      {loading && <div style={{ opacity: 0.7 }}>Загрузка…</div>}

      {err && (
        <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,0,0,0.25)" }}>
          Ошибка: {err}
        </div>
      )}

      {!loading && !err && !item && <div style={{ opacity: 0.7 }}>Не найден.</div>}

      {!loading && !err && item && (
        <>
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 950, lineHeight: 1.15, color: "var(--lt-text)", display: "flex", gap: 8, alignItems: "center" }}>
                {item.icon ? <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span> : null}
                <span>{item.title}</span>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() =>
                    props.onEdit({
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      type: item.type,
                    })
                  }
                  style={{
                    border: "1px solid var(--lt-border)",
                    background: "transparent",
                    borderRadius: 12,
                    padding: "8px 10px",
                    fontWeight: 800,
                    cursor: "pointer",
                    color: "var(--lt-text)",
                    opacity: 0.75,
                  }}
                >
                  ✏️
                </button>

                <button
                  onClick={togglePause}
                  style={{
                    border: "1px solid var(--lt-border)",
                    background: "transparent",
                    borderRadius: 12,
                    padding: "8px 10px",
                    fontWeight: 800,
                    cursor: "pointer",
                    color: "var(--lt-text)",
                    opacity: 0.75,
                  }}
                >
                  {item.is_active ? "⏸ Пауза" : "▶︎ Вкл"}
                </button>

                <button
                  onClick={onDelete}
                  style={{
                    border: "1px solid var(--lt-border)",
                    background: "transparent",
                    borderRadius: 12,
                    padding: "8px 10px",
                    fontWeight: 800,
                    cursor: "pointer",
                    color: "var(--lt-text)",
                    opacity: 0.5,
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
            
            {item.description && (
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8, lineHeight: 1.35 }}>
                {item.description}
              </div>
            )}

            {!item.is_active && (
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                ⏸ Пауза
              </div>
            )}
          </div>

          <ChallengeHistoryPanel challengeId={challengeId} days={60} />
        </>
      )}
    </div>
  );
}
