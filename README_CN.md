# Acct Easy Access工具

## 1. 上线时间

- 2025/3/12 - 2025/4/16

## 2. 当前状态(2025/04)

- 正常维护 - 0.3.10

- 基础功能已实现，新功能开发中

## 3. 原始需要

主要针对一线坐席日常与CRM交互问题，以及针对账户的管理问题，部分内容如下：

1. 坐席访问CSS常用功能时(账单、更新信用卡、使用记录等)，需先打开CSS再手动选择相应界面，需要坐席关注界面，耗时较长

2. 坐席打开账户时，无法直接确认账户未关闭Ticket，需要坐席主动关注查询

3. CRM为英文界面，坐席查看账户基本信息时(注册/激活/出账时间、合约信息)，需要较长时间

4. 账户计划内容需要坐席记忆/手动查询，耗时较长

5. 针对CRM账户Tag，需要坐席记忆/手动查询相关含义

6. 当针对特定类型账户(部分市场、产品、号码等)需要做特殊处理时，需要:
   
   - 账户临时添加Tag，或
   
   - 分发账户列表回访(但用户主动来电时不好处理)

7. REMOVED账户中，功能账户下拉菜单中不显示功能账户ID，需要坐席查看所有选项以找到对应账户

8. REMOVED账户中，当鼠标滑过账户名称时，会自动弹出空白弹窗，影响坐席处理业务

## 4. 工具解决方案

### 4.1 主要内容

坐席浏览器添加插件，在CRM账户内显示，相关功能:

1. 在CRM界面直接显示常用功能的跳转选项，坐席直接点击即可

2. 插件自动请求并展示账户中待处理Ticket列表

3. 插件自动获取CRM原始请求的结果，用中文明确展示账户计划信息(注册/激活/出账时间、合约期)

4. 插件自动获取CRM原始请求的结果，展示账户计划ID及激活名称，点击插件计划名称时:
   
      a. 插件向内部搭建的服务器请求计划信息(合约期、费用、计划优惠、其他备注)
   
      b. 在CRM界面弹窗展示获取到的信息

5. 支持针对Tag配置坐席可查看的提醒\*，打开CRM账户时:
   
      a. 插件向内部搭建服务器上传账户信息(包括tag)，请求对应提醒
   
      b. 根据回复内容(包括匹配的tag)，提示tag含义

6. 支持根据账户条件配置账户提醒*，打开CRM账户时:
   
      a. 插件向内部搭建服务器上传账户信息，请求对应提醒(同5.a)
   
      b. 根据回复内容，提示账户对应提醒

7. 在AIjia功能账户下拉菜单的每项内容中，添加对应账户ID

8. 将鼠标滑过账户ID产生弹窗的功能移除

*\*. 提醒详情请见下方*

### 4.2 账户提醒

此插件支持管理人员根据需要，按账户信息(tag、市场、产品、账户ID、号码)配置为坐席展示的提醒。

**可配置内容:**

- 内容: 显示给坐席的信息

- 显示条件: tag、市场、产品、账户ID、号码

- 勾选: 是否允许坐席勾选提醒，勾选后其他任何坐席打开该账户时，此项会显示已勾选

- 勾选周期: 勾选后，在周期内会显示已勾选状态，周期后会自动变为未勾选状态

- 生效/失效日期: 提醒只会在有效期内显示

**查询/管理方式:**

- 根据提醒ID、配置时间、标题查询

- 删改提醒，以及提醒的可配置内容

- 获取提醒的处理(勾选)记录

## 5. 使用人员/影响

- 使用人员: REMOVED

- 影响:
  
  - 降低坐席处理业务时的认知负担，降低坐席所需记忆/回想的内容
  
  - 降低计划相关内容的培训需要
  
  - 降低坐席基本操作耗时(CSS常用工具、查询未处理Ticket、查询tag/计划内容)
  
  - 降低账户/临时事件管理成本

## 6. 计划、提醒管理方式

### 6.1 计划管理

- 在当前REMOVED限制访问

- 可根据计划ID查询/修改当前配置的计划信息(如有)

- 可根据计划ID新增计划信息

- 可使用xlsx批量新增/修改计划信息

### 6.2 提醒管理

- 在当前REMOVED限制查看

- 可根据提醒ID、提醒添加时间、部分提醒标题查询/修改当前配置的提醒

- 可新增提醒，并配置相关参数(内容、时间、范围、周期等)，账户ID列表支持使用xlsx文档上传

- 可根据提醒ID删除相应提醒

- 可根据提醒ID获取相应处理状态(账户，勾选状态，处理人，处理时间)

## 7. 服务架构

### 7.1 技术栈

- 前端: Javascript(Violentmonkey)、HTML、CSS

- 后端: Python(Flask; Gunicorn; MariaDB、Redis、Celery IO)、Redis、Celery

- 数据库: MariaDB(与其他工具共享)

- 搭建/部署: Ubuntu Server、Docker Compose(Redis; MariaDB)、Nginx(反代)、Honcho

- 版本管理: Git(本地服务器搭建Remote)

### 7.2 搭建方式

- 在自主管理的服务器上部署插件，坐席在浏览器内通过Violentmonkey安装，后期更新时坐席段会自动同步

- 在自主管理的服务器上搭建/运行Python(Gunicorn+Flask)服务器、Celery+Beat，并通过Docker运行Redis/MariaDB

- 在当前REMOVED服务器上搭建Nginx，插件/管理页面通过该反代访问实际服务器，便于后期切换

### 7.3 工具流程

- 当坐席访问CRM账户时，安装的插件截取CRM原始请求的结果，并显示可获取的内容至页面，以及CSS常用工具的访问选项(根据产品不同，内容不同)

- 由于无法直接获取Ticket列表，插件主动向CRM发出相应请求。按回复的Ticket列表中，各Ticket的状态筛选为处理的Ticket，并显示在页面

- 当坐席选择插件中显示的计划ID时，插件从自主配置的服务器上获取计划信息(如有)，并弹窗显示在账户中

- 账户读取时，当插件获取至所需信息后，会使用账户信息在自主配置的服务器上获取相关提醒(如有)，并显示在插件中

## 8. 前端实现细节

### 8.1 Violentmonkey 插件

- *由于CRM系统没有原生API，直接从页面获取数据较慢，大部分功能/信息获取均通过监听XMLHttpRequest获得(load事件添加EventListener)*

- *页面请求均通过Violentmonkey GM_xmlhttpRequest发送*

- *指向Nginx反代链接，不直接接入服务器，以便于后期修改*

#### 8.1.1 基本显示信息

1. 监听请求类型:
   
   - GetProductExtensionData
   
   - GetMasterAccountListV3
   
   - REMOVED
   
   - GetBaseAdminInfo
   
   - GetAccountTag

2. GetProductExtensionData及GetMasterAccountListV3请求触发相关事件后，由于MasterAccountList会获取客户的所有业务账户，客户端会使用GetProductExtensionData中获取的当前账户ID在GetMasterAccountListV3匹配实际业务账户信息(AHC类型账户，由于一个业务账户可能有多个功能账户，且功能账户均有独立计划，需通过REMOVED获取当前功能账户计划)

3. 监听到上述各项请求后，分别会触发各自的Processor function(源代码Processor functions段)。此类函数多为储存/处理信息，完成后会触发各自的显示函数(源代码Display funtions段)，在侧边栏中分段显示(CSS常用工具跳转，账户注册时间/合约期等)

4. 插件被触发后，会在指定页面上插入显示信息用的侧边栏(源代码Elements setup段)，上述显示函数基本均会在此处创建的DOM元素内显示。其中每个信息段均通过makeCollapsible变为可最小化的形式

5. 由于页面可能在不刷新的情况下切换至其他账户，侧边栏各项显示信息会通过waitForElmHide函数(MutationObserver, DOM存在或offsetParent==null)监听，callback直接删除该段，等待再次触发1中事件

#### 8.1.2 待处理Ticket

1. 由于账户打开后，不会自动获取近期Ticket列表(仅获取近期Note，其中Ticket内容不全)，需要客户端主动向CRM发送Ticket获取请求(GetTicketList)

2. 请求通过当前页面直接发送，使用当前登录信息，无需重新登录

3. 获取后根据预定规则，屏蔽已处理的Ticket，将剩余Ticket显示在侧边栏

#### 8.1.2 账户提醒

1. 关于账户提醒功能，8.1.1中特定事件被触发后(主要为GetMasterAccountListV3请求)，会自动向自主建立的服务器(/reminder/acct endpoint，见9.2)发送账户信息

2. 客户端定期请求task结果(/task/\<task_id> endpoint，见9.2)，获取结果后，根据提醒标题判定显示形式。nc:title 类型的提醒不允许勾选，tag:title类型的会匹配title与GetAccountTag事件中存储的账户tag，有匹配则会显示。两者可通用，即nc:tag:title或tag:nc:title

3. 坐席勾选/反选某个提醒后，客户端会向自主服务器(/reminder/op endpoint，见9.2)发送处理人(GetBaseAdminInfo储存信息)，账户及提醒信息 

#### 8.1.3 计划详情

1. 获取计划信息后(见8.1.1)，会显示在侧边栏，其中计划ID高亮显示，可点击

2. 点击计划ID后，在页面弹窗，弹窗可拖拽(dragElement、displayPlanInfo)

3. 同时，客户端向自主服务器(/plan/\<plan_id> endpoint，见9.2)发送请求，获取plan信息

4. 客户端定期请求task结果(/task/\<task_id> endpoint，见9.2)，获取结果后，显示计划信息于弹窗

#### 8.1.4 其他功能

- 在REMOVED功能账户下拉菜单中显示功能账户ID - 使用waitForElm函数(MutationObserver形式)，callback在各项添加该项value中获取的功能账户ID。由于可能在页面不刷新的情况下进入其他账户，使用waitForElmHide(MutationObserver，DOM不存在或offsetParent==null)监控，当当前下拉菜单消失后再次使用waitForElm函数监听

- 方式鼠标滑过REMOVED计划ID时显示空白弹窗 - 简单使用MutationObserver监控计划标题的DOM元素，当内容满足条件时(目前为长度>10，由于所有计划名称都较长)，通过callback复制并替换当前标题元素，以清除EventListener。同样以waitForElmHide监控，如果切换至其他账户，重新启用MutationObserver

## 9. 后端实现细节

### 9.1 代码架构

- 此处仅注明概述，详情请查看源代码

- .env - 环境文件，必须参数:
  
  - DB相关
    
    - DB_HOST - DB地址
    
    - DB_PORT - DB端口
    
    - DB_USER - DB用户名
    
    - DB_PASSWORD - DB密码
  
  - Redis相关
    
    - REDIS_URL - Redis地址
    
    - REDIS_PORT - Redis端口
    
    - REDIS_CELERY_DB - Celery broker Redis DB index
    
    - REDIS_CACHE_DB - 普通Cache Redis DB index
  
  - 其他内容
    
    - CN_NUM_PATH - 特殊中国号文档路径

- app.py - 主要服务器文件
  
  - 依赖外部module: 
    
    - celery==5.4.0
    - Flask==3.1.0
    - openpyxl==3.1.5
    - python-dotenv==1.0.1
    - redis==5.2.1
  
  - 主要结构(按序)
    
    - 基本flask app、celery、redis 配置
    - Helper functions - 独立助手function
    - Celery beats - 服务器启动时及定时处理任务，主要为cache更新
    - Celery tasks - celery任务，基本由下方endpoint启动
    - Reminder endpoints - Flask提醒相关终点，及管理界面访问
    - Plan Endpoints - 计划相关终点，及管理界面访问
    - Other Endpoints - task状态/结果获取终点
  
  - 流程
    
    - 尽量以RESTful形式实现，Endpoint收到请求后，触发Celerytask，并返回task_id
    
    - Celery task中与cache/DB进行交互，需要客户端定期请求/task/\<task_id>确认任务状态(PENDING, SUCCESS, FAILURE)
    
    - 所有需要与DB交互的task均创建新DatabaseManager示例，以防止lock
    
    - 文件下载以python tempfile module实现，避免安全问题
    
    - redis交互时尽可能使用pipeline以降低延迟及Overhead，后期可考虑在redis段配置Lua
  
  - 本地module:
    
    - 使用DatabaseManager类与DB交互

- database_namager.py - DB交互类
  
  - 依赖外部module:
    - mariadb==1.1.12
  - with_db_connection - DB IO用装饰器
  - DatabaseManager class - DB IO用类

- gunicorn_config.py - Gunicorn配置文件
  
  - 默认5000端口
  
  - 默认3 sync worker
  
  - 调用app.py中warm_cache函数，服务器启动时运行一次填充cache

- schema.sql
  
  - 包含plans、reminders、reminder_to_business、acct_reminders、reminder_process_log table及相关index定义
  
  - 由于business table为其他工具必须table，此处未定义

- Procfile - Honcho配置文件

- requirements.txt - 依赖的外部module

- PlanManagement.html - 计划管理界面
  
  - 包含界面HTML/CSS，及相关JS客户端逻辑

- ReminderManagement.html - 提醒管理界面
  
  - 包含界面HTML/CSS，及相关JS客户端逻辑

### 9.2 服务器API

#### 9.2.1 提醒相关

- /reminder/insert - 新增提醒
  
  - 方法: POST
  
  - 参数: title，content，market，start_date(可选)，expire_date(可选)，recurrent_interval(可选)，is_global，is_all_business(如is_global=True，必有)，is_all_business
  
  - 附加file: 如is_global = False，则需要有账户ID的xlsx文件
  
  - 返回值:
    
    - 成功: 202，task_id - 任务ID，见下方/task/\<task_id> endpoint
    
    - 失败: 400/500，message - 失败原因
  
  - task状态/值:
    
    - 成功:
      
      - status: SUCCESS
      
      - result: "Insert successful: {reminder_id}"
    
    - 失败:
      
      - status: FAILURE
      
      - message: {失败原因}

- /reminder/acct - 根据账户获取提醒
  
  - 方法: POST
  
  - 参数: acct_id，market，business，cn_num(可选)
  
  - 返回值:
    
    - 成功: 202，task_id - 任务ID，见下方/task/\<task_id> endpoint
    
    - 失败: 400/500，message - 失败原因
  
  - task状态/值:
    
    - 成功:
      
      - status: SUCCESS
      
      - result: JSON(Array(dict，dict,....)，其中中每项为一个提醒的具体信息
    
    - 失败:
      
      - status: FAILURE
      
      - message: {失败原因}

- /reminder/op - 勾选/反选提醒后记录
  
  - 方法: POST
  
  - 参数: acct_id，reminder_id，processed_by，processed_by_xf，is_processed
  
  - 返回值:
    
    - 成功: 202，task_id - 任务ID，见下方/task/\<task_id> endpoint
    
    - 失败: 400/500，message - 失败原因
  
  - task状态/值:
    
    - 成功:
      
      - status: SUCCESS
      
      - result: "Insert successful: {reminder_id}"
    
    - 失败:
      
      - status: FAILURE
      
      - message: {失败原因}

- /reminder/delete/\<reminder_id> - 删除提醒
  
  - 方法: DELETE
  
  - 参数: reminder_id
  
  - 返回值:
    
    - 成功: 202，task_id - 任务ID，见下方/task/\<task_id> endpoint
    
    - 失败: 500，message - 失败原因
  
  - task状态/值:
    
    - 成功:
      
      - status: SUCCESS
    
    - 失败:
      
      - status: FAILURE
      
      - message: {失败原因}

- /reminder/search/id/\<reminder_id> - 按ID查找提醒
  
  - 方法: GET
  
  - 参数: reminder_id
  
  - 返回值:
    
    - 成功: 202，task_id - 任务ID，见下方/task/\<task_id> endpoint
    
    - 失败: 500，message - 失败原因
  
  - task状态/值:
    
    - 成功:
      
      - status: SUCCESS
      
      - result: JSON(Array(dict，dict,....)，其中中每项为一个提醒的具体信息
    
    - 失败:
      
      - status: FAILURE
      
      - message: {失败原因}

- /reminder/search/createtime - 按创建时间查找提醒
  
  - 方法: GET
  
  - 参数: start_date，end_date(可选)
  
  - 返回值:
    
    - 成功: 202，task_id - 任务ID，见下方/task/\<task_id> endpoint
    
    - 失败: 500，message - 失败原因
  
  - task状态/值:
    
    - 成功:
      
      - status: SUCCESS
      
      - result: JSON(Array(dict，dict,....)，其中中每项为一个提醒的具体信息
    
    - 失败:
      
      - status: FAILURE
      
      - message: {失败原因}

- /reminder/search/title - 按标题模糊查找提醒
  
  - 方法: GET
  
  - 参数: title(至少2个字符)
  
  - 返回值:
    
    - 成功: 202，task_id - 任务ID，见下方/task/\<task_id> endpoint
    
    - 失败: 400/500，message - 失败原因
  
  - task状态/值:
    
    - 成功:
      
      - status: SUCCESS
      
      - result: JSON(Array(dict，dict,....)，其中中每项为一个提醒的具体信息
    
    - 失败:
      
      - status: FAILURE
      
      - message: {失败原因}

- /reminder/status/\<reminder_id> - 按提醒ID查询账户处理结果
  
  - 方法: GET
  
  - 参数: reminder_id
  
  - 返回值:
    
    - 成功: 202，task_id - 任务ID，见下方/task/\<task_id> endpoint
    
    - 失败: 400/500，message - 失败原因
  
  - task状态/值:
    
    - 成功:
      
      - status: SUCCESS
      
      - result: filepath - 账户临时文件路径(使用python tempfile规避风险)，见/reminder/download/\<task_id>；此文件5分钟后自动删除
    
    - 失败:
      
      - status: FAILURE
      
      - message: {失败原因}

- /reminder/download/\<task_id> - 按task ID下载文件
  
  - 方法: GET
  
  - 参数: task_id (不使用客户端提供的filepath)
  
  - 返回值:
    
    - 账户处理结果的xlsx文件，作为attachment
    
    - 404，message - 文件已删除
    
    - 500，message - 失败原因
    
    - 202，message - 文件还在生成中

#### 9.2.2 计划相关

- /plan/update - 计划创建/更新
  
  - 方法: POST
  
  - 参数:
    
    - 必要: plan_id, name, business_name, contract
    
    - 可选: fee, discount, note
  
  - 返回值:
    
    - 成功: 202，task_id - 任务ID，见下方/task/\<task_id> endpoint
    
    - 失败: 400/500，message - 失败原因
  
  - task状态/值:
    
    - 成功:
      
      - status: SUCCESS
      
      - result: {n} 创建成功，{m} 创建失败，失败原因: {原因}
    
    - 失败:
      
      - status: FAILURE
      
      - message: {失败原因}

- /plan/upload - 使用表格方式批量更新计划
  
  - 方法: POST
  
  - 参数: file - 需xlsx类型
  
  - 返回值:
    
    - 成功: 202，task_id - 任务ID，见下方/task/\<task_id> endpoint
    
    - 失败: 400/500，message - 失败原因
  
  - task状态/值:
    
    - 成功:
      
      - status: SUCCESS
      
      - result: {n} 创建成功，{m} 创建失败，失败原因: {原因}
    
    - 失败:
      
      - status: FAILURE
      
      - message: {失败原因}

- /plan/\<plan_id>
  
  - 方法: GET
  
  - 参数: plan_id
  
  - 返回值:
    
    - 成功: 202，task_id - 任务ID，见下方/task/\<task_id> endpoint
    
    - 失败: 400/500，message - 失败原因
  
  - task状态/值:
    
    - 成功:
      
      - status: SUCCESS
      
      - result: JSON - 包含对应计划具体信息
    
    - 失败:
      
      - status: FAILURE
      
      - message: {失败原因}

#### 9.2.3 其他Endpoint

- /reminder/ReminderManagement.html - 提醒管理页面
  
  - 内置script + css

- /plan/PlanManagement.html - 计划管理页面
  
  - 内置script + css

- /tasks/\<task_id>
  
  - 方法: GET
  
  - 参数: task_id
  
  - 返回值:
    
    - status: PENDING/SUCCESS/FAILURE/{other}
    
    - 如果SUCCESS, 还包含 result
    
    - 如果FAILURE 或 {other}，还包含 message

### 9.3 缓存策略

#### 9.3.1 缓存规划

主要目标仍为减少数据库IO，减少客户端读取时间

1. Plan内容较少(数百)，可直接缓存至cache

2. 提醒内容预估较少(数百)，可直接缓存至cache

3. 业务名称 与 业务ID 互转为常用操作，且内容很少(两相数十个)，将 名称->ID 和 ID->名称 均直接存储至Cache

4. 提醒获取方式较复杂，由于账户ID很多，单个账户获取频率很低，直接按 账户ID-提醒列表 存储效率很低。所以根据提醒类型:
   
   - 如不针对账户ID(即is_global=True)，则所有账户均需要获取，此部分应直接按 市场:产品ID:提醒ID列表 格式存储至Cache，可直接通过账户信息获取提醒列表
   
   - 如针对账户ID(即is_global=False)，则先将所有涉及到的账户ID存储至set，如果被获取的账户ID在Set中，再继续获取相应提醒ID列表

5. 如4中需要继续获取计划ID列表(即is_global=False)，则通过访问数据库获取，获取结果与非针对账户，但适用于当前账户的提醒ID列表合并，按对应账户ID存储至Cache，20分钟超时

6. REMOVED

7. 上述所有cache大多有如下几种管理方式:
   
   - 服务器启动时，直接获取并按规则cache
   
   - 每小时自动获取更新(如有，用last_modified列或文件更新时间)
   
   - 如cache miss，自动尝试重新获取，如仍miss，返回错误

#### 9.3.2 Redis键

1. 计划
   
   - Redis键: plan:{plan_id}
   
   - 值类型: String(JSON serialized)
   
   - 键: plan_id，name，contract，business(非ID，直接对应CRM业务名称)，fee，discount，note
   
   - 内容: 该plan_id对应计划内容
   
   - 更新策略:
     
     - 服务器启动时直接从数据库读取所有plan内容并存储至cache
     
     - 每小时自动从数据库获取有更新的内容(last_modified)
     
     - 当计划内容有更新时，自动添加/更新对应plan_id内容
     
     - 如客户端请求的计划ID cache miss，自动从数据库请求更新

2. 提醒内容
   
   - Redis键: rem\:detail\:{reminder_id}
   
   - 值类型: Hash
   
   - 键: title，content，id，is_all_business_is_global，market，recurrent_interval，start_date，end_date，status
   
   - 内容: 该reminder_id 对应提醒内容
   
   - 更新策略:
     
     - 服务器启动时从数据库获取所有未失效的提醒并存储至cache
     
     - 每小时自动从数据库获取有更新的内容(last_modified)
     
     - 当提醒有更新时，自动添加/更新对应提醒内容
     
     - 当提醒被用到时，如发现已过期，从redis中移除

3. 市场/产品下的提醒列表
   
   - Redis键: rem:global\:{market}:{business_id}
   
   - 值类型: Set
   
   - 内容: 对应市场及产品ID下的提醒列表
   
   - 更新策略:
     
     - 服务器启动时从数据库获取所有未失效的提醒并存储至cache
     
     - 每小时自动从数据库获取有更新的内容(last_modified)
     
     - 当提醒有更新时，自动添加/更新对应提醒内容
     
     - 当提醒被用到时，如发现已过期，从redis中移除

4. 所有被仅针对特定账户配置的提醒涉及的账户ID
   
   - Redis键: rem:acct_list
   
   - 值类型: Set
   
   - 内容: 所有被仅针对特定账户配置的提醒中包含的账户ID(即reminder.is_global = False)，供服务器判定是否需要查询此类提醒，还是仅查询rem:global下内容即可
   
   - 更新策略:
     
     - 服务器启动时从数据库获取所有未失效的提醒所对应的ID并存储至cache
     
     - 每小时自动从数据库获取有更新的内容(last_modified)
     
     - 当提醒有更新时，自动添加对应提醒账户ID
     
     - 当对应账户被用到时，如发现针对此账户无根据账户ID判定的提醒，从Redis中移除该账户ID

5. 所有近期被获取过的账户ID对应的提醒ID列表
   
   - Redis键: rem\:acct\:{acct_id}
   
   - 值类型: Set
   
   - 内容: acct_id对应的提醒ID列表
   
   - 更新策略:
     
     - 当该账户ID被请求时，将获取到的提醒ID列表存储至此
     
     - 20分钟后expire

6. 提醒ID对应的账户ID列表
   
   - Redis键: rem:{reminder_id}:{acct_id}
   
   - 值类型: Hash
   
   - 键: is_processed，last_processed_at
   
   - 内容: acct_id对应reminder_id的处理状态
   
   - 更新策略:
     
     - 服务器启动时从数据库获取所有未失效的提醒所对应的状态并存储至cache
     
     - 每小时自动从数据库获取有更新的内容(last_modified)
     
     - 当有新的勾选时，自动添加/复写当前内容

7. 48k+特殊中国号列表
   
   - Redis键: spe:cn_num
   
   - 值类型: Set
   
   - 内容: 特殊实名认证的48k中国号
   
   - 更新策略:
     
     - 服务器启动时，从外置xlsx文档读取并存储所有号码
     
     - 每小时自动从该文档获取更新(如文档本身已被更新)

8. 业务名称对应业务ID
   
   - Redis键: business_{business_name}
   
   - 值类型: Int
   
   - 内容: 业务名称对应的业务ID
   
   - 更新策略:
     
     - 服务器启动时，从数据库读取并存储对应名称及ID
     
     - 如被请求的业务名称 cache miss，尝试重新获取

9. 业务ID对应业务名称
   
   - Redis键: business:{business_id}
   
   - 值类型: String
   
   - 内容: 业务ID对应业务名称
   
   - 更新策略:
     
     - 服务器启动时，从数据库读取并存储对应名称及ID
     
     - 如被请求的业务名称 cache miss，尝试重新获取

### 9.4 数据库

1. 使用独立账户，仅授予下方table的SELECT，INSERT，UPDATE，DELETE权限

2. 设计并创建共6个table(1个与其他工具共享)，以及相关index，以下仅描述table:
- plans - 记录账户计划内容(合约期、费用、备注等)
  
  - 列描述:
    
    - plan_id - INT 主键 - 计划ID(与公司数据库相同)
    
    - name - VARCHAR(255) 非空 - 计划名称
    
    - contract - VARCHAR(64) - 合约期(考虑到不同时长、规则，未使用INT)
    
    - business_id - TINYINT 非负 非空 - 产品ID(与CRM不同，与其他工具共享)
    
    - fee - VARCHAR(255) - 费用(考虑到费用周期、可能为多项、类型，未使用INT)
    
    - discount - VARCHAR(255) - 优惠
    
    - note - TEXT - 备注
    
    - last_modified - TIMESTAMP 默认当前时间 修改自动更新 - 记录更新时间(Redis cache也会用到)
  
  - 限制:
    
    - plan_id - 主键
    
    - business_id - 外键，引用 business(id)

- reminders - 记录账户提醒
  
  - 列描述:
    
    - id - INT 非负 自动计算 主键
    
    - title - VARCHAR(255) 非空 - 提醒的标题，不显示给坐席，也用户标记提醒类型
    
    - content - VARCHAR(255) 非空 - 展示给坐席的内容
    
    - market - SET('USCN'，'CACN') 非空 - 标记提醒对应市场，可多选
    
    - start_date - DATETIME - 提醒生效时间
    
    - expire_date - DATETIME - 提醒失效时间
    
    - recurrent_interval - INT 默认0 - 提醒勾选周期
    
    - is_global - BOOLEAN 非空 - 是否针对所有符合条件的账户，还是针对特定账户列表
    
    - is_all_business - BOOLEAN - 是否针对所有产品
    
    - last_modified - TIMESTAMP 默认当前时间 修改自动更新 - 记录更新时间(Redis cache也会用到)
    
    - create_date - DATETIME 默认当前时间 - 提醒创建时间
  
  - 限制:
    
    - id - 主键
    
    - chk_market_options - 确保市场非空字符

- reminder_to_business - junction table，记录各提醒和产品的关联
  
  - 列描述:
    
    - reminder_id - INT 非负 非空 - 提醒ID
    
    - business_id - TINYINT 非负 非空 - 产品ID
  
  - 限制:
    
    - (reminder_id，business_id) - 主键
    
    - reminder_id - 外键，引用reminder(id)
    
    - business_id - 外键，引用business(id)

- acct_reminders - 记录与各提醒相关联的账户，以及该账户的当前勾选状态，包括不针对账户配置的，但是可勾选的提醒
  
  - 列描述:
    
    - acct_id - INT 非负 非空 - CRM业务账户ID
    
    - reminder_id - INT 非负 非空 - 提醒ID
    
    - is_processed - BOOLEAN 默认0 - 账户当前勾选状态
    
    - last_processed_ai - DATETIME 默认空 - 最后勾选时间
  
  - 限制:
    
    - (acct_id，reminder_id) - 主键
    
    - reminder_id - 外键，引用reminders(id)

- reminder_process_log - 提醒处理log
  
  - 列描述:
    
    - id - INT 非负 自动计算 主键 - logID
    
    - acct_id - INT 非负 非空 - CRM业务账户ID
    
    - reminder_id - INT 非负 非空 - 提醒ID
    
    - processed_by - INT 非负 非空 - CRM员工ID(IOF ID)
    
    - processed_at - TIMESTAMP 非空 默认当前时间 - 处理时间
    
    - new_status - BOOLEAN 非空 - 操作后的勾选状态
  
  - 限制:
    
    - id - 主键
    
    - reminder_id - 外键，引用reminders(id)

- business - 记录产品及产品ID
  
  - 列描述:
    
    - id - TINYINT 非负 主键 - business_id 产品ID
    
    - name - VARCHAR(20) - 产品名称
  
  - 限制:
    
    - id - 主键

## 10. 待添加功能/待处理问题

1. 缺失数据监控功能，需添加:
   
   - 当CSS快速访问功能被使用时，添加log(客户端、服务端)
   
   - 当计划ID被请求，且获取到该计划内容时，添加log(服务端)

2. 当计划ID无法获取到具体信息时，需记录该计划ID，并在计划管理界面按访问次数排序，以便于后期添加常用计划信息(服务端)

3. 由于后期有新增功能需要给不同部门使用，需添加根据客服账户显示不同内容的功能，包括特定部门提醒(客户端、服务端)

4. REMOVED
