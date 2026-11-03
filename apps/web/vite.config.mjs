import { defineConfig } from "vite";

const environment = process.env.VITE_ENVIRONMENT_KIND ?? "test";
if (environment !== "test" && environment !== "production_rehearsal") {
  throw new Error("UNKNOWN_WEB_DEPLOYMENT_KIND");
}
const environmentLabel =
  environment === "test" ? "TEST" : "PRODUCTION REHEARSAL";

export default defineConfig({
  plugins: [
    {
      name: "calos-static-status",
      transformIndexHtml(html) {
        return html
          .replaceAll("__CALOS_ENVIRONMENT__", environmentLabel)
          .replaceAll(
            "__CALOS_TITLE__",
            `${environmentLabel} · SIMULATION ONLY · CalOS`,
          );
      },
    },
  ],
  build: {
    modulePreload: { polyfill: false },
  },
});
