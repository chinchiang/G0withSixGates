import { z } from "zod";

// zod 會先用 Function("") 探測能不能做 JIT；正式站的 CSP 不允許 eval，這一探就會留下違規報告。
// 關掉 JIT，驗證走一般路徑，結果相同。要在任何 schema 建立之前執行，所以 router.tsx 第一個匯入它。
// zod probes JIT support with Function(""); the production CSP forbids eval, so that probe alone logs a violation.
// Turning JIT off keeps validation on the regular path with identical results. It must run before any schema is
// created, which is why router.tsx imports it first.
z.config({ jitless: true });
