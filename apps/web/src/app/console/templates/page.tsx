import Link from "next/link";
import { LayoutTemplate, Play, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_TEMPLATES } from "@/lib/mock-data";

export default function TemplatesPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">模板</h1>
          <p className="text-sm text-muted-foreground">
            预置与自定义运行时镜像。创建沙箱时选择模板以固定环境。
          </p>
        </div>
        <Button variant="secondary" disabled>
          <Upload className="h-4 w-4" />
          构建自定义模板
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MOCK_TEMPLATES.map((t) => (
          <Card key={t.id} className="flex flex-col">
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-brand" />
                {t.name}
              </CardTitle>
              {t.popular ? (
                <Badge variant="warning">常用</Badge>
              ) : (
                <Badge variant="secondary">预览</Badge>
              )}
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <p className="min-h-[44px] text-sm text-muted-foreground">{t.description}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{t.image}</p>
              <div className="flex flex-wrap gap-1.5">
                {t.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="link" className="h-auto px-0">
                <Link href="/console/sandboxes/new">
                  <Play className="h-4 w-4" />
                  使用此模板
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
