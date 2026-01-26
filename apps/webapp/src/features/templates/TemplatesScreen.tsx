import type { TemplateItem } from "../../shared/domain/types";

type Props = {
  templates: TemplateItem[] | null;
  onAdd: (templateId: number) => void;
};

export function TemplatesScreen(props: Props) {
  const { templates, onAdd } = props;

  return (
    <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
      <div style={{ opacity: 0.7, fontSize: 13 }}>
        Выбери шаблон и добавь в свои челенджи.
      </div>

      {(templates ?? []).map((t) => (
        <div key={t.id} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700 }}>{t.title}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>{t.description ?? ""}</div>
            </div>
            <button onClick={() => onAdd(t.id)}>Добавить</button>
          </div>
        </div>
      ))}
    </div>
  );
}
