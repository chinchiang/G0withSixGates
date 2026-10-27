import { readFileSync } from "node:fs";
import { vercelHeaderRoute } from "./security-headers.mjs";

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
