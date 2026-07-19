import type { LucideIcon, LucideProps } from "lucide-react";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Box,
  Boxes,
  ChartColumn,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Code2,
  Copy,
  Cpu,
  ExternalLink,
  FileCode2,
  FileText,
  FlaskConical,
  Folder,
  FolderOpen,
  Globe,
  GlobeLock,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  Network,
  Pause,
  Play,
  Plus,
  Shield,
  Sparkles,
  Terminal,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";

const defaultProps: LucideProps = {
  size: 16,
  strokeWidth: 1.75,
  "aria-hidden": true,
};

export function Icon({
  icon: Ico,
  size = 16,
  className,
  strokeWidth = 1.75,
}: {
  icon: LucideIcon;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <Ico
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden
    />
  );
}

export const Icons = {
  dashboard: LayoutDashboard,
  sandbox: Box,
  boxes: Boxes,
  template: LayoutTemplate,
  key: KeyRound,
  usage: ChartColumn,
  lab: FlaskConical,
  docs: BookOpen,
  help: CircleHelp,
  back: ArrowLeft,
  plus: Plus,
  play: Play,
  pause: Pause,
  trash: Trash2,
  terminal: Terminal,
  folder: Folder,
  folderOpen: FolderOpen,
  file: FileText,
  fileCode: FileCode2,
  globe: Globe,
  globeLock: GlobeLock,
  network: Network,
  cpu: Cpu,
  clock: Clock3,
  activity: Activity,
  shield: Shield,
  sparkles: Sparkles,
  zap: Zap,
  code: Code2,
  hardDrive: HardDrive,
  upload: Upload,
  copy: Copy,
  check: Check,
  chevronRight: ChevronRight,
  external: ExternalLink,
} as const;

export type IconName = keyof typeof Icons;

export function NamedIcon({
  name,
  size = 16,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return <Icon icon={Icons[name]} size={size} className={className} />;
}

export { defaultProps };
