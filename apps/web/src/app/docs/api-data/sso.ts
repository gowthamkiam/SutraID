import { DocSection } from './types';

export const ssoSection: DocSection = {
  title: 'SSO',
  slug: 'sso',
  description: 'SSO provider configuration (SAML 2.0 & OIDC), domain discovery, and authentication flows.',
  endpoints: [
    // -------------------------------------------------------------------------
    // 1. Create SSO Provider
    // -------------------------------------------------------------------------
    {
      id: 'sso-create-provider',
      method: 'POST',
      path: '/api/v1/organizations/:orgId/sso/providers',
      title: 'Create SSO Provider',
      description: 'Create a new SSO provider (SAML 2.0 or OIDC) for an organization. Provide the protocol-specific fields that match the chosen protocol.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hx9k2m4p',
        },
      ],
      requestBody: [
        {
          name: 'name',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Display name for the SSO provider (max 100 characters).',
          example: 'Okta Production',
        },
        {
          name: 'type',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Provider type.',
          enum: ['OKTA', 'AZURE_AD', 'GOOGLE_WORKSPACE', 'GENERIC_SAML', 'GENERIC_OIDC'],
          example: 'OKTA',
        },
        {
          name: 'protocol',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Authentication protocol.',
          enum: ['SAML2', 'OIDC'],
          example: 'SAML2',
        },
        {
          name: 'samlEntityId',
          in: 'body',
          type: 'string',
          required: false,
          description: 'SAML IdP Entity ID. Required when protocol is SAML2.',
          example: 'http://www.okta.com/exk1abc2defGHIJK',
        },
        {
          name: 'samlSsoUrl',
          in: 'body',
          type: 'string',
          required: false,
          description: 'SAML IdP Single Sign-On URL. Required when protocol is SAML2.',
          example: 'https://acme.okta.com/app/acme_sutraid/exk1abc/sso/saml',
        },
        {
          name: 'samlCertificate',
          in: 'body',
          type: 'string',
          required: false,
          description: 'SAML IdP X.509 signing certificate (PEM). Required when protocol is SAML2.',
          example: 'MIIDpDCCAoygAwIBAgIGAX...',
        },
        {
          name: 'samlMetadataUrl',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Optional URL to fetch SAML IdP metadata automatically.',
          example: 'https://acme.okta.com/app/exk1abc/sso/saml/metadata',
        },
        {
          name: 'oidcIssuer',
          in: 'body',
          type: 'string',
          required: false,
          description: 'OIDC Issuer URL. Required when protocol is OIDC.',
          example: 'https://acme.okta.com',
        },
        {
          name: 'oidcClientId',
          in: 'body',
          type: 'string',
          required: false,
          description: 'OIDC Client ID. Required when protocol is OIDC.',
          example: '0oa1abc2defGHIJK3456',
        },
        {
          name: 'oidcClientSecret',
          in: 'body',
          type: 'string',
          required: false,
          description: 'OIDC Client Secret. Required when protocol is OIDC.',
          example: 'xyzClientSecretValue',
        },
        {
          name: 'oidcAuthUrl',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Optional OIDC authorization endpoint URL.',
          example: 'https://acme.okta.com/oauth2/v1/authorize',
        },
        {
          name: 'oidcTokenUrl',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Optional OIDC token endpoint URL.',
          example: 'https://acme.okta.com/oauth2/v1/token',
        },
        {
          name: 'oidcUserinfoUrl',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Optional OIDC userinfo endpoint URL.',
          example: 'https://acme.okta.com/oauth2/v1/userinfo',
        },
        {
          name: 'oidcScopes',
          in: 'body',
          type: 'string[]',
          required: false,
          description: 'Optional list of OIDC scopes to request.',
          example: '["openid","email","profile"]',
        },
        {
          name: 'attributeMapping',
          in: 'body',
          type: 'Record<string, string>',
          required: false,
          description: 'Optional mapping of IdP attribute names to SutraID profile fields.',
          example: '{"email":"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"}',
        },
        {
          name: 'enabled',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Whether the provider is active. Defaults to true.',
          example: 'true',
        },
        {
          name: 'autoProvision',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Automatically create user accounts on first SSO login.',
          example: 'true',
        },
        {
          name: 'allowedDomains',
          in: 'body',
          type: 'string[]',
          required: false,
          description: 'Email domains that are allowed to use this SSO provider.',
          example: '["acme.com","acme.io"]',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Unique identifier of the SSO provider.', example: 'sso_01hx9k2m4p' },
        { name: 'orgId', type: 'string', description: 'Organization this provider belongs to.', example: 'org_01hx9k2m4p' },
        { name: 'name', type: 'string', description: 'Display name of the provider.', example: 'Okta Production' },
        { name: 'type', type: 'string', description: 'Provider type enum value.', example: 'OKTA' },
        { name: 'protocol', type: 'string', description: 'Protocol used (SAML2 or OIDC).', example: 'SAML2' },
        { name: 'enabled', type: 'boolean', description: 'Whether the provider is active.', example: 'true' },
        { name: 'autoProvision', type: 'boolean', description: 'Auto-provisioning enabled.', example: 'true' },
        { name: 'allowedDomains', type: 'string[]', description: 'Allowed email domains.', example: '["acme.com"]' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 creation timestamp.', example: '2024-01-15T10:00:00.000Z' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 last-updated timestamp.', example: '2024-01-15T10:00:00.000Z' },
      ],
      responseSample: {
        id: 'sso_01hx9k2m4p',
        orgId: 'org_01hx9k2m4p',
        name: 'Okta Production',
        type: 'OKTA',
        protocol: 'SAML2',
        samlEntityId: 'http://www.okta.com/exk1abc2defGHIJK',
        samlSsoUrl: 'https://acme.okta.com/app/acme_sutraid/exk1abc/sso/saml',
        samlMetadataUrl: 'https://acme.okta.com/app/exk1abc/sso/saml/metadata',
        attributeMapping: { email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress' },
        enabled: true,
        autoProvision: true,
        allowedDomains: ['acme.com'],
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Okta Production",
    "type": "OKTA",
    "protocol": "SAML2",
    "samlEntityId": "http://www.okta.com/exk1abc2defGHIJK",
    "samlSsoUrl": "https://acme.okta.com/app/acme_sutraid/exk1abc/sso/saml",
    "samlCertificate": "MIIDpDCCAoygAwIBAgIGAX...",
    "autoProvision": true,
    "allowedDomains": ["acme.com"]
  }'`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers"
headers = {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
}
payload = {
    "name": "Okta Production",
    "type": "OKTA",
    "protocol": "SAML2",
    "samlEntityId": "http://www.okta.com/exk1abc2defGHIJK",
    "samlSsoUrl": "https://acme.okta.com/app/acme_sutraid/exk1abc/sso/saml",
    "samlCertificate": "MIIDpDCCAoygAwIBAgIGAX...",
    "autoProvision": True,
    "allowedDomains": ["acme.com"]
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Okta Production',
      type: 'OKTA',
      protocol: 'SAML2',
      samlEntityId: 'http://www.okta.com/exk1abc2defGHIJK',
      samlSsoUrl: 'https://acme.okta.com/app/acme_sutraid/exk1abc/sso/saml',
      samlCertificate: 'MIIDpDCCAoygAwIBAgIGAX...',
      autoProvision: true,
      allowedDomains: ['acme.com'],
    }),
  }
);
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = """
    {
      "name": "Okta Production",
      "type": "OKTA",
      "protocol": "SAML2",
      "samlEntityId": "http://www.okta.com/exk1abc2defGHIJK",
      "samlSsoUrl": "https://acme.okta.com/app/acme_sutraid/exk1abc/sso/saml",
      "samlCertificate": "MIIDpDCCAoygAwIBAgIGAX...",
      "autoProvision": true,
      "allowedDomains": ["acme.com"]
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers"))
    .header("Authorization", "Bearer <token>")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "name":            "Okta Production",
        "type":            "OKTA",
        "protocol":        "SAML2",
        "samlEntityId":    "http://www.okta.com/exk1abc2defGHIJK",
        "samlSsoUrl":      "https://acme.okta.com/app/acme_sutraid/exk1abc/sso/saml",
        "samlCertificate": "MIIDpDCCAoygAwIBAgIGAX...",
        "autoProvision":   true,
        "allowedDomains":  []string{"acme.com"},
    }
    body, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers",
        bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer <token>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,
        php: `<?php
$payload = json_encode([
    'name'            => 'Okta Production',
    'type'            => 'OKTA',
    'protocol'        => 'SAML2',
    'samlEntityId'    => 'http://www.okta.com/exk1abc2defGHIJK',
    'samlSsoUrl'      => 'https://acme.okta.com/app/acme_sutraid/exk1abc/sso/saml',
    'samlCertificate' => 'MIIDpDCCAoygAwIBAgIGAX...',
    'autoProvision'   => true,
    'allowedDomains'  => ['acme.com'],
]);

$ch = curl_init('https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer <token>',
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // -------------------------------------------------------------------------
    // 2. List SSO Providers
    // -------------------------------------------------------------------------
    {
      id: 'sso-list-providers',
      method: 'GET',
      path: '/api/v1/organizations/:orgId/sso/providers',
      title: 'List SSO Providers',
      description: 'Retrieve all SSO providers configured for an organization.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hx9k2m4p',
        },
      ],
      responseFields: [
        { name: '[]', type: 'SsoProvider[]', description: 'Array of SSO provider records.' },
        { name: '[].id', type: 'string', description: 'Unique provider identifier.', example: 'sso_01hx9k2m4p' },
        { name: '[].name', type: 'string', description: 'Provider display name.', example: 'Okta Production' },
        { name: '[].type', type: 'string', description: 'Provider type.', example: 'OKTA' },
        { name: '[].protocol', type: 'string', description: 'Authentication protocol.', example: 'SAML2' },
        { name: '[].enabled', type: 'boolean', description: 'Whether the provider is active.', example: 'true' },
      ],
      responseSample: {
        data: [
          {
            id: 'sso_01hx9k2m4p',
            orgId: 'org_01hx9k2m4p',
            name: 'Okta Production',
            type: 'OKTA',
            protocol: 'SAML2',
            enabled: true,
            autoProvision: true,
            allowedDomains: ['acme.com'],
            createdAt: '2024-01-15T10:00:00.000Z',
            updatedAt: '2024-01-15T10:00:00.000Z',
          },
          {
            id: 'sso_02hy0l3n5q',
            orgId: 'org_01hx9k2m4p',
            name: 'Azure AD',
            type: 'AZURE_AD',
            protocol: 'OIDC',
            enabled: true,
            autoProvision: false,
            allowedDomains: ['acme.io'],
            createdAt: '2024-02-01T08:30:00.000Z',
            updatedAt: '2024-02-01T08:30:00.000Z',
          },
        ],
      },
      codeSamples: {
        curl: `curl -X GET https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers \\
  -H "Authorization: Bearer <token>"`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers"
headers = {"Authorization": "Bearer <token>"}

response = requests.get(url, headers=headers)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers',
  {
    headers: { 'Authorization': 'Bearer <token>' },
  }
);
const providers = await response.json();
console.log(providers);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers"))
    .header("Authorization", "Bearer <token>")
    .GET()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    req, _ := http.NewRequest("GET",
        "https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers",
        nil)
    req.Header.Set("Authorization", "Bearer <token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer <token>',
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // -------------------------------------------------------------------------
    // 3. Get SSO Provider
    // -------------------------------------------------------------------------
    {
      id: 'sso-get-provider',
      method: 'GET',
      path: '/api/v1/organizations/:orgId/sso/providers/:providerId',
      title: 'Get SSO Provider',
      description: 'Retrieve a single SSO provider by ID.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hx9k2m4p',
        },
        {
          name: 'providerId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the SSO provider.',
          example: 'sso_01hx9k2m4p',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Unique provider identifier.', example: 'sso_01hx9k2m4p' },
        { name: 'orgId', type: 'string', description: 'Owning organization ID.', example: 'org_01hx9k2m4p' },
        { name: 'name', type: 'string', description: 'Provider display name.', example: 'Okta Production' },
        { name: 'type', type: 'string', description: 'Provider type.', example: 'OKTA' },
        { name: 'protocol', type: 'string', description: 'Authentication protocol.', example: 'SAML2' },
        { name: 'enabled', type: 'boolean', description: 'Whether the provider is active.', example: 'true' },
        { name: 'autoProvision', type: 'boolean', description: 'Auto-provisioning enabled.', example: 'true' },
        { name: 'allowedDomains', type: 'string[]', description: 'Allowed email domains.', example: '["acme.com"]' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 creation timestamp.', example: '2024-01-15T10:00:00.000Z' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 last-updated timestamp.', example: '2024-01-15T10:00:00.000Z' },
      ],
      responseSample: {
        id: 'sso_01hx9k2m4p',
        orgId: 'org_01hx9k2m4p',
        name: 'Okta Production',
        type: 'OKTA',
        protocol: 'SAML2',
        samlEntityId: 'http://www.okta.com/exk1abc2defGHIJK',
        samlSsoUrl: 'https://acme.okta.com/app/acme_sutraid/exk1abc/sso/saml',
        samlMetadataUrl: 'https://acme.okta.com/app/exk1abc/sso/saml/metadata',
        attributeMapping: { email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress' },
        enabled: true,
        autoProvision: true,
        allowedDomains: ['acme.com'],
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      },
      codeSamples: {
        curl: `curl -X GET https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p \\
  -H "Authorization: Bearer <token>"`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p"
headers = {"Authorization": "Bearer <token>"}

response = requests.get(url, headers=headers)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p',
  {
    headers: { 'Authorization': 'Bearer <token>' },
  }
);
const provider = await response.json();
console.log(provider);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p"))
    .header("Authorization", "Bearer <token>")
    .GET()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    req, _ := http.NewRequest("GET",
        "https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p",
        nil)
    req.Header.Set("Authorization", "Bearer <token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer <token>',
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // -------------------------------------------------------------------------
    // 4. Update SSO Provider
    // -------------------------------------------------------------------------
    {
      id: 'sso-update-provider',
      method: 'PUT',
      path: '/api/v1/organizations/:orgId/sso/providers/:providerId',
      title: 'Update SSO Provider',
      description: 'Update an existing SSO provider. All fields from CreateSsoProviderDto are accepted; only provided fields are updated.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hx9k2m4p',
        },
        {
          name: 'providerId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the SSO provider.',
          example: 'sso_01hx9k2m4p',
        },
      ],
      requestBody: [
        {
          name: 'name',
          in: 'body',
          type: 'string',
          required: false,
          description: 'New display name (max 100 characters).',
          example: 'Okta Production v2',
        },
        {
          name: 'samlCertificate',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Updated SAML IdP X.509 certificate (PEM).',
          example: 'MIIDpDCCAoygAwIBAgIGAY...',
        },
        {
          name: 'enabled',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Enable or disable the provider.',
          example: 'false',
        },
        {
          name: 'autoProvision',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Toggle auto-provisioning of new users.',
          example: 'true',
        },
        {
          name: 'allowedDomains',
          in: 'body',
          type: 'string[]',
          required: false,
          description: 'Replacement list of allowed email domains.',
          example: '["acme.com","acme.io"]',
        },
        {
          name: 'attributeMapping',
          in: 'body',
          type: 'Record<string, string>',
          required: false,
          description: 'Updated attribute mapping.',
          example: '{"email":"mail","firstName":"givenName"}',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Unique provider identifier.', example: 'sso_01hx9k2m4p' },
        { name: 'name', type: 'string', description: 'Updated display name.', example: 'Okta Production v2' },
        { name: 'enabled', type: 'boolean', description: 'Updated enabled state.', example: 'false' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 last-updated timestamp.', example: '2024-03-10T12:00:00.000Z' },
      ],
      responseSample: {
        id: 'sso_01hx9k2m4p',
        orgId: 'org_01hx9k2m4p',
        name: 'Okta Production v2',
        type: 'OKTA',
        protocol: 'SAML2',
        samlEntityId: 'http://www.okta.com/exk1abc2defGHIJK',
        samlSsoUrl: 'https://acme.okta.com/app/acme_sutraid/exk1abc/sso/saml',
        enabled: false,
        autoProvision: true,
        allowedDomains: ['acme.com', 'acme.io'],
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-03-10T12:00:00.000Z',
      },
      codeSamples: {
        curl: `curl -X PUT https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Okta Production v2",
    "enabled": false,
    "allowedDomains": ["acme.com", "acme.io"]
  }'`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p"
headers = {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
}
payload = {
    "name": "Okta Production v2",
    "enabled": False,
    "allowedDomains": ["acme.com", "acme.io"]
}

response = requests.put(url, json=payload, headers=headers)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p',
  {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Okta Production v2',
      enabled: false,
      allowedDomains: ['acme.com', 'acme.io'],
    }),
  }
);
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = """
    {
      "name": "Okta Production v2",
      "enabled": false,
      "allowedDomains": ["acme.com", "acme.io"]
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p"))
    .header("Authorization", "Bearer <token>")
    .header("Content-Type", "application/json")
    .PUT(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "name":           "Okta Production v2",
        "enabled":        false,
        "allowedDomains": []string{"acme.com", "acme.io"},
    }
    body, _ := json.Marshal(payload)

    req, _ := http.NewRequest("PUT",
        "https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p",
        bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer <token>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,
        php: `<?php
$payload = json_encode([
    'name'           => 'Okta Production v2',
    'enabled'        => false,
    'allowedDomains' => ['acme.com', 'acme.io'],
]);

$ch = curl_init('https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer <token>',
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // -------------------------------------------------------------------------
    // 5. Delete SSO Provider
    // -------------------------------------------------------------------------
    {
      id: 'sso-delete-provider',
      method: 'DELETE',
      path: '/api/v1/organizations/:orgId/sso/providers/:providerId',
      title: 'Delete SSO Provider',
      description: 'Permanently delete an SSO provider from an organization.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hx9k2m4p',
        },
        {
          name: 'providerId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the SSO provider to delete.',
          example: 'sso_01hx9k2m4p',
        },
      ],
      responseFields: [
        { name: 'success', type: 'boolean', description: 'Indicates whether deletion was successful.', example: 'true' },
        { name: 'message', type: 'string', description: 'Human-readable result message.', example: 'SSO provider deleted successfully.' },
      ],
      responseSample: {
        success: true,
        message: 'SSO provider deleted successfully.',
      },
      codeSamples: {
        curl: `curl -X DELETE https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p \\
  -H "Authorization: Bearer <token>"`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p"
headers = {"Authorization": "Bearer <token>"}

response = requests.delete(url, headers=headers)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p',
  {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer <token>' },
  }
);
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p"))
    .header("Authorization", "Bearer <token>")
    .DELETE()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    req, _ := http.NewRequest("DELETE",
        "https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p",
        nil)
    req.Header.Set("Authorization", "Bearer <token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer <token>',
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // -------------------------------------------------------------------------
    // 6. Test SSO Connection
    // -------------------------------------------------------------------------
    {
      id: 'sso-test-provider',
      method: 'POST',
      path: '/api/v1/organizations/:orgId/sso/providers/:providerId/test',
      title: 'Test SSO Connection',
      description: 'Validate the connectivity and configuration of an SSO provider without initiating an actual login flow.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hx9k2m4p',
        },
        {
          name: 'providerId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the SSO provider to test.',
          example: 'sso_01hx9k2m4p',
        },
      ],
      responseFields: [
        { name: 'success', type: 'boolean', description: 'Whether the connection test passed.', example: 'true' },
        { name: 'message', type: 'string', description: 'Descriptive result or error message.', example: 'Connection successful. IdP metadata is reachable.' },
      ],
      responseSample: {
        success: true,
        message: 'Connection successful. IdP metadata is reachable.',
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p/test \\
  -H "Authorization: Bearer <token>"`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p/test"
headers = {"Authorization": "Bearer <token>"}

response = requests.post(url, headers=headers)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p/test',
  {
    method: 'POST',
    headers: { 'Authorization': 'Bearer <token>' },
  }
);
const result = await response.json();
console.log(result);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p/test"))
    .header("Authorization", "Bearer <token>")
    .POST(HttpRequest.BodyPublishers.noBody())
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p/test",
        nil)
    req.Header.Set("Authorization", "Bearer <token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/organizations/org_01hx9k2m4p/sso/providers/sso_01hx9k2m4p/test');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer <token>',
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // -------------------------------------------------------------------------
    // 7. Discover SSO Providers by Domain
    // -------------------------------------------------------------------------
    {
      id: 'sso-discover',
      method: 'GET',
      path: '/api/v1/sso/discover',
      title: 'Discover SSO Providers',
      description: 'Discover which SSO providers are available for a given email domain. Used on the login page to determine whether to offer SSO options.',
      auth: 'none',
      parameters: [
        {
          name: 'domain',
          in: 'query',
          type: 'string',
          required: true,
          description: 'The email domain to look up (e.g. acme.com).',
          example: 'acme.com',
        },
      ],
      responseFields: [
        { name: 'providers', type: 'SsoProvider[]', description: 'List of SSO providers matching the domain.' },
        { name: 'providers[].id', type: 'string', description: 'Provider identifier.', example: 'sso_01hx9k2m4p' },
        { name: 'providers[].name', type: 'string', description: 'Provider display name.', example: 'Okta Production' },
        { name: 'providers[].type', type: 'string', description: 'Provider type.', example: 'OKTA' },
        { name: 'providers[].protocol', type: 'string', description: 'Authentication protocol.', example: 'SAML2' },
        { name: 'providers[].orgId', type: 'string', description: 'Organization that owns this provider.', example: 'org_01hx9k2m4p' },
      ],
      responseSample: {
        providers: [
          {
            id: 'sso_01hx9k2m4p',
            orgId: 'org_01hx9k2m4p',
            name: 'Okta Production',
            type: 'OKTA',
            protocol: 'SAML2',
          },
        ],
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/sso/discover?domain=acme.com"`,
        python: `import requests

response = requests.get(
    "https://api.sutraid.com/api/v1/sso/discover",
    params={"domain": "acme.com"}
)
print(response.json())`,
        nodejs: `const params = new URLSearchParams({ domain: 'acme.com' });
const response = await fetch(
  \`https://api.sutraid.com/api/v1/sso/discover?\${params}\`
);
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/sso/discover?domain=acme.com"))
    .GET()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    req, _ := http.NewRequest("GET",
        "https://api.sutraid.com/api/v1/sso/discover?domain=acme.com",
        nil)

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/sso/discover?domain=acme.com');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // -------------------------------------------------------------------------
    // 8. Initiate SAML Login
    // -------------------------------------------------------------------------
    {
      id: 'sso-saml-login',
      method: 'GET',
      path: '/api/v1/sso/saml/:orgId/login',
      title: 'Initiate SAML Login',
      description: 'Begin a SAML 2.0 SP-initiated login flow. The server constructs a SAML AuthnRequest and returns an HTTP 302 redirect to the IdP SSO URL.',
      auth: 'none',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The organization whose SAML provider will handle login.',
          example: 'org_01hx9k2m4p',
        },
        {
          name: 'providerId',
          in: 'query',
          type: 'string',
          required: true,
          description: 'The SSO provider ID to use for this login attempt.',
          example: 'sso_01hx9k2m4p',
        },
      ],
      responseFields: [
        { name: '(HTTP 302)', type: 'redirect', description: 'Redirects the browser to the SAML IdP SSO URL with an embedded AuthnRequest.' },
        { name: 'Location', type: 'string', description: 'Header containing the IdP redirect target.', example: 'https://acme.okta.com/app/acme_sutraid/exk1abc/sso/saml?SAMLRequest=...' },
      ],
      responseSample: {
        status: 302,
        headers: {
          Location: 'https://acme.okta.com/app/acme_sutraid/exk1abc/sso/saml?SAMLRequest=PHNhbWxwOk...',
        },
      },
      codeSamples: {
        curl: `# Open in a browser or follow redirects with -L
curl -L "https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/login?providerId=sso_01hx9k2m4p"`,
        python: `import webbrowser

# Redirect the user's browser to begin the SAML flow
url = (
    "https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/login"
    "?providerId=sso_01hx9k2m4p"
)
webbrowser.open(url)`,
        nodejs: `// Redirect the user from an Express route handler
app.get('/sso/login', (req, res) => {
  const loginUrl =
    'https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/login' +
    '?providerId=sso_01hx9k2m4p';
  res.redirect(loginUrl);
});`,
        java: `// Redirect from a Servlet or Spring controller
response.sendRedirect(
    "https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/login"
    + "?providerId=sso_01hx9k2m4p"
);`,
        go: `package main

import "net/http"

func samlLoginHandler(w http.ResponseWriter, r *http.Request) {
    target := "https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/login" +
        "?providerId=sso_01hx9k2m4p"
    http.Redirect(w, r, target, http.StatusFound)
}`,
        php: `<?php
// Redirect the user's browser to start the SAML SP-initiated flow
$loginUrl = 'https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/login'
          . '?providerId=sso_01hx9k2m4p';
header('Location: ' . $loginUrl, true, 302);
exit;`,
      },
    },

    // -------------------------------------------------------------------------
    // 9. SAML ACS Callback
    // -------------------------------------------------------------------------
    {
      id: 'sso-saml-acs',
      method: 'POST',
      path: '/api/v1/sso/saml/:orgId/acs',
      title: 'SAML Assertion Consumer Service (ACS)',
      description: 'Receives the SAML response posted by the IdP after the user authenticates. The server validates the assertion, provisions or resolves the user, issues a JWT, and redirects to the frontend callback URL.',
      auth: 'none',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The organization that owns the SAML provider.',
          example: 'org_01hx9k2m4p',
        },
      ],
      requestBody: [
        {
          name: 'SAMLResponse',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Base64-encoded SAML response document posted by the IdP.',
          example: 'PHNhbWxwOlJlc3BvbnNlIHhtbG5z...',
        },
        {
          name: 'RelayState',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Optional opaque value that was included in the original AuthnRequest; echoed back by the IdP.',
          example: 'eyJyZWRpcmVjdCI6Ii9kYXNoYm9hcmQifQ==',
        },
      ],
      responseFields: [
        { name: '(HTTP 302)', type: 'redirect', description: 'Redirects to the frontend callback URL with an access token in the query string.' },
        { name: 'Location', type: 'string', description: 'Frontend callback URL containing the issued JWT.', example: 'https://app.sutraid.com/auth/sso/callback?token=eyJhbGc...' },
      ],
      responseSample: {
        status: 302,
        headers: {
          Location: 'https://app.sutraid.com/auth/sso/callback?token=eyJhbGciOiJSUzI1NiJ9...',
        },
      },
      codeSamples: {
        curl: `# This endpoint is called by the IdP browser POST, not directly by the client.
# Simulating with curl for testing only:
curl -X POST https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/acs \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  --data-urlencode "SAMLResponse=PHNhbWxwOlJlc3BvbnNlIHhtbG5z..." \\
  --data-urlencode "RelayState=eyJyZWRpcmVjdCI6Ii9kYXNoYm9hcmQifQ=="`,
        python: `import requests

# Typically invoked by the browser after IdP POST, not called directly
url = "https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/acs"
data = {
    "SAMLResponse": "PHNhbWxwOlJlc3BvbnNlIHhtbG5z...",
    "RelayState": "eyJyZWRpcmVjdCI6Ii9kYXNoYm9hcmQifQ=="
}

# Allow redirect following to capture the final callback URL
response = requests.post(url, data=data, allow_redirects=False)
print(response.headers.get("Location"))`,
        nodejs: `// This endpoint is posted to by the SAML IdP via browser form POST.
// In an Express app you would register a route to proxy the assertion:
app.post('/auth/saml/acs', async (req, res) => {
  const upstream = await fetch(
    'https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/acs',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        SAMLResponse: req.body.SAMLResponse,
        RelayState: req.body.RelayState ?? '',
      }),
      redirect: 'manual',
    }
  );
  const location = upstream.headers.get('location');
  res.redirect(location);
});`,
        java: `// Typically the IdP posts directly to this URL via the user's browser.
// Example of forwarding from a Spring controller:
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import java.net.*;

@RestController
public class SamlAcsProxy {
    @PostMapping("/auth/saml/acs")
    public ResponseEntity<Void> acs(
            @RequestParam String SAMLResponse,
            @RequestParam(required = false) String RelayState) throws Exception {
        // In production the browser posts directly to SutraID ACS endpoint.
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create("https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/acs"))
            .build();
    }
}`,
        go: `// The IdP browser-posts directly to the ACS endpoint.
// Minimal Go handler that accepts and proxies the SAML assertion:
package main

import (
    "net/http"
    "net/url"
    "strings"
)

func acsHandler(w http.ResponseWriter, r *http.Request) {
    r.ParseForm()
    samlResponse := r.FormValue("SAMLResponse")
    relayState := r.FormValue("RelayState")

    resp, _ := http.PostForm(
        "https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/acs",
        url.Values{
            "SAMLResponse": {samlResponse},
            "RelayState":   {relayState},
        },
    )
    defer resp.Body.Close()
    location := resp.Header.Get("Location")
    http.Redirect(w, r, location, http.StatusFound)
    _ = strings.TrimSpace(location)
}`,
        php: `<?php
// The IdP posts SAMLResponse via the user's browser to this endpoint.
// Simulating a manual forward using cURL:
$ch = curl_init('https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/acs');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'SAMLResponse' => $_POST['SAMLResponse'] ?? '',
    'RelayState'   => $_POST['RelayState']   ?? '',
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded',
]);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);

$response = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);

if ($info['http_code'] === 302) {
    header('Location: ' . $info['redirect_url'], true, 302);
    exit;
}
echo $response;`,
      },
    },

    // -------------------------------------------------------------------------
    // 10. Get SAML SP Metadata
    // -------------------------------------------------------------------------
    {
      id: 'sso-saml-metadata',
      method: 'GET',
      path: '/api/v1/sso/saml/:orgId/metadata',
      title: 'Get SAML SP Metadata',
      description: 'Returns the SAML Service Provider (SP) metadata XML for the given organization. Provide this URL or its content to your IdP during configuration.',
      auth: 'none',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The organization whose SP metadata should be returned.',
          example: 'org_01hx9k2m4p',
        },
      ],
      responseFields: [
        { name: '(XML document)', type: 'string', description: 'SAML 2.0 EntityDescriptor XML. Content-Type: application/xml.' },
      ],
      responseSample: {
        contentType: 'application/xml',
        body: '<?xml version="1.0"?><EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/metadata">...</EntityDescriptor>',
      },
      codeSamples: {
        curl: `curl -X GET https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/metadata`,
        python: `import requests

response = requests.get(
    "https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/metadata"
)
# Returns SAML SP metadata XML
print(response.text)`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/metadata'
);
const xml = await response.text();
console.log(xml);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/metadata"))
    .GET()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
// XML metadata returned
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    resp, _ := http.Get(
        "https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/metadata",
    )
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    // XML metadata
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/sso/saml/org_01hx9k2m4p/metadata');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$xml = curl_exec($ch);
curl_close($ch);
// Parse or save the SAML SP metadata XML
echo $xml;`,
      },
    },

    // -------------------------------------------------------------------------
    // 11. Initiate OIDC Login
    // -------------------------------------------------------------------------
    {
      id: 'sso-oidc-login',
      method: 'GET',
      path: '/api/v1/sso/oidc/:providerId/login',
      title: 'Initiate OIDC Login',
      description: 'Begin an OIDC authorization code flow with PKCE. The server generates a code verifier/challenge pair, stores state, and returns an HTTP 302 redirect to the OIDC authorization endpoint.',
      auth: 'none',
      parameters: [
        {
          name: 'providerId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the OIDC SSO provider.',
          example: 'sso_02hy0l3n5q',
        },
      ],
      responseFields: [
        { name: '(HTTP 302)', type: 'redirect', description: 'Redirects the browser to the OIDC authorization URL with PKCE parameters.' },
        { name: 'Location', type: 'string', description: 'Authorization endpoint URL with query parameters.', example: 'https://acme.okta.com/oauth2/v1/authorize?client_id=...&code_challenge=...&state=...' },
      ],
      responseSample: {
        status: 302,
        headers: {
          Location: 'https://acme.okta.com/oauth2/v1/authorize?response_type=code&client_id=0oa1abc&scope=openid+email+profile&redirect_uri=https%3A%2F%2Fapi.sutraid.com%2Fapi%2Fv1%2Fsso%2Foidc%2Fsso_02hy0l3n5q%2Fcallback&state=abc123&code_challenge=xyzPKCE&code_challenge_method=S256',
        },
      },
      codeSamples: {
        curl: `# Open in a browser or follow redirects with -L
curl -L "https://api.sutraid.com/api/v1/sso/oidc/sso_02hy0l3n5q/login"`,
        python: `import webbrowser

# Redirect the user's browser to begin the OIDC flow
url = "https://api.sutraid.com/api/v1/sso/oidc/sso_02hy0l3n5q/login"
webbrowser.open(url)`,
        nodejs: `// Redirect the user from an Express route handler
app.get('/sso/oidc/login', (req, res) => {
  res.redirect(
    'https://api.sutraid.com/api/v1/sso/oidc/sso_02hy0l3n5q/login'
  );
});`,
        java: `// Redirect from a Servlet or Spring controller
response.sendRedirect(
    "https://api.sutraid.com/api/v1/sso/oidc/sso_02hy0l3n5q/login"
);`,
        go: `package main

import "net/http"

func oidcLoginHandler(w http.ResponseWriter, r *http.Request) {
    http.Redirect(w, r,
        "https://api.sutraid.com/api/v1/sso/oidc/sso_02hy0l3n5q/login",
        http.StatusFound)
}`,
        php: `<?php
header('Location: https://api.sutraid.com/api/v1/sso/oidc/sso_02hy0l3n5q/login', true, 302);
exit;`,
      },
    },

    // -------------------------------------------------------------------------
    // 12. OIDC Callback
    // -------------------------------------------------------------------------
    {
      id: 'sso-oidc-callback',
      method: 'GET',
      path: '/api/v1/sso/oidc/:providerId/callback',
      title: 'OIDC Callback',
      description: 'Handles the authorization code callback from the OIDC provider. The server exchanges the code for tokens using PKCE, retrieves the user profile, provisions or resolves the user, issues a JWT, and redirects to the frontend callback URL.',
      auth: 'none',
      parameters: [
        {
          name: 'providerId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the OIDC SSO provider.',
          example: 'sso_02hy0l3n5q',
        },
        {
          name: 'code',
          in: 'query',
          type: 'string',
          required: true,
          description: 'Authorization code returned by the OIDC provider.',
          example: 'SplxlOBeZQQYbYS6WxSbIA',
        },
        {
          name: 'state',
          in: 'query',
          type: 'string',
          required: true,
          description: 'Opaque state value that must match the value from the login request.',
          example: 'abc123xyz',
        },
      ],
      responseFields: [
        { name: '(HTTP 302)', type: 'redirect', description: 'Redirects to the frontend callback URL with an access token.' },
        { name: 'Location', type: 'string', description: 'Frontend callback URL containing the issued JWT.', example: 'https://app.sutraid.com/auth/sso/callback?token=eyJhbGc...' },
      ],
      responseSample: {
        status: 302,
        headers: {
          Location: 'https://app.sutraid.com/auth/sso/callback?token=eyJhbGciOiJSUzI1NiJ9...',
        },
      },
      codeSamples: {
        curl: `# The OIDC provider redirects the user's browser here automatically.
# Simulating the callback with curl (follow redirects to see final destination):
curl -L "https://api.sutraid.com/api/v1/sso/oidc/sso_02hy0l3n5q/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=abc123xyz"`,
        python: `import requests

# The OIDC provider redirects the user's browser to this URL.
# Simulating for testing:
response = requests.get(
    "https://api.sutraid.com/api/v1/sso/oidc/sso_02hy0l3n5q/callback",
    params={
        "code": "SplxlOBeZQQYbYS6WxSbIA",
        "state": "abc123xyz"
    },
    allow_redirects=False
)
print(response.headers.get("Location"))`,
        nodejs: `// The OIDC provider redirects the user's browser here automatically.
// In an Express app, register a matching callback route:
app.get('/auth/oidc/callback', async (req, res) => {
  const { code, state } = req.query;
  const upstream = await fetch(
    \`https://api.sutraid.com/api/v1/sso/oidc/sso_02hy0l3n5q/callback?code=\${code}&state=\${state}\`,
    { redirect: 'manual' }
  );
  const location = upstream.headers.get('location');
  res.redirect(location);
});`,
        java: `// The OIDC provider redirects the user's browser here.
// Spring Boot controller example to proxy the callback:
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import java.net.*;

@RestController
public class OidcCallbackProxy {
    @GetMapping("/auth/oidc/callback")
    public ResponseEntity<Void> callback(
            @RequestParam String code,
            @RequestParam String state) throws Exception {
        String target = "https://api.sutraid.com/api/v1/sso/oidc/sso_02hy0l3n5q/callback"
            + "?code=" + URLEncoder.encode(code, "UTF-8")
            + "&state=" + URLEncoder.encode(state, "UTF-8");
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(target))
            .build();
    }
}`,
        go: `package main

import (
    "fmt"
    "net/http"
    "io"
)

func oidcCallbackHandler(w http.ResponseWriter, r *http.Request) {
    code := r.URL.Query().Get("code")
    state := r.URL.Query().Get("state")
    target := fmt.Sprintf(
        "https://api.sutraid.com/api/v1/sso/oidc/sso_02hy0l3n5q/callback?code=%s&state=%s",
        code, state,
    )
    resp, _ := http.Get(target)
    defer resp.Body.Close()
    _, _ = io.ReadAll(resp.Body)
    location := resp.Header.Get("Location")
    http.Redirect(w, r, location, http.StatusFound)
}`,
        php: `<?php
// The OIDC provider redirects the user's browser to the callback URL.
// Forwarding to the SutraID API callback handler:
$code  = urlencode($_GET['code']  ?? '');
$state = urlencode($_GET['state'] ?? '');

$target = "https://api.sutraid.com/api/v1/sso/oidc/sso_02hy0l3n5q/callback"
        . "?code={$code}&state={$state}";

$ch = curl_init($target);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);

curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);

if ($info['http_code'] === 302) {
    header('Location: ' . $info['redirect_url'], true, 302);
    exit;
}`,
      },
    },
  ],
};
