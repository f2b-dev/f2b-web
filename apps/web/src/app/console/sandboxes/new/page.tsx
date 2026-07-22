"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, LayoutTemplate, Play } from "lucide-react";
import { Badge } from "@f2b/ui";
import { Button } from "@f2b/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@f2b/ui";
import { Input } from "@f2b/ui";
import { Label } from "@f2b/ui";
import { Switch } from "@f2b/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@f2b/ui";
import { Alert, AlertDescription } from "@f2b/ui";
import { createSandbox, DEFAULT_PROJECT_ID } from "@/lib/sandbox-api";
import {
  fetchTemplates,
  type TemplateRef,
} from "@/lib/templates-api";
import { cn } from "@f2b/ui";

export default function NewSandboxPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-muted-foreground">
          加载中…
        </div>
      }
    >
      <NewSandboxForm />
    </Suspense>
  );
}

function NewSandboxForm() {
  const router = useRouter();
  const search = useSearchParams();
  const initialTemplate = search.get("template") || "code-interpreter";
  const [name, setName] = useState(
    "sandbox-" + Math.random().toString(36).slice(2, 7),
  );
  const [templates, setTemplates] = useState<TemplateRef[]>([]);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [template, setTemplate] = useState(initialTemplate);
  const [timeoutMin, setTimeoutMin] = useState(30);
  const [internet, setInternet] = useState(false);
  const [region, setRegion] = useState("cn-hangzhou");
  const [projectId, setProjectId] = useState(DEFAULT_PROJECT_ID);
  const [metaKey, setMetaKey] = useState("");
  const [metaVal, setMetaVal] = useState("");
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchTemplates();
        if (cancelled) return;
        setTemplates(list);
        setTemplatesError(null);
        if (list.length && !list.some((t) => t.id === template)) {
          setTemplate(list[0]!.id);
        }
      } catch (e) {
        if (cancelled) return;
        setTemplatesError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
    // 仅挂载时拉一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => templates.find((t) => t.id === template),
    [templates, template],
  );

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const sbx = await createSandbox({
        name,
        template,
        timeoutMs: timeoutMin * 60_000,
        allowInternetAccess: internet,
        projectId: projectId.trim() || DEFAULT_PROJECT_ID,
        metadata:
          Object.keys(metadata).length > 0 ? metadata : undefined,
      });
      router.push(`/console/sandboxes/${sbx.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">创建沙箱</h1>
          <p className="text-sm text-muted-foreground">
            选择模板与策略。提交后经 BFF 调用 f2b-sandbox。
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/console/sandboxes">
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </Link>
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {templatesError ? (
        <Alert variant="destructive">
          <AlertDescription>
            无法加载模板目录：{templatesError}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>基础配置</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={onCreate}>
              <div className="space-y-2">
                <Label htmlFor="name">名称</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>模板</Label>
                <div className="space-y-2">
                  {templates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {templatesError ? "模板加载失败" : "加载模板…"}
                    </p>
                  ) : (
                    templates.map((t) => {
                      const active = template === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTemplate(t.id)}
                          className={cn(
                            "flex w-full items-start justify-between rounded-md border p-3 text-left transition",
                            active
                              ? "border-brand bg-brand/[0.04]"
                              : "border-border hover:border-brand/40",
                          )}
                        >
                          <div className="flex gap-2">
                            <LayoutTemplate className="mt-0.5 h-4 w-4 text-brand" />
                            <div>
                              <div className="text-sm font-medium">{t.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {t.description}
                              </div>
                              {t.image ? (
                                <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                                  {t.image}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          {t.popular ? (
                            <Badge variant="secondary">常用</Badge>
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timeout">超时（分钟）</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min={1}
                    max={1440}
                    value={timeoutMin}
                    onChange={(e) =>
                      setTimeoutMin(Number(e.target.value) || 30)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>区域</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cn-hangzhou">cn-hangzhou</SelectItem>
                      <SelectItem value="ap-guangzhou">ap-guangzhou</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectId">项目 ID</Label>
                <Input
                  id="projectId"
                  className="font-mono text-sm"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder={DEFAULT_PROJECT_ID}
                />
                <p className="text-xs text-muted-foreground">
                  轻量归属字段，默认{" "}
                  <span className="font-mono">{DEFAULT_PROJECT_ID}</span>
                  ；列表可按此筛选。完整多租户 / RBAC 后置。
                </p>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">允许公网访问</div>
                  <div className="text-xs text-muted-foreground">
                    默认关闭；开启后沙箱可访问外网
                  </div>
                </div>
                <Switch checked={internet} onCheckedChange={setInternet} />
              </div>

              <div className="space-y-2">
                <Label>Metadata（可选）</Label>
                <p className="text-xs text-muted-foreground">
                  键值标签，创建后可在详情页继续合并。
                </p>
                {Object.keys(metadata).length > 0 ? (
                  <ul className="space-y-1 font-mono text-xs">
                    {Object.entries(metadata).map(([k, v]) => (
                      <li
                        key={k}
                        className="flex items-center justify-between gap-2 rounded border px-2 py-1"
                      >
                        <span>
                          <span className="text-muted-foreground">{k}=</span>
                          {v}
                        </span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setMetadata((prev) => {
                              const next = { ...prev };
                              delete next[k];
                              return next;
                            })
                          }
                        >
                          移除
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Input
                    className="w-28"
                    placeholder="key"
                    value={metaKey}
                    onChange={(e) => setMetaKey(e.target.value)}
                  />
                  <Input
                    className="min-w-[8rem] flex-1"
                    placeholder="value"
                    value={metaVal}
                    onChange={(e) => setMetaVal(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const k = metaKey.trim();
                      if (!k) return;
                      setMetadata((prev) => ({ ...prev, [k]: metaVal }));
                      setMetaKey("");
                      setMetaVal("");
                    }}
                  >
                    添加
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || templates.length === 0}
                className="w-full sm:w-auto"
              >
                <Play className="h-4 w-4" />
                {submitting ? "创建中…" : "创建沙箱"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>预览</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>
              名称：<span className="text-foreground">{name}</span>
            </div>
            <div>
              模板：{" "}
              <span className="text-foreground">
                {selected?.name ?? template} → <code>{template}</code>
              </span>
            </div>
            <div>
              超时：
              <span className="text-foreground">{timeoutMin} 分钟</span>
            </div>
            <div>
              网络：
              <span className="text-foreground">
                {internet ? "公网" : "隔离"}
              </span>
            </div>
            <div>
              区域：<span className="text-foreground">{region}</span>
            </div>
            <div>
              项目：
              <span className="font-mono text-foreground">
                {projectId.trim() || DEFAULT_PROJECT_ID}
              </span>
            </div>
            <div>
              Metadata：
              <span className="text-foreground">
                {Object.keys(metadata).length === 0
                  ? "（无）"
                  : Object.entries(metadata)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(", ")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
