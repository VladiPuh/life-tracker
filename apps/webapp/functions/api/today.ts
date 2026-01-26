export const onRequestGet = async () => {
  const res = await fetch("http://127.0.0.1:8000/today");
  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};
