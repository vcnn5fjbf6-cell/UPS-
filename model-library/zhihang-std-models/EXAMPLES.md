# 智航标准模型库 - 使用示例

## 示例 1: 基础查询

```python
from scripts.std_models import (
    get_device_model,
    list_device_models,
    search_device_models
)

# 获取单个设备模型信息
model = get_device_model("三相UPS")
print(model)
# 输出:
# {
#   "id": 17,
#   "name": "三相UPS",
#   "ref_id": "1.1.5.2",
#   "subclass_code": "1.1.5.2",
#   "class_name": "不间断电源",
#   "class_code": "1.1.5",
#   "subject_name": "电气"
# }

# 列出所有设备模型
all_models = list_device_models()

# 按专业筛选
electrical_models = list_device_models(subject="电气")

# 搜索设备
ups_models = search_device_models("UPS")
```

## 示例 2: 测点标准查询

```python
from scripts.std_models import get_device_points, generate_point_id

# 获取三相UPS的所有AI测点
points = get_device_points("三相UPS", point_type="AI")
for p in points[:5]:
    print(f"{p['standard_name']}: {p['standard_point_id']}")

# 输出:
# 主路_AB_线电压_V: 1.1.5.2.1.1.1
# 主路_BC_线电压_V: 1.1.5.2.2.1.1
# 主路_CA_线电压_V: 1.1.5.2.3.1.1
# ...

# 生成标准测点ID
point_id = generate_point_id("1.1.5.2", "AI", 1)
print(point_id)  # 输出: 1.1.5.2.1.1.1
```

## 示例 3: 与 zhihang-cmdb Skill 配合使用

### 步骤 1: 配置 obj_id 映射（重要）

数据中心域号已经预配置在 `datacenter_config.py` 中，但 `obj_id_map` 需要根据实际情况填充。

编辑 `scripts/datacenter_config.py`，为每个数据中心添加 `ref_id` 到智航 `objId` 的映射：

```python
DATACENTER_CONFIG = {
    "北京M6数据中心": {
        "domain_code": "32",
        "buildings": {"M6数据中心A": "32"},
        "obj_id_map": {
            "1.1.5.2": "OBJ-17",   # 三相UPS -> 智航模型ID
            "1.1.2.1": "OBJ-05",   # 变压器 -> 智航模型ID
            "1.2.1.1": "OBJ-30",   # 水冷精密空调 -> 智航模型ID
            # ... 更多映射
        }
    }
}
```

**如何获取 objId？**

可以通过智航 CMDB 的 `get_all_models()` 接口获取所有模型列表，然后建立映射关系：

```python
from zhihang_api import ZhiHangCMDB

client = ZhiHangCMDB(use_internal=True)
models = client.get_all_models()

for model in models:
    print(f"ObjID: {model['objId']}, 名称: {model['objName']}")
```

### 步骤 2: 查询设备实例

```python
# 导入标准模型库
import sys
sys.path.insert(0, '/Users/deenheao/.workbuddy/skills/zhihang-std-models/scripts')
from std_models import get_cmdb_query_params

# 导入 CMDB API
sys.path.insert(0, '/Users/deenheao/.workbuddy/skills/zhihang-cmdb/scripts')
from zhihang_api import get_devices

# 获取查询参数
params = get_cmdb_query_params(
    datacenter="北京一号数据中心",
    device_model="三相UPS"
)
print(params)
# 输出:
# {
#   "domain_code": "32",
#   "obj_ids": ["OBJ-17"],
#   "ref_id": "1.1.5.2",
#   "device_name": "三相UPS",
#   "class_name": "不间断电源",
#   "subject_name": "电气"
# }

# 查询设备实例
devices = get_devices(
    domain_code=params["domain_code"],
    obj_ids=params["obj_ids"]
)

for device in devices:
    print(f"设备: {device['insName']}, ID: {device['insId']}")
```

## 示例 4: 批量查询某数据中心所有设备

```python
from scripts.std_models import list_device_models, get_model_ref_id
from scripts.datacenter_config import get_obj_id, get_datacenter_config

# 获取数据中心配置
dc_name = "北京一号数据中心"
dc_config = get_datacenter_config(dc_name)

if dc_config:
    domain_code = dc_config["domain_code"]
    
    # 获取该数据中心支持的所有设备类型
    supported_devices = []
    for ref_id, obj_id in dc_config["obj_id_map"].items():
        # 查找对应的设备名称
        models = list_device_models()
        for model in models:
            if model["ref_id"] == ref_id:
                supported_devices.append({
                    "name": model["name"],
                    "ref_id": ref_id,
                    "obj_id": obj_id
                })
                break
    
    print(f"{dc_name} 支持的设备类型:")
    for dev in supported_devices:
        print(f"  - {dev['name']} (objId: {dev['obj_id']})")
```

## 示例 5: 完整的设备数据查询流程

```python
import sys
sys.path.insert(0, '/Users/deenheao/.workbuddy/skills/zhihang-std-models/scripts')
sys.path.insert(0, '/Users/deenheao/.workbuddy/skills/zhihang-cmdb/scripts')

from std_models import (
    get_device_model,
    get_device_points,
    generate_point_id
)
from zhihang_api import ZhiHangCMDB

# 配置
datacenter = "北京一号数据中心"
device_model = "三相UPS"

# 1. 获取设备模型信息
model = get_device_model(device_model)
print(f"设备模型: {model['name']}")
print(f"RefID: {model['ref_id']}")
print(f"所属分类: {model['class_name']}")

# 2. 获取该设备的标准测点
points = get_device_points(device_model)
print(f"\n标准测点数量: {len(points)}")

# 3. 生成示例测点ID
example_point = points[0]
point_id = generate_point_id(
    model['ref_id'],
    example_point['point_type'],
    example_point['point_seq_id']
)
print(f"示例测点: {example_point['standard_name']}")
print(f"测点ID: {point_id}")

# 4. 查询实时数据（需要配置好数据中心映射）
# client = ZhiHangCMDB(use_internal=True)
# realtime_data = client.get_realtime_data([point_id])
# print(f"实时数据: {realtime_data}")
```

## 示例 6: 动态添加数据中心配置

```python
from scripts.datacenter_config import add_datacenter, get_datacenter_config

# 动态添加配置
add_datacenter(
    name="上海二号数据中心",
    domain_code="33",
    obj_id_map={
        "1.1.5.2": "OBJ-17",
        "1.2.1.1": "OBJ-30",
    }
)

# 验证配置
config = get_datacenter_config("上海二号数据中心")
print(config)
```

## 数据结构参考

### 设备模型层级

```
电气 (subject)
  └── 不间断电源 (class)
        └── 三相UPS (subclass, ref_id: 1.1.5.2)
        └── 单相UPS (subclass, ref_id: 1.1.5.1)
        └── HVDC (subclass, ref_id: 1.1.5.3)
```

### 测点ID格式

```
{device_ref_id}.{point_type_code}.{seq_id}.1

示例:
1.1.5.2.1.1.1
│ │ │ │ │ │ │
│ │ │ │ │ │ └── 固定后缀
│ │ │ │ │ └──── 测点序号 (1, 2, 3...)
│ │ │ │ └────── 测点类型 (1=AI, 2=DI, 3=AO, 4=DO)
│ │ │ └──────── 设备标识 (ref_id)
│ │ └──────────
│ └────────────
└──────────────
```

## 常见问题

### Q1: 如何找到设备的 ref_id?

```python
from scripts.std_models import search_device_models

# 搜索关键词
results = search_device_models("空调")
for r in results:
    print(f"{r['name']}: {r['ref_id']}")
```

### Q2: 如何获取某个专业的所有设备?

```python
from scripts.std_models import list_device_models

# 获取暖通专业所有设备
hvac_models = list_device_models(subject="暖通")
for model in hvac_models:
    print(f"{model['name']}: {model['ref_id']}")
```

### Q3: 测点类型对应的代码是什么?

```
AI (模拟量输入) -> 1
DI (数字量输入) -> 2
AO (模拟量输出) -> 3
DO (数字量输出) -> 4
```
