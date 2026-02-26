#!/usr/bin/env node

import { Command } from 'commander';
import { SutraIdAgentClient } from './agent-client';
import { config, validateConfig } from './config';

const program = new Command();

program
  .name('sutraid-agent')
  .description('SutraID AI Agent Demo CLI')
  .version('1.0.0');

program
  .command('login')
  .description('Get access token using client credentials')
  .action(async () => {
    validateConfig();
    const client = new SutraIdAgentClient(
      config.baseUrl,
      config.clientId,
      config.clientSecret,
    );

    console.log('Getting access token...');
    const tokenResponse = await client.getAccessToken();
    console.log('\n✓ Success!\n');
    console.log('Access Token:', tokenResponse.access_token);
    console.log('Token Type:', tokenResponse.token_type);
    console.log('Expires In:', tokenResponse.expires_in, 'seconds');
    console.log('Scope:', tokenResponse.scope);
    console.log('\nSave this token and use it in subsequent commands with --token flag');
  });

program
  .command('identity')
  .description('Get agent identity')
  .requiredOption('-t, --token <token>', 'Access token')
  .action(async (options) => {
    validateConfig();
    const client = new SutraIdAgentClient(
      config.baseUrl,
      config.clientId,
      config.clientSecret,
    );

    console.log('Fetching agent identity...');
    const identity = await client.getIdentity(options.token);
    console.log('\n✓ Agent Identity:\n');
    console.log(JSON.stringify(identity, null, 2));
  });

program
  .command('execute')
  .description('Execute a tool')
  .requiredOption('-t, --token <token>', 'Access token')
  .requiredOption('--tool <name>', 'Tool name (e.g., calculator, echo)')
  .requiredOption('--params <json>', 'Tool parameters as JSON string')
  .action(async (options) => {
    validateConfig();
    const client = new SutraIdAgentClient(
      config.baseUrl,
      config.clientId,
      config.clientSecret,
    );

    let params;
    try {
      params = JSON.parse(options.params);
    } catch (e) {
      console.error('Error: Invalid JSON in --params');
      process.exit(1);
    }

    console.log(`Executing tool: ${options.tool}...`);
    const result = await client.executeTool(options.token, options.tool, params);
    console.log('\n✓ Tool Execution Result:\n');
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command('introspect')
  .description('Introspect access token')
  .requiredOption('-t, --token <token>', 'Access token')
  .action(async (options) => {
    validateConfig();
    const client = new SutraIdAgentClient(
      config.baseUrl,
      config.clientId,
      config.clientSecret,
    );

    console.log('Introspecting token...');
    const result = await client.introspectToken(options.token);
    console.log('\n✓ Token Introspection Result:\n');
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command('revoke')
  .description('Revoke access token')
  .requiredOption('-t, --token <token>', 'Access token')
  .action(async (options) => {
    validateConfig();
    const client = new SutraIdAgentClient(
      config.baseUrl,
      config.clientId,
      config.clientSecret,
    );

    console.log('Revoking token...');
    await client.revokeToken(options.token);
    console.log('\n✓ Token revoked successfully');
  });

program
  .command('validate')
  .description('Validate access token using JWKS')
  .requiredOption('-t, --token <token>', 'Access token')
  .action(async (options) => {
    validateConfig();
    const client = new SutraIdAgentClient(
      config.baseUrl,
      config.clientId,
      config.clientSecret,
    );

    console.log('Validating token against JWKS...');
    const isValid = await client.validateToken(options.token);
    console.log('\nToken valid:', isValid ? '✓ Yes' : '✗ No');
  });

program
  .command('demo')
  .description('Run full demo workflow')
  .action(async () => {
    validateConfig();
    const client = new SutraIdAgentClient(
      config.baseUrl,
      config.clientId,
      config.clientSecret,
    );

    console.log('='.repeat(60));
    console.log('SutraID AI Agent Demo - Full Workflow');
    console.log('='.repeat(60));

    console.log('\n1. Getting access token...');
    const tokenResponse = await client.getAccessToken();
    console.log('   ✓ Got token (expires in', tokenResponse.expires_in, 'seconds)');

    const token = tokenResponse.access_token;

    console.log('\n2. Getting agent identity...');
    const identity = await client.getIdentity(token);
    console.log('   ✓ Agent ID:', identity.agent_id);
    console.log('   ✓ Organization ID:', identity.organization_id);
    console.log('   ✓ Scopes:', identity.scopes.join(', '));

    console.log('\n3. Executing calculator tool...');
    const calcResult = await client.executeTool(token, 'calculator', {
      op: 'add',
      a: 42,
      b: 13,
    });
    console.log('   ✓ Result:', calcResult.result.result);

    console.log('\n4. Introspecting token...');
    const introspection = await client.introspectToken(token);
    console.log('   ✓ Token active:', introspection.active);
    console.log('   ✓ Expires at:', new Date((introspection.exp || 0) * 1000).toISOString());

    console.log('\n5. Validating token with JWKS...');
    await client.validateToken(token);

    console.log('\n6. Revoking token...');
    await client.revokeToken(token);
    console.log('   ✓ Token revoked');

    console.log('\n' + '='.repeat(60));
    console.log('Demo completed successfully!');
    console.log('='.repeat(60));
  });

program.parse();
