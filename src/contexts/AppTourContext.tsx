"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import {
  APP_TOUR_RISK_ACCEPTED_EVENT,
  APP_TOUR_STATUS_KEY,
  RISK_DISCLOSURE_ACCEPTED_KEY,
} from "@/lib/app-tour";

type AppTourContextValue = {
  /** Start or restart the guided tour (replay always allowed). */
  startTour: () => void;
};

const AppTourContext = createContext<AppTourContextValue | null>(null);

type StepDef = {
  selector?: string;
  popover: {
    title: string;
    description: string;
    side?: "top" | "right" | "bottom" | "left" | "over";
    align?: "start" | "center" | "end";
  };
};

const STEP_DEFS: StepDef[] = [
  {
    popover: {
      title: "Welcome to Valyou",
      description:
        "Valyou is where you discover builder-led projects, trade simulated shares, back startups, and verify talent. This tour takes about a minute—use Next or Done to move through.",
      side: "over",
      align: "center",
    },
  },
  {
    selector: '[data-tour="brand"]',
    popover: {
      title: "Home & identity",
      description: "Tap the Valyou mark anytime to return to your personalized home feed and market snapshot.",
      side: "bottom",
      align: "start",
    },
  },
  {
    selector: '[data-tour="nav-desktop"]',
    popover: {
      title: "Main navigation",
      description:
        "Market lists tradeable projects, Discover highlights creators, Portfolio tracks holdings, Wallet tops up balance, and Startups opens crowdfunding-style raises.",
      side: "bottom",
      align: "start",
    },
  },
  {
    selector: '[data-tour="nav-search"]',
    popover: {
      title: "Search",
      description: "Search projects and creators (results wiring can extend here as the catalog grows).",
      side: "bottom",
      align: "center",
    },
  },
  {
    selector: '[data-tour="ticker"]',
    popover: {
      title: "Live prices",
      description: "A quick scroll of project prices and daily moves—merged with anything you have posted from Post Project.",
      side: "bottom",
      align: "start",
    },
  },
  {
    selector: '[data-tour="wallet"]',
    popover: {
      title: "Balances",
      description:
        "See Pera testnet ALGO plus your in-app wallet. Use Manage to open the wallet page for Razorpay top-ups and activity.",
      side: "bottom",
      align: "end",
    },
  },
  {
    selector: '[data-tour="post-project"]',
    popover: {
      title: "List a project",
      description: "Founders publish milestones, proofs, and raise targets—your listing joins Discover and Market once live.",
      side: "bottom",
      align: "end",
    },
  },
  {
    selector: '[data-tour="bottom-nav"]',
    popover: {
      title: "Mobile navigation",
      description: "On small screens, use this bar for Home, Market, Discover, Portfolio, and Profile—same destinations as the top nav.",
      side: "top",
      align: "center",
    },
  },
  {
    selector: '[data-tour="home-hero"]',
    popover: {
      title: "Today on Valyou",
      description: "Headline stats and shortcuts into Market and Discover. When you are signed in, the feed and wallet reflect your session.",
      side: "bottom",
      align: "start",
    },
  },
  {
    selector: '[data-tour="home-feed"]',
    popover: {
      title: "Stories & feed",
      description:
        "Stories preview builder updates; the project feed supports likes, comments, and invest flows. Pending trades surface in banners and the desktop trade sidebar.",
      side: "top",
      align: "start",
    },
  },
];

function defsToSteps(defs: StepDef[]): DriveStep[] {
  return defs.map((d) => ({
    element: d.selector,
    popover: d.popover,
  }));
}

function filterStepsForDom(steps: DriveStep[]): DriveStep[] {
  return steps.filter((step) => {
    if (step.element == null) return true;
    if (typeof step.element !== "string") return true;
    return document.querySelector(step.element) != null;
  });
}

export function AppTourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const autoStartTimerRef = useRef<number | null>(null);

  const destroyTour = useCallback(() => {
    try {
      driverRef.current?.destroy();
    } catch {
      /* noop */
    }
    driverRef.current = null;
  }, []);

  const startTour = useCallback(() => {
    destroyTour();
    const base = defsToSteps(STEP_DEFS);
    const steps = filterStepsForDom(base);
    if (steps.length === 0) return;

    const d = driver({
      showProgress: true,
      smoothScroll: true,
      animate: true,
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      allowClose: true,
      overlayOpacity: 0.82,
      overlayColor: "#030712",
      popoverClass: "valyou-driver-popover",
      stageRadius: 10,
      stagePadding: 6,
      steps,
      onDestroyStarted: (_el, _step, { driver: drv }) => {
        try {
          if (drv.isLastStep()) {
            window.localStorage.setItem(APP_TOUR_STATUS_KEY, "completed");
            return;
          }
          const prev = window.localStorage.getItem(APP_TOUR_STATUS_KEY);
          if (prev !== "completed") {
            window.localStorage.setItem(APP_TOUR_STATUS_KEY, "dismissed");
          }
        } catch {
          /* noop */
        }
      },
    });
    driverRef.current = d;
    d.drive();
  }, [destroyTour]);

  useEffect(() => {
    return () => destroyTour();
  }, [pathname, destroyTour]);

  useEffect(() => {
    let cancelled = false;

    const maybeAutoStart = () => {
      try {
        if (window.localStorage.getItem(APP_TOUR_STATUS_KEY)) return;
        if (window.localStorage.getItem(RISK_DISCLOSURE_ACCEPTED_KEY) !== "1") return;
        if (pathnameRef.current !== "/") return;
      } catch {
        return;
      }
      if (autoStartTimerRef.current != null) window.clearTimeout(autoStartTimerRef.current);
      autoStartTimerRef.current = window.setTimeout(() => {
        autoStartTimerRef.current = null;
        if (cancelled) return;
        if (pathnameRef.current !== "/") return;
        startTour();
      }, 700);
    };

    window.addEventListener(APP_TOUR_RISK_ACCEPTED_EVENT, maybeAutoStart);
    return () => {
      cancelled = true;
      window.removeEventListener(APP_TOUR_RISK_ACCEPTED_EVENT, maybeAutoStart);
      if (autoStartTimerRef.current) {
        window.clearTimeout(autoStartTimerRef.current);
        autoStartTimerRef.current = null;
      }
    };
  }, [pathname, startTour]);

  const value = useMemo<AppTourContextValue>(
    () => ({
      startTour,
    }),
    [startTour],
  );

  return <AppTourContext.Provider value={value}>{children}</AppTourContext.Provider>;
}

export function useAppTour() {
  const ctx = useContext(AppTourContext);
  if (!ctx) {
    throw new Error("useAppTour must be used within AppTourProvider");
  }
  return ctx;
}
