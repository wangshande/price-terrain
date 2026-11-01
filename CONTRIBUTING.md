# 参与贡献

先运行 `npm ci && npm run db:migrate && npm run dev`。提交前运行 `npm test`、`npm run typecheck`、`npm run build`。

欢迎补充有授权的数据提供器、城市覆盖、性能优化和地图交互。数据适配请遵循 `docs/DATA_PROVIDER.md`：保留来源、月份、价格口径；未知样本量为 null，缺失历史不生成替代价格。新增来源需提供授权范围和可重现的脱敏样例。请勿提交令牌、个人导入数据、数据库或无授权的全量数据包。

缺陷报告请附城市、房屋类型、月份、显示模式、浏览器和复现步骤；截图请去除个人信息。
