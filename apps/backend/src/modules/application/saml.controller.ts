import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  Body,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

import escapeHtml = require('escape-html');

@Controller('saml')
export class SamlController {
  constructor(private prisma: PrismaService) { }

  /**
   * SAML IdP Metadata Endpoint
   * GET /saml/:appId/metadata.xml
   */
  @Get(':appId/metadata.xml')
  async getMetadata(
    @Param('appId') appId: string,
    @Res() res: Response,
  ) {
    const application = await this.prisma.application.findFirst({
      where: { id: appId, type: 'SAML' },
    });

    if (!application) throw new NotFoundException('SAML application not found');

    const baseUrl = `https://api.sutraid.com`;
    const entityId = application.samlEntityId || `${baseUrl}/saml/${appId}/metadata`;
    const ssoUrl = `${baseUrl}/saml/${appId}/sso`;
    const cert = application.samlCertificate || '';

    const escapedEntityId = escapeHtml(entityId);
    const escapedSsoUrl = escapeHtml(ssoUrl);
    const escapedCert = escapeHtml(cert.replace(/-----BEGIN CERTIFICATE-----/g, '').replace(/-----END CERTIFICATE-----/g, '').replace(/\n/g, ''));
    const escapedNameIdFormat = escapeHtml(application.samlNameIdFormat || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress');

    const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="${escapedEntityId}">
  <IDPSSODescriptor WantAuthnRequestsSigned="true"
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>${escapedCert}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </KeyDescriptor>
    <NameIDFormat>${escapedNameIdFormat}</NameIDFormat>
    <SingleSignOnService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${escapedSsoUrl}"/>
  </IDPSSODescriptor>
</EntityDescriptor>`;

    res.set('Content-Type', 'application/samlmetadata+xml');
    return res.send(metadata);
  }

  /**
   * SAML SSO Endpoint (HTTP-POST binding)
   * POST /saml/:appId/sso
   */
  @Post(':appId/sso')
  @HttpCode(HttpStatus.OK)
  async sso(
    @Param('appId') appId: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    const application = await this.prisma.application.findFirst({
      where: { id: appId, type: 'SAML' },
    });

    if (!application) throw new NotFoundException('SAML application not found');

    const acsUrl = application.samlSpAcsUrl || '';

    const samlResponse = Buffer.from('<samlp:Response>...</samlp:Response>').toString('base64');

    const escapedAcsUrl = escapeHtml(acsUrl);
    const escapedSamlResponse = escapeHtml(samlResponse);
    const escapedRelayState = escapeHtml(body.RelayState || '');
    const html = `
<!DOCTYPE html>
<html>
<body onload="document.forms[0].submit()">
  <form method="POST" action="${escapedAcsUrl}">
    <input type="hidden" name="SAMLResponse" value="${escapedSamlResponse}" />
    <input type="hidden" name="RelayState" value="${escapedRelayState}" />
    <noscript><button type="submit">Continue</button></noscript>
  </form>
</body>
</html>`;

    res.set('Content-Type', 'text/html');
    return res.send(html);
  }
}
