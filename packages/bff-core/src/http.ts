/** 通用 JSON 错误（BFF 层；领域错误由上游 f2b-sandbox 返回） */

export function jsonError(err: unknown, status = 500) {
  const message = err instanceof Error ? err.message : String(err);
  return Response.json(
    { error: { code: "INTERNAL", message } },
    { status },
  );
}
