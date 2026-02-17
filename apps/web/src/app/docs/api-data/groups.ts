import { DocSection } from './types';

export const groupsSection: DocSection = {
  title: 'Groups',
  slug: 'groups',
  description: 'Manage user groups, membership, and application assignments.',
  endpoints: [
    {
      id: 'list-groups',
      method: 'GET',
      path: '/api/v1/groups',
      title: 'List organization groups',
      description: 'Returns a paginated list of groups belonging to the current organization. Supports filtering by search term.',
      auth: 'bearer',
      parameters: [
        {
          name: 'search',
          in: 'query',
          type: 'string',
          required: false,
          description: 'Search term to filter groups by name.',
          example: 'engineering',
        },
        {
          name: 'page',
          in: 'query',
          type: 'number',
          required: false,
          description: 'Page number for pagination (1-indexed).',
          example: '1',
        },
        {
          name: 'limit',
          in: 'query',
          type: 'number',
          required: false,
          description: 'Number of results per page.',
          example: '20',
        },
      ],
      responseFields: [
        { name: 'data', type: 'Group[]', description: 'Array of group records for the current page.' },
        { name: 'total', type: 'number', description: 'Total number of groups matching the query.' },
        { name: 'page', type: 'number', description: 'Current page number.' },
        { name: 'limit', type: 'number', description: 'Number of results per page.' },
      ],
      responseSample: {
        data: [
          {
            id: 'grp_01hx9z1q2w3e4r5t6y7u',
            name: 'Engineering',
            description: 'Core engineering team',
            memberCount: 12,
            createdAt: '2024-01-10T08:00:00Z',
          },
        ],
        total: 8,
        page: 1,
        limit: 20,
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/groups?page=1&limit=20" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "x-org-id: <your_org_id>"`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/groups"
headers = {
    "Authorization": "Bearer <your_token>",
    "x-org-id": "<your_org_id>",
}
params = {
    "page": 1,
    "limit": 20,
}

response = requests.get(url, headers=headers, params=params)
print(response.json())`,

        nodejs: `const axios = require('axios');

const response = await axios.get('https://api.sutraid.com/api/v1/groups', {
  headers: {
    Authorization: 'Bearer <your_token>',
    'x-org-id': '<your_org_id>',
  },
  params: {
    page: 1,
    limit: 20,
  },
});

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/groups?page=1&limit=20"))
    .header("Authorization", "Bearer <your_token>")
    .header("x-org-id", "<your_org_id>")
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
    req, _ := http.NewRequest("GET", "https://api.sutraid.com/api/v1/groups?page=1&limit=20", nil)
    req.Header.Set("Authorization", "Bearer <your_token>")
    req.Header.Set("x-org-id", "<your_org_id>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.sutraid.com/api/v1/groups?page=1&limit=20',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <your_token>',
        'x-org-id: <your_org_id>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },

    {
      id: 'create-group',
      method: 'POST',
      path: '/api/v1/groups',
      title: 'Create group',
      description: 'Creates a new group within the organization. Groups can be used to manage bulk access to applications.',
      auth: 'bearer',
      requestBody: [
        {
          name: 'name',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Name of the group. Maximum 100 characters.',
          example: 'Engineering',
        },
        {
          name: 'description',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Optional description of the group. Maximum 500 characters.',
          example: 'Core engineering team with access to all developer tooling.',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Unique identifier of the created group.' },
        { name: 'name', type: 'string', description: 'Name of the group.' },
        { name: 'description', type: 'string', description: 'Description of the group.' },
        { name: 'memberCount', type: 'number', description: 'Number of members in the group.' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 creation timestamp.' },
      ],
      responseSample: {
        id: 'grp_01hx9z1q2w3e4r5t6y7u',
        name: 'Engineering',
        description: 'Core engineering team with access to all developer tooling.',
        memberCount: 0,
        createdAt: '2024-06-01T12:00:00Z',
      },
      codeSamples: {
        curl: `curl -X POST "https://api.sutraid.com/api/v1/groups" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "x-org-id: <your_org_id>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Engineering",
    "description": "Core engineering team with access to all developer tooling."
  }'`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/groups"
headers = {
    "Authorization": "Bearer <your_token>",
    "x-org-id": "<your_org_id>",
    "Content-Type": "application/json",
}
payload = {
    "name": "Engineering",
    "description": "Core engineering team with access to all developer tooling.",
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const response = await axios.post('https://api.sutraid.com/api/v1/groups', {
  name: 'Engineering',
  description: 'Core engineering team with access to all developer tooling.',
}, {
  headers: {
    Authorization: 'Bearer <your_token>',
    'x-org-id': '<your_org_id>',
    'Content-Type': 'application/json',
  },
});

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String body = """
    {
      "name": "Engineering",
      "description": "Core engineering team with access to all developer tooling."
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/groups"))
    .header("Authorization", "Bearer <your_token>")
    .header("x-org-id", "<your_org_id>")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,

        go: `package main

import (
    "bytes"
    "fmt"
    "io"
    "net/http"
)

func main() {
    payload := []byte(\`{
        "name": "Engineering",
        "description": "Core engineering team with access to all developer tooling."
    }\`)

    req, _ := http.NewRequest("POST", "https://api.sutraid.com/api/v1/groups", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer <your_token>")
    req.Header.Set("x-org-id", "<your_org_id>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$payload = json_encode([
    'name' => 'Engineering',
    'description' => 'Core engineering team with access to all developer tooling.',
]);

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.sutraid.com/api/v1/groups',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <your_token>',
        'x-org-id: <your_org_id>',
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },

    {
      id: 'update-group',
      method: 'PUT',
      path: '/api/v1/groups/:id',
      title: 'Update group',
      description: 'Updates the name or description of an existing group.',
      auth: 'bearer',
      parameters: [
        {
          name: 'id',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the group to update.',
          example: 'grp_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      requestBody: [
        {
          name: 'name',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Updated group name. Maximum 100 characters.',
          example: 'Platform Engineering',
        },
        {
          name: 'description',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Updated group description. Maximum 500 characters.',
          example: 'Platform and infrastructure team.',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Group identifier.' },
        { name: 'name', type: 'string', description: 'Updated group name.' },
        { name: 'description', type: 'string', description: 'Updated group description.' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 timestamp of last update.' },
      ],
      responseSample: {
        id: 'grp_01hx9z1q2w3e4r5t6y7u',
        name: 'Platform Engineering',
        description: 'Platform and infrastructure team.',
        updatedAt: '2024-06-01T15:00:00Z',
      },
      codeSamples: {
        curl: `curl -X PUT "https://api.sutraid.com/api/v1/groups/grp_01hx9z1q2w3e4r5t6y7u" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "x-org-id: <your_org_id>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Platform Engineering",
    "description": "Platform and infrastructure team."
  }'`,

        python: `import requests

group_id = "grp_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/groups/{group_id}"
headers = {
    "Authorization": "Bearer <your_token>",
    "x-org-id": "<your_org_id>",
    "Content-Type": "application/json",
}
payload = {
    "name": "Platform Engineering",
    "description": "Platform and infrastructure team.",
}

response = requests.put(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const groupId = 'grp_01hx9z1q2w3e4r5t6y7u';

const response = await axios.put(\`https://api.sutraid.com/api/v1/groups/\${groupId}\`, {
  name: 'Platform Engineering',
  description: 'Platform and infrastructure team.',
}, {
  headers: {
    Authorization: 'Bearer <your_token>',
    'x-org-id': '<your_org_id>',
    'Content-Type': 'application/json',
  },
});

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String groupId = "grp_01hx9z1q2w3e4r5t6y7u";
String body = """
    {
      "name": "Platform Engineering",
      "description": "Platform and infrastructure team."
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/groups/" + groupId))
    .header("Authorization", "Bearer <your_token>")
    .header("x-org-id", "<your_org_id>")
    .header("Content-Type", "application/json")
    .PUT(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,

        go: `package main

import (
    "bytes"
    "fmt"
    "io"
    "net/http"
)

func main() {
    groupID := "grp_01hx9z1q2w3e4r5t6y7u"
    payload := []byte(\`{
        "name": "Platform Engineering",
        "description": "Platform and infrastructure team."
    }\`)

    req, _ := http.NewRequest("PUT", "https://api.sutraid.com/api/v1/groups/"+groupID, bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer <your_token>")
    req.Header.Set("x-org-id", "<your_org_id>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$groupId = 'grp_01hx9z1q2w3e4r5t6y7u';
$payload = json_encode([
    'name' => 'Platform Engineering',
    'description' => 'Platform and infrastructure team.',
]);

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/groups/{$groupId}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PUT',
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <your_token>',
        'x-org-id: <your_org_id>',
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },

    {
      id: 'delete-group',
      method: 'DELETE',
      path: '/api/v1/groups/:id',
      title: 'Delete group',
      description: 'Permanently deletes a group from the organization. All user memberships and application assignments for this group are also removed.',
      auth: 'bearer',
      parameters: [
        {
          name: 'id',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the group to delete.',
          example: 'grp_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      responseFields: [
        { name: 'message', type: 'string', description: 'Confirmation message.', example: 'Group deleted' },
      ],
      responseSample: {
        message: 'Group deleted',
      },
      codeSamples: {
        curl: `curl -X DELETE "https://api.sutraid.com/api/v1/groups/grp_01hx9z1q2w3e4r5t6y7u" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "x-org-id: <your_org_id>"`,

        python: `import requests

group_id = "grp_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/groups/{group_id}"
headers = {
    "Authorization": "Bearer <your_token>",
    "x-org-id": "<your_org_id>",
}

response = requests.delete(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const groupId = 'grp_01hx9z1q2w3e4r5t6y7u';

const response = await axios.delete(\`https://api.sutraid.com/api/v1/groups/\${groupId}\`, {
  headers: {
    Authorization: 'Bearer <your_token>',
    'x-org-id': '<your_org_id>',
  },
});

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String groupId = "grp_01hx9z1q2w3e4r5t6y7u";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/groups/" + groupId))
    .header("Authorization", "Bearer <your_token>")
    .header("x-org-id", "<your_org_id>")
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
    groupID := "grp_01hx9z1q2w3e4r5t6y7u"

    req, _ := http.NewRequest("DELETE", "https://api.sutraid.com/api/v1/groups/"+groupID, nil)
    req.Header.Set("Authorization", "Bearer <your_token>")
    req.Header.Set("x-org-id", "<your_org_id>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$groupId = 'grp_01hx9z1q2w3e4r5t6y7u';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/groups/{$groupId}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'DELETE',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <your_token>',
        'x-org-id: <your_org_id>',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },

    {
      id: 'set-group-members',
      method: 'PUT',
      path: '/api/v1/groups/:id/users',
      title: 'Set group members',
      description: 'Replaces the entire set of members for a group with the provided list of user IDs. Any users not in the list will be removed from the group.',
      auth: 'bearer',
      parameters: [
        {
          name: 'id',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the group.',
          example: 'grp_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      requestBody: [
        {
          name: 'userIds',
          in: 'body',
          type: 'string[]',
          required: true,
          description: 'Array of user UUIDs to set as group members. Replaces the existing membership list entirely.',
          example: '["usr_01hx9z1q2w3e4r5t6y7u", "usr_02hx9z1q2w3e4r5t6y7v"]',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Group identifier.' },
        { name: 'users', type: 'User[]', description: 'Updated list of users in the group.' },
      ],
      responseSample: {
        id: 'grp_01hx9z1q2w3e4r5t6y7u',
        users: [
          { id: 'usr_01hx9z1q2w3e4r5t6y7u', email: 'alice@example.com', firstName: 'Alice', lastName: 'Nguyen' },
          { id: 'usr_02hx9z1q2w3e4r5t6y7v', email: 'bob@example.com', firstName: 'Bob', lastName: 'Smith' },
        ],
      },
      codeSamples: {
        curl: `curl -X PUT "https://api.sutraid.com/api/v1/groups/grp_01hx9z1q2w3e4r5t6y7u/users" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "x-org-id: <your_org_id>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "userIds": [
      "usr_01hx9z1q2w3e4r5t6y7u",
      "usr_02hx9z1q2w3e4r5t6y7v"
    ]
  }'`,

        python: `import requests

group_id = "grp_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/groups/{group_id}/users"
headers = {
    "Authorization": "Bearer <your_token>",
    "x-org-id": "<your_org_id>",
    "Content-Type": "application/json",
}
payload = {
    "userIds": [
        "usr_01hx9z1q2w3e4r5t6y7u",
        "usr_02hx9z1q2w3e4r5t6y7v",
    ],
}

response = requests.put(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const groupId = 'grp_01hx9z1q2w3e4r5t6y7u';

const response = await axios.put(\`https://api.sutraid.com/api/v1/groups/\${groupId}/users\`, {
  userIds: [
    'usr_01hx9z1q2w3e4r5t6y7u',
    'usr_02hx9z1q2w3e4r5t6y7v',
  ],
}, {
  headers: {
    Authorization: 'Bearer <your_token>',
    'x-org-id': '<your_org_id>',
    'Content-Type': 'application/json',
  },
});

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String groupId = "grp_01hx9z1q2w3e4r5t6y7u";
String body = """
    {
      "userIds": [
        "usr_01hx9z1q2w3e4r5t6y7u",
        "usr_02hx9z1q2w3e4r5t6y7v"
      ]
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/groups/" + groupId + "/users"))
    .header("Authorization", "Bearer <your_token>")
    .header("x-org-id", "<your_org_id>")
    .header("Content-Type", "application/json")
    .PUT(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,

        go: `package main

import (
    "bytes"
    "fmt"
    "io"
    "net/http"
)

func main() {
    groupID := "grp_01hx9z1q2w3e4r5t6y7u"
    payload := []byte(\`{
        "userIds": [
            "usr_01hx9z1q2w3e4r5t6y7u",
            "usr_02hx9z1q2w3e4r5t6y7v"
        ]
    }\`)

    req, _ := http.NewRequest("PUT", "https://api.sutraid.com/api/v1/groups/"+groupID+"/users", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer <your_token>")
    req.Header.Set("x-org-id", "<your_org_id>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$groupId = 'grp_01hx9z1q2w3e4r5t6y7u';
$payload = json_encode([
    'userIds' => [
        'usr_01hx9z1q2w3e4r5t6y7u',
        'usr_02hx9z1q2w3e4r5t6y7v',
    ],
]);

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/groups/{$groupId}/users",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PUT',
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <your_token>',
        'x-org-id: <your_org_id>',
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },

    {
      id: 'set-group-applications',
      method: 'PUT',
      path: '/api/v1/groups/:id/applications',
      title: 'Set group applications',
      description: 'Replaces all application assignments for a group with the provided list of application IDs. All members of the group will inherit access to the specified applications.',
      auth: 'bearer',
      parameters: [
        {
          name: 'id',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the group.',
          example: 'grp_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      requestBody: [
        {
          name: 'applicationIds',
          in: 'body',
          type: 'string[]',
          required: true,
          description: 'Array of application UUIDs to assign to the group. Replaces the existing application list entirely.',
          example: '["app_01hx9z1q2w3e4r5t6y7u", "app_02hx9z1q2w3e4r5t6y7v"]',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Group identifier.' },
        { name: 'applications', type: 'Application[]', description: 'Updated list of applications assigned to the group.' },
      ],
      responseSample: {
        id: 'grp_01hx9z1q2w3e4r5t6y7u',
        applications: [
          { id: 'app_01hx9z1q2w3e4r5t6y7u', name: 'Acme CRM' },
          { id: 'app_02hx9z1q2w3e4r5t6y7v', name: 'Internal Dashboard' },
        ],
      },
      codeSamples: {
        curl: `curl -X PUT "https://api.sutraid.com/api/v1/groups/grp_01hx9z1q2w3e4r5t6y7u/applications" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "x-org-id: <your_org_id>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "applicationIds": [
      "app_01hx9z1q2w3e4r5t6y7u",
      "app_02hx9z1q2w3e4r5t6y7v"
    ]
  }'`,

        python: `import requests

group_id = "grp_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/groups/{group_id}/applications"
headers = {
    "Authorization": "Bearer <your_token>",
    "x-org-id": "<your_org_id>",
    "Content-Type": "application/json",
}
payload = {
    "applicationIds": [
        "app_01hx9z1q2w3e4r5t6y7u",
        "app_02hx9z1q2w3e4r5t6y7v",
    ],
}

response = requests.put(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const groupId = 'grp_01hx9z1q2w3e4r5t6y7u';

const response = await axios.put(\`https://api.sutraid.com/api/v1/groups/\${groupId}/applications\`, {
  applicationIds: [
    'app_01hx9z1q2w3e4r5t6y7u',
    'app_02hx9z1q2w3e4r5t6y7v',
  ],
}, {
  headers: {
    Authorization: 'Bearer <your_token>',
    'x-org-id': '<your_org_id>',
    'Content-Type': 'application/json',
  },
});

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String groupId = "grp_01hx9z1q2w3e4r5t6y7u";
String body = """
    {
      "applicationIds": [
        "app_01hx9z1q2w3e4r5t6y7u",
        "app_02hx9z1q2w3e4r5t6y7v"
      ]
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/groups/" + groupId + "/applications"))
    .header("Authorization", "Bearer <your_token>")
    .header("x-org-id", "<your_org_id>")
    .header("Content-Type", "application/json")
    .PUT(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,

        go: `package main

import (
    "bytes"
    "fmt"
    "io"
    "net/http"
)

func main() {
    groupID := "grp_01hx9z1q2w3e4r5t6y7u"
    payload := []byte(\`{
        "applicationIds": [
            "app_01hx9z1q2w3e4r5t6y7u",
            "app_02hx9z1q2w3e4r5t6y7v"
        ]
    }\`)

    req, _ := http.NewRequest("PUT", "https://api.sutraid.com/api/v1/groups/"+groupID+"/applications", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer <your_token>")
    req.Header.Set("x-org-id", "<your_org_id>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$groupId = 'grp_01hx9z1q2w3e4r5t6y7u';
$payload = json_encode([
    'applicationIds' => [
        'app_01hx9z1q2w3e4r5t6y7u',
        'app_02hx9z1q2w3e4r5t6y7v',
    ],
]);

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/groups/{$groupId}/applications",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PUT',
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer <your_token>',
        'x-org-id: <your_org_id>',
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
