import { useEffect, useMemo } from "react";
import { apiGet } from "../shared/api/client";
import { useAsyncResource } from "../shared/hooks/useAsyncResource";

type Challenge = {
  id: number;
  title: string;
  description?: string | null;
  type: "DO" | "NO_DO";
  is_active: boolean;
  icon?: string | null;
};

export function MyChallengesListPage(props: {
  type: "DO" | "NO_DO";
  onOpenChallenge: (id: number) => void;
  // назад делаем через твой нижний BackBar / системный back
  onBack: () => void;
}) {
  const resource = useAsyncResource<Challenge[]>({
    loader: async () => {
      const json = await apiGet<Challenge[]>("/challenges");
      return Array.isArray(json) ? json : [];
    },
    deps: [],
    initialData: [],
  });
  const all = resource.data ?? [];
  const loading = resource.loading;
  const err = resource.error;

  const title = props.type === "DO" ? "Активные" : "Постоянные";
  const subtitle = props.type === "DO" ? "Делаю действие" : "Норма по умолчанию (не делаю)";

  const items = useMemo(() => {
    const byType = all.filter((x) => x.type === props.type);
    // пауза — отдельным блоком, как у тебя уже принято
    const active = byType.filter((x) => x.is_active);
    const paused = byType.filter((x) => !x.is_active);
    return { active, paused };
  }, [all, props.type]);

  useEffect(() => {
    (window as any).__LT_BACK_OVERRIDE__ = () => {
      props.onBack();
      return true;
    };

    return () => {
      const cur = (window as any).__LT_BACK_OVERRIDE__;
      if (typeof cur === "function") (window as any).__LT_BACK_OVERRIDE__ = undefined;
    };
  }, [props]);  

  function Row(p: { it: Challenge }) {
    const it = p.it;
    return (
      <button
        onClick={() => props.onOpenChallenge(it.id)}
        style={{
          width: "100%",
          textAlign: "left",
          border: "1px solid var(--lt-border)",
          background: "transparent",
          borderRadius: 14,
          padding: "12px 14px",
          cursor: "pointer",
          color: "var(--lt-text)",
        }}
      >
        <div style={{ opacity: 0.7, display: "flex", alignItems: "flex-start", gap: 10 }}>
          {it.icon ? (
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                border: "1px solid var(--lt-border)",
                background: "transparent",
                display: "grid",
                placeItems: "center",
                fontSize: 18,
                flex: "0 0 auto",
              }}
            >
              {it.icon}
            </div>
          ) : null}

          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.15 }}>
              {it.title}
            </div>
            {it.description ? (
              <div style={{ marginTop: 6, opacity: 0.65, lineHeight: 1.25, color: "var(--lt-hint)" }}>
                {it.description}
              </div>
            ) : null}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 560, margin: "0 auto" }}>
      <div style={{ fontSize: 20, fontWeight: 950, marginTop: 8, color: "var(--lt-text)" }}>
        Мои челленджи
      </div>
      <div style={{ marginTop: 10, fontSize: 18, fontWeight: 950, color: "var(--lt-text)" }}>
        {title}
      </div>
      <div style={{ marginTop: 6, opacity: 0.7, color: "var(--lt-hint)" }}>
        {subtitle}
      </div>

      <div style={{ marginTop: 16 }}>
        {loading ? <div style={{ opacity: 0.7 }}>Загрузка…</div> : null}
        {err ? (
          <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(255,0,0,0.25)" }}>
            Ошибка: {err}
          </div>
        ) : null}

        {!loading && !err && items.active.length === 0 && items.paused.length === 0 ? (
          <div style={{ marginTop: 14, opacity: 0.7, lineHeight: 1.35 }}>
            Здесь пока пусто.
          </div>
        ) : null}

        {items.active.length > 0 ? (
          <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
            {items.active.map((it) => (
              <Row key={it.id} it={it} />
            ))}
          </div>
        ) : null}

        {items.paused.length > 0 ? (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 900, opacity: 0.8, marginBottom: 10 }}>
              Пауза
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {items.paused.map((it) => (
                <Row key={it.id} it={it} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* верхнюю кнопку "Назад" не делаем — у тебя есть нижняя */}
      <div style={{ height: 12 }} />
    </div>
  );
}
