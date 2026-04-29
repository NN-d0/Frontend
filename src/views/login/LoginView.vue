<template>
  <div class="login-page">
    <div class="login-bg-grid"></div>
    <div class="login-bg-noise"></div>

    <div class="login-bg-blur blur-one"></div>
    <div class="login-bg-blur blur-two"></div>
    <div class="login-bg-blur blur-three"></div>

    <div class="login-aurora aurora-one"></div>
    <div class="login-aurora aurora-two"></div>
    <div class="login-sweep"></div>

    <div class="login-rings">
      <span class="ring ring-one"></span>
      <span class="ring ring-two"></span>
      <span class="ring ring-three"></span>
    </div>

    <div class="signal-particles">
      <span class="particle p1"></span>
      <span class="particle p2"></span>
      <span class="particle p3"></span>
      <span class="particle p4"></span>
      <span class="particle p5"></span>
      <span class="particle p6"></span>
    </div>

    <div class="login-shell">
      <div class="login-left">
        <div class="brand-panel">
          <div class="brand-panel-glow"></div>
          <div class="brand-panel-grid"></div>
          <div class="brand-panel-scan"></div>
          <div class="brand-corner corner-left-top"></div>
          <div class="brand-corner corner-right-bottom"></div>

          <div class="brand-topbar">
            <div class="brand-topbar-badge">毕业设计成果展示</div>
            <div class="brand-topbar-meta">
              <span class="meta-dot"></span>
              <span></span>
            </div>
          </div>

          <div class="brand-top">
            <img class="school-logo" :src="schoolLogo" alt="school-logo" />
            <div class="brand-text">
              <div class="brand-mini">本科毕业设计演示系统</div>
              <h1 class="brand-title">无线电频谱智能监测系统</h1>
              <div class="brand-subtitle">
                面向无线电频谱监测管理的可视化工作台
              </div>
            </div>
          </div>

          <div class="brand-desc">
            系统覆盖设备管理、任务调度、实时监测、历史回放、告警处置等核心流程
          </div>

          <div class="brand-kpi">
            <div class="kpi-card">
              <div class="kpi-label">微服务</div>
              <div class="kpi-value">3</div>
              <div class="kpi-desc">Gateway / System / Core</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">典型制式</div>
              <div class="kpi-value">5</div>
              <div class="kpi-desc">AM / FM / BPSK / QPSK / 16QAM</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">实时链路</div>
              <div class="kpi-value">WS</div>
              <div class="kpi-desc">WebSocket + 轮询兜底</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">智能识别</div>
              <div class="kpi-value">AI</div>
              <div class="kpi-desc">Python Flask 推理服务</div>
            </div>
          </div>

          <div class="brand-tags">
            <span class="brand-tag">Spring Boot</span>
            <span class="brand-tag">Vue3</span>
            <span class="brand-tag">WebSocket</span>
            <span class="brand-tag">MySQL</span>
            <span class="brand-tag">Redis</span>
            <span class="brand-tag">Python AI</span>
          </div>

          <div class="brand-points">
            <div class="point-item">
              <span class="point-dot"></span>
              <span>频谱态势总览与地图展示</span>
            </div>
            <div class="point-item">
              <span class="point-dot"></span>
              <span>实时监测与历史快照回放</span>
            </div>
            <div class="point-item">
              <span class="point-dot"></span>
              <span>告警中心与设备任务协同管理</span>
            </div>
          </div>

          <div class="brand-shot">
            <div class="brand-shot-title">功能预览</div>
            <div class="brand-shot-list">
              <span>首页总览</span>
              <span>实时频谱</span>
              <span>告警地图</span>
              <span>历史回放</span>
            </div>
          </div>

          <div class="brand-wave">
            <span class="wave-bar bar-1"></span>
            <span class="wave-bar bar-2"></span>
            <span class="wave-bar bar-3"></span>
            <span class="wave-bar bar-4"></span>
            <span class="wave-bar bar-5"></span>
            <span class="wave-bar bar-6"></span>
            <span class="wave-bar bar-7"></span>
            <span class="wave-bar bar-8"></span>
            <span class="wave-bar bar-9"></span>
            <span class="wave-bar bar-10"></span>
            <span class="wave-bar bar-11"></span>
            <span class="wave-bar bar-12"></span>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <div class="login-card-header">
            <div class="login-card-badge">管理员登录</div>
            <h2 class="login-card-title">欢迎进入系统</h2>
            <div class="login-card-subtitle">
              请输入管理员账号与密码登录 PC 工作台
            </div>
          </div>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            class="login-form"
            label-position="top"
            @keyup.enter="handleLogin"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="form.username"
                size="large"
                placeholder="请输入用户名"
                clearable
              >
                <template #prefix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                size="large"
                placeholder="请输入密码"
                show-password
                clearable
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <div class="form-extra">
              <el-checkbox v-model="rememberMe">记住本次账号</el-checkbox>
              <span class="form-tip">按 Enter 可直接登录</span>
            </div>

            <el-button
              type="primary"
              class="login-btn"
              size="large"
              :loading="loading"
              @click="handleLogin"
            >
              登录系统
            </el-button>
          </el-form>

          <div class="login-footer">
            <div class="footer-line"></div>
            <div class="footer-text">
              Radio Spectrum Monitor 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { loginApi } from '../../api/auth'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const rememberMe = ref(true)
const schoolLogo = '/images/school-logo.png'

const TOKEN_KEY = 'radio_token'
const USER_KEY = 'radio_user'

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const extractToken = (res) => {
  const data = res?.data ?? res

  return (
    data?.token ||
    data?.accessToken ||
    data?.jwt ||
    data?.access_token ||
    data?.data?.token ||
    data?.data?.accessToken ||
    data?.data?.jwt ||
    data?.data?.access_token ||
    (typeof data === 'string' ? data : '')
  )
}

const extractUserInfo = (res) => {
  const data = res?.data ?? res
  return data?.userInfo || data?.data?.userInfo || {}
}

const validateForm = async () => {
  if (!formRef.value) return false

  try {
    await formRef.value.validate()
    return true
  } catch (error) {
    return false
  }
}

const handleLogin = async () => {
  const valid = await validateForm()
  if (!valid) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  if (!form.username?.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }

  if (!form.password?.trim()) {
    ElMessage.warning('请输入密码')
    return
  }

  try {
    loading.value = true

    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)

    const res = await loginApi({
      username: form.username.trim(),
      password: form.password
    })

    const token = extractToken(res)
    const userInfo = extractUserInfo(res)

    if (!token) {
      ElMessage.error('登录成功，但未获取到 token，请检查后端返回结构')
      return
    }

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo || {}))

    if (rememberMe.value) {
      localStorage.setItem('radio_login_username', form.username.trim())
    } else {
      localStorage.removeItem('radio_login_username')
    }

    ElMessage.success('登录成功')
    router.replace('/overview')
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.msg || error?.message || '登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  document.title = '频谱智能监测系统'

  const savedUsername = localStorage.getItem('radio_login_username')
  if (savedUsername) {
    form.username = savedUsername
  }
})
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 18%, rgba(59, 130, 246, 0.2), transparent 24%),
    radial-gradient(circle at 82% 80%, rgba(16, 185, 129, 0.14), transparent 22%),
    radial-gradient(circle at 65% 30%, rgba(14, 165, 233, 0.08), transparent 18%),
    linear-gradient(120deg, #06101f 0%, #0a1730 35%, #0b2140 68%, #0a1530 100%);
}

.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(56, 189, 248, 0.05) 0%, transparent 18%, transparent 82%, rgba(96, 165, 250, 0.05) 100%);
  mix-blend-mode: screen;
  pointer-events: none;
}

.login-page::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at center, transparent 0%, transparent 56%, rgba(0, 0, 0, 0.18) 100%);
  pointer-events: none;
}

.login-bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 34px 34px;
  opacity: 0.28;
  mask-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.15));
}

.login-bg-noise {
  position: absolute;
  inset: 0;
  opacity: 0.06;
  background-image:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.9) 0.7px, transparent 1px),
    radial-gradient(circle at 80% 28%, rgba(255, 255, 255, 0.7) 0.7px, transparent 1px),
    radial-gradient(circle at 56% 72%, rgba(255, 255, 255, 0.6) 0.8px, transparent 1px),
    radial-gradient(circle at 12% 76%, rgba(255, 255, 255, 0.8) 0.7px, transparent 1px);
  background-size: 180px 180px, 220px 220px, 260px 260px, 240px 240px;
  animation: noiseFloat 18s linear infinite;
}

.login-bg-blur,
.login-aurora,
.login-sweep,
.login-rings,
.signal-particles {
  position: absolute;
  pointer-events: none;
}

.login-bg-blur {
  border-radius: 50%;
  filter: blur(95px);
  opacity: 0.6;
}

.blur-one {
  width: 380px;
  height: 380px;
  background: rgba(59, 130, 246, 0.28);
  top: 64px;
  left: 54px;
  animation: blobMoveA 14s ease-in-out infinite;
}

.blur-two {
  width: 300px;
  height: 300px;
  background: rgba(16, 185, 129, 0.16);
  right: 100px;
  bottom: 60px;
  animation: blobMoveB 16s ease-in-out infinite;
}

.blur-three {
  width: 240px;
  height: 240px;
  background: rgba(14, 165, 233, 0.16);
  left: 48%;
  top: 18%;
  animation: blobMoveC 12s ease-in-out infinite;
}

.login-aurora {
  border-radius: 999px;
  filter: blur(18px);
  mix-blend-mode: screen;
  opacity: 0.32;
}

.aurora-one {
  top: 12%;
  left: -8%;
  width: 55vw;
  height: 140px;
  background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.72), rgba(59, 130, 246, 0.12), transparent);
  transform: rotate(-9deg);
  animation: auroraFlow 12s ease-in-out infinite;
}

.aurora-two {
  bottom: 10%;
  right: -8%;
  width: 46vw;
  height: 120px;
  background: linear-gradient(90deg, transparent, rgba(45, 212, 191, 0.52), rgba(96, 165, 250, 0.22), transparent);
  transform: rotate(11deg);
  animation: auroraFlowReverse 15s ease-in-out infinite;
}

.login-sweep {
  top: 50%;
  left: 50%;
  width: 720px;
  height: 720px;
  transform: translate(-50%, -50%);
  opacity: 0.22;
}

.login-sweep::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    conic-gradient(from 240deg, transparent 0deg, transparent 280deg, rgba(34, 211, 238, 0.18) 314deg, rgba(34, 211, 238, 0.7) 336deg, rgba(59, 130, 246, 0.18) 352deg, transparent 360deg);
  filter: blur(4px);
  animation: radarRotate 10s linear infinite;
}

.login-rings {
  top: 52%;
  left: 48%;
  width: 700px;
  height: 700px;
  transform: translate(-50%, -50%);
  opacity: 0.4;
}

.ring {
  position: absolute;
  inset: 0;
  margin: auto;
  border-radius: 50%;
  border: 1px solid rgba(125, 211, 252, 0.14);
  box-shadow: inset 0 0 40px rgba(59, 130, 246, 0.03);
}

.ring-one {
  width: 700px;
  height: 700px;
}

.ring-two {
  width: 500px;
  height: 500px;
}

.ring-three {
  width: 300px;
  height: 300px;
}

.signal-particles {
  inset: 0;
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #7dd3fc;
  box-shadow: 0 0 14px rgba(125, 211, 252, 0.95);
  opacity: 0.75;
}

.p1 { top: 16%; left: 18%; animation: particlePulse 4.6s ease-in-out infinite; }
.p2 { top: 28%; left: 72%; animation: particlePulse 5.4s ease-in-out infinite 0.6s; }
.p3 { top: 72%; left: 16%; animation: particlePulse 5s ease-in-out infinite 1.1s; }
.p4 { top: 66%; left: 74%; animation: particlePulse 5.8s ease-in-out infinite 0.3s; }
.p5 { top: 44%; left: 58%; animation: particlePulse 4.8s ease-in-out infinite 1.6s; }
.p6 { top: 20%; left: 48%; animation: particlePulse 5.2s ease-in-out infinite 0.9s; }

.login-shell {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items: center;
  gap: 36px;
  padding: 36px 56px;
}

.login-left,
.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-panel {
  position: relative;
  width: 100%;
  max-width: 780px;
  padding: 24px 40px 34px;
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgba(20, 37, 67, 0.86) 0%, rgba(18, 32, 58, 0.8) 100%);
  border: 1px solid rgba(148, 163, 184, 0.16);
  backdrop-filter: blur(16px);
  box-shadow:
    0 28px 60px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.brand-panel-glow {
  position: absolute;
  top: -18%;
  right: -14%;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.24) 0%, rgba(59, 130, 246, 0.08) 38%, transparent 72%);
  filter: blur(14px);
  pointer-events: none;
}

.brand-panel-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.032) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.032) 1px, transparent 1px);
  background-size: 22px 22px;
  opacity: 0.26;
  mask-image: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.08));
  pointer-events: none;
}

.brand-panel-scan {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(56, 189, 248, 0.06) 50%, transparent 100%);
  transform: translateY(-110%);
  animation: panelScan 8s linear infinite;
  pointer-events: none;
}

.brand-corner {
  position: absolute;
  width: 64px;
  height: 64px;
  border-color: rgba(96, 165, 250, 0.72);
  opacity: 0.72;
}

.corner-left-top {
  top: 16px;
  left: 16px;
  border-left: 2px solid;
  border-top: 2px solid;
  border-top-left-radius: 18px;
}

.corner-right-bottom {
  right: 16px;
  bottom: 16px;
  border-right: 2px solid;
  border-bottom: 2px solid;
  border-bottom-right-radius: 18px;
}

.brand-topbar,
.brand-top,
.brand-desc,
.brand-kpi,
.brand-tags,
.brand-points,
.brand-shot,
.brand-wave {
  position: relative;
  z-index: 1;
}

.brand-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.brand-topbar-badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(34, 211, 238, 0.12);
  border: 1px solid rgba(34, 211, 238, 0.18);
  color: #d8f6ff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.brand-topbar-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #a9bfd8;
  font-size: 13px;
}

.meta-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.72);
}

.brand-top {
  display: flex;
  align-items: center;
  gap: 22px;
}

.school-logo {
  width: 96px;
  height: 96px;
  object-fit: contain;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  padding: 10px;
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.18);
  flex-shrink: 0;
}

.brand-text {
  min-width: 0;
}

.brand-mini {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.18);
  color: #cfe1ff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.brand-title {
  margin: 16px 0 0;
  font-size: 40px;
  line-height: 1.2;
  color: #ffffff;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.brand-subtitle {
  margin-top: 12px;
  font-size: 17px;
  color: #b8c7dc;
  line-height: 1.8;
}

.brand-desc {
  margin-top: 24px;
  font-size: 15px;
  line-height: 2;
  color: #d7e1ee;
}

.brand-kpi {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.kpi-card {
  padding: 14px 14px 12px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.44), rgba(12, 22, 38, 0.22));
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.kpi-label {
  font-size: 12px;
  color: #8fb2d8;
  letter-spacing: 0.3px;
}

.kpi-value {
  margin-top: 8px;
  font-size: 26px;
  line-height: 1;
  font-weight: 800;
  color: #ffffff;
}

.kpi-desc {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #b9cbe0;
}

.brand-tags {
  margin-top: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.brand-tag {
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #e9f1fb;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-points {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.point-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #dbe6f3;
  font-size: 15px;
}

.point-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #60a5fa, #22c55e);
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.65);
  flex-shrink: 0;
}

.brand-shot {
  margin-top: 24px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(90deg, rgba(15, 23, 42, 0.5), rgba(18, 48, 85, 0.24));
  border: 1px solid rgba(125, 211, 252, 0.12);
}

.brand-shot-title {
  font-size: 13px;
  font-weight: 700;
  color: #d9ecff;
}

.brand-shot-list {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.brand-shot-list span {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.1);
  color: #bae6fd;
  font-size: 12px;
  border: 1px solid rgba(56, 189, 248, 0.12);
}

.brand-wave {
  height: 56px;
  margin-top: 22px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 0 6px;
}

.wave-bar {
  flex: 1;
  min-width: 0;
  border-radius: 999px 999px 6px 6px;
  background: linear-gradient(180deg, rgba(34, 211, 238, 0.9), rgba(59, 130, 246, 0.82));
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.22);
  animation: waveDance 2.8s ease-in-out infinite;
  transform-origin: bottom center;
}

.bar-1 { height: 18px; animation-delay: 0.1s; }
.bar-2 { height: 28px; animation-delay: 0.25s; }
.bar-3 { height: 16px; animation-delay: 0.4s; }
.bar-4 { height: 36px; animation-delay: 0.55s; }
.bar-5 { height: 24px; animation-delay: 0.7s; }
.bar-6 { height: 46px; animation-delay: 0.85s; }
.bar-7 { height: 34px; animation-delay: 1s; }
.bar-8 { height: 20px; animation-delay: 1.15s; }
.bar-9 { height: 40px; animation-delay: 1.3s; }
.bar-10 { height: 26px; animation-delay: 1.45s; }
.bar-11 { height: 18px; animation-delay: 1.6s; }
.bar-12 { height: 30px; animation-delay: 1.75s; }

.login-card {
  position: relative;
  width: 100%;
  max-width: 480px;
  padding: 34px 32px 28px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(16px);
  box-shadow:
    0 30px 60px rgba(10, 25, 47, 0.22),
    0 0 0 1px rgba(255, 255, 255, 0.25) inset;
}

.login-card-header {
  text-align: left;
}

.login-card-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
}

.login-card-title {
  margin: 18px 0 0;
  font-size: 32px;
  color: #1f2a37;
  font-weight: 800;
  letter-spacing: 0.3px;
}

.login-card-subtitle {
  margin-top: 10px;
  font-size: 14px;
  color: #7b8aa0;
  line-height: 1.8;
}

.login-form {
  margin-top: 28px;
}

.login-form :deep(.el-form-item__label) {
  color: #5f6f86;
  font-weight: 700;
}

.login-form :deep(.el-input__wrapper) {
  min-height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 1px #dde6f2 inset !important;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #bfd5ef inset !important;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #3b82f6 inset !important;
  transform: translateY(-1px);
}

.form-extra {
  margin: 6px 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #7b8aa0;
  font-size: 13px;
}

.form-tip {
  color: #94a3b8;
}

.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  border: none;
  background: linear-gradient(135deg, #4da3ff 0%, #3b82f6 45%, #2d6de8 100%);
  box-shadow: 0 14px 26px rgba(59, 130, 246, 0.24);
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 32px rgba(59, 130, 246, 0.28);
}

.login-footer {
  margin-top: 24px;
}

.footer-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, #dbe5f1, transparent);
}

.footer-text {
  margin-top: 14px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  letter-spacing: 0.4px;
}

@keyframes radarRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes auroraFlow {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(-9deg) scaleX(1); opacity: 0.22; }
  50% { transform: translate3d(70px, 18px, 0) rotate(-6deg) scaleX(1.08); opacity: 0.38; }
}

@keyframes auroraFlowReverse {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(11deg) scaleX(1); opacity: 0.2; }
  50% { transform: translate3d(-60px, -14px, 0) rotate(8deg) scaleX(1.1); opacity: 0.34; }
}

@keyframes blobMoveA {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(36px, 22px, 0) scale(1.08); }
}

@keyframes blobMoveB {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-28px, -26px, 0) scale(1.12); }
}

@keyframes blobMoveC {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(16px, -20px, 0) scale(1.06); }
}

@keyframes particlePulse {
  0%, 100% { transform: scale(0.8); opacity: 0.35; }
  50% { transform: scale(1.8); opacity: 1; }
}

@keyframes noiseFloat {
  0% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(-12px, 8px, 0); }
  100% { transform: translate3d(0, 0, 0); }
}

@keyframes panelScan {
  0% { transform: translateY(-110%); opacity: 0; }
  8% { opacity: 1; }
  50% { opacity: 0.8; }
  100% { transform: translateY(110%); opacity: 0; }
}

@keyframes waveDance {
  0%, 100% { transform: scaleY(0.78); opacity: 0.72; }
  50% { transform: scaleY(1.18); opacity: 1; }
}

@media (max-width: 1200px) {
  .login-shell {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 26px 22px;
  }

  .brand-panel {
    max-width: 100%;
    padding: 24px 24px 28px;
  }

  .brand-topbar {
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .brand-top {
    align-items: flex-start;
  }

  .brand-title {
    font-size: 32px;
  }

  .brand-kpi {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .login-card {
    max-width: 100%;
  }

  .login-sweep,
  .login-rings {
    width: 560px;
    height: 560px;
  }

  .ring-one {
    width: 560px;
    height: 560px;
  }

  .ring-two {
    width: 400px;
    height: 400px;
  }

  .ring-three {
    width: 240px;
    height: 240px;
  }
}

@media (max-width: 768px) {
  .brand-top {
    flex-direction: column;
    gap: 16px;
  }

  .school-logo {
    width: 82px;
    height: 82px;
  }

  .brand-title {
    font-size: 28px;
  }

  .brand-subtitle {
    font-size: 15px;
  }

  .brand-kpi {
    grid-template-columns: 1fr;
  }

  .brand-shot-list {
    gap: 8px;
  }

  .login-card {
    padding: 28px 20px 22px;
  }

  .login-sweep,
  .login-rings,
  .aurora-one,
  .aurora-two {
    display: none;
  }

  .blur-one {
    width: 220px;
    height: 220px;
    left: -30px;
  }

  .blur-two {
    width: 180px;
    height: 180px;
    right: -20px;
    bottom: 40px;
  }

  .blur-three {
    width: 150px;
    height: 150px;
    left: 58%;
    top: 12%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-bg-noise,
  .login-bg-blur,
  .login-aurora,
  .login-sweep::before,
  .particle,
  .brand-panel-scan,
  .wave-bar {
    animation: none !important;
  }
}
</style>