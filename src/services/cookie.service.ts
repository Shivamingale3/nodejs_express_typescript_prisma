import { Response } from 'express';

/**
 * Cookie configuration from environment
 */
export const cookieConfig = {
  /** Cookie name for access token */
  authCookieName: process.env.COOKIE_AUTH_NAME || 'Authorization',
  /** Cookie name for refresh token */
  refreshCookieName: process.env.COOKIE_REFRESH_NAME || 'RefreshToken',
  /** Cookie domain (leave empty for default) */
  domain: process.env.COOKIE_DOMAIN || '',
  /** Secure flag - true in production/staging, false in development */
  secure: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
  /** SameSite attribute - Strict in production, Lax in development */
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  /** Cookie path */
  path: '/',
} as const;

/**
 * Cookie data structure
 */
export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  domain?: string;
  maxAge?: number;
  signed?: boolean;
}

/**
 * Cookie Service for managing authentication cookies
 */
export class CookieService {
  private authCookieName: string;
  private refreshCookieName: string;

  constructor() {
    this.authCookieName = cookieConfig.authCookieName;
    this.refreshCookieName = cookieConfig.refreshCookieName;
  }

  /**
   * Create a cookie string for access token
   */
  public createAccessCookie(token: string, expiresInSeconds: number): string {
    return this.createCookie(this.authCookieName, token, expiresInSeconds);
  }

  /**
   * Create a cookie string for refresh token
   */
  public createRefreshCookie(token: string, expiresInSeconds: number): string {
    return this.createCookie(this.refreshCookieName, token, expiresInSeconds);
  }

  /**
   * Clear the access token cookie
   */
  public clearAccessCookie(): string {
    return `${this.authCookieName}=; HttpOnly; Max-Age=0; Path=${cookieConfig.path}`;
  }

  /**
   * Clear the refresh token cookie
   */
  public clearRefreshCookie(): string {
    return `${this.refreshCookieName}=; HttpOnly; Max-Age=0; Path=${cookieConfig.path}`;
  }

  /**
   * Clear both access and refresh token cookies
   */
  public clearAllCookies(): string[] {
    return [this.clearAccessCookie(), this.clearRefreshCookie()];
  }

  /**
   * Set cookies on response object
   */
  public setCookies(res: Response, accessToken: string, refreshToken: string, accessExpiresIn: number, refreshExpiresIn: number): void {
    const cookies = [
      this.formatCookie(this.authCookieName, accessToken, accessExpiresIn),
      this.formatCookie(this.refreshCookieName, refreshToken, refreshExpiresIn),
    ];
    res.setHeader('Set-Cookie', cookies);
  }

  /**
   * Clear cookies on response object
   */
  public clearCookies(res: Response): void {
    res.setHeader('Set-Cookie', this.clearAllCookies());
  }

  private createCookie(name: string, value: string, maxAgeSeconds: number): string {
    let cookie = `${name}=${value}`;

    cookie += '; HttpOnly';
    cookie += `; Max-Age=${maxAgeSeconds}`;
    cookie += `; Path=${cookieConfig.path}`;

    // Secure flag - only set in production/staging or when explicitly enabled
    if (cookieConfig.secure || process.env.COOKIE_SECURE === 'true') {
      cookie += '; Secure';
    }

    // SameSite attribute
    cookie += `; SameSite=${cookieConfig.sameSite}`;

    // Domain if specified
    if (cookieConfig.domain) {
      cookie += `; Domain=${cookieConfig.domain}`;
    }

    return cookie;
  }

  private formatCookie(name: string, value: string, maxAgeSeconds: number): string {
    return this.createCookie(name, value, maxAgeSeconds);
  }
}

export const cookieService = new CookieService();
