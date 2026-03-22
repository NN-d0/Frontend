<template>
  <el-container class="layout-shell">
    <el-aside width="236px" class="layout-aside">
      <div class="brand-box">
        <div class="brand-logo-stage">
          <div class="brand-logo-frame">
            <img class="brand-school-logo" src="/images/school-logo.png" alt="学校标识" />
          </div>
        </div>
      </div>

      <div class="menu-wrap">
        <el-menu
          class="side-menu"
          :default-active="route.path"
          :default-openeds="defaultOpeneds"
          background-color="transparent"
          text-color="#8ea3c0"
          active-text-color="#ffffff"
          @select="handleMenuSelect"
        >
          <el-sub-menu index="overview-group">
            <template #title>
              <el-icon><Monitor /></el-icon>
              <span>首页总览</span>
            </template>
            <el-menu-item index="/overview">态势总览</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="monitor-group">
            <template #title>
              <el-icon><DataLine /></el-icon>
              <span>监测工作台</span>
            </template>
            <el-menu-item index="/monitor/realtime">实时频谱</el-menu-item>
            <el-menu-item index="/monitor/history">历史与回放</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="alarm-group">
            <template #title>
              <el-icon><Bell /></el-icon>
              <span>告警中心</span>
            </template>
            <el-menu-item index="/alarm/list">告警列表</el-menu-item>
            <el-menu-item index="/alarm/map">告警地图</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="device-group">
            <template #title>
              <el-icon><Cpu /></el-icon>
              <span>设备与任务</span>
            </template>
            <el-menu-item index="/device/manage">设备管理</el-menu-item>
            <el-menu-item index="/task/schedule">任务调度</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="system-group">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/system/settings">全局设置</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>
    </el-aside>

    <el-container class="layout-main-wrap">
      <div v-if="isOverviewPage" class="overview-system-bar">
        <div class="overview-system-head">
          <div class="overview-system-icon">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="overview-system-copy">
            <div class="overview-system-kicker">INTELLIGENT SPECTRUM MONITORING</div>
            <div class="overview-system-title">智能频谱监测系统</div>
            <div class="overview-system-subtitle">智能感知 · 实时预警 · 态势联动</div>
          </div>
        </div>
        <div class="overview-system-tag">OVERVIEW</div>
      </div>

      <el-header class="layout-header" :class="{ 'layout-header--with-system-title': isOverviewPage }">
        <div class="header-left">
          <div class="page-title">{{ pageTitle }}</div>
          <div class="page-subtitle">无线电频谱智能监测系统 </div>
        </div>

        <div class="header-right">
          <div class="profile-entry" @click="openProfileDialog">
            <el-avatar :size="42" :src="profile.avatarUrl || ''" class="header-avatar">
              {{ profileInitial }}
            </el-avatar>
            <div class="profile-text">
              <div class="profile-main">{{ profile.nickName || '个人设置中心' }}</div>
              <div class="profile-sub">{{ profile.username || 'admin' }}</div>
            </div>
          </div>

          <el-button class="logout-btn" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>

    <el-dialog
      v-model="profileDialogVisible"
      title="个人设置中心"
      width="980px"
      top="6vh"
      class="profile-center-dialog"
    >
      <div class="profile-center-shell">
        <div class="profile-left-panel">
          <div class="profile-cover"></div>

          <div class="profile-avatar-wrap">
            <el-avatar :size="96" :src="profileForm.avatarUrl || ''" class="profile-avatar-large">
              {{ profileFormInitial }}
            </el-avatar>
          </div>

          <div class="profile-user-name">{{ profileForm.nickName || profileForm.username || '管理员' }}</div>
          <div class="profile-user-account">{{ profileForm.username || 'admin' }}</div>

          <div class="profile-upload-box">
            <input
              ref="avatarInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleAvatarFileChange"
            />
            <el-button type="primary" plain @click="triggerAvatarSelect">本地上传头像</el-button>
            <div class="profile-upload-tip">支持 JPG / PNG，大小不超过 2MB</div>
          </div>

          <div class="profile-left-tips">
            <div class="tip-item">
              <span class="tip-dot"></span>
              上传头像后会先在当前弹窗中预览
            </div>
            <div class="tip-item">
              <span class="tip-dot"></span>
              修改用户名后，为保证登录状态一致，将自动退出重新登录
            </div>
            <div class="tip-item">
              <span class="tip-dot"></span>
              密码修改成功后，后续登录请使用新密码
            </div>
          </div>
        </div>

        <div class="profile-right-panel">
          <el-card class="profile-section-card" shadow="never">
            <template #header>
              <div class="section-header">
                <div class="section-title">基本资料</div>
                <div class="section-subtitle">修改管理员的基本信息与头像</div>
              </div>
            </template>

            <el-form
              ref="profileFormRef"
              :model="profileForm"
              :rules="profileRules"
              label-width="88px"
              class="profile-form"
            >
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="用户名" prop="username">
                    <el-input v-model="profileForm.username" placeholder="请输入用户名" />
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="昵称" prop="nickName">
                    <el-input v-model="profileForm.nickName" placeholder="请输入昵称" />
                  </el-form-item>
                </el-col>
              </el-row>

              <div class="form-actions">
                <el-button type="primary" :loading="profileLoading" @click="handleSaveProfile">
                  保存基本资料
                </el-button>
              </div>
            </el-form>
          </el-card>

          <el-card class="profile-section-card" shadow="never">
            <template #header>
              <div class="section-header">
                <div class="section-title">修改密码</div>
                <div class="section-subtitle">建议定期更换管理员密码</div>
              </div>
            </template>

            <el-form
              ref="passwordFormRef"
              :model="passwordForm"
              :rules="passwordRules"
              label-width="100px"
              class="password-form"
            >
              <el-row :gutter="16">
                <el-col :span="24">
                  <el-form-item label="原密码" prop="oldPassword">
                    <el-input
                      v-model="passwordForm.oldPassword"
                      type="password"
                      show-password
                      placeholder="请输入原密码"
                    />
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="新密码" prop="newPassword">
                    <el-input
                      v-model="passwordForm.newPassword"
                      type="password"
                      show-password
                      placeholder="请输入新密码"
                    />
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="确认密码" prop="confirmPassword">
                    <el-input
                      v-model="passwordForm.confirmPassword"
                      type="password"
                      show-password
                      placeholder="请再次输入新密码"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <div class="form-actions">
                <el-button type="primary" :loading="passwordLoading" @click="handleChangePassword">
                  修改密码
                </el-button>
              </div>
            </el-form>
          </el-card>
        </div>
      </div>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, Cpu, DataLine, Monitor, Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getCurrentUserProfileApi,
  updateCurrentUserPasswordApi,
  updateCurrentUserProfileApi
} from '../../api/user'

const router = useRouter()
const route = useRoute()

const defaultOpeneds = ['overview-group', 'monitor-group', 'alarm-group', 'device-group', 'system-group']

const profileDialogVisible = ref(false)
const profileLoading = ref(false)
const passwordLoading = ref(false)
const profileFormRef = ref(null)
const passwordFormRef = ref(null)
const avatarInputRef = ref(null)

const profile = reactive({
  username: '',
  nickName: '',
  avatarUrl: ''
})

const profileForm = reactive({
  username: '',
  nickName: '',
  avatarUrl: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const profileRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickName: [{ required: true, message: '请输入昵称', trigger: 'blur' }]
}

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请输入确认密码', trigger: 'blur' }]
}

const pageTitle = computed(() => route.meta?.title || '无线电频谱智能监测系统')
const isOverviewPage = computed(() => route.path === '/overview')

const profileInitial = computed(() => {
  const text = profile.nickName || profile.username || '管'
  return String(text).trim().charAt(0).toUpperCase()
})

const profileFormInitial = computed(() => {
  const text = profileForm.nickName || profileForm.username || '管'
  return String(text).trim().charAt(0).toUpperCase()
})

const handleMenuSelect = (index) => {
  if (route.path !== index) {
    router.push(index)
  }
}

const loadProfile = async () => {
  try {
    const res = await getCurrentUserProfileApi()
    const data = res.data || {}

    profile.username = data.username || ''
    profile.nickName = data.nickName || ''
    profile.avatarUrl = data.avatarUrl || ''

    profileForm.username = profile.username
    profileForm.nickName = profile.nickName
    profileForm.avatarUrl = profile.avatarUrl
  } catch (error) {
    console.error(error)
  }
}

const openProfileDialog = async () => {
  await loadProfile()
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  profileDialogVisible.value = true
}

const triggerAvatarSelect = () => {
  avatarInputRef.value?.click()
}

const handleAvatarFileChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.warning('只能上传图片文件')
    event.target.value = ''
    return
  }

  if (!isLt2M) {
    ElMessage.warning('图片大小不能超过 2MB')
    event.target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    profileForm.avatarUrl = e.target?.result || ''
    ElMessage.success('头像已加载，请点击“保存基本资料”正式保存')
  }
  reader.readAsDataURL(file)

  event.target.value = ''
}

const handleSaveProfile = async () => {
  await profileFormRef.value.validate()

  const oldUsername = profile.username

  try {
    profileLoading.value = true

    await updateCurrentUserProfileApi({
      username: profileForm.username,
      nickName: profileForm.nickName,
      avatarUrl: profileForm.avatarUrl
    })

    ElMessage.success('个人资料保存成功')

    const usernameChanged = oldUsername && oldUsername !== profileForm.username

    if (usernameChanged) {
      ElMessage.success('用户名已修改，请重新登录后继续使用')
      setTimeout(() => {
        handleLogout()
      }, 1200)
      return
    }

    await loadProfile()
    profileDialogVisible.value = false
  } finally {
    profileLoading.value = false
  }
}

const handleChangePassword = async () => {
  await passwordFormRef.value.validate()

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }

  try {
    passwordLoading.value = true

    await updateCurrentUserPasswordApi({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword
    })

    ElMessage.success('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } finally {
    passwordLoading.value = false
  }
}

const handleLogout = () => {
  localStorage.removeItem('radio_token')
  router.replace('/login')
}

onMounted(async () => {
  await loadProfile()
})
</script>

<style>
:root {
  --oai-bg: #f3f6fb;
  --oai-card: rgba(255, 255, 255, 0.92);
  --oai-border: #e7edf5;
  --oai-text: #1f2a37;
  --oai-subtext: #7b8aa0;
  --oai-primary: #3b82f6;
  --oai-success: #67c23a;
  --oai-warning: #e6a23c;
  --oai-danger: #f56c6c;
  --oai-radius-lg: 20px;
  --oai-radius-md: 14px;
  --oai-shadow: 0 12px 30px rgba(31, 42, 55, 0.08);
}

html,
body,
#app {
  margin: 0;
  height: 100%;
  background: linear-gradient(180deg, #f5f8fc 0%, #eef3f9 100%);
  color: var(--oai-text);
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

* {
  box-sizing: border-box;
}

.layout-shell {
  height: 100vh;
  background: linear-gradient(180deg, #f5f8fc 0%, #eef3f9 100%);
}

.layout-aside {
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 28%),
    linear-gradient(180deg, #081222 0%, #09172a 52%, #08111f 100%);
  color: #fff;
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.03);

  display: flex;
  flex-direction: column;
}

.layout-main-wrap {
  min-width: 10px;
}

.brand-box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 20px;
  margin: 18px 16px 8px;
  min-height: 130px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top, rgba(78, 145, 255, 0.26), transparent 55%),
    linear-gradient(180deg, rgba(18, 37, 66, 0.96) 0%, rgba(10, 24, 44, 0.94) 100%);
  border: 1px solid rgba(130, 170, 255, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 16px 32px rgba(3, 10, 24, 0.3);
}

.brand-logo-stage {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo-frame {
  width: 170px;
  height: 170px;
  padding: 10px;
  border-radius: 36px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(243, 247, 255, 0.96) 100%);
  border: 1px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 36px rgba(7, 20, 42, 0.34), 0 0 0 10px rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-school-logo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: contrast(1.15) saturate(1.15);
}

.brand-logo {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, #5ea2ff, #2d6df6);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  box-shadow: 0 12px 24px rgba(45, 109, 246, 0.28);
}

.brand-content {
  min-width: 0;
}

.brand-title {
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.brand-sub {
  margin-top: 5px;
  font-size: 12px;
  color: #9ab0ca;
  letter-spacing: 1px;
}

.menu-wrap {
  padding: 10px 12px 18px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.side-menu {
  border-right: none;
  background: transparent;
}

.side-menu .el-sub-menu__title {
  height: 56px;
  line-height: 56px;
  margin: 6px 8px;
  border-radius: 14px;
  color: #8ea3c0 !important;
  font-size: 15px;
  font-weight: 700;
  transition: all 0.22s ease;
}

.side-menu .el-sub-menu__title:hover {
  background: rgba(255, 255, 255, 0.06) !important;
  color: #ffffff !important;
}

.side-menu .el-sub-menu.is-opened > .el-sub-menu__title {
  background: rgba(59, 130, 246, 0.12) !important;
  color: #ffffff !important;
}

.side-menu .el-menu {
  background: transparent !important;
}

.side-menu .el-menu-item {
  position: relative;
  margin: 4px 8px 4px 18px;
  height: 42px;
  border-radius: 12px;
  color: #91a6c0 !important;
  font-size: 14px;
  transition: all 0.22s ease;
}

.side-menu .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.06) !important;
  color: #ffffff !important;
}

.side-menu .el-menu-item.is-active {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.22), rgba(59, 130, 246, 0.08)) !important;
  color: #ffffff !important;
  font-weight: 700;
}

.side-menu .el-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 8px;
  width: 4px;
  height: 26px;
  border-radius: 999px;
  background: linear-gradient(180deg, #71b0ff 0%, #2d6df6 100%);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.45);
}

.overview-system-bar {
  height: 200px;
  margin: 14px 18px 0;
  padding: 0 24px;
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(9, 28, 54, 0.98) 0%, rgba(18, 57, 110, 0.94) 52%, rgba(38, 106, 205, 0.9) 100%);
  border: 1px solid rgba(126, 174, 255, 0.2);
  box-shadow: 0 18px 36px rgba(15, 45, 92, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  position: relative;
}

.overview-system-bar::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at left center, rgba(255, 255, 255, 0.16), transparent 28%),
    radial-gradient(circle at right top, rgba(255, 255, 255, 0.14), transparent 22%);
  pointer-events: none;
}

.overview-system-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}

.overview-system-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.12));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.overview-system-copy {
  display: flex;
  flex-direction: column;
}

.overview-system-kicker {
  font-size: 11px;
  line-height: 1;
  letter-spacing: 1.8px;
  color: rgba(221, 234, 255, 0.78);
}

.overview-system-title {
  margin-top: 7px;
  font-size: 30px;
  line-height: 1;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.8px;
}

.overview-system-subtitle {
  margin-top: 8px;
  font-size: 13px;
  color: rgba(230, 239, 255, 0.82);
}

.overview-system-tag {
  position: relative;
  z-index: 1;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
}

.layout-header {
  height: 78px;
  margin: 14px 18px 0;
  padding: 0 22px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(231, 237, 245, 0.9);
  box-shadow: var(--oai-shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.layout-header--with-system-title {
  margin-top: 12px;
}

.header-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #1f2a37;
  letter-spacing: 0.3px;
}

.page-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: #8a97ab;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.profile-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 14px 8px 10px;
  border-radius: 18px;
  border: 1px solid #e8eef6;
  background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
  box-shadow: 0 10px 22px rgba(31, 42, 55, 0.06);
  transition: all 0.22s ease;
}

.profile-entry:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(31, 42, 55, 0.1);
}

.header-avatar {
  box-shadow: 0 10px 18px rgba(59, 130, 246, 0.18);
}

.profile-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.profile-main {
  font-size: 15px;
  color: #1f2a37;
  font-weight: 700;
}

.profile-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #8a97ab;
}

.logout-btn {
  height: 42px;
  padding: 0 16px;
  border-radius: 14px;
  color: #f56c6c;
  border-color: #f6d3d3;
  background: #fff8f8;
}

.logout-btn:hover {
  color: #f56c6c;
  border-color: #efb7b7;
  background: #fff3f3;
}

.layout-main {
  padding: 18px;
  overflow: auto;
}

.page-container {
  padding: 0;
}

.page-card,
.overview-card {
  border: 1px solid rgba(231, 237, 245, 0.95) !important;
  border-radius: 22px !important;
  background: rgba(255, 255, 255, 0.88) !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 14px 30px rgba(31, 42, 55, 0.06) !important;
  overflow: hidden;
}

.page-card .el-card__header,
.overview-card .el-card__header {
  border-bottom: 1px solid #eef3f8;
  padding: 18px 22px;
}

.page-card .el-card__body,
.overview-card .el-card__body {
  padding: 18px 22px;
}

.metric-title {
  color: #8b98ac;
  font-size: 14px;
  font-weight: 600;
}

.metric-value {
  margin-top: 12px;
  font-size: 36px;
  line-height: 1;
  font-weight: 800;
  color: #1f2a37;
  letter-spacing: 0.4px;
}

.metric-sub {
  margin-top: 12px;
  color: #7fbf5b;
  font-size: 14px;
  font-weight: 600;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.map-box {
  width: 100%;
  height: 390px;
  border-radius: 18px;
  overflow: hidden;
}

.chart-box {
  width: 100%;
  height: 390px;
}

.pagination-wrap {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}

.el-button {
  border-radius: 12px !important;
  font-weight: 600;
}

.el-input__wrapper,
.el-select__wrapper,
.el-textarea__inner,
.el-input-number,
.el-picker__popper,
.el-date-editor.el-input__wrapper {
  border-radius: 12px !important;
}

.el-input__wrapper,
.el-select__wrapper {
  min-height: 40px;
  box-shadow: 0 0 0 1px #e4ebf4 inset !important;
}

.el-input__wrapper.is-focus,
.el-select__wrapper.is-focused {
  box-shadow: 0 0 0 1px #3b82f6 inset !important;
}

.el-textarea__inner {
  border: 1px solid #e4ebf4;
  box-shadow: none !important;
}

.el-form-item__label {
  color: #5e6b7f !important;
  font-weight: 700;
}

.el-table {
  border-radius: 18px;
  overflow: hidden;
}

.el-table th.el-table__cell {
  background: #f7fafe !important;
  color: #5d6a7d;
  font-weight: 700;
}

.el-table tr {
  transition: background 0.2s ease;
}

.el-table .el-table__row:hover > td.el-table__cell {
  background: #f8fbff !important;
}

.el-pagination .btn-prev,
.el-pagination .btn-next,
.el-pagination .el-pager li {
  border-radius: 10px !important;
}

.el-dialog {
  border-radius: 26px !important;
  overflow: hidden;
}

.el-dialog__header {
  padding: 22px 24px 14px;
  border-bottom: 1px solid #eef3f8;
}

.el-dialog__title {
  font-size: 20px;
  font-weight: 800;
  color: #1f2a37;
}

.el-dialog__body {
  padding: 22px 24px !important;
}

.el-dialog__footer {
  padding: 14px 24px 22px !important;
  border-top: 1px solid #eef3f8;
}

.el-tabs__item {
  font-weight: 700;
}

.el-tabs__active-bar {
  height: 3px;
  border-radius: 999px;
}

.profile-center-shell {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
}

.profile-left-panel {
  position: relative;
  padding: 0 20px 22px;
  border-radius: 24px;
  background: linear-gradient(180deg, #ffffff 0%, #f7faff 100%);
  border: 1px solid #e7edf5;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;
}

.profile-cover {
  height: 110px;
  margin: 0 -20px;
  background:
    radial-gradient(circle at 20% 20%, rgba(96, 165, 250, 0.35), transparent 35%),
    linear-gradient(135deg, #dceeff 0%, #eef5ff 50%, #f9fbff 100%);
  border-bottom: 1px solid #eef3f8;
}

.profile-avatar-wrap {
  display: flex;
  justify-content: center;
  margin-top: -48px;
}

.profile-avatar-large {
  border: 5px solid #ffffff;
  box-shadow: 0 16px 30px rgba(59, 130, 246, 0.18);
}

.profile-user-name {
  margin-top: 16px;
  text-align: center;
  font-size: 22px;
  font-weight: 800;
  color: #1f2a37;
}

.profile-user-account {
  margin-top: 6px;
  text-align: center;
  color: #8a97ab;
  font-size: 13px;
}

.profile-upload-box {
  margin-top: 20px;
  text-align: center;
}

.profile-upload-tip {
  margin-top: 10px;
  color: #98a6ba;
  font-size: 12px;
}

.profile-left-tips {
  margin-top: 24px;
  padding: 14px 14px 6px;
  border-radius: 16px;
  background: #f7faff;
  border: 1px solid #edf3fb;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
  color: #637086;
  font-size: 13px;
  line-height: 1.7;
}

.tip-dot {
  width: 8px;
  height: 8px;
  margin-top: 7px;
  border-radius: 50%;
  background: #3b82f6;
  flex-shrink: 0;
}

.profile-right-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.profile-section-card {
  border-radius: 22px !important;
  border: 1px solid #e7edf5 !important;
  box-shadow: none !important;
  overflow: hidden;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title {
  font-size: 18px;
  font-weight: 800;
  color: #1f2a37;
}

.section-subtitle {
  font-size: 13px;
  color: #8a97ab;
}

.profile-form,
.password-form {
  padding-top: 6px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.beauty-popup .leaflet-popup-content-wrapper {
  border-radius: 16px;
  box-shadow: 0 14px 30px rgba(31, 42, 55, 0.16);
}

.beauty-popup .leaflet-popup-tip {
  box-shadow: none;
}

::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}

::-webkit-scrollbar-thumb {
  background: rgba(137, 154, 179, 0.4);
  border-radius: 999px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

@media (max-width: 1200px) {
  .profile-center-shell {
    grid-template-columns: 1fr;
  }
}
</style>