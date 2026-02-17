import { DocSection } from './types';

export const authSection: DocSection = {
  title: 'Authentication & MFA',
  slug: 'authentication',
  description: 'Magic links, password auth, TOTP, passkeys, and adaptive MFA.',
  endpoints: [
    // ─── Auth Core ────────────────────────────────────────────────────────────

    {
      id: 'auth-magic-link',
      method: 'POST',
      path: '/api/v1/auth/magic-link',
      title: 'Request Magic Link',
      description:
        'Sends a magic link to the provided email address. If the account exists, the user will receive an email with a one-time login link. Returns a generic message regardless of whether the account exists to prevent email enumeration.',
      auth: 'none',
      requestBody: [
        {
          name: 'email',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The email address to send the magic link to.',
          example: 'alice@example.com',
        },
      ],
      responseFields: [
        {
          name: 'message',
          type: 'string',
          description: 'A generic confirmation message.',
          example: 'If an account exists, a magic link has been sent',
        },
      ],
      responseSample: {
        message: 'If an account exists, a magic link has been sent',
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/auth/magic-link \\
  -H "Content-Type: application/json" \\
  -d '{"email": "alice@example.com"}'`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/magic-link"
payload = {"email": "alice@example.com"}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const response = await axios.post(
  'https://api.sutraid.com/api/v1/auth/magic-link',
  { email: 'alice@example.com' },
  { headers: { 'Content-Type': 'application/json' } }
);
console.log(response.data);`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = "{\\"email\\": \\"alice@example.com\\"}";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/magic-link"))
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
    payload := map[string]string{"email": "alice@example.com"}
    data, _ := json.Marshal(payload)

    resp, _ := http.Post(
        "https://api.sutraid.com/api/v1/auth/magic-link",
        "application/json",
        bytes.NewBuffer(data),
    )
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/magic-link");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(["email" => "alice@example.com"]));

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    },

    {
      id: 'auth-verify',
      method: 'POST',
      path: '/api/v1/auth/verify',
      title: 'Verify Magic Link Token',
      description:
        'Exchanges a magic link token (extracted from the emailed URL) for a full session. Returns access and refresh tokens along with user and organization context. If MFA is required, returns mfaRequired: true and an mfaToken to complete the MFA challenge instead.',
      auth: 'none',
      requestBody: [
        {
          name: 'token',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The one-time token from the magic link URL.',
          example: 'ml_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
        },
      ],
      responseFields: [
        { name: 'accessToken', type: 'string', description: 'JWT access token.', example: 'eyJhbGciOiJSUzI1NiJ9...' },
        { name: 'refreshToken', type: 'string', description: 'Opaque refresh token.', example: 'rt_a1b2c3d4e5f6...' },
        { name: 'expiresIn', type: 'number', description: 'Access token TTL in seconds.', example: '900' },
        { name: 'tokenType', type: 'string', description: 'Always "Bearer".', example: 'Bearer' },
        { name: 'user.id', type: 'string', description: 'User UUID.' },
        { name: 'user.email', type: 'string', description: 'User email address.' },
        { name: 'user.firstName', type: 'string', description: 'User first name.' },
        { name: 'user.lastName', type: 'string', description: 'User last name.' },
        { name: 'user.organizationId', type: 'string', description: 'Current organization UUID.' },
        { name: 'user.role', type: 'string', description: 'User role within the organization.' },
        { name: 'organization.id', type: 'string', description: 'Organization UUID.' },
        { name: 'organization.name', type: 'string', description: 'Organization display name.' },
        { name: 'organization.slug', type: 'string', description: 'URL-safe organization slug.' },
        { name: 'organization.role', type: 'string', description: 'User role in the organization.' },
        { name: 'mfaRequired', type: 'boolean', description: 'Present and true when MFA must be completed.' },
        { name: 'mfaToken', type: 'string', description: 'Short-lived token to pass to the MFA challenge endpoint.' },
      ],
      responseSample: {
        accessToken: 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c3JfMTIzIn0.sig',
        refreshToken: 'rt_a1b2c3d4e5f6a1b2c3d4e5f6',
        expiresIn: 900,
        tokenType: 'Bearer',
        user: {
          id: 'usr_01hy5j8x2k3n4m5p6q7r8s9t',
          email: 'alice@example.com',
          firstName: 'Alice',
          lastName: 'Smith',
          organizationId: 'org_01hz1a2b3c4d5e6f7g8h9i0j',
          role: 'ADMIN',
        },
        organization: {
          id: 'org_01hz1a2b3c4d5e6f7g8h9i0j',
          name: 'Acme Corp',
          slug: 'acme-corp',
          role: 'ADMIN',
        },
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/auth/verify \\
  -H "Content-Type: application/json" \\
  -d '{"token": "ml_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"}'`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/verify"
payload = {"token": "ml_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"}

response = requests.post(url, json=payload)
data = response.json()
access_token = data["accessToken"]
print(access_token)`,

        nodejs: `const axios = require('axios');

const response = await axios.post(
  'https://api.sutraid.com/api/v1/auth/verify',
  { token: 'ml_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4' }
);
const { accessToken, refreshToken, user } = response.data;
console.log('Logged in as', user.email);`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = "{\\"token\\": \\"ml_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4\\"}";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/verify"))
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
    payload := map[string]string{"token": "ml_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"}
    data, _ := json.Marshal(payload)

    resp, _ := http.Post(
        "https://api.sutraid.com/api/v1/auth/verify",
        "application/json",
        bytes.NewBuffer(data),
    )
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/verify");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "token" => "ml_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"
]));

$response = json_decode(curl_exec($ch), true);
curl_close($ch);
echo $response["accessToken"];`,
      },
    },

    {
      id: 'auth-register',
      method: 'POST',
      path: '/api/v1/auth/register',
      title: 'Register with Email & Password',
      description:
        'Creates a new user account with an email and password. Returns a full session immediately upon successful registration. Password must be at least 8 characters.',
      auth: 'none',
      requestBody: [
        {
          name: 'email',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Email address for the new account.',
          example: 'bob@example.com',
        },
        {
          name: 'password',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Password for the new account. Minimum 8 characters.',
          example: 'Sup3rS3cur3!',
        },
      ],
      responseFields: [
        { name: 'accessToken', type: 'string', description: 'JWT access token.' },
        { name: 'refreshToken', type: 'string', description: 'Opaque refresh token.' },
        { name: 'expiresIn', type: 'number', description: 'Access token TTL in seconds.' },
        { name: 'tokenType', type: 'string', description: 'Always "Bearer".' },
        { name: 'user', type: 'object', description: 'Newly created user object.' },
        { name: 'organization', type: 'object', description: 'Default organization assigned to the user.' },
      ],
      responseSample: {
        accessToken: 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c3JfbmV3In0.sig',
        refreshToken: 'rt_newuser1234567890abcdef',
        expiresIn: 900,
        tokenType: 'Bearer',
        user: {
          id: 'usr_02ab3cd4ef5g6h7i8j9k0l1m',
          email: 'bob@example.com',
          firstName: null,
          lastName: null,
          organizationId: 'org_02ab3cd4ef5g6h7i8j9k0l1m',
          role: 'OWNER',
        },
        organization: {
          id: 'org_02ab3cd4ef5g6h7i8j9k0l1m',
          name: "Bob's Organization",
          slug: 'bobs-organization',
          role: 'OWNER',
        },
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "bob@example.com",
    "password": "Sup3rS3cur3!"
  }'`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/register"
payload = {
    "email": "bob@example.com",
    "password": "Sup3rS3cur3!"
}

response = requests.post(url, json=payload)
data = response.json()
print("Access token:", data["accessToken"])`,

        nodejs: `const axios = require('axios');

const response = await axios.post(
  'https://api.sutraid.com/api/v1/auth/register',
  {
    email: 'bob@example.com',
    password: 'Sup3rS3cur3!',
  }
);
const { accessToken, user } = response.data;
console.log('Registered user:', user.id);`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = """
    {
        "email": "bob@example.com",
        "password": "Sup3rS3cur3!"
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/register"))
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
        "email":    "bob@example.com",
        "password": "Sup3rS3cur3!",
    }
    data, _ := json.Marshal(payload)

    resp, _ := http.Post(
        "https://api.sutraid.com/api/v1/auth/register",
        "application/json",
        bytes.NewBuffer(data),
    )
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/register");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "email"    => "bob@example.com",
    "password" => "Sup3rS3cur3!"
]));

$response = json_decode(curl_exec($ch), true);
curl_close($ch);
echo $response["accessToken"];`,
      },
    },

    {
      id: 'auth-login',
      method: 'POST',
      path: '/api/v1/auth/login',
      title: 'Login with Password',
      description:
        'Authenticates a user with their email and password. Optionally accepts an organizationId to log into a specific organization context. If the account has MFA enabled, the response will include mfaRequired: true and an mfaToken — use the MFA Verify Challenge endpoint to complete the login.',
      auth: 'none',
      requestBody: [
        {
          name: 'email',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The user email address.',
          example: 'alice@example.com',
        },
        {
          name: 'password',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The user password.',
          example: 'Sup3rS3cur3!',
        },
        {
          name: 'organizationId',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Optional organization UUID to log into a specific organization context.',
          example: 'org_01hz1a2b3c4d5e6f7g8h9i0j',
        },
      ],
      responseFields: [
        { name: 'accessToken', type: 'string', description: 'JWT access token (absent when MFA is required).' },
        { name: 'refreshToken', type: 'string', description: 'Opaque refresh token (absent when MFA is required).' },
        { name: 'expiresIn', type: 'number', description: 'Access token TTL in seconds.' },
        { name: 'tokenType', type: 'string', description: 'Always "Bearer".' },
        { name: 'user', type: 'object', description: 'Authenticated user.' },
        { name: 'organization', type: 'object', description: 'Active organization context.' },
        { name: 'mfaRequired', type: 'boolean', description: 'True when an MFA challenge must be completed.' },
        { name: 'mfaToken', type: 'string', description: 'Short-lived token for the MFA challenge flow.' },
      ],
      responseSample: {
        accessToken: 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c3JfMTIzIn0.sig',
        refreshToken: 'rt_a1b2c3d4e5f6a1b2c3d4e5f6',
        expiresIn: 900,
        tokenType: 'Bearer',
        user: {
          id: 'usr_01hy5j8x2k3n4m5p6q7r8s9t',
          email: 'alice@example.com',
          firstName: 'Alice',
          lastName: 'Smith',
          organizationId: 'org_01hz1a2b3c4d5e6f7g8h9i0j',
          role: 'ADMIN',
        },
        organization: {
          id: 'org_01hz1a2b3c4d5e6f7g8h9i0j',
          name: 'Acme Corp',
          slug: 'acme-corp',
          role: 'ADMIN',
        },
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "alice@example.com",
    "password": "Sup3rS3cur3!",
    "organizationId": "org_01hz1a2b3c4d5e6f7g8h9i0j"
  }'`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/login"
payload = {
    "email": "alice@example.com",
    "password": "Sup3rS3cur3!",
    "organizationId": "org_01hz1a2b3c4d5e6f7g8h9i0j"
}

response = requests.post(url, json=payload)
data = response.json()

if data.get("mfaRequired"):
    print("MFA required, token:", data["mfaToken"])
else:
    print("Access token:", data["accessToken"])`,

        nodejs: `const axios = require('axios');

const response = await axios.post(
  'https://api.sutraid.com/api/v1/auth/login',
  {
    email: 'alice@example.com',
    password: 'Sup3rS3cur3!',
    organizationId: 'org_01hz1a2b3c4d5e6f7g8h9i0j',
  }
);

const data = response.data;
if (data.mfaRequired) {
  console.log('MFA required, mfaToken:', data.mfaToken);
} else {
  console.log('Access token:', data.accessToken);
}`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = """
    {
        "email": "alice@example.com",
        "password": "Sup3rS3cur3!",
        "organizationId": "org_01hz1a2b3c4d5e6f7g8h9i0j"
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/login"))
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
        "email":          "alice@example.com",
        "password":       "Sup3rS3cur3!",
        "organizationId": "org_01hz1a2b3c4d5e6f7g8h9i0j",
    }
    data, _ := json.Marshal(payload)

    resp, _ := http.Post(
        "https://api.sutraid.com/api/v1/auth/login",
        "application/json",
        bytes.NewBuffer(data),
    )
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/login");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "email"          => "alice@example.com",
    "password"       => "Sup3rS3cur3!",
    "organizationId" => "org_01hz1a2b3c4d5e6f7g8h9i0j"
]));

$response = json_decode(curl_exec($ch), true);
curl_close($ch);

if (!empty($response["mfaRequired"])) {
    echo "MFA required: " . $response["mfaToken"];
} else {
    echo $response["accessToken"];
}`,
      },
    },

    {
      id: 'auth-forgot-password',
      method: 'POST',
      path: '/api/v1/auth/forgot-password',
      title: 'Request Password Reset',
      description:
        'Sends a password reset email to the provided address. Returns a generic message regardless of whether the email is registered, preventing user enumeration.',
      auth: 'none',
      requestBody: [
        {
          name: 'email',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Email address associated with the account to reset.',
          example: 'alice@example.com',
        },
      ],
      responseFields: [
        {
          name: 'message',
          type: 'string',
          description: 'Generic confirmation message.',
          example: 'If an account exists, a reset link has been sent',
        },
      ],
      responseSample: {
        message: 'If an account exists, a reset link has been sent',
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/auth/forgot-password \\
  -H "Content-Type: application/json" \\
  -d '{"email": "alice@example.com"}'`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/forgot-password"
payload = {"email": "alice@example.com"}

response = requests.post(url, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const response = await axios.post(
  'https://api.sutraid.com/api/v1/auth/forgot-password',
  { email: 'alice@example.com' }
);
console.log(response.data.message);`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = "{\\"email\\": \\"alice@example.com\\"}";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/forgot-password"))
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
    payload := map[string]string{"email": "alice@example.com"}
    data, _ := json.Marshal(payload)

    resp, _ := http.Post(
        "https://api.sutraid.com/api/v1/auth/forgot-password",
        "application/json",
        bytes.NewBuffer(data),
    )
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/forgot-password");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(["email" => "alice@example.com"]));

$response = json_decode(curl_exec($ch), true);
curl_close($ch);
echo $response["message"];`,
      },
    },

    {
      id: 'auth-reset-password',
      method: 'POST',
      path: '/api/v1/auth/reset-password',
      title: 'Reset Password',
      description:
        'Resets a user password using the token received in the reset email. The new password must be at least 8 characters. The reset token is single-use and expires after a short period.',
      auth: 'none',
      requestBody: [
        {
          name: 'token',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Password reset token from the emailed link.',
          example: 'pr_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
        },
        {
          name: 'newPassword',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The new password. Minimum 8 characters.',
          example: 'N3wP@ssw0rd!',
        },
      ],
      responseFields: [
        {
          name: 'message',
          type: 'string',
          description: 'Confirmation message.',
          example: 'Password reset successfully',
        },
      ],
      responseSample: {
        message: 'Password reset successfully',
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/auth/reset-password \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "pr_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
    "newPassword": "N3wP@ssw0rd!"
  }'`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/reset-password"
payload = {
    "token": "pr_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
    "newPassword": "N3wP@ssw0rd!"
}

response = requests.post(url, json=payload)
print(response.json())`,

        nodejs: `const axios = require('axios');

const response = await axios.post(
  'https://api.sutraid.com/api/v1/auth/reset-password',
  {
    token: 'pr_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    newPassword: 'N3wP@ssw0rd!',
  }
);
console.log(response.data.message);`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = """
    {
        "token": "pr_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
        "newPassword": "N3wP@ssw0rd!"
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/reset-password"))
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
        "token":       "pr_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
        "newPassword": "N3wP@ssw0rd!",
    }
    data, _ := json.Marshal(payload)

    resp, _ := http.Post(
        "https://api.sutraid.com/api/v1/auth/reset-password",
        "application/json",
        bytes.NewBuffer(data),
    )
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/reset-password");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "token"       => "pr_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
    "newPassword" => "N3wP@ssw0rd!"
]));

$response = json_decode(curl_exec($ch), true);
curl_close($ch);
echo $response["message"];`,
      },
    },

    {
      id: 'auth-change-password',
      method: 'POST',
      path: '/api/v1/auth/change-password',
      title: 'Change Password',
      description:
        'Changes the password for the currently authenticated user. Requires the current password for verification. The new password must be at least 8 characters.',
      auth: 'bearer',
      requestBody: [
        {
          name: 'currentPassword',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The user current password.',
          example: 'Sup3rS3cur3!',
        },
        {
          name: 'newPassword',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The new password. Minimum 8 characters.',
          example: 'N3wP@ssw0rd!',
        },
      ],
      responseFields: [
        {
          name: 'message',
          type: 'string',
          description: 'Confirmation message.',
          example: 'Password changed successfully',
        },
      ],
      responseSample: {
        message: 'Password changed successfully',
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/auth/change-password \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{
    "currentPassword": "Sup3rS3cur3!",
    "newPassword": "N3wP@ssw0rd!"
  }'`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/change-password"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9..."
}
payload = {
    "currentPassword": "Sup3rS3cur3!",
    "newPassword": "N3wP@ssw0rd!"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const response = await axios.post(
  'https://api.sutraid.com/api/v1/auth/change-password',
  {
    currentPassword: 'Sup3rS3cur3!',
    newPassword: 'N3wP@ssw0rd!',
  },
  {
    headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...' },
  }
);
console.log(response.data.message);`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = """
    {
        "currentPassword": "Sup3rS3cur3!",
        "newPassword": "N3wP@ssw0rd!"
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/change-password"))
    .header("Content-Type", "application/json")
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
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
        "currentPassword": "Sup3rS3cur3!",
        "newPassword":     "N3wP@ssw0rd!",
    }
    data, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/auth/change-password",
        bytes.NewBuffer(data),
    )
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/change-password");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "currentPassword" => "Sup3rS3cur3!",
    "newPassword"     => "N3wP@ssw0rd!"
]));

$response = json_decode(curl_exec($ch), true);
curl_close($ch);
echo $response["message"];`,
      },
    },

    {
      id: 'auth-me',
      method: 'GET',
      path: '/api/v1/auth/me',
      title: 'Get Current User',
      description:
        'Returns the profile of the currently authenticated user. Useful for hydrating application state after a page load or token refresh.',
      auth: 'bearer',
      responseFields: [
        { name: 'user.id', type: 'string', description: 'User UUID.' },
        { name: 'user.email', type: 'string', description: 'User email address.' },
        { name: 'user.firstName', type: 'string', description: 'User first name.' },
        { name: 'user.lastName', type: 'string', description: 'User last name.' },
        { name: 'user.organizationId', type: 'string', description: 'Current organization UUID.' },
        { name: 'user.role', type: 'string', description: 'User role within the organization.' },
      ],
      responseSample: {
        user: {
          id: 'usr_01hy5j8x2k3n4m5p6q7r8s9t',
          email: 'alice@example.com',
          firstName: 'Alice',
          lastName: 'Smith',
          organizationId: 'org_01hz1a2b3c4d5e6f7g8h9i0j',
          role: 'ADMIN',
        },
      },
      codeSamples: {
        curl: `curl -X GET https://api.sutraid.com/api/v1/auth/me \\
  -H "Authorization: Bearer <token>"`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/me"
headers = {"Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9..."}

response = requests.get(url, headers=headers)
user = response.json()["user"]
print(f"Logged in as {user['email']}")`,

        nodejs: `const axios = require('axios');

const response = await axios.get(
  'https://api.sutraid.com/api/v1/auth/me',
  {
    headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...' },
  }
);
console.log('Current user:', response.data.user);`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/me"))
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
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
        "https://api.sutraid.com/api/v1/auth/me", nil)
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/me");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."
]);

$response = json_decode(curl_exec($ch), true);
curl_close($ch);
echo $response["user"]["email"];`,
      },
    },

    {
      id: 'auth-logout',
      method: 'POST',
      path: '/api/v1/auth/logout',
      title: 'Logout',
      description:
        'Revokes the current session for the authenticated user. The access token is invalidated server-side. Clients should discard stored tokens after calling this endpoint.',
      auth: 'bearer',
      responseFields: [
        {
          name: 'message',
          type: 'string',
          description: 'Confirmation message.',
          example: 'Logged out successfully',
        },
      ],
      responseSample: {
        message: 'Logged out successfully',
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/auth/logout \\
  -H "Authorization: Bearer <token>"`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/logout"
headers = {"Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9..."}

response = requests.post(url, headers=headers)
print(response.json())`,

        nodejs: `const axios = require('axios');

const response = await axios.post(
  'https://api.sutraid.com/api/v1/auth/logout',
  {},
  {
    headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...' },
  }
);
console.log(response.data.message);`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/logout"))
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
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
        "https://api.sutraid.com/api/v1/auth/logout", nil)
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/logout");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."
]);

$response = json_decode(curl_exec($ch), true);
curl_close($ch);
echo $response["message"];`,
      },
    },

    // ─── MFA ─────────────────────────────────────────────────────────────────

    {
      id: 'mfa-status',
      method: 'GET',
      path: '/api/v1/auth/mfa/status',
      title: 'Get MFA Status',
      description:
        'Returns the current MFA enrollment status for the authenticated user, including all enrolled methods with their type, verification status, and last usage timestamp.',
      auth: 'bearer',
      responseFields: [
        { name: 'enabled', type: 'boolean', description: 'Whether MFA is currently active for this user.' },
        { name: 'methods', type: 'array', description: 'List of enrolled MFA methods.' },
        { name: 'methods[].id', type: 'string', description: 'Method UUID.' },
        { name: 'methods[].type', type: 'string', description: 'Method type: TOTP, PASSKEY, or BACKUP_CODE.' },
        { name: 'methods[].name', type: 'string', description: 'Human-readable method name.' },
        { name: 'methods[].verified', type: 'boolean', description: 'Whether the method has been verified.' },
        { name: 'methods[].enabled', type: 'boolean', description: 'Whether the method is currently active.' },
        { name: 'methods[].lastUsedAt', type: 'string | null', description: 'ISO 8601 timestamp of last use.' },
      ],
      responseSample: {
        enabled: true,
        methods: [
          {
            id: 'mfa_01hz1a2b3c4d5e6f7g8h',
            type: 'TOTP',
            name: 'Authenticator App',
            verified: true,
            enabled: true,
            lastUsedAt: '2025-01-15T10:30:00.000Z',
          },
          {
            id: 'mfa_02ab3cd4ef5g6h7i8j9k',
            type: 'BACKUP_CODE',
            name: 'Backup Codes',
            verified: true,
            enabled: true,
            lastUsedAt: null,
          },
        ],
      },
      codeSamples: {
        curl: `curl -X GET https://api.sutraid.com/api/v1/auth/mfa/status \\
  -H "Authorization: Bearer <token>"`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/mfa/status"
headers = {"Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9..."}

response = requests.get(url, headers=headers)
data = response.json()
print("MFA enabled:", data["enabled"])
for method in data["methods"]:
    print(f"  {method['type']}: verified={method['verified']}")`,

        nodejs: `const axios = require('axios');

const response = await axios.get(
  'https://api.sutraid.com/api/v1/auth/mfa/status',
  {
    headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...' },
  }
);
const { enabled, methods } = response.data;
console.log('MFA enabled:', enabled);
console.log('Methods:', methods.map(m => m.type));`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/mfa/status"))
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
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
        "https://api.sutraid.com/api/v1/auth/mfa/status", nil)
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/mfa/status");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."
]);

$response = json_decode(curl_exec($ch), true);
curl_close($ch);
echo "MFA enabled: " . ($response["enabled"] ? "true" : "false");`,
      },
    },

    {
      id: 'mfa-enroll-totp',
      method: 'POST',
      path: '/api/v1/auth/mfa/enroll/totp',
      title: 'Enroll TOTP Authenticator',
      description:
        'Initiates TOTP enrollment for the authenticated user. Returns a methodId, the otpauth:// URI, a base64-encoded QR code image, and a set of one-time backup codes. Present the QR code to the user for scanning with an authenticator app, then call the Verify TOTP Enrollment endpoint to confirm.',
      auth: 'bearer',
      responseFields: [
        { name: 'methodId', type: 'string', description: 'MFA method UUID to use when verifying enrollment.' },
        { name: 'otpAuthUrl', type: 'string', description: 'otpauth:// URI for manual entry into authenticator apps.' },
        { name: 'qrCode', type: 'string', description: 'Base64-encoded PNG QR code image of the otpauth URL.' },
        { name: 'backupCodes', type: 'string[]', description: 'One-time backup codes. Store securely.' },
      ],
      responseSample: {
        methodId: 'mfa_01hz1a2b3c4d5e6f7g8h',
        otpAuthUrl:
          'otpauth://totp/SutraID%3Aalice%40example.com?secret=BASE32SECRET&issuer=SutraID',
        qrCode: 'data:image/png;base64,iVBORw0KGgo...',
        backupCodes: [
          'AAAA-BBBB-CCCC',
          'DDDD-EEEE-FFFF',
          'GGGG-HHHH-IIII',
          'JJJJ-KKKK-LLLL',
          'MMMM-NNNN-OOOO',
          'PPPP-QQQQ-RRRR',
          'SSSS-TTTT-UUUU',
          'VVVV-WWWW-XXXX',
        ],
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/auth/mfa/enroll/totp \\
  -H "Authorization: Bearer <token>"`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/mfa/enroll/totp"
headers = {"Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9..."}

response = requests.post(url, headers=headers)
data = response.json()
print("Method ID:", data["methodId"])
print("Scan this URL with your authenticator:", data["otpAuthUrl"])
print("Backup codes:", data["backupCodes"])`,

        nodejs: `const axios = require('axios');

const response = await axios.post(
  'https://api.sutraid.com/api/v1/auth/mfa/enroll/totp',
  {},
  {
    headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...' },
  }
);
const { methodId, qrCode, backupCodes } = response.data;
// Render qrCode as an <img src={qrCode} /> in your UI
console.log('Method ID:', methodId);`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/mfa/enroll/totp"))
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
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
        "https://api.sutraid.com/api/v1/auth/mfa/enroll/totp", nil)
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/mfa/enroll/totp");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."
]);

$response = json_decode(curl_exec($ch), true);
curl_close($ch);
echo $response["methodId"];`,
      },
    },

    {
      id: 'mfa-enroll-verify',
      method: 'POST',
      path: '/api/v1/auth/mfa/enroll/verify',
      title: 'Verify TOTP Enrollment',
      description:
        'Completes TOTP enrollment by submitting the 6-digit code from the authenticator app. Must be called after initiating enrollment with the Enroll TOTP endpoint. On success, TOTP becomes the active MFA method for the account.',
      auth: 'bearer',
      requestBody: [
        {
          name: 'methodId',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The methodId returned from the enroll TOTP endpoint.',
          example: 'mfa_01hz1a2b3c4d5e6f7g8h',
        },
        {
          name: 'code',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The 6-digit TOTP code from the authenticator app.',
          example: '482910',
        },
      ],
      responseFields: [
        { name: 'success', type: 'boolean', description: 'Whether enrollment verification succeeded.' },
        { name: 'backupCodes', type: 'string[]', description: 'Backup codes (returned on first successful verify).' },
      ],
      responseSample: {
        success: true,
        backupCodes: [
          'AAAA-BBBB-CCCC',
          'DDDD-EEEE-FFFF',
          'GGGG-HHHH-IIII',
          'JJJJ-KKKK-LLLL',
        ],
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/auth/mfa/enroll/verify \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{
    "methodId": "mfa_01hz1a2b3c4d5e6f7g8h",
    "code": "482910"
  }'`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/mfa/enroll/verify"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9..."
}
payload = {
    "methodId": "mfa_01hz1a2b3c4d5e6f7g8h",
    "code": "482910"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Enrollment success:", data["success"])`,

        nodejs: `const axios = require('axios');

const response = await axios.post(
  'https://api.sutraid.com/api/v1/auth/mfa/enroll/verify',
  {
    methodId: 'mfa_01hz1a2b3c4d5e6f7g8h',
    code: '482910',
  },
  {
    headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...' },
  }
);
console.log('Enrolled:', response.data.success);`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = """
    {
        "methodId": "mfa_01hz1a2b3c4d5e6f7g8h",
        "code": "482910"
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/mfa/enroll/verify"))
    .header("Content-Type", "application/json")
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
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
        "methodId": "mfa_01hz1a2b3c4d5e6f7g8h",
        "code":     "482910",
    }
    data, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/auth/mfa/enroll/verify",
        bytes.NewBuffer(data),
    )
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/mfa/enroll/verify");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "methodId" => "mfa_01hz1a2b3c4d5e6f7g8h",
    "code"     => "482910"
]));

$response = json_decode(curl_exec($ch), true);
curl_close($ch);
echo $response["success"] ? "Enrolled!" : "Failed";`,
      },
    },

    {
      id: 'mfa-verify-challenge',
      method: 'POST',
      path: '/api/v1/auth/mfa/verify-challenge',
      title: 'Verify MFA Challenge',
      description:
        'Completes the MFA challenge step during a login flow. Submit the mfaToken received from a login response (when mfaRequired is true) along with either a TOTP code or a backup code. On success, returns a full session with access and refresh tokens.',
      auth: 'none',
      requestBody: [
        {
          name: 'mfaToken',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The mfaToken returned from the login endpoint when mfaRequired is true.',
          example: 'mfat_a1b2c3d4e5f6a1b2c3d4e5f6',
        },
        {
          name: 'code',
          in: 'body',
          type: 'string',
          required: true,
          description: 'TOTP code (6 digits) or backup code (6-8 chars).',
          example: '482910',
        },
        {
          name: 'isBackupCode',
          in: 'body',
          type: 'boolean',
          required: false,
          description: 'Set to true when submitting a backup code instead of a TOTP code.',
          example: 'false',
        },
      ],
      responseFields: [
        { name: 'accessToken', type: 'string', description: 'JWT access token.' },
        { name: 'refreshToken', type: 'string', description: 'Opaque refresh token.' },
        { name: 'expiresIn', type: 'number', description: 'Access token TTL in seconds.' },
        { name: 'tokenType', type: 'string', description: 'Always "Bearer".' },
        { name: 'user', type: 'object', description: 'Authenticated user.' },
        { name: 'organization', type: 'object', description: 'Active organization context.' },
      ],
      responseSample: {
        accessToken: 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c3JfMTIzIn0.sig',
        refreshToken: 'rt_a1b2c3d4e5f6a1b2c3d4e5f6',
        expiresIn: 900,
        tokenType: 'Bearer',
        user: {
          id: 'usr_01hy5j8x2k3n4m5p6q7r8s9t',
          email: 'alice@example.com',
          firstName: 'Alice',
          lastName: 'Smith',
          organizationId: 'org_01hz1a2b3c4d5e6f7g8h9i0j',
          role: 'ADMIN',
        },
        organization: {
          id: 'org_01hz1a2b3c4d5e6f7g8h9i0j',
          name: 'Acme Corp',
          slug: 'acme-corp',
          role: 'ADMIN',
        },
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/auth/mfa/verify-challenge \\
  -H "Content-Type: application/json" \\
  -d '{
    "mfaToken": "mfat_a1b2c3d4e5f6a1b2c3d4e5f6",
    "code": "482910",
    "isBackupCode": false
  }'`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/mfa/verify-challenge"
payload = {
    "mfaToken": "mfat_a1b2c3d4e5f6a1b2c3d4e5f6",
    "code": "482910",
    "isBackupCode": False
}

response = requests.post(url, json=payload)
data = response.json()
print("Access token:", data["accessToken"])`,

        nodejs: `const axios = require('axios');

const response = await axios.post(
  'https://api.sutraid.com/api/v1/auth/mfa/verify-challenge',
  {
    mfaToken: 'mfat_a1b2c3d4e5f6a1b2c3d4e5f6',
    code: '482910',
    isBackupCode: false,
  }
);
const { accessToken, user } = response.data;
console.log('MFA verified, logged in as:', user.email);`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = """
    {
        "mfaToken": "mfat_a1b2c3d4e5f6a1b2c3d4e5f6",
        "code": "482910",
        "isBackupCode": false
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/mfa/verify-challenge"))
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
    payload := map[string]interface{}{
        "mfaToken":     "mfat_a1b2c3d4e5f6a1b2c3d4e5f6",
        "code":         "482910",
        "isBackupCode": false,
    }
    data, _ := json.Marshal(payload)

    resp, _ := http.Post(
        "https://api.sutraid.com/api/v1/auth/mfa/verify-challenge",
        "application/json",
        bytes.NewBuffer(data),
    )
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/mfa/verify-challenge");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "mfaToken"     => "mfat_a1b2c3d4e5f6a1b2c3d4e5f6",
    "code"         => "482910",
    "isBackupCode" => false
]));

$response = json_decode(curl_exec($ch), true);
curl_close($ch);
echo $response["accessToken"];`,
      },
    },

    {
      id: 'mfa-backup-codes-regenerate',
      method: 'POST',
      path: '/api/v1/auth/mfa/backup-codes/regenerate',
      title: 'Regenerate Backup Codes',
      description:
        'Generates a new set of backup codes for the authenticated user, invalidating all previously issued backup codes. Store the returned codes securely — they cannot be retrieved again.',
      auth: 'bearer',
      responseFields: [
        {
          name: 'backupCodes',
          type: 'string[]',
          description: 'New set of single-use backup codes.',
          example: '["AAAA-BBBB-CCCC", "DDDD-EEEE-FFFF"]',
        },
      ],
      responseSample: {
        backupCodes: [
          'AAAA-BBBB-CCCC',
          'DDDD-EEEE-FFFF',
          'GGGG-HHHH-IIII',
          'JJJJ-KKKK-LLLL',
          'MMMM-NNNN-OOOO',
          'PPPP-QQQQ-RRRR',
          'SSSS-TTTT-UUUU',
          'VVVV-WWWW-XXXX',
        ],
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/auth/mfa/backup-codes/regenerate \\
  -H "Authorization: Bearer <token>"`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/mfa/backup-codes/regenerate"
headers = {"Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9..."}

response = requests.post(url, headers=headers)
data = response.json()
print("New backup codes:", data["backupCodes"])`,

        nodejs: `const axios = require('axios');

const response = await axios.post(
  'https://api.sutraid.com/api/v1/auth/mfa/backup-codes/regenerate',
  {},
  {
    headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...' },
  }
);
console.log('Backup codes:', response.data.backupCodes);`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/mfa/backup-codes/regenerate"))
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
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
        "https://api.sutraid.com/api/v1/auth/mfa/backup-codes/regenerate", nil)
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/mfa/backup-codes/regenerate");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."
]);

$response = json_decode(curl_exec($ch), true);
curl_close($ch);
print_r($response["backupCodes"]);`,
      },
    },

    {
      id: 'mfa-disable',
      method: 'POST',
      path: '/api/v1/auth/mfa/disable',
      title: 'Disable MFA',
      description:
        'Disables MFA for the authenticated user. Requires the current account password as confirmation. All enrolled MFA methods will be removed.',
      auth: 'bearer',
      requestBody: [
        {
          name: 'password',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Current account password for confirmation.',
          example: 'Sup3rS3cur3!',
        },
      ],
      responseFields: [
        {
          name: 'success',
          type: 'boolean',
          description: 'Whether MFA was successfully disabled.',
          example: 'true',
        },
      ],
      responseSample: {
        success: true,
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/auth/mfa/disable \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{"password": "Sup3rS3cur3!"}'`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/mfa/disable"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9..."
}
payload = {"password": "Sup3rS3cur3!"}

response = requests.post(url, json=payload, headers=headers)
print("MFA disabled:", response.json()["success"])`,

        nodejs: `const axios = require('axios');

const response = await axios.post(
  'https://api.sutraid.com/api/v1/auth/mfa/disable',
  { password: 'Sup3rS3cur3!' },
  {
    headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...' },
  }
);
console.log('MFA disabled:', response.data.success);`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = "{\\"password\\": \\"Sup3rS3cur3!\\"}";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/mfa/disable"))
    .header("Content-Type", "application/json")
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
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
    payload := map[string]string{"password": "Sup3rS3cur3!"}
    data, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/auth/mfa/disable",
        bytes.NewBuffer(data),
    )
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/mfa/disable");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "password" => "Sup3rS3cur3!"
]));

$response = json_decode(curl_exec($ch), true);
curl_close($ch);
echo $response["success"] ? "MFA disabled" : "Failed";`,
      },
    },

    {
      id: 'mfa-passkey-options',
      method: 'GET',
      path: '/api/v1/auth/mfa/passkey/options',
      title: 'Get WebAuthn Registration Options',
      description:
        'Returns the WebAuthn credential creation options (PublicKeyCredentialCreationOptions) needed to register a passkey. Pass the returned options to navigator.credentials.create() in the browser, then submit the attestation response to the Enroll Passkey endpoint.',
      auth: 'bearer',
      responseFields: [
        { name: 'challenge', type: 'string', description: 'Base64url-encoded random challenge.' },
        { name: 'rp', type: 'object', description: 'Relying party info (id, name).' },
        { name: 'user', type: 'object', description: 'User handle info (id, name, displayName).' },
        { name: 'pubKeyCredParams', type: 'array', description: 'Accepted credential algorithms.' },
        { name: 'timeout', type: 'number', description: 'Ceremony timeout in milliseconds.' },
        { name: 'attestation', type: 'string', description: 'Attestation preference.' },
        { name: 'authenticatorSelection', type: 'object', description: 'Authenticator selection criteria.' },
      ],
      responseSample: {
        challenge: 'dGhpcyBpcyBhIGNoYWxsZW5nZQ==',
        rp: { id: 'sutraid.com', name: 'SutraID' },
        user: {
          id: 'dXNyXzAxaHk1ajh4MmszbjRtNXA2cTdyOHM5dA==',
          name: 'alice@example.com',
          displayName: 'Alice Smith',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        timeout: 60000,
        attestation: 'none',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          requireResidentKey: false,
          userVerification: 'preferred',
        },
      },
      codeSamples: {
        curl: `curl -X GET https://api.sutraid.com/api/v1/auth/mfa/passkey/options \\
  -H "Authorization: Bearer <token>"`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/mfa/passkey/options"
headers = {"Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9..."}

response = requests.get(url, headers=headers)
options = response.json()
# Pass options to WebAuthn client library
print("Challenge:", options["challenge"])`,

        nodejs: `const axios = require('axios');

const response = await axios.get(
  'https://api.sutraid.com/api/v1/auth/mfa/passkey/options',
  {
    headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...' },
  }
);
const options = response.data;
// Use in browser: const credential = await navigator.credentials.create({ publicKey: options });
console.log('RP:', options.rp);`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/mfa/passkey/options"))
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
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
        "https://api.sutraid.com/api/v1/auth/mfa/passkey/options", nil)
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/mfa/passkey/options");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."
]);

$options = json_decode(curl_exec($ch), true);
curl_close($ch);
// Pass $options to a WebAuthn library
echo $options["challenge"];`,
      },
    },

    {
      id: 'mfa-passkey-enroll',
      method: 'POST',
      path: '/api/v1/auth/mfa/passkey/enroll',
      title: 'Enroll Passkey',
      description:
        'Completes passkey enrollment by submitting the WebAuthn attestation response from navigator.credentials.create(). The credential object must be the serialized PublicKeyCredential returned by the browser API.',
      auth: 'bearer',
      requestBody: [
        {
          name: 'credential',
          in: 'body',
          type: 'object',
          required: true,
          description: 'The WebAuthn PublicKeyCredential attestation response from the browser.',
          example: '{ id, rawId, response: { attestationObject, clientDataJSON }, type }',
        },
      ],
      responseFields: [
        { name: 'success', type: 'boolean', description: 'Whether passkey enrollment succeeded.' },
        { name: 'methodId', type: 'string', description: 'The MFA method UUID for the new passkey.' },
      ],
      responseSample: {
        success: true,
        methodId: 'mfa_03cd4ef5g6h7i8j9k0l1m2n',
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/auth/mfa/passkey/enroll \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{
    "credential": {
      "id": "credentialIdBase64url",
      "rawId": "credentialIdBase64url",
      "response": {
        "attestationObject": "attestationBase64url",
        "clientDataJSON": "clientDataBase64url"
      },
      "type": "public-key"
    }
  }'`,

        python: `import requests
import json

# credential comes from the browser WebAuthn API (navigator.credentials.create)
credential = {
    "id": "credentialIdBase64url",
    "rawId": "credentialIdBase64url",
    "response": {
        "attestationObject": "attestationBase64url",
        "clientDataJSON": "clientDataBase64url"
    },
    "type": "public-key"
}

url = "https://api.sutraid.com/api/v1/auth/mfa/passkey/enroll"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9..."
}

response = requests.post(url, json={"credential": credential}, headers=headers)
data = response.json()
print("Passkey enrolled:", data["success"], "Method ID:", data["methodId"])`,

        nodejs: `const axios = require('axios');

// credential is the result of: navigator.credentials.create({ publicKey: options })
const credential = {
  id: 'credentialIdBase64url',
  rawId: 'credentialIdBase64url',
  response: {
    attestationObject: 'attestationBase64url',
    clientDataJSON: 'clientDataBase64url',
  },
  type: 'public-key',
};

const response = await axios.post(
  'https://api.sutraid.com/api/v1/auth/mfa/passkey/enroll',
  { credential },
  {
    headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...' },
  }
);
console.log('Enrolled, method ID:', response.data.methodId);`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = """
    {
        "credential": {
            "id": "credentialIdBase64url",
            "rawId": "credentialIdBase64url",
            "response": {
                "attestationObject": "attestationBase64url",
                "clientDataJSON": "clientDataBase64url"
            },
            "type": "public-key"
        }
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/mfa/passkey/enroll"))
    .header("Content-Type", "application/json")
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
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
    credential := map[string]interface{}{
        "id":    "credentialIdBase64url",
        "rawId": "credentialIdBase64url",
        "response": map[string]string{
            "attestationObject": "attestationBase64url",
            "clientDataJSON":    "clientDataBase64url",
        },
        "type": "public-key",
    }
    payload := map[string]interface{}{"credential": credential}
    data, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/auth/mfa/passkey/enroll",
        bytes.NewBuffer(data),
    )
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$credential = [
    "id"    => "credentialIdBase64url",
    "rawId" => "credentialIdBase64url",
    "response" => [
        "attestationObject" => "attestationBase64url",
        "clientDataJSON"    => "clientDataBase64url"
    ],
    "type" => "public-key"
];

$ch = curl_init("https://api.sutraid.com/api/v1/auth/mfa/passkey/enroll");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(["credential" => $credential]));

$response = json_decode(curl_exec($ch), true);
curl_close($ch);
echo "Method ID: " . $response["methodId"];`,
      },
    },

    {
      id: 'mfa-adaptive-toggle',
      method: 'POST',
      path: '/api/v1/auth/mfa/adaptive/toggle',
      title: 'Toggle Adaptive MFA',
      description:
        'Enables or disables adaptive MFA for the authenticated user. When enabled, the system uses contextual signals (IP address, device fingerprint, geolocation) to determine whether an MFA challenge is required on each login, rather than always requiring it.',
      auth: 'bearer',
      requestBody: [
        {
          name: 'enabled',
          in: 'body',
          type: 'boolean',
          required: true,
          description: 'Set to true to enable adaptive MFA, false to disable it.',
          example: 'true',
        },
      ],
      responseFields: [
        {
          name: 'enabled',
          type: 'boolean',
          description: 'The new adaptive MFA state.',
          example: 'true',
        },
      ],
      responseSample: {
        enabled: true,
      },
      codeSamples: {
        curl: `curl -X POST https://api.sutraid.com/api/v1/auth/mfa/adaptive/toggle \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{"enabled": true}'`,

        python: `import requests

url = "https://api.sutraid.com/api/v1/auth/mfa/adaptive/toggle"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9..."
}
payload = {"enabled": True}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Adaptive MFA enabled:", data["enabled"])`,

        nodejs: `const axios = require('axios');

const response = await axios.post(
  'https://api.sutraid.com/api/v1/auth/mfa/adaptive/toggle',
  { enabled: true },
  {
    headers: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9...' },
  }
);
console.log('Adaptive MFA:', response.data.enabled ? 'enabled' : 'disabled');`,

        java: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = "{\\"enabled\\": true}";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/auth/mfa/adaptive/toggle"))
    .header("Content-Type", "application/json")
    .header("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")
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
    payload := map[string]bool{"enabled": true}
    data, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://api.sutraid.com/api/v1/auth/mfa/adaptive/toggle",
        bytes.NewBuffer(data),
    )
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiJ9...")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$ch = curl_init("https://api.sutraid.com/api/v1/auth/mfa/adaptive/toggle");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(["enabled" => true]));

$response = json_decode(curl_exec($ch), true);
curl_close($ch);
echo "Adaptive MFA: " . ($response["enabled"] ? "enabled" : "disabled");`,
      },
    },
  ],
};
