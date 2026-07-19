import { ChartColumn, Clock3, Code2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@f2b/ui";
import { MOCK_USAGE } from "@/lib/catalog";
import { MockBanner } from "@/components/mock-banner";

export default function UsagePage() {
  const maxH = Math.max(...MOCK_USAGE.map((u) => u.sandboxHours), 1);
  const totalH = MOCK_USAGE.reduce((a, b) => a + b.sandboxHours, 0);
  const totalCmd = MOCK_USAGE.reduce((a, b) => a + b.commands, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">用量</h1>
        <p className="text-sm text-muted-foreground">
          沙箱时长与命令次数聚合。账单对接前为示意页。
        </p>
      </div>

      <MockBanner>
        以下图表与表格为<strong>固定演示数据（Mock）</strong>
        ，未对接 sandbox_usage / 账单 API。上线后将替换为真实聚合。
      </MockBanner>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">
              近 7 日沙箱时（mock）
            </div>
            <div className="mt-2 flex items-end gap-2">
              <Clock3 className="h-4 w-4 text-sky-600" />
              <span className="text-2xl font-semibold">{totalH.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">
              近 7 日命令（mock）
            </div>
            <div className="mt-2 flex items-end gap-2">
              <Code2 className="h-4 w-4 text-violet-600" />
              <span className="text-2xl font-semibold">{totalCmd}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">预估费用</div>
            <div className="mt-2 flex items-end gap-2">
              <ChartColumn className="h-4 w-4 text-brand" />
              <span className="text-2xl font-semibold">示意</span>
              <span className="pb-0.5 text-xs text-muted-foreground">
                Team 按量计费占位
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartColumn className="h-4 w-4" />
            沙箱时（近 7 日 · mock）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[180px] items-end gap-2.5">
            {MOCK_USAGE.map((u) => (
              <div
                key={u.day}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <div
                  title={`${u.sandboxHours}h`}
                  className="w-full min-h-1 rounded"
                  style={{
                    height: `${(u.sandboxHours / maxH) * 140}px`,
                    background:
                      "linear-gradient(180deg, #FF5C33, rgba(255,138,76,0.55))",
                  }}
                />
                <span className="font-mono text-[11px] text-muted-foreground">
                  {u.day}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日期</TableHead>
                <TableHead>沙箱时</TableHead>
                <TableHead>命令数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_USAGE.map((u) => (
                <TableRow key={u.day}>
                  <TableCell className="font-mono text-xs">{u.day}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {u.sandboxHours.toFixed(1)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {u.commands}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
