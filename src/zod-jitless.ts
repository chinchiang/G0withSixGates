import { z } from "zod";

// zod 會先用 Function("") 探測能不能做 JIT；正式站的 CSP 不允許 eval，這一探就會留下違規報告。
// 關掉 JIT，驗證走一般路徑，結果相同。要在任何 schema 建立之前執行，所以 router.tsx 第一個匯入它。
z.config({ jitless: true });
