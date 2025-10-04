'use client';

import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const routeNames: Record<string, string> = {
  dashboard: 'Dashboard',
  generate: 'Generate Password',
  settings: 'Settings',
  vault: 'Vault',
};

export default function DynamicBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const breadcrumbItems = segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`;
    const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return { path, name, isLast };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <div key={item.path} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator className="mx-2" />}
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.path}>{item.name}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
