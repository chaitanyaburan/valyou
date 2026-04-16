"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGetProjects } from "@/lib/api-client";
import type { ProjectStock } from "@/lib/data";
import { mergePostedWithApi, subscribeMarketProjects } from "@/lib/market-projects";

export function useMergedProjects(): ProjectStock[] {
  const [projects, setProjects] = useState<ProjectStock[]>([]);

  const load = useCallback(async () => {
    const api = await apiGetProjects().catch(() => [] as ProjectStock[]);
    setProjects(await mergePostedWithApi(api));
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    const unsub = subscribeMarketProjects(() => {
      void load();
    });
    return () => {
      window.clearTimeout(t);
      unsub();
    };
  }, [load]);

  return projects;
}
