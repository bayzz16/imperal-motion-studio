export type VoiceId =
  | 'male-lead'
  | 'female-lead'
  | 'male-calm'
  | 'male-young'
  | 'male-deep'
  | 'female-warm'
  | 'female-bright'
  | 'female-mature';

export type VoiceProfile = {
  id: VoiceId;
  displayName: string;
  voiceType: 'male' | 'female';
  direction: string;
  recommendedUse: string;
  assetDirectory: string;
};

/**
 * Reusable voice direction presets for future video projects.
 *
 * These are character/profile definitions, not generated voice recordings.
 * Add licensed or self-created audio files under each assetDirectory.
 */
export const VOICE_CAST: Record<VoiceId, VoiceProfile> = {
  'male-lead': {
    id: 'male-lead',
    displayName: 'Arka',
    voiceType: 'male',
    direction: 'Natural adult male voice; warm, clear, confident, medium-low register.',
    recommendedUse: 'Main male narrator or central male character.',
    assetDirectory: 'voices/male-lead',
  },
  'female-lead': {
    id: 'female-lead',
    displayName: 'Nara',
    voiceType: 'female',
    direction: 'Natural adult female voice; warm, articulate, expressive, medium register.',
    recommendedUse: 'Main female narrator or central female character.',
    assetDirectory: 'voices/female-lead',
  },
  'male-calm': {
    id: 'male-calm',
    displayName: 'Bima',
    voiceType: 'male',
    direction: 'Relaxed adult male voice; gentle pacing and thoughtful delivery.',
    recommendedUse: 'Calm supporting character, mentor, or reflective narration.',
    assetDirectory: 'voices/male-calm',
  },
  'male-young': {
    id: 'male-young',
    displayName: 'Raka',
    voiceType: 'male',
    direction: 'Youthful adult male voice; bright, conversational, energetic delivery.',
    recommendedUse: 'Energetic supporting character or casual dialogue.',
    assetDirectory: 'voices/male-young',
  },
  'male-deep': {
    id: 'male-deep',
    displayName: 'Damar',
    voiceType: 'male',
    direction: 'Mature adult male voice; deeper register, steady and composed.',
    recommendedUse: 'Authority figure, formal announcement, or serious scene.',
    assetDirectory: 'voices/male-deep',
  },
  'female-warm': {
    id: 'female-warm',
    displayName: 'Alya',
    voiceType: 'female',
    direction: 'Soft adult female voice; reassuring, warm, and measured.',
    recommendedUse: 'Supportive character or empathetic narration.',
    assetDirectory: 'voices/female-warm',
  },
  'female-bright': {
    id: 'female-bright',
    displayName: 'Kirana',
    voiceType: 'female',
    direction: 'Bright adult female voice; lively, friendly, and expressive.',
    recommendedUse: 'Cheerful supporting character or upbeat dialogue.',
    assetDirectory: 'voices/female-bright',
  },
  'female-mature': {
    id: 'female-mature',
    displayName: 'Maya',
    voiceType: 'female',
    direction: 'Mature adult female voice; calm, clear, grounded delivery.',
    recommendedUse: 'Mentor, leader, or formal narration.',
    assetDirectory: 'voices/female-mature',
  },
};

export const DEFAULT_VOICE_IDS: VoiceId[] = ['male-lead', 'female-lead'];
