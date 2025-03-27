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
  const paths = pathname === "/" ? [HOME] : pathname.split("/");
  return (
    <Breadcrumb>
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
                  <BreadcrumbLink className="capitalize" href="#">
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
