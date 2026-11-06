import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  createSystemI18n,
  matchesSearchQuery,
  type SupportedLocale,
} from "@calos/i18n";
import { Dialog, Input, type Theme } from "./primitives";
import { HostStatusBar, HostSummaryChip } from "./HostStatusView";
import type { HostStatusView } from "./host-status";
import {
  ProtectedMarkings,
  WorkspaceErrorBoundary,
  type DeploymentKind,
} from "./ProtectedFrame";

export interface FrameNavigationItem {
  id: string;
  label: string;
  href: `#/${string}`;
  keywords?: readonly string[];
}

/** @req FR-UI-02, P1A-AC-05: static, host-neutral application shell. */
export function AppFrame({
  locale,
  onLocaleChange,
  theme,
  onThemeChange,
  deployment,
  navigation,
  activeId,
  skipHref,
  onSkipToContent,
  hostStatus,
  onSameRoute,
  children,
}: {
  locale: SupportedLocale;
  onLocaleChange: (locale: SupportedLocale) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  deployment: DeploymentKind;
  navigation: readonly FrameNavigationItem[];
  activeId: string | undefined;
  skipHref: string;
  onSkipToContent?: () => void;
  hostStatus?: HostStatusView;
  onSameRoute?: () => void;
  children: ReactNode;
}) {
  const i18n = useMemo(() => createSystemI18n(locale), [locale]);
  const t = i18n.format;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const appRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const firstResultRef = useRef<HTMLAnchorElement>(null);
  const visibleNavigation = navigation.filter(
    (item) =>
      matchesSearchQuery(item.label, query) ||
      item.keywords?.some((keyword) => matchesSearchQuery(keyword, query)),
  );

  useEffect(() => {
    if (drawerOpen) navRef.current?.querySelector<HTMLElement>("a")?.focus();
  }, [drawerOpen]);
  useEffect(() => {
    setDrawerOpen(false);
    setPaletteOpen(false);
    setQuery("");
  }, [activeId]);
  useEffect(() => {
    // A fast Back/Forward can return to the same activeId before React renders
    // the intervening route. History events must still close transient UI.
    const onNavigation = () => {
      setDrawerOpen(false);
      setPaletteOpen(false);
      setQuery("");
    };
    window.addEventListener("hashchange", onNavigation);
    window.addEventListener("popstate", onNavigation);
    return () => {
      window.removeEventListener("hashchange", onNavigation);
      window.removeEventListener("popstate", onNavigation);
    };
  }, []);
  useEffect(() => {
    const marking = appRef.current?.querySelector<HTMLElement>(
      "[data-frame-badges]",
    );
    if (!marking) return;
    const root = document.documentElement;
    const updateOffset = () => {
      root.style.setProperty(
        "--calos-protected-marking-height",
        `${Math.ceil(marking.getBoundingClientRect().height)}px`,
      );
      if (footerRef.current)
        root.style.setProperty(
          "--calos-statusbar-height",
          `${Math.ceil(footerRef.current.getBoundingClientRect().height)}px`,
        );
    };
    updateOffset();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateOffset);
      return () => {
        window.removeEventListener("resize", updateOffset);
        root.style.removeProperty("--calos-protected-marking-height");
        root.style.removeProperty("--calos-statusbar-height");
      };
    }
    const observer = new ResizeObserver(updateOffset);
    observer.observe(marking);
    if (footerRef.current) observer.observe(footerRef.current);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--calos-protected-marking-height");
      root.style.removeProperty("--calos-statusbar-height");
    };
  }, [locale]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key.toLowerCase() === "k" || event.code === "KeyK")
      ) {
        event.preventDefault();
        setPaletteOpen(true);
      } else if (
        event.key === "F6" &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        !event.defaultPrevented &&
        !event.isComposing &&
        !paletteOpen
      ) {
        const regions = Array.from(
          appRef.current?.querySelectorAll<HTMLElement>(
            "[data-frame-region]",
          ) ?? [],
        ).filter((region) => {
          // checkVisibility is unavailable in jsdom; computed display is the fallback.
          if (region.checkVisibility) return region.checkVisibility();
          return (
            getComputedStyle(region).display !== "none" &&
            getComputedStyle(region.parentElement ?? region).display !== "none"
          );
        });
        if (regions.length === 0) return;
        const current = regions.findIndex(
          (region) =>
            region === document.activeElement ||
            region.contains(document.activeElement),
        );
        const next =
          current < 0
            ? event.shiftKey
              ? regions.length - 1
              : 0
            : (current + (event.shiftKey ? -1 : 1) + regions.length) %
              regions.length;
        event.preventDefault();
        regions[next]?.focus();
      } else if (event.key === "Escape" && drawerOpen) {
        setDrawerOpen(false);
        menuRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, paletteOpen]);

  function chooseNavigation(id: string) {
    if (id === activeId) onSameRoute?.();
    setDrawerOpen(false);
    setPaletteOpen(false);
    setQuery("");
  }

  return (
    <div
      ref={appRef}
      className="calos-app"
      data-theme={theme}
      lang={locale}
      dir={i18n.direction}
    >
      <nav aria-label={t("shell.skipNavigation")}>
        <a
          className="frame-skip"
          href={skipHref}
          onClick={(event) => {
            event.preventDefault();
            onSkipToContent?.();
            appRef.current?.querySelector<HTMLElement>("main#content")?.focus();
          }}
        >
          {t("app.skip")}
        </a>
      </nav>
      <ProtectedMarkings locale={locale} deployment={deployment} />
      <div className="frame-layout" inert={paletteOpen}>
        <aside
          className="frame-sidebar"
          data-open={drawerOpen}
          id="frame-navigation"
        >
          <div className="frame-sidebar-brand" aria-hidden="true">
            {t("app.brand")}
          </div>
          <nav
            ref={navRef}
            data-frame-region="navigation"
            tabIndex={-1}
            aria-label={t("shell.navigation")}
          >
            {navigation.map((item) => (
              <a
                key={item.id}
                href={item.href}
                aria-current={activeId === item.id ? "page" : undefined}
                onClick={() => chooseNavigation(item.id)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <p className="frame-sidebar-note">
            {deployment === "test"
              ? t("shell.testNotice")
              : t("shell.rehearsalNotice")}
          </p>
        </aside>
        <div className="frame-main-column">
          <header
            className="frame-topbar"
            data-frame-region="topbar"
            tabIndex={-1}
            aria-label={t("shell.regionTopbar")}
          >
            <button
              ref={menuRef}
              type="button"
              className="frame-menu-button"
              aria-label={
                drawerOpen
                  ? t("shell.closeNavigation")
                  : t("shell.openNavigation")
              }
              aria-controls="frame-navigation"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((value) => !value)}
            >
              <span aria-hidden="true">☰</span>
            </button>
            <div className="frame-title">
              <span className="frame-brand">{t("app.brand")}</span>
              <span className="frame-title-caption">
                {t("shell.workspace")}
              </span>
            </div>
            <HostSummaryChip
              status={hostStatus}
              deployment={deployment}
              locale={locale}
            />
            <div className="frame-tools">
              <button
                type="button"
                className="frame-command"
                onClick={() => setPaletteOpen(true)}
              >
                <span aria-hidden="true">⌕</span>
                <span>{t("shell.command")}</span>
                <kbd>{t("shell.shortcut")}</kbd>
              </button>
              <button
                type="button"
                className="frame-settings-button"
                aria-label={t("shell.settings")}
                aria-controls="frame-settings-controls"
                aria-expanded={settingsOpen}
                onClick={() => setSettingsOpen((value) => !value)}
              >
                <span aria-hidden="true">⚙</span>
              </button>
              <div
                id="frame-settings-controls"
                className="frame-settings-controls"
                data-open={settingsOpen}
              >
                <label className="frame-tool">
                  {t("app.language")}
                  <select
                    id="language"
                    lang={locale}
                    dir={i18n.direction}
                    value={locale}
                    onChange={(event) => {
                      const next = event.currentTarget.value;
                      if (
                        next === "en" ||
                        next === "he" ||
                        (deployment === "test" &&
                          (next === "en-XA" || next === "he-XB"))
                      )
                        onLocaleChange(next);
                    }}
                  >
                    <option value="en">{t("app.english")}</option>
                    <option value="he">{t("app.hebrew")}</option>
                    {deployment === "test" && (
                      <>
                        <option value="en-XA">{t("app.pseudoEnglish")}</option>
                        <option value="he-XB">{t("app.pseudoHebrew")}</option>
                      </>
                    )}
                  </select>
                </label>
                <label className="frame-tool">
                  {t("shell.theme")}
                  <select
                    id="theme"
                    value={theme}
                    onChange={(event) => {
                      if (
                        event.currentTarget.value === "light" ||
                        event.currentTarget.value === "dark"
                      )
                        onThemeChange(event.currentTarget.value);
                    }}
                  >
                    <option value="light">{t("shell.light")}</option>
                    <option value="dark">{t("shell.dark")}</option>
                  </select>
                </label>
              </div>
            </div>
          </header>
          <main
            id="content"
            className="frame-workspace"
            dir={i18n.direction}
            tabIndex={-1}
            data-frame-region="workspace"
            aria-label={t("shell.regionWorkspace")}
            onFocusCapture={(event) => {
              const marking = appRef.current?.querySelector<HTMLElement>(
                "[data-frame-badges]",
              );
              if (!marking || event.target === event.currentTarget) return;
              const gap =
                marking.getBoundingClientRect().bottom -
                event.target.getBoundingClientRect().top +
                8;
              if (gap > 0) window.scrollBy(0, Math.ceil(gap));
            }}
          >
            <WorkspaceErrorBoundary key={activeId ?? "unknown"} locale={locale}>
              {children}
            </WorkspaceErrorBoundary>
          </main>
          <footer
            ref={footerRef}
            className="frame-statusbar"
            data-frame-region="statusbar"
            tabIndex={-1}
            aria-label={t("shell.regionStatus")}
          >
            <HostStatusBar
              status={hostStatus}
              deployment={deployment}
              locale={locale}
            />
          </footer>
        </div>
      </div>
      <Dialog
        open={paletteOpen}
        title={t("shell.command")}
        closeLabel={t("shell.closeCommand")}
        onClose={() => {
          setPaletteOpen(false);
          setQuery("");
        }}
      >
        <div
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              event.target instanceof HTMLInputElement
            )
              firstResultRef.current?.click();
          }}
        >
          <Input
            id="frame-command-query"
            label={t("shell.searchNavigation")}
            value={query}
            onChange={setQuery}
          />
          <p className="frame-palette-hint">{t("shell.f6Hint")}</p>
          <p role="status" aria-live="polite">
            {t("shell.searchResults", { count: visibleNavigation.length })}
          </p>
          <nav
            className="frame-command-results"
            aria-label={t("shell.navigation")}
          >
            {visibleNavigation.map((item) => (
              <a
                key={item.id}
                ref={item === visibleNavigation[0] ? firstResultRef : undefined}
                href={item.href}
                onClick={() => chooseNavigation(item.id)}
              >
                {item.label}
              </a>
            ))}
            {visibleNavigation.length === 0 && <p>{t("shell.noCommands")}</p>}
          </nav>
        </div>
      </Dialog>
    </div>
  );
}
