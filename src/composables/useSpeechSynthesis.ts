import { ref, onMounted, onUnmounted } from 'vue';

export function useSpeechSynthesis() {
  const text = ref('');
  const speaking = ref(false);
  const paused = ref(false);
  const supported = ref(typeof window !== 'undefined' && 'speechSynthesis' in window);
  const voices = ref<SpeechSynthesisVoice[]>([]);
  const selectedVoice = ref('');
  const rate = ref(1);
  const pitch = ref(1);
  const volume = ref(1);

  let utterance: SpeechSynthesisUtterance | null = null;

  function loadVoices() {
    if (!supported.value) return;

    voices.value = window.speechSynthesis.getVoices().filter((voice) => voice.localService);
    if (selectedVoice.value || !voices.value.length) return;

    const zhVoice = voices.value.find((voice) => voice.lang.startsWith('zh'));
    selectedVoice.value = (zhVoice ?? voices.value[0]).name;
  }

  function bindUtteranceEvents() {
    if (!utterance) return;

    utterance.onstart = () => {
      speaking.value = true;
      paused.value = false;
    };
    utterance.onend = () => {
      speaking.value = false;
      paused.value = false;
    };
    utterance.onerror = () => {
      speaking.value = false;
      paused.value = false;
    };
    utterance.onpause = () => {
      paused.value = true;
    };
    utterance.onresume = () => {
      paused.value = false;
    };
  }

  function speak() {
    if (!supported.value || !text.value.trim()) return;

    window.speechSynthesis.cancel();

    utterance = new SpeechSynthesisUtterance(text.value.trim());
    const voice = voices.value.find((item) => item.name === selectedVoice.value);
    if (voice) utterance.voice = voice;

    utterance.rate = rate.value;
    utterance.pitch = pitch.value;
    utterance.volume = volume.value;

    bindUtteranceEvents();
    window.speechSynthesis.speak(utterance);
  }

  function pause() {
    if (speaking.value && !paused.value) {
      window.speechSynthesis.pause();
      paused.value = true;
    }
  }

  function resume() {
    if (paused.value) {
      window.speechSynthesis.resume();
      paused.value = false;
    }
  }

  function stop() {
    window.speechSynthesis.cancel();
    speaking.value = false;
    paused.value = false;
  }

  onMounted(() => {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  });

  onUnmounted(() => {
    stop();
    window.speechSynthesis.onvoiceschanged = null;
  });

  return {
    text,
    speaking,
    paused,
    supported,
    voices,
    selectedVoice,
    rate,
    pitch,
    volume,
    speak,
    pause,
    resume,
    stop,
  };
}
