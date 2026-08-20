# Mock API 接口说明

## 统一返回格式

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
```

## RESTful 接口清单

| 模块 | 方法 | 地址 | 说明 |
|---|---|---|---|
| 计时器 | GET | `/api/timer/config` | 获取计时配置 |
| 计时器 | PUT | `/api/timer/config` | 保存计时配置 |
| 任务 | GET | `/api/task/list` | 获取任务列表 |
| 任务 | POST | `/api/task/add` | 新增任务 |
| 任务 | PUT | `/api/task/update` | 更新任务内容或状态 |
| 任务 | DELETE | `/api/task/delete` | 删除单条任务 |
| 打卡 | GET | `/api/clock/list` | 获取打卡记录 |
| 打卡 | POST | `/api/clock/add` | 提交当日打卡 |
| 统计 | GET | `/api/stat/week` | 获取近 7 天数据 |
| 统计 | GET | `/api/stat/month` | 获取近 30 天数据 |

默认由 `src/services/mock.js` 模拟以上接口。Apifox 联调只需通过环境变量替换基础地址，不需要修改组件代码。
