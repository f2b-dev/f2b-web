/** sandbox /healthz 经 BFF 的容量快照类型（无密钥） */
export type SandboxHealth = {
  ok: boolean;
  service?: string;
  backend?: string;
  auth?: string;
  maxConcurrentSandboxes?: number;
  activeSandboxes?: number;
  capacity?: {
    active: number;
    max: number | null;
    available: number | null;
  };
  reaper?: {
    enabled: boolean;
    intervalMs: number;
  };
};
