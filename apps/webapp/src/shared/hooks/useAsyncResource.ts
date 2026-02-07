import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
} from "react";

export type AsyncLoader<T> =
  | (() => Promise<T>)
  | ((signal: AbortSignal) => Promise<T>);

type UseAsyncResourceParams<T> = {
  loader: AsyncLoader<T>;
  deps?: DependencyList;
  immediate?: boolean;
  enabled?: boolean;
  initialData?: T | null;
};

function callLoader<T>(loader: AsyncLoader<T>, signal: AbortSignal): Promise<T> {
  if (loader.length > 0) {
    return (loader as (signal: AbortSignal) => Promise<T>)(signal);
  }
  return (loader as () => Promise<T>)();
}

export function useAsyncResource<T>(params: UseAsyncResourceParams<T>) {
  const {
    loader,
    deps = [],
    immediate = true,
    enabled = true,
    initialData = null,
  } = params;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const requestSeqRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const reload = useCallback(async () => {
    const seq = ++requestSeqRef.current;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const next = await callLoader(loaderRef.current, controller.signal);

      if (!mountedRef.current) return;
      if (controller.signal.aborted) return;
      if (requestSeqRef.current !== seq) return;

      setData(next);
    } catch (e) {
      if (!mountedRef.current) return;
      if (controller.signal.aborted) return;
      if (requestSeqRef.current !== seq) return;

      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (!mountedRef.current) return;
      if (requestSeqRef.current !== seq) return;

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!immediate || !enabled) return;

    void reload();

    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, enabled, reload, ...deps]);

  return { data, loading, error, reload };
}
