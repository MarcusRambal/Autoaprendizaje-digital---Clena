import type { Category, Guide, Quiz } from '../../types/contracts';

const topics = [
  'Seguridad digital', 'Navegación web', 'Correo electrónico', 'Trámites en línea',
  'Diseño gráfico', 'Comunicación', 'Educación', 'Salud digital',
  'Finanzas personales', 'Compras en línea', 'Redes sociales', 'Privacidad',
  'Dispositivos móviles', 'Ofimática', 'Fotografía', 'Búsqueda de empleo',
  'Almacenamiento en la nube', 'Videollamadas', 'Contraseñas', 'Información confiable',
  'Accesibilidad', 'Programación', 'Comunidad', 'Gestión del tiempo',
  'Tecnología para niños', 'Tecnología para adultos'
];

export const categories: Category[] = topics.map((title, index) => ({ id: index + 1, title }));

export const guides: Guide[] = categories.flatMap(category =>
  Array.from({ length: 8 }, (_, index) => ({
    id: (category.id - 1) * 8 + index + 1,
    title: `${category.title}: guía práctica ${index + 1}`,
    category: category.title,
    file: `guia${index % 3 + 1}.pdf`
  }))
);

export const quizzes: Quiz[] = categories.flatMap(category =>
  Array.from({ length: 4 }, (_, index) => ({
    id: (category.id - 1) * 4 + index + 1,
    name: `${category.title}: evaluación ${index + 1}`,
    category: category.title,
    questions: Array.from({ length: 5 }, (_, questionIndex) => ({
      description: `Pregunta ${questionIndex + 1} sobre ${category.title}`,
      options: ['Primera respuesta', 'Segunda respuesta', 'Tercera respuesta', 'Cuarta respuesta'],
      correctOptionIndex: questionIndex % 4
    }))
  }))
);

export const controlPanelData = { categories, guides, quizzes };
