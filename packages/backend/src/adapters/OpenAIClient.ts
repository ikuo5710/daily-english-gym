/**
 * OpenAI API クライアント
 * 環境変数からAPIキーを取得し、OpenAI SDKのラッパーを提供
 */

import OpenAI from 'openai';
import { OpenAIError } from '@daily-english-gym/shared';

let openaiClient: OpenAI | null = null;

/**
 * OpenAI クライアントのシングルトンインスタンスを取得
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new OpenAIError(
        'OPENAI_API_KEY environment variable is not set',
        undefined,
        undefined
      );
    }

    openaiClient = new OpenAI({
      apiKey,
    });
  }

  return openaiClient;
}

/**
 * テキスト生成（Chat Completions API）
 */
export async function generateChatCompletion(
  systemPrompt: string,
  userMessage: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const client = getOpenAIClient();

  try {
    const response = await client.chat.completions.create({
      model: options?.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new OpenAIError('Empty response from OpenAI API');
    }

    return content;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new OpenAIError(
        `OpenAI API error: ${error.message}`,
        error.status,
        error
      );
    }
    throw error;
  }
}

/**
 * 音声合成（TTS API）
 */
export async function generateSpeech(
  text: string,
  options?: {
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    speed?: number;
  }
): Promise<ArrayBuffer> {
  const client = getOpenAIClient();

  try {
    const response = await client.audio.speech.create({
      model: 'tts-1',
      voice: options?.voice || 'nova',
      input: text,
      speed: options?.speed ?? 1.0,
    });

    return await response.arrayBuffer();
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new OpenAIError(
        `OpenAI TTS error: ${error.message}`,
        error.status,
        error
      );
    }
    throw error;
  }
}

/**
 * 音声文字起こし（Whisper API）
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string = 'audio.webm'
): Promise<string> {
  const client = getOpenAIClient();

  try {
    // Create a File object from the buffer
    const file = new File([audioBuffer], filename, { type: 'audio/webm' });

    const response = await client.audio.transcriptions.create({
      model: 'whisper-1',
      file,
      language: 'en',
    });

    return response.text;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new OpenAIError(
        `OpenAI Transcription error: ${error.message}`,
        error.status,
        error
      );
    }
    throw error;
  }
}
