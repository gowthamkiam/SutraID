import { DocSection } from './types';

export const oidcProviderSection: DocSection = {
  title: 'OIDC Provider',
  slug: 'oidc-provider',
  description:
    'SutraID as an OpenID Connect Identity Provider — authorization, token, userinfo, and JWKS endpoints.',
  endpoints: [
    {
      id: 'oidc-discovery',
      method: 'GET',
      path: '/api/v1/sso/oidc-idp/:orgId/:appId/.well-known/openid-configuration',
      title: 'OIDC Discovery',
      description:
        'Returns the OpenID Connect discovery document for the specified organization. Clients can use this to auto-configure OIDC integration without hardcoding endpoint URLs.',
      auth: 'none',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization acting as the OIDC IdP.',
          example: 'org_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the application.',
          example: 'app_01hx9k2m3n4p5q6r7s8t9u0v',
        },
      ],
      responseFields: [
        { name: 'issuer', type: 'string', description: 'The issuer URL for this IdP.', example: 'https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hx9k2m3n4p5q6r7s8t9u0v/app_01hx9k2m3n4p5q6r7s8t9u0v' },
        { name: 'authorization_endpoint', type: 'string', description: 'URL of the authorization endpoint.' },
        { name: 'token_endpoint', type: 'string', description: 'URL of the token endpoint.' },
        { name: 'userinfo_endpoint', type: 'string', description: 'URL of the userinfo endpoint.' },
        { name: 'jwks_uri', type: 'string', description: 'URL of the JSON Web Key Set document.' },
        { name: 'scopes_supported', type: 'string[]', description: 'List of OAuth 2.0 scopes supported.', example: '["openid","email","profile"]' },
        { name: 'response_types_supported', type: 'string[]', description: 'List of response types supported.', example: '["code"]' },
        { name: 'grant_types_supported', type: 'string[]', description: 'List of grant types supported.', example: '["authorization_code","refresh_token"]' },
        { name: 'subject_types_supported', type: 'string[]', description: 'Subject identifier types supported.', example: '["public"]' },
        { name: 'id_token_signing_alg_values_supported', type: 'string[]', description: 'ID token signing algorithms supported.', example: '["RS256"]' },
      ],
      responseSample: {
        issuer: 'https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hx9k2m3n4p5q6r7s8t9u0v/app_01hx9k2m3n4p5q6r7s8t9u0v',
        authorization_endpoint: 'https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hx9k2m3n4p5q6r7s8t9u0v/app_01hx9k2m3n4p5q6r7s8t9u0v/authorize',
        token_endpoint: 'https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hx9k2m3n4p5q6r7s8t9u0v/app_01hx9k2m3n4p5q6r7s8t9u0v/token',
        userinfo_endpoint: 'https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hx9k2m3n4p5q6r7s8t9u0v/app_01hx9k2m3n4p5q6r7s8t9u0v/userinfo',
        jwks_uri: 'https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hx9k2m3n4p5q6r7s8t9u0v/app_01hx9k2m3n4p5q6r7s8t9u0v/jwks',
        scopes_supported: ['openid', 'email', 'profile'],
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hx9k2m3n4p5q6r7s8t9u0v/app_01hx9k2m3n4p5q6r7s8t9u0v/.well-known/openid-configuration"`,
        python: `import requests

org_id = "org_01hx9k2m3n4p5q6r7s8t9u0v"
app_id = "app_01hx9k2m3n4p5q6r7s8t9u0v"
url = f"https://api.sutraid.com/api/v1/sso/oidc-idp/{org_id}/{app_id}/.well-known/openid-configuration"

response = requests.get(url)
config = response.json()
print(config)`,
        nodejs: `const fetch = require('node-fetch');

const orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
const appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';
const url = \`https://api.sutraid.com/api/v1/sso/oidc-idp/\${orgId}/\${appId}/.well-known/openid-configuration\`;

const response = await fetch(url);
const config = await response.json();
console.log(config);`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "org_01hx9k2m3n4p5q6r7s8t9u0v";
String appId = "app_01hx9k2m3n4p5q6r7s8t9u0v";
HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/sso/oidc-idp/" + orgId + "/" + appId + "/.well-known/openid-configuration"))
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
    orgID := "org_01hx9k2m3n4p5q6r7s8t9u0v"
    appID := "app_01hx9k2m3n4p5q6r7s8t9u0v"
    url := fmt.Sprintf("https://api.sutraid.com/api/v1/sso/oidc-idp/%s/%s/.well-known/openid-configuration", orgID, appID)

    resp, err := http.Get(url)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php

$orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
$appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';
$url = "https://api.sutraid.com/api/v1/sso/oidc-idp/{$orgId}/{$appId}/.well-known/openid-configuration";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$config = json_decode($response, true);
print_r($config);`,
      },
    },
    {
      id: 'oidc-authorize',
      method: 'GET',
      path: '/api/v1/sso/oidc-idp/:orgId/:appId/authorize',
      title: 'Authorization Endpoint',
      description:
        'Initiates the OIDC authorization flow. The user is redirected to the SutraID login page (or consent screen if already authenticated). Supports PKCE for public clients.',
      auth: 'none',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the application.',
          example: 'app_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'client_id',
          in: 'query',
          type: 'string',
          required: true,
          description: 'The client application identifier.',
          example: 'app_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'redirect_uri',
          in: 'query',
          type: 'string',
          required: true,
          description: 'URI to redirect the user to after authorization. Must match a registered redirect URI.',
          example: 'https://yourapp.com/callback',
        },
        {
          name: 'scope',
          in: 'query',
          type: 'string',
          required: true,
          description: 'Space-separated list of requested scopes.',
          example: 'openid email profile',
        },
        {
          name: 'response_type',
          in: 'query',
          type: 'string',
          required: true,
          description: 'Must be "code" for authorization code flow.',
          example: 'code',
          enum: ['code'],
        },
        {
          name: 'state',
          in: 'query',
          type: 'string',
          required: true,
          description: 'Opaque value used to maintain state between request and callback. Protects against CSRF.',
          example: 'xK9mP2qR5tU8wZ1aB4cD7eF0',
        },
        {
          name: 'code_challenge',
          in: 'query',
          type: 'string',
          required: false,
          description: 'PKCE code challenge (Base64URL-encoded SHA-256 hash of code_verifier).',
          example: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        },
        {
          name: 'code_challenge_method',
          in: 'query',
          type: 'string',
          required: false,
          description: 'PKCE challenge method. Must be "S256" when code_challenge is provided.',
          example: 'S256',
          enum: ['S256'],
        },
        {
          name: 'nonce',
          in: 'query',
          type: 'string',
          required: false,
          description: 'Random value to associate the client session with the ID token, mitigating replay attacks.',
          example: 'n-0S6_WzA2Mj',
        },
      ],
      responseFields: [
        { name: '302 Location', type: 'string', description: 'Redirect to login or consent page. On completion, redirects back to redirect_uri with code and state query parameters.' },
      ],
      responseSample: {
        _note: 'HTTP 302 redirect — no JSON body. On success the user is redirected to redirect_uri?code=AUTH_CODE&state=STATE',
      },
      codeSamples: {
        curl: `# Open this URL in a browser — it initiates the authorization flow with PKCE
curl -v -L "https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hx9k2m3n4p5q6r7s8t9u0v/app_01hx9k2m3n4p5q6r7s8t9u0v/authorize?client_id=app_01hx9k2m3n4p5q6r7s8t9u0v&redirect_uri=https%3A%2F%2Fyourapp.com%2Fcallback&scope=openid%20email%20profile&response_type=code&state=xK9mP2qR5tU8wZ1aB4cD7eF0&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256"`,
        python: `import urllib.parse
import secrets
import hashlib
import base64

# Generate PKCE code_verifier and code_challenge
code_verifier = secrets.token_urlsafe(64)
code_challenge = base64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode()).digest()
).rstrip(b'=').decode()

state = secrets.token_urlsafe(16)
org_id = "org_01hx9k2m3n4p5q6r7s8t9u0v"
app_id = "app_01hx9k2m3n4p5q6r7s8t9u0v"

params = {
    "client_id": "app_01hx9k2m3n4p5q6r7s8t9u0v",
    "redirect_uri": "https://yourapp.com/callback",
    "scope": "openid email profile",
    "response_type": "code",
    "state": state,
    "code_challenge": code_challenge,
    "code_challenge_method": "S256",
}

auth_url = f"https://api.sutraid.com/api/v1/sso/oidc-idp/{org_id}/{app_id}/authorize?" + urllib.parse.urlencode(params)
print("Open in browser:", auth_url)`,
        nodejs: `const crypto = require('crypto');

// Generate PKCE code_verifier and code_challenge
const codeVerifier = crypto.randomBytes(64).toString('base64url');
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

const state = crypto.randomBytes(16).toString('base64url');
const orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';

const params = new URLSearchParams({
  client_id: 'app_01hx9k2m3n4p5q6r7s8t9u0v',
  redirect_uri: 'https://yourapp.com/callback',
  scope: 'openid email profile',
  response_type: 'code',
  state,
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
});

const authUrl = \`https://api.sutraid.com/api/v1/sso/oidc-idp/\${orgId}/app_01hx9k2m3n4p5q6r7s8t9u0v/authorize?\${params}\`;
console.log('Open in browser:', authUrl);`,
        java: `import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

SecureRandom random = new SecureRandom();
byte[] verifierBytes = new byte[64];
random.nextBytes(verifierBytes);
String codeVerifier = Base64.getUrlEncoder().withoutPadding().encodeToString(verifierBytes);

MessageDigest digest = MessageDigest.getInstance("SHA-256");
byte[] challengeBytes = digest.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
String codeChallenge = Base64.getUrlEncoder().withoutPadding().encodeToString(challengeBytes);

String orgId = "org_01hx9k2m3n4p5q6r7s8t9u0v";
String appId = "app_01hx9k2m3n4p5q6r7s8t9u0v";
String state = Base64.getUrlEncoder().withoutPadding().encodeToString(random.generateSeed(16));

String authUrl = "https://api.sutraid.com/api/v1/sso/oidc-idp/" + orgId + "/" + appId + "/authorize?"
    + "client_id=" + URLEncoder.encode("app_01hx9k2m3n4p5q6r7s8t9u0v", StandardCharsets.UTF_8)
    + "&redirect_uri=" + URLEncoder.encode("https://yourapp.com/callback", StandardCharsets.UTF_8)
    + "&scope=" + URLEncoder.encode("openid email profile", StandardCharsets.UTF_8)
    + "&response_type=code"
    + "&state=" + state
    + "&code_challenge=" + codeChallenge
    + "&code_challenge_method=S256";

System.out.println("Open in browser: " + authUrl);`,
        go: `package main

import (
    "crypto/rand"
    "crypto/sha256"
    "encoding/base64"
    "fmt"
    "net/url"
)

func main() {
    // Generate PKCE code_verifier and code_challenge
    verifierBytes := make([]byte, 64)
    rand.Read(verifierBytes)
    codeVerifier := base64.RawURLEncoding.EncodeToString(verifierBytes)

    hash := sha256.Sum256([]byte(codeVerifier))
    codeChallenge := base64.RawURLEncoding.EncodeToString(hash[:])

    stateBytes := make([]byte, 16)
    rand.Read(stateBytes)
    state := base64.RawURLEncoding.EncodeToString(stateBytes)

    orgID := "org_01hx9k2m3n4p5q6r7s8t9u0v"

    params := url.Values{
        "client_id":             {"app_01hx9k2m3n4p5q6r7s8t9u0v"},
        "redirect_uri":          {"https://yourapp.com/callback"},
        "scope":                 {"openid email profile"},
        "response_type":         {"code"},
        "state":                 {state},
        "code_challenge":        {codeChallenge},
        "code_challenge_method": {"S256"},
    }

    authURL := fmt.Sprintf(
        "https://api.sutraid.com/api/v1/sso/oidc-idp/%s/app_01hx9k2m3n4p5q6r7s8t9u0v/authorize?%s",
        orgID, params.Encode(),
    )
    fmt.Println("Open in browser:", authURL)
}`,
        php: `<?php

// Generate PKCE code_verifier and code_challenge
$codeVerifier = rtrim(strtr(base64_encode(random_bytes(64)), '+/', '-_'), '=');
$codeChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');
$state = bin2hex(random_bytes(16));

$orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
$appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';

$params = http_build_query([
    'client_id'             => 'app_01hx9k2m3n4p5q6r7s8t9u0v',
    'redirect_uri'          => 'https://yourapp.com/callback',
    'scope'                 => 'openid email profile',
    'response_type'         => 'code',
    'state'                 => $state,
    'code_challenge'        => $codeChallenge,
    'code_challenge_method' => 'S256',
]);

$authUrl = "https://api.sutraid.com/api/v1/sso/oidc-idp/{$orgId}/{$appId}/authorize?{$params}";
echo "Open in browser: " . $authUrl;`,
      },
    },
    {
      id: 'oidc-token',
      method: 'POST',
      path: '/api/v1/sso/oidc-idp/:orgId/:appId/token',
      title: 'Token Endpoint',
      description:
        'Exchanges an authorization code for an access token, ID token, and optional refresh token. Accepts application/x-www-form-urlencoded. Supports PKCE via code_verifier.',
      auth: 'none',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the application.',
          example: 'app_01hx9k2m3n4p5q6r7s8t9u0v',
        },
      ],
      requestBody: [
        {
          name: 'grant_type',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Must be "authorization_code".',
          example: 'authorization_code',
          enum: ['authorization_code'],
        },
        {
          name: 'code',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The authorization code received from the authorization endpoint.',
          example: 'SplxlOBeZQQYbYS6WxSbIA',
        },
        {
          name: 'redirect_uri',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Must match the redirect_uri used in the authorization request.',
          example: 'https://yourapp.com/callback',
        },
        {
          name: 'client_id',
          in: 'body',
          type: 'string',
          required: true,
          description: 'The client application identifier.',
          example: 'app_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'client_secret',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Client secret for confidential clients. Omit for public clients using PKCE.',
          example: 'cs_live_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'code_verifier',
          in: 'body',
          type: 'string',
          required: false,
          description: 'PKCE code verifier. Required for public clients that sent a code_challenge.',
          example: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
        },
      ],
      responseFields: [
        { name: 'access_token', type: 'string', description: 'JWT access token for accessing protected resources.' },
        { name: 'id_token', type: 'string', description: 'JWT ID token containing user identity claims.' },
        { name: 'refresh_token', type: 'string', description: 'Refresh token for obtaining new access tokens (if offline_access scope was requested).' },
        { name: 'token_type', type: 'string', description: 'Always "Bearer".', example: 'Bearer' },
        { name: 'expires_in', type: 'number', description: 'Access token lifetime in seconds.', example: '3600' },
      ],
      responseSample: {
        access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMDFoeDlrMm0zbjRwNXE2cjdzOHQ5dTB2IiwiaWF0IjoxNzAwMDAwMDAwfQ.signature',
        id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMDFoeDlrMm0zbjRwNXE2cjdzOHQ5dTB2IiwiZW1haWwiOiJhbGljZUBleGFtcGxlLmNvbSJ9.signature',
        refresh_token: 'v1.MRjRnAKY5uDhtbnO5xSNBzuP9ZGFVNWJm6KH7nE',
        token_type: 'Bearer',
        expires_in: 3600,
      },
      codeSamples: {
        curl: `curl -X POST "https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hx9k2m3n4p5q6r7s8t9u0v/app_01hx9k2m3n4p5q6r7s8t9u0v/token" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  --data-urlencode "grant_type=authorization_code" \\
  --data-urlencode "code=SplxlOBeZQQYbYS6WxSbIA" \\
  --data-urlencode "redirect_uri=https://yourapp.com/callback" \\
  --data-urlencode "client_id=app_01hx9k2m3n4p5q6r7s8t9u0v" \\
  --data-urlencode "code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"`,
        python: `import requests

org_id = "org_01hx9k2m3n4p5q6r7s8t9u0v"
app_id = "app_01hx9k2m3n4p5q6r7s8t9u0v"
url = f"https://api.sutraid.com/api/v1/sso/oidc-idp/{org_id}/{app_id}/token"

data = {
    "grant_type": "authorization_code",
    "code": "SplxlOBeZQQYbYS6WxSbIA",
    "redirect_uri": "https://yourapp.com/callback",
    "client_id": "app_01hx9k2m3n4p5q6r7s8t9u0v",
    "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
}

response = requests.post(url, data=data)
tokens = response.json()
print(tokens)`,
        nodejs: `const fetch = require('node-fetch');

const orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
const appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';
const url = \`https://api.sutraid.com/api/v1/sso/oidc-idp/\${orgId}/\${appId}/token\`;

const body = new URLSearchParams({
  grant_type: 'authorization_code',
  code: 'SplxlOBeZQQYbYS6WxSbIA',
  redirect_uri: 'https://yourapp.com/callback',
  client_id: 'app_01hx9k2m3n4p5q6r7s8t9u0v',
  code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
});

const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
});

const tokens = await response.json();
console.log(tokens);`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "org_01hx9k2m3n4p5q6r7s8t9u0v";
String appId = "app_01hx9k2m3n4p5q6r7s8t9u0v";
String body = "grant_type=authorization_code"
    + "&code=SplxlOBeZQQYbYS6WxSbIA"
    + "&redirect_uri=https%3A%2F%2Fyourapp.com%2Fcallback"
    + "&client_id=app_01hx9k2m3n4p5q6r7s8t9u0v"
    + "&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/sso/oidc-idp/" + orgId + "/" + appId + "/token"))
    .header("Content-Type", "application/x-www-form-urlencoded")
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
        go: `package main

import (
    "fmt"
    "io"
    "net/http"
    "net/url"
    "strings"
)

func main() {
    orgID := "org_01hx9k2m3n4p5q6r7s8t9u0v"
    appID := "app_01hx9k2m3n4p5q6r7s8t9u0v"
    endpoint := fmt.Sprintf("https://api.sutraid.com/api/v1/sso/oidc-idp/%s/%s/token", orgID, appID)

    formData := url.Values{
        "grant_type":    {"authorization_code"},
        "code":          {"SplxlOBeZQQYbYS6WxSbIA"},
        "redirect_uri":  {"https://yourapp.com/callback"},
        "client_id":     {"app_01hx9k2m3n4p5q6r7s8t9u0v"},
        "code_verifier": {"dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"},
    }

    resp, err := http.Post(endpoint, "application/x-www-form-urlencoded", strings.NewReader(formData.Encode()))
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php

$orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
$appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';
$url = "https://api.sutraid.com/api/v1/sso/oidc-idp/{$orgId}/{$appId}/token";

$data = http_build_query([
    'grant_type'    => 'authorization_code',
    'code'          => 'SplxlOBeZQQYbYS6WxSbIA',
    'redirect_uri'  => 'https://yourapp.com/callback',
    'client_id'     => 'app_01hx9k2m3n4p5q6r7s8t9u0v',
    'code_verifier' => 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
]);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
$response = curl_exec($ch);
curl_close($ch);

$tokens = json_decode($response, true);
print_r($tokens);`,
      },
    },
    {
      id: 'oidc-userinfo',
      method: 'GET',
      path: '/api/v1/sso/oidc-idp/:orgId/:appId/userinfo',
      title: 'UserInfo Endpoint',
      description:
        'Returns identity claims for the authenticated user. Requires a valid access token obtained from the token endpoint. Scope claims returned depend on the scopes granted during authorization.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the application.',
          example: 'app_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'Authorization',
          in: 'header',
          type: 'string',
          required: true,
          description: 'Bearer access token obtained from the token endpoint.',
          example: 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      ],
      responseFields: [
        { name: 'sub', type: 'string', description: 'Subject identifier — the unique user ID.', example: 'usr_01hx9k2m3n4p5q6r7s8t9u0v' },
        { name: 'email', type: 'string', description: 'User email address.', example: 'alice@example.com' },
        { name: 'name', type: 'string', description: 'Full display name.', example: 'Alice Smith' },
        { name: 'given_name', type: 'string', description: 'First/given name.', example: 'Alice' },
        { name: 'family_name', type: 'string', description: 'Last/family name.', example: 'Smith' },
        { name: 'email_verified', type: 'boolean', description: 'Whether the email address has been verified.', example: 'true' },
      ],
      responseSample: {
        sub: 'usr_01hx9k2m3n4p5q6r7s8t9u0v',
        email: 'alice@example.com',
        name: 'Alice Smith',
        given_name: 'Alice',
        family_name: 'Smith',
        email_verified: true,
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hx9k2m3n4p5q6r7s8t9u0v/app_01hx9k2m3n4p5q6r7s8t9u0v/userinfo" \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."`,
        python: `import requests

org_id = "org_01hx9k2m3n4p5q6r7s8t9u0v"
app_id = "app_01hx9k2m3n4p5q6r7s8t9u0v"
access_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

url = f"https://api.sutraid.com/api/v1/sso/oidc-idp/{org_id}/{app_id}/userinfo"
headers = {"Authorization": f"Bearer {access_token}"}

response = requests.get(url, headers=headers)
user_info = response.json()
print(user_info)`,
        nodejs: `const fetch = require('node-fetch');

const orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
const appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';
const accessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';

const response = await fetch(
  \`https://api.sutraid.com/api/v1/sso/oidc-idp/\${orgId}/\${appId}/userinfo\`,
  { headers: { Authorization: \`Bearer \${accessToken}\` } }
);

const userInfo = await response.json();
console.log(userInfo);`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "org_01hx9k2m3n4p5q6r7s8t9u0v";
String appId = "app_01hx9k2m3n4p5q6r7s8t9u0v";
String accessToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...";

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/sso/oidc-idp/" + orgId + "/" + appId + "/userinfo"))
    .header("Authorization", "Bearer " + accessToken)
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
    orgID := "org_01hx9k2m3n4p5q6r7s8t9u0v"
    appID := "app_01hx9k2m3n4p5q6r7s8t9u0v"
    accessToken := "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

    req, _ := http.NewRequest("GET",
        fmt.Sprintf("https://api.sutraid.com/api/v1/sso/oidc-idp/%s/%s/userinfo", orgID, appID),
        nil,
    )
    req.Header.Set("Authorization", "Bearer "+accessToken)

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php

$orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
$appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';
$accessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';

$ch = curl_init("https://api.sutraid.com/api/v1/sso/oidc-idp/{$orgId}/{$appId}/userinfo");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer {$accessToken}"]);
$response = curl_exec($ch);
curl_close($ch);

$userInfo = json_decode($response, true);
print_r($userInfo);`,
      },
    },
    {
      id: 'oidc-jwks',
      method: 'GET',
      path: '/api/v1/sso/oidc-idp/:orgId/:appId/jwks',
      title: 'JSON Web Key Set',
      description:
        'Returns the public keys used by SutraID to sign ID tokens and access tokens for the specified organization. Relying parties use this to verify JWT signatures.',
      auth: 'none',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the application.',
          example: 'app_01hx9k2m3n4p5q6r7s8t9u0v',
        },
      ],
      responseFields: [
        { name: 'keys', type: 'object[]', description: 'Array of JSON Web Keys.' },
        { name: 'keys[].kty', type: 'string', description: 'Key type (e.g., "RSA").', example: 'RSA' },
        { name: 'keys[].kid', type: 'string', description: 'Key identifier.', example: 'key_01hx9k2m3n4p5q6r7s8t9u0v' },
        { name: 'keys[].use', type: 'string', description: 'Intended use of the key ("sig" for signature).', example: 'sig' },
        { name: 'keys[].alg', type: 'string', description: 'Algorithm associated with the key.', example: 'RS256' },
        { name: 'keys[].n', type: 'string', description: 'RSA public key modulus (Base64URL-encoded).' },
        { name: 'keys[].e', type: 'string', description: 'RSA public key exponent (Base64URL-encoded).', example: 'AQAB' },
      ],
      responseSample: {
        keys: [
          {
            kty: 'RSA',
            kid: 'key_01hx9k2m3n4p5q6r7s8t9u0v',
            use: 'sig',
            alg: 'RS256',
            n: 'pjdss8ZaDfEH6K6U7GeW2nxDqR4IP049fk1fK0lndimbMMVBdPv_hSpm8T8EtBDxrUdi1OHZfMhUixGyw-g',
            e: 'AQAB',
          },
        ],
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hx9k2m3n4p5q6r7s8t9u0v/app_01hx9k2m3n4p5q6r7s8t9u0v/jwks"`,
        python: `import requests

org_id = "org_01hx9k2m3n4p5q6r7s8t9u0v"
app_id = "app_01hx9k2m3n4p5q6r7s8t9u0v"
url = f"https://api.sutraid.com/api/v1/sso/oidc-idp/{org_id}/{app_id}/jwks"

response = requests.get(url)
jwks = response.json()
print(jwks)`,
        nodejs: `const fetch = require('node-fetch');

const orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
const appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';

const response = await fetch(
  \`https://api.sutraid.com/api/v1/sso/oidc-idp/\${orgId}/\${appId}/jwks\`
);
const jwks = await response.json();
console.log(jwks);`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "org_01hx9k2m3n4p5q6r7s8t9u0v";
String appId = "app_01hx9k2m3n4p5q6r7s8t9u0v";
HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/sso/oidc-idp/" + orgId + "/" + appId + "/jwks"))
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
    orgID := "org_01hx9k2m3n4p5q6r7s8t9u0v"
    appID := "app_01hx9k2m3n4p5q6r7s8t9u0v"
    url := fmt.Sprintf("https://api.sutraid.com/api/v1/sso/oidc-idp/%s/%s/jwks", orgID, appID)

    resp, err := http.Get(url)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php

$orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
$appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';

$ch = curl_init("https://api.sutraid.com/api/v1/sso/oidc-idp/{$orgId}/{$appId}/jwks");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$jwks = json_decode($response, true);
print_r($jwks);`,
      },
    },
    {
      id: 'oidc-interaction-get',
      method: 'GET',
      path: '/api/v1/sso/oidc-idp/:orgId/:appId/interaction/:uid',
      title: 'Get Consent Interaction Details',
      description:
        'Retrieves details about a pending consent interaction, including the application requesting access and the scopes being requested. Used to render a consent screen to the user.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the application.',
          example: 'app_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'uid',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the interaction session.',
          example: 'int_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'Authorization',
          in: 'header',
          type: 'string',
          required: true,
          description: 'Bearer JWT token for the authenticated user.',
          example: 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      ],
      responseFields: [
        { name: 'uid', type: 'string', description: 'The interaction session identifier.', example: 'int_01hx9k2m3n4p5q6r7s8t9u0v' },
        { name: 'application.id', type: 'string', description: 'The requesting application ID.', example: 'app_01hx9k2m3n4p5q6r7s8t9u0v' },
        { name: 'application.name', type: 'string', description: 'Display name of the requesting application.', example: 'My SaaS App' },
        { name: 'application.description', type: 'string', description: 'Description of the requesting application.' },
        { name: 'application.logoUrl', type: 'string', description: 'URL to the application logo.' },
        { name: 'scopes', type: 'string[]', description: 'List of scopes being requested.', example: '["openid","email","profile"]' },
        { name: 'redirectUri', type: 'string', description: 'The URI to which the user will be redirected after consent.', example: 'https://yourapp.com/callback' },
      ],
      responseSample: {
        uid: 'int_01hx9k2m3n4p5q6r7s8t9u0v',
        application: {
          id: 'app_01hx9k2m3n4p5q6r7s8t9u0v',
          name: 'My SaaS App',
          description: 'A business productivity application.',
          logoUrl: 'https://yourapp.com/logo.png',
        },
        scopes: ['openid', 'email', 'profile'],
        redirectUri: 'https://yourapp.com/callback',
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hx9k2m3n4p5q6r7s8t9u0v/app_01hx9k2m3n4p5q6r7s8t9u0v/interaction/int_01hx9k2m3n4p5q6r7s8t9u0v" \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."`,
        python: `import requests

org_id = "org_01hx9k2m3n4p5q6r7s8t9u0v"
app_id = "app_01hx9k2m3n4p5q6r7s8t9u0v"
uid = "int_01hx9k2m3n4p5q6r7s8t9u0v"
token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

url = f"https://api.sutraid.com/api/v1/sso/oidc-idp/{org_id}/{app_id}/interaction/{uid}"
headers = {"Authorization": f"Bearer {token}"}

response = requests.get(url, headers=headers)
interaction = response.json()
print(interaction)`,
        nodejs: `const fetch = require('node-fetch');

const orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
const appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';
const uid = 'int_01hx9k2m3n4p5q6r7s8t9u0v';
const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';

const response = await fetch(
  \`https://api.sutraid.com/api/v1/sso/oidc-idp/\${orgId}/\${appId}/interaction/\${uid}\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

const interaction = await response.json();
console.log(interaction);`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "org_01hx9k2m3n4p5q6r7s8t9u0v";
String appId = "app_01hx9k2m3n4p5q6r7s8t9u0v";
String uid = "int_01hx9k2m3n4p5q6r7s8t9u0v";
String token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...";

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/sso/oidc-idp/" + orgId + "/" + appId + "/interaction/" + uid))
    .header("Authorization", "Bearer " + token)
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
    orgID := "org_01hx9k2m3n4p5q6r7s8t9u0v"
    appID := "app_01hx9k2m3n4p5q6r7s8t9u0v"
    uid := "int_01hx9k2m3n4p5q6r7s8t9u0v"
    token := "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

    req, _ := http.NewRequest("GET",
        fmt.Sprintf("https://api.sutraid.com/api/v1/sso/oidc-idp/%s/%s/interaction/%s", orgID, appID, uid),
        nil,
    )
    req.Header.Set("Authorization", "Bearer "+token)

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
        php: `<?php

$orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
$appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';
$uid = 'int_01hx9k2m3n4p5q6r7s8t9u0v';
$token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';

$ch = curl_init("https://api.sutraid.com/api/v1/sso/oidc-idp/{$orgId}/{$appId}/interaction/{$uid}");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer {$token}"]);
$response = curl_exec($ch);
curl_close($ch);

$interaction = json_decode($response, true);
print_r($interaction);`,
      },
    },
    {
      id: 'oidc-interaction-confirm',
      method: 'POST',
      path: '/api/v1/sso/oidc-idp/:orgId/:appId/interaction/:uid/confirm',
      title: 'Confirm Consent',
      description:
        'Submits the user\'s consent decision for a pending OIDC interaction. When consent is true, the authorization code flow completes and the user is redirected to the client application.',
      auth: 'bearer',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the application.',
          example: 'app_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'uid',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the interaction session.',
          example: 'int_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'Authorization',
          in: 'header',
          type: 'string',
          required: true,
          description: 'Bearer JWT token for the authenticated user.',
          example: 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      ],
      requestBody: [
        {
          name: 'consent',
          in: 'body',
          type: 'boolean',
          required: true,
          description: 'true to grant consent, false to deny.',
          example: 'true',
        },
      ],
      responseFields: [
        { name: 'success', type: 'boolean', description: 'Whether consent was processed successfully.', example: 'true' },
        { name: 'redirectTo', type: 'string', description: 'The URL the client application should redirect the user to.', example: 'https://yourapp.com/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=xK9mP2qR5tU8wZ1aB4cD7eF0' },
      ],
      responseSample: {
        success: true,
        redirectTo: 'https://yourapp.com/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=xK9mP2qR5tU8wZ1aB4cD7eF0',
      },
      codeSamples: {
        curl: `curl -X POST "https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hx9k2m3n4p5q6r7s8t9u0v/app_01hx9k2m3n4p5q6r7s8t9u0v/interaction/int_01hx9k2m3n4p5q6r7s8t9u0v/confirm" \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -H "Content-Type: application/json" \\
  -d '{"consent": true}'`,
        python: `import requests

org_id = "org_01hx9k2m3n4p5q6r7s8t9u0v"
app_id = "app_01hx9k2m3n4p5q6r7s8t9u0v"
uid = "int_01hx9k2m3n4p5q6r7s8t9u0v"
token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

url = f"https://api.sutraid.com/api/v1/sso/oidc-idp/{org_id}/{app_id}/interaction/{uid}/confirm"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
}

response = requests.post(url, headers=headers, json={"consent": True})
result = response.json()
print(result)`,
        nodejs: `const fetch = require('node-fetch');

const orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
const appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';
const uid = 'int_01hx9k2m3n4p5q6r7s8t9u0v';
const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';

const response = await fetch(
  \`https://api.sutraid.com/api/v1/sso/oidc-idp/\${orgId}/\${appId}/interaction/\${uid}/confirm\`,
  {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ consent: true }),
  }
);

const result = await response.json();
console.log(result);`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "org_01hx9k2m3n4p5q6r7s8t9u0v";
String appId = "app_01hx9k2m3n4p5q6r7s8t9u0v";
String uid = "int_01hx9k2m3n4p5q6r7s8t9u0v";
String token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...";

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/sso/oidc-idp/" + orgId + "/" + appId + "/interaction/" + uid + "/confirm"))
    .header("Authorization", "Bearer " + token)
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString("{\\"consent\\": true}"))
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
    orgID := "org_01hx9k2m3n4p5q6r7s8t9u0v"
    appID := "app_01hx9k2m3n4p5q6r7s8t9u0v"
    uid := "int_01hx9k2m3n4p5q6r7s8t9u0v"
    token := "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

    body := strings.NewReader(\`{"consent": true}\`)
    req, _ := http.NewRequest("POST",
        fmt.Sprintf("https://api.sutraid.com/api/v1/sso/oidc-idp/%s/%s/interaction/%s/confirm", orgID, appID, uid),
        body,
    )
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    respBody, _ := io.ReadAll(resp.Body)
    fmt.Println(string(respBody))
}`,
        php: `<?php

$orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
$appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';
$uid = 'int_01hx9k2m3n4p5q6r7s8t9u0v';
$token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';

$ch = curl_init("https://api.sutraid.com/api/v1/sso/oidc-idp/{$orgId}/{$appId}/interaction/{$uid}/confirm");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['consent' => true]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer {$token}",
    'Content-Type: application/json',
]);
$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
print_r($result);`,
      },
    },
    {
      id: 'oidc-end-session',
      method: 'GET',
      path: '/api/v1/sso/oidc-idp/:orgId/:appId/end-session',
      title: 'End Session (Logout)',
      description:
        'Ends the user\'s SSO session at the SutraID IdP and optionally redirects to a post-logout URI. Implements the OpenID Connect RP-Initiated Logout specification.',
      auth: 'none',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the application.',
          example: 'app_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'id_token_hint',
          in: 'query',
          type: 'string',
          required: false,
          description: 'Previously issued ID token, used to identify the user being logged out.',
          example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        {
          name: 'post_logout_redirect_uri',
          in: 'query',
          type: 'string',
          required: false,
          description: 'URI to redirect the user to after logout. Must be registered with the client.',
          example: 'https://yourapp.com/logged-out',
        },
        {
          name: 'state',
          in: 'query',
          type: 'string',
          required: false,
          description: 'Opaque value passed back to the client in the post_logout_redirect_uri.',
          example: 'xK9mP2qR5tU8wZ1aB4cD7eF0',
        },
      ],
      responseFields: [
        { name: '302 Location', type: 'string', description: 'HTTP 302 redirect to post_logout_redirect_uri (with state if provided), or to the SutraID default logged-out page.' },
      ],
      responseSample: {
        _note: 'HTTP 302 redirect — no JSON body. User is redirected to post_logout_redirect_uri?state=STATE or the default logout page.',
      },
      codeSamples: {
        curl: `curl -v -L "https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hx9k2m3n4p5q6r7s8t9u0v/app_01hx9k2m3n4p5q6r7s8t9u0v/end-session?id_token_hint=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...&post_logout_redirect_uri=https%3A%2F%2Fyourapp.com%2Flogged-out&state=xK9mP2qR5tU8wZ1aB4cD7eF0"`,
        python: `import urllib.parse

org_id = "org_01hx9k2m3n4p5q6r7s8t9u0v"
app_id = "app_01hx9k2m3n4p5q6r7s8t9u0v"

params = {
    "id_token_hint": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "post_logout_redirect_uri": "https://yourapp.com/logged-out",
    "state": "xK9mP2qR5tU8wZ1aB4cD7eF0",
}

logout_url = f"https://api.sutraid.com/api/v1/sso/oidc-idp/{org_id}/{app_id}/end-session?" + urllib.parse.urlencode(params)
print("Redirect user to:", logout_url)`,
        nodejs: `const orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
const appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';

const params = new URLSearchParams({
  id_token_hint: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  post_logout_redirect_uri: 'https://yourapp.com/logged-out',
  state: 'xK9mP2qR5tU8wZ1aB4cD7eF0',
});

const logoutUrl = \`https://api.sutraid.com/api/v1/sso/oidc-idp/\${orgId}/\${appId}/end-session?\${params}\`;
console.log('Redirect user to:', logoutUrl);
// In an Express app: res.redirect(logoutUrl)`,
        java: `import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

String orgId = "org_01hx9k2m3n4p5q6r7s8t9u0v";
String appId = "app_01hx9k2m3n4p5q6r7s8t9u0v";

String logoutUrl = "https://api.sutraid.com/api/v1/sso/oidc-idp/" + orgId + "/" + appId + "/end-session?"
    + "id_token_hint=" + URLEncoder.encode("eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...", StandardCharsets.UTF_8)
    + "&post_logout_redirect_uri=" + URLEncoder.encode("https://yourapp.com/logged-out", StandardCharsets.UTF_8)
    + "&state=xK9mP2qR5tU8wZ1aB4cD7eF0";

System.out.println("Redirect user to: " + logoutUrl);
// In a servlet: response.sendRedirect(logoutUrl)`,
        go: `package main

import (
    "fmt"
    "net/url"
)

func main() {
    orgID := "org_01hx9k2m3n4p5q6r7s8t9u0v"
    appID := "app_01hx9k2m3n4p5q6r7s8t9u0v"

    params := url.Values{
        "id_token_hint":            {"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."},
        "post_logout_redirect_uri": {"https://yourapp.com/logged-out"},
        "state":                    {"xK9mP2qR5tU8wZ1aB4cD7eF0"},
    }

    logoutURL := fmt.Sprintf(
        "https://api.sutraid.com/api/v1/sso/oidc-idp/%s/%s/end-session?%s",
        orgID, appID, params.Encode(),
    )
    fmt.Println("Redirect user to:", logoutURL)
    // http.Redirect(w, r, logoutURL, http.StatusFound)
}`,
        php: `<?php

$orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
$appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';

$params = http_build_query([
    'id_token_hint'            => 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    'post_logout_redirect_uri' => 'https://yourapp.com/logged-out',
    'state'                    => 'xK9mP2qR5tU8wZ1aB4cD7eF0',
]);

$logoutUrl = "https://api.sutraid.com/api/v1/sso/oidc-idp/{$orgId}/{$appId}/end-session?{$params}";
header("Location: {$logoutUrl}");
exit;`,
      },
    },
    {
      id: 'oidc-catch-all',
      method: 'GET',
      path: '/api/v1/sso/oidc-idp/:orgId/:appId/*',
      title: 'OIDC Provider Catch-All',
      description:
        'Wildcard route that forwards any unmatched requests to the underlying oidc-provider library. This handles additional protocol interactions such as device authorization, pushed authorization requests, and other oidc-provider internal routes.',
      auth: 'none',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the organization.',
          example: 'org_01hx9k2m3n4p5q6r7s8t9u0v',
        },
        {
          name: 'appId',
          in: 'path',
          type: 'string',
          required: true,
          description: 'The unique identifier of the application.',
          example: 'app_01hx9k2m3n4p5q6r7s8t9u0v',
        },
      ],
      responseFields: [
        { name: 'varies', type: 'any', description: 'Response format depends on the specific oidc-provider route being accessed.' },
      ],
      responseSample: {
        _note: 'Response varies by route. This catch-all proxies to the oidc-provider library for any path under /api/v1/sso/oidc-idp/:orgId/:appId/ not covered by a dedicated endpoint.',
      },
      codeSamples: {
        curl: `# Example: access the oidc-provider check_session iframe endpoint
curl -X GET "https://api.sutraid.com/api/v1/sso/oidc-idp/org_01hx9k2m3n4p5q6r7s8t9u0v/app_01hx9k2m3n4p5q6r7s8t9u0v/session/check"`,
        python: `import requests

org_id = "org_01hx9k2m3n4p5q6r7s8t9u0v"
app_id = "app_01hx9k2m3n4p5q6r7s8t9u0v"
# Any path under the org's OIDC provider base URL
url = f"https://api.sutraid.com/api/v1/sso/oidc-idp/{org_id}/{app_id}/session/check"

response = requests.get(url)
print(response.status_code, response.text)`,
        nodejs: `const fetch = require('node-fetch');

const orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
const appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';
// Any path under the org's OIDC provider base URL
const response = await fetch(
  \`https://api.sutraid.com/api/v1/sso/oidc-idp/\${orgId}/\${appId}/session/check\`
);
console.log(response.status, await response.text());`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "org_01hx9k2m3n4p5q6r7s8t9u0v";
String appId = "app_01hx9k2m3n4p5q6r7s8t9u0v";
// Any path under the org's OIDC provider base URL
HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.sutraid.com/api/v1/sso/oidc-idp/" + orgId + "/" + appId + "/session/check"))
    .GET()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.statusCode() + " " + response.body());`,
        go: `package main

import (
    "fmt"
    "io"
    "net/http"
)

func main() {
    orgID := "org_01hx9k2m3n4p5q6r7s8t9u0v"
    appID := "app_01hx9k2m3n4p5q6r7s8t9u0v"
    // Any path under the org's OIDC provider base URL
    url := fmt.Sprintf("https://api.sutraid.com/api/v1/sso/oidc-idp/%s/%s/session/check", orgID, appID)

    resp, err := http.Get(url)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(resp.StatusCode, string(body))
}`,
        php: `<?php

$orgId = 'org_01hx9k2m3n4p5q6r7s8t9u0v';
$appId = 'app_01hx9k2m3n4p5q6r7s8t9u0v';
// Any path under the org's OIDC provider base URL
$ch = curl_init("https://api.sutraid.com/api/v1/sso/oidc-idp/{$orgId}/{$appId}/session/check");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo $httpCode . ": " . $response;`,
      },
    },
  ],
};
