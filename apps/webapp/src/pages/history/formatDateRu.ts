export function formatDateRu(dateIso: string) {
  const d = new Date(dateIso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
}
