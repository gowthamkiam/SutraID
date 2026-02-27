import { DocSection } from './types';

export const usersSection: DocSection = {
  title: 'Users',
  slug: 'users',
  description: 'Manage users, roles, and group/application assignments.',
  endpoints: [
    {
      id: 'list-users',
      method: 'GET',
      path: '/api/v1/users',
      title: 'List users',
      description: 'Returns a paginated list of users. Supports filtering by search term, role, and status.',
      auth: 'bearer',
      parameters: [
        {
          name: 'search',
          in: 'query',
          type: 'string',
          required: false,
          description: 'Search term to filter users by name or email.',
          example: 'alice',
        },
        {
          name: 'role',
          in: 'query',
          type: 'string',
          required: false,
          description: 'Filter users by role.',
          enum: ['owner', 'admin', 'member', 'viewer'],
          example: 'admin',
        },
        {
          name: 'status',
          in: 'query',
          type: 'string',
          required: false,
          description: 'Filter users by account status.',
          example: 'active',
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
        { name: 'data', type: 'User[]', description: 'Array of user records for the current page.' },
        { name: 'total', type: 'number', description: 'Total number of users matching the query.' },
        { name: 'page', type: 'number', description: 'Current page number.' },
        { name: 'limit', type: 'number', description: 'Number of results per page.' },
      ],
      responseSample: {
        data: [
          {
            id: 'usr_01hx9z1q2w3e4r5t6y7u',
            email: 'alice@example.com',
            firstName: 'Alice',
            lastName: 'Nguyen',
            role: 'admin',
            status: 'active',
            createdAt: '2024-01-15T09:30:00Z',
          },
        ],
        total: 42,
        page: 1,
        limit: 20,
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/users?page=1&limit=20" \\
  -H "Authorization: Bearer <your_token>"`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/users"
headers = {
    "Authorization": "Bearer <your_token>",
}
params = {
    "page": 1,
    "limit": 20,
}

response = requests.get(url, headers=headers, params=params)
print(response.json())`,

        nodejs: `const axios = require('axios');

const response = await axios.get('https://api.sutraid.com/api/v1/users', {
  headers: {
    Authorization: 'Bearer <your_token>',
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
    .uri(URI.create("https://api.sutraid.com/api/v1/users?page=1&limit=20"))
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
    req, _ := http.NewRequest("GET", "https://api.sutraid.com/api/v1/users?page=1&limit=20", nil)
    req.Header.Set("Authorization", "Bearer <your_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.sutraid.com/api/v1/users?page=1&limit=20',
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
      id: 'create-user',
      method: 'POST',
      path: '/api/v1/users',
      title: 'Create user',
      description: 'Creates a new user account. Optionally assigns the user to groups and applications during creation.',
      auth: 'bearer',
      requestBody: [
        {
          name: 'email',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Email address of the new user.',
          example: 'bob@example.com',
        },
        {
          name: 'firstName',
          in: 'body',
          type: 'string',
          required: false,
          description: 'First name of the user.',
          example: 'Bob',
        },
        {
          name: 'lastName',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Last name of the user.',
          example: 'Smith',
        },
        {
          name: 'role',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Role to assign to the user.',
          enum: ['owner', 'admin', 'member', 'viewer'],
          example: 'member',
        },
        {
          name: 'groupIds',
          in: 'body',
          type: 'string[]',
          required: false,
          description: 'Array of group UUIDs to assign the user to at creation.',
          example: '["grp_01hx9z1q2w3e4r5t6y7u"]',
        },
        {
          name: 'applicationIds',
          in: 'body',
          type: 'string[]',
          required: false,
          description: 'Array of application UUIDs the user should have access to.',
          example: '["app_01hx9z1q2w3e4r5t6y7u"]',
        },
        {
          name: 'onboardingMethod',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Method used to onboard the user (e.g. magic_link, password).',
          example: 'magic_link',
        },
        {
          name: 'temporaryPassword',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Temporary password for password-based onboarding. User will be prompted to change on first login.',
          example: 'Temp@12345',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Unique identifier of the created user.' },
        { name: 'email', type: 'string', description: 'Email address of the user.' },
        { name: 'firstName', type: 'string', description: 'First name.' },
        { name: 'lastName', type: 'string', description: 'Last name.' },
        { name: 'role', type: 'string', description: 'Assigned role.' },
        { name: 'status', type: 'string', description: 'Account status.' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 creation timestamp.' },
      ],
      responseSample: {
        id: 'usr_01hx9z1q2w3e4r5t6y7v',
        email: 'bob@example.com',
        firstName: 'Bob',
        lastName: 'Smith',
        role: 'member',
        status: 'pending',
        createdAt: '2024-06-01T12:00:00Z',
      },
      codeSamples: {
        curl: `curl -X POST "https://api.sutraid.com/api/v1/users" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "bob@example.com",
    "firstName": "Bob",
    "lastName": "Smith",
    "role": "member",
    "onboardingMethod": "magic_link"
  }'`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/users"
headers = {
    "Authorization": "Bearer <your_token>",
    "Content-Type": "application/json",
}
payload = {
    "email": "bob@example.com",
    "firstName": "Bob",
    "lastName": "Smith",
    "role": "member",
    "onboardingMethod": "magic_link",
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const response = await axios.post('https://api.sutraid.com/api/v1/users', {
  email: 'bob@example.com',
  firstName: 'Bob',
  lastName: 'Smith',
  role: 'member',
  onboardingMethod: 'magic_link',
}, {
  headers: {
    Authorization: 'Bearer <your_token>',
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
      "email": "bob@example.com",
      "firstName": "Bob",
      "lastName": "Smith",
      "role": "member",
      "onboardingMethod": "magic_link"
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/users"))
    .header("Authorization", "Bearer <your_token>")
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
        "email": "bob@example.com",
        "firstName": "Bob",
        "lastName": "Smith",
        "role": "member",
        "onboardingMethod": "magic_link"
    }\`)

    req, _ := http.NewRequest("POST", "https://api.sutraid.com/api/v1/users", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer <your_token>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$payload = json_encode([
    'email' => 'bob@example.com',
    'firstName' => 'Bob',
    'lastName' => 'Smith',
    'role' => 'member',
    'onboardingMethod' => 'magic_link',
]);

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.sutraid.com/api/v1/users',
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
      id: 'update-user',
      method: 'PUT',
      path: '/api/v1/users/:id',
      title: 'Update user',
      description: 'Updates the profile, role, status, or assignments of an existing user.',
      auth: 'bearer',
      parameters: [
        {
          name: 'id',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the user to update.',
          example: 'usr_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      requestBody: [
        {
          name: 'firstName',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Updated first name.',
          example: 'Alice',
        },
        {
          name: 'lastName',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Updated last name.',
          example: 'Johnson',
        },
        {
          name: 'role',
          in: 'body',
          type: 'string',
          required: false,
          description: 'New role for the user.',
          enum: ['owner', 'admin', 'member', 'viewer'],
          example: 'admin',
        },
        {
          name: 'status',
          in: 'body',
          type: 'string',
          required: false,
          description: 'New account status (e.g. active, suspended).',
          example: 'active',
        },
        {
          name: 'groupIds',
          in: 'body',
          type: 'string[]',
          required: false,
          description: 'Replaces the user\'s group memberships with this list.',
          example: '["grp_01hx9z1q2w3e4r5t6y7u"]',
        },
        {
          name: 'applicationIds',
          in: 'body',
          type: 'string[]',
          required: false,
          description: 'Replaces the user\'s application assignments with this list.',
          example: '["app_01hx9z1q2w3e4r5t6y7u"]',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'User identifier.' },
        { name: 'email', type: 'string', description: 'Email address.' },
        { name: 'firstName', type: 'string', description: 'Updated first name.' },
        { name: 'lastName', type: 'string', description: 'Updated last name.' },
        { name: 'role', type: 'string', description: 'Updated role.' },
        { name: 'status', type: 'string', description: 'Updated account status.' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 timestamp of last update.' },
      ],
      responseSample: {
        id: 'usr_01hx9z1q2w3e4r5t6y7u',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Johnson',
        role: 'admin',
        status: 'active',
        updatedAt: '2024-06-01T14:00:00Z',
      },
      codeSamples: {
        curl: `curl -X PUT "https://api.sutraid.com/api/v1/users/usr_01hx9z1q2w3e4r5t6y7u" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "Alice",
    "lastName": "Johnson",
    "role": "admin",
    "status": "active"
  }'`,

        python: `import requests

user_id = "usr_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/users/{user_id}"
headers = {
    "Authorization": "Bearer <your_token>",
    "Content-Type": "application/json",
}
payload = {
    "firstName": "Alice",
    "lastName": "Johnson",
    "role": "admin",
    "status": "active",
}

response = requests.put(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const userId = 'usr_01hx9z1q2w3e4r5t6y7u';

const response = await axios.put(\`https://api.sutraid.com/api/v1/users/\${userId}\`, {
  firstName: 'Alice',
  lastName: 'Johnson',
  role: 'admin',
  status: 'active',
}, {
  headers: {
    Authorization: 'Bearer <your_token>',
    'Content-Type': 'application/json',
  },
});

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String userId = "usr_01hx9z1q2w3e4r5t6y7u";
String body = """
    {
      "firstName": "Alice",
      "lastName": "Johnson",
      "role": "admin",
      "status": "active"
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/users/" + userId))
    .header("Authorization", "Bearer <your_token>")
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
    userID := "usr_01hx9z1q2w3e4r5t6y7u"
    payload := []byte(\`{
        "firstName": "Alice",
        "lastName": "Johnson",
        "role": "admin",
        "status": "active"
    }\`)

    req, _ := http.NewRequest("PUT", "https://api.sutraid.com/api/v1/users/"+userID, bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer <your_token>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$userId = 'usr_01hx9z1q2w3e4r5t6y7u';
$payload = json_encode([
    'firstName' => 'Alice',
    'lastName' => 'Johnson',
    'role' => 'admin',
    'status' => 'active',
]);

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/users/{$userId}",
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

    {
      id: 'delete-user',
      method: 'DELETE',
      path: '/api/v1/users/:id',
      title: 'Delete user',
      description: 'Permanently removes a user from the team. This action cannot be undone.',
      auth: 'bearer',
      parameters: [
        {
          name: 'id',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the user to delete.',
          example: 'usr_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      responseFields: [
        { name: 'message', type: 'string', description: 'Confirmation message.', example: 'User deleted' },
      ],
      responseSample: {
        message: 'User deleted',
      },
      codeSamples: {
        curl: `curl -X DELETE "https://api.sutraid.com/api/v1/users/usr_01hx9z1q2w3e4r5t6y7u" \
  -H "Authorization: Bearer <your_token>"`,

        python: `import requests

user_id = "usr_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/users/{user_id}"
headers = {
    "Authorization": "Bearer <your_token>",
}

response = requests.delete(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const userId = 'usr_01hx9z1q2w3e4r5t6y7u';

const response = await axios.delete(\`https://api.sutraid.com/api/v1/users/\${userId}\`, {
  headers: {
    Authorization: 'Bearer <your_token>',
  },
});

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String userId = "usr_01hx9z1q2w3e4r5t6y7u";

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/users/" + userId))
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
    userID := "usr_01hx9z1q2w3e4r5t6y7u"

    req, _ := http.NewRequest("DELETE", "https://api.sutraid.com/api/v1/users/"+userID, nil)
    req.Header.Set("Authorization", "Bearer <your_token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$userId = 'usr_01hx9z1q2w3e4r5t6y7u';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/users/{$userId}",
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

    {
      id: 'assign-user-groups',
      method: 'PUT',
      path: '/api/v1/users/:id/groups',
      title: 'Assign groups to user',
      description: 'Replaces all group memberships for a user with the provided list of group IDs.',
      auth: 'bearer',
      parameters: [
        {
          name: 'id',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the user.',
          example: 'usr_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      requestBody: [
        {
          name: 'groupIds',
          in: 'body',
          type: 'string[]',
          required: true,
          description: 'Array of group UUIDs to assign to the user. Replaces existing group memberships.',
          example: '["grp_01hx9z1q2w3e4r5t6y7u", "grp_02hx9z1q2w3e4r5t6y7v"]',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'User identifier.' },
        { name: 'groups', type: 'Group[]', description: 'Updated list of groups the user belongs to.' },
      ],
      responseSample: {
        id: 'usr_01hx9z1q2w3e4r5t6y7u',
        groups: [
          { id: 'grp_01hx9z1q2w3e4r5t6y7u', name: 'Engineering' },
          { id: 'grp_02hx9z1q2w3e4r5t6y7v', name: 'Admins' },
        ],
      },
      codeSamples: {
        curl: `curl -X PUT "https://api.sutraid.com/api/v1/users/usr_01hx9z1q2w3e4r5t6y7u/groups" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "groupIds": [
      "grp_01hx9z1q2w3e4r5t6y7u",
      "grp_02hx9z1q2w3e4r5t6y7v"
    ]
  }'`,

        python: `import requests

user_id = "usr_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/users/{user_id}/groups"
headers = {
    "Authorization": "Bearer <your_token>",
    "Content-Type": "application/json",
}
payload = {
    "groupIds": [
        "grp_01hx9z1q2w3e4r5t6y7u",
        "grp_02hx9z1q2w3e4r5t6y7v",
    ],
}

response = requests.put(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const userId = 'usr_01hx9z1q2w3e4r5t6y7u';

const response = await axios.put(\`https://api.sutraid.com/api/v1/users/\${userId}/groups\`, {
  groupIds: [
    'grp_01hx9z1q2w3e4r5t6y7u',
    'grp_02hx9z1q2w3e4r5t6y7v',
  ],
}, {
  headers: {
    Authorization: 'Bearer <your_token>',
    'Content-Type': 'application/json',
  },
});

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String userId = "usr_01hx9z1q2w3e4r5t6y7u";
String body = """
    {
      "groupIds": [
        "grp_01hx9z1q2w3e4r5t6y7u",
        "grp_02hx9z1q2w3e4r5t6y7v"
      ]
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/users/" + userId + "/groups"))
    .header("Authorization", "Bearer <your_token>")
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
    userID := "usr_01hx9z1q2w3e4r5t6y7u"
    payload := []byte(\`{
        "groupIds": [
            "grp_01hx9z1q2w3e4r5t6y7u",
            "grp_02hx9z1q2w3e4r5t6y7v"
        ]
    }\`)

    req, _ := http.NewRequest("PUT", "https://api.sutraid.com/api/v1/users/"+userID+"/groups", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer <your_token>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$userId = 'usr_01hx9z1q2w3e4r5t6y7u';
$payload = json_encode([
    'groupIds' => [
        'grp_01hx9z1q2w3e4r5t6y7u',
        'grp_02hx9z1q2w3e4r5t6y7v',
    ],
]);

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/users/{$userId}/groups",
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

    {
      id: 'assign-user-applications',
      method: 'PUT',
      path: '/api/v1/users/:id/applications',
      title: 'Assign applications to user',
      description: 'Replaces all application assignments for a user with the provided list of application IDs.',
      auth: 'bearer',
      parameters: [
        {
          name: 'id',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the user.',
          example: 'usr_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      requestBody: [
        {
          name: 'applicationIds',
          in: 'body',
          type: 'string[]',
          required: true,
          description: 'Array of application UUIDs to assign to the user. Replaces existing application assignments.',
          example: '["app_01hx9z1q2w3e4r5t6y7u", "app_02hx9z1q2w3e4r5t6y7v"]',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'User identifier.' },
        { name: 'applications', type: 'Application[]', description: 'Updated list of applications assigned to the user.' },
      ],
      responseSample: {
        id: 'usr_01hx9z1q2w3e4r5t6y7u',
        applications: [
          { id: 'app_01hx9z1q2w3e4r5t6y7u', name: 'Acme CRM' },
          { id: 'app_02hx9z1q2w3e4r5t6y7v', name: 'Internal Dashboard' },
        ],
      },
      codeSamples: {
        curl: `curl -X PUT "https://api.sutraid.com/api/v1/users/usr_01hx9z1q2w3e4r5t6y7u/applications" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "applicationIds": [
      "app_01hx9z1q2w3e4r5t6y7u",
      "app_02hx9z1q2w3e4r5t6y7v"
    ]
  }'`,

        python: `import requests

user_id = "usr_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/users/{user_id}/applications"
headers = {
    "Authorization": "Bearer <your_token>",
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

const userId = 'usr_01hx9z1q2w3e4r5t6y7u';

const response = await axios.put(\`https://api.sutraid.com/api/v1/users/\${userId}/applications\`, {
  applicationIds: [
    'app_01hx9z1q2w3e4r5t6y7u',
    'app_02hx9z1q2w3e4r5t6y7v',
  ],
}, {
  headers: {
    Authorization: 'Bearer <your_token>',
    'Content-Type': 'application/json',
  },
});

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String userId = "usr_01hx9z1q2w3e4r5t6y7u";
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
    .uri(URI.create("https://api.sutraid.com/api/v1/users/" + userId + "/applications"))
    .header("Authorization", "Bearer <your_token>")
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
    userID := "usr_01hx9z1q2w3e4r5t6y7u"
    payload := []byte(\`{
        "applicationIds": [
            "app_01hx9z1q2w3e4r5t6y7u",
            "app_02hx9z1q2w3e4r5t6y7v"
        ]
    }\`)

    req, _ := http.NewRequest("PUT", "https://api.sutraid.com/api/v1/users/"+userID+"/applications", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer <your_token>")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$userId = 'usr_01hx9z1q2w3e4r5t6y7u';
$payload = json_encode([
    'applicationIds' => [
        'app_01hx9z1q2w3e4r5t6y7u',
        'app_02hx9z1q2w3e4r5t6y7v',
    ],
]);

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/users/{$userId}/applications",
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
  ],
};
