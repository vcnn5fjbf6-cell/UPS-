---
name: 智航标准模型库
description: 智航CMDB设备标准模型库，提供设备模型名称到智航CMDB接口参数的映射。支持通过数据中心+设备模型名称快速获取设备实例查询参数。
---

# 智航标准模型库 Skill

本 skill 提供世纪互联数据中心基础设施标准设备模型库，用于将设备模型名称映射到智航 CMDB 的接口参数。

## 适用场景

- 根据设备模型名称获取智航 CMDB 的 `objId` 和 `domainCode`
- 快速查询某数据中心下某类设备的所有实例
- 获取设备模型的测点标准定义
- 生成标准测点 ID

## 数据结构

### 设备模型层级

```
专业 (subjects)
  └── 分类 (device_classes)
        └── 设备类型 (device_subclasses) ← ref_id 映射到智航 objId
```

### 核心映射关系

| 设备模型名称 | ref_id (设备标识) | 所属专业 |
|------------|------------------|---------|
| 高压配电柜 | 1.1.1.1 | 电气 |
| 变压器 | 1.1.2.1 | 电气 |
| 三相UPS | 1.1.5.2 | 电气 |
| 水冷精密空调 | 1.2.1.1 | 暖通 |
| 温度传感器 | 1.3.1.2 | 弱电 |
| ... | ... | ... |

### 测点类型定义

- **AI**: 模拟量输入 (Analog Input)
- **DI**: 数字量输入 (Digital Input)
- **AO**: 模拟量输出 (Analog Output)
- **DO**: 数字量输出 (Digital Output)

### 测点ID生成规则

```
标准测点ID = {device_ref_id}.{point_seq_id}.1

示例:
- 设备: 三相UPS (ref_id: 1.1.5.2)
- 测点: AB线电压 (AI类型, seq: 1)
- 标准测点ID: 1.1.5.2.1.1.1
```

## 使用方式

### 1. 查询设备模型信息

```python
from scripts.std_models import get_device_model, list_device_models

# 获取单个设备模型
model = get_device_model("三相UPS")
print(model)
# {
#   "name": "三相UPS",
#   "ref_id": "1.1.5.2",
#   "class_name": "不间断电源",
#   "subject_name": "电气"
# }

# 列出所有设备模型
models = list_device_models()
```

### 2. 获取智航 CMDB 查询参数

```python
from scripts.std_models import get_cmdb_query_params

# 获取查询参数（需要配合数据中心域号表使用）
params = get_cmdb_query_params(
    datacenter="某数据中心名称",
    device_model="三相UPS"
)
print(params)
# {
#   "domain_code": "32",      # 数据中心域号
#   "obj_ids": ["OBJ-XX"],    # 智航模型ID（需要映射表）
#   "ref_id": "1.1.5.2"       # 设备标识
# }
```

### 3. 查询设备测点标准

```python
from scripts.std_models import get_device_points, generate_point_id

# 获取某设备类型的所有标准测点
points = get_device_points("三相UPS")

# 生成标准测点ID
point_id = generate_point_id("1.1.5.2", "AI", 1)
# 返回: "1.1.5.2.1.1.1"
```

## 与 zhihang-cmdb Skill 配合使用

```python
# 1. 获取查询参数
from zhihang_std_models.scripts.std_models import get_cmdb_query_params
params = get_cmdb_query_params("北京一号数据中心", "三相UPS")

# 2. 调用 zhihang-cmdb 查询设备
from zhihang_cmdb.scripts.zhihang_api import get_devices
devices = get_devices(
    domain_code=params["domain_code"],
    obj_ids=params["obj_ids"]
)
```

## 数据表说明

### device_subclasses (设备子类)
- `id`: 主键
- `class_id`: 所属分类ID
- `subclass_code`: 子类代码
- `ref_id`: 设备标识（映射到智航 objId）
- `name`: 设备名称
- `sort_order`: 排序

### point_standards (测点标准)
- `id`: 主键
- `subclass_id`: 设备子类ID
- `device_ref_id`: 设备标识
- `point_type`: 测点类型 (AI/DI/AO/DO)
- `point_seq_id`: 测点序号
- `standard_name`: 标准测点名称
- `unit`: 单位
- `alert_level`: 告警级别

## 依赖

```bash
pip install sqlite3
```

## 数据来源

本 skill 数据来源于世纪互联 DC 运维部测点标准库 V1.6
