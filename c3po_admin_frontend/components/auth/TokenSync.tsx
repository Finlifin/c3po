"use client";

import { useEffect } from "react";
import { tokenStorage } from "@/lib/utils/storage";

/**
 * Token 同步组件
 * 在应用初始化时同步 localStorage 中的 token 到 cookie
 * 用于修复 localStorage 有 token 但 cookie 没有的情况
 */
export function TokenSync() {
  useEffect(() => {
    tokenStorage.syncTokenToCookie();
  }, []);

  return null;
}

