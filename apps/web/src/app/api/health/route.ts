import { proxyToSandbox } from "@f2b/bff-core";

/** 透传 sandbox /healthz（容量/reaper；不含密钥） */
export async function GET() {
  return proxyToSandbox("/healthz", { method: "GET" });
}
