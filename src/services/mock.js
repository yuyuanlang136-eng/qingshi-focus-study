import AxiosMockAdapter from 'axios-mock-adapter'
import { localRepository } from './localRepository'
import { recentDates, toDateKey } from '../utils/date'

const ok = (data, msg = '操作成功') => [200, { code: 200, msg, data }]

/**
 * 浏览器内 Mock API：接口地址、方法和返回结构与 Apifox 约定完全一致。
 * 联调 Apifox 时设置 VITE_USE_MOCK=false、VITE_API_BASE_URL=其 Mock 地址即可。
 */
export function installMockApi(client) {
  const mock = new AxiosMockAdapter(client, { delayResponse: 220 })

  mock.onGet('/timer/config').reply(() => ok(localRepository.getTimerConfig()))
  mock.onPut('/timer/config').reply((request) => ok(JSON.parse(request.data), '配置保存成功'))

  mock.onGet('/task/list').reply(() => ok(localRepository.getTasks()))
  mock.onPost('/task/add').reply((request) => ok(JSON.parse(request.data), '任务新增成功'))
  mock.onPut('/task/update').reply((request) => ok(JSON.parse(request.data), '任务更新成功'))
  mock.onDelete('/task/delete').reply((request) => ok(JSON.parse(request.data), '任务删除成功'))

  mock.onGet('/clock/list').reply(() => ok(localRepository.getClocks()))
  mock.onPost('/clock/add').reply((request) => ok(JSON.parse(request.data), '打卡成功'))

  const statistic = (days) => {
    const minutes = localRepository.getStudyMinutes()
    return recentDates(days).map((date) => ({ date: toDateKey(date), studyTime: minutes[toDateKey(date)] || 0 }))
  }
  mock.onGet('/stat/week').reply(() => ok(statistic(7)))
  mock.onGet('/stat/month').reply(() => ok(statistic(30)))

  return mock
}
