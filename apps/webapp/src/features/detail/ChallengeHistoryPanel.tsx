import { useEffect, useState } from "react";
import { apiGet } from "../../shared/api/client";

type Item = {
  date: string;
  status_view: "MIN" | "BONUS" | "SKIP" | "FAIL";
  minutes_fact?: number | null;
  comment?: string | null;
};

type Resp = {
  challenge_id: number;
  items: Item[];
};

function StatusPill(props: { v: Item["status_view"] }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "4px 8px",
        borderRadius: 999,
        border: "1px solid var(--lt-border)",
        background: "var(--lt-soft)",
        whiteSpace: "nowrap",
        fontWeight: 800,
        color: "var(--lt-text)",
      }}
    >
      {props.v}
    </span>
  );
}

export function ChallengeHistoryPanel(props: { challengeId: number; days?: number }) {
  const days = props.days ?? 30;

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const json = await apiGet<Resp>(`/challenges/${props.challengeId}/history?days=${days}`);
        if (!cancelled) setItems(Array.isArray(json?.items) ? json.items : []);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : String(e));
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [props.challengeId, days]);

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 8, color: "var(--lt-text)" }}>
        История
      </div>

      {loading && <div style={{ opacity: 0.7, fontSize: 12 }}>Загрузка…</div>}

      {err && (
        <div style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(255,0,0,0.25)" }}>
          Ошибка: {err}
        </div>
      )}

      {!loading && !err && items.length === 0 && (
        <div style={{ opacity: 0.7, lineHeight: 1.4 }}>
          Пока нет записей по этому челленджу.
        </div>
      )}

      {!loading && !err && items.length > 0 && (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((it) => (
            <div
              key={it.date}
              style={{
                padding: 14,
                borderRadius: 18,
                border: "1px solid var(--lt-border)",
                background: "var(--lt-card)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontWeight: 900, color: "var(--lt-text)" }}>{it.date}</div>
                <StatusPill v={it.status_view} />
              </div>

              {typeof it.minutes_fact === "number" && (
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                  {it.minutes_fact} мин
                </div>
              )}

              {it.comment && it.comment.trim() !== "" && (
                <div
                  style={{
                    marginTop: 8,
                    lineHeight: 1.35,
                    opacity: 0.8,
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                  }}
                >
                  {it.comment}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
