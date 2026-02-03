// Канон: других значений быть не должно.
// Не прячем расхождение: показываем нейтрально + сигналим в консоль.
export function statusLabel(s: unknown) {
  if (s === "MIN") return "✅ MIN";
  if (s === "BONUS") return "⭐ BONUS";
  if (s === "SKIP") return "↩️ SKIP";
  if (s === "FAIL") return "⚑ FAIL";

  // eslint-disable-next-line no-console
  console.warn("[History] unexpected status_view:", s);
  return "❓ UNKNOWN";
}
