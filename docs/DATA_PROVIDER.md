# 数据源接入

目前没有购买或启用商业API。用户已选择先接公开数据并预留接口。

## 已启用的公开来源

- 全国城市报告：https://m.fang.com/fangjia/fjmap.html
- 该公开网页本身使用的月份接口：`https://m.fang.com/fangjia/ajax/ajaxgetfjmap.html?time=YYYY.MM.01`
- 城市页面公开的月度序列：`pageConfig.esfCityDealChartData3`（最多约36个月，具体以来源为准）。
- 小区公开挂牌/参考均价页面与小区详情中的百度地图坐标。

公开全国报告含70条地区记录，其中69个城市可定位，海南聚合记录不绘制为城市。另核实了33个补充城市的来源目录入口。是否有当月数据及获取成功数以每次实际响应为准，不承诺每次102城全部成功。

平台参考价格不等于成交均价。挂牌、参考、成交口径不得混合计算同一曲线。城市与小区的统计样本量未公开时必须为null。

## 预留的小区完整历史接口

`lib/market/providers.ts` 定义 CommunityProvider。真实provider应返回：

- 小区ID、名称、城市与WGS84坐标。
- 月份、元/㎡单价、价格口径、样本量（未知则null）。
- 数据来源、统计方法、获取时间和缺失月份。
- 搜索游标与全量覆盖标识。只有确实完整时才可返回completeCityCoverage=true。

接入后让 `app/api/community/route.ts` 优先取provider历史，再合并本站采集历史；按来源和口径分组，不做跨源无提示拼接。鉴权令牌只能放服务端环境变量，不能写进前端、URL、Git或日志。坐标来自GCJ02/BD09时先转换并标记近似精度。

未接入provider时，小区只显示公开当期价格、来源环比/同比，以及本站实际采集的月度历史。完整图表接口不可用时不绕过限制、不生成模拟曲线。

## 采集与存储

每次页面打开或手动刷新都会对全国报告发起源站请求。补充城市分批并发读取，单批最多8城，并发3。历史月份和详情有5分钟请求合并缓存，界面仍显示原始获取时间。刷新按钮只使当前范围重新获取，不在后台无限扫描全部小区。

D1保存 `price_observations`（实体/月份/口径唯一，保留最新观测）与 `collection_runs`（每次成功处理的采集流水）。失败不写为成功；已保存快照不冒充实时数据。相同月份价格发生来源修订时会更新当前记录；本版本不是逐次报价审计仓库。

## 浏览器导入

JSON包含records数组，最多30000条、10MB。字段：id/city/name/lon/lat/month/price/priceType/sourceUrl。priceType取listing_reference、platform_reference或transaction_average。导入只保存在本浏览器，不自动上传D1；标记为用户导入、未独立核验。
