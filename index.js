// 这是我们最简单的后端服务器
// 想象一下，这就像是开了一家只会说"你好"的小店

// 首先，我们需要引入Node.js自带的http模块
// 这个模块就像是我们开店需要的基本工具包
const http = require('http');

// 引入cors模块
const cors = require('cors');

const content = require('./content.json');

// 创建服务器的函数
// 这就像是我们雇佣了一个服务员，每当有客人来的时候，他就会响应
const server = http.createServer((请求, 响应) => {

    // 使用cors中间件
    cors()(请求, 响应, () => {
        console.log(请求.url);  // 请求的url
        console.log(请求.method);  // 请求的方法
        console.log(请求.headers);  // 请求的头

        // 设置响应头，告诉浏览器我们要发送什么类型的内容
        // 这就像是服务员告诉客人："我们今天提供的是文字菜单，而且是中文的"
        响应.setHeader('Content-Type', 'application/json; charset=utf-8');
        
        // 设置状态码200，表示一切正常
        // 这就像是服务员笑着说"没问题，马上为您服务"
        响应.statusCode = 200;
        
        // 发送我们的响应内容
        // 这就是我们的"招牌菜" - 一句简单的问候
      
        
        响应.end(JSON.stringify(content));
    });
});

// 让服务器开始监听8000端口
// 这就像是我们正式开门营业，在8000号门牌等待客人的到来
const 端口 = 8000;
server.listen(端口, () => {
    console.log(`🎉 服务器已经启动啦！`);
    console.log(`📍 访问地址：http://localhost:${端口}`);
    console.log(`💡 想要停止服务器？按 Ctrl+C 就可以了`);
    console.log(`\n就像是我们的小店开门营业了，等待客人上门！`);
});


