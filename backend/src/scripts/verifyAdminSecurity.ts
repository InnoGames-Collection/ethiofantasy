import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import {
  ADMIN_JWT_ISSUER,
  ADMIN_JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_AUDIENCE,
} from '../middleware/auth.js';

async function runSecuritySmokeTests() {
  console.log('==============================================================================');
  console.log('🔒 ETHIOFANTASY ADMIN PORTAL — SECURITY & RBAC SMOKE TEST SUITE');
  console.log('==============================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // 1. Key Isolation Test: Player JWT cannot be verified by Admin Verifier
  try {
    const playerToken = jwt.sign(
      { id: 'player-uuid-1234', msisdn: '251911223344', role: 'PLAYER' },
      env.JWT_SECRET,
      { algorithm: 'HS256', issuer: JWT_ISSUER, audience: JWT_AUDIENCE, expiresIn: '1h' }
    );

    let verifiedAsAdmin = false;
    try {
      jwt.verify(playerToken, env.ADMIN_JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: ADMIN_JWT_ISSUER,
        audience: ADMIN_JWT_AUDIENCE,
      });
      verifiedAsAdmin = true;
    } catch {
      verifiedAsAdmin = false;
    }

    assert(
      !verifiedAsAdmin,
      'Key Isolation: Player JWT rejected by dedicated Admin Secret & Audience verification'
    );
  } catch (err: any) {
    assert(false, 'Key Isolation test crashed', err.message);
  }

  // 2. Secret Key Differentiation
  assert(
    env.ADMIN_JWT_SECRET !== env.JWT_SECRET,
    'Zero-Trust Cryptographic Isolation: ADMIN_JWT_SECRET is distinct from player JWT_SECRET',
    `Found identical secret: ${env.JWT_SECRET}`
  );

  // 3. Admin Token Structure & Lifespan Validation
  try {
    const adminToken = jwt.sign(
      {
        id: 'a0000000-0000-0000-0000-000000000001',
        email: 'atekele21@gmail.com',
        username: 'Abebe Tekele',
        role: 'SUPER_ADMIN',
        tokenVersion: 1,
        jti: 'smoke-test-jti-12345',
      },
      env.ADMIN_JWT_SECRET,
      {
        algorithm: 'HS256',
        issuer: ADMIN_JWT_ISSUER,
        audience: ADMIN_JWT_AUDIENCE,
        expiresIn: '15m',
      }
    );

    const decoded = jwt.verify(adminToken, env.ADMIN_JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: ADMIN_JWT_ISSUER,
      audience: ADMIN_JWT_AUDIENCE,
    }) as any;

    assert(
      decoded.id === 'a0000000-0000-0000-0000-000000000001' &&
        decoded.role === 'SUPER_ADMIN' &&
        decoded.jti === 'smoke-test-jti-12345',
      'Admin Token Verification: Claims signature and JTI verified successfully'
    );
  } catch (err: any) {
    assert(false, 'Admin Token Verification test failed', err.message);
  }

  // 4. Algorithm Tampering Prevention (None-Algorithm Attack)
  try {
    let noneTokenVerified = false;
    try {
      const noneToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.';
      jwt.verify(noneToken, env.ADMIN_JWT_SECRET, {
        algorithms: ['HS256'],
      });
      noneTokenVerified = true;
    } catch {
      noneTokenVerified = false;
    }

    assert(
      !noneTokenVerified,
      'Algorithm Hardening: "none" algorithm header strictly rejected'
    );
  } catch (err: any) {
    assert(false, 'Algorithm Hardening test crashed', err.message);
  }

  // 5. CORS Origins Strict Parsing Validation
  const origins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  assert(
    origins.length >= 2 && !origins.includes('*'),
    'CORS Security: Strict origin whitelist without wildcard (*)',
    `Configured origins: ${origins.join(', ')}`
  );

  console.log('\n==============================================================================');
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('==============================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecuritySmokeTests().catch((err) => {
  console.error('Smoke tests failed:', err);
  process.exit(1);
});
