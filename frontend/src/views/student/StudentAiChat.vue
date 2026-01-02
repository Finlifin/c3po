<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentAuthStore } from '../../stores/auth_student'
import PageContainer from '../../components/layout/PageContainer.vue'
import { ElMessage, ElInput, ElButton, ElScrollbar, ElCard, ElDivider, ElEmpty, ElIcon } from 'element-plus'
import { Delete as DeleteIcon } from '@element-plus/icons-vue'
import request from '../../utils/request'

const router = useRouter()
const authStore = useStudentAuthStore()

// User data
const user = computed(() => authStore.user)

// Chat data
const messages = ref<any[]>([])
const inputContent = ref('')
const loading = ref(false)
const conversations = ref<any[]>([])
const selectedConversationId = ref<string | null>(null)
const showConversationList = ref(false)

// Message interface
interface Message {
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt?: string
  isUser?: boolean
}

// Context data
const context = ref({
  studentId: user.value?.id
})

// Preferences
const preferences = ref({
  language: 'zh-CN',
  style: 'EDUCATIONAL',
  maxLength: 2000,
  includeReferences: true,
  includeSuggestions: true
})

// Fetch conversations
const fetchConversations = async () => {
  try {
    const response = await request.get('http://10.70.141.134:8080/api/v1/assistant/conversations')
    conversations.value = response.data.data || []
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '获取对话列表失败')
  }
}

// Fetch conversation messages
const fetchConversationMessages = async (conversationId: string) => {
  try {
    loading.value = true
    const response = await request.get(`http://10.70.141.134:8080/api/v1/assistant/conversations/${conversationId}/messages`)
    messages.value = response.data.data.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
      isUser: msg.role === 'USER'
    }))
    selectedConversationId.value = conversationId
    // 移除这行代码，点击历史会话后保留会话列表
    // showConversationList.value = false
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '获取对话消息失败')
  } finally {
    loading.value = false
  }
}

// Send message to AI assistant
const sendMessage = async () => {
  if (!inputContent.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }

  // Add user message to list
  const userMessage: Message = {
    role: 'USER',
    content: inputContent.value.trim(),
    isUser: true
  }
  messages.value.push(userMessage)
  
  // Clear input
  const tempInput = inputContent.value
  inputContent.value = ''
  
  try {
    loading.value = true
    
    // Prepare request data
    const requestData = {
      context: context.value,
      messages: messages.value.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      preferences: preferences.value,
      // 添加会话ID到请求中，当在历史会话中发送消息时
      conversationId: selectedConversationId.value
    }
    
    // Send request to AI assistant
    const response = await request.post('http://10.70.141.134:8080/api/v1/assistant/chat', requestData)
    
    // Add assistant response to list
    if (response.data.success) {
      const assistantMessage: Message = {
        role: 'ASSISTANT',
        content: response.data.data.answer,
        isUser: false
      }
      messages.value.push(assistantMessage)
      
      // Update selected conversation ID if needed
      if (response.data.data.conversationId && !selectedConversationId.value) {
        selectedConversationId.value = response.data.data.conversationId
        await fetchConversations()
      }
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '发送消息失败')
    // Remove user message if request failed
    messages.value.pop()
    inputContent.value = tempInput
  } finally {
    loading.value = false
  }
}

// Start new conversation
const startNewConversation = () => {
  messages.value = []
  selectedConversationId.value = null
  showConversationList.value = false
}

// Toggle conversation list
const toggleConversationList = () => {
  showConversationList.value = !showConversationList.value
  if (showConversationList.value) {
    fetchConversations()
  }
}

// Delete a single conversation
const deleteConversation = async (conversationId: string) => {
  try {
    await request.delete(`http://10.70.141.134:8080/api/v1/assistant/conversations/${conversationId}`)
    ElMessage.success('对话已删除')
    
    // Remove from conversations list
    conversations.value = conversations.value.filter(c => c.id !== conversationId)
    
    // If deleting current conversation, start new one
    if (selectedConversationId.value === conversationId) {
      startNewConversation()
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '删除对话失败')
  }
}

// Clear all conversations
const clearAllConversations = async () => {
  try {
    await request.delete('http://10.70.141.134:8080/api/v1/assistant/conversations')
    ElMessage.success('所有对话已清除')
    
    // Clear conversations list and start new conversation
    conversations.value = []
    startNewConversation()
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '清除对话失败')
  }
}

// Load data on mount
onMounted(async () => {
  if (!user.value) {
    await authStore.fetchUserInfo()
    context.value.studentId = user.value?.id
  }
})
</script>

<template>
  <PageContainer>
    <div class="ai-chat-container">
      <div class="chat-header">
        <h2>AI学习助手</h2>
        <div class="header-buttons">
          <el-button type="primary" @click="toggleConversationList">
            {{ showConversationList ? '关闭会话' : '历史会话' }}
          </el-button>
          <el-button @click="startNewConversation">新会话</el-button>
        </div>
      </div>

      <div class="chat-main">
        <!-- Conversation List -->
        <div v-if="showConversationList" class="conversation-list">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>历史会话</span>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="clearAllConversations"
                  :disabled="conversations.length === 0"
                >
                  清除所有
                </el-button>
              </div>
            </template>
            
            <el-empty v-if="conversations.length === 0" description="暂无历史会话" />
            
            <div v-else class="conversations">
              <div 
                v-for="conversation in conversations" 
                :key="conversation.id"
                class="conversation-item"
                :class="{ active: selectedConversationId === conversation.id }"
              >
                <div class="conversation-content" @click="fetchConversationMessages(conversation.id)">
                  <div class="conversation-title">{{ conversation.title }}</div>
                  <div class="conversation-meta">
                    <span>{{ new Date(conversation.updatedAt).toLocaleString() }}</span>
                    <span>{{ conversation.messageCount }}条消息</span>
                  </div>
                </div>
                <el-button 
                  type="danger" 
                  size="small"
                  circle
                  @click.stop="deleteConversation(conversation.id)"
                  class="delete-button"
                >
                  <el-icon><DeleteIcon /></el-icon>
                </el-button>
              </div>
            </div>
          </el-card>
        </div>

        <!-- Chat Interface -->
        <div class="chat-interface">
          <el-card class="chat-card">
            <!-- Messages List -->
            <el-scrollbar class="messages-container" wrap-class="messages-wrapper">
              <div v-if="messages.length === 0" class="empty-messages">
                <el-empty description="开始与AI学习助手对话吧" />
              </div>
              
              <div v-else class="messages">
                <div 
                  v-for="(message, index) in messages" 
                  :key="index"
                  class="message-item"
                  :class="{ 'student': message.isUser }"
                >
                  <div class="message-avatar">
                    {{ message.isUser ? '我' : 'AI' }}
                  </div>
                  <div class="message-content">
                    <div class="message-text">{{ message.content }}</div>
                    <div v-if="message.createdAt" class="message-time">
                      {{ new Date(message.createdAt).toLocaleTimeString() }}
                    </div>
                  </div>
                </div>
                
                <!-- Loading animation when waiting for AI response -->
                <div v-if="loading" class="message-item">
                  <div class="message-avatar">AI</div>
                  <div class="message-content">
                    <div class="message-text loading">
                      <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-scrollbar>

            <!-- Input Area -->
            <el-divider />
            <div class="input-area">
              <el-input
                v-model="inputContent"
                placeholder="输入您的问题..."
                type="textarea"
                :rows="3"
                resize="none"
                @keyup.enter.ctrl="sendMessage"
              />
              <div class="input-actions">
                <span class="tip">按 Ctrl+Enter 发送</span>
                <el-button 
                  type="primary" 
                  @click="sendMessage"
                  :loading="loading"
                  :disabled="loading"
                >
                  发送
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<style scoped>
.ai-chat-container {
  /* 移除固定高度限制，使用flex布局让容器自适应 */
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.chat-header h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin: 0;
}

.header-buttons {
  display: flex;
  gap: var(--space-2);
}

.chat-main {
  display: flex;
  flex: 1;
  gap: var(--space-4);
  overflow: hidden;
}

/* 历史会话列表样式 */
.conversation-list {
  width: 300px;
  overflow-y: auto; /* 确保历史会话列表有独立滑动栏 */
  max-height: calc(100vh - 180px); /* 设置最大高度，确保在视窗内 */
}

.conversations {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.conversation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 0.3s;
  border: 1px solid var(--gray-300);
}

.conversation-item:hover {
  background-color: var(--bg-secondary);
}

.conversation-item.active {
  background-color: var(--primary-light);
  border-color: var(--primary);
}

.conversation-content {
  flex: 1;
  overflow: hidden;
}

.conversation-title {
  font-weight: 500;
  margin-bottom: var(--space-1);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-meta {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.delete-button {
  opacity: 0.7;
  transition: opacity 0.3s;
  transform: translateY(-17px);
}

.delete-button:hover {
  opacity: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 聊天界面样式 */
.chat-interface {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* 消息容器样式 */
.messages-container {
  flex: 1;
  overflow-y: auto; /* 确保对话框有独立滑动栏 */
  max-height: calc(100vh - 320px); /* 设置最大高度，确保发送框在底部 */
}

.messages-wrapper {
  padding: var(--space-4);
}

.empty-messages {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.message-item {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
}

.message-item.student {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 500;
  flex-shrink: 0;
}

.message-item.student .message-avatar {
  background-color: var(--primary-light);
  color: black;
}

.message-content {
  max-width: 70%;
}

.message-text {
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  line-height: 1.6;
}

.message-item.student .message-text {
  background-color: var(--primary-light);
  color: black;
}

.message-time {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-top: var(--space-1);
  text-align: right;
}

.message-item.student .message-time {
  text-align: left;
}

/* 发送框样式 - 固定在底部 */
.input-area {
  padding: var(--space-4);
  border-top: 1px solid var(--gray-300);
  background-color: white;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-2);
}

.tip {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

/* 加载动画样式 */
.loading .typing-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
}

.loading .typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--text-secondary);
  animation: typing 1.4s infinite;
}

.loading .typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading .typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .conversation-list {
    width: 250px;
  }
}

@media (max-width: 768px) {
  .chat-main {
    flex-direction: column;
  }
  
  .conversation-list {
    width: 100%;
    height: 200px;
  }
  
  .message-content {
    max-width: 85%;
  }
}
</style>