import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  createSystemI18n,
  messageReviewStatus,
  type SupportedLocale,
} from "@calos/i18n";
import {
  AppFrame,
  Badge,
  Button,
  Card,
  Notification,
  PageHeader,
  hostStatusSeverity,
  type Theme,
} from "@calos/ui-kit";
import { SyntheticFormDemo } from "./SyntheticFormDemo";
import { SyntheticDataViewsDemo } from "./SyntheticDataViewsDemo";
import { useHashRoute } from "./router";
import { buildRoutes } from "./routes";
import {
  createFakeHostStatusPort,
  createUnavailableHostStatusPort,
  useHostStatus,
} from "./host/host-status-port";
import {
  SyntheticHostStatusDemo,
  hostPresetStatus,
  type HostPreset,
} from "./SyntheticHostStatusDemo";

const environmentKind =
  import.meta.env.VITE_ENVIRONMENT_KIND === "production_rehearsal"
    ? "production_rehearsal"
    : "test";
const routes = buildRoutes(environmentKind);
const ids = new Set(routes.map((route) => route.id));
const platformIdentifier = "CALOS-UI";
const technicalUnitSymbol = "Ω";

/** @req FR-UI-02, OF-02, P1A-AC-05: Route-scoped simulation-only shell. */
export function App({ workspace }: { workspace?: ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>("en");
  const [theme, setTheme] = useState<Theme>("light");
  const [sampleCount, setSampleCount] = useState(2);
  const [hostPreset, setHostPreset] = useState<HostPreset>("unknown");
  const hostPort = useMemo(
    () =>
      environmentKind === "test"
        ? createFakeHostStatusPort()
        : createUnavailableHostStatusPort(),
    [],
  );
  const hostStatus = useHostStatus(hostPort);
  const i18n = useMemo(() => createSystemI18n(locale), [locale]);
  const t = i18n.format;
  const route = useHashRoute(ids);
  const activeId = route.kind === "route" ? route.id : undefined;
  const currentRoute = routes.find((item) => item.id === activeId);
  const title = t(currentRoute?.titleKey ?? "route.notFound");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousRoute = useRef<string | null>(null);
  const routeFocusFrame = useRef<number | null>(null);
  const skipFocusHash = useRef<string | null>(null);

  useEffect(() => {
    // History traversal still needs heading focus when two rapid transitions
    // collapse to the same rendered route id.
    const onNavigation = () => {
      // A delayed notification for the route whose skip link was activated
      // must not take focus back from main.
      if (skipFocusHash.current === window.location.hash) return;
      skipFocusHash.current = null;
      if (routeFocusFrame.current !== null)
        window.cancelAnimationFrame(routeFocusFrame.current);
      routeFocusFrame.current = window.requestAnimationFrame(() => {
        headingRef.current?.focus();
        window.scrollTo(0, 0);
        routeFocusFrame.current = null;
      });
    };
    window.addEventListener("hashchange", onNavigation);
    window.addEventListener("popstate", onNavigation);
    return () => {
      window.removeEventListener("hashchange", onNavigation);
      window.removeEventListener("popstate", onNavigation);
      if (routeFocusFrame.current !== null)
        window.cancelAnimationFrame(routeFocusFrame.current);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = i18n.direction;
    document.title = `${environmentKind === "test" ? "TEST" : "PRODUCTION REHEARSAL"} · SIMULATION ONLY · ${title} · ${t("app.title")}`;
  }, [i18n.direction, locale, t, title]);

  useEffect(() => {
    const routeId = activeId ?? "not-found";
    if (previousRoute.current !== null && previousRoute.current !== routeId) {
      window.scrollTo(0, 0);
      setSampleCount(2);
    }
    previousRoute.current = routeId;
  }, [activeId]);

  const navigation = routes.map((item) => ({
    id: item.id,
    href: item.href,
    label: t(item.titleKey),
  }));

  return (
    <AppFrame
      locale={locale}
      onLocaleChange={setLocale}
      theme={theme}
      onThemeChange={setTheme}
      deployment={environmentKind}
      navigation={navigation}
      activeId={activeId}
      skipHref={window.location.hash || "#/overview"}
      onSkipToContent={() => {
        skipFocusHash.current = window.location.hash;
        if (routeFocusFrame.current !== null) {
          window.cancelAnimationFrame(routeFocusFrame.current);
          routeFocusFrame.current = null;
        }
      }}
      hostStatus={hostStatus}
      onSameRoute={() => {
        headingRef.current?.focus();
        window.scrollTo(0, 0);
      }}
    >
      {workspace ?? (
        <>
          <PageHeader
            ref={headingRef}
            title={title}
            eyebrow={t("shell.workspace")}
          />
          <Badge tone="simulation">{t("mode.simulation")}</Badge>
          {hostStatusSeverity(hostStatus, environmentKind) === "error" && (
            <Notification tone="error">
              {hostStatus?.environmentKind !== environmentKind
                ? t("host.mismatch.body")
                : t("host.summary.error")}
            </Notification>
          )}
          {route.kind === "unknown" && (
            <>
              <Notification tone="info">{t("route.notFoundBody")}</Notification>
              <a href="#/overview">{t("route.notFoundLink")}</a>
            </>
          )}
          {activeId === "overview" && (
            <Notification tone="info">{t("app.description")}</Notification>
          )}
          {activeId === "technical" && (
            <Card title={t("app.technical")}>
              <dl className="technical-list">
                <dt>{t("app.identifier")}</dt>
                <dd>
                  <bdi dir="ltr">{platformIdentifier}</bdi>
                </dd>
                <dt>{t("app.kind")}</dt>
                <dd>
                  <bdi dir="ltr">{environmentKind}</bdi>
                </dd>
                <dt>{t("app.unit")}</dt>
                <dd>
                  <bdi dir="ltr">{technicalUnitSymbol}</bdi>
                </dd>
              </dl>
              <div className="count-control">
                <Button
                  ariaLabel={t("app.decrease")}
                  disabled={sampleCount === 0}
                  onClick={() =>
                    setSampleCount((count) => Math.max(0, count - 1))
                  }
                >
                  −
                </Button>
                <output aria-live="polite">
                  {t("app.count", { count: sampleCount })}
                </output>
                <Button
                  ariaLabel={t("app.increase")}
                  onClick={() => setSampleCount((count) => count + 1)}
                >
                  +
                </Button>
              </div>
            </Card>
          )}
          {environmentKind === "test" && activeId === "forms" && (
            <SyntheticFormDemo locale={locale} />
          )}
          {environmentKind === "test" && activeId === "data" && (
            <SyntheticDataViewsDemo locale={locale} />
          )}
          {environmentKind === "test" && activeId === "host" && (
            <SyntheticHostStatusDemo
              locale={locale}
              preset={hostPreset}
              onPresetChange={(next) => {
                setHostPreset(next);
                const status = hostPresetStatus(next);
                if (
                  status &&
                  "set" in hostPort &&
                  typeof hostPort.set === "function"
                )
                  hostPort.set(status);
                else if (
                  "clear" in hostPort &&
                  typeof hostPort.clear === "function"
                )
                  hostPort.clear();
              }}
            />
          )}
          {messageReviewStatus(locale, "app.title") === "needs_review" && (
            <p className="review-note">{t("app.review")}</p>
          )}
        </>
      )}
    </AppFrame>
  );
}
