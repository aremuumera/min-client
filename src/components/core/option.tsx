import * as React from 'react';
import { MenuItem } from '@/components/ui/menu';

export function Option({ children, ...props }: { children: React.ReactNode, [key: string]: any }) {
  return <MenuItem {...props}>{children}</MenuItem>;
}
