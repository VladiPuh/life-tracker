const ORIGIN = "https://sculpturesque-unprosperously-darlene.ngrok-free.dev";

export const onRequestGet = async () => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${ORIGIN}/today`, {
      signal: controller.signal,
      headers: {
        "ngrok-skip-browser-warning": "1",
      },
    });

    const text = await res.text();

    return new Response(
      JSON.stringify(
        {
          ok: true,
          status: res.status,
          contentType: res.headers.get("content-type"),
          bodyPreview: text.slice(0, 300),
        },
        null,
        2
      ),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify(
        {
          ok: false,
          error: String(e?.name ?? "Error") + ": " + String(e?.message ?? e),
        },
        null,
        2
      ),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  } finally {
    clearTimeout(t);
  }
};
