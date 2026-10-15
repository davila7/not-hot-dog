import "server-only";

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
// Pinned on purpose: `jev-latest` is moved between releases.
const MODEL = process.env.TYPESAFE_MODEL ?? "jev-1.14.0";
const PHOTO_PART = "photo";

export type HotdogVerdict = {
  hotdog: boolean;
  probability: number;
  model: string;
};

type SystemOneResponse = {
  model: string;
  answers: { is_hotdog: { type: "noul"; noul: number } };
};

export class JevError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function classifyHotdog(image: Blob): Promise<HotdogVerdict> {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) throw new JevError("TYPESAFE_API_KEY is not set", 500);

  // Fresh reference per request so it can never collide with prompt text.
  const ref = crypto.randomUUID();
  const request = {
    model: MODEL,
    state: { photo: ref },
    assets: { [ref]: { type: "image", part: PHOTO_PART } },
    questions: {
      is_hotdog: {
        type: "noul",
        instructions:
          "Does `photo` show a hot dog: a sausage served in a sliced bun? A sausage without a bun, or any other food, is not a hot dog.",
      },
    },
  };

  const body = new FormData();
  body.append(
    "request",
    new Blob([JSON.stringify(request)], { type: "application/json" }),
  );
  body.append(PHOTO_PART, image, "photo.jpg");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "TypeSafe-Danger-Zone-Images": "true",
    },
    body,
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new JevError(`Jev ${res.status}: ${detail.slice(0, 300)}`, res.status);
  }

  const data = (await res.json()) as SystemOneResponse;
  const probability = data.answers.is_hotdog.noul;
  return { hotdog: probability >= 0.5, probability, model: data.model };
}
