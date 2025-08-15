"use client"

import { AuthLoadingSkeletonV2 } from "@/components/ui/skeleton-components-v2";
import { SkeletonTestNav } from "@/components/SkeletonTestNav";

export default function SkeletonWithLSPage() {
  return (
    <>
      <AuthLoadingSkeletonV2 />
      <SkeletonTestNav />
    </>
  );
}