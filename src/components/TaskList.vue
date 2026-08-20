<script setup>
import { computed, ref } from 'vue'
import { Check, Edit3, ListTodo, Plus, Save, Target, Trash2 } from '@lucide/vue'

const props = defineProps({ tasks: { type: Array, required: true }, loading: Boolean })
const emit = defineEmits(['add', 'toggle', 'update', 'delete', 'clear', 'notify'])
const content = ref('')
const description = ref('')
const editingId = ref('')
const editContent = ref('')
const editDescription = ref('')
const completed = computed(() => props.tasks.filter((task) => task.status === '1').length)

function addTask() {
  if (!content.value.trim()) {
    emit('notify', '任务名称不能为空', 'error')
    return
  }
  emit('add', { content: content.value.trim(), description: description.value.trim() })
  content.value = ''
  description.value = ''
}

function beginEdit(task) {
  editingId.value = task.id
  editContent.value = task.content
  editDescription.value = task.description || ''
}

function saveEdit(task) {
  if (!editContent.value.trim()) {
    emit('notify', '任务名称不能为空', 'error')
    return
  }
  emit('update', { ...task, content: editContent.value.trim(), description: editDescription.value.trim() })
  editingId.value = ''
}

function clearAll() {
  if (props.tasks.length && window.confirm('确定清空全部学习任务吗？')) emit('clear')
}
</script>

<template>
  <section id="tasks" class="panel tasks-panel">
    <div class="section-head">
      <div><span class="section-kicker"><ListTodo :size="15" />学习任务</span><h2>今天准备完成什么？</h2></div>
      <button class="text-button danger" :disabled="!tasks.length" @click="clearAll"><Trash2 :size="15" />清空全部</button>
    </div>

    <form class="task-form" @submit.prevent="addTask">
      <div class="task-inputs">
        <input v-model="content" maxlength="80" placeholder="例如：完成高等数学第三章习题" aria-label="任务名称" />
        <input v-model="description" maxlength="120" placeholder="简要描述（可选）" aria-label="任务描述" />
      </div>
      <button type="submit" :disabled="loading"><Plus :size="19" />添加任务</button>
    </form>

    <div class="task-list" :aria-busy="loading">
      <div v-if="!tasks.length" class="empty">
        <div><Target :size="25" /></div><strong>清单还是空的</strong><span>写下第一个具体、可完成的小目标吧</span>
      </div>
      <article v-for="task in tasks" v-else :key="task.id" class="task-item" :class="{ done: task.status === '1' }">
        <button class="check" :aria-label="task.status === '1' ? '标记为未完成' : '标记为已完成'" @click="emit('toggle', task)">
          <Check v-if="task.status === '1'" :size="15" />
        </button>
        <div class="task-copy">
          <template v-if="editingId === task.id">
            <input v-model="editContent" class="edit-input" aria-label="编辑任务名称" @keyup.enter="saveEdit(task)" />
            <input v-model="editDescription" class="edit-input small" aria-label="编辑任务描述" @keyup.enter="saveEdit(task)" />
          </template>
          <template v-else><strong>{{ task.content }}</strong><span v-if="task.description">{{ task.description }}</span></template>
        </div>
        <div class="task-tools">
          <button v-if="editingId === task.id" aria-label="保存修改" @click="saveEdit(task)"><Save :size="16" /></button>
          <button v-else aria-label="编辑任务" @click="beginEdit(task)"><Edit3 :size="16" /></button>
          <button aria-label="删除任务" @click="emit('delete', task.id)"><Trash2 :size="16" /></button>
        </div>
      </article>
    </div>

    <div class="task-footer">
      <span>{{ tasks.length ? `已完成 ${completed} 项 · 还有 ${tasks.length - completed} 项待完成` : '专注，从清晰的目标开始' }}</span>
      <strong v-if="tasks.length">{{ Math.round(completed / tasks.length * 100) }}%</strong>
    </div>
  </section>
</template>
