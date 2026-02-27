import { DocSection } from './types';

export const settingsSection: DocSection = {
  title: 'Settings & Configuration',
  slug: 'settings',
  description: 'Manage instance-level configuration including branding, security policies, and initial onboarding.',
  endpoints: [
    // ─── 1. Get Settings ──────────────────────────────────────────────────────
    {
      id: 'get-settings',
      method: 'GET',
      path: '/api/v1/settings',
      title: 'Get instance settings',
      description: 'Returns the current instance settings including name, branding, allowed domains, MFA requirements, and custom login configuration.',
      auth: 'bearer',
      responseFields: [
        { name: 'id', type: 'string', description: 'Singleton identifier (always "singleton").' },
        { name: 'name', type: 'string', description: 'Instance display name.' },
        { name: 'logoUrl', type: 'string | null', description: 'Public URL of the instance logo.' },
        { name: 'primaryColor', type: 'string', description: 'Brand hex color used in hosted UI.' },
        { name: 'allowedDomains', type: 'string[]', description: 'Email domains permitted for self-service sign-up.' },
        { name: 'mfaRequired', type: 'boolean', description: 'Whether MFA is mandatory for all users.' },
        { name: 'mfaGracePeriodDays', type: 'number', description: 'Number of days users have to enroll MFA after it becomes required.' },
        { name: 'customLoginConfig', type: 'object | null', description: 'Custom login page configuration (headline, subtitle, background).' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 creation timestamp.' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 last-update timestamp.' },
      ],
      responseSample: {
        id: 'singleton',
        name: 'Acme Corp',
        logoUrl: 'https://cdn.acme.com/logo.png',
        primaryColor: '#0057FF',
        allowedDomains: ['acme.com', 'acme.io'],
        mfaRequired: true,
        mfaGracePeriodDays: 7,
        customLoginConfig: {
          headline: 'Welcome to Acme',
          subtitle: 'Sign in to your account',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-06-15T10:30:00Z',
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/settings" \\
  -H "Authorization: Bearer <your_token>"`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/settings"
headers = {
    "Authorization": "Bearer <your_token>",
}

response = requests.get(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const response = await axios.get('https://api.sutraid.com/api/v1/settings', {
  headers: {
    Authorization: 'Bearer <your_token>',
  },
});

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/settings"))
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
    req, _ := http.NewRequest("GET", "https://api.sutraid.com/api/v1/settings", nil)
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
    CURLOPT_URL => 'https://api.sutraid.com/api/v1/settings',
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

    // ─── 2. Update Settings ───────────────────────────────────────────────────
    {
      id: 'update-settings',
      method: 'PUT',
      path: '/api/v1/settings',
      title: 'Update instance settings',
      description: 'Updates branding, security, and login customization settings for the instance. Only provided fields are changed.',
      auth: 'bearer',
      requestBody: [
        {
          name: 'name',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Instance display name.',
          example: 'Acme Corp',
        },
        {
          name: 'logoUrl',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Public URL of the instance logo.',
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
          name: 'customLoginConfig',
          in: 'body',
          type: 'object',
          required: false,
          description: 'Custom login page configuration (headline, subtitle, background image, etc.).',
          example: '{"headline":"Welcome","subtitle":"Sign in"}',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Singleton identifier.' },
        { name: 'name', type: 'string', description: 'Updated instance name.' },
        { name: 'logoUrl', type: 'string | null', description: 'Updated logo URL.' },
        { name: 'primaryColor', type: 'string', description: 'Updated brand color.' },
        { name: 'customLoginConfig', type: 'object | null', description: 'Updated login page configuration.' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 timestamp of the update.' },
      ],
      responseSample: {
        id: 'singleton',
        name: 'Acme Corp',
        logoUrl: 'https://cdn.acme.com/logo.png',
        primaryColor: '#0057FF',
        allowedDomains: ['acme.com'],
        mfaRequired: true,
        mfaGracePeriodDays: 7,
        customLoginConfig: {
          headline: 'Welcome',
          subtitle: 'Sign in',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-06-15T12:00:00Z',
      },
      codeSamples: {
        curl: `curl -X PUT "https://api.sutraid.com/api/v1/settings" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Acme Corp",
    "primaryColor": "#0057FF",
    "customLoginConfig": {
      "headline": "Welcome to Acme",
      "subtitle": "Sign in to continue"
    }
  }'`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/settings"
headers = {
    "Authorization": "Bearer <your_token>",
    "Content-Type": "application/json",
}
payload = {
    "name": "Acme Corp",
    "primaryColor": "#0057FF",
    "customLoginConfig": {
        "headline": "Welcome to Acme",
        "subtitle": "Sign in to continue",
    },
}

response = requests.put(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const response = await axios.put('https://api.sutraid.com/api/v1/settings', {
  name: 'Acme Corp',
  primaryColor: '#0057FF',
  customLoginConfig: {
    headline: 'Welcome to Acme',
    subtitle: 'Sign in to continue',
  },
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
      "name": "Acme Corp",
      "primaryColor": "#0057FF",
      "customLoginConfig": {
        "headline": "Welcome to Acme",
        "subtitle": "Sign in to continue"
      }
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/settings"))
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
    payload := []byte(\`{
        "name": "Acme Corp",
        "primaryColor": "#0057FF",
        "customLoginConfig": {
            "headline": "Welcome to Acme",
            "subtitle": "Sign in to continue"
        }
    }\`)

    req, _ := http.NewRequest("PUT", "https://api.sutraid.com/api/v1/settings", bytes.NewBuffer(payload))
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
    'name' => 'Acme Corp',
    'primaryColor' => '#0057FF',
    'customLoginConfig' => [
        'headline' => 'Welcome to Acme',
        'subtitle' => 'Sign in to continue',
    ],
]);

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.sutraid.com/api/v1/settings',
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

    // ─── 3. Get Configuration ─────────────────────────────────────────────────
    {
      id: 'get-config',
      method: 'GET',
      path: '/api/v1/config',
      title: 'Get application configuration',
      description: 'Returns the full application configuration including all branding, security, and domain settings. Requires org:read permission.',
      auth: 'bearer',
      responseFields: [
        { name: 'id', type: 'string', description: 'Singleton identifier.' },
        { name: 'name', type: 'string', description: 'Instance name.' },
        { name: 'logoUrl', type: 'string | null', description: 'Logo URL.' },
        { name: 'primaryColor', type: 'string', description: 'Primary brand color.' },
        { name: 'allowedDomains', type: 'string[]', description: 'Permitted email domains for sign-up.' },
        { name: 'mfaRequired', type: 'boolean', description: 'Whether MFA is mandatory.' },
        { name: 'mfaGracePeriodDays', type: 'number', description: 'Grace period for MFA enrollment.' },
        { name: 'customLoginConfig', type: 'object | null', description: 'Custom login page configuration.' },
        { name: 'createdAt', type: 'string', description: 'ISO 8601 creation timestamp.' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 last-update timestamp.' },
      ],
      responseSample: {
        id: 'singleton',
        name: 'SutraID',
        logoUrl: null,
        primaryColor: '#000000',
        allowedDomains: [],
        mfaRequired: false,
        mfaGracePeriodDays: 7,
        customLoginConfig: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/config" \\
  -H "Authorization: Bearer <your_token>"`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/config"
headers = {
    "Authorization": "Bearer <your_token>",
}

response = requests.get(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const response = await axios.get('https://api.sutraid.com/api/v1/config', {
  headers: {
    Authorization: 'Bearer <your_token>',
  },
});

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/config"))
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
    req, _ := http.NewRequest("GET", "https://api.sutraid.com/api/v1/config", nil)
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
    CURLOPT_URL => 'https://api.sutraid.com/api/v1/config',
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

    // ─── 4. Update Configuration ──────────────────────────────────────────────
    {
      id: 'update-config',
      method: 'PUT',
      path: '/api/v1/config',
      title: 'Update application configuration',
      description: 'Updates the application configuration. Supports partial updates — only the provided fields are changed. Read-only fields (id, createdAt, updatedAt) are automatically stripped.',
      auth: 'bearer',
      requestBody: [
        {
          name: 'name',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Instance display name.',
          example: 'My SutraID Instance',
        },
        {
          name: 'logoUrl',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Public URL of the instance logo.',
          example: 'https://cdn.example.com/logo.png',
        },
        {
          name: 'primaryColor',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Brand hex color.',
          example: '#1A73E8',
        },
        {
          name: 'allowedDomains',
          in: 'body',
          type: 'string[]',
          required: false,
          description: 'List of email domains permitted for user sign-up.',
          example: '["example.com","corp.example.com"]',
        },
        {
          name: 'mfaRequired',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Enable or disable mandatory MFA for all users.',
          example: 'true',
        },
        {
          name: 'mfaGracePeriodDays',
          in: 'body',
          type: 'number',
          required: false,
          description: 'Number of days users have to enroll MFA after it becomes required.',
          example: '14',
        },
      ],
      responseFields: [
        { name: 'id', type: 'string', description: 'Singleton identifier.' },
        { name: 'name', type: 'string', description: 'Updated instance name.' },
        { name: 'primaryColor', type: 'string', description: 'Updated brand color.' },
        { name: 'allowedDomains', type: 'string[]', description: 'Updated allowed domains.' },
        { name: 'mfaRequired', type: 'boolean', description: 'Updated MFA requirement.' },
        { name: 'mfaGracePeriodDays', type: 'number', description: 'Updated grace period.' },
        { name: 'updatedAt', type: 'string', description: 'ISO 8601 timestamp of the update.' },
      ],
      responseSample: {
        id: 'singleton',
        name: 'My SutraID Instance',
        logoUrl: 'https://cdn.example.com/logo.png',
        primaryColor: '#1A73E8',
        allowedDomains: ['example.com', 'corp.example.com'],
        mfaRequired: true,
        mfaGracePeriodDays: 14,
        customLoginConfig: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-06-20T08:00:00Z',
      },
      codeSamples: {
        curl: `curl -X PUT "https://api.sutraid.com/api/v1/config" \\
  -H "Authorization: Bearer <your_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My SutraID Instance",
    "allowedDomains": ["example.com"],
    "mfaRequired": true,
    "mfaGracePeriodDays": 14
  }'`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/config"
headers = {
    "Authorization": "Bearer <your_token>",
    "Content-Type": "application/json",
}
payload = {
    "name": "My SutraID Instance",
    "allowedDomains": ["example.com"],
    "mfaRequired": True,
    "mfaGracePeriodDays": 14,
}

response = requests.put(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const response = await axios.put('https://api.sutraid.com/api/v1/config', {
  name: 'My SutraID Instance',
  allowedDomains: ['example.com'],
  mfaRequired: true,
  mfaGracePeriodDays: 14,
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
      "name": "My SutraID Instance",
      "allowedDomains": ["example.com"],
      "mfaRequired": true,
      "mfaGracePeriodDays": 14
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/config"))
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
    payload := []byte(\`{
        "name": "My SutraID Instance",
        "allowedDomains": ["example.com"],
        "mfaRequired": true,
        "mfaGracePeriodDays": 14
    }\`)

    req, _ := http.NewRequest("PUT", "https://api.sutraid.com/api/v1/config", bytes.NewBuffer(payload))
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
    'name' => 'My SutraID Instance',
    'allowedDomains' => ['example.com'],
    'mfaRequired' => true,
    'mfaGracePeriodDays' => 14,
]);

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.sutraid.com/api/v1/config',
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

    // ─── 5. Initial Onboarding ────────────────────────────────────────────────
    {
      id: 'onboard',
      method: 'POST',
      path: '/api/v1/onboard',
      title: 'Initial instance onboarding',
      description: 'Bootstraps a new SutraID instance by creating the first super-admin user and initializing default configuration. A magic link is sent to the provided email. This endpoint can only be called once — subsequent calls will fail with a 409 Conflict.',
      auth: 'none',
      requestBody: [
        {
          name: 'adminEmail',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Email address for the initial super-admin account.',
          example: 'admin@acme.com',
        },
      ],
      responseFields: [
        { name: 'message', type: 'string', description: 'Confirmation message.' },
        { name: 'user.id', type: 'string', description: 'Unique identifier of the created admin user.' },
        { name: 'user.email', type: 'string', description: 'Email address of the admin.' },
        { name: 'user.role', type: 'string', description: 'Assigned role (always SUPER_ADMIN).' },
      ],
      responseSample: {
        message: 'Onboarding complete. Magic link sent to admin email.',
        user: {
          id: 'usr_01hx9z1q2w3e4r5t6y7u',
          email: 'admin@acme.com',
          role: 'SUPER_ADMIN',
        },
      },
      codeSamples: {
        curl: `curl -X POST "https://api.sutraid.com/api/v1/onboard" \\
  -H "Content-Type: application/json" \\
  -d '{
    "adminEmail": "admin@acme.com"
  }'`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/onboard"
headers = {
    "Content-Type": "application/json",
}
payload = {
    "adminEmail": "admin@acme.com",
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const response = await axios.post('https://api.sutraid.com/api/v1/onboard', {
  adminEmail: 'admin@acme.com',
}, {
  headers: {
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
      "adminEmail": "admin@acme.com"
    }
    """;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/onboard"))
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
        "adminEmail": "admin@acme.com"
    }\`)

    req, _ := http.NewRequest("POST", "https://api.sutraid.com/api/v1/onboard", bytes.NewBuffer(payload))
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$payload = json_encode([
    'adminEmail' => 'admin@acme.com',
]);

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.sutraid.com/api/v1/onboard',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },

    // ─── 6. Get Active Sessions ───────────────────────────────────────────────
    {
      id: 'get-active-sessions',
      method: 'GET',
      path: '/api/v1/stats/active-sessions',
      title: 'Get active session count',
      description: 'Returns the count of users who have logged in within the last 24 hours. Useful for dashboard metrics and monitoring.',
      auth: 'bearer',
      responseFields: [
        { name: 'activeSessions', type: 'number', description: 'Number of users active in the last 24 hours.' },
        { name: 'periodHours', type: 'number', description: 'Time window in hours (always 24).' },
      ],
      responseSample: {
        activeSessions: 127,
        periodHours: 24,
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/stats/active-sessions" \\
  -H "Authorization: Bearer <your_token>"`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/stats/active-sessions"
headers = {
    "Authorization": "Bearer <your_token>",
}

response = requests.get(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const response = await axios.get('https://api.sutraid.com/api/v1/stats/active-sessions', {
  headers: {
    Authorization: 'Bearer <your_token>',
  },
});

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/stats/active-sessions"))
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
    req, _ := http.NewRequest("GET", "https://api.sutraid.com/api/v1/stats/active-sessions", nil)
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
    CURLOPT_URL => 'https://api.sutraid.com/api/v1/stats/active-sessions',
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
