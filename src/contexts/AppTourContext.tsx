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

/** Matches Tailwind `lg` — bottom bar visible, desktop link row hidden. */
function isCompactTourViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1023px)").matches;
}

function getTourStepDefinitions(compact: boolean): StepDef[] {
  const welcome: StepDef = {
    popover: {
      title: "Welcome to Valyou",
      description: compact
        ? "Short tour for small screens: bottom tabs, search (wallet lives there on phones), then the feed. Use Next or tap outside to exit."
        : "Valyou is where you discover builder-led projects, trade simulated shares, back startups, and verify talent. Use Next or Done to move through.",
      side: "over",
      align: "center",
    },
  };

  const brand: StepDef = {
    selector: '[data-tour="brand"]',
    popover: {
      title: compact ? "Home" : "Home & identity",
      description: compact
        ? "Tap Valyou anytime to return to your home feed."
        : "Tap the Valyou mark anytime to return to your personalized home feed and market snapshot.",
      side: "bottom",
      align: "start",
    },
  };

  const bottomNav: StepDef = {
    selector: '[data-tour="bottom-nav"]',
    popover: {
      title: compact ? "Bottom navigation" : "Mobile navigation",
      description: compact
        ? "Home, Market, Discover, Portfolio, and Profile—the fastest way to move around on a phone (replaces the desktop link row)."
        : "On small screens, use this bar for Home, Market, Discover, Portfolio, and Profile—same destinations as the top nav.",
      side: "top",
      align: "center",
    },
  };

  const mobileSearch: StepDef = {
    selector: '[data-tour="mobile-search"]',
    popover: {
      title: "Search & balances",
      description:
        "Tap the magnifying glass to open the drawer: search projects or creators, and see your Pera + app wallet. Use Manage there to jump to the full Wallet page.",
      side: "bottom",
      align: "end",
    },
  };

  const ticker: StepDef = {
    selector: '[data-tour="ticker"]',
    popover: {
      title: "Live prices",
      description: compact
        ? "Scrolling prices and daily moves for projects—including ones you have posted."
        : "A quick scroll of project prices and daily moves—merged with anything you have posted from Post Project.",
      side: "bottom",
      align: "start",
    },
  };

  const navDesktop: StepDef = {
    selector: '[data-tour="nav-desktop"]',
    popover: {
      title: "Main navigation",
      description:
        "Market lists tradeable projects, Discover highlights creators, Portfolio tracks holdings, Wallet opens funding balance, and Startups is crowdfunding-style raises.",
      side: "bottom",
      align: "start",
    },
  };

  const navSearch: StepDef = {
    selector: '[data-tour="nav-search"]',
    popover: {
      title: compact ? "Search (tablet+)" : "Search",
      description: compact
        ? "From tablet widths and up, search lives in the header. On phones you use the search icon instead."
        : "Search projects and creators (results wiring can extend here as the catalog grows).",
      side: "bottom",
      align: "center",
    },
  };

  const wallet: StepDef = {
    selector: '[data-tour="wallet"]',
    popover: {
      title: "Balances",
      description: compact
        ? "Pera testnet ALGO plus your in-app wallet strip (visible on wider phones and tablets). On small phones, open it from the search drawer."
        : "See Pera testnet ALGO plus your in-app wallet. Use Manage to open the wallet page for Razorpay top-ups and activity.",
      side: "bottom",
      align: "end",
    },
  };

  const postProject: StepDef = {
    selector: '[data-tour="post-project"]',
    popover: {
      title: compact ? "Post a project" : "List a project",
      description: compact
        ? "Tap + to publish milestones and raises—your listing appears on Discover and Market when it is live."
        : "Founders publish milestones, proofs, and raise targets—your listing joins Discover and Market once live.",
      side: "bottom",
      align: "end",
    },
  };

  const homeHero: StepDef = {
    selector: '[data-tour="home-hero"]',
    popover: {
      title: "Today on Valyou",
      description: compact
        ? "Key stats and shortcuts into Market and Discover. Sign in to personalize the feed."
        : "Headline stats and shortcuts into Market and Discover. When you are signed in, the feed and wallet reflect your session.",
      side: "bottom",
      align: "start",
    },
  };

  const homeFeed: StepDef = {
    selector: '[data-tour="home-feed"]',
    popover: {
      title: "Stories & feed",
      description: compact
        ? "Scroll stories and project cards—invest, like, or comment. Pending trades show in a yellow banner; open Portfolio for holdings."
        : "Stories preview builder updates; the project feed supports likes, comments, and invest flows. Pending trades surface in banners and the desktop trade sidebar.",
      side: "top",
      align: "start",
    },
  };

  if (compact) {
    return [
      welcome,
      brand,
      bottomNav,
      mobileSearch,
      ticker,
      postProject,
      navSearch,
      wallet,
      homeHero,
      homeFeed,
    ];
  }

  return [welcome, brand, navDesktop, navSearch, ticker, wallet, postProject, bottomNav, homeHero, homeFeed];
}

function defsToSteps(defs: StepDef[]): DriveStep[] {
  return defs.map((d) => ({
    element: d.selector,
    popover: d.popover,
  }));
}

function isTourTargetVisible(selector: string): boolean {
  const el = document.querySelector(selector);
  if (!el || !(el instanceof Element)) return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = el.getBoundingClientRect();
  return rect.width >= 2 && rect.height >= 2;
}

function filterStepsForDom(steps: DriveStep[]): DriveStep[] {
  return steps.filter((step) => {
    if (step.element == null) return true;
    if (typeof step.element !== "string") return true;
    return isTourTargetVisible(step.element);
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
    const compact = isCompactTourViewport();
    const base = defsToSteps(getTourStepDefinitions(compact));
    const steps = filterStepsForDom(base);
    if (steps.length === 0) return;

    const d = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      smoothScroll: true,
      animate: true,
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      allowClose: true,
      overlayClickBehavior: "close",
      overlayOpacity: 0.82,
      overlayColor: "#030712",
      popoverClass: "valyou-driver-popover",
      stageRadius: compact ? 12 : 10,
      stagePadding: compact ? 10 : 6,
      popoverOffset: compact ? 14 : 10,
      steps,
      // driver.js calls onDestroyStarted from g(true), then returns without cleanup unless
      // we finish teardown. Always call destroy() so Close / Done / overlay actually dismiss.
      onDestroyStarted: (_el, _step, { driver: drv }) => {
        try {
          if (drv.isLastStep()) {
            window.localStorage.setItem(APP_TOUR_STATUS_KEY, "completed");
          } else {
            const prev = window.localStorage.getItem(APP_TOUR_STATUS_KEY);
            if (prev !== "completed") {
              window.localStorage.setItem(APP_TOUR_STATUS_KEY, "dismissed");
            }
          }
        } catch {
          /* noop */
        }
        drv.destroy();
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
