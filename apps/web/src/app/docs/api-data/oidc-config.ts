import { DocSection } from './types';

export const oidcConfigSection: DocSection = {
  title: 'OIDC Configuration',
  slug: 'oidc-config',
  description:
    'Manage OIDC configuration for applications including custom scopes, token claims, claim transformation regex rules, signing keys, and token lifetime policies.',
  endpoints: [
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Get OIDC Config
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'get-oidc-config',
      method: 'GET',
      path: '/api/v1/applications/:appId/oidc-config',
      title: 'Get OIDC Config',
      description:
        'Returns the complete OIDC configuration for an application, including scopes, claims, regex rules, signing keys, and token policy.',
      auth: 'bearer',
      parameters: [
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
        { name: 'id', type: 'string', description: 'OIDC configuration ID.', example: 'oidc_cfg_01hxyz' },
        { name: 'applicationId', type: 'string', description: 'The associated application ID.', example: 'app_01hxyz' },
        { name: 'scopes', type: 'object[]', description: 'List of configured OAuth scopes.' },
        { name: 'claims', type: 'object[]', description: 'List of configured token claims.' },
        { name: 'regexRules', type: 'object[]', description: 'List of claim transformation regex rules.' },
        { name: 'signingKeys', type: 'object[]', description: 'List of token signing keys.' },
        { name: 'tokenPolicy', type: 'object', description: 'Token lifetime and rotation policy settings.' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 creation timestamp.', example: '2025-01-15T10:30:00Z' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 last-updated timestamp.', example: '2025-01-15T10:30:00Z' },
      ],
      responseSample: {
        id: 'oidc_cfg_01hxyz',
        applicationId: 'app_01hxyz',
        scopes: [
          { id: 'scope_01hxyz', name: 'openid', description: 'OpenID Connect scope', isDefault: true },
          { id: 'scope_02hxyz', name: 'profile', description: 'User profile information', isDefault: true },
          { id: 'scope_03hxyz', name: 'custom:billing', description: 'Access billing information', isDefault: false },
        ],
        claims: [
          {
            id: 'claim_01hxyz',
            name: 'department',
            userAttribute: 'department',
            regexRuleId: null,
            targetTokens: ['ID_TOKEN'],
          },
        ],
        regexRules: [
          {
            id: 'rule_01hxyz',
            name: 'Extract domain',
            pattern: '^.+@(.+)$',
            replacement: '$1',
            flags: 'i',
          },
        ],
        signingKeys: [
          {
            id: 'key_01hxyz',
            kid: 'sig-rs256-2025',
            algorithm: 'RS256',
            isDefault: true,
            createdAt: '2025-01-15T10:30:00Z',
          },
        ],
        tokenPolicy: {
          accessTokenLifetime: 3600,
          idTokenLifetime: 3600,
          refreshTokenLifetime: 86400,
          rotationEnabled: true,
          reuseInterval: 0,
        },
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T10:30:00Z',
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config" \\
  -H "Authorization: Bearer <token>"`,
        python: `import requests

app_id = "app_01hxyz"
url = f"https://api.sutraid.com/api/v1/applications/{app_id}/oidc-config"
headers = {"Authorization": "Bearer <token>"}

response = requests.get(url, headers=headers)
print(response.json())`,
        nodejs: `const appId = 'app_01hxyz';
const response = await fetch(
  \`https://api.sutraid.com/api/v1/applications/\${appId}/oidc-config\`,
  {
    headers: {
      'Authorization': 'Bearer <token>',
    },
  }
);
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String appId = "app_01hxyz";
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/applications/" + appId + "/oidc-config"))
    .header("Authorization", "Bearer <token>")
    .GET()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "io"
    "net/http"
)

func main() {
    appID := "app_01hxyz"
    req, _ := http.NewRequest("GET",
        fmt.Sprintf("https://api.sutraid.com/api/v1/applications/%s/oidc-config", appID),
        nil)
    req.Header.Set("Authorization", "Bearer <token>")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$appId = 'app_01hxyz';
$ch = curl_init("https://api.sutraid.com/api/v1/applications/{$appId}/oidc-config");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer <token>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Create Custom Scope
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'create-oidc-scope',
      method: 'POST',
      path: '/api/v1/applications/:appId/oidc-config/scopes',
      title: 'Create Custom Scope',
      description:
        'Add a custom OAuth scope to the application OIDC configuration. Custom scopes can be used to control access granularity beyond the standard OpenID Connect scopes.',
      auth: 'bearer',
      parameters: [
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
          required: true,
          description: 'The scope name (e.g. "custom:billing"). Must be unique within the application.',
          example: 'custom:billing',
        },
        {
          name: 'description',
          in: 'body',
          type: 'string',
          required: false,
          description: 'A human-readable description of what the scope grants access to.',
          example: 'Access billing information and invoices.',
        },
        {
          name: 'isDefault',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Whether this scope is included by default when no scopes are explicitly requested.',
          example: 'false',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Unique scope ID.', example: 'scope_01hxyz' },
        { name: 'name', type: 'string', description: 'Scope name.', example: 'custom:billing' },
        { name: 'description', type: 'string', description: 'Scope description.', example: 'Access billing information and invoices.' },
        { name: 'isDefault', type: 'boolean', description: 'Whether the scope is a default scope.', example: 'false' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 creation timestamp.', example: '2025-01-15T10:30:00Z' },
      ],
      responseSample: {
        id: 'scope_01hxyz',
        name: 'custom:billing',
        description: 'Access billing information and invoices.',
        isDefault: false,
        createdAt: '2025-01-15T10:30:00Z',
      },
      codeSamples: {
        curl: `curl -X POST "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/scopes" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "custom:billing",
    "description": "Access billing information and invoices.",
    "isDefault": false
  }'`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/scopes"
headers = {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
}
payload = {
    "name": "custom:billing",
    "description": "Access billing information and invoices.",
    "isDefault": False
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/scopes',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'custom:billing',
      description: 'Access billing information and invoices.',
      isDefault: false,
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
      "name": "custom:billing",
      "description": "Access billing information and invoices.",
      "isDefault": false
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/scopes"))
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
    "io"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "name":        "custom:billing",
        "description": "Access billing information and invoices.",
        "isDefault":   false,
    }
    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/scopes",
        bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer <token>")
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/scopes');
$payload = json_encode([
    'name'        => 'custom:billing',
    'description' => 'Access billing information and invoices.',
    'isDefault'   => false,
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
    // 3. List Scopes
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'list-oidc-scopes',
      method: 'GET',
      path: '/api/v1/applications/:appId/oidc-config/scopes',
      title: 'List Scopes',
      description:
        'List all configured OAuth scopes for the application, including both default and custom scopes.',
      auth: 'bearer',
      parameters: [
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
        { name: '[]', type: 'object[]', description: 'Array of scope objects.' },
        { name: '[].id', type: 'string', description: 'Unique scope ID.', example: 'scope_01hxyz' },
        { name: '[].name', type: 'string', description: 'Scope name.', example: 'openid' },
        { name: '[].description', type: 'string', description: 'Scope description.', example: 'OpenID Connect scope' },
        { name: '[].isDefault', type: 'boolean', description: 'Whether the scope is a default scope.', example: 'true' },
        { name: '[].createdAt', type: 'string', description: 'ISO 8601 creation timestamp.', example: '2025-01-15T10:30:00Z' },
      ],
      responseSample: {
        data: [
          {
            id: 'scope_01hxyz',
            name: 'openid',
            description: 'OpenID Connect scope',
            isDefault: true,
            createdAt: '2025-01-15T10:30:00Z',
          },
          {
            id: 'scope_02hxyz',
            name: 'profile',
            description: 'User profile information',
            isDefault: true,
            createdAt: '2025-01-15T10:30:00Z',
          },
          {
            id: 'scope_03hxyz',
            name: 'custom:billing',
            description: 'Access billing information and invoices.',
            isDefault: false,
            createdAt: '2025-01-16T08:00:00Z',
          },
        ],
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/scopes" \\
  -H "Authorization: Bearer <token>"`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/scopes"
headers = {"Authorization": "Bearer <token>"}

response = requests.get(url, headers=headers)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/scopes',
  {
    headers: {
      'Authorization': 'Bearer <token>',
    },
  }
);
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/scopes"))
    .header("Authorization", "Bearer <token>")
    .GET()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "io"
    "net/http"
)

func main() {
    req, _ := http.NewRequest("GET",
        "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/scopes",
        nil)
    req.Header.Set("Authorization", "Bearer <token>")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/scopes');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer <token>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Create Custom Claim
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'create-oidc-claim',
      method: 'POST',
      path: '/api/v1/applications/:appId/oidc-config/claims',
      title: 'Create Custom Claim',
      description:
        'Add a custom token claim to the application OIDC configuration. Custom claims map user attributes to access tokens and/or ID tokens, optionally applying a regex transformation rule.',
      auth: 'bearer',
      parameters: [
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
          required: true,
          description: 'The claim name as it will appear in the token.',
          example: 'department',
        },
        {
          name: 'userAttribute',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The user profile attribute to map to this claim.',
          example: 'department',
        },
        {
          name: 'regexRuleId',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Optional ID of a regex rule to transform the claim value before inclusion in the token.',
          example: 'rule_01hxyz',
        },
        {
          name: 'targetTokens',
          in: 'body',
          type: 'string[]',
          required: true,
          description: 'Which tokens should include this claim.',
          example: '["ACCESS_TOKEN", "ID_TOKEN"]',
          enum: ['ACCESS_TOKEN', 'ID_TOKEN'],
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Unique claim ID.', example: 'claim_01hxyz' },
        { name: 'name', type: 'string', description: 'Claim name.', example: 'department' },
        { name: 'userAttribute', type: 'string', description: 'Mapped user attribute.', example: 'department' },
        { name: 'regexRuleId', type: 'string | null', description: 'Associated regex rule ID, or null if none.', example: 'null' },
        { name: 'targetTokens', type: 'string[]', description: 'Target tokens for the claim.', example: '["ACCESS_TOKEN", "ID_TOKEN"]' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 creation timestamp.', example: '2025-01-15T10:30:00Z' },
      ],
      responseSample: {
        id: 'claim_01hxyz',
        name: 'department',
        userAttribute: 'department',
        regexRuleId: null,
        targetTokens: ['ACCESS_TOKEN', 'ID_TOKEN'],
        createdAt: '2025-01-15T10:30:00Z',
      },
      codeSamples: {
        curl: `curl -X POST "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/claims" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "department",
    "userAttribute": "department",
    "targetTokens": ["ACCESS_TOKEN", "ID_TOKEN"]
  }'`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/claims"
headers = {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
}
payload = {
    "name": "department",
    "userAttribute": "department",
    "targetTokens": ["ACCESS_TOKEN", "ID_TOKEN"]
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/claims',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'department',
      userAttribute: 'department',
      targetTokens: ['ACCESS_TOKEN', 'ID_TOKEN'],
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
      "name": "department",
      "userAttribute": "department",
      "targetTokens": ["ACCESS_TOKEN", "ID_TOKEN"]
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/claims"))
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
    "io"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "name":          "department",
        "userAttribute": "department",
        "targetTokens":  []string{"ACCESS_TOKEN", "ID_TOKEN"},
    }
    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/claims",
        bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer <token>")
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/claims');
$payload = json_encode([
    'name'          => 'department',
    'userAttribute' => 'department',
    'targetTokens'  => ['ACCESS_TOKEN', 'ID_TOKEN'],
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
    // 5. List Claims
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'list-oidc-claims',
      method: 'GET',
      path: '/api/v1/applications/:appId/oidc-config/claims',
      title: 'List Claims',
      description:
        'List all configured token claims for the application, including the user attribute mapping and target tokens.',
      auth: 'bearer',
      parameters: [
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
        { name: '[]', type: 'object[]', description: 'Array of claim objects.' },
        { name: '[].id', type: 'string', description: 'Unique claim ID.', example: 'claim_01hxyz' },
        { name: '[].name', type: 'string', description: 'Claim name.', example: 'department' },
        { name: '[].userAttribute', type: 'string', description: 'Mapped user attribute.', example: 'department' },
        { name: '[].regexRuleId', type: 'string | null', description: 'Associated regex rule ID, or null.', example: 'null' },
        { name: '[].targetTokens', type: 'string[]', description: 'Target tokens for the claim.', example: '["ID_TOKEN"]' },
        { name: '[].createdAt', type: 'string', description: 'ISO 8601 creation timestamp.', example: '2025-01-15T10:30:00Z' },
      ],
      responseSample: {
        data: [
          {
            id: 'claim_01hxyz',
            name: 'department',
            userAttribute: 'department',
            regexRuleId: null,
            targetTokens: ['ID_TOKEN'],
            createdAt: '2025-01-15T10:30:00Z',
          },
          {
            id: 'claim_02hxyz',
            name: 'email_domain',
            userAttribute: 'email',
            regexRuleId: 'rule_01hxyz',
            targetTokens: ['ACCESS_TOKEN', 'ID_TOKEN'],
            createdAt: '2025-01-16T08:00:00Z',
          },
        ],
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/claims" \\
  -H "Authorization: Bearer <token>"`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/claims"
headers = {"Authorization": "Bearer <token>"}

response = requests.get(url, headers=headers)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/claims',
  {
    headers: {
      'Authorization': 'Bearer <token>',
    },
  }
);
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/claims"))
    .header("Authorization", "Bearer <token>")
    .GET()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "io"
    "net/http"
)

func main() {
    req, _ := http.NewRequest("GET",
        "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/claims",
        nil)
    req.Header.Set("Authorization", "Bearer <token>")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/claims');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer <token>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Create Regex Rule
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'create-oidc-regex-rule',
      method: 'POST',
      path: '/api/v1/applications/:appId/oidc-config/regex-rules',
      title: 'Create Regex Rule',
      description:
        'Add a claim transformation regex rule. Regex rules can be referenced by custom claims to transform user attribute values before they are included in tokens.',
      auth: 'bearer',
      parameters: [
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
          required: true,
          description: 'A descriptive name for the regex rule.',
          example: 'Extract domain',
        },
        {
          name: 'pattern',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The regular expression pattern to match against the claim value.',
          example: '^.+@(.+)$',
        },
        {
          name: 'replacement',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The replacement string (supports capture group references like $1).',
          example: '$1',
        },
        {
          name: 'flags',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Optional regex flags (e.g. "i" for case-insensitive, "g" for global).',
          example: 'i',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Unique regex rule ID.', example: 'rule_01hxyz' },
        { name: 'name', type: 'string', description: 'Rule name.', example: 'Extract domain' },
        { name: 'pattern', type: 'string', description: 'Regex pattern.', example: '^.+@(.+)$' },
        { name: 'replacement', type: 'string', description: 'Replacement string.', example: '$1' },
        { name: 'flags', type: 'string', description: 'Regex flags.', example: 'i' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 creation timestamp.', example: '2025-01-15T10:30:00Z' },
      ],
      responseSample: {
        id: 'rule_01hxyz',
        name: 'Extract domain',
        pattern: '^.+@(.+)$',
        replacement: '$1',
        flags: 'i',
        createdAt: '2025-01-15T10:30:00Z',
      },
      codeSamples: {
        curl: `curl -X POST "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/regex-rules" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Extract domain",
    "pattern": "^.+@(.+)$",
    "replacement": "$1",
    "flags": "i"
  }'`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/regex-rules"
headers = {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
}
payload = {
    "name": "Extract domain",
    "pattern": "^.+@(.+)$",
    "replacement": "$1",
    "flags": "i"
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/regex-rules',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Extract domain',
      pattern: '^.+@(.+)$',
      replacement: '$1',
      flags: 'i',
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
      "name": "Extract domain",
      "pattern": "^.+@(.+)$",
      "replacement": "$1",
      "flags": "i"
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/regex-rules"))
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
    "io"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "name":        "Extract domain",
        "pattern":     "^.+@(.+)$",
        "replacement": "$1",
        "flags":       "i",
    }
    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/regex-rules",
        bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer <token>")
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/regex-rules');
$payload = json_encode([
    'name'        => 'Extract domain',
    'pattern'     => '^.+@(.+)$',
    'replacement' => '$1',
    'flags'       => 'i',
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
    // 7. List Regex Rules
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'list-oidc-regex-rules',
      method: 'GET',
      path: '/api/v1/applications/:appId/oidc-config/regex-rules',
      title: 'List Regex Rules',
      description:
        'List all claim transformation regex rules configured for the application.',
      auth: 'bearer',
      parameters: [
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
        { name: '[]', type: 'object[]', description: 'Array of regex rule objects.' },
        { name: '[].id', type: 'string', description: 'Unique regex rule ID.', example: 'rule_01hxyz' },
        { name: '[].name', type: 'string', description: 'Rule name.', example: 'Extract domain' },
        { name: '[].pattern', type: 'string', description: 'Regex pattern.', example: '^.+@(.+)$' },
        { name: '[].replacement', type: 'string', description: 'Replacement string.', example: '$1' },
        { name: '[].flags', type: 'string', description: 'Regex flags.', example: 'i' },
        { name: '[].createdAt', type: 'string', description: 'ISO 8601 creation timestamp.', example: '2025-01-15T10:30:00Z' },
      ],
      responseSample: {
        data: [
          {
            id: 'rule_01hxyz',
            name: 'Extract domain',
            pattern: '^.+@(.+)$',
            replacement: '$1',
            flags: 'i',
            createdAt: '2025-01-15T10:30:00Z',
          },
          {
            id: 'rule_02hxyz',
            name: 'Normalize username',
            pattern: '\\s+',
            replacement: '_',
            flags: 'g',
            createdAt: '2025-01-16T08:00:00Z',
          },
        ],
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/regex-rules" \\
  -H "Authorization: Bearer <token>"`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/regex-rules"
headers = {"Authorization": "Bearer <token>"}

response = requests.get(url, headers=headers)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/regex-rules',
  {
    headers: {
      'Authorization': 'Bearer <token>',
    },
  }
);
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/regex-rules"))
    .header("Authorization", "Bearer <token>")
    .GET()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "io"
    "net/http"
)

func main() {
    req, _ := http.NewRequest("GET",
        "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/regex-rules",
        nil)
    req.Header.Set("Authorization", "Bearer <token>")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/regex-rules');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer <token>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Create Signing Key
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'create-oidc-signing-key',
      method: 'POST',
      path: '/api/v1/applications/:appId/oidc-config/signing-keys',
      title: 'Create Signing Key',
      description:
        'Add a signing key for token issuance. Signing keys are used to sign access tokens and ID tokens. Multiple keys can be configured to support key rotation.',
      auth: 'bearer',
      parameters: [
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
          name: 'kid',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Key identifier (kid) — a unique string used to identify this key in JWKS.',
          example: 'sig-rs256-2025',
        },
        {
          name: 'algorithm',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The JWS algorithm used for signing.',
          example: 'RS256',
          enum: ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'PS256', 'PS384', 'PS512'],
        },
        {
          name: 'publicKey',
          in: 'body',
          type: 'string',
          required: true,
          description: 'PEM-encoded public key.',
          example: '-----BEGIN PUBLIC KEY-----\\nMIIBIjANBgkqh...\\n-----END PUBLIC KEY-----',
        },
        {
          name: 'privateKey',
          in: 'body',
          type: 'string',
          required: true,
          description: 'PEM-encoded private key.',
          example: '-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBg...\\n-----END PRIVATE KEY-----',
        },
        {
          name: 'certChain',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Optional PEM-encoded X.509 certificate chain.',
          example: '-----BEGIN CERTIFICATE-----\\nMIIDdzCCAl+gAw...\\n-----END CERTIFICATE-----',
        },
        {
          name: 'isDefault',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Whether this key should be the default signing key.',
          example: 'true',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Unique signing key ID.', example: 'key_01hxyz' },
        { name: 'kid', type: 'string', description: 'Key identifier.', example: 'sig-rs256-2025' },
        { name: 'algorithm', type: 'string', description: 'JWS algorithm.', example: 'RS256' },
        { name: 'isDefault', type: 'boolean', description: 'Whether this is the default signing key.', example: 'true' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 creation timestamp.', example: '2025-01-15T10:30:00Z' },
      ],
      responseSample: {
        id: 'key_01hxyz',
        kid: 'sig-rs256-2025',
        algorithm: 'RS256',
        isDefault: true,
        createdAt: '2025-01-15T10:30:00Z',
      },
      codeSamples: {
        curl: `curl -X POST "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/signing-keys" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "kid": "sig-rs256-2025",
    "algorithm": "RS256",
    "publicKey": "-----BEGIN PUBLIC KEY-----\\nMIIBIjANBgkqh...\\n-----END PUBLIC KEY-----",
    "privateKey": "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBg...\\n-----END PRIVATE KEY-----",
    "isDefault": true
  }'`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/signing-keys"
headers = {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
}
payload = {
    "kid": "sig-rs256-2025",
    "algorithm": "RS256",
    "publicKey": "-----BEGIN PUBLIC KEY-----\\nMIIBIjANBgkqh...\\n-----END PUBLIC KEY-----",
    "privateKey": "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBg...\\n-----END PRIVATE KEY-----",
    "isDefault": True
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/signing-keys',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      kid: 'sig-rs256-2025',
      algorithm: 'RS256',
      publicKey: '-----BEGIN PUBLIC KEY-----\\nMIIBIjANBgkqh...\\n-----END PUBLIC KEY-----',
      privateKey: '-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBg...\\n-----END PRIVATE KEY-----',
      isDefault: true,
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
      "kid": "sig-rs256-2025",
      "algorithm": "RS256",
      "publicKey": "-----BEGIN PUBLIC KEY-----\\nMIIBIjANBgkqh...\\n-----END PUBLIC KEY-----",
      "privateKey": "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBg...\\n-----END PRIVATE KEY-----",
      "isDefault": true
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/signing-keys"))
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
    "io"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "kid":        "sig-rs256-2025",
        "algorithm":  "RS256",
        "publicKey":  "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqh...\n-----END PUBLIC KEY-----",
        "privateKey": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----",
        "isDefault":  true,
    }
    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/signing-keys",
        bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer <token>")
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/signing-keys');
$payload = json_encode([
    'kid'        => 'sig-rs256-2025',
    'algorithm'  => 'RS256',
    'publicKey'  => "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqh...\n-----END PUBLIC KEY-----",
    'privateKey' => "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----",
    'isDefault'  => true,
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
    // 9. List Signing Keys
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'list-oidc-signing-keys',
      method: 'GET',
      path: '/api/v1/applications/:appId/oidc-config/signing-keys',
      title: 'List Signing Keys',
      description:
        'List all signing keys configured for the application. Private key material is not included in the response.',
      auth: 'bearer',
      parameters: [
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
        { name: '[]', type: 'object[]', description: 'Array of signing key objects.' },
        { name: '[].id', type: 'string', description: 'Unique signing key ID.', example: 'key_01hxyz' },
        { name: '[].kid', type: 'string', description: 'Key identifier.', example: 'sig-rs256-2025' },
        { name: '[].algorithm', type: 'string', description: 'JWS algorithm.', example: 'RS256' },
        { name: '[].isDefault', type: 'boolean', description: 'Whether this is the default signing key.', example: 'true' },
        { name: '[].createdAt', type: 'string', description: 'ISO 8601 creation timestamp.', example: '2025-01-15T10:30:00Z' },
      ],
      responseSample: {
        data: [
          {
            id: 'key_01hxyz',
            kid: 'sig-rs256-2025',
            algorithm: 'RS256',
            isDefault: true,
            createdAt: '2025-01-15T10:30:00Z',
          },
          {
            id: 'key_02hxyz',
            kid: 'sig-es256-2025',
            algorithm: 'ES256',
            isDefault: false,
            createdAt: '2025-01-16T08:00:00Z',
          },
        ],
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/signing-keys" \\
  -H "Authorization: Bearer <token>"`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/signing-keys"
headers = {"Authorization": "Bearer <token>"}

response = requests.get(url, headers=headers)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/signing-keys',
  {
    headers: {
      'Authorization': 'Bearer <token>',
    },
  }
);
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/signing-keys"))
    .header("Authorization", "Bearer <token>")
    .GET()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "io"
    "net/http"
)

func main() {
    req, _ := http.NewRequest("GET",
        "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/signing-keys",
        nil)
    req.Header.Set("Authorization", "Bearer <token>")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/signing-keys');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer <token>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 10. Update Token Policy
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'update-oidc-token-policy',
      method: 'PUT',
      path: '/api/v1/applications/:appId/oidc-config/token-policy',
      title: 'Update Token Policy',
      description:
        'Configure token lifetimes and refresh token rotation policy for the application. All fields are optional; only provided fields are updated.',
      auth: 'bearer',
      parameters: [
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
          name: 'accessTokenLifetime',
          in: 'body',
          type: 'number',
          required: false,
          description: 'Access token lifetime in seconds (60 - 31536000).',
          example: '3600',
        },
        {
          name: 'idTokenLifetime',
          in: 'body',
          type: 'number',
          required: false,
          description: 'ID token lifetime in seconds (60 - 31536000).',
          example: '3600',
        },
        {
          name: 'refreshTokenLifetime',
          in: 'body',
          type: 'number',
          required: false,
          description: 'Refresh token lifetime in seconds (3600 - 315360000).',
          example: '86400',
        },
        {
          name: 'rotationEnabled',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Whether refresh token rotation is enabled. When enabled, a new refresh token is issued on each use.',
          example: 'true',
        },
        {
          name: 'reuseInterval',
          in: 'body',
          type: 'number',
          required: false,
          description: 'Grace period in seconds (0 - 3600) during which a rotated refresh token can still be reused.',
          example: '0',
        },
      ],
      responseFields: [
        { name: 'accessTokenLifetime', type: 'number', description: 'Access token lifetime in seconds.', example: '3600' },
        { name: 'idTokenLifetime', type: 'number', description: 'ID token lifetime in seconds.', example: '3600' },
        { name: 'refreshTokenLifetime', type: 'number', description: 'Refresh token lifetime in seconds.', example: '86400' },
        { name: 'rotationEnabled', type: 'boolean', description: 'Whether refresh token rotation is enabled.', example: 'true' },
        { name: 'reuseInterval', type: 'number', description: 'Refresh token reuse interval in seconds.', example: '0' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 last-updated timestamp.', example: '2025-01-15T10:30:00Z' },
      ],
      responseSample: {
        accessTokenLifetime: 3600,
        idTokenLifetime: 3600,
        refreshTokenLifetime: 86400,
        rotationEnabled: true,
        reuseInterval: 0,
        updatedAt: '2025-01-15T10:30:00Z',
      },
      codeSamples: {
        curl: `curl -X PUT "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/token-policy" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "accessTokenLifetime": 3600,
    "idTokenLifetime": 3600,
    "refreshTokenLifetime": 86400,
    "rotationEnabled": true,
    "reuseInterval": 0
  }'`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/token-policy"
headers = {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
}
payload = {
    "accessTokenLifetime": 3600,
    "idTokenLifetime": 3600,
    "refreshTokenLifetime": 86400,
    "rotationEnabled": True,
    "reuseInterval": 0
}

response = requests.put(url, headers=headers, json=payload)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/token-policy',
  {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessTokenLifetime: 3600,
      idTokenLifetime: 3600,
      refreshTokenLifetime: 86400,
      rotationEnabled: true,
      reuseInterval: 0,
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
      "accessTokenLifetime": 3600,
      "idTokenLifetime": 3600,
      "refreshTokenLifetime": 86400,
      "rotationEnabled": true,
      "reuseInterval": 0
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/token-policy"))
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
    "io"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "accessTokenLifetime":  3600,
        "idTokenLifetime":      3600,
        "refreshTokenLifetime": 86400,
        "rotationEnabled":      true,
        "reuseInterval":        0,
    }
    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("PUT",
        "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/token-policy",
        bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer <token>")
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/token-policy');
$payload = json_encode([
    'accessTokenLifetime'  => 3600,
    'idTokenLifetime'      => 3600,
    'refreshTokenLifetime' => 86400,
    'rotationEnabled'      => true,
    'reuseInterval'        => 0,
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
    // 11. Get Token Policy
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'get-oidc-token-policy',
      method: 'GET',
      path: '/api/v1/applications/:appId/oidc-config/token-policy',
      title: 'Get Token Policy',
      description:
        'Get the current token policy settings for the application, including access token, ID token, and refresh token lifetimes, as well as rotation configuration.',
      auth: 'bearer',
      parameters: [
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
        { name: 'accessTokenLifetime', type: 'number', description: 'Access token lifetime in seconds.', example: '3600' },
        { name: 'idTokenLifetime', type: 'number', description: 'ID token lifetime in seconds.', example: '3600' },
        { name: 'refreshTokenLifetime', type: 'number', description: 'Refresh token lifetime in seconds.', example: '86400' },
        { name: 'rotationEnabled', type: 'boolean', description: 'Whether refresh token rotation is enabled.', example: 'true' },
        { name: 'reuseInterval', type: 'number', description: 'Refresh token reuse interval in seconds.', example: '0' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 last-updated timestamp.', example: '2025-01-15T10:30:00Z' },
      ],
      responseSample: {
        accessTokenLifetime: 3600,
        idTokenLifetime: 3600,
        refreshTokenLifetime: 86400,
        rotationEnabled: true,
        reuseInterval: 0,
        updatedAt: '2025-01-15T10:30:00Z',
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/token-policy" \\
  -H "Authorization: Bearer <token>"`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/token-policy"
headers = {"Authorization": "Bearer <token>"}

response = requests.get(url, headers=headers)
print(response.json())`,
        nodejs: `const response = await fetch(
  'https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/token-policy',
  {
    headers: {
      'Authorization': 'Bearer <token>',
    },
  }
);
const data = await response.json();
console.log(data);`,
        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/token-policy"))
    .header("Authorization", "Bearer <token>")
    .GET()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "io"
    "net/http"
)

func main() {
    req, _ := http.NewRequest("GET",
        "https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/token-policy",
        nil)
    req.Header.Set("Authorization", "Bearer <token>")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$ch = curl_init('https://api.sutraid.com/api/v1/applications/app_01hxyz/oidc-config/token-policy');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer <token>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },
  ],
};
