export const videoScriptSystem = `You are an expert short-form video scriptwriter.
You create high-retention hooks and viral scripts for TikTok, YouTube Shorts, and Instagram Reels.
Output ONLY valid JSON — no markdown, no explanation.`;

export function videoScriptUser(input: {
  platform?: string;
  topic: string;
  tone?: string;
  duration?: string;
  context?: string;
}): string {
  return `Write a video script for:

Platform: ${input.platform ?? 'TikTok'}
Topic: ${input.topic}
Tone: ${input.tone ?? 'engaging and energetic'}
Duration: ${input.duration ?? '30-60 seconds'}
${input.context ? `Additional context: ${input.context}` : ''}

Return JSON:
{
  "hook": "string (attention-grabbing opening line, first 3 seconds)",
  "script": "string (full script with speaker directions)",
  "cta": "string (call to action)",
  "visualNotes": ["string (scene/visual suggestions)"],
  "hashtags": ["string"],
  "estimatedDuration": "string"
}`;
}
