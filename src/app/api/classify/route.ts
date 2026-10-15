import { classifyHotdog, JevError } from "@/lib/jev";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png"]);

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const photo = form.get("photo");
  if (!(photo instanceof Blob) || photo.size === 0) {
    return Response.json({ error: "Missing photo" }, { status: 400 });
  }
  if (!ACCEPTED.has(photo.type)) {
    return Response.json({ error: "Photo must be JPEG or PNG" }, { status: 415 });
  }
  if (photo.size > MAX_BYTES) {
    return Response.json({ error: "Photo too large" }, { status: 413 });
  }

  try {
    return Response.json(await classifyHotdog(photo));
  } catch (err) {
    console.error(err);
    // Don't leak upstream error bodies to the client.
    const status = err instanceof JevError && err.status < 500 ? 502 : 500;
    return Response.json({ error: "Could not evaluate photo" }, { status });
  }
}
