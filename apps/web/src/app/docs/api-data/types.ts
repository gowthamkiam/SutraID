export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'body';
  type: string;
  required: boolean;
  description: string;
  example?: string;
  enum?: string[];
}

export interface ResponseField {
  name: string;
  type: string;
  description: string;
  example?: string;
}

export interface CodeSample {
  curl: string;
  python: string;
  nodejs: string;
  java: string;
  go: string;
  php: string;
}

export interface EndpointDefinition {
  id: string;
  method: HttpMethod;
  path: string;
  title: string;
  description: string;
  auth: 'none' | 'bearer' | 'basic' | 'scim-token';
  parameters?: Parameter[];
  requestBody?: Parameter[];
  responseFields?: ResponseField[];
  responseSample: Record<string, unknown>;
  codeSamples: CodeSample;
}

export interface DocSection {
  title: string;
  slug: string;
  description: string;
  endpoints: EndpointDefinition[];
}

export interface NavItem {
  label: string;
  href?: string;
  children?: NavItem[];
}
