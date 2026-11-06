import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createSystemI18n, type SupportedLocale } from "@calos/i18n";
import { Dialog, Input, type Theme } from "./primitives";
import {
  ProtectedMarkings,
  WorkspaceErrorBoundary,
  type DeploymentKind,
} from "./ProtectedFrame";

export interface FrameNavigationItem {
  id: string;
  label: string;
  href: `#${string}`;
}

/** @req FR-UI-02, P1A-AC-05: static, host-neutral application shell. */
export function AppFrame({
  locale,
  onLocaleChange,
  theme,
  onThemeChange,
  deployment,
  navigation,
  children,
}: {
  locale: SupportedLocale;
  onLocaleChange: (locale: SupportedLocale) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  deployment: DeploymentKind;
  navigation: readonly FrameNavigationItem[];
  children: ReactNode;
}) {
  const i18n = useMemo(() => createSystemI18n(locale), [locale]);
  const t = i18n.format;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(navigation[0]?.id ?? "");
  const appRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const visibleNavigation = navigation.filter((item) =>
    item.label
      .toLocaleLowerCase(locale)
      .includes(query.toLocaleLowerCase(locale)),
  );

  useEffect(() => {
    if (drawerOpen) navRef.current?.querySelector<HTMLElement>("a")?.focus();
  }, [drawerOpen]);
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
    };
    updateOffset();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateOffset);
      return () => {
        window.removeEventListener("resize", updateOffset);
        root.style.removeProperty("--calos-protected-marking-height");
      };
    }
    const observer = new ResizeObserver(updateOffset);
    observer.observe(marking);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--calos-protected-marking-height");
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
      } else if (event.key === "Escape" && drawerOpen) {
        setDrawerOpen(false);
        menuRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  function chooseNavigation(id: string) {
    setActiveId(id);
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
      <a className="frame-skip" href="#content">
        {t("app.skip")}
      </a>
      <ProtectedMarkings locale={locale} deployment={deployment} />
      <div className="frame-layout" inert={paletteOpen}>
        <aside
          className="frame-sidebar"
          data-open={drawerOpen}
          id="frame-navigation"
          ref={navRef}
        >
          <div className="frame-sidebar-brand" aria-hidden="true">
            {t("app.brand")}
          </div>
          <nav aria-label={t("shell.navigation")}>
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
          <header className="frame-topbar">
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
          </header>
          <main
            id="content"
            className="frame-workspace"
            dir={i18n.direction}
            tabIndex={-1}
          >
            <WorkspaceErrorBoundary locale={locale}>
              {children}
            </WorkspaceErrorBoundary>
          </main>
          <footer className="frame-statusbar">
            <span aria-hidden="true">◆</span> {t("shell.localHost")}
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
        <Input
          id="frame-command-query"
          label={t("shell.searchNavigation")}
          value={query}
          onChange={setQuery}
        />
        <nav
          className="frame-command-results"
          aria-label={t("shell.navigation")}
        >
          {visibleNavigation.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={() => chooseNavigation(item.id)}
            >
              {item.label}
            </a>
          ))}
          {visibleNavigation.length === 0 && <p>{t("shell.noCommands")}</p>}
        </nav>
      </Dialog>
    </div>
  );
}
