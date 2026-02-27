"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

export function NavBreadcrumb() {
  const HOME = "Home";

  const pathname = usePathname();
  // String.split() does actually give two empty strings if the string only has "/"
  // so we just check if the pathname is '/' and then skip the splitting if it is
  const paths = pathname === "/" ? [HOME] : pathname.split("/");
  return (
    <Breadcrumb className="flex-1">
      <BreadcrumbList>
        {paths.map((path, index, pathArr) => {
          const pathMod = path === "" ? HOME : path.replaceAll("_", " ");
          if (index === pathArr.length - 1)
            return (
              <BreadcrumbItem key={index}>
                <BreadcrumbPage className="capitalize">
                  {pathMod}
                </BreadcrumbPage>
              </BreadcrumbItem>
            );
          else
            return (
              <Fragment key={index}>
                <BreadcrumbItem key={index} className="hidden md:block">
                  <BreadcrumbLink
                    className="capitalize"
                    // IDK why there is a '/' at the beginning of the path
                    href={`${pathArr.slice(0, index + 1).join("/")}`}>
                    {pathMod}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
              </Fragment>
            );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
