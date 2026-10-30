import "../src/zod-jitless";
import "../src/styles.css";
import { createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { ROUTER_DEFAULTS } from "@/app-route";
import { Route as IndexRoute } from "@/routes/index";

const root = createRootRoute();
const index = createRoute({
  getParentRoute: () => root,
  path: "/",
  validateSearch: IndexRoute.options.validateSearch,
  component: IndexRoute.options.component,
});
const router = createRouter({
  routeTree: root.addChildren([index]),
  basepath: import.meta.env.BASE_URL,
  ...ROUTER_DEFAULTS,
});

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
