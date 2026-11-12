import assert from "node:assert/strict";
import test from "node:test";
import {
  checkPublicLessonAnswer,
  mapPublicLesson,
  mapPublicLessonSummary,
} from "../services/publicLessonApi.ts";

test("mapea la respuesta pública de una lección sin datos de respuestas correctas", () => {
  const mapped = mapPublicLesson({
    id: "a72e2683-10a7-45f1-b7b7-7f3b2e09a225",
    title: "Navegación segura",
    description: "Aprende a navegar con seguridad.",
    category: "Seguridad digital",
    questions: [
      {
        id: "c5607e3f-a190-496c-9c2c-e667ad8812b5",
        orderNumber: 1,
        prompt: "¿Qué debes comprobar?",
        choices: ["A", "B", "C", "D"],
      },
    ],
  });

  assert.deepEqual(mapped, {
    id: "a72e2683-10a7-45f1-b7b7-7f3b2e09a225",
    title: "Navegación segura",
    description: "Aprende a navegar con seguridad.",
    category: "Seguridad digital",
    questions: [
      {
        id: "c5607e3f-a190-496c-9c2c-e667ad8812b5",
        orderNumber: 1,
        prompt: "¿Qué debes comprobar?",
        options: ["A", "B", "C", "D"],
      },
    ],
  });
  assert.equal("correctOptionIndex" in mapped.questions[0], false);
  assert.equal("immediateFeedback" in mapped.questions[0], false);
});

test("mapea la categoría nula del catálogo como cadena vacía", () => {
  assert.equal(
    mapPublicLessonSummary({
      id: "lesson-id",
      title: "Lección",
      description: "Descripción",
      category: null,
    }).category,
    "",
  );
});

test("envía la opción elegida al endpoint de validación", async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl = "";
  let requestInit;
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    return new Response(
      JSON.stringify({
        correct: false,
        immediateFeedback: "Verifica el origen antes de continuar.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    assert.deepEqual(
      await checkPublicLessonAnswer("lesson-id", "question-id", 3),
      {
        correct: false,
        immediateFeedback: "Verifica el origen antes de continuar.",
      },
    );
    assert.match(requestUrl, /\/lessons\/lesson-id\/check-answer$/);
    assert.equal(requestInit.method, "POST");
    assert.deepEqual(JSON.parse(requestInit.body), {
      questionId: "question-id",
      selectedOptionIndex: 3,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
