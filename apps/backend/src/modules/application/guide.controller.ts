import {
    Controller,
    Get,
    Param,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('guide')
export class GuideController {
    constructor(private prisma: PrismaService) { }

    @Get(':appId')
    async getGuide(@Param('appId') appId: string) {
        const application = await this.prisma.application.findUnique({
            where: { id: appId },
        });

        if (!application) throw new NotFoundException('Application not found');

        const baseUrl = `https://api.sutraid.com`;

        return {
            applicationName: application.name,
            protocol: application.type,
            config: {
                issuer: `${baseUrl}/api/v1/sso/oidc-idp/${application.id}`,
                clientId: application.clientId,
                tokenEndpoint: `${baseUrl}/api/v1/oauth/token`,
                authorizeEndpoint: `${baseUrl}/api/v1/sso/oidc-idp/${application.id}/authorize`,
                requireDpop: application.requireDpop,
                scopes: application.scopes,
                samlEntityId: application.samlEntityId || `${baseUrl}/api/v1/saml/${application.id}/metadata`,
                samlSsoUrl: `${baseUrl}/api/v1/saml/${application.id}/sso`,
                samlCertificate: application.samlCertificate,
            },
            snippets: this.generateSnippets(application, baseUrl),
        };
    }

    private generateSnippets(application: any, baseUrl: string) {
        if (application.type === 'OIDC') {
            return {
                curl: `curl -X POST ${baseUrl}/api/v1/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  ${application.requireDpop ? '-H "DPoP: <JWT_PROOF>" \\' : ''}
  -d "grant_type=authorization_code" \\
  -d "code=<AUTH_CODE>" \\
  -d "client_id=${application.clientId}" \\
  -d "redirect_uri=${application.redirectUris[0] || 'https://your-app.com/callback'}" \\
  -d "code_verifier=<PKCE_VERIFIER>"`,
                node: `const { Issuer } = require('openid-client');

const sutraIssuer = await Issuer.discover('${baseUrl}/api/v1/.well-known/openid-configuration/${application.id}');
const client = new sutraIssuer.Client({
  client_id: '${application.clientId}',
  token_endpoint_auth_method: '${application.tokenEndpointAuthMethod}',
});

// Authorization Code Flow with PKCE
const tokenSet = await client.callback(
  '${application.redirectUris[0] || 'https://your-app.com/callback'}',
  params,
  { code_verifier }
);`,
            };
        } else {
            const cert = application.samlCertificate || '';
            const certContent = cert.replace(/-----BEGIN CERTIFICATE-----/g, '').replace(/-----END CERTIFICATE-----/g, '').replace(/\n/g, '');
            return {
                xml: `<EntityDescriptor entityID="${baseUrl}/api/v1/saml/${application.id}/metadata">
  <IDPSSODescriptor WantAuthnRequestsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>${certContent}</ds:X509Data>
      </ds:KeyInfo>
    </KeyDescriptor>
    <NameIDFormat>${application.samlNameIdFormat || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'}</NameIDFormat>
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${baseUrl}/api/v1/saml/${application.id}/sso"/>
  </IDPSSODescriptor>
</EntityDescriptor>`,
            };
        }
    }
}
