import {
  Loader2,
  Plus,
  Trash,
  type LucideIcon,
} from 'lucide-react';

export type Icon = LucideIcon;

export const Icons = {
  spinner: Loader2,
  plus: Plus,
  trash: Trash,
} as const;