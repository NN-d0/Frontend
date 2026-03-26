import axios from 'axios'
import { createRouter, createWebHashHistory } from 'vue-router'
import LoginView from '../views/login/LoginView.vue'
import LayoutView from '../views/layout/LayoutView.vue'
import OverviewView from '../views/overview/OverviewView.vue'
import DeviceManageView from '../views/device/DeviceManageView.vue'
import AlarmListView from '../views/alarm/AlarmListView.vue'
import AlarmMapView from '../views/alarm/AlarmMapView.vue'
import TaskScheduleView from '../views/task/TaskScheduleView.vue'
import SystemSettingsView from '../views/system/SystemSettingsView.vue'
import HistoryReplayView from '../views/history/HistoryReplayView.vue'
import RealtimeSpectrumView from '../views/realtime/RealtimeSpectrumView.vue'
import {
  clearAuthState,
  getToken,
  goHome,
  hasUsableToken,
  isTokenValidated,
  markTokenValidated
} from '../utils/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      title: '登录'
    }
  },
  {
    path: '/',
    component: LayoutView,
    redirect: '/overview',
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: 'overview',
        name: 'Overview',
        component: OverviewView,
        meta: {
          title: '态势总览',
          requiresAuth: true
        }
      },
      {
        path: 'monitor/realtime',
        name: 'RealtimeSpectrum',
        component: RealtimeSpectrumView,
        meta: {
          title: '实时频谱',
          requiresAuth: true
        }
      },
      {
        path: 'monitor/history',
        name: 'HistoryReplay',
        component: HistoryReplayView,
        meta: {
          title: '历史与回放',
          requiresAuth: true
        }
      },
      {
        path: 'alarm/list',
        name: 'AlarmList',
        component: AlarmListView,
        meta: {
          title: '告警列表',
          requiresAuth: true
        }
      },
      {
        path: 'alarm/map',
        name: 'AlarmMap',
        component: AlarmMapView,
        meta: {
          title: '告警地图',
          requiresAuth: true
        }
      },
      {
        path: 'device/manage',
        name: 'DeviceManage',
        component: DeviceManageView,
        meta: {
          title: '设备管理',
          requiresAuth: true
        }
      },
      {
        path: 'device/list',
        redirect: '/device/manage'
      },
      {
        path: 'task/schedule',
        name: 'TaskSchedule',
        component: TaskScheduleView,
        meta: {
          title: '任务调度',
          requiresAuth: true
        }
      },
      {
        path: 'task/list',
        redirect: '/task/schedule'
      },
      {
        path: 'system/settings',
        name: 'SystemSettings',
        component: SystemSettingsView,
        meta: {
          title: '告警阈值设置',
          requiresAuth: true
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const authValidator = axios.create({
  baseURL: '/api',
  timeout: 8000
})

async function validateTokenOnce() {
  const token = getToken()

  if (!hasUsableToken()) {
    return false
  }

  if (isTokenValidated(token)) {
    return true
  }

  try {
    await authValidator.get('/system/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    markTokenValidated(token)
    return true
  } catch (error) {
    clearAuthState()
    return false
  }
}

router.beforeEach(async (to, from, next) => {
  document.title = `${to.meta?.title || '无线电频谱智能监测系统'} - 无线电频谱智能监测系统`

  if (to.path === '/login') {
    if (hasUsableToken()) {
      const valid = await validateTokenOnce()
      if (valid) {
        goHome()
        next('/overview')
        return
      }
    }
    next()
    return
  }

  if (to.meta?.requiresAuth) {
    if (!hasUsableToken()) {
      clearAuthState()
      next('/login')
      return
    }

    const valid = await validateTokenOnce()
    if (!valid) {
      next('/login')
      return
    }
  }

  next()
})

export default router