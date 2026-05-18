<template>
  <div>
    <h3 text-center m-0 mb-20px>{{ t("login.reg") }}</h3>
    <el-form ref="formRef" :model="model" :rules="rules" size="large">
      <el-form-item prop="username">
        <el-input v-model.trim="model.username" :placeholder="t('login.username')">
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-tooltip :visible="isCapsLock" :content="t('login.capsLock')" placement="right">
        <el-form-item prop="password">
          <el-input
            v-model.trim="model.password"
            :placeholder="t('login.password')"
            type="password"
            show-password
            @keyup="checkCapsLock"
            @keyup.enter="submit"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-tooltip>

      <el-tooltip :visible="isCapsLock" :content="t('login.capsLock')" placement="right">
        <el-form-item prop="confirmPassword">
          <el-input
            v-model.trim="model.confirmPassword"
            :placeholder="t('login.message.password.confirm')"
            type="password"
            show-password
            @keyup="checkCapsLock"
            @keyup.enter="submit"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-tooltip>

      <el-form-item>
        <el-button :loading="loading" type="success" class="w-full" @click="submit">
          {{ t("login.register") }}
        </el-button>
      </el-form-item>
    </el-form>
    <div flex-center gap-10px>
      <el-text size="default">{{ t("login.haveAccount") }}</el-text>
      <el-link type="primary" underline="never" @click="toLogin">{{ t("login.login") }}</el-link>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { FormInstance } from "element-plus";
import { Lock } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";

const { t } = useI18n();
const emit = defineEmits(["update:modelValue"]);
const toLogin = () => emit("update:modelValue", "login");

const formRef = ref<FormInstance>();
const loading = ref(false);
const isCapsLock = ref(false);

const model = ref({
  username: "",
  password: "",
  confirmPassword: "",
});

const rules = computed(() => ({
  username: [{ required: true, trigger: "blur", message: t("login.message.username.required") }],
  password: [
    { required: true, trigger: "blur", message: t("login.message.password.required") },
    { min: 6, message: t("login.message.password.min"), trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, trigger: "blur", message: t("login.message.password.required") },
    { min: 6, message: t("login.message.password.min"), trigger: "blur" },
    {
      validator: (_: any, value: string) => value === model.value.password,
      trigger: "blur",
      message: t("login.message.password.inconformity"),
    },
  ],
}));

function checkCapsLock(event: KeyboardEvent) {
  if (event instanceof KeyboardEvent) {
    isCapsLock.value = event.getModifierState("CapsLock");
  }
}

const submit = async () => {
  await formRef.value?.validate();
  ElMessage.warning("注册功能开发中...");
};
</script>
