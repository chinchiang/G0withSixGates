import { readFileSync } from "node:fs";
import {
  vercelHeaderRoute,
  vercelInstallHeaderRoute,
  vercelAssetHeaderRoute,
} from "./security-headers.mjs";

// Vercel applies this generated route before serving files or rendering SSR.
const config = JSON.parse(readFileSync(".vercel/output/config.json", "utf8"));
const expected = vercelHeaderRoute();
const route = config.routes?.[0];
if (route?.src !== expected.src || route?.continue !== true) {
  throw new Error("Missing continuing security-header route in the Vercel build output");
}
for (const [name, value] of Object.entries(expected.headers)) {
  if (route.headers?.[name] !== value) throw new Error(`Incorrect built security header: ${name}`);
}
console.log("Built Vercel security headers verified.");

const install = vercelInstallHeaderRoute(readFileSync("scripts/install-page.html", "utf8"));
if (JSON.stringify(config.routes?.[1]) !== JSON.stringify(install))
  throw new Error("Missing install tutorial hash policy");

if (JSON.stringify(config.routes?.[2]) !== JSON.stringify(vercelAssetHeaderRoute()))
  throw new Error("Missing static asset policy");
if (config.routes?.[0]?.headers?.["Content-Security-Policy"])
  throw new Error("Common edge route must not override the request nonce policy");
