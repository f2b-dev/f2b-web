import { FlaskConical } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@f2b/ui";

/** 标明页面仍为演示数据，避免与真 API 混淆 */
export function MockBanner({
  title = "演示数据（Mock）",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Alert variant="warning">
      <FlaskConical className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
