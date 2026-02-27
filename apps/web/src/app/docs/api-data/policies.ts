import { DocSection } from './types';

export const policiesSection: DocSection = {
  title: 'Policies',
  slug: 'policies',
  description: 'Attribute-based access control (ABAC) policies, password policies, and policy evaluation for fine-grained authorization.',
  endpoints: [
    /* ------------------------------------------------------------------ */
    /*  CREATE POLICY                                                     */
    /* ------------------------------------------------------------------ */
    {
      id: 'create-policy',
      method: 'POST',
      path: '/api/v1/policies',
      title: 'Create a policy',
      description: 'Creates a new ABAC policy for an organization. Requires SUPER_ADMIN or ORG_ADMIN role.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the organization.',
          example: 'org_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      requestBody: [
        {
          name: 'name',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Human-readable name for the policy.',
          example: 'Allow API read access',
        },
        {
          name: 'description',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Optional description of the policy purpose.',
          example: 'Grants read-only access to all API resources.',
        },
        {
          name: 'effect',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Whether the policy allows or denies access. Defaults to ALLOW.',
          enum: ['ALLOW', 'DENY'],
          example: 'ALLOW',
        },
        {
          name: 'resource',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The resource pattern this policy applies to. Supports wildcards (e.g. "api:orders:*").',
          example: 'api:orders:*',
        },
        {
          name: 'actions',
          in: 'body',
          type: 'string[]',
          required: true,
          description: 'List of actions this policy governs (e.g. ["read", "list"]). Use ["*"] for all actions.',
          example: '["read", "list"]',
        },
        {
          name: 'conditions',
          in: 'body',
          type: 'object',
          required: false,
          description: 'JSON object of contextual conditions (ipRange, geoLocations, timeWindow, or custom key-value pairs).',
          example: '{ "ipRange": "10.0.0.0/8" }',
        },
        {
          name: 'priority',
          in: 'body',
          type: 'number',
          required: false,
          description: 'Evaluation order priority. Higher values are evaluated first. Defaults to 0.',
          example: '10',
        },
        {
          name: 'type',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Policy type category.',
          enum: ['ACCESS', 'SIGN_ON', 'MFA', 'PASSWORD'],
          example: 'ACCESS',
        },
        {
          name: 'rules',
          in: 'body',
          type: 'array',
          required: false,
          description: 'Array of rule objects for sign-on/auth policies. Each rule can specify conditions and requirements.',
          example: '[{ "priority": 1, "conditions": { "group": "Admins" }, "requirement": "MFA_REQUIRED" }]',
        },
        {
          name: 'enabled',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Whether the policy is active. Defaults to true.',
          example: 'true',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Unique identifier of the created policy.' },
        { name: 'organizationId', type: 'string', description: 'Organization the policy belongs to.' },
        { name: 'name', type: 'string', description: 'Name of the policy.' },
        { name: 'description', type: 'string | null', description: 'Description of the policy.' },
        { name: 'type', type: 'string', description: 'Policy type: ACCESS, SIGN_ON, MFA, or PASSWORD.' },
        { name: 'effect', type: 'string', description: 'Policy effect: ALLOW or DENY.' },
        { name: 'resource', type: 'string', description: 'Resource pattern the policy applies to.' },
        { name: 'actions', type: 'string[]', description: 'Actions governed by this policy.' },
        { name: 'rules', type: 'array', description: 'Array of rule objects (for sign-on/auth policies).' },
        { name: 'conditions', type: 'object', description: 'Contextual conditions for policy evaluation.' },
        { name: 'priority', type: 'number', description: 'Evaluation priority (higher = evaluated first).' },
        { name: 'enabled', type: 'boolean', description: 'Whether the policy is active.' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 timestamp of when the policy was created.' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 timestamp of the last update.' },
      ],
      responseSample: {
        id: 'pol_01hx9z1q2w3e4r5t6y7u',
        organizationId: 'org_01hx9z1q2w3e4r5t6y7u',
        name: 'Allow API read access',
        description: 'Grants read-only access to all API resources.',
        type: 'ACCESS',
        effect: 'ALLOW',
        resource: 'api:orders:*',
        actions: ['read', 'list'],
        rules: [],
        conditions: { ipRange: '10.0.0.0/8' },
        priority: 10,
        enabled: true,
        createdAt: '2024-06-15T10:00:00Z',
        updatedAt: '2024-06-15T10:00:00Z',
      },
      codeSamples: {
        curl: `curl -X POST "https://api.sutraid.com/api/v1/organizations/org_01hx9z1q2w3e4r5t6y7u/policies" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Allow API read access",
    "description": "Grants read-only access to all API resources.",
    "effect": "ALLOW",
    "resource": "api:orders:*",
    "actions": ["read", "list"],
    "conditions": { "ipRange": "10.0.0.0/8" },
    "priority": 10,
    "type": "ACCESS",
    "enabled": true
  }'`,

        python: `import requests

org_id = "org_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/organizations/{org_id}/policies"
headers = {
    "Authorization": "Bearer <your_token>",
    "Content-Type": "application/json",
}
payload = {
    "name": "Allow API read access",
    "description": "Grants read-only access to all API resources.",
    "effect": "ALLOW",
    "resource": "api:orders:*",
    "actions": ["read", "list"],
    "conditions": {"ipRange": "10.0.0.0/8"},
    "priority": 10,
    "type": "ACCESS",
    "enabled": True,
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgId = 'org_01hx9z1q2w3e4r5t6y7u';

const response = await axios.post(
  \`https://api.sutraid.com/api/v1/organizations/\${orgId}/policies\`,
  {
    name: 'Allow API read access',
    description: 'Grants read-only access to all API resources.',
    effect: 'ALLOW',
    resource: 'api:orders:*',
    actions: ['read', 'list'],
    conditions: { ipRange: '10.0.0.0/8' },
    priority: 10,
    type: 'ACCESS',
    enabled: true,
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

String orgId = "org_01hx9z1q2w3e4r5t6y7u";

String body = """
    {
      "name": "Allow API read access",
      "description": "Grants read-only access to all API resources.",
      "effect": "ALLOW",
      "resource": "api:orders:*",
      "actions": ["read", "list"],
      "conditions": { "ipRange": "10.0.0.0/8" },
      "priority": 10,
      "type": "ACCESS",
      "enabled": true
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/api/v1/organizations/" + orgId + "/policies"
    ))
    .header("Authorization", "Bearer <your_token>")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(body))
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
    orgID := "org_01hx9z1q2w3e4r5t6y7u"
    url := "https://api.sutraid.com/api/v1/organizations/" + orgID + "/policies"

    body := strings.NewReader(\`{
      "name": "Allow API read access",
      "description": "Grants read-only access to all API resources.",
      "effect": "ALLOW",
      "resource": "api:orders:*",
      "actions": ["read", "list"],
      "conditions": { "ipRange": "10.0.0.0/8" },
      "priority": 10,
      "type": "ACCESS",
      "enabled": true
    }\`)

    req, _ := http.NewRequest("POST", url, body)
    req.Header.Set("Authorization", "Bearer <your_token>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    respBody, _ := io.ReadAll(resp.Body)
    fmt.Println(string(respBody))
}`,

        php: `<?php
$orgId = 'org_01hx9z1q2w3e4r5t6y7u';

$payload = json_encode([
    'name' => 'Allow API read access',
    'description' => 'Grants read-only access to all API resources.',
    'effect' => 'ALLOW',
    'resource' => 'api:orders:*',
    'actions' => ['read', 'list'],
    'conditions' => ['ipRange' => '10.0.0.0/8'],
    'priority' => 10,
    'type' => 'ACCESS',
    'enabled' => true,
]);

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/organizations/{$orgId}/policies",
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

    /* ------------------------------------------------------------------ */
    /*  LIST POLICIES                                                     */
    /* ------------------------------------------------------------------ */
    {
      id: 'list-policies',
      method: 'GET',
      path: '/api/v1/policies',
      title: 'List policies',
      description: 'Returns all policies for an organization, ordered by priority (descending) then creation date. Optionally filter by policy type. Requires SUPER_ADMIN, ORG_ADMIN, or READ_ONLY_ADMIN role.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the organization.',
          example: 'org_01hx9z1q2w3e4r5t6y7u',
        },
        {
          name: 'type',
          in: 'query',
          type: 'string',
          required: false,
          description: 'Filter policies by type.',
          enum: ['ACCESS', 'SIGN_ON', 'MFA', 'PASSWORD'],
          example: 'ACCESS',
        },
      ],
      responseFields: [
        { name: '[]', type: 'Policy[]', description: 'Array of policy objects.' },
        { name: '[].id', type: 'string', description: 'Unique identifier of the policy.' },
        { name: '[].organizationId', type: 'string', description: 'Organization the policy belongs to.' },
        { name: '[].name', type: 'string', description: 'Name of the policy.' },
        { name: '[].description', type: 'string | null', description: 'Description of the policy.' },
        { name: '[].type', type: 'string', description: 'Policy type: ACCESS, SIGN_ON, MFA, or PASSWORD.' },
        { name: '[].effect', type: 'string', description: 'Policy effect: ALLOW or DENY.' },
        { name: '[].resource', type: 'string', description: 'Resource pattern the policy applies to.' },
        { name: '[].actions', type: 'string[]', description: 'Actions governed by this policy.' },
        { name: '[].rules', type: 'array', description: 'Array of rule objects (for sign-on/auth policies).' },
        { name: '[].conditions', type: 'object', description: 'Contextual conditions for policy evaluation.' },
        { name: '[].priority', type: 'number', description: 'Evaluation priority (higher = evaluated first).' },
        { name: '[].enabled', type: 'boolean', description: 'Whether the policy is active.' },
        { name: '[].createdAt', type: 'string', description: 'ISO 8601 timestamp of when the policy was created.' },
        { name: '[].updatedAt', type: 'string', description: 'ISO 8601 timestamp of the last update.' },
      ],
      responseSample: {
        data: [
          {
            id: 'pol_01hx9z1q2w3e4r5t6y7u',
            organizationId: 'org_01hx9z1q2w3e4r5t6y7u',
            name: 'Allow API read access',
            description: 'Grants read-only access to all API resources.',
            type: 'ACCESS',
            effect: 'ALLOW',
            resource: 'api:orders:*',
            actions: ['read', 'list'],
            rules: [],
            conditions: { ipRange: '10.0.0.0/8' },
            priority: 10,
            enabled: true,
            createdAt: '2024-06-15T10:00:00Z',
            updatedAt: '2024-06-15T10:00:00Z',
          },
          {
            id: 'pol_02jy0a2r3x4f5s6u7v8w',
            organizationId: 'org_01hx9z1q2w3e4r5t6y7u',
            name: 'Default Sign-on Policy',
            description: 'Default authentication rules for all users',
            type: 'SIGN_ON',
            effect: 'ALLOW',
            resource: 'auth:login',
            actions: ['login'],
            rules: [
              {
                id: 'default_rule',
                name: 'Catch-all',
                conditions: { group: 'Everyone' },
                requirement: 'MFA_OPTIONAL',
                priority: 999,
              },
            ],
            conditions: {},
            priority: 0,
            enabled: true,
            createdAt: '2024-06-10T08:00:00Z',
            updatedAt: '2024-06-10T08:00:00Z',
          },
        ],
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/organizations/org_01hx9z1q2w3e4r5t6y7u/policies?type=ACCESS" \\
  -H "Authorization: Bearer <your_token>"`,

        python: `import requests

org_id = "org_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/organizations/{org_id}/policies"
headers = {
    "Authorization": "Bearer <your_token>",
}
params = {
    "type": "ACCESS",
}

response = requests.get(url, headers=headers, params=params)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgId = 'org_01hx9z1q2w3e4r5t6y7u';

const response = await axios.get(
  \`https://api.sutraid.com/api/v1/organizations/\${orgId}/policies\`,
  {
    headers: {
      Authorization: 'Bearer <your_token>',
    },
    params: {
      type: 'ACCESS',
    },
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "org_01hx9z1q2w3e4r5t6y7u";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/api/v1/organizations/" + orgId +
        "/policies?type=ACCESS"
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
    orgID := "org_01hx9z1q2w3e4r5t6y7u"
    url := "https://api.sutraid.com/api/v1/organizations/" + orgID +
        "/policies?type=ACCESS"

    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer <your_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgId = 'org_01hx9z1q2w3e4r5t6y7u';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/organizations/{$orgId}/policies?type=ACCESS",
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

    /* ------------------------------------------------------------------ */
    /*  GET POLICY BY ID                                                  */
    /* ------------------------------------------------------------------ */
    {
      id: 'get-policy',
      method: 'GET',
      path: '/api/v1/policies/:policyId',
      title: 'Get a policy',
      description: 'Retrieves a single policy by its ID. Requires SUPER_ADMIN, ORG_ADMIN, or READ_ONLY_ADMIN role.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the organization.',
          example: 'org_01hx9z1q2w3e4r5t6y7u',
        },
        {
          name: 'policyId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the policy.',
          example: 'pol_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Unique identifier of the policy.' },
        { name: 'organizationId', type: 'string', description: 'Organization the policy belongs to.' },
        { name: 'name', type: 'string', description: 'Name of the policy.' },
        { name: 'description', type: 'string | null', description: 'Description of the policy.' },
        { name: 'type', type: 'string', description: 'Policy type: ACCESS, SIGN_ON, MFA, or PASSWORD.' },
        { name: 'effect', type: 'string', description: 'Policy effect: ALLOW or DENY.' },
        { name: 'resource', type: 'string', description: 'Resource pattern the policy applies to.' },
        { name: 'actions', type: 'string[]', description: 'Actions governed by this policy.' },
        { name: 'rules', type: 'array', description: 'Array of rule objects (for sign-on/auth policies).' },
        { name: 'conditions', type: 'object', description: 'Contextual conditions for policy evaluation.' },
        { name: 'priority', type: 'number', description: 'Evaluation priority (higher = evaluated first).' },
        { name: 'enabled', type: 'boolean', description: 'Whether the policy is active.' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 timestamp of when the policy was created.' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 timestamp of the last update.' },
      ],
      responseSample: {
        id: 'pol_01hx9z1q2w3e4r5t6y7u',
        organizationId: 'org_01hx9z1q2w3e4r5t6y7u',
        name: 'Allow API read access',
        description: 'Grants read-only access to all API resources.',
        type: 'ACCESS',
        effect: 'ALLOW',
        resource: 'api:orders:*',
        actions: ['read', 'list'],
        rules: [],
        conditions: { ipRange: '10.0.0.0/8' },
        priority: 10,
        enabled: true,
        createdAt: '2024-06-15T10:00:00Z',
        updatedAt: '2024-06-15T10:00:00Z',
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/organizations/org_01hx9z1q2w3e4r5t6y7u/policies/pol_01hx9z1q2w3e4r5t6y7u" \\
  -H "Authorization: Bearer <your_token>"`,

        python: `import requests

org_id = "org_01hx9z1q2w3e4r5t6y7u"
policy_id = "pol_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/organizations/{org_id}/policies/{policy_id}"
headers = {
    "Authorization": "Bearer <your_token>",
}

response = requests.get(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgId = 'org_01hx9z1q2w3e4r5t6y7u';
const policyId = 'pol_01hx9z1q2w3e4r5t6y7u';

const response = await axios.get(
  \`https://api.sutraid.com/api/v1/organizations/\${orgId}/policies/\${policyId}\`,
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

String orgId = "org_01hx9z1q2w3e4r5t6y7u";
String policyId = "pol_01hx9z1q2w3e4r5t6y7u";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/api/v1/organizations/" + orgId +
        "/policies/" + policyId
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
    orgID := "org_01hx9z1q2w3e4r5t6y7u"
    policyID := "pol_01hx9z1q2w3e4r5t6y7u"
    url := "https://api.sutraid.com/api/v1/organizations/" + orgID +
        "/policies/" + policyID

    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer <your_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgId = 'org_01hx9z1q2w3e4r5t6y7u';
$policyId = 'pol_01hx9z1q2w3e4r5t6y7u';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/organizations/{$orgId}/policies/{$policyId}",
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

    /* ------------------------------------------------------------------ */
    /*  UPDATE POLICY                                                     */
    /* ------------------------------------------------------------------ */
    {
      id: 'update-policy',
      method: 'PUT',
      path: '/api/v1/policies/:policyId',
      title: 'Update a policy',
      description: 'Updates an existing ABAC policy. All body fields are optional; only provided fields are changed. Requires SUPER_ADMIN or ORG_ADMIN role.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the organization.',
          example: 'org_01hx9z1q2w3e4r5t6y7u',
        },
        {
          name: 'policyId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the policy to update.',
          example: 'pol_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      requestBody: [
        {
          name: 'name',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Updated name for the policy.',
          example: 'Allow API full access',
        },
        {
          name: 'description',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Updated description.',
          example: 'Grants full access to all API resources.',
        },
        {
          name: 'effect',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Updated effect.',
          enum: ['ALLOW', 'DENY'],
          example: 'ALLOW',
        },
        {
          name: 'resource',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Updated resource pattern.',
          example: 'api:*',
        },
        {
          name: 'actions',
          in: 'body',
          type: 'string[]',
          required: false,
          description: 'Updated list of actions.',
          example: '["read", "write", "delete"]',
        },
        {
          name: 'conditions',
          in: 'body',
          type: 'object',
          required: false,
          description: 'Updated contextual conditions.',
          example: '{ "ipRange": "192.168.0.0/16" }',
        },
        {
          name: 'priority',
          in: 'body',
          type: 'number',
          required: false,
          description: 'Updated evaluation priority.',
          example: '20',
        },
        {
          name: 'enabled',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Enable or disable the policy.',
          example: 'true',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Unique identifier of the policy.' },
        { name: 'organizationId', type: 'string', description: 'Organization the policy belongs to.' },
        { name: 'name', type: 'string', description: 'Updated name of the policy.' },
        { name: 'description', type: 'string | null', description: 'Updated description.' },
        { name: 'type', type: 'string', description: 'Policy type: ACCESS, SIGN_ON, MFA, or PASSWORD.' },
        { name: 'effect', type: 'string', description: 'Policy effect: ALLOW or DENY.' },
        { name: 'resource', type: 'string', description: 'Resource pattern the policy applies to.' },
        { name: 'actions', type: 'string[]', description: 'Actions governed by this policy.' },
        { name: 'rules', type: 'array', description: 'Array of rule objects (for sign-on/auth policies).' },
        { name: 'conditions', type: 'object', description: 'Contextual conditions for policy evaluation.' },
        { name: 'priority', type: 'number', description: 'Evaluation priority.' },
        { name: 'enabled', type: 'boolean', description: 'Whether the policy is active.' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 timestamp of when the policy was created.' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 timestamp of the last update.' },
      ],
      responseSample: {
        id: 'pol_01hx9z1q2w3e4r5t6y7u',
        organizationId: 'org_01hx9z1q2w3e4r5t6y7u',
        name: 'Allow API full access',
        description: 'Grants full access to all API resources.',
        type: 'ACCESS',
        effect: 'ALLOW',
        resource: 'api:*',
        actions: ['read', 'write', 'delete'],
        rules: [],
        conditions: { ipRange: '192.168.0.0/16' },
        priority: 20,
        enabled: true,
        createdAt: '2024-06-15T10:00:00Z',
        updatedAt: '2024-06-15T14:30:00Z',
      },
      codeSamples: {
        curl: `curl -X PUT "https://api.sutraid.com/api/v1/organizations/org_01hx9z1q2w3e4r5t6y7u/policies/pol_01hx9z1q2w3e4r5t6y7u" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Allow API full access",
    "actions": ["read", "write", "delete"],
    "resource": "api:*",
    "priority": 20
  }'`,

        python: `import requests

org_id = "org_01hx9z1q2w3e4r5t6y7u"
policy_id = "pol_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/organizations/{org_id}/policies/{policy_id}"
headers = {
    "Authorization": "Bearer <your_token>",
    "Content-Type": "application/json",
}
payload = {
    "name": "Allow API full access",
    "actions": ["read", "write", "delete"],
    "resource": "api:*",
    "priority": 20,
}

response = requests.put(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgId = 'org_01hx9z1q2w3e4r5t6y7u';
const policyId = 'pol_01hx9z1q2w3e4r5t6y7u';

const response = await axios.put(
  \`https://api.sutraid.com/api/v1/organizations/\${orgId}/policies/\${policyId}\`,
  {
    name: 'Allow API full access',
    actions: ['read', 'write', 'delete'],
    resource: 'api:*',
    priority: 20,
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

String orgId = "org_01hx9z1q2w3e4r5t6y7u";
String policyId = "pol_01hx9z1q2w3e4r5t6y7u";

String body = """
    {
      "name": "Allow API full access",
      "actions": ["read", "write", "delete"],
      "resource": "api:*",
      "priority": 20
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/api/v1/organizations/" + orgId +
        "/policies/" + policyId
    ))
    .header("Authorization", "Bearer <your_token>")
    .header("Content-Type", "application/json")
    .PUT(HttpRequest.BodyPublishers.ofString(body))
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
    orgID := "org_01hx9z1q2w3e4r5t6y7u"
    policyID := "pol_01hx9z1q2w3e4r5t6y7u"
    url := "https://api.sutraid.com/api/v1/organizations/" + orgID +
        "/policies/" + policyID

    body := strings.NewReader(\`{
      "name": "Allow API full access",
      "actions": ["read", "write", "delete"],
      "resource": "api:*",
      "priority": 20
    }\`)

    req, _ := http.NewRequest("PUT", url, body)
    req.Header.Set("Authorization", "Bearer <your_token>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    respBody, _ := io.ReadAll(resp.Body)
    fmt.Println(string(respBody))
}`,

        php: `<?php
$orgId = 'org_01hx9z1q2w3e4r5t6y7u';
$policyId = 'pol_01hx9z1q2w3e4r5t6y7u';

$payload = json_encode([
    'name' => 'Allow API full access',
    'actions' => ['read', 'write', 'delete'],
    'resource' => 'api:*',
    'priority' => 20,
]);

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/organizations/{$orgId}/policies/{$policyId}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PUT',
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

    /* ------------------------------------------------------------------ */
    /*  DELETE POLICY                                                     */
    /* ------------------------------------------------------------------ */
    {
      id: 'delete-policy',
      method: 'DELETE',
      path: '/api/v1/policies/:policyId',
      title: 'Delete a policy',
      description: 'Permanently deletes a policy. This action cannot be undone. Requires SUPER_ADMIN or ORG_ADMIN role.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the organization.',
          example: 'org_01hx9z1q2w3e4r5t6y7u',
        },
        {
          name: 'policyId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the policy to delete.',
          example: 'pol_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      responseFields: [
        { name: 'message', type: 'string', description: 'Confirmation message indicating the policy was deleted.' },
      ],
      responseSample: {
        message: 'Policy deleted successfully',
      },
      codeSamples: {
        curl: `curl -X DELETE "https://api.sutraid.com/api/v1/organizations/org_01hx9z1q2w3e4r5t6y7u/policies/pol_01hx9z1q2w3e4r5t6y7u" \\
  -H "Authorization: Bearer <your_token>"`,

        python: `import requests

org_id = "org_01hx9z1q2w3e4r5t6y7u"
policy_id = "pol_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/organizations/{org_id}/policies/{policy_id}"
headers = {
    "Authorization": "Bearer <your_token>",
}

response = requests.delete(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgId = 'org_01hx9z1q2w3e4r5t6y7u';
const policyId = 'pol_01hx9z1q2w3e4r5t6y7u';

const response = await axios.delete(
  \`https://api.sutraid.com/api/v1/organizations/\${orgId}/policies/\${policyId}\`,
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

String orgId = "org_01hx9z1q2w3e4r5t6y7u";
String policyId = "pol_01hx9z1q2w3e4r5t6y7u";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/api/v1/organizations/" + orgId +
        "/policies/" + policyId
    ))
    .header("Authorization", "Bearer <your_token>")
    .DELETE()
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
    orgID := "org_01hx9z1q2w3e4r5t6y7u"
    policyID := "pol_01hx9z1q2w3e4r5t6y7u"
    url := "https://api.sutraid.com/api/v1/organizations/" + orgID +
        "/policies/" + policyID

    req, _ := http.NewRequest("DELETE", url, nil)
    req.Header.Set("Authorization", "Bearer <your_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgId = 'org_01hx9z1q2w3e4r5t6y7u';
$policyId = 'pol_01hx9z1q2w3e4r5t6y7u';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/organizations/{$orgId}/policies/{$policyId}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'DELETE',
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
    /*  GET PASSWORD POLICY                                               */
    /* ------------------------------------------------------------------ */
    {
      id: 'get-password-policy',
      method: 'GET',
      path: '/api/v1/policies/password',
      title: 'Get password policy',
      description: 'Retrieves the password complexity and lockout policy for an organization. A default policy is auto-created if none exists. Requires SUPER_ADMIN, ORG_ADMIN, or READ_ONLY_ADMIN role.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the organization.',
          example: 'org_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Unique identifier of the password policy.' },
        { name: 'organizationId', type: 'string', description: 'Organization the policy belongs to.' },
        { name: 'minLength', type: 'number', description: 'Minimum password length.' },
        { name: 'requireUppercase', type: 'boolean', description: 'Whether uppercase letters are required.' },
        { name: 'requireLowercase', type: 'boolean', description: 'Whether lowercase letters are required.' },
        { name: 'requireNumbers', type: 'boolean', description: 'Whether numeric digits are required.' },
        { name: 'requireSymbols', type: 'boolean', description: 'Whether special characters are required.' },
        { name: 'maxAgeDays', type: 'number', description: 'Maximum password age in days. 0 means passwords never expire.' },
        { name: 'historyCount', type: 'number', description: 'Number of previous passwords that cannot be reused.' },
        { name: 'lockoutThreshold', type: 'number', description: 'Number of failed attempts before account lockout.' },
        { name: 'lockoutDuration', type: 'number', description: 'Lockout duration in minutes.' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 timestamp of when the policy was created.' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 timestamp of the last update.' },
      ],
      responseSample: {
        id: 'pwp_01hx9z1q2w3e4r5t6y7u',
        organizationId: 'org_01hx9z1q2w3e4r5t6y7u',
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true,
        maxAgeDays: 0,
        historyCount: 5,
        lockoutThreshold: 5,
        lockoutDuration: 30,
        createdAt: '2024-06-01T08:00:00Z',
        updatedAt: '2024-06-01T08:00:00Z',
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/organizations/org_01hx9z1q2w3e4r5t6y7u/policies/password" \\
  -H "Authorization: Bearer <your_token>"`,

        python: `import requests

org_id = "org_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/organizations/{org_id}/policies/password"
headers = {
    "Authorization": "Bearer <your_token>",
}

response = requests.get(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgId = 'org_01hx9z1q2w3e4r5t6y7u';

const response = await axios.get(
  \`https://api.sutraid.com/api/v1/organizations/\${orgId}/policies/password\`,
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

String orgId = "org_01hx9z1q2w3e4r5t6y7u";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/api/v1/organizations/" + orgId +
        "/policies/password"
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
    orgID := "org_01hx9z1q2w3e4r5t6y7u"
    url := "https://api.sutraid.com/api/v1/organizations/" + orgID +
        "/policies/password"

    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer <your_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgId = 'org_01hx9z1q2w3e4r5t6y7u';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/organizations/{$orgId}/policies/password",
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

    /* ------------------------------------------------------------------ */
    /*  UPDATE PASSWORD POLICY                                            */
    /* ------------------------------------------------------------------ */
    {
      id: 'update-password-policy',
      method: 'PUT',
      path: '/api/v1/policies/password',
      title: 'Update password policy',
      description: 'Updates the password complexity and lockout policy for an organization. All body fields are optional. Requires SUPER_ADMIN or ORG_ADMIN role.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the organization.',
          example: 'org_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      requestBody: [
        {
          name: 'minLength',
          in: 'body',
          type: 'number',
          required: false,
          description: 'Minimum password length.',
          example: '14',
        },
        {
          name: 'requireUppercase',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Whether uppercase letters are required.',
          example: 'true',
        },
        {
          name: 'requireLowercase',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Whether lowercase letters are required.',
          example: 'true',
        },
        {
          name: 'requireNumbers',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Whether numeric digits are required.',
          example: 'true',
        },
        {
          name: 'requireSymbols',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Whether special characters are required.',
          example: 'true',
        },
        {
          name: 'lockoutThreshold',
          in: 'body',
          type: 'number',
          required: false,
          description: 'Number of failed login attempts before account lockout.',
          example: '3',
        },
        {
          name: 'lockoutDuration',
          in: 'body',
          type: 'number',
          required: false,
          description: 'Lockout duration in minutes.',
          example: '60',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Unique identifier of the password policy.' },
        { name: 'organizationId', type: 'string', description: 'Organization the policy belongs to.' },
        { name: 'minLength', type: 'number', description: 'Minimum password length.' },
        { name: 'requireUppercase', type: 'boolean', description: 'Whether uppercase letters are required.' },
        { name: 'requireLowercase', type: 'boolean', description: 'Whether lowercase letters are required.' },
        { name: 'requireNumbers', type: 'boolean', description: 'Whether numeric digits are required.' },
        { name: 'requireSymbols', type: 'boolean', description: 'Whether special characters are required.' },
        { name: 'maxAgeDays', type: 'number', description: 'Maximum password age in days.' },
        { name: 'historyCount', type: 'number', description: 'Number of previous passwords that cannot be reused.' },
        { name: 'lockoutThreshold', type: 'number', description: 'Number of failed attempts before lockout.' },
        { name: 'lockoutDuration', type: 'number', description: 'Lockout duration in minutes.' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 timestamp of when the policy was created.' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 timestamp of the last update.' },
      ],
      responseSample: {
        id: 'pwp_01hx9z1q2w3e4r5t6y7u',
        organizationId: 'org_01hx9z1q2w3e4r5t6y7u',
        minLength: 14,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true,
        maxAgeDays: 0,
        historyCount: 5,
        lockoutThreshold: 3,
        lockoutDuration: 60,
        createdAt: '2024-06-01T08:00:00Z',
        updatedAt: '2024-06-20T11:45:00Z',
      },
      codeSamples: {
        curl: `curl -X PUT "https://api.sutraid.com/api/v1/organizations/org_01hx9z1q2w3e4r5t6y7u/policies/password" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "minLength": 14,
    "lockoutThreshold": 3,
    "lockoutDuration": 60
  }'`,

        python: `import requests

org_id = "org_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/organizations/{org_id}/policies/password"
headers = {
    "Authorization": "Bearer <your_token>",
    "Content-Type": "application/json",
}
payload = {
    "minLength": 14,
    "lockoutThreshold": 3,
    "lockoutDuration": 60,
}

response = requests.put(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgId = 'org_01hx9z1q2w3e4r5t6y7u';

const response = await axios.put(
  \`https://api.sutraid.com/api/v1/organizations/\${orgId}/policies/password\`,
  {
    minLength: 14,
    lockoutThreshold: 3,
    lockoutDuration: 60,
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

String orgId = "org_01hx9z1q2w3e4r5t6y7u";

String body = """
    {
      "minLength": 14,
      "lockoutThreshold": 3,
      "lockoutDuration": 60
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/api/v1/organizations/" + orgId +
        "/policies/password"
    ))
    .header("Authorization", "Bearer <your_token>")
    .header("Content-Type", "application/json")
    .PUT(HttpRequest.BodyPublishers.ofString(body))
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
    orgID := "org_01hx9z1q2w3e4r5t6y7u"
    url := "https://api.sutraid.com/api/v1/organizations/" + orgID +
        "/policies/password"

    body := strings.NewReader(\`{
      "minLength": 14,
      "lockoutThreshold": 3,
      "lockoutDuration": 60
    }\`)

    req, _ := http.NewRequest("PUT", url, body)
    req.Header.Set("Authorization", "Bearer <your_token>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    respBody, _ := io.ReadAll(resp.Body)
    fmt.Println(string(respBody))
}`,

        php: `<?php
$orgId = 'org_01hx9z1q2w3e4r5t6y7u';

$payload = json_encode([
    'minLength' => 14,
    'lockoutThreshold' => 3,
    'lockoutDuration' => 60,
]);

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/organizations/{$orgId}/policies/password",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PUT',
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

    /* ------------------------------------------------------------------ */
    /*  EVALUATE POLICY                                                   */
    /* ------------------------------------------------------------------ */
    {
      id: 'evaluate-policy',
      method: 'POST',
      path: '/api/v1/policies/evaluate',
      title: 'Evaluate policies',
      description: 'Tests policy evaluation for a given resource, action, and context. Uses deny-override strategy: if any DENY policy matches, the result is DENY. Returns the decision, the matched policy, and the reason. Requires SUPER_ADMIN or ORG_ADMIN role.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the organization.',
          example: 'org_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      requestBody: [
        {
          name: 'userId',
          in: 'body',
          type: 'string',
          required: false,
          description: 'User ID to evaluate policies for. Defaults to the authenticated user.',
          example: 'usr_01hx9z1q2w3e4r5t6y7u',
        },
        {
          name: 'agentId',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Agent/service ID making the request (for machine-to-machine evaluation).',
          example: 'agent_01hx9z1q2w3e4r5t6y7u',
        },
        {
          name: 'resource',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The resource to evaluate access for.',
          example: 'api:orders:123',
        },
        {
          name: 'action',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The action to evaluate (e.g. "read", "write", "delete").',
          example: 'read',
        },
        {
          name: 'context',
          in: 'body',
          type: 'object',
          required: false,
          description: 'Additional context for condition matching (ipAddress, userAgent, geoLocation, timestamp, or custom keys).',
          example: '{ "ipAddress": "10.0.1.50", "geoLocation": "US" }',
        },
      ],
      responseFields: [
        { name: 'decision', type: 'string', description: 'The evaluation result: ALLOW or DENY.' },
        { name: 'matchedPolicy', type: 'object | undefined', description: 'The policy that produced the decision (absent if no policy matched).' },
        { name: 'matchedPolicy.id', type: 'string', description: 'ID of the matched policy.' },
        { name: 'matchedPolicy.name', type: 'string', description: 'Name of the matched policy.' },
        { name: 'matchedPolicy.effect', type: 'string', description: 'Effect of the matched policy: ALLOW or DENY.' },
        { name: 'matchedPolicy.priority', type: 'number', description: 'Priority of the matched policy.' },
        { name: 'reason', type: 'string', description: 'Human-readable explanation of the decision.' },
      ],
      responseSample: {
        decision: 'ALLOW',
        matchedPolicy: {
          id: 'pol_01hx9z1q2w3e4r5t6y7u',
          name: 'Allow API read access',
          effect: 'ALLOW',
          priority: 10,
        },
        reason: 'Allowed by policy: Allow API read access',
      },
      codeSamples: {
        curl: `curl -X POST "https://api.sutraid.com/api/v1/organizations/org_01hx9z1q2w3e4r5t6y7u/policies/evaluate" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "resource": "api:orders:123",
    "action": "read",
    "context": {
      "ipAddress": "10.0.1.50",
      "geoLocation": "US"
    }
  }'`,

        python: `import requests

org_id = "org_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/organizations/{org_id}/policies/evaluate"
headers = {
    "Authorization": "Bearer <your_token>",
    "Content-Type": "application/json",
}
payload = {
    "resource": "api:orders:123",
    "action": "read",
    "context": {
        "ipAddress": "10.0.1.50",
        "geoLocation": "US",
    },
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgId = 'org_01hx9z1q2w3e4r5t6y7u';

const response = await axios.post(
  \`https://api.sutraid.com/api/v1/organizations/\${orgId}/policies/evaluate\`,
  {
    resource: 'api:orders:123',
    action: 'read',
    context: {
      ipAddress: '10.0.1.50',
      geoLocation: 'US',
    },
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

String orgId = "org_01hx9z1q2w3e4r5t6y7u";

String body = """
    {
      "resource": "api:orders:123",
      "action": "read",
      "context": {
        "ipAddress": "10.0.1.50",
        "geoLocation": "US"
      }
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/api/v1/organizations/" + orgId +
        "/policies/evaluate"
    ))
    .header("Authorization", "Bearer <your_token>")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(body))
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
    orgID := "org_01hx9z1q2w3e4r5t6y7u"
    url := "https://api.sutraid.com/api/v1/organizations/" + orgID +
        "/policies/evaluate"

    body := strings.NewReader(\`{
      "resource": "api:orders:123",
      "action": "read",
      "context": {
        "ipAddress": "10.0.1.50",
        "geoLocation": "US"
      }
    }\`)

    req, _ := http.NewRequest("POST", url, body)
    req.Header.Set("Authorization", "Bearer <your_token>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    respBody, _ := io.ReadAll(resp.Body)
    fmt.Println(string(respBody))
}`,

        php: `<?php
$orgId = 'org_01hx9z1q2w3e4r5t6y7u';

$payload = json_encode([
    'resource' => 'api:orders:123',
    'action' => 'read',
    'context' => [
        'ipAddress' => '10.0.1.50',
        'geoLocation' => 'US',
    ],
]);

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/organizations/{$orgId}/policies/evaluate",
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
  ],
};
