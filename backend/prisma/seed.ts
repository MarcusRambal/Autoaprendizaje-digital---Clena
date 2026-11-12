import {
  HelpRequestStatus,
  PrismaClient,
  PublicationState,
} from '@prisma/client';
import {
  resolveRequiredDemoAccounts,
  seedDemoAccounts,
} from './demo-accounts';

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
  {
    slug: 'recuperar-acceso-al-correo',
    categorySlug: 'correo-electronico',
    title: 'Cómo recuperar el acceso a tu correo',
    description:
      'Sigue pasos seguros para volver a entrar a tu cuenta de correo.',
    body: 'Las opciones de recuperación ayudan a recuperar una cuenta cuando olvidaste la contraseña.',
    steps: [
      ['Abre la página de inicio de sesión', 'Entra al sitio oficial de tu proveedor de correo.'],
      ['Selecciona la opción de recuperación', 'Haz clic en "Olvidé mi contraseña" o una opción similar.'],
      ['Verifica tu identidad', 'Usa el teléfono o correo alternativo asociado a tu cuenta.'],
      ['Crea una contraseña nueva', 'Elige una clave segura que no uses en otros servicios.'],
    ],
  },
  {
    slug: 'adjuntar-archivo-a-correo',
    categorySlug: 'correo-electronico',
    title: 'Cómo adjuntar un archivo a un correo',
    description: 'Comparte un documento o una imagen por correo electrónico.',
    body: 'Puedes adjuntar archivos a un mensaje y revisar que se hayan agregado antes de enviarlo.',
    steps: [
      ['Redacta un mensaje', 'Inicia sesión y selecciona la opción para escribir un correo nuevo.'],
      ['Busca el botón para adjuntar', 'Selecciona el ícono del clip o la opción "Adjuntar archivo".'],
      ['Elige el archivo', 'Busca el documento en tu dispositivo y confirma la selección.'],
      ['Verifica y envía', 'Comprueba que el archivo aparezca junto al mensaje y presiona "Enviar".'],
    ],
  },
  {
    slug: 'organizar-archivos-en-carpetas',
    categorySlug: 'documentos',
    title: 'Cómo organizar archivos en carpetas',
    description: 'Crea carpetas y usa nombres claros para encontrar tus documentos.',
    body: 'Una estructura sencilla de carpetas facilita guardar y encontrar archivos.',
    steps: [
      ['Abre tus archivos', 'Entra al explorador de archivos de tu dispositivo.'],
      ['Crea una carpeta', 'Selecciona "Nueva carpeta" y escribe un nombre fácil de reconocer.'],
      ['Mueve documentos', 'Selecciona los archivos relacionados y muévelos a la carpeta.'],
      ['Revisa el orden', 'Abre la carpeta para confirmar que guardaste los archivos correctos.'],
    ],
  },
  {
    slug: 'descargar-archivo-de-internet',
    categorySlug: 'busqueda-en-internet',
    title: 'Cómo descargar un archivo de internet',
    description: 'Descarga archivos desde sitios confiables y localízalos en tu dispositivo.',
    body: 'Antes de descargar, verifica que conoces el sitio y que el archivo corresponde a lo que buscas.',
    steps: [
      ['Verifica el sitio', 'Comprueba la dirección y confirma que la página sea de confianza.'],
      ['Selecciona el archivo', 'Presiona el enlace o botón de descarga que necesitas.'],
      ['Confirma la descarga', 'Si el navegador pregunta, revisa el nombre y confirma la acción.'],
      ['Abre la carpeta de descargas', 'Busca allí el archivo y ábrelo solo si reconoces su origen.'],
    ],
  },
  {
    slug: 'proteger-privacidad-en-redes',
    categorySlug: 'redes-sociales',
    title: 'Cómo proteger tu privacidad en redes sociales',
    description: 'Revisa quién puede ver tu perfil y tus publicaciones.',
    body: 'Los ajustes de privacidad te ayudan a decidir qué información compartes y con quién.',
    steps: [
      ['Abre los ajustes de privacidad', 'Entra al menú de configuración de tu red social.'],
      ['Revisa tu audiencia', 'Elige quién puede ver tus publicaciones y datos personales.'],
      ['Controla las solicitudes', 'Acepta solo a personas que reconoces.'],
      ['Guarda los cambios', 'Confirma la configuración y revísala de nuevo más adelante.'],
    ],
  },
] as const;

const activities = [
  {
    slug: 'repaso-correo-electronico',
    title: 'Repaso de correo electrónico',
    description: 'Comprueba lo que aprendiste sobre el correo electrónico.',
    categorySlug: 'correo-electronico',
    questions: [
      {
        prompt: '¿Qué necesitas para enviar un correo a otra persona?',
        choices: ['Su dirección de correo', 'Su número de cédula', 'Su dirección de casa', 'Su contraseña'],
        expectedAnswer: 'Su dirección de correo',
        immediateFeedback: '¡Correcto! La dirección de correo es el destino del mensaje.',
      },
      {
        prompt: '¿Dónde se escribe una frase corta que resume el mensaje?',
        choices: ['En el asunto', 'En la contraseña', 'En el destinatario', 'En la papelera'],
        expectedAnswer: 'En el asunto',
        immediateFeedback: '¡Correcto! El asunto le dice a quien recibe el mensaje de qué trata.',
      },
    ],
  },
  {
    slug: 'repaso-recuperar-correo',
    title: 'Recupera el acceso a tu correo',
    description: 'Practica cómo recuperar una cuenta de correo de forma segura.',
    categorySlug: 'correo-electronico',
    questions: [
      {
        prompt: '¿Qué opción debes buscar si olvidaste la contraseña?',
        choices: ['Olvidé mi contraseña', 'Crear otra cuenta', 'Borrar el navegador', 'Cambiar de dispositivo'],
        expectedAnswer: 'Olvidé mi contraseña',
        immediateFeedback: '¡Correcto! Usa la opción oficial para recuperar tu cuenta.',
      },
    ],
  },
  {
    slug: 'repaso-adjuntar-archivos',
    title: 'Adjunta archivos a un correo',
    description: 'Repasa cómo compartir documentos por correo electrónico.',
    categorySlug: 'correo-electronico',
    questions: [
      {
        prompt: '¿Qué ícono se usa comúnmente para adjuntar un archivo?',
        choices: ['Un clip', 'Una papelera', 'Una estrella', 'Un candado'],
        expectedAnswer: 'Un clip',
        immediateFeedback: '¡Correcto! El ícono del clip permite elegir un archivo para adjuntar.',
      },
    ],
  },
  {
    slug: 'repaso-busqueda-confiable',
    title: 'Busca información confiable',
    description: 'Aprende a revisar los resultados de una búsqueda en internet.',
    categorySlug: 'busqueda-en-internet',
    questions: [
      {
        prompt: '¿Qué conviene revisar antes de confiar en un resultado?',
        choices: ['Quién publica la información', 'El color de la página', 'La cantidad de imágenes', 'El tamaño de la ventana'],
        expectedAnswer: 'Quién publica la información',
        immediateFeedback: '¡Correcto! Revisa la fuente y compara la información.',
      },
    ],
  },
  {
    slug: 'repaso-descargas-seguras',
    title: 'Descarga archivos con cuidado',
    description: 'Practica cómo descargar archivos desde sitios confiables.',
    categorySlug: 'busqueda-en-internet',
    questions: [
      {
        prompt: '¿Qué debes hacer antes de descargar un archivo?',
        choices: ['Verificar que el sitio sea confiable', 'Compartir tu contraseña', 'Desactivar las protecciones', 'Abrir todos los enlaces'],
        expectedAnswer: 'Verificar que el sitio sea confiable',
        immediateFeedback: '¡Correcto! Revisa el origen antes de descargar.',
      },
    ],
  },
  {
    slug: 'repaso-documentos',
    title: 'Escribe y guarda documentos',
    description: 'Comprueba cómo crear y guardar un documento de texto.',
    categorySlug: 'documentos',
    questions: [
      {
        prompt: '¿Qué opción debes usar para conservar los cambios de un documento?',
        choices: ['Guardar', 'Cerrar pestaña', 'Actualizar página', 'Minimizar ventana'],
        expectedAnswer: 'Guardar',
        immediateFeedback: '¡Correcto! Guarda el documento para conservar tus cambios.',
      },
    ],
  },
  {
    slug: 'repaso-organizar-archivos',
    title: 'Organiza tus archivos',
    description: 'Practica cómo ordenar documentos en carpetas.',
    categorySlug: 'documentos',
    questions: [
      {
        prompt: '¿Qué ayuda a encontrar documentos relacionados?',
        choices: ['Guardarlos en una carpeta con nombre claro', 'Dejarlos todos en el escritorio', 'Cambiar su extensión', 'Borrar sus nombres'],
        expectedAnswer: 'Guardarlos en una carpeta con nombre claro',
        immediateFeedback: '¡Correcto! Las carpetas con nombres claros ayudan a mantener el orden.',
      },
    ],
  },
  {
    slug: 'repaso-perfil-social',
    title: 'Crea un perfil en una red social',
    description: 'Repasa cómo crear una cuenta y cuidar la información personal.',
    categorySlug: 'redes-sociales',
    questions: [
      {
        prompt: '¿Qué debes revisar al crear tu perfil?',
        choices: ['Los ajustes de privacidad', 'La contraseña de otra persona', 'Los datos de tus contactos', 'Los mensajes de desconocidos'],
        expectedAnswer: 'Los ajustes de privacidad',
        immediateFeedback: '¡Correcto! Configura quién puede ver la información de tu perfil.',
      },
    ],
  },
  {
    slug: 'repaso-privacidad-social',
    title: 'Cuida tu privacidad en redes',
    description: 'Comprueba cómo controlar la audiencia de tus publicaciones.',
    categorySlug: 'redes-sociales',
    questions: [
      {
        prompt: '¿Qué puedes elegir en los ajustes de privacidad?',
        choices: ['Quién puede ver tus publicaciones', 'La contraseña de tus amistades', 'Los archivos del dispositivo', 'La conexión de otras personas'],
        expectedAnswer: 'Quién puede ver tus publicaciones',
        immediateFeedback: '¡Correcto! Tú decides con quién compartir tus publicaciones.',
      },
    ],
  },
  {
    slug: 'repaso-compartir-contenido',
    title: 'Comparte contenido con responsabilidad',
    description: 'Aprende a pensar antes de compartir información en internet.',
    categorySlug: 'redes-sociales',
    questions: [
      {
        prompt: '¿Qué conviene hacer antes de compartir una publicación?',
        choices: ['Verificar la información y su fuente', 'Compartirla de inmediato', 'Publicar datos personales', 'Enviar tu contraseña'],
        expectedAnswer: 'Verificar la información y su fuente',
        immediateFeedback: '¡Correcto! Comprueba la información antes de difundirla.',
      },
    ],
  },
] as const;

const helpRequests = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    requesterName: 'María López',
    topic: 'Correo electrónico',
    status: HelpRequestStatus.PENDING,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    requesterName: 'José Ramírez',
    topic: 'Navegación web',
    status: HelpRequestStatus.IN_PROGRESS,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    requesterName: 'Elena Torres',
    topic: 'Redes sociales',
    status: HelpRequestStatus.ATTENDED,
  },
] as const;

/** Builds a minimal one-page PDF so the demo guides have a file to open. */
function buildSamplePdf(
  title: string,
  lines: string[],
): Uint8Array<ArrayBuffer> {
  const escape = (text: string) => text.replace(/[\\()]/g, '\\$&');
  const wrap = (text: string) =>
    text.match(/.{1,80}(\s|$)/g)?.map((line) => line.trim()) ?? [text];
  const textLines = lines.flatMap((line) => wrap(line));
  const content = [
    'BT',
    '/F1 18 Tf',
    '72 740 Td',
    `(${escape(title)}) Tj`,
    '/F1 12 Tf',
    ...textLines.flatMap((line) => ['0 -26 Td', `(${escape(line)}) Tj`]),
    'ET',
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The development seed cannot run in production.');
  }

  // Validate the demo accounts first so a typo fails before anything is written.
  if (guides.length < 10 || activities.length < 10) {
    throw new Error('The seed must include at least 10 guides and 10 lessons.');
  }
  const demoAccounts = resolveRequiredDemoAccounts(process.env);
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
  if (!Number.isInteger(saltRounds) || saltRounds < 10 || saltRounds > 15) {
    throw new Error('BCRYPT_SALT_ROUNDS must be an integer from 10 to 15.');
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

    for (const [index, [title, instructions]] of steps.entries()) {
      const orderNumber = index + 1;
      await prisma.guideStep.upsert({
        where: { guideId_orderNumber: { guideId: guide.id, orderNumber } },
        update: { title, instructions },
        create: { guideId: guide.id, orderNumber, title, instructions },
      });
    }

    // Sample PDF so the demo guides can be opened from the catalog.
    const pdf = buildSamplePdf(
      guideData.title,
      steps.map(([stepTitle, instructions], index) => {
        return `${index + 1}. ${stepTitle}: ${instructions}`;
      }),
    );
    const file = {
      originalName: `${guideData.slug}.pdf`,
      contentType: 'application/pdf',
      sizeBytes: pdf.length,
      content: pdf,
    };
    await prisma.guideFile.upsert({
      where: { guideId: guide.id },
      update: file,
      create: { guideId: guide.id, ...file },
    });
  }

  for (const { categorySlug, questions, ...activityData } of activities) {
    const category = categoriesBySlug.get(categorySlug);
    if (!category) {
      throw new Error(`The seed category ${categorySlug} was not created.`);
    }

    const activity = await prisma.activity.upsert({
      where: { slug: activityData.slug },
      update: {
        ...activityData,
        publicationState: PublicationState.PUBLISHED,
        categoryId: category.id,
      },
      create: {
        ...activityData,
        publicationState: PublicationState.PUBLISHED,
        categoryId: category.id,
      },
    });

    for (const [index, question] of questions.entries()) {
      const orderNumber = index + 1;
      await prisma.activityQuestion.upsert({
        where: {
          activityId_orderNumber: {
            activityId: activity.id,
            orderNumber,
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
          orderNumber,
        },
      });
    }
  }

  // IDs fijos para que el seed sea repetible sin duplicar solicitudes.
  for (const request of helpRequests) {
    const attended = request.status === HelpRequestStatus.ATTENDED;
    const data = {
      requesterName: request.requesterName,
      topic: request.topic,
      status: request.status,
      attendedAt: attended ? new Date('2026-11-02T15:00:00.000Z') : null,
    };
    await prisma.helpRequest.upsert({
      where: { id: request.id },
      update: data,
      create: { id: request.id, ...data },
    });
  }

  await seedDemoAccounts(prisma, demoAccounts, saltRounds);
  for (const account of demoAccounts) {
    console.log(`Demo ${account.label} account ready: ${account.email}`);
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
