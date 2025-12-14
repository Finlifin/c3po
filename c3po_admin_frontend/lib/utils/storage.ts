// Token 存储和读取工具函数

const TOKEN_KEY = "c3po_auth_token";
const TOKEN_EXPIRY_KEY = "c3po_auth_token_expiry";
const COOKIE_NAME = "c3po_auth_token";

/**
 * 设置 Cookie
 */
function setCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  
  // 计算过期时间（秒）
  const expiresInSeconds = Math.floor(maxAge / 1000);
  
  // 设置 cookie，使用 SameSite=Lax 以支持跨站请求，Secure 在生产环境 HTTPS 下使用
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; Max-Age=${expiresInSeconds}; Path=/; SameSite=Lax${secure}`;
}

/**
 * 删除 Cookie
 */
function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export const tokenStorage = {
  /**
   * 存储 Token（同时存储到 localStorage 和 cookie）
   */
  setToken(token: string, expiresIn: number): void {
    if (typeof window === "undefined") return;

    const expiryTime = Date.now() + expiresIn;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    // 同时设置到 cookie，供 proxy 使用
    setCookie(COOKIE_NAME, token, expiresIn);
  },

  /**
   * 获取 Token
   */
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * 清除 Token（同时清除 localStorage 和 cookie）
   */
  clearToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    
    // 同时清除 cookie
    deleteCookie(COOKIE_NAME);
  },

  /**
   * 检查 Token 是否过期
   */
  isTokenExpired(): boolean {
    if (typeof window === "undefined") return true;

    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;

    return Date.now() >= parseInt(expiryTime, 10);
  },

  /**
   * 获取 Token 过期时间
   */
  getTokenExpiry(): number | null {
    if (typeof window === "undefined") return null;

    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiryTime ? parseInt(expiryTime, 10) : null;
  },

  /**
   * 检查 Cookie 中是否有 Token
   */
  hasCookieToken(): boolean {
    if (typeof document === "undefined") return false;
    
    const cookies = document.cookie.split(";");
    return cookies.some((cookie) => {
      const [name] = cookie.trim().split("=");
      return name === COOKIE_NAME;
    });
  },

  /**
   * 同步 Token 到 Cookie（用于修复 localStorage 有 token 但 cookie 没有的情况）
   */
  syncTokenToCookie(): void {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem(TOKEN_KEY);
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);

    // 如果 localStorage 中有 token 且未过期，但 cookie 中没有，则同步到 cookie
    if (token && expiryTime && !this.isTokenExpired()) {
      const remainingTime = parseInt(expiryTime, 10) - Date.now();
      if (remainingTime > 0) {
        setCookie(COOKIE_NAME, token, remainingTime);
      }
    }
  },
};

