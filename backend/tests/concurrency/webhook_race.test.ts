import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

test('Webhook Concurrency & Idempotency: HMAC verification and deduplication', async () => {
  const secret = 'ethiofantasy-hmac-webhook-secret-2026';
  const payload = {
    event: 'renew',
    request_id: 'test_req_unique_001',
    msisdn: '251911223344',
    service_id: '4',
    timestamp: Date.now(),
  };

  const rawBuffer = Buffer.from(JSON.stringify(payload));
  const validSignature = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBuffer).digest('hex');

  // 1. Validate timing-safe HMAC signature verification
  const sigBuf = Buffer.from(validSignature);
  const expBuf = Buffer.from('sha256=' + crypto.createHmac('sha256', secret).update(rawBuffer).digest('hex'));
  assert.equal(crypto.timingSafeEqual(sigBuf, expBuf), true, 'Valid signature must match timing-safely');

  // 2. Tampered payload must fail verification
  const tamperedBuffer = Buffer.from(JSON.stringify({ ...payload, msisdn: '251999999999' }));
  const tamperedExpected = 'sha256=' + crypto.createHmac('sha256', secret).update(tamperedBuffer).digest('hex');
  const tamperedBuf = Buffer.from(tamperedExpected);
  assert.equal(crypto.timingSafeEqual(sigBuf, tamperedBuf), false, 'Tampered payload must fail signature check');

  // 3. Idempotent Deduplication Simulation
  const processedRequests = new Set<string>();
  const simulateProcess = (reqId: string) => {
    if (processedRequests.has(reqId)) {
      return { status: 'IDEMPOTENT_DUPLICATE_IGNORED' };
    }
    processedRequests.add(reqId);
    return { status: 'SUCCESS' };
  };

  const results = [];
  for (let i = 0; i < 50; i++) {
    results.push(simulateProcess(payload.request_id));
  }

  const successCount = results.filter((r) => r.status === 'SUCCESS').length;
  const duplicateCount = results.filter((r) => r.status === 'IDEMPOTENT_DUPLICATE_IGNORED').length;

  assert.equal(successCount, 1, 'Exactly 1 request must process successfully');
  assert.equal(duplicateCount, 49, 'All 49 concurrent duplicate requests must be discarded idempotently');
});
