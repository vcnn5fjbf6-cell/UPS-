# 待办：内网查询 objId 并回填标准模型库

> 此文件由 WorkBuddy 生成，请在**可访问内网**的公司电脑上让 agent 执行以下操作。
> 完成后将更新后的 `datacenter_config.py` 替换回本技能包目录即可。

---

## 背景

智航标准模型库中每个设备类型都有一个 `ref_id`（如水冷冷水机组 = `1.2.2.1`），  
但调用 zhihang-cmdb **接口2（按域号+objId 查设备实例）** 时，需要的是智航系统自己的 `objId`（如 `17`）。

`objId` 需要通过 **接口1（获取所有模型列表）** 从内网查询后建立映射。

---

## 第一步：调用接口1，获取所有模型列表

在公司电脑上运行以下 Python 脚本（需能访问内网 `gateway.meta42.indc.vnet.com`）：

```python
# 脚本路径：zhihang-cmdb/scripts/zhihang_api.py 已包含封装

import sys
sys.path.insert(0, '/path/to/.workbuddy/skills/zhihang-cmdb/scripts')
from zhihang_api import ZhiHangCMDB

client = ZhiHangCMDB(use_internal=True)  # 内网模式
models = client.get_all_models()

# 打印所有模型，找到对应的 objId
for m in models:
    print(f"objId: {m.get('objId') or m.get('id'):<6} | 名称: {m.get('objName') or m.get('name')}")
```

**或者让 agent 直接执行：**
```
请帮我调用智航CMDB接口1，获取所有设备模型列表，打印 objId 和名称
```

---

## 第二步：建立 ref_id → objId 映射

对照下表，从接口1返回结果中找到对应的 `objId`，填入右侧 `?` 处：

### 暖通 - 冷源设备（优先级最高）

| 设备名称 | ref_id | objId（待填） |
|---------|--------|--------------|
| 水冷冷水机组 | `1.2.2.1` | `?` |
| 风冷冷水机组 | `1.2.2.2` | `?` |
| 开式冷却塔 | `1.2.2.3` | `?` |
| 闭式冷却塔 | `1.2.2.4` | `?` |
| 冷冻泵 | `1.2.2.13` | `?` |
| 冷却泵 | `1.2.2.14` | `?` |
| 板式换热器 | `1.2.2.11` | `?` |

### 暖通 - 末端设备

| 设备名称 | ref_id | objId（待填） |
|---------|--------|--------------|
| 水冷精密空调 | `1.2.1.1` | `?` |
| 风冷精密空调 | `1.2.1.2` | `?` |
| 水冷型AHU | `1.2.1.3` | `?` |
| 风冷型AHU | `1.2.1.4` | `?` |

### 电气设备

| 设备名称 | ref_id | objId（待填） |
|---------|--------|--------------|
| 三相UPS | `1.1.5.2` | `?` |
| 单相UPS | `1.1.5.1` | `?` |
| HVDC | `1.1.5.3` | `?` |
| 变压器 | `1.1.2.1` | `?` |
| 高压配电柜 | `1.1.1.1` | `?` |
| 低压配电柜 | `1.1.3.1` | `?` |
| 低压柴油发电机 | `1.1.4.1` | `?` |
| 高压柴油发电机 | `1.1.4.2` | `?` |

---

## 第三步：更新 datacenter_config.py

找到文件 `zhihang-std-models/scripts/datacenter_config.py`，  
将每个数据中心的 `obj_id_map` 字典按以下格式填入（**objId 是全局一致的，所有数据中心共用**）：

```python
# 所有数据中心的 obj_id_map 填写相同的映射（objId 是全局模型ID，跟数据中心无关）
# 示例（假设查到水冷冷水机组的 objId 是 "17"）：

"北京东部数据中心": {
    "domain_code": "42",
    "buildings": {"北京东部数据中心A": "42"},
    "obj_id_map": {
        "1.2.2.1": "17",   # 水冷冷水机组
        "1.2.2.2": "18",   # 风冷冷水机组
        "1.1.5.2": "5",    # 三相UPS
        # ... 其他设备
    }
},
```

> 💡 **注意**：`objId` 是智航 CMDB 的**全局模型 ID**，与数据中心无关。  
> 建议在 `datacenter_config.py` 顶部维护一个全局映射字典，然后让所有数据中心引用同一份，例如：

```python
# 推荐做法：在文件顶部定义全局映射
GLOBAL_OBJ_ID_MAP = {
    "1.2.2.1": "??",   # 水冷冷水机组
    "1.2.2.2": "??",   # 风冷冷水机组
    "1.2.2.3": "??",   # 开式冷却塔
    "1.2.2.4": "??",   # 闭式冷却塔
    "1.2.2.11": "??",  # 板式换热器
    "1.2.2.13": "??",  # 冷冻泵
    "1.2.2.14": "??",  # 冷却泵
    "1.2.1.1": "??",   # 水冷精密空调
    "1.2.1.2": "??",   # 风冷精密空调
    "1.2.1.3": "??",   # 水冷型AHU
    "1.2.1.4": "??",   # 风冷型AHU
    "1.1.5.2": "??",   # 三相UPS
    "1.1.5.1": "??",   # 单相UPS
    "1.1.5.3": "??",   # HVDC
    "1.1.2.1": "??",   # 变压器
    "1.1.1.1": "??",   # 高压配电柜
    "1.1.3.1": "??",   # 低压配电柜
    "1.1.4.1": "??",   # 低压柴油发电机
    "1.1.4.2": "??",   # 高压柴油发电机
}

# 然后每个数据中心这样写：
"北京东部数据中心": {
    "domain_code": "42",
    "buildings": {"北京东部数据中心A": "42"},
    "obj_id_map": GLOBAL_OBJ_ID_MAP   # 直接引用全局映射
},
```

---

## 第四步：验证

填写完成后，运行以下验证脚本确认配置正确：

```python
import sys
sys.path.insert(0, '/path/to/.workbuddy/skills/zhihang-std-models/scripts')
sys.path.insert(0, '/path/to/.workbuddy/skills/zhihang-cmdb/scripts')

from std_models import get_cmdb_query_params
from zhihang_api import ZhiHangCMDB

# 1. 获取查询参数
params = get_cmdb_query_params("北京东部数据中心", "水冷冷水机组")
print(f"域号: {params['domain_code']}")
print(f"objId: {params['obj_ids']}")

# 2. 调用 CMDB 接口2 查询设备实例
client = ZhiHangCMDB(use_internal=True)
devices = client.get_devices_by_domain_and_obj(
    domain_code=params['domain_code'],
    obj_ids=params['obj_ids']
)
print(f"\n北京东部数据中心 - 水冷冷水机组 设备清单 ({len(devices)} 台):")
for d in devices:
    print(f"  - {d.get('instanceName') or d.get('name')}")
```

---

## 完成后

将更新好的 `datacenter_config.py` 文件同步回：
```
~/.workbuddy/skills/zhihang-std-models/scripts/datacenter_config.py
```

之后就可以直接用以下指令查询：
```
查询北京东部数据中心的所有冷机设备清单
查询上海外高桥数据中心的三相UPS
```
