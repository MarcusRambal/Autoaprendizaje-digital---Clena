import {
  PrismaClient,
  PublicationState,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

const categories = [
  { slug: 'ciencias-naturales', name: 'Ciencias naturales' },
  { slug: 'matematicas', name: 'Matemáticas' },
  { slug: 'lengua-comunicacion', name: 'Lengua y comunicación' },
  { slug: 'ciencias-sociales', name: 'Ciencias sociales' },
  { slug: 'tecnologia', name: 'Tecnología' },
] as const;

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The development seed cannot run in production.');
  }

  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (Boolean(seedAdminEmail) !== Boolean(seedAdminPassword)) {
    throw new Error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be provided together.',
    );
  }

  const categoriesBySlug = new Map<string, { id: string }>();

  for (const category of categories) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
      select: { id: true },
    });
    categoriesBySlug.set(category.slug, savedCategory);
  }

  const scienceCategory = categoriesBySlug.get('ciencias-naturales');
  if (!scienceCategory) {
    throw new Error('The seed science category was not created.');
  }

  const guide = await prisma.guide.upsert({
    where: { slug: 'ciclo-del-agua' },
    update: {
      title: 'El ciclo del agua',
      description: 'Conoce cómo circula el agua en nuestro planeta.',
      body: 'El agua cambia de estado y se desplaza entre la superficie y la atmósfera.',
      publicationState: PublicationState.PUBLISHED,
      categoryId: scienceCategory.id,
    },
    create: {
      title: 'El ciclo del agua',
      slug: 'ciclo-del-agua',
      description: 'Conoce cómo circula el agua en nuestro planeta.',
      body: 'El agua cambia de estado y se desplaza entre la superficie y la atmósfera.',
      publicationState: PublicationState.PUBLISHED,
      categoryId: scienceCategory.id,
    },
  });

  const guideSteps = [
    {
      orderNumber: 1,
      title: 'Evaporación',
      instructions:
        'El calor del sol transforma parte del agua de mares, ríos y lagos en vapor.',
    },
    {
      orderNumber: 2,
      title: 'Condensación',
      instructions:
        'Al ascender y enfriarse, el vapor se convierte en pequeñas gotas que forman nubes.',
    },
    {
      orderNumber: 3,
      title: 'Precipitación',
      instructions:
        'Cuando las gotas se unen y pesan más, caen como lluvia, nieve o granizo.',
    },
  ] as const;

  for (const step of guideSteps) {
    await prisma.guideStep.upsert({
      where: {
        guideId_orderNumber: {
          guideId: guide.id,
          orderNumber: step.orderNumber,
        },
      },
      update: { title: step.title, instructions: step.instructions },
      create: { ...step, guideId: guide.id },
    });
  }

  const activity = await prisma.activity.upsert({
    where: { slug: 'repaso-del-ciclo-del-agua' },
    update: {
      title: 'Repaso del ciclo del agua',
      description: 'Comprueba lo que aprendiste sobre el ciclo del agua.',
      publicationState: PublicationState.PUBLISHED,
      categoryId: scienceCategory.id,
    },
    create: {
      title: 'Repaso del ciclo del agua',
      slug: 'repaso-del-ciclo-del-agua',
      description: 'Comprueba lo que aprendiste sobre el ciclo del agua.',
      publicationState: PublicationState.PUBLISHED,
      categoryId: scienceCategory.id,
    },
  });

  const questions = [
    {
      orderNumber: 1,
      prompt: '¿Qué fuente de energía impulsa principalmente la evaporación?',
      choices: ['El sol', 'La luna', 'El viento'],
      expectedAnswer: 'El sol',
      immediateFeedback:
        '¡Correcto! El calor del sol ayuda a que el agua se evapore.',
    },
    {
      orderNumber: 2,
      prompt:
        '¿Cómo se llama el proceso por el que el vapor forma gotas en las nubes?',
      choices: ['Condensación', 'Precipitación', 'Infiltración'],
      expectedAnswer: 'Condensación',
      immediateFeedback:
        '¡Correcto! El vapor se enfría y se condensa en pequeñas gotas.',
    },
  ] as const;

  for (const question of questions) {
    await prisma.activityQuestion.upsert({
      where: {
        activityId_orderNumber: {
          activityId: activity.id,
          orderNumber: question.orderNumber,
        },
      },
      update: {
        prompt: question.prompt,
        choices: [...question.choices],
        expectedAnswer: question.expectedAnswer,
        immediateFeedback: question.immediateFeedback,
      },
      create: {
        ...question,
        choices: [...question.choices],
        activityId: activity.id,
      },
    });
  }

  if (seedAdminEmail && seedAdminPassword) {
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
    if (!Number.isInteger(saltRounds) || saltRounds < 10 || saltRounds > 15) {
      throw new Error('BCRYPT_SALT_ROUNDS must be an integer from 10 to 15.');
    }

    const passwordHash = await hash(seedAdminPassword, saltRounds);
    await prisma.user.upsert({
      where: { email: seedAdminEmail },
      update: {
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: seedAdminEmail,
        passwordHash,
        role: UserRole.ADMIN,
      },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
