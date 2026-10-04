import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { parseSearch } from "@/data/model";

export const Route = createFileRoute("/")({ validateSearch: parseSearch, component: AppShell });
