import { createRouter, createWebHashHistory } from 'vue-router'
import LoginView from '../views/login/LoginView.vue'
import LayoutView from '../views/layout/LayoutView.vue'
import OverviewView from '../views/overview/OverviewView.vue'
import PlaceholderView from '../views/placeholder/PlaceholderView.vue'
import DeviceManageView from '../views/device/DeviceManageView.vue'
import AlarmListView from '../views/alarm/AlarmListView.vue'
import AlarmMapView from '../views/alarm/AlarmMapView.vue'
import TaskScheduleView from '../views/task/TaskScheduleView.vue'
import SystemSettingsView from '../views/system/SystemSettingsView.vue'
import HistoryReplayView from '../views/history/HistoryReplayView.vue'
import RealtimeSpectrumView from '../views/realtime/RealtimeSpectrumView.vue'

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
        path: 'task/schedule',
        name: 'TaskSchedule',
        component: TaskScheduleView,
        meta: {
          title: '任务调度',
          requiresAuth: true
        }
      },
      {
        path: 'system/settings',
        name: 'SystemSettings',
        component: SystemSettingsView,
        meta: {
          title: '全局设置',
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

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('radio_token')
  document.title = `${to.meta?.title || '无线电频谱智能监测系统'} - 无线电频谱智能监测系统`

  if (to.meta?.requiresAuth && !token) {
    next('/login')
    return
  }

  if (to.path === '/login' && token) {
    next('/overview')
    return
  }

  next()
})

export default router