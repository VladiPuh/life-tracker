import { useEffect, useState } from "react";
import { apiGet } from "../../shared/api/client";

type ChallengeDto = {
  id: number;
  title: string;
  description?: string | null;
  miss_policy: string;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function DetailScreen(props: { challengeId: number; onBack: () => void }) {
  const { challengeId, onBack } = props;

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

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 16, fontFamily: "system-ui, Arial" }}>
      <button
        onClick={onBack}
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          background: "white",
          borderRadius: 12,
          padding: "10px 12px",
          cursor: "pointer",
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        ← Назад
      </button>

      <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Детали челленджа</div>

      {loading && <div style={{ opacity: 0.7 }}>Загрузка…</div>}

      {err && (
        <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,0,0,0.25)" }}>
          Ошибка: {err}
        </div>
      )}

      {!loading && !err && !item && <div style={{ opacity: 0.7 }}>Не найден.</div>}

      {!loading && !err && item && (
        <div style={{ padding: 14, borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 16, fontWeight: 900 }}>{item.title}</div>

          {item.description && (
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8, lineHeight: 1.35 }}>
              {item.description}
            </div>
          )}

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
            <div>miss_policy: {item.miss_policy}</div>
            <div>is_active: {String(item.is_active)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
