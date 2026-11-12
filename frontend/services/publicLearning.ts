import { useEffect, useState } from "react";

export interface PublicGuide {
  id: number | string;
  title: string;
  description: string;
  category: string;
  file: string;
  fileUrl?: string | null;
}

export interface PublicLessonQuestion {
  id: string;
  orderNumber: number;
  prompt: string;
  options: string[];
}

export interface PublicLessonSummary {
  id: number | string;
  title: string;
  description: string;
  category: string;
}

export interface PublicLesson extends PublicLessonSummary {
  questions: PublicLessonQuestion[];
}

export interface PublicLessonAnswerResult {
  correct: boolean;
  immediateFeedback: string;
}

export interface PublicProgressSection {
  title: string;
  label: string;
  value: number;
  tone: "guides" | "lessons";
}

export interface HelpRequestInput {
  name: string;
  subject: string;
  description: string;
}

export interface PublicLearningService {
  getGuides(): Promise<PublicGuide[]>;
  getProgress(): Promise<PublicProgressSection[]>;
  submitHelpRequest(request: HelpRequestInput): Promise<{ submitted: boolean }>;
}

const guides: PublicGuide[] = [
  {
    id: 1,
    title: "Navegación segura en internet",
    description:
      "Aprende a navegar por internet y a reconocer situaciones que requieren precaución.",
    category: "Seguridad digital",
    file: "guia1.pdf",
  },
  {
    id: 2,
    title: "Potencia tu búsqueda con Google Scholar",
    description:
      "Encuentra información de investigación científica y revisa sus fuentes.",
    category: "Búsqueda en internet",
    file: "guia2.pdf",
  },
  {
    id: 3,
    title: "Cómo reconocer un mensaje sospechoso",
    description: "Identifica mensajes inesperados y verifica quién los envió.",
    category: "Seguridad digital",
    file: "guia3.pdf",
  },
];

const progress: PublicProgressSection[] = [
  { title: "Guías", label: "tus guías", value: 40, tone: "guides" },
  { title: "Lecciones", label: "tus lecciones", value: 40, tone: "lessons" },
];

export const mockPublicLearningService: PublicLearningService = {
  async getGuides() {
    return guides;
  },
  async getProgress() {
    return progress;
  },
  async submitHelpRequest() {
    return { submitted: false };
  },
};

interface PublicRequestState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function usePublicRequest<T>(
  request: () => Promise<T>,
): PublicRequestState<T> {
  const [state, setState] = useState<
    PublicRequestState<T> & {
      request: (() => Promise<T>) | null;
    }
  >({
    data: null,
    isLoading: true,
    error: null,
    request: null,
  });

  useEffect(() => {
    let active = true;
    request()
      .then((data) => {
        if (active) setState({ request, data, isLoading: false, error: null });
      })
      .catch(() => {
        if (active)
          setState({
            request,
            data: null,
            isLoading: false,
            error:
              "No se pudo cargar la información. Inténtalo de nuevo más tarde.",
          });
      });
    return () => {
      active = false;
    };
  }, [request]);

  return state.request === request
    ? { data: state.data, isLoading: state.isLoading, error: state.error }
    : { data: null, isLoading: true, error: null };
}
