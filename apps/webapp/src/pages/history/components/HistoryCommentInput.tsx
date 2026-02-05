import { useRef } from "react";
import { useAutosizeTextarea } from "../../../shared/ui/useAutosizeTextarea";

export function HistoryCommentInput(props: {
  disabled: boolean;
  value: string | null;
  commentRequired: boolean;
  onChange: (v: string | null) => void;
}) {
  const { disabled, value, commentRequired, onChange } = props;
  const commentRef = useRef<HTMLTextAreaElement | null>(null);
  useAutosizeTextarea(commentRef, value ?? "", { minHeight: 88, maxHeight: 260 });

  const hasComment = (value ?? "").trim().length > 0;
  const needRed = commentRequired && !hasComment;

  return (
    <>
      <div style={{ fontSize: 12, opacity: 0.85 }}>
        Комментарий
        {commentRequired ? (
          <span
            style={{
              marginLeft: 6,
              fontSize: 12,
              fontWeight: 700,
              color: "#d44",
            }}
          >
            обязательно
          </span>
        ) : null}
      </div>

      <textarea
        ref={commentRef}
        disabled={disabled}
        value={value ?? ""}
        placeholder="пусто = без комментария"
        onChange={(e) => {
          const v = e.target.value;
          onChange(v.trim().length ? v : null);
        }}
        rows={2}
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: needRed
            ? "1px solid rgba(212,68,68,0.45)"
            : "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10,
          padding: "9px 11px",
          fontSize: 12,
          background: "rgba(255,255,255,0.06)",
          color: "#eaeaea",
          outline: "none",
          resize: "none",
          opacity: disabled ? 0.7 : 1,

          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          hyphens: "auto",
        }}
      />
    </>
  );
}