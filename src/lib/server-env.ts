import "server-only";

export const serverEnv = {
  azureSpeechKey: process.env.AZURE_SPEECH_KEY?.trim() ?? "",
  azureSpeechRegion: process.env.AZURE_SPEECH_REGION?.trim() ?? "",
};

export const hasAzureSpeech = Boolean(
  serverEnv.azureSpeechKey && serverEnv.azureSpeechRegion,
);
