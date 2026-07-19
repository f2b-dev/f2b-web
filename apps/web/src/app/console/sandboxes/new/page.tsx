"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LayoutTemplate, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MOCK_TEMPLATES } from "@/lib/mock-data";
import { createSandbox } from "@/lib/sandbox-api";
import { cn } from "@/lib/utils";

const TEMPLATE_MAP: Record<string, string> = {
  tpl_base: "base",
  tpl_code: "code-interpreter",
  tpl_browser: "base",
};

export default function NewSandboxPage() {
  const router = useRouter();
  const [name, setName] = useState(
    "sandbox-" + Math.random().toString(36).slice(2, 7),
  );
  const [template, setTemplate] = useState("tpl_code");
  const [timeoutMin, setTimeoutMin] = useState(30);
  const [internet, setInternet] = useState(false);
  const [region, setRegion] = useState("cn-hangzhou");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => MOCK_TEMPLATES.find((t) => t.id === template),
    [template],
  );

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const sbx = await createSandbox({
        name,
        template: TEMPLATE_MAP[template] ?? "base",
        timeoutMs: timeoutMin * 60_000,
        allowInternetAccess: internet,
        projectId: "default",
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
                  {MOCK_TEMPLATES.map((t) => {
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
                            <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                              {t.image}
                            </div>
                          </div>
                        </div>
                        {t.popular ? (
                          <Badge variant="secondary">常用</Badge>
                        ) : null}
                      </button>
                    );
                  })}
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

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">允许公网访问</div>
                  <div className="text-xs text-muted-foreground">
                    默认关闭；开启后沙箱可访问外网
                  </div>
                </div>
                <Switch checked={internet} onCheckedChange={setInternet} />
              </div>

              <Button
                type="submit"
                disabled={submitting}
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
                {selected?.name ?? template} →{" "}
                <code>{TEMPLATE_MAP[template] ?? "base"}</code>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
