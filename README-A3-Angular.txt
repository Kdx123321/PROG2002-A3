A3 Angular 前端说明（client-app + admin-app）

== 环境要求 ==
- Node.js >= 24.15
- Angular CLI 22+:  npm install -g @angular/cli@22
- 后端 API 已在 http://localhost:3000 运行（node server.js）

== 安装与启动 ==
客户端（活动浏览 + 注册，端口 4200）:
  cd client-app
  npm install
  ng serve

管理端（活动 CRUD，端口 4201）:
  cd admin-app
  npm install
  ng serve --port 4201

== 页面 ==
客户端:  首页 /  搜索 /search  活动详情 /event/:id (含报名列表+天气)  注册 /register/:id
管理端:  活动总表 /  新建 /new  编辑(含报名数据) /edit/:id

== 技术要点 ==
- Angular 22 standalone 组件 + signals(zoneless 变更检测) + 新控制流 @if/@for
- 天气: Open-Meteo 免费 API(无需 key),按活动经纬度查 7 天预报
- MySQL DECIMAL 以字符串返回,价格用 parseFloat 处理
- 图片已放入 client-app/public/images(8 张,与 image_url 字段对应)

== 生产构建(cPanel 部署用) ==
客户端:  ng build                      -> 产物拷到 api/public/
管理端:  ng build -c production        -> 产物拷到 api/public/admin/
(server.js 已配置 SPA fallback 支持 /event/5、/admin/edit/3 这类深链接)
