import { Separator } from "@radix-ui/react-separator";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/library/components/atoms/breadcrumb";
import { SidebarTrigger } from "@/library/components/atoms/sidebar";

const formatPathSegment = (segment: string): string => {
  // Map route names to display names
  const routeNameMap: Record<string, string> = {
    observatory: "Observatory",
  };

  const withoutExtension = segment.replace(/\.[^/.]+$/, "");

  // Check if there's a custom mapping
  if (routeNameMap[withoutExtension.toLowerCase()]) {
    return routeNameMap[withoutExtension.toLowerCase()];
  }

  return withoutExtension
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const Header = () => {
  const pathname = usePathname();

  const segments = pathname?.slice(1).split("/").filter(Boolean) || [];

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1;
              const href = "/" + segments.slice(0, index + 1).join("/");
              const formattedSegment = formatPathSegment(segment);

              return (
                <Fragment key={href}>
                  {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                  {isLast ? (
                    <BreadcrumbItem>
                      <BreadcrumbPage>{formattedSegment}</BreadcrumbPage>
                    </BreadcrumbItem>
                  ) : (
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href={href}>{formattedSegment}</BreadcrumbLink>
                    </BreadcrumbItem>
                  )}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
};

export default Header;
