const ORIGIN = "https://sculpturesque-unprosperously-darlene.ngrok-free.dev";

export const onRequestGet = async (ctx: any) => {
  const res = await fetch(`${ORIGIN}/today`, {
    headers: {
      "ngrok-skip-browser-warning": "1",
      // пробросим initData дальше (если будет)
      "X-Telegram-Init-Data": ctx.request.headers.get("X-Telegram-Init-Data") ?? "",
    },
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
};
