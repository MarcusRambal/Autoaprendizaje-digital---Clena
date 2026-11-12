import { useEffect, useState } from 'react';

export interface PublicGuide {
  id: number | string;
  title: string;
  description: string;
  category: string;
  file: string;
  fileUrl?: string | null;
}

export interface PublicLessonQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PublicLesson {
  id: number | string;
  title: string;
  description: string;
  category: string;
  questions: PublicLessonQuestion[];
}

export interface PublicProgressSection {
  title: string;
  label: string;
  value: number;
  tone: 'guides' | 'lessons';
}

export interface HelpRequestInput {
  name: string;
  subject: string;
  description: string;
}

export interface PublicLearningService {
  getGuides(): Promise<PublicGuide[]>;
  getLessons(): Promise<PublicLesson[]>;
  getProgress(): Promise<PublicProgressSection[]>;
  submitHelpRequest(request: HelpRequestInput): Promise<{ submitted: boolean }>;
}

const demoQuestions: PublicLessonQuestion[] = [
  {
    prompt: '¿Cuál de estas contraseñas es más segura?',
    options: ['123456', 'gsfksj291@929823j-', 'password', 'Mi nombre y fecha de nacimiento'],
    correctIndex: 1,
    explanation: 'Una contraseña larga, única y difícil de adivinar protege mejor tus cuentas.',
  },
  {
    prompt: 'Una página desconocida te pide tu contraseña. ¿Qué debes hacer?',
    options: ['Escribirla para continuar', 'Usar la misma contraseña de siempre', 'No compartirla y verificar el sitio', 'Enviar una captura de pantalla'],
    correctIndex: 2,
    explanation: 'No escribas tu contraseña en una página que no hayas verificado.',
  },
  {
    prompt: '¿Qué herramienta puedes usar para buscar artículos científicos?',
    options: ['Google Scholar', 'Una cadena de mensajes', 'La carpeta de descargas', 'Un acortador de enlaces'],
    correctIndex: 0,
    explanation: 'Google Scholar ayuda a localizar publicaciones académicas; revisa también quién las publicó y cuándo.',
  },
  {
    prompt: 'Recibes un mensaje urgente que pide un código de acceso. ¿Qué haces?',
    options: ['Lo compartes para evitar un problema', 'Respondes con tu contraseña', 'Verificas la solicitud por un canal oficial', 'Reenvías el código a tus contactos'],
    correctIndex: 2,
    explanation: 'Los códigos de acceso son privados. Confirma la solicitud usando un canal oficial.',
  },
  {
    prompt: '¿Cuál es una buena práctica para tus cuentas?',
    options: ['Usar una sola contraseña en todas', 'Crear contraseñas distintas y guardarlas de forma segura', 'Compartirlas con amistades', 'Anotarlas junto al dispositivo'],
    correctIndex: 1,
    explanation: 'Usar contraseñas distintas evita que una filtración afecte todas tus cuentas.',
  },
  {
    prompt: '¿Qué significa que una página use HTTPS?',
    options: ['Que todo su contenido es confiable', 'Que la conexión está cifrada', 'Que nunca puede ser falsa', 'Que no necesita contraseña'],
    correctIndex: 1,
    explanation: 'HTTPS cifra la conexión, pero aún debes verificar que el sitio sea legítimo.',
  },
  {
    prompt: '¿Qué conviene hacer antes de abrir un archivo inesperado?',
    options: ['Abrirlo rápidamente', 'Revisar quién lo envió y confirmar que sea esperado', 'Compartirlo con otras personas', 'Desactivar las protecciones del dispositivo'],
    correctIndex: 1,
    explanation: 'Confirma con quien supuestamente lo envió antes de abrir archivos inesperados.',
  },
  {
    prompt: '¿Qué añade la verificación en dos pasos a tu cuenta?',
    options: ['Una segunda comprobación al iniciar sesión', 'Una contraseña compartida', 'Acceso automático para cualquiera', 'La eliminación de tu contraseña'],
    correctIndex: 0,
    explanation: 'La verificación en dos pasos agrega una barrera adicional para proteger tu cuenta.',
  },
];

const guides: PublicGuide[] = [
  {
    id: 1,
    title: 'Navegación segura en internet',
    description: 'Aprende a navegar por internet y a reconocer situaciones que requieren precaución.',
    category: 'Seguridad digital',
    file: 'guia1.pdf',
  },
  {
    id: 2,
    title: 'Potencia tu búsqueda con Google Scholar',
    description: 'Encuentra información de investigación científica y revisa sus fuentes.',
    category: 'Búsqueda en internet',
    file: 'guia2.pdf',
  },
  {
    id: 3,
    title: 'Cómo reconocer un mensaje sospechoso',
    description: 'Identifica mensajes inesperados y verifica quién los envió.',
    category: 'Seguridad digital',
    file: 'guia3.pdf',
  },
];

const lessons: PublicLesson[] = [
  {
    id: 1,
    title: 'Navegación segura en internet',
    description: 'Practica cómo proteger tus cuentas y reconocer sitios confiables.',
    category: 'Seguridad digital',
    questions: demoQuestions,
  },
  {
    id: 2,
    title: 'Protege tus cuentas y contraseñas',
    description: 'Aprende a cuidar tus claves y códigos de acceso.',
    category: 'Seguridad digital',
    questions: demoQuestions,
  },
  {
    id: 3,
    title: 'Potencia tu búsqueda con Google Scholar',
    description: 'Practica cómo encontrar información de investigación confiable.',
    category: 'Búsqueda en internet',
    questions: demoQuestions,
  },
  {
    id: 4,
    title: 'Reconoce mensajes sospechosos',
    description: 'Identifica mensajes inesperados antes de abrir enlaces o archivos.',
    category: 'Seguridad digital',
    questions: demoQuestions,
  },
];

const progress: PublicProgressSection[] = [
  { title: 'Guías', label: 'tus guías', value: 40, tone: 'guides' },
  { title: 'Lecciones', label: 'tus lecciones', value: 40, tone: 'lessons' },
];

export const mockPublicLearningService: PublicLearningService = {
  async getGuides() { return guides; },
  async getLessons() { return lessons; },
  async getProgress() { return progress; },
  async submitHelpRequest() { return { submitted: false }; },
};

interface PublicRequestState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function usePublicRequest<T>(request: () => Promise<T>): PublicRequestState<T> {
  const [state, setState] = useState<PublicRequestState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    request().then(data => {
      if (active) setState({ data, isLoading: false, error: null });
    }).catch(() => {
      if (active) setState({
        data: null,
        isLoading: false,
        error: 'No se pudo cargar la información. Inténtalo de nuevo más tarde.',
      });
    });
    return () => { active = false; };
  }, [request]);

  return state;
}
