import Link from "next/link";
import { LayoutTemplate, Play, Upload } from "lucide-react";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@f2b/ui";
import { proxyToSandbox } from "@f2b/bff-core";
import type { TemplateRef } from "@/lib/templates-api";
import { ConsoleEmpty } from "@/components/console-empty";

export const dynamic = "force-dynamic";

async function loadTemplates(): Promise<{
  templates: TemplateRef[];
  error: string | null;
}> {
  try {
    const res = await proxyToSandbox("/v1/templates", { method: "GET" });
    const data = (await res.json()) as {
      templates?: TemplateRef[];
      error?: { message?: string };
    };
    if (!res.ok) {
      return {
        templates: [],
        error: data.error?.message || `upstream ${res.status}`,
      };
    }
    return { templates: data.templates ?? [], error: null };
  } catch (e) {
    return {
      templates: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export default async function TemplatesPage() {
  const { templates, error } = await loadTemplates();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">模板</h1>
          <p className="text-sm text-muted-foreground">
            预置运行时目录（来自{" "}
            <code className="text-xs">GET /v1/templates</code>
            ）。创建沙箱时选择 template。
          </p>
        </div>
        <Button variant="secondary" disabled>
          <Upload className="h-4 w-4" />
          构建自定义模板
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>无法加载模板：{error}</AlertDescription>
        </Alert>
      ) : null}

      {templates.length === 0 && !error ? (
        <Card>
          <CardContent className="p-0">
            <ConsoleEmpty
              icon={LayoutTemplate}
              title="暂无模板"
              description="上游 GET /v1/templates 未返回预置项。请确认 f2b-sandbox 已启动。"
              action={
                <Button asChild size="sm">
                  <Link href="/console/sandboxes/new">仍去创建沙箱</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4 text-brand" />
                  {t.name}
                </CardTitle>
                {t.popular ? (
                  <Badge variant="warning">常用</Badge>
                ) : t.id === "browser" ? (
                  <Badge variant="secondary">预览</Badge>
                ) : (
                  <Badge variant="secondary">预置</Badge>
                )}
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <p className="min-h-[44px] text-sm text-muted-foreground">
                  {t.description}
                </p>
                {t.image ? (
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {t.image}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-1.5">
                  {(t.tags ?? []).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="link" className="h-auto px-0">
                  <Link
                    href={`/console/sandboxes/new?template=${encodeURIComponent(t.id)}`}
                  >
                    <Play className="h-4 w-4" />
                    使用此模板
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
