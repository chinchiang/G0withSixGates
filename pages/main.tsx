import "../src/zod-jitless";
import "../src/styles.css";
import { createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { AppShell } from "@/components/shell";
import { parseSearch } from "@/data/model";
import { AppErrorComponent } from "@/lib/error-component";
import { AppNotFoundComponent } from "@/lib/not-found-component";

const root = createRootRoute();
const index = createRoute({
  getParentRoute: () => root,
  path: "/",
  validateSearch: parseSearch,
  component: AppShell,
});
const router = createRouter({
  routeTree: root.addChildren([index]),
  basepath: import.meta.env.BASE_URL,
  defaultErrorComponent: AppErrorComponent,
  defaultNotFoundComponent: AppNotFoundComponent,
});

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
