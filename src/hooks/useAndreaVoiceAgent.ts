// DEPRECATED: Voice agent disabled. Andrea now uses text-only mode.
// This file is kept as a no-op stub to prevent import errors from stale caches.

export const useAndreaVoiceAgent = () => {
  return {
    isConnecting: false,
    isConnected: false,
    isSpeaking: false,
    isGeneratingAudio: false,
    error: null,
    showTextFallback: false,
    lastAgentText: null,
    ttsLoading: false,
    ttsProgress: 0,
    connect: async () => {},
    disconnect: () => {},
    sendTextMessage: (_msg: string) => {},
    testAudioOutput: async () => false,
  };
};
