type FocusFlag = "MIN" | "BONUS" | "SKIP";

export function FlagButtons({
  onSet,
}: {
  onSet: (flag: FocusFlag) => void;
}) {
  const FLAGS: FocusFlag[] = ["MIN", "BONUS", "SKIP"];

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {FLAGS.map((f) => (
        <button key={f} onClick={() => onSet(f)}>
          {f}
        </button>
      ))}
    </div>
  );
}
