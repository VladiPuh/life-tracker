export function FlagButtons({ onSet }: { onSet: (flag: "MIN"|"BONUS"|"SKIP"|"FAIL") => void }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button onClick={() => onSet("MIN")}>MIN</button>
      <button onClick={() => onSet("BONUS")}>BONUS</button>
      <button onClick={() => onSet("SKIP")}>SKIP</button>
      <button onClick={() => onSet("FAIL")}>FAIL</button>
    </div>
  );
}
