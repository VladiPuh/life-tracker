import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet } from "../shared/api/client";
import { useAsyncResource } from "../shared/hooks/useAsyncResource";
import { backController } from "../shared/nav/backController";

type Challenge = {
  id: number;
  title: string;
  description?: string | null;
  type: "DO" | "NO_DO";
  is_active: boolean;
  icon?: string | null;
};

let challengesListCache: Challenge[] | null = null;

export function MyChallengesListPage(props: {
  type: "DO" | "NO_DO";
  onOpenChallenge: (id: number) => void | Promise<void>;
  onBack: () => void;
}) {
  const [openingId, setOpeningId] = useState<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const resource = useAsyncResource<Challenge[]>({
    loader: async () => {
      const json = await apiGet<Challenge[]>("/challenges");
      return Array.isArray(json) ? json : [];
    },
    deps: [],
    initialData: challengesListCache ?? [],
  });

  const all = resource.data ?? [];
  const loading = resource.loading;
  const err = resource.error;

  useEffect(() => {
    if (!resource.error && resource.data) {
      challengesListCache = resource.data;
    }
  }, [resource.data, resource.error]);

  const title =
    props.type === "DO"
      ? "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435"
      : "\u041F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u044B\u0435";
  const subtitle =
    props.type === "DO"
      ? "\u0414\u0435\u043B\u0430\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435"
      : "\u041D\u043E\u0440\u043C\u0430 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E (\u043D\u0435 \u0434\u0435\u043B\u0430\u044E)";

  const items = useMemo(() => {
    const byType = all.filter((x) => x.type === props.type);
    const active = byType.filter((x) => x.is_active);
    const paused = byType.filter((x) => !x.is_active);
    return { active, paused };
  }, [all, props.type]);

  useEffect(() => {
    const handler = () => {
      props.onBack();
      return true;
    };
    backController.push(handler);

    return () => {
      backController.pop(handler);
    };
  }, [props.onBack]);

  function Row(p: { it: Challenge }) {
    const it = p.it;
    const isOpening = openingId === it.id;
    const listLocked = openingId !== null;

    return (
      <button
        disabled={listLocked}
        onClick={async () => {
          if (listLocked) return;

          setOpeningId(it.id);
          try {
            await props.onOpenChallenge(it.id);
          } finally {
            if (mountedRef.current) {
              setOpeningId((cur) => (cur === it.id ? null : cur));
            }
          }
        }}
        style={{
          width: "100%",
          boxSizing: "border-box",
          textAlign: "left",
          border: "1px solid var(--lt-border)",
          background: "transparent",
          borderRadius: 14,
          padding: "12px 14px",
          cursor: listLocked ? "default" : "pointer",
          color: "var(--lt-text)",
          transform: isOpening ? "scale(0.99)" : "scale(1)",
          opacity: listLocked && !isOpening ? 0.85 : 1,
          transition: "transform 120ms ease, opacity 120ms ease",
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
    <div style={{ padding: 16, width: "100%", boxSizing: "border-box", overflowX: "clip" }}>
      <div style={{ fontSize: 20, fontWeight: 950, marginTop: 8, color: "var(--lt-text)" }}>
        {"\u041C\u043E\u0438 \u0447\u0435\u043B\u043B\u0435\u043D\u0434\u0436\u0438"}
      </div>
      <div style={{ marginTop: 10, fontSize: 18, fontWeight: 950, color: "var(--lt-text)" }}>
        {title}
      </div>
      <div style={{ marginTop: 6, opacity: 0.7, color: "var(--lt-hint)" }}>
        {subtitle}
      </div>

      <div style={{ marginTop: 16 }}>
        {err ? (
          <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(255,0,0,0.25)" }}>
            {"\u041E\u0448\u0438\u0431\u043A\u0430"}: {err}
          </div>
        ) : null}

        {!loading && !err && items.active.length === 0 && items.paused.length === 0 ? (
          <div style={{ marginTop: 14, opacity: 0.7, lineHeight: 1.35 }}>
            {"\u0417\u0434\u0435\u0441\u044C \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442\u043E."}
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
              {"\u041F\u0430\u0443\u0437\u0430"}
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {items.paused.map((it) => (
                <Row key={it.id} it={it} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ height: 12 }} />
    </div>
  );
}
