import { DocSection } from './types';

export const directorySection: DocSection = {
  title: 'Directory (SCIM & LDAP)',
  slug: 'directory',
  description: 'Provision and de-provision users and groups via SCIM 2.0, manage SCIM bearer tokens, and configure outbound LDAP directory sync.',
  endpoints: [
    /* ------------------------------------------------------------------ */
    /*  SCIM Token Management                                             */
    /* ------------------------------------------------------------------ */
    {
      id: 'generate-scim-token',
      method: 'POST',
      path: '/directory/scim/:orgId/token',
      title: 'Generate SCIM token',
      description: 'Creates a new SCIM bearer token for the organization. The token is returned once in plain text and stored as a SHA-256 hash. Requires SUPER_ADMIN, ORG_ADMIN, or API_ACCESS_MANAGEMENT_ADMIN role.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the organization.',
          example: 'b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b',
        },
      ],
      responseFields: [
        { name: 'token', type: 'string', description: 'The plain-text SCIM bearer token. Store it securely -- it cannot be retrieved again.' },
      ],
      responseSample: {
        token: 'st_live_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
      },
      codeSamples: {
        curl: `curl -X POST "https://api.sutraid.com/directory/scim/b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b/token" \\
  -H "Authorization: Bearer <your_token>"`,

        python: `import requests

org_id = "b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b"
url = f"https://api.sutraid.com/directory/scim/{org_id}/token"
headers = {
    "Authorization": "Bearer <your_token>",
}

response = requests.post(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgId = 'b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b';

const response = await axios.post(
  \`https://api.sutraid.com/directory/scim/\${orgId}/token\`,
  null,
  {
    headers: {
      Authorization: 'Bearer <your_token>',
    },
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/directory/scim/" + orgId + "/token"
    ))
    .header("Authorization", "Bearer <your_token>")
    .POST(HttpRequest.BodyPublishers.noBody())
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
    orgID := "b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b"
    url := "https://api.sutraid.com/directory/scim/" + orgID + "/token"

    req, _ := http.NewRequest("POST", url, nil)
    req.Header.Set("Authorization", "Bearer <your_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgId = 'b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/directory/scim/{$orgId}/token",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <your_token>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },

    /* ------------------------------------------------------------------ */
    /*  LDAP Configuration & Sync                                         */
    /* ------------------------------------------------------------------ */
    {
      id: 'get-ldap-config',
      method: 'GET',
      path: '/directory/ldap/:orgId/config',
      title: 'Get LDAP configuration',
      description: 'Returns the current LDAP directory configuration for the organization, including connection details and sync filters. Returns null if no LDAP config exists.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the organization.',
          example: 'b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b',
        },
      ],
      responseFields: [
        { name: 'enabled', type: 'boolean', description: 'Whether LDAP sync is currently enabled.' },
        { name: 'url', type: 'string', description: 'LDAP server URL (e.g. ldaps://ldap.example.com:636).' },
        { name: 'baseDn', type: 'string', description: 'Base distinguished name for directory searches.' },
        { name: 'bindDn', type: 'string', description: 'Bind distinguished name used for authentication.' },
        { name: 'bindPassword', type: 'string', description: 'Password for the bind DN (masked in responses).' },
        { name: 'userFilter', type: 'string', description: 'LDAP filter for user entries.' },
        { name: 'groupFilter', type: 'string', description: 'LDAP filter for group entries.' },
        { name: 'lastSyncAt', type: 'string | null', description: 'ISO 8601 timestamp of the last successful sync, or null if never synced.' },
      ],
      responseSample: {
        enabled: true,
        url: 'ldaps://ldap.example.com:636',
        baseDn: 'dc=example,dc=com',
        bindDn: 'cn=admin,dc=example,dc=com',
        bindPassword: '********',
        userFilter: '(objectClass=user)',
        groupFilter: '(objectClass=group)',
        lastSyncAt: '2024-06-15T14:30:00Z',
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/directory/ldap/b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b/config" \\
  -H "Authorization: Bearer <your_token>"`,

        python: `import requests

org_id = "b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b"
url = f"https://api.sutraid.com/directory/ldap/{org_id}/config"
headers = {
    "Authorization": "Bearer <your_token>",
}

response = requests.get(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgId = 'b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b';

const response = await axios.get(
  \`https://api.sutraid.com/directory/ldap/\${orgId}/config\`,
  {
    headers: {
      Authorization: 'Bearer <your_token>',
    },
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/directory/ldap/" + orgId + "/config"
    ))
    .header("Authorization", "Bearer <your_token>")
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
    orgID := "b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b"
    url := "https://api.sutraid.com/directory/ldap/" + orgID + "/config"

    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer <your_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgId = 'b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/directory/ldap/{$orgId}/config",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <your_token>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },
    {
      id: 'update-ldap-config',
      method: 'POST',
      path: '/directory/ldap/:orgId/config',
      title: 'Create or update LDAP configuration',
      description: 'Creates or updates the LDAP directory configuration for the organization. Requires SUPER_ADMIN or ORG_ADMIN role. Uses an upsert strategy -- existing configs are merged.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the organization.',
          example: 'b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b',
        },
      ],
      requestBody: [
        {
          name: 'enabled',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Whether LDAP sync should be enabled. Defaults to true.',
          example: 'true',
        },
        {
          name: 'ldapUrl',
          in: 'body',
          type: 'string',
          required: true,
          description: 'LDAP server URL (e.g. ldaps://ldap.example.com:636). Also accepts "url" alias.',
          example: 'ldaps://ldap.example.com:636',
        },
        {
          name: 'ldapBaseDn',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Base DN for directory searches. Also accepts "baseDn" alias.',
          example: 'dc=example,dc=com',
        },
        {
          name: 'ldapBindDn',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Bind DN for LDAP authentication. Also accepts "bindDn" alias.',
          example: 'cn=admin,dc=example,dc=com',
        },
        {
          name: 'ldapBindPassword',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Password for the bind DN. Also accepts "bindPassword" alias.',
          example: 'supersecret',
        },
        {
          name: 'ldapUserFilter',
          in: 'body',
          type: 'string',
          required: false,
          description: 'LDAP search filter for user entries. Defaults to (objectClass=user). Also accepts "userFilter" alias.',
          example: '(objectClass=user)',
        },
        {
          name: 'ldapGroupFilter',
          in: 'body',
          type: 'string',
          required: false,
          description: 'LDAP search filter for group entries. Defaults to (objectClass=group). Also accepts "groupFilter" alias.',
          example: '(objectClass=group)',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Unique identifier of the directory config record.' },
        { name: 'organizationId', type: 'string', description: 'Organization the config belongs to.' },
        { name: 'type', type: 'string', description: 'Directory type. Always "LDAP" for this endpoint.' },
        { name: 'enabled', type: 'boolean', description: 'Whether LDAP sync is enabled.' },
        { name: 'ldapUrl', type: 'string', description: 'LDAP server URL.' },
        { name: 'ldapBaseDn', type: 'string', description: 'Base DN for searches.' },
        { name: 'ldapBindDn', type: 'string', description: 'Bind DN for authentication.' },
        { name: 'ldapUserFilter', type: 'string', description: 'User search filter.' },
        { name: 'ldapGroupFilter', type: 'string', description: 'Group search filter.' },
        { name: 'lastSyncAt', type: 'string | null', description: 'ISO 8601 timestamp of last sync.' },
      ],
      responseSample: {
        id: 'dc_01hx9z1q2w3e4r5t6y7u',
        organizationId: 'b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b',
        type: 'LDAP',
        enabled: true,
        ldapUrl: 'ldaps://ldap.example.com:636',
        ldapBaseDn: 'dc=example,dc=com',
        ldapBindDn: 'cn=admin,dc=example,dc=com',
        ldapUserFilter: '(objectClass=user)',
        ldapGroupFilter: '(objectClass=group)',
        lastSyncAt: null,
      },
      codeSamples: {
        curl: `curl -X POST "https://api.sutraid.com/directory/ldap/b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b/config" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ldapUrl": "ldaps://ldap.example.com:636",
    "ldapBaseDn": "dc=example,dc=com",
    "ldapBindDn": "cn=admin,dc=example,dc=com",
    "ldapBindPassword": "supersecret",
    "ldapUserFilter": "(objectClass=user)",
    "ldapGroupFilter": "(objectClass=group)"
  }'`,

        python: `import requests

org_id = "b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b"
url = f"https://api.sutraid.com/directory/ldap/{org_id}/config"
headers = {
    "Authorization": "Bearer <your_token>",
    "Content-Type": "application/json",
}
payload = {
    "ldapUrl": "ldaps://ldap.example.com:636",
    "ldapBaseDn": "dc=example,dc=com",
    "ldapBindDn": "cn=admin,dc=example,dc=com",
    "ldapBindPassword": "supersecret",
    "ldapUserFilter": "(objectClass=user)",
    "ldapGroupFilter": "(objectClass=group)",
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgId = 'b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b';

const response = await axios.post(
  \`https://api.sutraid.com/directory/ldap/\${orgId}/config\`,
  {
    ldapUrl: 'ldaps://ldap.example.com:636',
    ldapBaseDn: 'dc=example,dc=com',
    ldapBindDn: 'cn=admin,dc=example,dc=com',
    ldapBindPassword: 'supersecret',
    ldapUserFilter: '(objectClass=user)',
    ldapGroupFilter: '(objectClass=group)',
  },
  {
    headers: {
      Authorization: 'Bearer <your_token>',
    },
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b";
String json = """
    {
      "ldapUrl": "ldaps://ldap.example.com:636",
      "ldapBaseDn": "dc=example,dc=com",
      "ldapBindDn": "cn=admin,dc=example,dc=com",
      "ldapBindPassword": "supersecret",
      "ldapUserFilter": "(objectClass=user)",
      "ldapGroupFilter": "(objectClass=group)"
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/directory/ldap/" + orgId + "/config"
    ))
    .header("Authorization", "Bearer <your_token>")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(json))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,

        go: `package main

import (
    "fmt"
    "io"
    "net/http"
    "strings"
)

func main() {
    orgID := "b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b"
    url := "https://api.sutraid.com/directory/ldap/" + orgID + "/config"

    payload := strings.NewReader(\`{
      "ldapUrl": "ldaps://ldap.example.com:636",
      "ldapBaseDn": "dc=example,dc=com",
      "ldapBindDn": "cn=admin,dc=example,dc=com",
      "ldapBindPassword": "supersecret",
      "ldapUserFilter": "(objectClass=user)",
      "ldapGroupFilter": "(objectClass=group)"
    }\`)

    req, _ := http.NewRequest("POST", url, payload)
    req.Header.Set("Authorization", "Bearer <your_token>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgId = 'b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b';

$ch = curl_init();

$payload = json_encode([
    'ldapUrl' => 'ldaps://ldap.example.com:636',
    'ldapBaseDn' => 'dc=example,dc=com',
    'ldapBindDn' => 'cn=admin,dc=example,dc=com',
    'ldapBindPassword' => 'supersecret',
    'ldapUserFilter' => '(objectClass=user)',
    'ldapGroupFilter' => '(objectClass=group)',
]);

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/directory/ldap/{$orgId}/config",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <your_token>',
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },
    {
      id: 'trigger-ldap-sync',
      method: 'POST',
      path: '/directory/ldap/:orgId/sync',
      title: 'Trigger LDAP sync',
      description: 'Initiates an outbound LDAP sync for the organization. Connects to the configured LDAP server, imports users and groups, and updates the lastSyncAt timestamp. Requires SUPER_ADMIN or ORG_ADMIN role.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the organization.',
          example: 'b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b',
        },
      ],
      responseFields: [
        { name: 'status', type: 'string', description: 'Confirmation message indicating the sync has been initiated.' },
      ],
      responseSample: {
        status: 'Sync initiated',
      },
      codeSamples: {
        curl: `curl -X POST "https://api.sutraid.com/directory/ldap/b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b/sync" \\
  -H "Authorization: Bearer <your_token>"`,

        python: `import requests

org_id = "b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b"
url = f"https://api.sutraid.com/directory/ldap/{org_id}/sync"
headers = {
    "Authorization": "Bearer <your_token>",
}

response = requests.post(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgId = 'b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b';

const response = await axios.post(
  \`https://api.sutraid.com/directory/ldap/\${orgId}/sync\`,
  null,
  {
    headers: {
      Authorization: 'Bearer <your_token>',
    },
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/directory/ldap/" + orgId + "/sync"
    ))
    .header("Authorization", "Bearer <your_token>")
    .POST(HttpRequest.BodyPublishers.noBody())
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
    orgID := "b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b"
    url := "https://api.sutraid.com/directory/ldap/" + orgID + "/sync"

    req, _ := http.NewRequest("POST", url, nil)
    req.Header.Set("Authorization", "Bearer <your_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgId = 'b3e1f7a2-4c5d-6e8f-9a0b-1c2d3e4f5a6b';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/directory/ldap/{$orgId}/sync",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <your_token>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },

    /* ------------------------------------------------------------------ */
    /*  SCIM v2 Discovery Endpoints                                       */
    /* ------------------------------------------------------------------ */
    {
      id: 'scim-service-provider-config',
      method: 'GET',
      path: '/scim/v2/:orgRef/ServiceProviderConfig',
      title: 'Get SCIM service provider configuration',
      description: 'Returns the SCIM 2.0 service provider configuration describing supported features such as patch, filter, sort, and authentication schemes.',
      auth: 'scim-token',
      parameters: [
        {
          name: 'orgRef',
          in: 'path',
          type: 'string',
          required: true,
          description: 'Organization identifier -- a UUID, slug, or legacy org_ prefixed reference.',
          example: 'my-org',
        },
      ],
      responseFields: [
        { name: 'schemas', type: 'string[]', description: 'SCIM schema URN for ServiceProviderConfig.' },
        { name: 'patch.supported', type: 'boolean', description: 'Whether PATCH operations are supported.' },
        { name: 'bulk.supported', type: 'boolean', description: 'Whether bulk operations are supported.' },
        { name: 'filter.supported', type: 'boolean', description: 'Whether filtering is supported.' },
        { name: 'filter.maxResults', type: 'number', description: 'Maximum results returned by a filter query.' },
        { name: 'changePassword.supported', type: 'boolean', description: 'Whether password changes are supported.' },
        { name: 'sort.supported', type: 'boolean', description: 'Whether sorting is supported.' },
        { name: 'etag.supported', type: 'boolean', description: 'Whether ETags are supported.' },
        { name: 'authenticationSchemes', type: 'object[]', description: 'List of supported authentication schemes.' },
      ],
      responseSample: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
        patch: { supported: true },
        bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
        filter: { supported: true, maxResults: 200 },
        changePassword: { supported: false },
        sort: { supported: true },
        etag: { supported: false },
        authenticationSchemes: [
          {
            type: 'oauthbearertoken',
            name: 'Bearer Token',
            description: 'Use SCIM bearer token in Authorization header',
            specUri: 'https://datatracker.ietf.org/doc/html/rfc6750',
            primary: true,
          },
        ],
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/scim/v2/my-org/ServiceProviderConfig" \\
  -H "Authorization: Bearer <scim_token>"`,

        python: `import requests

org_ref = "my-org"
url = f"https://api.sutraid.com/scim/v2/{org_ref}/ServiceProviderConfig"
headers = {
    "Authorization": "Bearer <scim_token>",
}

response = requests.get(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgRef = 'my-org';

const response = await axios.get(
  \`https://api.sutraid.com/scim/v2/\${orgRef}/ServiceProviderConfig\`,
  {
    headers: {
      Authorization: 'Bearer <scim_token>',
    },
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgRef = "my-org";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/scim/v2/" + orgRef + "/ServiceProviderConfig"
    ))
    .header("Authorization", "Bearer <scim_token>")
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
    orgRef := "my-org"
    url := "https://api.sutraid.com/scim/v2/" + orgRef + "/ServiceProviderConfig"

    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer <scim_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgRef = 'my-org';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/scim/v2/{$orgRef}/ServiceProviderConfig",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <scim_token>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },
    {
      id: 'scim-schemas',
      method: 'GET',
      path: '/scim/v2/:orgRef/Schemas',
      title: 'Get SCIM schemas',
      description: 'Returns the list of SCIM resource schemas supported by this service provider (User and Group).',
      auth: 'scim-token',
      parameters: [
        {
          name: 'orgRef',
          in: 'path',
          type: 'string',
          required: true,
          description: 'Organization identifier -- a UUID, slug, or legacy org_ prefixed reference.',
          example: 'my-org',
        },
      ],
      responseFields: [
        { name: 'schemas', type: 'string[]', description: 'SCIM ListResponse schema URN.' },
        { name: 'totalResults', type: 'number', description: 'Total number of schema resources returned.' },
        { name: 'Resources', type: 'object[]', description: 'Array of schema definitions (User, Group).' },
        { name: 'Resources[].id', type: 'string', description: 'Schema URN identifier.' },
        { name: 'Resources[].name', type: 'string', description: 'Human-readable schema name.' },
        { name: 'Resources[].description', type: 'string', description: 'Description of the schema.' },
      ],
      responseSample: {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
        totalResults: 2,
        Resources: [
          {
            id: 'urn:ietf:params:scim:schemas:core:2.0:User',
            name: 'User',
            description: 'User Account',
          },
          {
            id: 'urn:ietf:params:scim:schemas:core:2.0:Group',
            name: 'Group',
            description: 'Group',
          },
        ],
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/scim/v2/my-org/Schemas" \\
  -H "Authorization: Bearer <scim_token>"`,

        python: `import requests

org_ref = "my-org"
url = f"https://api.sutraid.com/scim/v2/{org_ref}/Schemas"
headers = {
    "Authorization": "Bearer <scim_token>",
}

response = requests.get(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgRef = 'my-org';

const response = await axios.get(
  \`https://api.sutraid.com/scim/v2/\${orgRef}/Schemas\`,
  {
    headers: {
      Authorization: 'Bearer <scim_token>',
    },
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgRef = "my-org";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/scim/v2/" + orgRef + "/Schemas"
    ))
    .header("Authorization", "Bearer <scim_token>")
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
    orgRef := "my-org"
    url := "https://api.sutraid.com/scim/v2/" + orgRef + "/Schemas"

    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer <scim_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgRef = 'my-org';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/scim/v2/{$orgRef}/Schemas",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <scim_token>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },
    {
      id: 'scim-resource-types',
      method: 'GET',
      path: '/scim/v2/:orgRef/ResourceTypes',
      title: 'Get SCIM resource types',
      description: 'Returns the list of SCIM resource types supported by this service provider, including their endpoints and schema URNs.',
      auth: 'scim-token',
      parameters: [
        {
          name: 'orgRef',
          in: 'path',
          type: 'string',
          required: true,
          description: 'Organization identifier -- a UUID, slug, or legacy org_ prefixed reference.',
          example: 'my-org',
        },
      ],
      responseFields: [
        { name: 'schemas', type: 'string[]', description: 'SCIM ListResponse schema URN.' },
        { name: 'totalResults', type: 'number', description: 'Total number of resource types returned.' },
        { name: 'Resources', type: 'object[]', description: 'Array of resource type definitions.' },
        { name: 'Resources[].id', type: 'string', description: 'Resource type identifier (User or Group).' },
        { name: 'Resources[].name', type: 'string', description: 'Human-readable resource type name.' },
        { name: 'Resources[].endpoint', type: 'string', description: 'Relative endpoint path for this resource type.' },
        { name: 'Resources[].schema', type: 'string', description: 'Schema URN for this resource type.' },
      ],
      responseSample: {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
        totalResults: 2,
        Resources: [
          {
            id: 'User',
            name: 'User',
            endpoint: '/Users',
            schema: 'urn:ietf:params:scim:schemas:core:2.0:User',
          },
          {
            id: 'Group',
            name: 'Group',
            endpoint: '/Groups',
            schema: 'urn:ietf:params:scim:schemas:core:2.0:Group',
          },
        ],
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/scim/v2/my-org/ResourceTypes" \\
  -H "Authorization: Bearer <scim_token>"`,

        python: `import requests

org_ref = "my-org"
url = f"https://api.sutraid.com/scim/v2/{org_ref}/ResourceTypes"
headers = {
    "Authorization": "Bearer <scim_token>",
}

response = requests.get(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgRef = 'my-org';

const response = await axios.get(
  \`https://api.sutraid.com/scim/v2/\${orgRef}/ResourceTypes\`,
  {
    headers: {
      Authorization: 'Bearer <scim_token>',
    },
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgRef = "my-org";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/scim/v2/" + orgRef + "/ResourceTypes"
    ))
    .header("Authorization", "Bearer <scim_token>")
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
    orgRef := "my-org"
    url := "https://api.sutraid.com/scim/v2/" + orgRef + "/ResourceTypes"

    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer <scim_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgRef = 'my-org';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/scim/v2/{$orgRef}/ResourceTypes",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <scim_token>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },

    /* ------------------------------------------------------------------ */
    /*  SCIM v2 Users                                                     */
    /* ------------------------------------------------------------------ */
    {
      id: 'scim-list-users',
      method: 'GET',
      path: '/scim/v2/:orgRef/Users',
      title: 'List SCIM users',
      description: 'Returns a paginated SCIM 2.0 ListResponse of user resources for the organization. Supports filtering by userName, externalId, or id.',
      auth: 'scim-token',
      parameters: [
        {
          name: 'orgRef',
          in: 'path',
          type: 'string',
          required: true,
          description: 'Organization identifier -- a UUID, slug, or legacy org_ prefixed reference.',
          example: 'my-org',
        },
        {
          name: 'filter',
          in: 'query',
          type: 'string',
          required: false,
          description: 'SCIM filter expression. Supports userName eq, externalId eq, and id eq.',
          example: 'userName eq "jane@example.com"',
        },
        {
          name: 'startIndex',
          in: 'query',
          type: 'number',
          required: false,
          description: '1-based index of the first result. Defaults to 1.',
          example: '1',
        },
        {
          name: 'count',
          in: 'query',
          type: 'number',
          required: false,
          description: 'Maximum number of results per page. Defaults to 100, maximum 200.',
          example: '100',
        },
      ],
      responseFields: [
        { name: 'schemas', type: 'string[]', description: 'SCIM ListResponse schema URN.' },
        { name: 'totalResults', type: 'number', description: 'Total number of user resources matching the query.' },
        { name: 'startIndex', type: 'number', description: 'The 1-based index of the first result in the current set.' },
        { name: 'itemsPerPage', type: 'number', description: 'Number of resources returned in this response.' },
        { name: 'Resources', type: 'User[]', description: 'Array of SCIM User resources.' },
        { name: 'Resources[].schemas', type: 'string[]', description: 'SCIM User schema URN.' },
        { name: 'Resources[].id', type: 'string', description: 'SutraID user identifier.' },
        { name: 'Resources[].userName', type: 'string', description: 'Email address of the user.' },
        { name: 'Resources[].externalId', type: 'string', description: 'External identifier from the identity provider.' },
        { name: 'Resources[].name', type: 'object', description: 'Name object with givenName and familyName.' },
        { name: 'Resources[].emails', type: 'object[]', description: 'Array of email objects.' },
        { name: 'Resources[].active', type: 'boolean', description: 'Whether the user account is active.' },
      ],
      responseSample: {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
        totalResults: 2,
        startIndex: 1,
        itemsPerPage: 2,
        Resources: [
          {
            schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            userName: 'jane@example.com',
            externalId: 'ext-001',
            name: { givenName: 'Jane', familyName: 'Doe' },
            emails: [{ value: 'jane@example.com', primary: true, type: 'work' }],
            active: true,
          },
        ],
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/scim/v2/my-org/Users?startIndex=1&count=100" \\
  -H "Authorization: Bearer <scim_token>"`,

        python: `import requests

org_ref = "my-org"
url = f"https://api.sutraid.com/scim/v2/{org_ref}/Users"
headers = {
    "Authorization": "Bearer <scim_token>",
}
params = {
    "startIndex": 1,
    "count": 100,
}

response = requests.get(url, headers=headers, params=params)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgRef = 'my-org';

const response = await axios.get(
  \`https://api.sutraid.com/scim/v2/\${orgRef}/Users\`,
  {
    headers: {
      Authorization: 'Bearer <scim_token>',
    },
    params: {
      startIndex: 1,
      count: 100,
    },
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgRef = "my-org";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/scim/v2/" + orgRef + "/Users?startIndex=1&count=100"
    ))
    .header("Authorization", "Bearer <scim_token>")
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
    orgRef := "my-org"
    url := "https://api.sutraid.com/scim/v2/" + orgRef + "/Users?startIndex=1&count=100"

    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer <scim_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgRef = 'my-org';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/scim/v2/{$orgRef}/Users?startIndex=1&count=100",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <scim_token>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },
    {
      id: 'scim-get-user',
      method: 'GET',
      path: '/scim/v2/:orgRef/Users/:userId',
      title: 'Get SCIM user by ID',
      description: 'Returns a single SCIM 2.0 User resource by its SutraID user identifier. The user must be a member of the specified organization.',
      auth: 'scim-token',
      parameters: [
        {
          name: 'orgRef',
          in: 'path',
          type: 'string',
          required: true,
          description: 'Organization identifier -- a UUID, slug, or legacy org_ prefixed reference.',
          example: 'my-org',
        },
        {
          name: 'userId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'SutraID user identifier.',
          example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
      ],
      responseFields: [
        { name: 'schemas', type: 'string[]', description: 'SCIM User schema URN.' },
        { name: 'id', type: 'string', description: 'SutraID user identifier.' },
        { name: 'userName', type: 'string', description: 'Email address of the user.' },
        { name: 'externalId', type: 'string', description: 'External identifier from the identity provider.' },
        { name: 'name', type: 'object', description: 'Name object with givenName and familyName.' },
        { name: 'emails', type: 'object[]', description: 'Array of email objects.' },
        { name: 'active', type: 'boolean', description: 'Whether the user account is active.' },
      ],
      responseSample: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        userName: 'jane@example.com',
        externalId: 'ext-001',
        name: { givenName: 'Jane', familyName: 'Doe' },
        emails: [{ value: 'jane@example.com', primary: true, type: 'work' }],
        active: true,
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/scim/v2/my-org/Users/a1b2c3d4-e5f6-7890-abcd-ef1234567890" \\
  -H "Authorization: Bearer <scim_token>"`,

        python: `import requests

org_ref = "my-org"
user_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
url = f"https://api.sutraid.com/scim/v2/{org_ref}/Users/{user_id}"
headers = {
    "Authorization": "Bearer <scim_token>",
}

response = requests.get(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgRef = 'my-org';
const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const response = await axios.get(
  \`https://api.sutraid.com/scim/v2/\${orgRef}/Users/\${userId}\`,
  {
    headers: {
      Authorization: 'Bearer <scim_token>',
    },
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgRef = "my-org";
String userId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/scim/v2/" + orgRef + "/Users/" + userId
    ))
    .header("Authorization", "Bearer <scim_token>")
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
    orgRef := "my-org"
    userID := "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    url := "https://api.sutraid.com/scim/v2/" + orgRef + "/Users/" + userID

    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer <scim_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgRef = 'my-org';
$userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/scim/v2/{$orgRef}/Users/{$userId}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <scim_token>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },
    {
      id: 'scim-create-user',
      method: 'POST',
      path: '/scim/v2/:orgRef/Users',
      title: 'Create SCIM user',
      description: 'Provisions a new user via SCIM 2.0. If a user with the same email already exists, their profile is updated and they are added to the organization. Returns 201 on success.',
      auth: 'scim-token',
      parameters: [
        {
          name: 'orgRef',
          in: 'path',
          type: 'string',
          required: true,
          description: 'Organization identifier -- a UUID, slug, or legacy org_ prefixed reference.',
          example: 'my-org',
        },
      ],
      requestBody: [
        {
          name: 'userName',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Email address of the user. Can also be provided as emails[0].value.',
          example: 'jane@example.com',
        },
        {
          name: 'externalId',
          in: 'body',
          type: 'string',
          required: false,
          description: 'External identifier from the upstream identity provider.',
          example: 'ext-001',
        },
        {
          name: 'name',
          in: 'body',
          type: 'object',
          required: false,
          description: 'Name object containing givenName and familyName.',
          example: '{ "givenName": "Jane", "familyName": "Doe" }',
        },
        {
          name: 'emails',
          in: 'body',
          type: 'object[]',
          required: false,
          description: 'Array of email objects. The first entry with a value is used if userName is not set.',
          example: '[{ "value": "jane@example.com", "primary": true, "type": "work" }]',
        },
        {
          name: 'active',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Whether the user should be active. Defaults to true.',
          example: 'true',
        },
      ],
      responseFields: [
        { name: 'schemas', type: 'string[]', description: 'SCIM User schema URN.' },
        { name: 'id', type: 'string', description: 'SutraID user identifier.' },
        { name: 'userName', type: 'string', description: 'Email address of the user.' },
        { name: 'externalId', type: 'string', description: 'External identifier.' },
        { name: 'name', type: 'object', description: 'Name object with givenName and familyName.' },
        { name: 'emails', type: 'object[]', description: 'Array of email objects.' },
        { name: 'active', type: 'boolean', description: 'Whether the user account is active.' },
      ],
      responseSample: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        userName: 'jane@example.com',
        externalId: 'ext-001',
        name: { givenName: 'Jane', familyName: 'Doe' },
        emails: [{ value: 'jane@example.com', primary: true, type: 'work' }],
        active: true,
      },
      codeSamples: {
        curl: `curl -X POST "https://api.sutraid.com/scim/v2/my-org/Users" \\
  -H "Authorization: Bearer <scim_token>" \\
  -H "Content-Type: application/scim+json" \\
  -d '{
    "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
    "userName": "jane@example.com",
    "externalId": "ext-001",
    "name": { "givenName": "Jane", "familyName": "Doe" },
    "emails": [{ "value": "jane@example.com", "primary": true, "type": "work" }],
    "active": true
  }'`,

        python: `import requests

org_ref = "my-org"
url = f"https://api.sutraid.com/scim/v2/{org_ref}/Users"
headers = {
    "Authorization": "Bearer <scim_token>",
    "Content-Type": "application/scim+json",
}
payload = {
    "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
    "userName": "jane@example.com",
    "externalId": "ext-001",
    "name": {"givenName": "Jane", "familyName": "Doe"},
    "emails": [{"value": "jane@example.com", "primary": True, "type": "work"}],
    "active": True,
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgRef = 'my-org';

const response = await axios.post(
  \`https://api.sutraid.com/scim/v2/\${orgRef}/Users\`,
  {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    userName: 'jane@example.com',
    externalId: 'ext-001',
    name: { givenName: 'Jane', familyName: 'Doe' },
    emails: [{ value: 'jane@example.com', primary: true, type: 'work' }],
    active: true,
  },
  {
    headers: {
      Authorization: 'Bearer <scim_token>',
      'Content-Type': 'application/scim+json',
    },
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgRef = "my-org";
String json = """
    {
      "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
      "userName": "jane@example.com",
      "externalId": "ext-001",
      "name": { "givenName": "Jane", "familyName": "Doe" },
      "emails": [{ "value": "jane@example.com", "primary": true, "type": "work" }],
      "active": true
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/scim/v2/" + orgRef + "/Users"
    ))
    .header("Authorization", "Bearer <scim_token>")
    .header("Content-Type", "application/scim+json")
    .POST(HttpRequest.BodyPublishers.ofString(json))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,

        go: `package main

import (
    "fmt"
    "io"
    "net/http"
    "strings"
)

func main() {
    orgRef := "my-org"
    url := "https://api.sutraid.com/scim/v2/" + orgRef + "/Users"

    payload := strings.NewReader(\`{
      "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
      "userName": "jane@example.com",
      "externalId": "ext-001",
      "name": { "givenName": "Jane", "familyName": "Doe" },
      "emails": [{ "value": "jane@example.com", "primary": true, "type": "work" }],
      "active": true
    }\`)

    req, _ := http.NewRequest("POST", url, payload)
    req.Header.Set("Authorization", "Bearer <scim_token>")
    req.Header.Set("Content-Type", "application/scim+json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgRef = 'my-org';

$ch = curl_init();

$payload = json_encode([
    'schemas' => ['urn:ietf:params:scim:schemas:core:2.0:User'],
    'userName' => 'jane@example.com',
    'externalId' => 'ext-001',
    'name' => ['givenName' => 'Jane', 'familyName' => 'Doe'],
    'emails' => [['value' => 'jane@example.com', 'primary' => true, 'type' => 'work']],
    'active' => true,
]);

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/scim/v2/{$orgRef}/Users",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <scim_token>',
        'Content-Type: application/scim+json',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },
    {
      id: 'scim-patch-user',
      method: 'PATCH',
      path: '/scim/v2/:orgRef/Users/:userId',
      title: 'Patch SCIM user',
      description: 'Partially updates a SCIM user resource using RFC 7644 PATCH operations. Supports add, replace, and remove operations on userName, name, externalId, active, and enterprise extension attributes.',
      auth: 'scim-token',
      parameters: [
        {
          name: 'orgRef',
          in: 'path',
          type: 'string',
          required: true,
          description: 'Organization identifier -- a UUID, slug, or legacy org_ prefixed reference.',
          example: 'my-org',
        },
        {
          name: 'userId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'SutraID user identifier.',
          example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
      ],
      requestBody: [
        {
          name: 'schemas',
          in: 'body',
          type: 'string[]',
          required: true,
          description: 'Must include urn:ietf:params:scim:api:messages:2.0:PatchOp.',
          example: '["urn:ietf:params:scim:api:messages:2.0:PatchOp"]',
        },
        {
          name: 'Operations',
          in: 'body',
          type: 'object[]',
          required: true,
          description: 'Array of SCIM PATCH operations. Each operation has op (add/replace/remove), optional path, and optional value.',
          example: '[{ "op": "replace", "path": "active", "value": false }]',
        },
      ],
      responseFields: [
        { name: 'schemas', type: 'string[]', description: 'SCIM User schema URN.' },
        { name: 'id', type: 'string', description: 'SutraID user identifier.' },
        { name: 'userName', type: 'string', description: 'Email address of the user.' },
        { name: 'externalId', type: 'string', description: 'External identifier.' },
        { name: 'name', type: 'object', description: 'Name object with givenName and familyName.' },
        { name: 'emails', type: 'object[]', description: 'Array of email objects.' },
        { name: 'active', type: 'boolean', description: 'Whether the user account is active.' },
      ],
      responseSample: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        userName: 'jane@example.com',
        externalId: 'ext-001',
        name: { givenName: 'Jane', familyName: 'Doe' },
        emails: [{ value: 'jane@example.com', primary: true, type: 'work' }],
        active: false,
      },
      codeSamples: {
        curl: `curl -X PATCH "https://api.sutraid.com/scim/v2/my-org/Users/a1b2c3d4-e5f6-7890-abcd-ef1234567890" \\
  -H "Authorization: Bearer <scim_token>" \\
  -H "Content-Type: application/scim+json" \\
  -d '{
    "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
    "Operations": [
      { "op": "replace", "path": "active", "value": false }
    ]
  }'`,

        python: `import requests

org_ref = "my-org"
user_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
url = f"https://api.sutraid.com/scim/v2/{org_ref}/Users/{user_id}"
headers = {
    "Authorization": "Bearer <scim_token>",
    "Content-Type": "application/scim+json",
}
payload = {
    "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
    "Operations": [
        {"op": "replace", "path": "active", "value": False}
    ],
}

response = requests.patch(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgRef = 'my-org';
const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const response = await axios.patch(
  \`https://api.sutraid.com/scim/v2/\${orgRef}/Users/\${userId}\`,
  {
    schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
    Operations: [
      { op: 'replace', path: 'active', value: false },
    ],
  },
  {
    headers: {
      Authorization: 'Bearer <scim_token>',
      'Content-Type': 'application/scim+json',
    },
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgRef = "my-org";
String userId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
String json = """
    {
      "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
      "Operations": [
        { "op": "replace", "path": "active", "value": false }
      ]
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/scim/v2/" + orgRef + "/Users/" + userId
    ))
    .header("Authorization", "Bearer <scim_token>")
    .header("Content-Type", "application/scim+json")
    .method("PATCH", HttpRequest.BodyPublishers.ofString(json))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,

        go: `package main

import (
    "fmt"
    "io"
    "net/http"
    "strings"
)

func main() {
    orgRef := "my-org"
    userID := "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    url := "https://api.sutraid.com/scim/v2/" + orgRef + "/Users/" + userID

    payload := strings.NewReader(\`{
      "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
      "Operations": [
        { "op": "replace", "path": "active", "value": false }
      ]
    }\`)

    req, _ := http.NewRequest("PATCH", url, payload)
    req.Header.Set("Authorization", "Bearer <scim_token>")
    req.Header.Set("Content-Type", "application/scim+json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgRef = 'my-org';
$userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

$ch = curl_init();

$payload = json_encode([
    'schemas' => ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
    'Operations' => [
        ['op' => 'replace', 'path' => 'active', 'value' => false],
    ],
]);

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/scim/v2/{$orgRef}/Users/{$userId}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PATCH',
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <scim_token>',
        'Content-Type: application/scim+json',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },
    {
      id: 'scim-delete-user',
      method: 'DELETE',
      path: '/scim/v2/:orgRef/Users/:userId',
      title: 'Delete SCIM user',
      description: 'De-provisions a user via SCIM 2.0. The user is soft-deleted by setting their status to SUSPENDED in both the user record and their organization membership. Returns 204 No Content on success.',
      auth: 'scim-token',
      parameters: [
        {
          name: 'orgRef',
          in: 'path',
          type: 'string',
          required: true,
          description: 'Organization identifier -- a UUID, slug, or legacy org_ prefixed reference.',
          example: 'my-org',
        },
        {
          name: 'userId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'SutraID user identifier.',
          example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
      ],
      responseFields: [],
      responseSample: {},
      codeSamples: {
        curl: `curl -X DELETE "https://api.sutraid.com/scim/v2/my-org/Users/a1b2c3d4-e5f6-7890-abcd-ef1234567890" \\
  -H "Authorization: Bearer <scim_token>"`,

        python: `import requests

org_ref = "my-org"
user_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
url = f"https://api.sutraid.com/scim/v2/{org_ref}/Users/{user_id}"
headers = {
    "Authorization": "Bearer <scim_token>",
}

response = requests.delete(url, headers=headers)
print(response.status_code)  # 204`,

        nodejs: `const axios = require('axios');

const orgRef = 'my-org';
const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

await axios.delete(
  \`https://api.sutraid.com/scim/v2/\${orgRef}/Users/\${userId}\`,
  {
    headers: {
      Authorization: 'Bearer <scim_token>',
    },
  }
);

console.log('User deleted (204)');`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgRef = "my-org";
String userId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/scim/v2/" + orgRef + "/Users/" + userId
    ))
    .header("Authorization", "Bearer <scim_token>")
    .DELETE()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.statusCode()); // 204`,

        go: `package main

import (
    "fmt"
    "net/http"
)

func main() {
    orgRef := "my-org"
    userID := "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    url := "https://api.sutraid.com/scim/v2/" + orgRef + "/Users/" + userID

    req, _ := http.NewRequest("DELETE", url, nil)
    req.Header.Set("Authorization", "Bearer <scim_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    fmt.Println(resp.StatusCode) // 204
}`,

        php: `<?php
$orgRef = 'my-org';
$userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/scim/v2/{$orgRef}/Users/{$userId}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'DELETE',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <scim_token>',
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo $httpCode; // 204`,
      },
    },

    /* ------------------------------------------------------------------ */
    /*  SCIM v2 Groups                                                    */
    /* ------------------------------------------------------------------ */
    {
      id: 'scim-list-groups',
      method: 'GET',
      path: '/scim/v2/:orgRef/Groups',
      title: 'List SCIM groups',
      description: 'Returns a paginated SCIM 2.0 ListResponse of group resources for the organization. Supports filtering by displayName, externalId, or id.',
      auth: 'scim-token',
      parameters: [
        {
          name: 'orgRef',
          in: 'path',
          type: 'string',
          required: true,
          description: 'Organization identifier -- a UUID, slug, or legacy org_ prefixed reference.',
          example: 'my-org',
        },
        {
          name: 'filter',
          in: 'query',
          type: 'string',
          required: false,
          description: 'SCIM filter expression. Supports displayName eq, externalId eq, and id eq.',
          example: 'displayName eq "Engineering"',
        },
        {
          name: 'startIndex',
          in: 'query',
          type: 'number',
          required: false,
          description: '1-based index of the first result. Defaults to 1.',
          example: '1',
        },
        {
          name: 'count',
          in: 'query',
          type: 'number',
          required: false,
          description: 'Maximum number of results per page. Defaults to 100, maximum 200.',
          example: '100',
        },
      ],
      responseFields: [
        { name: 'schemas', type: 'string[]', description: 'SCIM ListResponse schema URN.' },
        { name: 'totalResults', type: 'number', description: 'Total number of group resources matching the query.' },
        { name: 'startIndex', type: 'number', description: 'The 1-based index of the first result in the current set.' },
        { name: 'itemsPerPage', type: 'number', description: 'Number of resources returned in this response.' },
        { name: 'Resources', type: 'Group[]', description: 'Array of SCIM Group resources.' },
        { name: 'Resources[].schemas', type: 'string[]', description: 'SCIM Group schema URN.' },
        { name: 'Resources[].id', type: 'string', description: 'SutraID group identifier.' },
        { name: 'Resources[].displayName', type: 'string', description: 'Name of the group.' },
        { name: 'Resources[].externalId', type: 'string', description: 'External identifier from the identity provider.' },
        { name: 'Resources[].members', type: 'object[]', description: 'Array of member references with value (userId) and display (email).' },
      ],
      responseSample: {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
        totalResults: 1,
        startIndex: 1,
        itemsPerPage: 1,
        Resources: [
          {
            schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
            id: 'g1a2b3c4-d5e6-7890-abcd-ef1234567890',
            displayName: 'Engineering',
            externalId: 'grp-eng-001',
            members: [
              { value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', display: 'jane@example.com' },
            ],
          },
        ],
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/scim/v2/my-org/Groups?startIndex=1&count=100" \\
  -H "Authorization: Bearer <scim_token>"`,

        python: `import requests

org_ref = "my-org"
url = f"https://api.sutraid.com/scim/v2/{org_ref}/Groups"
headers = {
    "Authorization": "Bearer <scim_token>",
}
params = {
    "startIndex": 1,
    "count": 100,
}

response = requests.get(url, headers=headers, params=params)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgRef = 'my-org';

const response = await axios.get(
  \`https://api.sutraid.com/scim/v2/\${orgRef}/Groups\`,
  {
    headers: {
      Authorization: 'Bearer <scim_token>',
    },
    params: {
      startIndex: 1,
      count: 100,
    },
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgRef = "my-org";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/scim/v2/" + orgRef + "/Groups?startIndex=1&count=100"
    ))
    .header("Authorization", "Bearer <scim_token>")
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
    orgRef := "my-org"
    url := "https://api.sutraid.com/scim/v2/" + orgRef + "/Groups?startIndex=1&count=100"

    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer <scim_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgRef = 'my-org';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/scim/v2/{$orgRef}/Groups?startIndex=1&count=100",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <scim_token>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },
    {
      id: 'scim-get-group',
      method: 'GET',
      path: '/scim/v2/:orgRef/Groups/:groupId',
      title: 'Get SCIM group by ID',
      description: 'Returns a single SCIM 2.0 Group resource by its SutraID group identifier, including the full member list.',
      auth: 'scim-token',
      parameters: [
        {
          name: 'orgRef',
          in: 'path',
          type: 'string',
          required: true,
          description: 'Organization identifier -- a UUID, slug, or legacy org_ prefixed reference.',
          example: 'my-org',
        },
        {
          name: 'groupId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'SutraID group identifier.',
          example: 'g1a2b3c4-d5e6-7890-abcd-ef1234567890',
        },
      ],
      responseFields: [
        { name: 'schemas', type: 'string[]', description: 'SCIM Group schema URN.' },
        { name: 'id', type: 'string', description: 'SutraID group identifier.' },
        { name: 'displayName', type: 'string', description: 'Name of the group.' },
        { name: 'externalId', type: 'string', description: 'External identifier from the identity provider.' },
        { name: 'members', type: 'object[]', description: 'Array of member references with value (userId) and display (email).' },
      ],
      responseSample: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: 'g1a2b3c4-d5e6-7890-abcd-ef1234567890',
        displayName: 'Engineering',
        externalId: 'grp-eng-001',
        members: [
          { value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', display: 'jane@example.com' },
          { value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', display: 'john@example.com' },
        ],
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/scim/v2/my-org/Groups/g1a2b3c4-d5e6-7890-abcd-ef1234567890" \\
  -H "Authorization: Bearer <scim_token>"`,

        python: `import requests

org_ref = "my-org"
group_id = "g1a2b3c4-d5e6-7890-abcd-ef1234567890"
url = f"https://api.sutraid.com/scim/v2/{org_ref}/Groups/{group_id}"
headers = {
    "Authorization": "Bearer <scim_token>",
}

response = requests.get(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgRef = 'my-org';
const groupId = 'g1a2b3c4-d5e6-7890-abcd-ef1234567890';

const response = await axios.get(
  \`https://api.sutraid.com/scim/v2/\${orgRef}/Groups/\${groupId}\`,
  {
    headers: {
      Authorization: 'Bearer <scim_token>',
    },
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgRef = "my-org";
String groupId = "g1a2b3c4-d5e6-7890-abcd-ef1234567890";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/scim/v2/" + orgRef + "/Groups/" + groupId
    ))
    .header("Authorization", "Bearer <scim_token>")
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
    orgRef := "my-org"
    groupID := "g1a2b3c4-d5e6-7890-abcd-ef1234567890"
    url := "https://api.sutraid.com/scim/v2/" + orgRef + "/Groups/" + groupID

    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer <scim_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgRef = 'my-org';
$groupId = 'g1a2b3c4-d5e6-7890-abcd-ef1234567890';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/scim/v2/{$orgRef}/Groups/{$groupId}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <scim_token>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },
    {
      id: 'scim-create-group',
      method: 'POST',
      path: '/scim/v2/:orgRef/Groups',
      title: 'Create SCIM group',
      description: 'Provisions a new group via SCIM 2.0. Optionally includes initial members by user ID. Returns 201 on success.',
      auth: 'scim-token',
      parameters: [
        {
          name: 'orgRef',
          in: 'path',
          type: 'string',
          required: true,
          description: 'Organization identifier -- a UUID, slug, or legacy org_ prefixed reference.',
          example: 'my-org',
        },
      ],
      requestBody: [
        {
          name: 'displayName',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Display name for the group.',
          example: 'Engineering',
        },
        {
          name: 'externalId',
          in: 'body',
          type: 'string',
          required: false,
          description: 'External identifier from the upstream identity provider.',
          example: 'grp-eng-001',
        },
        {
          name: 'members',
          in: 'body',
          type: 'object[]',
          required: false,
          description: 'Array of member objects. Each must have a value field containing the SutraID user ID.',
          example: '[{ "value": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }]',
        },
      ],
      responseFields: [
        { name: 'schemas', type: 'string[]', description: 'SCIM Group schema URN.' },
        { name: 'id', type: 'string', description: 'SutraID group identifier.' },
        { name: 'displayName', type: 'string', description: 'Name of the group.' },
        { name: 'externalId', type: 'string', description: 'External identifier.' },
        { name: 'members', type: 'object[]', description: 'Array of member references with value (userId) and display (email).' },
      ],
      responseSample: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: 'g1a2b3c4-d5e6-7890-abcd-ef1234567890',
        displayName: 'Engineering',
        externalId: 'grp-eng-001',
        members: [
          { value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', display: 'jane@example.com' },
        ],
      },
      codeSamples: {
        curl: `curl -X POST "https://api.sutraid.com/scim/v2/my-org/Groups" \\
  -H "Authorization: Bearer <scim_token>" \\
  -H "Content-Type: application/scim+json" \\
  -d '{
    "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
    "displayName": "Engineering",
    "externalId": "grp-eng-001",
    "members": [
      { "value": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
    ]
  }'`,

        python: `import requests

org_ref = "my-org"
url = f"https://api.sutraid.com/scim/v2/{org_ref}/Groups"
headers = {
    "Authorization": "Bearer <scim_token>",
    "Content-Type": "application/scim+json",
}
payload = {
    "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
    "displayName": "Engineering",
    "externalId": "grp-eng-001",
    "members": [
        {"value": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"}
    ],
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgRef = 'my-org';

const response = await axios.post(
  \`https://api.sutraid.com/scim/v2/\${orgRef}/Groups\`,
  {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
    displayName: 'Engineering',
    externalId: 'grp-eng-001',
    members: [
      { value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
    ],
  },
  {
    headers: {
      Authorization: 'Bearer <scim_token>',
      'Content-Type': 'application/scim+json',
    },
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgRef = "my-org";
String json = """
    {
      "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
      "displayName": "Engineering",
      "externalId": "grp-eng-001",
      "members": [
        { "value": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
      ]
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/scim/v2/" + orgRef + "/Groups"
    ))
    .header("Authorization", "Bearer <scim_token>")
    .header("Content-Type", "application/scim+json")
    .POST(HttpRequest.BodyPublishers.ofString(json))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,

        go: `package main

import (
    "fmt"
    "io"
    "net/http"
    "strings"
)

func main() {
    orgRef := "my-org"
    url := "https://api.sutraid.com/scim/v2/" + orgRef + "/Groups"

    payload := strings.NewReader(\`{
      "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
      "displayName": "Engineering",
      "externalId": "grp-eng-001",
      "members": [
        { "value": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
      ]
    }\`)

    req, _ := http.NewRequest("POST", url, payload)
    req.Header.Set("Authorization", "Bearer <scim_token>")
    req.Header.Set("Content-Type", "application/scim+json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgRef = 'my-org';

$ch = curl_init();

$payload = json_encode([
    'schemas' => ['urn:ietf:params:scim:schemas:core:2.0:Group'],
    'displayName' => 'Engineering',
    'externalId' => 'grp-eng-001',
    'members' => [
        ['value' => 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
    ],
]);

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/scim/v2/{$orgRef}/Groups",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <scim_token>',
        'Content-Type: application/scim+json',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },
    {
      id: 'scim-patch-group',
      method: 'PATCH',
      path: '/scim/v2/:orgRef/Groups/:groupId',
      title: 'Patch SCIM group',
      description: 'Partially updates a SCIM group resource using RFC 7644 PATCH operations. Supports add, replace, and remove operations on displayName and members.',
      auth: 'scim-token',
      parameters: [
        {
          name: 'orgRef',
          in: 'path',
          type: 'string',
          required: true,
          description: 'Organization identifier -- a UUID, slug, or legacy org_ prefixed reference.',
          example: 'my-org',
        },
        {
          name: 'groupId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'SutraID group identifier.',
          example: 'g1a2b3c4-d5e6-7890-abcd-ef1234567890',
        },
      ],
      requestBody: [
        {
          name: 'schemas',
          in: 'body',
          type: 'string[]',
          required: true,
          description: 'Must include urn:ietf:params:scim:api:messages:2.0:PatchOp.',
          example: '["urn:ietf:params:scim:api:messages:2.0:PatchOp"]',
        },
        {
          name: 'Operations',
          in: 'body',
          type: 'object[]',
          required: true,
          description: 'Array of SCIM PATCH operations. Supports add/replace/remove on displayName and members. Use members[value eq "..."] path to remove specific members.',
          example: '[{ "op": "add", "path": "members", "value": [{ "value": "user-uuid" }] }]',
        },
      ],
      responseFields: [
        { name: 'schemas', type: 'string[]', description: 'SCIM Group schema URN.' },
        { name: 'id', type: 'string', description: 'SutraID group identifier.' },
        { name: 'displayName', type: 'string', description: 'Name of the group.' },
        { name: 'externalId', type: 'string', description: 'External identifier.' },
        { name: 'members', type: 'object[]', description: 'Updated array of member references.' },
      ],
      responseSample: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: 'g1a2b3c4-d5e6-7890-abcd-ef1234567890',
        displayName: 'Engineering',
        externalId: 'grp-eng-001',
        members: [
          { value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', display: 'jane@example.com' },
          { value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', display: 'john@example.com' },
        ],
      },
      codeSamples: {
        curl: `curl -X PATCH "https://api.sutraid.com/scim/v2/my-org/Groups/g1a2b3c4-d5e6-7890-abcd-ef1234567890" \\
  -H "Authorization: Bearer <scim_token>" \\
  -H "Content-Type: application/scim+json" \\
  -d '{
    "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
    "Operations": [
      {
        "op": "add",
        "path": "members",
        "value": [{ "value": "b2c3d4e5-f6a7-8901-bcde-f12345678901" }]
      }
    ]
  }'`,

        python: `import requests

org_ref = "my-org"
group_id = "g1a2b3c4-d5e6-7890-abcd-ef1234567890"
url = f"https://api.sutraid.com/scim/v2/{org_ref}/Groups/{group_id}"
headers = {
    "Authorization": "Bearer <scim_token>",
    "Content-Type": "application/scim+json",
}
payload = {
    "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
    "Operations": [
        {
            "op": "add",
            "path": "members",
            "value": [{"value": "b2c3d4e5-f6a7-8901-bcde-f12345678901"}],
        }
    ],
}

response = requests.patch(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgRef = 'my-org';
const groupId = 'g1a2b3c4-d5e6-7890-abcd-ef1234567890';

const response = await axios.patch(
  \`https://api.sutraid.com/scim/v2/\${orgRef}/Groups/\${groupId}\`,
  {
    schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
    Operations: [
      {
        op: 'add',
        path: 'members',
        value: [{ value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' }],
      },
    ],
  },
  {
    headers: {
      Authorization: 'Bearer <scim_token>',
      'Content-Type': 'application/scim+json',
    },
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgRef = "my-org";
String groupId = "g1a2b3c4-d5e6-7890-abcd-ef1234567890";
String json = """
    {
      "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
      "Operations": [
        {
          "op": "add",
          "path": "members",
          "value": [{ "value": "b2c3d4e5-f6a7-8901-bcde-f12345678901" }]
        }
      ]
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/scim/v2/" + orgRef + "/Groups/" + groupId
    ))
    .header("Authorization", "Bearer <scim_token>")
    .header("Content-Type", "application/scim+json")
    .method("PATCH", HttpRequest.BodyPublishers.ofString(json))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,

        go: `package main

import (
    "fmt"
    "io"
    "net/http"
    "strings"
)

func main() {
    orgRef := "my-org"
    groupID := "g1a2b3c4-d5e6-7890-abcd-ef1234567890"
    url := "https://api.sutraid.com/scim/v2/" + orgRef + "/Groups/" + groupID

    payload := strings.NewReader(\`{
      "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
      "Operations": [
        {
          "op": "add",
          "path": "members",
          "value": [{ "value": "b2c3d4e5-f6a7-8901-bcde-f12345678901" }]
        }
      ]
    }\`)

    req, _ := http.NewRequest("PATCH", url, payload)
    req.Header.Set("Authorization", "Bearer <scim_token>")
    req.Header.Set("Content-Type", "application/scim+json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgRef = 'my-org';
$groupId = 'g1a2b3c4-d5e6-7890-abcd-ef1234567890';

$ch = curl_init();

$payload = json_encode([
    'schemas' => ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
    'Operations' => [
        [
            'op' => 'add',
            'path' => 'members',
            'value' => [['value' => 'b2c3d4e5-f6a7-8901-bcde-f12345678901']],
        ],
    ],
]);

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/scim/v2/{$orgRef}/Groups/{$groupId}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PATCH',
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <scim_token>',
        'Content-Type: application/scim+json',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },
    {
      id: 'scim-delete-group',
      method: 'DELETE',
      path: '/scim/v2/:orgRef/Groups/:groupId',
      title: 'Delete SCIM group',
      description: 'Permanently deletes a group and removes all group memberships. Returns 204 No Content on success.',
      auth: 'scim-token',
      parameters: [
        {
          name: 'orgRef',
          in: 'path',
          type: 'string',
          required: true,
          description: 'Organization identifier -- a UUID, slug, or legacy org_ prefixed reference.',
          example: 'my-org',
        },
        {
          name: 'groupId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'SutraID group identifier.',
          example: 'g1a2b3c4-d5e6-7890-abcd-ef1234567890',
        },
      ],
      responseFields: [],
      responseSample: {},
      codeSamples: {
        curl: `curl -X DELETE "https://api.sutraid.com/scim/v2/my-org/Groups/g1a2b3c4-d5e6-7890-abcd-ef1234567890" \\
  -H "Authorization: Bearer <scim_token>"`,

        python: `import requests

org_ref = "my-org"
group_id = "g1a2b3c4-d5e6-7890-abcd-ef1234567890"
url = f"https://api.sutraid.com/scim/v2/{org_ref}/Groups/{group_id}"
headers = {
    "Authorization": "Bearer <scim_token>",
}

response = requests.delete(url, headers=headers)
print(response.status_code)  # 204`,

        nodejs: `const axios = require('axios');

const orgRef = 'my-org';
const groupId = 'g1a2b3c4-d5e6-7890-abcd-ef1234567890';

await axios.delete(
  \`https://api.sutraid.com/scim/v2/\${orgRef}/Groups/\${groupId}\`,
  {
    headers: {
      Authorization: 'Bearer <scim_token>',
    },
  }
);

console.log('Group deleted (204)');`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgRef = "my-org";
String groupId = "g1a2b3c4-d5e6-7890-abcd-ef1234567890";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/scim/v2/" + orgRef + "/Groups/" + groupId
    ))
    .header("Authorization", "Bearer <scim_token>")
    .DELETE()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.statusCode()); // 204`,

        go: `package main

import (
    "fmt"
    "net/http"
)

func main() {
    orgRef := "my-org"
    groupID := "g1a2b3c4-d5e6-7890-abcd-ef1234567890"
    url := "https://api.sutraid.com/scim/v2/" + orgRef + "/Groups/" + groupID

    req, _ := http.NewRequest("DELETE", url, nil)
    req.Header.Set("Authorization", "Bearer <scim_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    fmt.Println(resp.StatusCode) // 204
}`,

        php: `<?php
$orgRef = 'my-org';
$groupId = 'g1a2b3c4-d5e6-7890-abcd-ef1234567890';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/scim/v2/{$orgRef}/Groups/{$groupId}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'DELETE',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <scim_token>',
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo $httpCode; // 204`,
      },
    },
  ],
};
