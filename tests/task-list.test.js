import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TaskList from '../src/components/TaskList.vue'

describe('TaskList', () => {
  it('阻止空任务提交并给出提示', async () => {
    const wrapper = mount(TaskList, { props: { tasks: [] } })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('notify')?.[0]).toEqual(['任务名称不能为空', 'error'])
  })

  it('提交去除首尾空格后的任务', async () => {
    const wrapper = mount(TaskList, { props: { tasks: [] } })
    await wrapper.find('input[aria-label="任务名称"]').setValue('  阅读论文  ')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('add')?.[0][0]).toEqual({ content: '阅读论文', description: '' })
  })
})
