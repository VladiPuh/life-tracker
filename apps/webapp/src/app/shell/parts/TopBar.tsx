export function TopBar(props: { title: string }) {
  return (
    <div
      style={{
        flexShrink: 0,
        paddingTop: "var(--safe-top)",
        height: "calc(var(--safe-top) + var(--topbar-h))",
        display: "flex",
        alignItems: "flex-end",
        paddingLeft: "var(--app-pad)",
        paddingRight: "var(--app-pad)",
        paddingBottom: 8,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: -0.2,
          color: "var(--lt-text)",
          lineHeight: 1.2,
        }}
      >
        {props.title}
      </div>
    </div>
  );
}
