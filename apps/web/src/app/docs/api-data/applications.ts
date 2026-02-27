import { DocSection } from './types';

export const applicationsSection: DocSection = {
  title: 'Applications',
  slug: 'applications',
  description:
    'OIDC and SAML application management, OAuth 2.0 token operations, and dynamic client registration.',
  endpoints: [
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Create Application
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'create-application',
      method: 'POST',
      path: '/api/v1/applications',
      title: 'Create Application',
      description:
        'Create a new OIDC or SAML application within an organization. Returns the newly created application record including the generated clientId and clientSecret.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hxyz',
        },
      ],
      requestBody: [
        {
          name: 'name',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Display name of the application (max 100 characters).',
          example: 'My Web App',
        },
        {
          name: 'description',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Optional description of the application (max 500 characters).',
          example: 'Customer-facing web application.',
        },
        {
          name: 'logoUrl',
          in: 'body',
          type: 'string',
          required: false,
          description: 'URL of the application logo.',
          example: 'https://cdn.example.com/logo.png',
        },
        {
          name: 'type',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Protocol type of the application.',
          example: 'OIDC',
          enum: ['OIDC', 'SAML'],
        },
        {
          name: 'redirectUris',
          in: 'body',
          type: 'string[]',
          required: false,
          description: 'Allowed redirect URIs for OAuth 2.0 / OIDC flows.',
          example: '["https://app.example.com/callback"]',
        },
        {
          name: 'grantTypes',
          in: 'body',
          type: 'string[]',
          required: false,
          description: 'Allowed OAuth 2.0 grant types.',
          example: '["authorization_code", "refresh_token"]',
        },
        {
          name: 'responseTypes',
          in: 'body',
          type: 'string[]',
          required: false,
          description: 'Allowed OAuth 2.0 response types.',
          example: '["code"]',
        },
        {
          name: 'scopes',
          in: 'body',
          type: 'string[]',
          required: false,
          description: 'Allowed OAuth 2.0 / OIDC scopes.',
          example: '["openid", "profile", "email"]',
        },
        {
          name: 'tokenEndpointAuthMethod',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Client authentication method at the token endpoint.',
          example: 'client_secret_post',
        },
        {
          name: 'isPublicClient',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Whether the application is a public client (e.g. SPA or mobile app).',
          example: 'false',
        },
        {
          name: 'requireDpop',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Whether Demonstrating Proof-of-Possession (DPoP) is required.',
          example: 'false',
        },
        {
          name: 'jwks',
          in: 'body',
          type: 'object',
          required: false,
          description: 'JSON Web Key Set for the application.',
          example: '{"keys": [...]}',
        },
        {
          name: 'dpopNonceEnabled',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Whether DPoP nonce checking is enabled.',
          example: 'false',
        },
        {
          name: 'isAiAgent',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Whether this application represents an AI agent.',
          example: 'false',
        },
        {
          name: 'samlEntityId',
          in: 'body',
          type: 'string',
          required: false,
          description: 'SAML IdP entity ID (required for SAML applications).',
          example: 'https://sutraid.com/saml/idp',
        },
        {
          name: 'samlSpEntityId',
          in: 'body',
          type: 'string',
          required: false,
          description: 'SAML Service Provider entity ID.',
          example: 'https://app.example.com/saml/sp',
        },
        {
          name: 'samlSpAcsUrl',
          in: 'body',
          type: 'string',
          required: false,
          description: 'SAML Assertion Consumer Service URL.',
          example: 'https://app.example.com/saml/acs',
        },
        {
          name: 'samlNameIdFormat',
          in: 'body',
          type: 'string',
          required: false,
          description: 'SAML NameID format.',
          example: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        },
        {
          name: 'samlAttributeMapping',
          in: 'body',
          type: 'object',
          required: false,
          description: 'Mapping of SAML attributes to user profile fields.',
          example: '{"email": "user.email", "firstName": "user.firstName"}',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Application ID.', example: 'app_01hxyz' },
        { name: 'name', type: 'string', description: 'Application name.', example: 'My Web App' },
        {
          name: 'type',
          type: 'string',
          description: 'Protocol type.',
          example: 'OIDC',
        },
        {
          name: 'clientId',
          type: 'string',
          description: 'Generated OAuth 2.0 client ID.',
          example: 'cid_abc123',
        },
        {
          name: 'clientSecret',
          type: 'string',
          description: 'Generated OAuth 2.0 client secret (shown once).',
          example: 'cs_secret_value',
        },
        {
          name: 'organizationId',
          type: 'string',
          description: 'Owning organization ID.',
          example: 'org_01hxyz',
        },
        {
          name: 'createdAt',
          type: 'string',
          description: 'ISO 8601 creation timestamp.',
          example: '2025-01-15T10:30:00Z',
        },
      ],
      responseSample: {
        id: 'app_01hxyz',
        name: 'My Web App',
        description: 'Customer-facing web application.',
        type: 'OIDC',
        clientId: 'cid_abc123',
        clientSecret: 'cs_secret_value',
        redirectUris: ['https://app.example.com/callback'],
        grantTypes: ['authorization_code', 'refresh_token'],
        responseTypes: ['code'],
        scopes: ['openid', 'profile', 'email'],
        tokenEndpointAuthMethod: 'client_secret_post',
        isPublicClient: false,
        requireDpop: false,
        dpopNonceEnabled: false,
        isAiAgent: false,
        organizationId: 'org_01hxyz',
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T10:30:00Z',
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Web App",
    "description": "Customer-facing web application.",
    "type": "OIDC",
    "redirectUris": ["https://app.example.com/callback"],
    "grantTypes": ["authorization_code", "refresh_token"],
    "responseTypes": ["code"],
    "scopes": ["openid", "profile", "email"],
    "tokenEndpointAuthMethod": "client_secret_post",
    "isPublicClient": false
  }'`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications"
headers = {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
}
payload = {
    "name": "My Web App",
    "description": "Customer-facing web application.",
    "type": "OIDC",
    "redirectUris": ["https://app.example.com/callback"],
    "grantTypes": ["authorization_code", "refresh_token"],
    "responseTypes": ["code"],
    "scopes": ["openid", "profile", "email"],
    "tokenEndpointAuthMethod": "client_secret_post",
    "isPublicClient": False
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'My Web App',
      description: 'Customer-facing web application.',
      type: 'OIDC',
      redirectUris: ['https://app.example.com/callback'],
      grantTypes: ['authorization_code', 'refresh_token'],
      responseTypes: ['code'],
      scopes: ['openid', 'profile', 'email'],
      tokenEndpointAuthMethod: 'client_secret_post',
      isPublicClient: false,
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
      "name": "My Web App",
      "description": "Customer-facing web application.",
      "type": "OIDC",
      "redirectUris": ["https://app.example.com/callback"],
      "grantTypes": ["authorization_code", "refresh_token"],
      "responseTypes": ["code"],
      "scopes": ["openid", "profile", "email"],
      "tokenEndpointAuthMethod": "client_secret_post",
      "isPublicClient": false
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications"))
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
        "name":        "My Web App",
        "description": "Customer-facing web application.",
        "type":        "OIDC",
        "redirectUris": []string{"https://app.example.com/callback"},
        "grantTypes":  []string{"authorization_code", "refresh_token"},
        "responseTypes": []string{"code"},
        "scopes":      []string{"openid", "profile", "email"},
        "tokenEndpointAuthMethod": "client_secret_post",
        "isPublicClient": false,
    }
    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications",
        bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer <token>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications');
$payload = json_encode([
    'name'        => 'My Web App',
    'description' => 'Customer-facing web application.',
    'type'        => 'OIDC',
    'redirectUris' => ['https://app.example.com/callback'],
    'grantTypes'  => ['authorization_code', 'refresh_token'],
    'responseTypes' => ['code'],
    'scopes'      => ['openid', 'profile', 'email'],
    'tokenEndpointAuthMethod' => 'client_secret_post',
    'isPublicClient' => false,
]);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer <token>',
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 2. List Applications
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'list-applications',
      method: 'GET',
      path: '/api/v1/applications',
      title: 'List Applications',
      description:
        'Retrieve all applications belonging to an organization.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hxyz',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Application ID.', example: 'app_01hxyz' },
        { name: 'name', type: 'string', description: 'Application name.', example: 'My Web App' },
        { name: 'type', type: 'string', description: 'Protocol type.', example: 'OIDC' },
        { name: 'clientId', type: 'string', description: 'OAuth 2.0 client ID.', example: 'cid_abc123' },
        { name: 'organizationId', type: 'string', description: 'Owning organization ID.', example: 'org_01hxyz' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 creation timestamp.', example: '2025-01-15T10:30:00Z' },
      ],
      responseSample: {
        data: [
          {
            id: 'app_01hxyz',
            name: 'My Web App',
            type: 'OIDC',
            clientId: 'cid_abc123',
            organizationId: 'org_01hxyz',
            createdAt: '2025-01-15T10:30:00Z',
            updatedAt: '2025-01-15T10:30:00Z',
          },
          {
            id: 'app_02abcd',
            name: 'Enterprise SAML App',
            type: 'SAML',
            clientId: 'cid_def456',
            organizationId: 'org_01hxyz',
            createdAt: '2025-01-20T09:00:00Z',
            updatedAt: '2025-01-20T09:00:00Z',
          },
        ],
      },
      codeSamples: {
        curl: `curl -X GET https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications \\
  -H "Authorization: Bearer <token>"`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications"
headers = {"Authorization": "Bearer <token>"}

response = requests.get(url, headers=headers)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications',
  {
    method: 'GET',
    headers: { 'Authorization': 'Bearer <token>' },
  }
);
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications"))
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
        "https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications", nil)
    req.Header.Set("Authorization", "Bearer <token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Authorization: Bearer <token>'],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Get Application
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'get-application',
      method: 'GET',
      path: '/api/v1/applications/:appId',
      title: 'Get Application',
      description: 'Retrieve a single application by its ID.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hxyz',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the application.',
          example: 'app_01hxyz',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Application ID.', example: 'app_01hxyz' },
        { name: 'name', type: 'string', description: 'Application name.', example: 'My Web App' },
        { name: 'type', type: 'string', description: 'Protocol type.', example: 'OIDC' },
        { name: 'clientId', type: 'string', description: 'OAuth 2.0 client ID.', example: 'cid_abc123' },
        { name: 'redirectUris', type: 'string[]', description: 'Allowed redirect URIs.', example: '["https://app.example.com/callback"]' },
        { name: 'grantTypes', type: 'string[]', description: 'Allowed grant types.', example: '["authorization_code"]' },
        { name: 'scopes', type: 'string[]', description: 'Allowed scopes.', example: '["openid", "profile", "email"]' },
        { name: 'organizationId', type: 'string', description: 'Owning organization ID.', example: 'org_01hxyz' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 creation timestamp.', example: '2025-01-15T10:30:00Z' },
      ],
      responseSample: {
        id: 'app_01hxyz',
        name: 'My Web App',
        description: 'Customer-facing web application.',
        type: 'OIDC',
        clientId: 'cid_abc123',
        redirectUris: ['https://app.example.com/callback'],
        grantTypes: ['authorization_code', 'refresh_token'],
        responseTypes: ['code'],
        scopes: ['openid', 'profile', 'email'],
        tokenEndpointAuthMethod: 'client_secret_post',
        isPublicClient: false,
        requireDpop: false,
        dpopNonceEnabled: false,
        isAiAgent: false,
        organizationId: 'org_01hxyz',
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T10:30:00Z',
      },
      codeSamples: {
        curl: `curl -X GET https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz \\
  -H "Authorization: Bearer <token>"`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz"
headers = {"Authorization": "Bearer <token>"}

response = requests.get(url, headers=headers)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz',
  {
    method: 'GET',
    headers: { 'Authorization': 'Bearer <token>' },
  }
);
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz"))
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
        "https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz", nil)
    req.Header.Set("Authorization", "Bearer <token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Authorization: Bearer <token>'],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Update Application
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'update-application',
      method: 'PUT',
      path: '/api/v1/applications/:appId',
      title: 'Update Application',
      description:
        'Update an existing application. All body fields mirror CreateApplicationDto and are optional (partial update).',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hxyz',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the application.',
          example: 'app_01hxyz',
        },
      ],
      requestBody: [
        {
          name: 'name',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Updated display name (max 100 characters).',
          example: 'My Updated App',
        },
        {
          name: 'description',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Updated description (max 500 characters).',
          example: 'Updated description.',
        },
        {
          name: 'redirectUris',
          in: 'body',
          type: 'string[]',
          required: false,
          description: 'Updated list of allowed redirect URIs.',
          example: '["https://app.example.com/callback", "https://app.example.com/silent-renew"]',
        },
        {
          name: 'scopes',
          in: 'body',
          type: 'string[]',
          required: false,
          description: 'Updated list of allowed scopes.',
          example: '["openid", "profile", "email", "phone"]',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Application ID.', example: 'app_01hxyz' },
        { name: 'name', type: 'string', description: 'Updated application name.', example: 'My Updated App' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 update timestamp.', example: '2025-02-01T12:00:00Z' },
      ],
      responseSample: {
        id: 'app_01hxyz',
        name: 'My Updated App',
        description: 'Updated description.',
        type: 'OIDC',
        clientId: 'cid_abc123',
        redirectUris: ['https://app.example.com/callback', 'https://app.example.com/silent-renew'],
        grantTypes: ['authorization_code', 'refresh_token'],
        responseTypes: ['code'],
        scopes: ['openid', 'profile', 'email', 'phone'],
        tokenEndpointAuthMethod: 'client_secret_post',
        isPublicClient: false,
        organizationId: 'org_01hxyz',
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-02-01T12:00:00Z',
      },
      codeSamples: {
        curl: `curl -X PUT https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Updated App",
    "redirectUris": ["https://app.example.com/callback", "https://app.example.com/silent-renew"],
    "scopes": ["openid", "profile", "email", "phone"]
  }'`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz"
headers = {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
}
payload = {
    "name": "My Updated App",
    "redirectUris": ["https://app.example.com/callback", "https://app.example.com/silent-renew"],
    "scopes": ["openid", "profile", "email", "phone"]
}

response = requests.put(url, headers=headers, json=payload)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz',
  {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'My Updated App',
      redirectUris: ['https://app.example.com/callback', 'https://app.example.com/silent-renew'],
      scopes: ['openid', 'profile', 'email', 'phone'],
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
      "name": "My Updated App",
      "redirectUris": ["https://app.example.com/callback", "https://app.example.com/silent-renew"],
      "scopes": ["openid", "profile", "email", "phone"]
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz"))
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
        "name": "My Updated App",
        "redirectUris": []string{
            "https://app.example.com/callback",
            "https://app.example.com/silent-renew",
        },
        "scopes": []string{"openid", "profile", "email", "phone"},
    }
    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("PUT",
        "https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz",
        bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer <token>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz');
$payload = json_encode([
    'name'         => 'My Updated App',
    'redirectUris' => ['https://app.example.com/callback', 'https://app.example.com/silent-renew'],
    'scopes'       => ['openid', 'profile', 'email', 'phone'],
]);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST  => 'PUT',
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer <token>',
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Rotate Client Secret
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'rotate-client-secret',
      method: 'POST',
      path: '/api/v1/applications/:appId/rotate-secret',
      title: 'Rotate Client Secret',
      description:
        'Generate a new client secret for an application, invalidating the previous one. Store the returned secret immediately — it will not be shown again.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hxyz',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the application.',
          example: 'app_01hxyz',
        },
      ],
      responseFields: [
        {
          name: 'clientSecret',
          type: 'string',
          description: 'New client secret. Store this value securely — it will not be shown again.',
          example: 'cs_new_secret_value',
        },
      ],
      responseSample: {
        clientSecret: 'cs_new_secret_value',
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/rotate-secret \\
  -H "Authorization: Bearer <token>"`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/rotate-secret"
headers = {"Authorization": "Bearer <token>"}

response = requests.post(url, headers=headers)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/rotate-secret',
  {
    method: 'POST',
    headers: { 'Authorization': 'Bearer <token>' },
  }
);
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/rotate-secret"))
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
        "https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/rotate-secret",
        nil)
    req.Header.Set("Authorization", "Bearer <token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/rotate-secret');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => ['Authorization: Bearer <token>'],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Delete Application
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'delete-application',
      method: 'DELETE',
      path: '/api/v1/applications/:appId',
      title: 'Delete Application',
      description:
        'Permanently delete an application and all associated OAuth tokens and configurations.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hxyz',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the application.',
          example: 'app_01hxyz',
        },
      ],
      responseFields: [
        {
          name: 'deleted',
          type: 'boolean',
          description: 'Whether the application was successfully deleted.',
          example: 'true',
        },
        {
          name: 'id',
          type: 'string',
          description: 'ID of the deleted application.',
          example: 'app_01hxyz',
        },
      ],
      responseSample: {
        deleted: true,
        id: 'app_01hxyz',
      },
      codeSamples: {
        curl: `curl -X DELETE https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz \\
  -H "Authorization: Bearer <token>"`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz"
headers = {"Authorization": "Bearer <token>"}

response = requests.delete(url, headers=headers)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz',
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
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz"))
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
        "https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz", nil)
    req.Header.Set("Authorization", "Bearer <token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST  => 'DELETE',
    CURLOPT_HTTPHEADER     => ['Authorization: Bearer <token>'],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Assign Users to Application
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'assign-users-to-application',
      method: 'PUT',
      path: '/api/v1/applications/:appId/users',
      title: 'Assign Users to Application',
      description:
        'Replace the full set of users assigned to an application. The provided list of userIds becomes the authoritative assignment.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hxyz',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the application.',
          example: 'app_01hxyz',
        },
      ],
      requestBody: [
        {
          name: 'userIds',
          in: 'body',
          type: 'string[]',
          required: true,
          description: 'Array of user IDs to assign to the application.',
          example: '["user_abc", "user_def"]',
        },
      ],
      responseFields: [
        {
          name: 'applicationId',
          type: 'string',
          description: 'Application ID.',
          example: 'app_01hxyz',
        },
        {
          name: 'userIds',
          type: 'string[]',
          description: 'Updated list of assigned user IDs.',
          example: '["user_abc", "user_def"]',
        },
      ],
      responseSample: {
        applicationId: 'app_01hxyz',
        userIds: ['user_abc', 'user_def'],
      },
      codeSamples: {
        curl: `curl -X PUT https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/users \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"userIds": ["user_abc", "user_def"]}'`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/users"
headers = {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
}
payload = {"userIds": ["user_abc", "user_def"]}

response = requests.put(url, headers=headers, json=payload)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/users',
  {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userIds: ['user_abc', 'user_def'] }),
  }
);
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = "{\"userIds\": [\"user_abc\", \"user_def\"]}";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/users"))
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
    payload := map[string][]string{
        "userIds": {"user_abc", "user_def"},
    }
    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("PUT",
        "https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/users",
        bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer <token>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/users');
$payload = json_encode(['userIds' => ['user_abc', 'user_def']]);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST  => 'PUT',
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer <token>',
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Assign Groups to Application
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'assign-groups-to-application',
      method: 'PUT',
      path: '/api/v1/applications/:appId/groups',
      title: 'Assign Groups to Application',
      description:
        'Replace the full set of groups assigned to an application. The provided list of groupIds becomes the authoritative assignment.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hxyz',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the application.',
          example: 'app_01hxyz',
        },
      ],
      requestBody: [
        {
          name: 'groupIds',
          in: 'body',
          type: 'string[]',
          required: true,
          description: 'Array of group IDs to assign to the application.',
          example: '["grp_xyz", "grp_abc"]',
        },
      ],
      responseFields: [
        {
          name: 'applicationId',
          type: 'string',
          description: 'Application ID.',
          example: 'app_01hxyz',
        },
        {
          name: 'groupIds',
          type: 'string[]',
          description: 'Updated list of assigned group IDs.',
          example: '["grp_xyz", "grp_abc"]',
        },
      ],
      responseSample: {
        applicationId: 'app_01hxyz',
        groupIds: ['grp_xyz', 'grp_abc'],
      },
      codeSamples: {
        curl: `curl -X PUT https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/groups \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"groupIds": ["grp_xyz", "grp_abc"]}'`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/groups"
headers = {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
}
payload = {"groupIds": ["grp_xyz", "grp_abc"]}

response = requests.put(url, headers=headers, json=payload)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/groups',
  {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ groupIds: ['grp_xyz', 'grp_abc'] }),
  }
);
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = "{\"groupIds\": [\"grp_xyz\", \"grp_abc\"]}";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/groups"))
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
    payload := map[string][]string{
        "groupIds": {"grp_xyz", "grp_abc"},
    }
    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("PUT",
        "https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/groups",
        bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer <token>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/organizations/org_01hxyz/applications/app_01hxyz/groups');
$payload = json_encode(['groupIds' => ['grp_xyz', 'grp_abc']]);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST  => 'PUT',
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer <token>',
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 9. OAuth Token Exchange
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'oauth-token',
      method: 'POST',
      path: '/api/v1/oauth/token',
      title: 'Token Exchange',
      description:
        'Exchange an authorization code or refresh token for access tokens. Supports the authorization_code and refresh_token grant types. Client credentials can be sent either via HTTP Basic authentication or in the request body.',
      auth: 'basic',
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          type: 'string',
          required: false,
          description: 'HTTP Basic credentials: Base64-encoded "client_id:client_secret".',
          example: 'Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=',
        },
      ],
      requestBody: [
        {
          name: 'grant_type',
          in: 'body',
          type: 'string',
          required: true,
          description: 'OAuth 2.0 grant type.',
          example: 'authorization_code',
          enum: ['authorization_code', 'refresh_token'],
        },
        {
          name: 'code',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Authorization code received from the authorization endpoint (required for authorization_code grant).',
          example: 'SplxlOBeZQQYbYS6WxSbIA',
        },
        {
          name: 'refresh_token',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Refresh token (required for refresh_token grant).',
          example: 'tGzv3JOkF0XG5Qx2TlKWIA',
        },
        {
          name: 'client_id',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Client ID (alternative to Basic auth).',
          example: 'cid_abc123',
        },
        {
          name: 'client_secret',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Client secret (alternative to Basic auth).',
          example: 'cs_secret_value',
        },
        {
          name: 'scope',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Space-delimited list of requested scopes.',
          example: 'openid profile email',
        },
      ],
      responseFields: [
        {
          name: 'access_token',
          type: 'string',
          description: 'JWT access token.',
          example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        {
          name: 'token_type',
          type: 'string',
          description: 'Token type, always "Bearer".',
          example: 'Bearer',
        },
        {
          name: 'expires_in',
          type: 'number',
          description: 'Token lifetime in seconds.',
          example: '3600',
        },
        {
          name: 'scope',
          type: 'string',
          description: 'Space-delimited list of granted scopes.',
          example: 'openid profile email',
        },
        {
          name: 'refresh_token',
          type: 'string',
          description: 'Refresh token (if refresh_token grant type was included).',
          example: 'tGzv3JOkF0XG5Qx2TlKWIA',
        },
      ],
      responseSample: {
        access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX2FiYyJ9.signature',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid profile email',
        refresh_token: 'tGzv3JOkF0XG5Qx2TlKWIA',
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/oauth/token \\
  -H "Authorization: Basic $(echo -n 'cid_abc123:cs_secret_value' | base64)" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA&scope=openid%20profile%20email"`,
        python: `import requests
from base64 import b64encode

credentials = b64encode(b"cid_abc123:cs_secret_value").decode("ascii")
url = "https://api.sutraid.com/api/v1/oauth/token"
headers = {
    "Authorization": f"Basic {credentials}",
    "Content-Type": "application/x-www-form-urlencoded"
}
data = {
    "grant_type": "authorization_code",
    "code": "SplxlOBeZQQYbYS6WxSbIA",
    "scope": "openid profile email"
}

response = requests.post(url, headers=headers, data=data)
print(response.json())`,
        nodejs: `import { Buffer } from 'buffer';

const credentials = Buffer.from('cid_abc123:cs_secret_value').toString('base64');

const params = new URLSearchParams({
  grant_type: 'authorization_code',
  code: 'SplxlOBeZQQYbYS6WxSbIA',
  scope: 'openid profile email',
});

const response = await fetch('https://api.sutraid.com/api/v1/oauth/token', {
  method: 'POST',
  headers: {
    'Authorization': \`Basic \${credentials}\`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: params.toString(),
});
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;
import java.util.Base64;

HttpClient client = HttpClient.newHttpClient();
String credentials = Base64.getEncoder()
    .encodeToString("cid_abc123:cs_secret_value".getBytes());

String body = "grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA&scope=openid%20profile%20email";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/oauth/token"))
    .header("Authorization", "Basic " + credentials)
    .header("Content-Type", "application/x-www-form-urlencoded")
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "encoding/base64"
    "fmt"
    "net/http"
    "net/url"
    "strings"
    "io"
)

func main() {
    credentials := base64.StdEncoding.EncodeToString([]byte("cid_abc123:cs_secret_value"))

    params := url.Values{}
    params.Set("grant_type", "authorization_code")
    params.Set("code", "SplxlOBeZQQYbYS6WxSbIA")
    params.Set("scope", "openid profile email")

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/oauth/token",
        strings.NewReader(params.Encode()))
    req.Header.Set("Authorization", "Basic "+credentials)
    req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$credentials = base64_encode('cid_abc123:cs_secret_value');
$ch = curl_init('https://api.sutraid.com/api/v1/oauth/token');

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query([
        'grant_type' => 'authorization_code',
        'code'       => 'SplxlOBeZQQYbYS6WxSbIA',
        'scope'      => 'openid profile email',
    ]),
    CURLOPT_HTTPHEADER     => [
        'Authorization: Basic ' . $credentials,
        'Content-Type: application/x-www-form-urlencoded',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 10. Introspect Token
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'oauth-introspect',
      method: 'POST',
      path: '/api/v1/oauth/introspect',
      title: 'Introspect Token',
      description:
        'Determine whether a token is active and retrieve its metadata, as defined in RFC 7662.',
      auth: 'none',
      requestBody: [
        {
          name: 'token',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The token to introspect (access token or refresh token).',
          example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        {
          name: 'client_id',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Client ID of the requesting application.',
          example: 'cid_abc123',
        },
      ],
      responseFields: [
        {
          name: 'active',
          type: 'boolean',
          description: 'Whether the token is currently active.',
          example: 'true',
        },
        {
          name: 'scope',
          type: 'string',
          description: 'Space-delimited list of scopes associated with the token.',
          example: 'openid profile email',
        },
        {
          name: 'client_id',
          type: 'string',
          description: 'Client ID the token was issued to.',
          example: 'cid_abc123',
        },
        {
          name: 'exp',
          type: 'number',
          description: 'Unix timestamp at which the token expires.',
          example: '1736944200',
        },
        {
          name: 'sub',
          type: 'string',
          description: 'Subject identifier (user ID).',
          example: 'user_abc',
        },
      ],
      responseSample: {
        active: true,
        scope: 'openid profile email',
        client_id: 'cid_abc123',
        exp: 1736944200,
        sub: 'user_abc',
        iat: 1736940600,
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/oauth/introspect \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "client_id": "cid_abc123"
  }'`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/oauth/introspect"
payload = {
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "client_id": "cid_abc123"
}

response = requests.post(url, json=payload)
print(response.json())`,
        nodejs: `const response = await fetch('https://api.sutraid.com/api/v1/oauth/introspect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    client_id: 'cid_abc123',
  }),
});
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = """
    {
      "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "client_id": "cid_abc123"
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/oauth/introspect"))
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
    "io"
)

func main() {
    payload := map[string]string{
        "token":     "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
        "client_id": "cid_abc123",
    }
    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/oauth/introspect",
        bytes.NewBuffer(jsonData))
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/oauth/introspect');
$payload = json_encode([
    'token'     => 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    'client_id' => 'cid_abc123',
]);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 11. Revoke Token
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'oauth-revoke',
      method: 'POST',
      path: '/api/v1/oauth/revoke',
      title: 'Revoke Token',
      description:
        'Immediately revoke an access token or refresh token, as defined in RFC 7009. Revoked tokens are rejected by the introspection endpoint.',
      auth: 'none',
      requestBody: [
        {
          name: 'token',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The token to revoke.',
          example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      ],
      responseFields: [
        {
          name: 'status',
          type: 'string',
          description: 'Revocation status.',
          example: 'revoked',
        },
      ],
      responseSample: {
        status: 'revoked',
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/oauth/revoke \\
  -H "Content-Type: application/json" \\
  -d '{"token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."}'`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/oauth/revoke"
payload = {"token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."}

response = requests.post(url, json=payload)
print(response.json())`,
        nodejs: `const response = await fetch('https://api.sutraid.com/api/v1/oauth/revoke', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' }),
});
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = "{\"token\": \"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...\"}";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/oauth/revoke"))
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
    "io"
)

func main() {
    payload := map[string]string{
        "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    }
    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/oauth/revoke",
        bytes.NewBuffer(jsonData))
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/oauth/revoke');
$payload = json_encode(['token' => 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...']);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 12. Dynamic Client Registration
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'oauth-register',
      method: 'POST',
      path: '/api/v1/oauth/register',
      title: 'Dynamic Client Registration',
      description:
        'Register a new OAuth 2.0 client dynamically, as per RFC 7591. Requires an x-api-token header for authorization. Returns client credentials and a registration access token for subsequent management.',
      auth: 'none',
      parameters: [
        {
          name: 'x-api-token',
          in: 'header',
          type: 'string',
          required: true,
          description: 'API token used to authorize dynamic client registration.',
          example: 'apitok_xyz789',
        },
      ],
      requestBody: [
        {
          name: 'client_name',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Human-readable name for the client.',
          example: 'My AI Agent',
        },
        {
          name: 'organization_id',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Organization ID the client will be registered under.',
          example: 'org_01hxyz',
        },
        {
          name: 'scope',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Space-delimited list of requested scopes.',
          example: 'openid profile email',
        },
        {
          name: 'jwks',
          in: 'body',
          type: 'object',
          required: false,
          description: 'JSON Web Key Set for the client (used for private_key_jwt auth).',
          example: '{"keys": [...]}',
        },
      ],
      responseFields: [
        {
          name: 'client_id',
          type: 'string',
          description: 'Generated client ID.',
          example: 'cid_dynamic_abc',
        },
        {
          name: 'client_secret',
          type: 'string',
          description: 'Generated client secret.',
          example: 'cs_dynamic_secret',
        },
        {
          name: 'registration_access_token',
          type: 'string',
          description: 'Token used to manage this client registration.',
          example: 'rat_xyz',
        },
        {
          name: 'registration_client_uri',
          type: 'string',
          description: 'URI for managing this client registration.',
          example: 'https://api.sutraid.com/api/v1/oauth/register/cid_dynamic_abc',
        },
      ],
      responseSample: {
        client_id: 'cid_dynamic_abc',
        client_secret: 'cs_dynamic_secret',
        registration_access_token: 'rat_xyz789',
        registration_client_uri: 'https://api.sutraid.com/api/v1/oauth/register/cid_dynamic_abc',
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/oauth/register \\
  -H "x-api-token: apitok_xyz789" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_name": "My AI Agent",
    "organization_id": "org_01hxyz",
    "scope": "openid profile email"
  }'`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/oauth/register"
headers = {
    "x-api-token": "apitok_xyz789",
    "Content-Type": "application/json"
}
payload = {
    "client_name": "My AI Agent",
    "organization_id": "org_01hxyz",
    "scope": "openid profile email"
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`,
        nodejs: `const response = await fetch('https://api.sutraid.com/api/v1/oauth/register', {
  method: 'POST',
  headers: {
    'x-api-token': 'apitok_xyz789',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    client_name: 'My AI Agent',
    organization_id: 'org_01hxyz',
    scope: 'openid profile email',
  }),
});
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = """
    {
      "client_name": "My AI Agent",
      "organization_id": "org_01hxyz",
      "scope": "openid profile email"
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/oauth/register"))
    .header("x-api-token", "apitok_xyz789")
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
    "io"
)

func main() {
    payload := map[string]string{
        "client_name":     "My AI Agent",
        "organization_id": "org_01hxyz",
        "scope":           "openid profile email",
    }
    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/oauth/register",
        bytes.NewBuffer(jsonData))
    req.Header.Set("x-api-token", "apitok_xyz789")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/oauth/register');
$payload = json_encode([
    'client_name'     => 'My AI Agent',
    'organization_id' => 'org_01hxyz',
    'scope'           => 'openid profile email',
]);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'x-api-token: apitok_xyz789',
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 13. OIDC Discovery
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'oidc-discovery',
      method: 'GET',
      path: '/api/v1/.well-known/openid-configuration/:orgId',
      title: 'OIDC Discovery',
      description:
        'Retrieve the OpenID Connect discovery document for an organization. Clients use this endpoint to auto-configure OIDC parameters such as the issuer, authorization endpoint, token endpoint, and supported algorithms.',
      auth: 'none',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hxyz',
        },
      ],
      responseFields: [
        { name: 'issuer', type: 'string', description: 'Token issuer identifier.', example: 'https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hxyz' },
        { name: 'authorization_endpoint', type: 'string', description: 'Authorization endpoint URL.', example: 'https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hxyz/authorize' },
        { name: 'token_endpoint', type: 'string', description: 'Token endpoint URL.', example: 'https://api.sutraid.com/api/v1/oauth/token' },
        { name: 'userinfo_endpoint', type: 'string', description: 'UserInfo endpoint URL.', example: 'https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hxyz/userinfo' },
        { name: 'jwks_uri', type: 'string', description: 'JSON Web Key Set endpoint URL.', example: 'https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hxyz/jwks' },
        { name: 'registration_endpoint', type: 'string', description: 'Dynamic client registration endpoint URL.', example: 'https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hxyz/register' },
        { name: 'scopes_supported', type: 'string[]', description: 'List of supported scopes.', example: '["openid", "profile", "email", "offline_access"]' },
        { name: 'response_types_supported', type: 'string[]', description: 'Supported response types.', example: '["code"]' },
        { name: 'grant_types_supported', type: 'string[]', description: 'Supported grant types.', example: '["authorization_code", "refresh_token"]' },
        { name: 'token_endpoint_auth_methods_supported', type: 'string[]', description: 'Supported token endpoint auth methods.', example: '["client_secret_post", "client_secret_basic", "private_key_jwt"]' },
        { name: 'code_challenge_methods_supported', type: 'string[]', description: 'Supported PKCE code challenge methods.', example: '["S256"]' },
        { name: 'dpop_signing_alg_values_supported', type: 'string[]', description: 'Supported DPoP signing algorithms.', example: '["RS256", "ES256"]' },
        { name: 'id_token_signing_alg_values_supported', type: 'string[]', description: 'Supported ID token signing algorithms.', example: '["RS256"]' },
        { name: 'claims_supported', type: 'string[]', description: 'Supported user claims.', example: '["sub", "email", "email_verified", "name", "given_name", "family_name", "updated_at"]' },
      ],
      responseSample: {
        issuer: 'https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hxyz',
        authorization_endpoint: 'https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hxyz/authorize',
        token_endpoint: 'https://api.sutraid.com/api/v1/oauth/token',
        userinfo_endpoint: 'https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hxyz/userinfo',
        jwks_uri: 'https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hxyz/jwks',
        registration_endpoint: 'https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hxyz/register',
        scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'private_key_jwt'],
        code_challenge_methods_supported: ['S256'],
        dpop_signing_alg_values_supported: ['RS256', 'ES256'],
        claims_supported: ['sub', 'email', 'email_verified', 'name', 'given_name', 'family_name', 'updated_at'],
      },
      codeSamples: {
        curl: `curl -X GET https://api.sutraid.com/api/v1/.well-known/openid-configuration/org_01hxyz`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/.well-known/openid-configuration/org_01hxyz"
response = requests.get(url)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/.well-known/openid-configuration/org_01hxyz'
);
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/.well-known/openid-configuration/org_01hxyz"))
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
    resp, _ := http.Get("https://api.sutraid.com/api/v1/.well-known/openid-configuration/org_01hxyz")
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/.well-known/openid-configuration/org_01hxyz');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 14. SAML IdP Metadata
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'saml-metadata',
      method: 'GET',
      path: '/api/v1/saml/:orgId/:appId/metadata.xml',
      title: 'Get SAML IdP Metadata',
      description:
        'Retrieve the SAML Identity Provider metadata XML for a specific application. Provide this to your Service Provider to configure the SAML trust relationship.',
      auth: 'none',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hxyz',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the SAML application.',
          example: 'app_saml_01',
        },
      ],
      responseFields: [
        {
          name: 'EntityDescriptor',
          type: 'XML element',
          description: 'Root SAML metadata element containing the IdP descriptor.',
        },
        {
          name: 'IDPSSODescriptor',
          type: 'XML element',
          description: 'IdP SSO descriptor with signing certificate and SSO endpoints.',
        },
        {
          name: 'SingleSignOnService',
          type: 'XML element',
          description: 'SSO endpoint location and binding.',
        },
      ],
      responseSample: {
        contentType: 'application/xml',
        body: '<?xml version="1.0"?><EntityDescriptor entityID="https://api.sutraid.com/saml/org_01hxyz/app_saml_01">...</EntityDescriptor>',
      },
      codeSamples: {
        curl: `curl -X GET https://api.sutraid.com/api/v1/saml/org_01hxyz/app_saml_01/metadata.xml \\
  -H "Accept: application/xml"`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/saml/org_01hxyz/app_saml_01/metadata.xml"
headers = {"Accept": "application/xml"}

response = requests.get(url, headers=headers)
print(response.text)  # XML content`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/saml/org_01hxyz/app_saml_01/metadata.xml',
  { headers: { 'Accept': 'application/xml' } }
);
const xml = await response.text();
console.log(xml);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/saml/org_01hxyz/app_saml_01/metadata.xml"))
    .header("Accept", "application/xml")
    .GET()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body()); // XML content`,
        go: `package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    req, _ := http.NewRequest("GET",
        "https://api.sutraid.com/api/v1/saml/org_01hxyz/app_saml_01/metadata.xml", nil)
    req.Header.Set("Accept", "application/xml")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body)) // XML content
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/saml/org_01hxyz/app_saml_01/metadata.xml');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Accept: application/xml'],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response; // XML content`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 15. SAML SSO Endpoint
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'saml-sso',
      method: 'POST',
      path: '/api/v1/saml/:orgId/:appId/sso',
      title: 'SAML SSO Endpoint',
      description:
        'SAML Single Sign-On endpoint. Receives a SAMLRequest from the Service Provider, validates it, authenticates the user, and returns an HTML page with an auto-submitting form containing the signed SAMLResponse destined for the SP Assertion Consumer Service URL.',
      auth: 'none',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hxyz',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the SAML application.',
          example: 'app_saml_01',
        },
      ],
      requestBody: [
        {
          name: 'SAMLRequest',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Base64-encoded, deflate-compressed SAML AuthnRequest from the Service Provider.',
          example: 'PHNhbWxwOkF1dGhuUmVxdWVzdC4uLj4=',
        },
        {
          name: 'RelayState',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Opaque value that will be returned to the SP with the SAMLResponse.',
          example: 'https://app.example.com/dashboard',
        },
      ],
      responseFields: [
        {
          name: 'HTML',
          type: 'string',
          description: 'HTML page containing an auto-submitting form that POSTs the SAMLResponse to the SP ACS URL.',
        },
        {
          name: 'SAMLResponse',
          type: 'string',
          description: 'Base64-encoded signed SAML assertion, embedded in the form.',
        },
        {
          name: 'RelayState',
          type: 'string',
          description: 'Original RelayState value, echoed back to the SP.',
        },
      ],
      responseSample: {
        contentType: 'text/html',
        body: '<html><body><form method="POST" action="https://app.example.com/saml/acs"><input type="hidden" name="SAMLResponse" value="PHNhbWxwOlJlc3BvbnNlLi4uPg==" /><input type="hidden" name="RelayState" value="https://app.example.com/dashboard" /><noscript><button type="submit">Continue</button></noscript></form><script>document.forms[0].submit();</script></body></html>',
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/saml/org_01hxyz/app_saml_01/sso \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "SAMLRequest=PHNhbWxwOkF1dGhuUmVxdWVzdC4uLj4%3D&RelayState=https%3A%2F%2Fapp.example.com%2Fdashboard"`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/saml/org_01hxyz/app_saml_01/sso"
data = {
    "SAMLRequest": "PHNhbWxwOkF1dGhuUmVxdWVzdC4uLj4=",
    "RelayState": "https://app.example.com/dashboard"
}

# Note: SAML SSO is typically browser-driven; this example shows the raw request
response = requests.post(url, data=data)
print(response.text)  # HTML auto-submit form`,
        nodejs: `const params = new URLSearchParams({
  SAMLRequest: 'PHNhbWxwOkF1dGhuUmVxdWVzdC4uLj4=',
  RelayState: 'https://app.example.com/dashboard',
});

// Note: SAML SSO is typically browser-driven; this example shows the raw request
const response = await fetch(
  'https://api.sutraid.com/api/v1/saml/org_01hxyz/app_saml_01/sso',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  }
);
const html = await response.text();
console.log(html); // HTML auto-submit form`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
// Note: SAML SSO is typically browser-driven; this example shows the raw request
String body = "SAMLRequest=PHNhbWxwOkF1dGhuUmVxdWVzdC4uLj4%3D&RelayState=https%3A%2F%2Fapp.example.com%2Fdashboard";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/saml/org_01hxyz/app_saml_01/sso"))
    .header("Content-Type", "application/x-www-form-urlencoded")
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body()); // HTML auto-submit form`,
        go: `package main

import (
    "fmt"
    "net/http"
    "net/url"
    "strings"
    "io"
)

func main() {
    // Note: SAML SSO is typically browser-driven; this example shows the raw request
    params := url.Values{}
    params.Set("SAMLRequest", "PHNhbWxwOkF1dGhuUmVxdWVzdC4uLj4=")
    params.Set("RelayState", "https://app.example.com/dashboard")

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/saml/org_01hxyz/app_saml_01/sso",
        strings.NewReader(params.Encode()))
    req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body)) // HTML auto-submit form
}`,
        php: `<?php
// Note: SAML SSO is typically browser-driven; this example shows the raw request
$ch = curl_init('https://api.sutraid.com/api/v1/saml/org_01hxyz/app_saml_01/sso');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query([
        'SAMLRequest' => 'PHNhbWxwOkF1dGhuUmVxdWVzdC4uLj4=',
        'RelayState'  => 'https://app.example.com/dashboard',
    ]),
    CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response; // HTML auto-submit form`,
      },
    },
  ],
};
