---
name: 智航数据查询
description: 用于连接智航CMDB系统查询测点数据、设备实例、历史数据等。支持内网和外网两种访问方式，提供8个核心API接口的调用封装。
---

# 智航数据查询 Skill

本skill用于连接智航CMDB系统查询测点数据、设备实例和历史数据。

## 适用场景

- 查询CMDB中的设备模型列表
- 根据域号和模型ID查询设备实例
- 查询测点的实时数据和历史数据
- 查询设备关联的测点列表
- 通过SQL查询时序数据库数据

## 前置要求

### 网络配置

**内网访问**（需要配置hosts）：
```
192.168.233.91 gateway.meta42.indc.vnet.com
```

**外网访问**：
```
https://digitaltwin.meta42.indc.vnet.com/openapi
```

### 认证信息

- 认证方式：Basic Auth
- 用户名：root
- 密码：taosdata

## 接口列表

### 1. 获取所有模型

获取CMDB中所有的设备模型定义。

- **接口路径**: `GET /cmdb/objRemote/getObjList`
- **请求参数**: 无
- **返回字段**: 
  - `id`: 模型ID
  - `objId`: 模型标识
  - `objName`: 模型名称
  - `objStandardId`: 模型标准ID
  - `classificationName`: 所属分类

### 2. 根据域号和模型ID查询设备

根据域号(code)和模型ID列表查询对应的设备实例。

- **接口路径**: `POST /cmdb/insRemote/getInsByDomainCodeAndObjIds`
- **请求参数**:
  ```json
  {
    "page": 1,
    "size": 999999,
    "objIds": ["OBJ-17"],
    "domainCode": "32",
    "isQueryProperties": false,
    "isQueryPointData": false
  }
  ```
- **返回字段**:
  - `id`: 实例ID
  - `insId`: 实例标识
  - `insName`: 实例名称
  - `insStandardId`: 实例标准ID
  - `domainCode`: 域编号
  - `objName`: 模型名称

### 3. 查询测点实时数据

根据测点ID列表查询实时数据。

- **接口路径**: `POST /device_twin/reported/list`
- **请求参数**:
  ```json
  ["99.30176.1.1.7.1.1.1.1.666666", "5.5.1.2.2.1.1.1.5.1"]
  ```
- **返回字段**:
  - `{pointId}`: 测点ID为key
    - `reported_value`: 实时值
    - `reported_timestamp`: 更新时间戳

### 4. 测点历史数据明细查询

查询指定时间范围内测点的历史数据。

- **接口路径**: `POST /tsdb/point_data/v2/search`
- **请求参数**:
  ```json
  {
    "startTime": 1762470257170,
    "endTime": 1762480257170,
    "interval": "10",
    "function": "AVG",
    "strictRange": true,
    "pointList": ["13.10487.1.1.5.2.1.1.200.1"]
  }
  ```
- **参数说明**:
  - `startTime`: 开始时间（毫秒时间戳）
  - `endTime`: 结束时间（毫秒时间戳）
  - `interval`: 时间间隔（秒），可选
  - `function`: 聚合函数（MIN/MAX/AVG），可选
  - `strictRange`: 是否严格范围，可选
  - `pointList`: 测点ID列表

### 5. 通过SQL查询测点历史数据

使用SQL语句查询时序数据库中的测点历史数据。

- **接口路径**: `POST /tsdb/point_data/v2/sql/search`
- **请求参数**:
  ```json
  {
    "domainKey": "13",
    "sql": "select ts,data from t_13_xxx limit 10"
  }
  ```

### 6. 查询测点列表

根据实例标准ID列表查询关联的测点。

**重要**: 此接口参数为数组格式，不是对象！

- **接口路径**: `POST /cmdb/insRemote/getPointDataByInsStandardIds`
- **请求参数**:
  ```json
  ["29.0.1.2.3.4", "2.1.1.2.3.4", "1.1.1.2.3.4"]
  ```
- **返回字段**:
  - 返回一个数组，每个元素包含:
    - `insStandardId`: 实例标准ID
    - `name`: 测点名称
    - `insPointStandardId`: 测点标准ID
    - `unit`: 单位
    - `domainCode`: 域编号
    - `objId`: 模型ID

### 7. 根据源实例查询目标实例

根据源实例ID查询关联的目标实例。

- **接口路径**: `POST /cmdb/insAsstRemote/getDownInsByAsstIdBatch`
- **请求参数**:
  ```json
  {
    "insId": "100",
    "asstId": "GXLX-1"
  }
  ```

### 8. 查询实例列表

分页查询CMDB中的设备实例列表。

- **接口路径**: `POST /cmdb/insRemote/list`
- **请求参数**:
  ```json
  {
    "current": 1,
    "size": 10,
    "queryFilter": {}
  }
  ```

## 使用方式

直接告诉WorkBuddy你需要查询什么，例如：

- "帮我查询所有设备模型"
- "查询域32下IT房间的所有实例"
- "查询测点5.5.1.2.2.1.1.1.5.1的实时数据"
- "查询测点13.10487.1.1.5.2.1.1.200.1最近24小时的历史数据"

## 脚本说明

`scripts/zhihang_api.py` 提供了API调用的封装，可以直接使用。运行前确保已安装依赖：

```bash
pip install requests
