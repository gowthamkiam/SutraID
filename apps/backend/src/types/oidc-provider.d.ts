declare module 'oidc-provider' {
  import { Middleware } from 'koa';

  export interface KoaContextWithOIDC {
    oidc?: any;
    [key: string]: any;
  }

  export interface Account {
    accountId: string;
    claims: (use: string, scope: string) => Promise<any>;
  }

  export interface InteractionResults {
    login?: {
      accountId: string;
    };
    consent?: {
      grantId?: string;
    };
  }

  export interface Configuration {
    adapter?: any;
    clients?: any[];
    features?: any;
    ttl?: any;
    claims?: any;
    findAccount?: (ctx: KoaContextWithOIDC, sub: string) => Promise<Account | undefined>;
    responseTypes?: string[];
    grantTypes?: string[];
    pkce?: any;
    interactions?: {
      url?: (ctx: KoaContextWithOIDC, interaction: any) => Promise<string>;
    };
    cookies?: any;
    [key: string]: any;
  }

  class Provider {
    constructor(issuer: string, configuration: Configuration);

    app: Middleware;

    interactionDetails(req: any, res: any): Promise<any>;
    interactionFinished(req: any, res: any, result: InteractionResults, options?: any): Promise<any>;

    [key: string]: any;
  }

  export default Provider;
}
