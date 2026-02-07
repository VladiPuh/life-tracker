import { useEffect, useState } from "react";
import { apiDelete, apiPatch } from "../../shared/api/client";
import { ChallengeHistoryPanel } from "./ChallengeHistoryPanel";
import { useAsyncResource } from "../../shared/hooks/useAsyncResource";
import {
  fetchChallenge,
  readChallengeCache,
  type ChallengeDto,
  writeChallengeCache,
} from "./detailResource";
import { backController } from "../../shared/nav/backController";

export default function DetailScreen(props: {
  challengeId: number;
  onBack: () => void;
  onEdit: (ch: { id: number; title: string; description?: string | null; type: "DO" | "NO_DO" }) => void;
}) {
  const { challengeId } = props;

  const [itemOverride, setItemOverride] = useState<ChallengeDto | null>(null);
  const resource = useAsyncResource<ChallengeDto>({
    loader: () => fetchChallenge(challengeId),
    deps: [challengeId],
    initialData: readChallengeCache(challengeId),
  });

  useEffect(() => {
    setItemOverride(null);
  }, [challengeId]);

  useEffect(() => {
    if (resource.error) return;
    if (!resource.data) return;
    writeChallengeCache(resource.data);
  }, [resource.data, resource.error]);

  const item = itemOverride ?? (resource.error ? null : resource.data);
  const err = resource.error;
  const loading = resource.loading;
  const canRenderItem = Boolean(item) && !err;

  async function togglePause() {
    if (!item) return;
    const next = !item.is_active;

    await apiPatch(`/challenges/${item.id}`, { is_active: next });
    const patched = { ...item, is_active: next };
    setItemOverride(patched);
    writeChallengeCache(patched);
  }

  async function onDelete() {
    if (!item) return;

    const ok = confirm(
      "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0447\u0435\u043B\u043B\u0435\u043D\u0434\u0436? \u041E\u043D \u0438\u0441\u0447\u0435\u0437\u043D\u0435\u0442 \u0438\u0437 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F, \u043D\u043E \u0438\u0441\u0442\u043E\u0440\u0438\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u043D\u0430 \u0432\u0440\u0435\u043C\u044F."
    );
    if (!ok) return;

    await apiDelete(`/challenges/${item.id}`);

    if (!backController.run()) {
      try {
        window.history.back();
      } catch {}
    }
  }

  return (
    <div
      style={{
        width: "100%",
        padding: 16,
        boxSizing: "border-box",
        overflowX: "clip",
        fontFamily: "system-ui, Arial",
        color: "var(--lt-text)",
      }}
    >
      {err && (
        <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,0,0,0.25)" }}>
          {"\u041E\u0448\u0438\u0431\u043A\u0430"}: {err}
        </div>
      )}

      {!loading && !err && !item && (
        <div style={{ opacity: 0.7 }}>
          {"\u041D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D."}
        </div>
      )}

      {canRenderItem && item && (
        <>
          <div
            style={{
              padding: 14,
              boxSizing: "border-box",
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
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 950,
                  lineHeight: 1.15,
                  color: "var(--lt-text)",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
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
                  {"\u270F\uFE0F"}
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
                  {item.is_active
                    ? "\u23F8 \u041F\u0430\u0443\u0437\u0430"
                    : "\u25B6 \u0412\u043A\u043B"}
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
                  {"\uD83D\uDDD1"}
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
                {"\u23F8 \u041F\u0430\u0443\u0437\u0430"}
              </div>
            )}
          </div>

          <ChallengeHistoryPanel challengeId={challengeId} days={60} />
        </>
      )}
    </div>
  );
}
