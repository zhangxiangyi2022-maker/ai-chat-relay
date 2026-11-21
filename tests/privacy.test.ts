import { describe, expect, it } from 'vitest';
import { formatConversationMarkdownWithStats } from '../src/core/exporter.js';
import { buildHandoffPayload } from '../src/core/handoff.js';
import { computeUrlFingerprint, redactSensitiveText } from '../src/core/privacy.js';
import { loadActiveHandoff } from '../src/storage/bridge.js';
import { MemoryStorageBridge } from '../src/storage/memoryBridge.js';

describe('privacy & secret redaction', () => {
  it('redacts API keys, JWTs, DB passwords, and PEM private keys while preserving normal code', () => {
    const sample = [
      'Use v1.2.3 on http://127.0.0.1:3000/api',
      'OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz123456',
      'DB_URL=postgres://admin:SuperSecretPass99@db.internal:5432/prod',
      'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYifQ.signature12345',
      '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQE...\n-----END RSA PRIVATE KEY-----',
    ].join('\n');

    const res = redactSensitiveText(sample, { redactSecrets: true, redactPii: true });
    expect(res.redactedCount).toBeGreaterThanOrEqual(4);
    expect(res.text).toContain('v1.2.3');
    expect(res.text).toContain('127.0.0.1:3000');
    expect(res.text).not.toContain('abcdefghijklmnopqrstuvwxyz');
    expect(res.text).not.toContain('SuperSecretPass99');
    expect(res.text).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    expect(res.text).not.toContain('MIIEpAIBAAKCAQE');
    expect(res.text).toContain('[REDACTED_PRIVATE_KEY]');
    expect(res.text).toContain('[REDACTED_PASSWORD]');
  });

  it('redacts personal emails, phone numbers, and IDs when redactPii is enabled', () => {
    const sample = 'Contact alice.wang@company.cn or +86 13812345678, ID 110101199001011234, demo@example.com';
    const res = redactSensitiveText(sample, { redactSecrets: false, redactPii: true });
    expect(res.redactedCount).toBe(3);
    expect(res.text).toContain('[REDACTED_EMAIL]');
    expect(res.text).toContain('[REDACTED_PHONE]');
    expect(res.text).toContain('[REDACTED_ID_CARD]');
    expect(res.text).toContain('demo@example.com');
  });

  it('hashes sourceUrl into fingerprint and omits raw URLs from handoff and default exports', () => {
    const privateUrl = 'https://chatgpt.com/c/673a9999-secret-uuid-1234?token=abc';
    const payload = buildHandoffPayload({
      sourcePlatform: 'chatgpt',
      sourceTitle: 'Debug token sk-test1234567890abcdef1234',
      sourceUrl: privateUrl,
      messages: [{ role: 'user', content: 'My email is bob@private.org' }],
      mode: 'compact',
      maxCompactTurns: 8,
      locale: 'zh',
      now: 1000,
      ttlMinutes: 30,
    });

    expect(payload).not.toBeNull();
    expect(payload?.sourceFingerprint).toBe(computeUrlFingerprint(privateUrl));
    expect(JSON.stringify(payload)).not.toContain('secret-uuid-1234');
    expect(payload?.promptText).not.toContain('bob@private.org');
    expect(payload?.redactedCount).toBe(2);
    expect(payload?.expiresAt).toBe(1000 + 30 * 60_000);

    const exported = formatConversationMarkdownWithStats({
      platform: 'chatgpt',
      title: 'My Chat',
      url: privateUrl,
      messages: [{ role: 'user', content: 'Key: ghp_12345678901234567890123456' }],
      locale: 'en',
      includeThinking: false,
    });
    expect(exported.redactedCount).toBe(1);
    expect(exported.markdown).not.toContain('secret-uuid-1234');
    expect(exported.markdown).not.toContain('ghp_1234567890');
  });

  it('automatically purges expired handoff payloads from storage', async () => {
    const bridge = new MemoryStorageBridge();
    const payload = buildHandoffPayload({
      sourcePlatform: 'gemini',
      sourceTitle: 'Expired',
      sourceUrl: 'https://gemini.google.com/app/1',
      messages: [{ role: 'user', content: 'hello' }],
      mode: 'compact',
      maxCompactTurns: 8,
      locale: 'en',
      now: 1000,
      ttlMinutes: 10,
    });
    await bridge.set('handoff', payload);

    expect(await loadActiveHandoff(bridge, 5000)).not.toBeNull();
    expect(await loadActiveHandoff(bridge, 1000 + 10 * 60_000 + 1)).toBeNull();
    expect(await bridge.get('handoff')).toBeNull();
  });
});
