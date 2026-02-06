import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../shared/api/client";

type ChallengeType = "DO" | "NO_DO";

type ChallengeListItem = {
  id: number;
  title: string;
  description?: string | null;

  // важно: теперь фильтруем по type
  type: ChallengeType;

  // оставляем: чтобы “Пауза” была видна, но без ACTIVE
  is_active: boolean;

  // опционально на будущее (эмодзи)
  icon?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

function TabRow(props: { text: string; active?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={props.onClick}
      role="button"
      tabIndex={0}
      style={{
        padding: 12,
        borderRadius: 14,
        border: props.active ? "1px solid var(--lt-border)" : "1px solid rgba(0,0,0,0.08)",
        background: props.active ? "var(--lt-card)" : "rgba(0,0,0,0.02)",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 15, color: "var(--lt-text)" }}>{props.text}</div>
    </div>
  );
}

function SmallTag(props: { text: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "4px 8px",
        borderRadius: 999,
        border: "1px solid var(--lt-border)",
        background: "rgba(0,0,0,0.02)",
        whiteSpace: "nowrap",
        opacity: 0.9,
        color: "var(--lt-text)",
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

  const [tab, setTab] = useState<ChallengeType>("DO"); // DO = Активные, NO_DO = Постоянные

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

  const byType = useMemo(() => items.filter((x) => x.type === tab), [items, tab]);
  const active = useMemo(() => byType.filter((x) => x.is_active), [byType]);
  const paused = useMemo(() => byType.filter((x) => !x.is_active), [byType]);

  const tabTitle = tab === "DO" ? "Активные" : "Постоянные";

  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto", fontFamily: "system-ui, Arial" }}>
      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 12, color: "var(--lt-text)" }}>
        Мои челленджи
      </div>

      {/* Tabs: две активные строки */}
      <div style={{ display: "grid", gap: 10 }}>
        <TabRow text="Активные" active={tab === "DO"} onClick={() => setTab("DO")} />
        <TabRow text="Постоянные" active={tab === "NO_DO"} onClick={() => setTab("NO_DO")} />
      </div>

      {err && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 12, border: "1px solid rgba(255,0,0,0.25)" }}>
          Ошибка: {err}
        </div>
      )}

      {loading && <div style={{ marginTop: 12, opacity: 0.7, fontSize: 12 }}>Загрузка…</div>}

      {!loading && items.length === 0 && !err && (
        <div style={{ marginTop: 12, opacity: 0.7, lineHeight: 1.4 }}>
          Пока нет челленджей. Создай первый на вкладке «Новый».
        </div>
      )}

      {!loading && items.length > 0 && !err && byType.length === 0 && (
        <div style={{ marginTop: 12, opacity: 0.7, lineHeight: 1.4 }}>
          В разделе «{tabTitle}» пока пусто.
        </div>
      )}

      {/* Список выбранного таба (без miss_policy, без ACTIVE) */}
      {active.length > 0 && (
        <div style={{ marginTop: 14 }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div style={{ fontWeight: 900, display: "flex", gap: 8, alignItems: "center", color: "var(--lt-text)" }}>
                    {ch.icon ? <span style={{ fontSize: 16, lineHeight: 1 }}>{ch.icon}</span> : null}
                    <span>{ch.title}</span>
                  </div>
                </div>

                {ch.description && (
                  <div style={{ marginTop: 6, opacity: 0.75, lineHeight: 1.35 }}>{ch.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Пауза (если есть) — без miss_policy, без ACTIVE */}
      {paused.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 8, opacity: 0.85, color: "var(--lt-text)" }}>
            Пауза
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {paused.map((ch) => (
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
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div style={{ fontWeight: 900, display: "flex", gap: 8, alignItems: "center", color: "var(--lt-text)" }}>
                    {ch.icon ? <span style={{ fontSize: 16, lineHeight: 1 }}>{ch.icon}</span> : null}
                    <span>{ch.title}</span>
                  </div>
                  <SmallTag text="⏸" />
                </div>

                {ch.description && (
                  <div style={{ marginTop: 6, opacity: 0.75, lineHeight: 1.35 }}>{ch.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
