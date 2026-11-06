module.exports = {
  forbidden: [
    {
      name: 'domain-only-domain-and-shared-primitives',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/domain/' },
      to: {
        path: '^src/(?!modules/[^/]+/domain/|shared/(primitives/|errors/application-error\\.ts$))',
      },
    },
    {
      name: 'application-only-domain-application-and-shared-primitives',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/application/' },
      to: {
        path: '^src/(?!modules/[^/]+/(domain|application)/|shared/(primitives/|errors/application-error\\.ts$))',
      },
    },
    {
      name: 'infrastructure-must-not-depend-on-outer-layers',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/infrastructure/' },
      to: { path: '^src/modules/[^/]+/(application|presentation)/' },
    },
    {
      name: 'presentation-must-not-depend-on-infrastructure',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/presentation/' },
      to: { path: '^src/modules/[^/]+/infrastructure/' },
    },
    {
      name: 'presentation-may-only-use-shared-transport',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/presentation/' },
      to: { path: '^src/shared/(?!transport/)' },
    },
    {
      name: 'domain-and-application-must-not-import-framework-or-orm',
      severity: 'error',
      from: {
        path: '^(src/modules/[^/]+/(domain|application)/|test/architecture/fixtures/domain-imports-prisma\\.ts$)',
      },
      to: { path: 'node_modules/(@nestjs|@prisma/client)(/|$)' },
    },
    {
      name: 'domain-and-application-may-only-use-internal-primitives',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/(domain|application)/' },
      to: { dependencyTypes: ['npm'] },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
  },
};
