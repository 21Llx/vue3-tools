<template>
  <div class="verify-code-page">
    <header class="verify-code-page__header">
      <Button type="text" @click="goBack">← 返回</Button>
    </header>

    <main class="verify-code-page__main">
      <h1 class="verify-code-page__title">输入验证码</h1>
      <p class="verify-code-page__desc">请输入 5 位数字验证码，输完一位自动跳转下一位</p>

      <VerifyCodeInput
        ref="codeInputRef"
        v-model="code"
        :length="5"
        @complete="onComplete"
      />

      <p v-if="code.length > 0 && code.length < 5" class="verify-code-page__progress">
        已输入 {{ code.length }} / 5
      </p>

      <div class="verify-code-page__actions">
        <Button :disabled="!code" @click="handleClear">清空</Button>
        <Button type="primary" :disabled="code.length !== 5" @click="handleSubmit">
          确认
        </Button>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Button, message } from 'ant-design-vue';
import VerifyCodeInput from '@/components/verify-code/VerifyCodeInput.vue';

const router = useRouter();
const code = ref('');
const codeInputRef = ref<InstanceType<typeof VerifyCodeInput>>();

function goBack() {
  router.push('/home');
}

function onComplete(value: string) {
  message.success(`验证码已输入完成：${value}`);
}

function handleClear() {
  code.value = '';
  codeInputRef.value?.clear();
}

function handleSubmit() {
  if (code.value.length !== 5) {
    message.warning('请输入完整的 5 位验证码');
    return;
  }
  message.success(`提交成功，验证码：${code.value}`);
}
</script>

<style lang="less" scoped>
.verify-code-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f3ff 0%, #f5f6f8 40%, #fff 100%);

  &__header {
    padding: 12px 8px;
  }

  &__main {
    max-width: 420px;
    margin: 0 auto;
    padding: 24px 20px 40px;
    text-align: center;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 600;
    color: #333;
  }

  &__desc {
    margin: 0 0 36px;
    font-size: 14px;
    color: #888;
    line-height: 1.5;
  }

  &__progress {
    margin: 20px 0 0;
    font-size: 13px;
    color: var(--color-primary, #516bd9);
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 32px;
  }
}
</style>
