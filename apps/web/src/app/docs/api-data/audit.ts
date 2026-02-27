import { DocSection } from './types';

export const auditSection: DocSection = {
  title: 'Audit Logs',
  slug: 'audit',
  description: 'Immutable audit trail for compliance — query logs, filter by action/result, and aggregate stats.',
  endpoints: [
    {
      id: 'query-audit-logs',
      method: 'GET',
      path: '/api/v1/audit/logs',
      title: 'Query audit logs',
      description: 'Returns a paginated, filterable list of audit log entries for an organization. Requires the audit:read permission.',
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
          name: 'userId',
          in: 'query',
          type: 'string',
          required: false,
          description: 'Filter logs by the user who performed the action.',
          example: 'usr_01hx9z1q2w3e4r5t6y7u',
        },
        {
          name: 'action',
          in: 'query',
          type: 'string',
          required: false,
          description: 'Filter logs by action type (e.g. user.login, user.created).',
          example: 'user.login',
        },
        {
          name: 'result',
          in: 'query',
          type: 'string',
          required: false,
          description: 'Filter logs by outcome of the action.',
          enum: ['SUCCESS', 'FAILURE', 'DENIED'],
          example: 'SUCCESS',
        },
        {
          name: 'startDate',
          in: 'query',
          type: 'string (ISO 8601)',
          required: false,
          description: 'Start of the date range filter (inclusive).',
          example: '2024-01-01T00:00:00Z',
        },
        {
          name: 'endDate',
          in: 'query',
          type: 'string (ISO 8601)',
          required: false,
          description: 'End of the date range filter (inclusive).',
          example: '2024-12-31T23:59:59Z',
        },
        {
          name: 'page',
          in: 'query',
          type: 'number',
          required: false,
          description: 'Page number for pagination (1-indexed). Defaults to 1.',
          example: '1',
        },
        {
          name: 'limit',
          in: 'query',
          type: 'number',
          required: false,
          description: 'Number of results per page. Defaults to 50, maximum 100.',
          example: '50',
        },
      ],
      responseFields: [
        { name: 'data', type: 'AuditLog[]', description: 'Array of audit log entries for the current page.' },
        { name: 'data[].id', type: 'string', description: 'Unique identifier of the audit log entry.' },
        { name: 'data[].organizationId', type: 'string', description: 'Organization the event belongs to.' },
        { name: 'data[].userId', type: 'string', description: 'ID of the user who performed the action.' },
        { name: 'data[].agentId', type: 'string', description: 'ID of the agent/service that performed the action (if applicable).' },
        { name: 'data[].action', type: 'string', description: 'Action that was performed (e.g. user.login).' },
        { name: 'data[].resource', type: 'string', description: 'Resource that was acted upon.' },
        { name: 'data[].result', type: 'string', description: 'Outcome of the action: SUCCESS, FAILURE, or DENIED.' },
        { name: 'data[].metadata', type: 'object', description: 'Arbitrary JSON metadata associated with the event.' },
        { name: 'data[].riskScore', type: 'number', description: 'Computed risk score for the event (0–100).' },
        { name: 'data[].ipAddress', type: 'string', description: 'IP address from which the action originated.' },
        { name: 'data[].userAgent', type: 'string', description: 'User-Agent string of the client.' },
        { name: 'data[].createdAt', type: 'string', description: 'ISO 8601 timestamp of when the event occurred.' },
        { name: 'total', type: 'number', description: 'Total number of log entries matching the query.' },
        { name: 'page', type: 'number', description: 'Current page number.' },
        { name: 'limit', type: 'number', description: 'Number of results per page.' },
      ],
      responseSample: {
        data: [
          {
            id: 'aud_01hx9z1q2w3e4r5t6y7u',
            organizationId: 'org_01hx9z1q2w3e4r5t6y7u',
            userId: 'usr_01hx9z1q2w3e4r5t6y7u',
            agentId: null,
            action: 'user.login',
            resource: 'auth',
            result: 'SUCCESS',
            metadata: { method: 'magic_link' },
            riskScore: 5,
            ipAddress: '203.0.113.42',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            createdAt: '2024-06-01T09:30:00Z',
          },
        ],
        total: 1240,
        page: 1,
        limit: 50,
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/organizations/org_01hx9z1q2w3e4r5t6y7u/audit/logs?result=SUCCESS&page=1&limit=50" \\
  -H "Authorization: Bearer <your_token>"`,

        python: `import requests

org_id = "org_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/organizations/{org_id}/audit/logs"
headers = {
    "Authorization": "Bearer <your_token>",
}
params = {
    "result": "SUCCESS",
    "page": 1,
    "limit": 50,
}

response = requests.get(url, headers=headers, params=params)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgId = 'org_01hx9z1q2w3e4r5t6y7u';

const response = await axios.get(
  \`https://api.sutraid.com/api/v1/organizations/\${orgId}/audit/logs\`,
  {
    headers: {
      Authorization: 'Bearer <your_token>',
    },
    params: {
      result: 'SUCCESS',
      page: 1,
      limit: 50,
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
        "/audit/logs?result=SUCCESS&page=1&limit=50"
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
        "/audit/logs?result=SUCCESS&page=1&limit=50"

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
    CURLOPT_URL => "https://api.sutraid.com/api/v1/organizations/{$orgId}/audit/logs?result=SUCCESS&page=1&limit=50",
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
      id: 'get-audit-stats',
      method: 'GET',
      path: '/api/v1/audit/stats',
      title: 'Get audit stats',
      description: 'Returns aggregated audit statistics for an organization over a configurable time window. Requires the audit:read permission.',
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
          name: 'days',
          in: 'query',
          type: 'number',
          required: false,
          description: 'Number of past days to include in the stats window. Defaults to 30.',
          example: '30',
        },
      ],
      responseFields: [
        { name: 'totalEvents', type: 'number', description: 'Total number of audit events in the time window.' },
        { name: 'byAction', type: 'Array<{ action: string; count: number }>', description: 'Event counts grouped by action type.' },
        { name: 'byResult', type: 'Array<{ result: string; count: number }>', description: 'Event counts grouped by result (SUCCESS, FAILURE, DENIED).' },
      ],
      responseSample: {
        totalEvents: 4823,
        byAction: [
          { action: 'user.login', count: 3102 },
          { action: 'user.created', count: 87 },
          { action: 'policy.evaluated', count: 1634 },
        ],
        byResult: [
          { result: 'SUCCESS', count: 4601 },
          { result: 'FAILURE', count: 158 },
          { result: 'DENIED', count: 64 },
        ],
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/organizations/org_01hx9z1q2w3e4r5t6y7u/audit/stats?days=30" \\
  -H "Authorization: Bearer <your_token>"`,

        python: `import requests

org_id = "org_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/organizations/{org_id}/audit/stats"
headers = {
    "Authorization": "Bearer <your_token>",
}
params = {
    "days": 30,
}

response = requests.get(url, headers=headers, params=params)
print(response.json())`,

        nodejs: `const axios = require('axios');

const orgId = 'org_01hx9z1q2w3e4r5t6y7u';

const response = await axios.get(
  \`https://api.sutraid.com/api/v1/organizations/\${orgId}/audit/stats\`,
  {
    headers: {
      Authorization: 'Bearer <your_token>',
    },
    params: {
      days: 30,
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
        "https://api.sutraid.com/api/v1/organizations/" + orgId + "/audit/stats?days=30"
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
    url := "https://api.sutraid.com/api/v1/organizations/" + orgID + "/audit/stats?days=30"

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
    CURLOPT_URL => "https://api.sutraid.com/api/v1/organizations/{$orgId}/audit/stats?days=30",
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
  ],
};
