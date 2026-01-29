import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../shared/api/client";

type ChallengeListItem = {
  id: number;
  title: string;
  description?: string | null;
  miss_policy: string;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

function Badge(props: { text: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "4px 8px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "rgba(0,0,0,0.02)",
        whiteSpace: "nowrap",
      }}
    >
      {props.text}
    </span>
  );
}

export default function MyChallengesPage(props: { onOpen?: (id: number) => void }) {
  const [items, setItems] = useState<ChallengeListItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const json = await apiGet<ChallengeListItem[]>("/challenges");
        if (!cancelled) setItems(Array.isArray(json) ? json : []);
      } catch (e) {
        if (!cancelled) {
          setErr(String(e));
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
  }, []);

  const active = useMemo(() => items.filter((x) => x.is_active), [items]);
  const inactive = useMemo(() => items.filter((x) => !x.is_active), [items]);

  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto", fontFamily: "system-ui, Arial" }}>
      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>Мои челленджи</div>

      {err && (
        <div style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(255,0,0,0.25)" }}>
          Ошибка: {err}
        </div>
      )}

      {loading && <div style={{ opacity: 0.7, fontSize: 12 }}>Загрузка…</div>}

      {!loading && items.length === 0 && !err && (
        <div style={{ opacity: 0.7, lineHeight: 1.4 }}>
          Пока нет челленджей. Создай первый на вкладке «Новый».
        </div>
      )}

      {active.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Активные</div>

          <div style={{ display: "grid", gap: 10 }}>
            {active.map((ch) => (
              <div
                key={ch.id}
                onClick={() => props.onOpen?.(ch.id)}
                role={props.onOpen ? "button" : undefined}
                tabIndex={props.onOpen ? 0 : undefined}
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "rgba(0,0,0,0.02)",
                  cursor: props.onOpen ? "pointer" : "default",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 900 }}>{ch.title}</div>
                  <Badge text="ACTIVE" />
                </div>
                {ch.description && (
                  <div style={{ marginTop: 6, opacity: 0.75, lineHeight: 1.35 }}>{ch.description}</div>
                )}
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>
                  miss_policy: {ch.miss_policy}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Пауза</div>

          <div style={{ display: "grid", gap: 10 }}>
            {inactive.map((ch) => (
              <div
                key={ch.id}
                onClick={() => props.onOpen?.(ch.id)}
                role={props.onOpen ? "button" : undefined}
                tabIndex={props.onOpen ? 0 : undefined}
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "white",
                  cursor: props.onOpen ? "pointer" : "default",
                  opacity: 0.85,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 900 }}>{ch.title}</div>
                  <Badge text="PAUSE" />
                </div>
                {ch.description && (
                  <div style={{ marginTop: 6, opacity: 0.75, lineHeight: 1.35 }}>{ch.description}</div>
                )}
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>
                  miss_policy: {ch.miss_policy}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
