import type { Icon } from '@/components/ui/icons';

declare module '@/components/ui/icons' {
  export type { Icon };
  export const Icons: {
    readonly spinner: Icon;
    readonly plus: Icon;
    readonly trash: Icon;
  };
}