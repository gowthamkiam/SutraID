import { DocSection } from './types';

export const samlProviderSection: DocSection = {
  title: 'SAML Identity Provider',
  slug: 'saml-provider',
  description: 'SAML 2.0 Identity Provider endpoints — SutraID acts as the IdP, issuing signed assertions to external Service Providers via HTTP-Redirect and HTTP-POST bindings.',
  endpoints: [
    {
      id: 'get-saml-idp-metadata',
      method: 'GET',
      path: '/api/v1/sso/saml-idp/:orgId/metadata',
      title: 'Get SAML IdP metadata',
      description: 'Returns the SAML 2.0 IdP metadata XML document for the organization. Service Providers use this to configure trust with SutraID as the Identity Provider. The response includes the IdP entity ID, SSO service bindings (HTTP-Redirect and HTTP-POST), the X.509 signing certificate, and supported NameID formats.',
      auth: 'none',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the organization whose IdP metadata to retrieve.',
          example: 'org_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      responseFields: [
        { name: 'EntityDescriptor', type: 'XML element', description: 'Root element containing the IdP metadata.' },
        { name: 'EntityDescriptor.entityID', type: 'string', description: 'Unique identifier (URI) of the Identity Provider.' },
        { name: 'IDPSSODescriptor', type: 'XML element', description: 'Describes the IdP SSO capabilities and protocol support.' },
        { name: 'KeyDescriptor', type: 'XML element', description: 'Contains the X.509 certificate used for signing SAML assertions.' },
        { name: 'NameIDFormat', type: 'string', description: 'Supported NameID format (e.g. emailAddress).' },
        { name: 'SingleSignOnService', type: 'XML element', description: 'SSO endpoint location and binding (HTTP-Redirect and HTTP-POST).' },
      ],
      responseSample: {
        _note: 'Response is XML (application/samlmetadata+xml)',
        _xml: `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="https://api.sutraid.com/api/v1/sso/saml-idp/org_01hx9z1q2w3e4r5t6y7u/metadata">
  <IDPSSODescriptor
    WantAuthnRequestsSigned="false"
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>MIIC...base64-encoded-certificate...</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </KeyDescriptor>
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <SingleSignOnService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
      Location="https://api.sutraid.com/api/v1/sso/saml-idp/org_01hx9z1q2w3e4r5t6y7u/sso"/>
    <SingleSignOnService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="https://api.sutraid.com/api/v1/sso/saml-idp/org_01hx9z1q2w3e4r5t6y7u/sso"/>
  </IDPSSODescriptor>
</EntityDescriptor>`,
      },
      codeSamples: {
        curl: `curl -X GET "https://api.sutraid.com/api/v1/sso/saml-idp/org_01hx9z1q2w3e4r5t6y7u/metadata"`,

        python: `import requests

org_id = "org_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/sso/saml-idp/{org_id}/metadata"

response = requests.get(url)
print(response.text)  # XML metadata`,

        nodejs: `const axios = require('axios');

const orgId = 'org_01hx9z1q2w3e4r5t6y7u';

const response = await axios.get(
  \`https://api.sutraid.com/api/v1/sso/saml-idp/\${orgId}/metadata\`
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
        "https://api.sutraid.com/api/v1/sso/saml-idp/" + orgId + "/metadata"
    ))
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
    url := "https://api.sutraid.com/api/v1/sso/saml-idp/" + orgID + "/metadata"

    resp, _ := http.Get(url)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgId = 'org_01hx9z1q2w3e4r5t6y7u';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/sso/saml-idp/{$orgId}/metadata",
    CURLOPT_RETURNTRANSFER => true,
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },

    {
      id: 'saml-idp-sso-redirect',
      method: 'GET',
      path: '/api/v1/sso/saml-idp/:orgId/sso',
      title: 'SSO endpoint (HTTP-Redirect binding)',
      description: 'Handles SP-initiated SAML SSO via the HTTP-Redirect binding. The Service Provider redirects the user to this endpoint with a deflated, base64-encoded SAMLRequest in the query string. If the user has an active session, SutraID validates the AuthnRequest, verifies user access to the requesting application, and returns an auto-submitting HTML form that POSTs a signed SAML Response to the SP Assertion Consumer Service URL. If the user is not authenticated, they are redirected to the SutraID login page and returned here after authentication.',
      auth: 'none',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the organization acting as the Identity Provider.',
          example: 'org_01hx9z1q2w3e4r5t6y7u',
        },
        {
          name: 'SAMLRequest',
          in: 'query',
          type: 'string',
          required: true,
          description: 'Deflated, base64-encoded SAML AuthnRequest XML generated by the Service Provider.',
          example: 'fZJNT8MwDIb...deflated-base64-encoded...',
        },
        {
          name: 'RelayState',
          in: 'query',
          type: 'string',
          required: false,
          description: 'Opaque value relayed back to the Service Provider with the SAML Response. Typically the URL the user originally requested at the SP.',
          example: 'https://sp.example.com/dashboard',
        },
      ],
      responseFields: [
        { name: 'HTML form', type: 'text/html', description: 'Auto-submitting HTML form that POSTs the SAMLResponse and RelayState to the SP ACS URL.' },
        { name: 'SAMLResponse', type: 'string (hidden input)', description: 'Base64-encoded, signed SAML Response containing the assertion with user attributes.' },
        { name: 'RelayState', type: 'string (hidden input)', description: 'The RelayState value passed through from the original request (if provided).' },
      ],
      responseSample: {
        _note: 'Response is an auto-submitting HTML form (text/html)',
        _html: `<!DOCTYPE html>
<html>
<head>
  <title>SAML Response</title>
</head>
<body onload="document.forms[0].submit()">
  <form method="post" action="https://sp.example.com/acs">
    <input type="hidden" name="SAMLResponse" value="PHNhbWxwOlJlc3BvbnNl...base64-encoded..." />
    <input type="hidden" name="RelayState" value="https://sp.example.com/dashboard" />
    <noscript>
      <button type="submit">Continue</button>
    </noscript>
  </form>
</body>
</html>`,
      },
      codeSamples: {
        curl: `# SP-initiated flow — typically triggered by the browser, not curl.
# This example shows the raw request structure.
curl -G "https://api.sutraid.com/api/v1/sso/saml-idp/org_01hx9z1q2w3e4r5t6y7u/sso" \\
  --data-urlencode "SAMLRequest=fZJNT8MwDIb...deflated-base64..." \\
  --data-urlencode "RelayState=https://sp.example.com/dashboard"`,

        python: `import requests
import urllib.parse

org_id = "org_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/sso/saml-idp/{org_id}/sso"
params = {
    "SAMLRequest": "fZJNT8MwDIb...deflated-base64...",
    "RelayState": "https://sp.example.com/dashboard",
}

# Note: In production this is a browser redirect, not a direct API call.
# The user's session cookie is required for authentication.
response = requests.get(url, params=params, allow_redirects=False)
print(response.status_code)
print(response.text)`,

        nodejs: `const axios = require('axios');

const orgId = 'org_01hx9z1q2w3e4r5t6y7u';

// Note: In production this is a browser redirect, not a direct API call.
// The user's session cookie is required for authentication.
const response = await axios.get(
  \`https://api.sutraid.com/api/v1/sso/saml-idp/\${orgId}/sso\`,
  {
    params: {
      SAMLRequest: 'fZJNT8MwDIb...deflated-base64...',
      RelayState: 'https://sp.example.com/dashboard',
    },
    maxRedirects: 0,
    validateStatus: (status) => status < 400,
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

String orgId = "org_01hx9z1q2w3e4r5t6y7u";
String samlRequest = URLEncoder.encode("fZJNT8MwDIb...deflated-base64...", StandardCharsets.UTF_8);
String relayState = URLEncoder.encode("https://sp.example.com/dashboard", StandardCharsets.UTF_8);

// Note: In production this is a browser redirect, not a direct API call.
HttpClient client = HttpClient.newBuilder()
    .followRedirects(HttpClient.Redirect.NEVER)
    .build();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/api/v1/sso/saml-idp/" + orgId +
        "/sso?SAMLRequest=" + samlRequest + "&RelayState=" + relayState
    ))
    .GET()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,

        go: `package main

import (
    "fmt"
    "io"
    "net/http"
    "net/url"
)

func main() {
    orgID := "org_01hx9z1q2w3e4r5t6y7u"
    base := "https://api.sutraid.com/api/v1/sso/saml-idp/" + orgID + "/sso"

    params := url.Values{}
    params.Set("SAMLRequest", "fZJNT8MwDIb...deflated-base64...")
    params.Set("RelayState", "https://sp.example.com/dashboard")

    // Note: In production this is a browser redirect, not a direct API call.
    client := &http.Client{
        CheckRedirect: func(req *http.Request, via []*http.Request) error {
            return http.ErrUseLastResponse
        },
    }

    resp, _ := client.Get(base + "?" + params.Encode())
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgId = 'org_01hx9z1q2w3e4r5t6y7u';
$samlRequest = urlencode('fZJNT8MwDIb...deflated-base64...');
$relayState = urlencode('https://sp.example.com/dashboard');

// Note: In production this is a browser redirect, not a direct API call.
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/sso/saml-idp/{$orgId}/sso?SAMLRequest={$samlRequest}&RelayState={$relayState}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },

    {
      id: 'saml-idp-sso-post',
      method: 'POST',
      path: '/api/v1/sso/saml-idp/:orgId/sso',
      title: 'SSO endpoint (HTTP-POST binding)',
      description: 'Handles SP-initiated SAML SSO via the HTTP-POST binding. The Service Provider submits a base64-encoded SAMLRequest in the POST body. If the user has an active session, SutraID validates the AuthnRequest, verifies user access to the requesting application, and returns an auto-submitting HTML form that POSTs a signed SAML Response to the SP Assertion Consumer Service URL. If the user is not authenticated, they are redirected to the SutraID login page and returned here after authentication.',
      auth: 'none',
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          type: 'string (UUID)',
          required: true,
          description: 'Unique identifier of the organization acting as the Identity Provider.',
          example: 'org_01hx9z1q2w3e4r5t6y7u',
        },
      ],
      requestBody: [
        {
          name: 'SAMLRequest',
          in: 'body',
          type: 'string',
          required: true,
          description: 'Base64-encoded SAML AuthnRequest XML generated by the Service Provider.',
          example: 'PHNhbWxwOkF1dGhuUmVxdWVzdC...base64-encoded...',
        },
        {
          name: 'RelayState',
          in: 'body',
          type: 'string',
          required: false,
          description: 'Opaque value relayed back to the Service Provider with the SAML Response. Typically the URL the user originally requested at the SP.',
          example: 'https://sp.example.com/dashboard',
        },
      ],
      responseFields: [
        { name: 'HTML form', type: 'text/html', description: 'Auto-submitting HTML form that POSTs the SAMLResponse and RelayState to the SP ACS URL.' },
        { name: 'SAMLResponse', type: 'string (hidden input)', description: 'Base64-encoded, signed SAML Response containing the assertion with user attributes.' },
        { name: 'RelayState', type: 'string (hidden input)', description: 'The RelayState value passed through from the original request (if provided).' },
      ],
      responseSample: {
        _note: 'Response is an auto-submitting HTML form (text/html)',
        _html: `<!DOCTYPE html>
<html>
<head>
  <title>SAML Response</title>
</head>
<body onload="document.forms[0].submit()">
  <form method="post" action="https://sp.example.com/acs">
    <input type="hidden" name="SAMLResponse" value="PHNhbWxwOlJlc3BvbnNl...base64-encoded..." />
    <input type="hidden" name="RelayState" value="https://sp.example.com/dashboard" />
    <noscript>
      <button type="submit">Continue</button>
    </noscript>
  </form>
</body>
</html>`,
      },
      codeSamples: {
        curl: `# SP-initiated flow — typically triggered by the browser, not curl.
# This example shows the raw request structure.
curl -X POST "https://api.sutraid.com/api/v1/sso/saml-idp/org_01hx9z1q2w3e4r5t6y7u/sso" \\
  -d "SAMLRequest=PHNhbWxwOkF1dGhuUmVxdWVzdC...base64-encoded..." \\
  -d "RelayState=https://sp.example.com/dashboard"`,

        python: `import requests

org_id = "org_01hx9z1q2w3e4r5t6y7u"
url = f"https://api.sutraid.com/api/v1/sso/saml-idp/{org_id}/sso"
data = {
    "SAMLRequest": "PHNhbWxwOkF1dGhuUmVxdWVzdC...base64-encoded...",
    "RelayState": "https://sp.example.com/dashboard",
}

# Note: In production this is a browser form submission, not a direct API call.
# The user's session cookie is required for authentication.
response = requests.post(url, data=data, allow_redirects=False)
print(response.status_code)
print(response.text)`,

        nodejs: `const axios = require('axios');

const orgId = 'org_01hx9z1q2w3e4r5t6y7u';

// Note: In production this is a browser form submission, not a direct API call.
// The user's session cookie is required for authentication.
const response = await axios.post(
  \`https://api.sutraid.com/api/v1/sso/saml-idp/\${orgId}/sso\`,
  new URLSearchParams({
    SAMLRequest: 'PHNhbWxwOkF1dGhuUmVxdWVzdC...base64-encoded...',
    RelayState: 'https://sp.example.com/dashboard',
  }),
  {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    maxRedirects: 0,
    validateStatus: (status) => status < 400,
  }
);

console.log(response.data);`,

        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String orgId = "org_01hx9z1q2w3e4r5t6y7u";

// Note: In production this is a browser form submission, not a direct API call.
HttpClient client = HttpClient.newBuilder()
    .followRedirects(HttpClient.Redirect.NEVER)
    .build();

String body = "SAMLRequest=PHNhbWxwOkF1dGhuUmVxdWVzdC...base64-encoded..."
    + "&RelayState=https://sp.example.com/dashboard";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(
        "https://api.sutraid.com/api/v1/sso/saml-idp/" + orgId + "/sso"
    ))
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
    orgID := "org_01hx9z1q2w3e4r5t6y7u"
    endpoint := "https://api.sutraid.com/api/v1/sso/saml-idp/" + orgID + "/sso"

    data := url.Values{}
    data.Set("SAMLRequest", "PHNhbWxwOkF1dGhuUmVxdWVzdC...base64-encoded...")
    data.Set("RelayState", "https://sp.example.com/dashboard")

    // Note: In production this is a browser form submission, not a direct API call.
    client := &http.Client{
        CheckRedirect: func(req *http.Request, via []*http.Request) error {
            return http.ErrUseLastResponse
        },
    }

    resp, _ := client.Post(endpoint, "application/x-www-form-urlencoded", strings.NewReader(data.Encode()))
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,

        php: `<?php
$orgId = 'org_01hx9z1q2w3e4r5t6y7u';

// Note: In production this is a browser form submission, not a direct API call.
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.sutraid.com/api/v1/sso/saml-idp/{$orgId}/sso",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_POSTFIELDS => http_build_query([
        'SAMLRequest' => 'PHNhbWxwOkF1dGhuUmVxdWVzdC...base64-encoded...',
        'RelayState' => 'https://sp.example.com/dashboard',
    ]),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/x-www-form-urlencoded',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
      },
    },
  ],
};
