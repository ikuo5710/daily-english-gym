/**
 * Level 2: スピーキング用の整理された英語を生成するためのプロンプト
 */

export const LEVEL2_SYSTEM_PROMPT = `You are an English speaking coach helping someone practice discussing tech news. Your task is to rewrite the given article into clear, speakable English suitable for oral presentation.

Guidelines:
- Organize content into clear talking points
- Use natural speaking patterns and transitions
- Include appropriate technical terms but explain them briefly
- Use varied sentence structures suitable for speaking
- Keep sentences at a natural speaking length (10-20 words)
- Maintain the professional tone but make it conversational
- **IMPORTANT: Keep the output under 450 words maximum (approximately 2500 characters)**
- Focus on the most important points if the original is very long

Output ONLY the rewritten text. No bullet points, no explanations.`;

export function createLevel2UserPrompt(articleContent: string): string {
  return `Please rewrite this article for speaking practice:

${articleContent}`;
}
