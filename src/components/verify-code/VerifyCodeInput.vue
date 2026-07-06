<template>
  <div class="verify-code-input" @paste="onPaste">
    <input
      v-for="(_, index) in length"
      :key="index"
      :ref="(el) => setInputRef(el as HTMLInputElement | null, index)"
      v-model="digits[index]"
      class="verify-code-input__box"
      :class="{ 'verify-code-input__box--filled': digits[index] }"
      type="text"
      inputmode="numeric"
      maxlength="1"
      autocomplete="one-time-code"
      :disabled="disabled"
      @input="onInput(index, $event)"
      @keydown="onKeydown(index, $event)"
      @focus="onFocus(index)"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onMounted } from 'vue';

const props = withDefaults(
  defineProps<{
    length?: number;
    modelValue?: string;
    disabled?: boolean;
    autofocus?: boolean;
  }>(),
  {
    length: 5,
    modelValue: '',
    disabled: false,
    autofocus: true,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  complete: [value: string];
}>();

const digits = ref<string[]>(Array.from({ length: props.length }, () => ''));
const inputRefs = ref<(HTMLInputElement | null)[]>([]);
const activeIndex = ref(0);

function setInputRef(el: HTMLInputElement | null, index: number) {
  inputRefs.value[index] = el;
}

function focusInput(index: number) {
  const el = inputRefs.value[index];
  if (el) {
    el.focus();
    el.select();
  }
}

function syncFromModel(value: string) {
  const chars = value.slice(0, props.length).split('');
  digits.value = Array.from({ length: props.length }, (_, i) => chars[i] ?? '');
}

function emitValue() {
  const value = digits.value.join('');
  emit('update:modelValue', value);
  if (value.length === props.length && digits.value.every((d) => d !== '')) {
    emit('complete', value);
  }
}

function onInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement;
  const raw = input.value.replace(/\D/g, '');

  if (!raw) {
    digits.value[index] = '';
    input.value = '';
    emitValue();
    return;
  }

  const char = raw.slice(-1);
  digits.value[index] = char;
  input.value = char;
  emitValue();

  if (index < props.length - 1) {
    nextTick(() => focusInput(index + 1));
  }
}

function onKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace') {
    if (digits.value[index]) {
      digits.value[index] = '';
      emitValue();
      return;
    }
    if (index > 0) {
      event.preventDefault();
      digits.value[index - 1] = '';
      emitValue();
      nextTick(() => focusInput(index - 1));
    }
    return;
  }

  if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault();
    focusInput(index - 1);
    return;
  }

  if (event.key === 'ArrowRight' && index < props.length - 1) {
    event.preventDefault();
    focusInput(index + 1);
    return;
  }

  if (event.key.length === 1 && !/\d/.test(event.key)) {
    event.preventDefault();
  }
}

function onFocus(index: number) {
  activeIndex.value = index;
  inputRefs.value[index]?.select();
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault();
  const text = event.clipboardData?.getData('text').replace(/\D/g, '') ?? '';
  if (!text) return;

  const chars = text.slice(0, props.length).split('');
  digits.value = Array.from({ length: props.length }, (_, i) => chars[i] ?? '');
  emitValue();

  const nextEmpty = digits.value.findIndex((d) => !d);
  nextTick(() => {
    if (nextEmpty === -1) {
      focusInput(props.length - 1);
    } else {
      focusInput(nextEmpty);
    }
  });
}

function clear() {
  digits.value = Array.from({ length: props.length }, () => '');
  emit('update:modelValue', '');
  nextTick(() => focusInput(0));
}

watch(
  () => props.modelValue,
  (val) => {
    if (val !== digits.value.join('')) {
      syncFromModel(val ?? '');
    }
  },
  { immediate: true },
);

watch(
  () => props.length,
  (len) => {
    digits.value = Array.from({ length: len }, (_, i) => digits.value[i] ?? '');
  },
);

onMounted(() => {
  if (props.autofocus) {
    nextTick(() => focusInput(0));
  }
});

defineExpose({ clear, focusInput });
</script>

<style lang="less" scoped>
.verify-code-input {
  display: flex;
  gap: 12px;
  justify-content: center;

  &__box {
    width: 52px;
    height: 56px;
    padding: 0;
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    color: #333;
    background: #fff;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    outline: none;
    caret-color: var(--color-primary, #516bd9);
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      border-color: var(--color-primary, #516bd9);
      box-shadow: 0 0 0 3px rgba(81, 107, 217, 0.15);
    }

    &--filled {
      border-color: #b8c4f0;
      background: #f8f9fe;
    }

    &:disabled {
      background: #f5f5f5;
      color: #999;
      cursor: not-allowed;
    }
  }
}
</style>
