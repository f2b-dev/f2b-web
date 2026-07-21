export type TemplateRef = {
  id: string;
  name: string;
  description: string;
  image?: string;
  tags: string[];
  popular?: boolean;
};

export async function fetchTemplates(): Promise<TemplateRef[]> {
  const res = await fetch("/api/templates", { cache: "no-store" });
  const data = (await res.json()) as {
    templates?: TemplateRef[];
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `templates ${res.status}`);
  }
  return data.templates ?? [];
}
