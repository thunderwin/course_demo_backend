# DeepSeek 聊天接口说明

## 🚀 快速开始

我已经为你的服务器添加了一个 `/chat` 接口，可以直接对接 DeepSeek 大模型进行智能对话。

## 📋 配置步骤

### 1. 获取 DeepSeek API Key

1. 访问 [DeepSeek Platform](https://platform.deepseek.com/)
2. 注册账号并登录
3. 在 [API Keys 页面](https://platform.deepseek.com/api_keys) 创建新的 API Key
4. 复制生成的 API Key

### 2. 配置服务器

打开 `index.js` 文件，找到这一行：

```javascript
const DEEPSEEK_API_KEY = 'YOUR_DEEPSEEK_API_KEY';
```

将 `YOUR_DEEPSEEK_API_KEY` 替换为你的真实 API Key：

```javascript
const DEEPSEEK_API_KEY = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxx';
```

## 🎯 接口使用方法

### 基本信息

- **接口地址**: `POST http://localhost:7000/chat`
- **请求格式**: JSON
- **响应格式**: JSON

### 请求格式

#### 方式一：简单对话

```json
{
  "message": "你好，请介绍一下你自己"
}
```

#### 方式二：多轮对话

```json
{
  "messages": [
    { "role": "system", "content": "你是一个编程助手" },
    { "role": "user", "content": "什么是 Node.js？" },
    { "role": "assistant", "content": "Node.js 是..." },
    { "role": "user", "content": "它主要用来做什么？" }
  ]
}
```

### 响应格式

#### 成功响应

```json
{
  "success": true,
  "message": "获取回复成功",
  "data": {
    "response": "AI 的回复内容",
    "usage": {
      "prompt_tokens": 10,
      "completion_tokens": 50,
      "total_tokens": 60
    },
    "model": "deepseek-chat"
  }
}
```

#### 错误响应

```json
{
  "success": false,
  "message": "错误描述"
}
```

## 🧪 测试接口

### 使用测试文件

运行提供的测试文件：

```bash
node chat-test.js
```

### 使用 curl 命令测试

```bash
# 简单对话测试
curl -X POST http://localhost:7000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好，请介绍一下你自己"}'

# 多轮对话测试
curl -X POST http://localhost:7000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "你是一个编程助手"},
      {"role": "user", "content": "什么是 JavaScript？"}
    ]
  }'
```

## 💡 前端集成示例

### JavaScript/Vue.js

```javascript
// 简单对话
async function chatWithAI(message) {
  try {
    const response = await fetch('http://localhost:7000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data.response;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('聊天失败:', error);
    throw error;
  }
}

// 使用示例
chatWithAI('你好！').then(response => {
  console.log('AI回复:', response);
});
```

### 多轮对话管理

```javascript
class ChatManager {
  constructor() {
    this.messages = [
      { role: "system", content: "你是一个聪明、有帮助的AI助手。" }
    ];
  }

  async sendMessage(userMessage) {
    // 添加用户消息
    this.messages.push({ role: "user", content: userMessage });

    try {
      const response = await fetch('http://localhost:7000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: this.messages })
      });

      const data = await response.json();

      if (data.success) {
        const aiResponse = data.data.response;
        // 添加AI回复到对话历史
        this.messages.push({ role: "assistant", content: aiResponse });
        return aiResponse;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      // 如果出错，移除刚添加的用户消息
      this.messages.pop();
      throw error;
    }
  }

  clearHistory() {
    this.messages = [
      { role: "system", content: "你是一个聪明、有帮助的AI助手。" }
    ];
  }
}

// 使用示例
const chatManager = new ChatManager();

chatManager.sendMessage('你好！').then(response => {
  console.log('AI:', response);
  return chatManager.sendMessage('你能帮我写代码吗？');
}).then(response => {
  console.log('AI:', response);
});
```

## ⚠️ 注意事项

1. **API Key 安全**: 不要将 API Key 提交到版本控制系统中
2. **费用控制**: DeepSeek API 按 token 计费，注意控制使用量
3. **错误处理**: 始终添加适当的错误处理机制
4. **并发限制**: DeepSeek API 有并发请求限制，注意控制请求频率

## 🔧 常见问题

### Q: 出现 "请先配置 DeepSeek API Key" 错误
A: 检查 `index.js` 中的 `DEEPSEEK_API_KEY` 是否正确配置

### Q: 请求超时
A: 检查网络连接，DeepSeek API 响应可能需要几秒钟

### Q: 返回格式异常
A: 检查请求的 JSON 格式是否正确

### Q: 如何实现流式输出？
A: 当前版本暂不支持流式输出，如需要可以修改 `callDeepSeekAPI` 函数

## 📚 扩展功能

你可以基于这个接口扩展更多功能：

- 聊天记录保存到数据库
- 用户会话管理
- 自定义系统提示词
- 流式输出支持
- 多模型切换
- Token 使用统计

## 🎉 完成！

现在你的服务器已经集成了 DeepSeek AI 对话功能，可以在你的前端应用中使用智能聊天功能了！ 