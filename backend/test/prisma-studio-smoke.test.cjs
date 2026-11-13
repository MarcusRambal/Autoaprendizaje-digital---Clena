const assert = require('node:assert/strict');

const studioUrl = process.argv[2] || 'http://127.0.0.1:5555';

async function request(action, data) {
  const response = await fetch(new URL('/api', studioUrl), {
    method: 'POST',
    headers: { 'content-type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({
      requestId: 1,
      channel: 'prisma',
      action,
      payload: { data },
    }),
  });
  assert.equal(response.status, 200, `Studio API returned ${response.status}`);
  const result = await response.json();
  assert.equal(result.payload.error, null, JSON.stringify(result.payload.error));
  return result.payload.data;
}

async function main() {
  const metadata = await request('getDMMF', null);
  assert.equal(typeof metadata.schemaHash, 'string');

  const users = await request('clientRequest', {
    schemaHash: metadata.schemaHash,
    modelName: 'User',
    operation: 'findMany',
    args: {
      take: 100,
      skip: 0,
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        status: true,
        accessibilityPreferences: true,
        privacyAcceptedAt: true,
        privacyNoticeVersion: true,
        createdAt: true,
        updatedAt: true,
        activityProgress: { select: { id: true } },
        guideProgress: { select: { id: true } },
        refreshSessions: { select: { id: true } },
        helpRequests: { select: { id: true } },
        attendedHelpRequests: { select: { id: true } },
      },
    },
  });
  assert.ok(Array.isArray(users), 'Studio did not return a list of users');
  console.log('Prisma Studio User query passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
