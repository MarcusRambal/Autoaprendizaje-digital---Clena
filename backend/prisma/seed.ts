import {
  HelpRequestStatus,
  PrismaClient,
  PublicationState,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

// Todos los datos son ficticios (Ley 1581 y reglas del proyecto: sin datos reales del CLENA).
const categories = [
  { slug: 'correo-electronico', name: 'Correo electrónico' },
  { slug: 'busqueda-en-internet', name: 'Búsqueda en internet' },
  { slug: 'documentos', name: 'Documentos' },
  { slug: 'redes-sociales', name: 'Redes sociales' },
] as const;

const guides = [
  {
    slug: 'crear-cuenta-de-correo',
    categorySlug: 'correo-electronico',
    title: 'Cómo crear una cuenta de correo electrónico',
    description:
      'Aprende a crear tu propia cuenta de correo para enviar y recibir mensajes.',
    body: 'Una cuenta de correo te permite comunicarte con otras personas y registrarte en servicios en línea.',
    steps: [
      [
        'Abre el navegador',
        'Haz clic en el ícono del navegador y escribe la página de tu proveedor de correo.',
      ],
      [
        'Busca el botón de crear cuenta',
        'Selecciona la opción "Crear cuenta" y elige "Para uso personal".',
      ],
      [
        'Completa tus datos',
        'Escribe tu nombre, elige una dirección de correo y una contraseña segura.',
      ],
      [
        'Confirma tu cuenta',
        'Sigue las instrucciones en pantalla para verificar tu cuenta y listo.',
      ],
    ],
  },
  {
    slug: 'enviar-un-correo',
    categorySlug: 'correo-electronico',
    title: 'Cómo enviar un correo electrónico',
    description: 'Redacta y envía tu primer mensaje de correo paso a paso.',
    body: 'Enviar un correo es parecido a enviar una carta: necesitas un destinatario, un asunto y un mensaje.',
    steps: [
      ['Inicia sesión', 'Entra a tu correo con tu dirección y tu contraseña.'],
      ['Haz clic en Redactar', 'Busca el botón "Redactar" o "Nuevo mensaje".'],
      [
        'Escribe el destinatario y el asunto',
        'En "Para" escribe la dirección de quien recibirá el mensaje y en "Asunto" una frase corta.',
      ],
      [
        'Escribe tu mensaje y envía',
        'Redacta el texto y presiona el botón "Enviar".',
      ],
    ],
  },
  {
    slug: 'buscar-informacion-en-internet',
    categorySlug: 'busqueda-en-internet',
    title: 'Cómo buscar información en internet',
    description:
      'Usa un buscador para encontrar información confiable sobre cualquier tema.',
    body: 'Un buscador te muestra páginas relacionadas con las palabras que escribes.',
    steps: [
      [
        'Abre el buscador',
        'Abre el navegador y entra a la página de tu buscador de preferencia.',
      ],
      [
        'Escribe palabras clave',
        'Escribe pocas palabras sobre lo que buscas, por ejemplo "horarios de la biblioteca".',
      ],
      [
        'Revisa los resultados',
        'Lee el título y la dirección de cada resultado antes de abrirlo.',
      ],
      [
        'Verifica que la fuente sea confiable',
        'Prefiere páginas de instituciones conocidas y desconfía de las que piden datos personales.',
      ],
    ],
  },
  {
    slug: 'escribir-un-documento',
    categorySlug: 'documentos',
    title: 'Cómo escribir y guardar un documento',
    description: 'Crea un documento de texto, dale formato básico y guárdalo.',
    body: 'Un procesador de texto sirve para escribir cartas, trabajos y listas.',
    steps: [
      [
        'Abre el procesador de texto',
        'Busca el programa de documentos y abre un documento en blanco.',
      ],
      ['Escribe tu texto', 'Haz clic en la hoja y comienza a escribir.'],
      [
        'Cambia el tamaño de la letra',
        'Selecciona el texto y elige un tamaño más grande en la barra superior.',
      ],
      [
        'Guarda el documento',
        'Haz clic en "Guardar", escribe un nombre y elige la carpeta donde quedará.',
      ],
    ],
  },
  {
    slug: 'crear-perfil-en-red-social',
    categorySlug: 'redes-sociales',
    title: 'Cómo crear un perfil en una red social',
    description:
      'Crea un perfil y aprende a configurar tu privacidad desde el primer día.',
    body: 'Una red social te permite mantenerte en contacto con familiares y amigos.',
    steps: [
      [
        'Elige la red social',
        'Entra a la página o aplicación de la red social que quieres usar.',
      ],
      ['Regístrate', 'Escribe tu nombre, tu correo y una contraseña segura.'],
      [
        'Configura tu privacidad',
        'Entra a "Privacidad" y elige quién puede ver tus publicaciones.',
      ],
      [
        'Encuentra a tus conocidos',
        'Busca a tus familiares por su nombre y envíales una solicitud de amistad.',
      ],
    ],
  },
] as const;

const helpRequests = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    guideSlug: 'crear-cuenta-de-correo',
    description: 'No logro elegir una contraseña que el sistema acepte.',
    status: HelpRequestStatus.PENDING,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    guideSlug: 'escribir-un-documento',
    description: 'No encuentro dónde quedó guardado mi documento.',
    status: HelpRequestStatus.PENDING,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    guideSlug: null,
    description: 'Necesito ayuda para imprimir una hoja.',
    status: HelpRequestStatus.CANCELLED,
  },
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

  const guidesBySlug = new Map<string, { id: string }>();

  for (const { steps, categorySlug, ...guideData } of guides) {
    const category = categoriesBySlug.get(categorySlug);
    if (!category) {
      throw new Error(`The seed category ${categorySlug} was not created.`);
    }

    const data = {
      ...guideData,
      publicationState: PublicationState.PUBLISHED,
      categoryId: category.id,
    };
    const guide = await prisma.guide.upsert({
      where: { slug: guideData.slug },
      update: data,
      create: data,
      select: { id: true },
    });
    guidesBySlug.set(guideData.slug, guide);

    for (const [index, [title, instructions]] of steps.entries()) {
      const orderNumber = index + 1;
      await prisma.guideStep.upsert({
        where: { guideId_orderNumber: { guideId: guide.id, orderNumber } },
        update: { title, instructions },
        create: { guideId: guide.id, orderNumber, title, instructions },
      });
    }
  }

  const emailCategory = categoriesBySlug.get('correo-electronico');
  if (!emailCategory) {
    throw new Error('The seed email category was not created.');
  }

  const activity = await prisma.activity.upsert({
    where: { slug: 'repaso-correo-electronico' },
    update: {
      title: 'Repaso de correo electrónico',
      description: 'Comprueba lo que aprendiste sobre el correo electrónico.',
      publicationState: PublicationState.PUBLISHED,
      categoryId: emailCategory.id,
    },
    create: {
      title: 'Repaso de correo electrónico',
      slug: 'repaso-correo-electronico',
      description: 'Comprueba lo que aprendiste sobre el correo electrónico.',
      publicationState: PublicationState.PUBLISHED,
      categoryId: emailCategory.id,
    },
  });

  const questions = [
    {
      orderNumber: 1,
      prompt: '¿Qué necesitas para enviar un correo a otra persona?',
      choices: [
        'Su dirección de correo',
        'Su número de cédula',
        'Su dirección de casa',
      ],
      expectedAnswer: 'Su dirección de correo',
      immediateFeedback:
        '¡Correcto! La dirección de correo es el "domicilio" del mensaje.',
    },
    {
      orderNumber: 2,
      prompt: '¿Dónde se escribe una frase corta que resume el mensaje?',
      choices: ['En el asunto', 'En la contraseña', 'En el destinatario'],
      expectedAnswer: 'En el asunto',
      immediateFeedback:
        '¡Correcto! El asunto le dice a quien lo recibe de qué trata.',
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

  // IDs fijos para que el seed sea repetible sin duplicar solicitudes.
  for (const request of helpRequests) {
    const guideId = request.guideSlug
      ? guidesBySlug.get(request.guideSlug)?.id
      : undefined;
    const data = {
      description: request.description,
      status: request.status,
      guideId: guideId ?? null,
    };
    await prisma.helpRequest.upsert({
      where: { id: request.id },
      update: data,
      create: { id: request.id, ...data },
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
        privacyAcceptedAt: new Date(),
        privacyNoticeVersion: 'seed',
      },
      create: {
        email: seedAdminEmail,
        passwordHash,
        role: UserRole.ADMIN,
        privacyAcceptedAt: new Date(),
        privacyNoticeVersion: 'seed',
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
