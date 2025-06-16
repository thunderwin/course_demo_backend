const http = require('http');
const https = require('https');
const cors = require('cors');
const url = require('url');
const content = require('./content.json');
const { Article, sequelize } = require('./models/Article');
const fs = require('fs');
// 初始化数据库
const initDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('🔗 数据库连接成功！');
        
        // 同步数据库表结构
        await sequelize.sync();
        console.log('📋 数据库表结构同步完成！');
    } catch (error) {
        console.error('❌ 数据库连接失败:', error);
    }
};

// 解析请求体数据
const parseRequestBody = (request) => {
    return new Promise((resolve, reject) => {
        let body = '';
        request.on('data', chunk => {
            body += chunk.toString();
        });
        request.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
        request.on('error', reject);
    });
};

// DeepSeek API 配置
const DEEPSEEK_API_KEY = 'sk-1600c0f634074ca6bc1ddcd880ec8fea'; // 请替换为您的 DeepSeek API Key
const DEEPSEEK_BASE_URL = 'api.deepseek.com';

// 调用 DeepSeek API
const callDeepSeekAPI = (messages, stream = false) => {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: "deepseek-chat",
            messages: messages,
            stream: stream
        });

        const options = {
            hostname: DEEPSEEK_BASE_URL,
            port: 443,
            path: '/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (error) {
                    reject(new Error('解析响应数据失败: ' + error.message));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error('API 请求失败: ' + error.message));
        });

        req.write(postData);
        req.end();
    });
};

// 创建服务器的函数
const server = http.createServer(async (请求, 响应) => {
    // 使用cors中间件
    cors()(请求, 响应, async () => {
        const requestUrl = url.parse(请求.url, true);
        const pathname = requestUrl.pathname;
        const method = 请求.method;

        console.log(`📥 ${method} ${pathname}`);

        // 设置通用响应头
        响应.setHeader('Content-Type', 'application/json; charset=utf-8');

        try {
            // 处理文章上传接口
            if (pathname === '/upload' && method === 'POST') {
                try {
                    // 解析请求体数据
                    const articleData = await parseRequestBody(请求);
                    
                    // 验证必要字段
                    if (!articleData.title || !articleData.content || !articleData.author) {
                        响应.statusCode = 400;
                        响应.end(JSON.stringify({
                            success: false,
                            message: '缺少必要字段：标题、内容或作者'
                        }));
                        return;
                    }

                    // 创建文章记录
                    const newArticle = await Article.create({
                        title: articleData.title,
                        content: articleData.content,
                        author: articleData.author,
                        createdAt: articleData.createdAt ? new Date(articleData.createdAt) : new Date(),
                        publishedAt: articleData.publishedAt ? new Date(articleData.publishedAt) : new Date()
                    });

                    console.log('✅ 文章保存成功:', newArticle.title);

                    // 返回成功响应
                    响应.statusCode = 200;
                    响应.end(JSON.stringify({
                        success: true,
                        message: '文章发布成功！',
                        data: {
                            id: newArticle.id,
                            title: newArticle.title,
                            author: newArticle.author,
                            createdAt: newArticle.createdAt,
                            publishedAt: newArticle.publishedAt
                        }
                    }));

                } catch (error) {
                    console.error('❌ 文章保存失败:', error);
                    响应.statusCode = 500;
                    响应.end(JSON.stringify({
                        success: false,
                        message: '文章保存失败，请重试'
                    }));
                }
            }
            // 处理聊天接口
            else if (pathname === '/chat' && method === 'POST') {
                try {
                    // 解析请求体数据
                    const chatData = await parseRequestBody(请求);
                    
                    // 验证必要字段
                    if (!chatData.message && !chatData.messages) {
                        响应.statusCode = 400;
                        响应.end(JSON.stringify({
                            success: false,
                            message: '缺少消息内容'
                        }));
                        return;
                    }

                    // 构建消息格式
                    let messages = [];
                    
                    if (chatData.messages) {
                        // 如果传入的是完整的消息数组
                        messages = chatData.messages;
                    } else {

                        const file = fs.readFileSync('./fdf.txt', 'utf-8');


                        // 如果只传入单条消息，构建基本对话格式
                        messages = [
                            { role: "system", content: "你是我的助理" + file },
                            { role: "user", content: chatData.message }
                        ];
                    }

                    console.log('🤖 调用 DeepSeek API...');

                    // 调用 DeepSeek API
                    const deepseekResponse = await callDeepSeekAPI(messages, false);

                    if (deepseekResponse.choices && deepseekResponse.choices.length > 0) {
                        const aiResponse = deepseekResponse.choices[0].message.content;
                        
                        console.log('✅ DeepSeek API 响应成功');

                        // 返回成功响应
                        响应.statusCode = 200;
                        响应.end(JSON.stringify({
                            success: true,
                            message: '获取回复成功',
                            data: {
                                response: aiResponse,
                                usage: deepseekResponse.usage || null,
                                model: deepseekResponse.model || 'deepseek-chat'
                            }
                        }));
                    } else {
                        throw new Error('DeepSeek API 返回数据格式异常');
                    }

                } catch (error) {
                    console.error('❌ DeepSeek API 调用失败:', error.message);
                    响应.statusCode = 500;
                    响应.end(JSON.stringify({
                        success: false,
                        message: error.message.includes('YOUR_DEEPSEEK_API_KEY') 
                            ? '请先配置 DeepSeek API Key' 
                            : `AI 对话失败: ${error.message}`
                    }));
                }
            }
            // 处理获取所有文章的接口
            else if (pathname === '/articles' && method === 'GET') {
                try {
                    const articles = await Article.findAll({
                        order: [['publishedAt', 'DESC']] // 按发布时间倒序
                    });


                    

                    响应.statusCode = 200;
                    响应.end(JSON.stringify({
                        success: true,
                        data: articles,
                        total: articles.length
                    }));

                } catch (error) {
                    console.error('❌ 获取文章列表失败:', error);
                    响应.statusCode = 500;
                    响应.end(JSON.stringify({
                        success: false,
                        message: '获取文章列表失败'
                    }));
                }
            }
            // 处理获取单篇文章的接口
            else if (pathname.startsWith('/articles/') && method === 'GET') {
                try {
                    const articleId = pathname.split('/')[2];
                    const article = await Article.findByPk(articleId);

                    if (!article) {
                        响应.statusCode = 404;
                        响应.end(JSON.stringify({
                            success: false,
                            message: '文章不存在'
                        }));
                        return;
                    }

                    响应.statusCode = 200;
                    响应.end(JSON.stringify({
                        success: true,
                        data: article
                    }));

                } catch (error) {
                    console.error('❌ 获取文章详情失败:', error);
                    响应.statusCode = 500;
                    响应.end(JSON.stringify({
                        success: false,
                        message: '获取文章详情失败'
                    }));
                }
            }
            // 默认路由 - 返回示例内容
            else if (pathname === '/' && method === 'GET') {
                响应.statusCode = 200;
                响应.end(JSON.stringify(content));
            }
            // 404处理
            else {
                响应.statusCode = 404;
                响应.end(JSON.stringify({
                    success: false,
                    message: '接口不存在'
                }));
            }

        } catch (error) {
            console.error('❌ 服务器错误:', error);
            响应.statusCode = 500;
            响应.end(JSON.stringify({
                success: false,
                message: '服务器内部错误'
            }));
        }
    });
});

// 启动服务器
const 端口 = 7000;

// 初始化数据库然后启动服务器
initDatabase().then(() => {
    server.listen(端口, () => {
        console.log(`🎉 服务器已经启动啦！`);
        console.log(`📍 访问地址：http://localhost:${端口}`);
        console.log(`📝 文章上传接口：POST http://localhost:${端口}/upload`);
        console.log(`📚 获取文章列表：GET http://localhost:${端口}/articles`);
        console.log(`📖 获取单篇文章：GET http://localhost:${端口}/articles/:id`);
        console.log(`🤖 AI 聊天接口：POST http://localhost:${端口}/chat`);
        console.log(`💡 想要停止服务器？按 Ctrl+C 就可以了`);
        console.log(`\n🚀 文章发布系统已就绪，AI 助手已上线！`);
    });
}).catch(error => {
    console.error('❌ 服务器启动失败:', error);
});


