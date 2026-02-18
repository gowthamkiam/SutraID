import { DocSection } from './types';

export const organizationsSection: DocSection = {
  title: 'Organizations',
  slug: 'organizations',
  description: 'Multi-tenant organization management, member invitations, and settings.',
  endpoints: [
    // ─── 1. Create Organization ───────────────────────────────────────────────
    {
      id: 'create-organization',
      method: 'POST',
      path: '/api/v1/organizations',
      title: 'Create Organization',
      description: 'Create a new organization. The authenticated user becomes the first super-admin of the org.',
      auth: 'bearer',
      requestBody: [
        {
          name: 'name',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Display name of the organization.',
          example: 'Acme Corp',
        },
        {
          name: 'slug',
          in: 'body',
          type: 'string',
          required: false,
          description: 'URL-safe identifier. Auto-generated from name if omitted.',
          example: 'acme-corp',
        },
        {
          name: 'domain',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Primary domain associated with the organization.',
          example: 'acme.com',
        },
        {
          name: 'logoUrl',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Public URL of the organization logo.',
          example: 'https://cdn.acme.com/logo.png',
        },
        {
          name: 'primaryColor',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Brand hex color used in hosted UI.',
          example: '#0057FF',
        },
        {
          name: 'allowedDomains',
          in: 'body',
          type: 'string[]',
          required: false,
          description: 'List of email domains whose users may self-join.',
          example: '["acme.com","acme.io"]',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string (UUID)', description: 'Organization unique identifier.', example: 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1' },
        { name: 'name', type: 'string', description: 'Display name.', example: 'Acme Corp' },
        { name: 'slug', type: 'string', description: 'URL-safe identifier.', example: 'acme-corp' },
        { name: 'domain', type: 'string | null', description: 'Primary domain.', example: 'acme.com' },
        { name: 'plan', type: 'string', description: 'Subscription plan.', example: 'FREE' },
        { name: 'status', type: 'string', description: 'Organization status.', example: 'ACTIVE' },
        { name: 'logoUrl', type: 'string | null', description: 'Logo URL.', example: 'https://cdn.acme.com/logo.png' },
        { name: 'primaryColor', type: 'string | null', description: 'Brand hex color.', example: '#0057FF' },
        { name: 'allowedDomains', type: 'string[]', description: 'Self-join allowed domains.', example: '["acme.com"]' },
        { name: 'maxMembers', type: 'number', description: 'Maximum member seats.', example: '50' },
        { name: 'maxApplications', type: 'number', description: 'Maximum application count.', example: '10' },
        { name: 'createdAt', type: 'string (ISO 8601)', description: 'Creation timestamp.', example: '2024-01-15T10:30:00.000Z' },
        { name: 'updatedAt', type: 'string (ISO 8601)', description: 'Last update timestamp.', example: '2024-01-15T10:30:00.000Z' },
      ],
      responseSample: {
        id: 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1',
        name: 'Acme Corp',
        slug: 'acme-corp',
        domain: 'acme.com',
        plan: 'FREE',
        status: 'ACTIVE',
        logoUrl: 'https://cdn.acme.com/logo.png',
        primaryColor: '#0057FF',
        allowedDomains: ['acme.com'],
        maxMembers: 50,
        maxApplications: 10,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/organizations \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Acme Corp",
    "slug": "acme-corp",
    "domain": "acme.com",
    "logoUrl": "https://cdn.acme.com/logo.png",
    "primaryColor": "#0057FF",
    "allowedDomains": ["acme.com", "acme.io"]
  }'`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/organizations"
headers = {
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9...",
    "Content-Type": "application/json",
}
payload = {
    "name": "Acme Corp",
    "slug": "acme-corp",
    "domain": "acme.com",
    "logoUrl": "https://cdn.acme.com/logo.png",
    "primaryColor": "#0057FF",
    "allowedDomains": ["acme.com", "acme.io"],
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
        nodejs: `const axios = require('axios');

const response = await axios.post(
  'https://api.sutraid.com/api/v1/organizations',
  {
    name: 'Acme Corp',
    slug: 'acme-corp',
    domain: 'acme.com',
    logoUrl: 'https://cdn.acme.com/logo.png',
    primaryColor: '#0057FF',
    allowedDomains: ['acme.com', 'acme.io'],
  },
  {
    headers: {
      Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...',
      'Content-Type': 'application/json',
    },
  }
);

console.log(response.data);`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

HttpClient client = HttpClient.newHttpClient();

String body = """
    {
      "name": "Acme Corp",
      "slug": "acme-corp",
      "domain": "acme.com",
      "logoUrl": "https://cdn.acme.com/logo.png",
      "primaryColor": "#0057FF",
      "allowedDomains": ["acme.com", "acme.io"]
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations"))
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());
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
        "name":           "Acme Corp",
        "slug":           "acme-corp",
        "domain":         "acme.com",
        "logoUrl":        "https://cdn.acme.com/logo.png",
        "primaryColor":   "#0057FF",
        "allowedDomains": []string{"acme.com", "acme.io"},
    }
    body, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/organizations",
        bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,
        php: `<?php
$client = new \\GuzzleHttp\\Client();

$response = $client->post('https://api.sutraid.com/api/v1/organizations', [
    'headers' => [
        'Authorization' => 'Bearer eyJhbGciOiJSUzI1NiJ9...',
        'Content-Type'  => 'application/json',
    ],
    'json' => [
        'name'           => 'Acme Corp',
        'slug'           => 'acme-corp',
        'domain'         => 'acme.com',
        'logoUrl'        => 'https://cdn.acme.com/logo.png',
        'primaryColor'   => '#0057FF',
        'allowedDomains' => ['acme.com', 'acme.io'],
    ],
]);

echo $response->getBody();`,
      },
    },

    // ─── 2. List Organizations ────────────────────────────────────────────────
    {
      id: 'list-organizations',
      method: 'GET',
      path: '/api/v1/organizations',
      title: 'List Organizations',
      description: "Retrieve all organizations the authenticated user belongs to.",
      auth: 'bearer',
      responseFields: [
        { name: '[]', type: 'Organization[]', description: 'Array of organization records the user is a member of.' },
      ],
      responseSample: {
        data: [
          {
            id: 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1',
            name: 'Acme Corp',
            slug: 'acme-corp',
            domain: 'acme.com',
            plan: 'FREE',
            status: 'ACTIVE',
            logoUrl: 'https://cdn.acme.com/logo.png',
            primaryColor: '#0057FF',
            allowedDomains: ['acme.com'],
            maxMembers: 50,
            maxApplications: 10,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
          },
        ],
      },
      codeSamples: {
        curl: `curl -X GET https://api.sutraid.com/api/v1/organizations \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/organizations"
headers = {"Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9..."}

response = requests.get(url, headers=headers)
print(response.json())`,
        nodejs: `const axios = require('axios');

const response = await axios.get(
  'https://api.sutraid.com/api/v1/organizations',
  {
    headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...' },
  }
);

console.log(response.data);`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations"))
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
    .GET()
    .build();

HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    req, _ := http.NewRequest("GET",
        "https://api.sutraid.com/api/v1/organizations", nil)
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$client = new \\GuzzleHttp\\Client();

$response = $client->get('https://api.sutraid.com/api/v1/organizations', [
    'headers' => [
        'Authorization' => 'Bearer eyJhbGciOiJSUzI1NiJ9...',
    ],
]);

echo $response->getBody();`,
      },
    },

    // ─── 3. Get Organization ──────────────────────────────────────────────────
    {
      id: 'get-organization',
      method: 'GET',
      path: '/api/v1/organizations/:orgId',
      title: 'Get Organization',
      description: 'Retrieve details for a specific organization by its ID.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string (UUID)', description: 'Organization unique identifier.', example: 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1' },
        { name: 'name', type: 'string', description: 'Display name.', example: 'Acme Corp' },
        { name: 'slug', type: 'string', description: 'URL-safe identifier.', example: 'acme-corp' },
        { name: 'domain', type: 'string | null', description: 'Primary domain.', example: 'acme.com' },
        { name: 'plan', type: 'string', description: 'Subscription plan.', example: 'FREE' },
        { name: 'status', type: 'string', description: 'Organization status.', example: 'ACTIVE' },
        { name: 'createdAt', type: 'string (ISO 8601)', description: 'Creation timestamp.', example: '2024-01-15T10:30:00.000Z' },
        { name: 'updatedAt', type: 'string (ISO 8601)', description: 'Last update timestamp.', example: '2024-01-15T10:30:00.000Z' },
      ],
      responseSample: {
        id: 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1',
        name: 'Acme Corp',
        slug: 'acme-corp',
        domain: 'acme.com',
        plan: 'FREE',
        status: 'ACTIVE',
        logoUrl: 'https://cdn.acme.com/logo.png',
        primaryColor: '#0057FF',
        allowedDomains: ['acme.com'],
        maxMembers: 50,
        maxApplications: 10,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
      codeSamples: {
        curl: `curl -X GET https://api.sutraid.com/api/v1/organizations/org_01HZ3K8VPNQ4RJXEMYVWCT9BS1 \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."`,
        python: `import requests

org_id = "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1"
url = f"https://api.sutraid.com/api/v1/organizations/{org_id}"
headers = {"Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9..."}

response = requests.get(url, headers=headers)
print(response.json())`,
        nodejs: `const axios = require('axios');

const orgId = 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1';

const response = await axios.get(
  \`https://api.sutraid.com/api/v1/organizations/\${orgId}\`,
  {
    headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...' },
  }
);

console.log(response.data);`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1";
HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/" + orgId))
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
    .GET()
    .build();

HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    orgID := "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1"
    url := "https://api.sutraid.com/api/v1/organizations/" + orgID

    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$orgId = 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1';
$client = new \\GuzzleHttp\\Client();

$response = $client->get(
    "https://api.sutraid.com/api/v1/organizations/{$orgId}",
    [
        'headers' => [
            'Authorization' => 'Bearer eyJhbGciOiJSUzI1NiJ9...',
        ],
    ]
);

echo $response->getBody();`,
      },
    },

    // ─── 4. Update Organization ───────────────────────────────────────────────
    {
      id: 'update-organization',
      method: 'PUT',
      path: '/api/v1/organizations/:orgId',
      title: 'Update Organization',
      description: 'Update organization details. All body fields are optional; only provided fields are updated.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'The unique identifier of the organization to update.',
          example: 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1',
        },
      ],
      requestBody: [
        { name: 'name', in: 'body', type: 'string', required: false, description: 'New display name.', example: 'Acme Corporation' },
        { name: 'slug', in: 'body', type: 'string', required: false, description: 'New URL-safe identifier.', example: 'acme-corporation' },
        { name: 'domain', in: 'body', type: 'string', required: false, description: 'New primary domain.', example: 'acmecorp.com' },
        { name: 'logoUrl', in: 'body', type: 'string', required: false, description: 'New logo URL.', example: 'https://cdn.acme.com/logo-v2.png' },
        { name: 'primaryColor', in: 'body', type: 'string', required: false, description: 'New brand hex color.', example: '#FF5700' },
        { name: 'allowedDomains', in: 'body', type: 'string[]', required: false, description: 'Updated self-join domain list.', example: '["acmecorp.com"]' },
        { name: 'plan', in: 'body', type: 'string', required: false, description: 'Subscription plan.', example: 'PRO' },
        { name: 'status', in: 'body', type: 'string', required: false, description: 'Organization status.', example: 'ACTIVE' },
        { name: 'maxMembers', in: 'body', type: 'number', required: false, description: 'Maximum member seats.', example: '100' },
        { name: 'maxApplications', in: 'body', type: 'number', required: false, description: 'Maximum application count.', example: '20' },
      ],
      responseFields: [
        { name: 'id', type: 'string (UUID)', description: 'Organization unique identifier.' },
        { name: 'name', type: 'string', description: 'Updated display name.', example: 'Acme Corporation' },
        { name: 'updatedAt', type: 'string (ISO 8601)', description: 'Timestamp of the update.' },
      ],
      responseSample: {
        id: 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1',
        name: 'Acme Corporation',
        slug: 'acme-corporation',
        domain: 'acmecorp.com',
        plan: 'PRO',
        status: 'ACTIVE',
        logoUrl: 'https://cdn.acme.com/logo-v2.png',
        primaryColor: '#FF5700',
        allowedDomains: ['acmecorp.com'],
        maxMembers: 100,
        maxApplications: 20,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-06-01T08:00:00.000Z',
      },
      codeSamples: {
        curl: `curl -X PUT https://api.sutraid.com/api/v1/organizations/org_01HZ3K8VPNQ4RJXEMYVWCT9BS1 \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Acme Corporation",
    "slug": "acme-corporation",
    "primaryColor": "#FF5700",
    "maxMembers": 100
  }'`,
        python: `import requests

org_id = "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1"
url = f"https://api.sutraid.com/api/v1/organizations/{org_id}"
headers = {
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9...",
    "Content-Type": "application/json",
}
payload = {
    "name": "Acme Corporation",
    "slug": "acme-corporation",
    "primaryColor": "#FF5700",
    "maxMembers": 100,
}

response = requests.put(url, json=payload, headers=headers)
print(response.json())`,
        nodejs: `const axios = require('axios');

const orgId = 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1';

const response = await axios.put(
  \`https://api.sutraid.com/api/v1/organizations/\${orgId}\`,
  {
    name: 'Acme Corporation',
    slug: 'acme-corporation',
    primaryColor: '#FF5700',
    maxMembers: 100,
  },
  {
    headers: {
      Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...',
      'Content-Type': 'application/json',
    },
  }
);

console.log(response.data);`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1";
HttpClient client = HttpClient.newHttpClient();

String body = """
    {
      "name": "Acme Corporation",
      "slug": "acme-corporation",
      "primaryColor": "#FF5700",
      "maxMembers": 100
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/" + orgId))
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
    .header("Content-Type", "application/json")
    .PUT(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    orgID := "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1"
    payload := map[string]interface{}{
        "name":         "Acme Corporation",
        "slug":         "acme-corporation",
        "primaryColor": "#FF5700",
        "maxMembers":   100,
    }
    body, _ := json.Marshal(payload)

    req, _ := http.NewRequest("PUT",
        "https://api.sutraid.com/api/v1/organizations/"+orgID,
        bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,
        php: `<?php
$orgId = 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1';
$client = new \\GuzzleHttp\\Client();

$response = $client->put(
    "https://api.sutraid.com/api/v1/organizations/{$orgId}",
    [
        'headers' => [
            'Authorization' => 'Bearer eyJhbGciOiJSUzI1NiJ9...',
            'Content-Type'  => 'application/json',
        ],
        'json' => [
            'name'         => 'Acme Corporation',
            'slug'         => 'acme-corporation',
            'primaryColor' => '#FF5700',
            'maxMembers'   => 100,
        ],
    ]
);

echo $response->getBody();`,
      },
    },

    // ─── 5. Delete Organization ───────────────────────────────────────────────
    {
      id: 'delete-organization',
      method: 'DELETE',
      path: '/api/v1/organizations/:orgId',
      title: 'Delete Organization',
      description: 'Permanently delete an organization and all associated data. This action is irreversible.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'The unique identifier of the organization to delete.',
          example: 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1',
        },
      ],
      responseFields: [
        { name: 'message', type: 'string', description: 'Confirmation message.', example: 'Organization deleted' },
      ],
      responseSample: {
        message: 'Organization deleted',
      },
      codeSamples: {
        curl: `curl -X DELETE https://api.sutraid.com/api/v1/organizations/org_01HZ3K8VPNQ4RJXEMYVWCT9BS1 \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."`,
        python: `import requests

org_id = "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1"
url = f"https://api.sutraid.com/api/v1/organizations/{org_id}"
headers = {"Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9..."}

response = requests.delete(url, headers=headers)
print(response.json())`,
        nodejs: `const axios = require('axios');

const orgId = 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1';

const response = await axios.delete(
  \`https://api.sutraid.com/api/v1/organizations/\${orgId}\`,
  {
    headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...' },
  }
);

console.log(response.data);`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1";
HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/" + orgId))
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
    .DELETE()
    .build();

HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    orgID := "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1"
    url := "https://api.sutraid.com/api/v1/organizations/" + orgID

    req, _ := http.NewRequest("DELETE", url, nil)
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$orgId = 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1';
$client = new \\GuzzleHttp\\Client();

$response = $client->delete(
    "https://api.sutraid.com/api/v1/organizations/{$orgId}",
    [
        'headers' => [
            'Authorization' => 'Bearer eyJhbGciOiJSUzI1NiJ9...',
        ],
    ]
);

echo $response->getBody();`,
      },
    },

    // ─── 6. Invite Member ─────────────────────────────────────────────────────
    {
      id: 'invite-member',
      method: 'POST',
      path: '/api/v1/organizations/:orgId/members/invite',
      title: 'Invite Member',
      description: 'Send an invitation email to a user to join the organization with a specified role.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'The organization to invite the user into.',
          example: 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1',
        },
      ],
      requestBody: [
        {
          name: 'email',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Email address of the person to invite.',
          example: 'jane.doe@acme.com',
        },
        {
          name: 'role',
          in: 'body',
          type: 'OrgRole',
          required: true,
          description: 'Role to assign to the invited member.',
          example: 'ORG_ADMIN',
          enum: [
            'SUPER_ADMIN',
            'ORG_ADMIN',
            'APP_ADMIN',
            'USER_ADMIN',
            'GROUP_MEMBERSHIP_ADMIN',
            'HELP_DESK_ADMIN',
            'MOBILE_ADMIN',
            'READ_ONLY_ADMIN',
            'REPORT_ADMIN',
            'API_ACCESS_MANAGEMENT_ADMIN',
          ],
        },
      ],
      responseFields: [
        { name: 'id', type: 'string (UUID)', description: 'Invitation record identifier.' },
        { name: 'email', type: 'string', description: 'Invited email address.', example: 'jane.doe@acme.com' },
        { name: 'role', type: 'OrgRole', description: 'Assigned role.', example: 'ORG_ADMIN' },
        { name: 'status', type: 'string', description: 'Invitation status.', example: 'PENDING' },
        { name: 'expiresAt', type: 'string (ISO 8601)', description: 'Invitation expiry timestamp.' },
      ],
      responseSample: {
        id: 'inv_01HZ4M9XPQR5SKTBZCYF2DN3W7',
        email: 'jane.doe@acme.com',
        role: 'ORG_ADMIN',
        status: 'PENDING',
        organizationId: 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1',
        expiresAt: '2024-01-22T10:30:00.000Z',
        createdAt: '2024-01-15T10:30:00.000Z',
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/organizations/org_01HZ3K8VPNQ4RJXEMYVWCT9BS1/members/invite \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "jane.doe@acme.com",
    "role": "ORG_ADMIN"
  }'`,
        python: `import requests

org_id = "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1"
url = f"https://api.sutraid.com/api/v1/organizations/{org_id}/members/invite"
headers = {
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9...",
    "Content-Type": "application/json",
}
payload = {
    "email": "jane.doe@acme.com",
    "role": "ORG_ADMIN",
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
        nodejs: `const axios = require('axios');

const orgId = 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1';

const response = await axios.post(
  \`https://api.sutraid.com/api/v1/organizations/\${orgId}/members/invite\`,
  {
    email: 'jane.doe@acme.com',
    role: 'ORG_ADMIN',
  },
  {
    headers: {
      Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...',
      'Content-Type': 'application/json',
    },
  }
);

console.log(response.data);`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1";
HttpClient client = HttpClient.newHttpClient();

String body = """
    {
      "email": "jane.doe@acme.com",
      "role": "ORG_ADMIN"
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/organizations/" + orgId + "/members/invite"))
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    orgID := "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1"
    payload := map[string]string{
        "email": "jane.doe@acme.com",
        "role":  "ORG_ADMIN",
    }
    body, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/organizations/"+orgID+"/members/invite",
        bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,
        php: `<?php
$orgId = 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1';
$client = new \\GuzzleHttp\\Client();

$response = $client->post(
    "https://api.sutraid.com/api/v1/organizations/{$orgId}/members/invite",
    [
        'headers' => [
            'Authorization' => 'Bearer eyJhbGciOiJSUzI1NiJ9...',
            'Content-Type'  => 'application/json',
        ],
        'json' => [
            'email' => 'jane.doe@acme.com',
            'role'  => 'ORG_ADMIN',
        ],
    ]
);

echo $response->getBody();`,
      },
    },

    // ─── 7. Update Member Role ────────────────────────────────────────────────
    {
      id: 'update-member-role',
      method: 'PUT',
      path: '/api/v1/organizations/:orgId/members/:memberId/role',
      title: 'Update Member Role',
      description: 'Change the role of an existing organization member.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'The organization identifier.',
          example: 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1',
        },
        {
          name: 'memberId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'The member identifier to update.',
          example: 'mem_01HZ5P2WQRS6TLUCADYG3EN4X8',
        },
      ],
      requestBody: [
        {
          name: 'role',
          in: 'body',
          type: 'OrgRole',
          required: true,
          description: 'The new role to assign to the member.',
          example: 'APP_ADMIN',
          enum: [
            'SUPER_ADMIN',
            'ORG_ADMIN',
            'APP_ADMIN',
            'USER_ADMIN',
            'GROUP_MEMBERSHIP_ADMIN',
            'HELP_DESK_ADMIN',
            'MOBILE_ADMIN',
            'READ_ONLY_ADMIN',
            'REPORT_ADMIN',
            'API_ACCESS_MANAGEMENT_ADMIN',
          ],
        },
      ],
      responseFields: [
        { name: 'id', type: 'string (UUID)', description: 'Member record identifier.' },
        { name: 'userId', type: 'string (UUID)', description: 'User identifier.' },
        { name: 'organizationId', type: 'string (UUID)', description: 'Organization identifier.' },
        { name: 'role', type: 'OrgRole', description: 'Updated role.', example: 'APP_ADMIN' },
        { name: 'updatedAt', type: 'string (ISO 8601)', description: 'Timestamp of the update.' },
      ],
      responseSample: {
        id: 'mem_01HZ5P2WQRS6TLUCADYG3EN4X8',
        userId: 'usr_01HY9K7MNPQ3RJCEBXVWDT8GS2',
        organizationId: 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1',
        role: 'APP_ADMIN',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-06-01T09:15:00.000Z',
      },
      codeSamples: {
        curl: `curl -X PUT https://api.sutraid.com/api/v1/organizations/org_01HZ3K8VPNQ4RJXEMYVWCT9BS1/members/mem_01HZ5P2WQRS6TLUCADYG3EN4X8/role \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
  -H "Content-Type: application/json" \\
  -d '{ "role": "APP_ADMIN" }'`,
        python: `import requests

org_id = "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1"
member_id = "mem_01HZ5P2WQRS6TLUCADYG3EN4X8"
url = f"https://api.sutraid.com/api/v1/organizations/{org_id}/members/{member_id}/role"
headers = {
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9...",
    "Content-Type": "application/json",
}

response = requests.put(url, json={"role": "APP_ADMIN"}, headers=headers)
print(response.json())`,
        nodejs: `const axios = require('axios');

const orgId = 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1';
const memberId = 'mem_01HZ5P2WQRS6TLUCADYG3EN4X8';

const response = await axios.put(
  \`https://api.sutraid.com/api/v1/organizations/\${orgId}/members/\${memberId}/role\`,
  { role: 'APP_ADMIN' },
  {
    headers: {
      Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...',
      'Content-Type': 'application/json',
    },
  }
);

console.log(response.data);`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1";
String memberId = "mem_01HZ5P2WQRS6TLUCADYG3EN4X8";
HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/api/v1/organizations/" + orgId
        + "/members/" + memberId + "/role"))
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
    .header("Content-Type", "application/json")
    .PUT(HttpRequest.BodyPublishers.ofString("{\\"role\\": \\"APP_ADMIN\\"}"))
    .build();

HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    orgID := "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1"
    memberID := "mem_01HZ5P2WQRS6TLUCADYG3EN4X8"

    payload := map[string]string{"role": "APP_ADMIN"}
    body, _ := json.Marshal(payload)

    url := "https://api.sutraid.com/api/v1/organizations/" + orgID +
        "/members/" + memberID + "/role"
    req, _ := http.NewRequest("PUT", url, bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,
        php: `<?php
$orgId = 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1';
$memberId = 'mem_01HZ5P2WQRS6TLUCADYG3EN4X8';
$client = new \\GuzzleHttp\\Client();

$response = $client->put(
    "https://api.sutraid.com/api/v1/organizations/{$orgId}/members/{$memberId}/role",
    [
        'headers' => [
            'Authorization' => 'Bearer eyJhbGciOiJSUzI1NiJ9...',
            'Content-Type'  => 'application/json',
        ],
        'json' => ['role' => 'APP_ADMIN'],
    ]
);

echo $response->getBody();`,
      },
    },

    // ─── 8. Remove Member ─────────────────────────────────────────────────────
    {
      id: 'remove-member',
      method: 'DELETE',
      path: '/api/v1/organizations/:orgId/members/:memberId',
      title: 'Remove Member',
      description: 'Remove a member from the organization. The user account itself is not deleted.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'The organization identifier.',
          example: 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1',
        },
        {
          name: 'memberId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'The member identifier to remove.',
          example: 'mem_01HZ5P2WQRS6TLUCADYG3EN4X8',
        },
      ],
      responseFields: [
        { name: 'message', type: 'string', description: 'Confirmation message.', example: 'Member removed' },
      ],
      responseSample: {
        message: 'Member removed',
      },
      codeSamples: {
        curl: `curl -X DELETE https://api.sutraid.com/api/v1/organizations/org_01HZ3K8VPNQ4RJXEMYVWCT9BS1/members/mem_01HZ5P2WQRS6TLUCADYG3EN4X8 \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."`,
        python: `import requests

org_id = "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1"
member_id = "mem_01HZ5P2WQRS6TLUCADYG3EN4X8"
url = f"https://api.sutraid.com/api/v1/organizations/{org_id}/members/{member_id}"
headers = {"Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9..."}

response = requests.delete(url, headers=headers)
print(response.json())`,
        nodejs: `const axios = require('axios');

const orgId = 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1';
const memberId = 'mem_01HZ5P2WQRS6TLUCADYG3EN4X8';

const response = await axios.delete(
  \`https://api.sutraid.com/api/v1/organizations/\${orgId}/members/\${memberId}\`,
  {
    headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...' },
  }
);

console.log(response.data);`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1";
String memberId = "mem_01HZ5P2WQRS6TLUCADYG3EN4X8";
HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/api/v1/organizations/" + orgId
        + "/members/" + memberId))
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
    .DELETE()
    .build();

HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    orgID := "org_01HZ3K8VPNQ4RJXEMYVWCT9BS1"
    memberID := "mem_01HZ5P2WQRS6TLUCADYG3EN4X8"
    url := "https://api.sutraid.com/api/v1/organizations/" + orgID +
        "/members/" + memberID

    req, _ := http.NewRequest("DELETE", url, nil)
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$orgId = 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1';
$memberId = 'mem_01HZ5P2WQRS6TLUCADYG3EN4X8';
$client = new \\GuzzleHttp\\Client();

$response = $client->delete(
    "https://api.sutraid.com/api/v1/organizations/{$orgId}/members/{$memberId}",
    [
        'headers' => [
            'Authorization' => 'Bearer eyJhbGciOiJSUzI1NiJ9...',
        ],
    ]
);

echo $response->getBody();`,
      },
    },

    // ─── 9. Get Current Org Settings ──────────────────────────────────────────
    {
      id: 'get-org-settings',
      method: 'GET',
      path: '/api/v1/org',
      title: 'Get Current Org Settings',
      description:
        'Retrieve settings for the organization derived from the authenticated JWT context. Requires the org:read permission. The organization is resolved via OrgContextGuard — no orgId path parameter is needed.',
      auth: 'bearer',
      responseFields: [
        { name: 'id', type: 'string (UUID)', description: 'Organization unique identifier.' },
        { name: 'name', type: 'string', description: 'Display name.', example: 'Acme Corp' },
        { name: 'slug', type: 'string', description: 'URL-safe identifier.', example: 'acme-corp' },
        { name: 'domain', type: 'string | null', description: 'Primary domain.' },
        { name: 'plan', type: 'string', description: 'Subscription plan.', example: 'PRO' },
        { name: 'status', type: 'string', description: 'Organization status.', example: 'ACTIVE' },
        { name: 'settings', type: 'Record<string, string>', description: 'Arbitrary key-value organization settings.' },
        { name: 'createdAt', type: 'string (ISO 8601)', description: 'Creation timestamp.' },
        { name: 'updatedAt', type: 'string (ISO 8601)', description: 'Last update timestamp.' },
      ],
      responseSample: {
        id: 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1',
        name: 'Acme Corp',
        slug: 'acme-corp',
        domain: 'acme.com',
        plan: 'PRO',
        status: 'ACTIVE',
        logoUrl: 'https://cdn.acme.com/logo.png',
        primaryColor: '#0057FF',
        allowedDomains: ['acme.com'],
        maxMembers: 100,
        maxApplications: 20,
        settings: {
          mfaRequired: 'true',
          sessionTimeoutSeconds: '3600',
          passwordPolicy: 'strong',
        },
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-06-01T08:00:00.000Z',
      },
      codeSamples: {
        curl: `curl -X GET https://api.sutraid.com/api/v1/org \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/org"
headers = {"Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9..."}

response = requests.get(url, headers=headers)
print(response.json())`,
        nodejs: `const axios = require('axios');

const response = await axios.get(
  'https://api.sutraid.com/api/v1/org',
  {
    headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...' },
  }
);

console.log(response.data);`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/org"))
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
    .GET()
    .build();

HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    req, _ := http.NewRequest("GET",
        "https://api.sutraid.com/api/v1/org", nil)
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php
$client = new \\GuzzleHttp\\Client();

$response = $client->get('https://api.sutraid.com/api/v1/org', [
    'headers' => [
        'Authorization' => 'Bearer eyJhbGciOiJSUzI1NiJ9...',
    ],
]);

echo $response->getBody();`,
      },
    },

    // ─── 10. Update Current Org Settings ─────────────────────────────────────
    {
      id: 'update-org-settings',
      method: 'PUT',
      path: '/api/v1/org',
      title: 'Update Current Org Settings',
      description:
        'Update settings for the organization derived from the authenticated JWT context. Requires the org:update permission. Partial updates are supported — only provided fields are modified.',
      auth: 'bearer',
      requestBody: [
        {
          name: 'name',
          in: 'body',
          type: 'string',
          required: false,
          description: 'New display name for the organization.',
          example: 'Acme Corp (Updated)',
        },
        {
          name: 'settings',
          in: 'body',
          type: 'Record<string, string>',
          required: false,
          description: 'Arbitrary key-value settings to store for the organization. Merged with existing settings.',
          example: '{ "mfaRequired": "true", "sessionTimeoutSeconds": "1800" }',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string (UUID)', description: 'Organization unique identifier.' },
        { name: 'name', type: 'string', description: 'Updated display name.', example: 'Acme Corp (Updated)' },
        { name: 'settings', type: 'Record<string, string>', description: 'Updated key-value settings map.' },
        { name: 'updatedAt', type: 'string (ISO 8601)', description: 'Timestamp of the update.' },
      ],
      responseSample: {
        id: 'org_01HZ3K8VPNQ4RJXEMYVWCT9BS1',
        name: 'Acme Corp (Updated)',
        slug: 'acme-corp',
        domain: 'acme.com',
        plan: 'PRO',
        status: 'ACTIVE',
        logoUrl: 'https://cdn.acme.com/logo.png',
        primaryColor: '#0057FF',
        allowedDomains: ['acme.com'],
        maxMembers: 100,
        maxApplications: 20,
        settings: {
          mfaRequired: 'true',
          sessionTimeoutSeconds: '1800',
          passwordPolicy: 'strong',
        },
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-06-10T12:45:00.000Z',
      },
      codeSamples: {
        curl: `curl -X PUT https://api.sutraid.com/api/v1/org \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Acme Corp (Updated)",
    "settings": {
      "mfaRequired": "true",
      "sessionTimeoutSeconds": "1800"
    }
  }'`,
        python: `import requests

url = "https://api.sutraid.com/api/v1/org"
headers = {
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9...",
    "Content-Type": "application/json",
}
payload = {
    "name": "Acme Corp (Updated)",
    "settings": {
        "mfaRequired": "true",
        "sessionTimeoutSeconds": "1800",
    },
}

response = requests.put(url, json=payload, headers=headers)
print(response.json())`,
        nodejs: `const axios = require('axios');

const response = await axios.put(
  'https://api.sutraid.com/api/v1/org',
  {
    name: 'Acme Corp (Updated)',
    settings: {
      mfaRequired: 'true',
      sessionTimeoutSeconds: '1800',
    },
  },
  {
    headers: {
      Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...',
      'Content-Type': 'application/json',
    },
  }
);

console.log(response.data);`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

HttpClient client = HttpClient.newHttpClient();

String body = """
    {
      "name": "Acme Corp (Updated)",
      "settings": {
        "mfaRequired": "true",
        "sessionTimeoutSeconds": "1800"
      }
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/org"))
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
    .header("Content-Type", "application/json")
    .PUT(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());
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
        "name": "Acme Corp (Updated)",
        "settings": map[string]string{
            "mfaRequired":           "true",
            "sessionTimeoutSeconds": "1800",
        },
    }
    body, _ := json.Marshal(payload)

    req, _ := http.NewRequest("PUT",
        "https://api.sutraid.com/api/v1/org",
        bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,
        php: `<?php
$client = new \\GuzzleHttp\\Client();

$response = $client->put('https://api.sutraid.com/api/v1/org', [
    'headers' => [
        'Authorization' => 'Bearer eyJhbGciOiJSUzI1NiJ9...',
        'Content-Type'  => 'application/json',
    ],
    'json' => [
        'name'     => 'Acme Corp (Updated)',
        'settings' => [
            'mfaRequired'           => 'true',
            'sessionTimeoutSeconds' => '1800',
        ],
    ],
]);

echo $response->getBody();`,
      },
    },
  ],
};
