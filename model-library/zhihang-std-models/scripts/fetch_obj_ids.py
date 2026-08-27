# -*- coding: utf-8 -*-
"""
获取所有设备模型的 objId 映射
调用 zhihang-cmdb 外网接口，填充 GLOBAL_OBJ_ID_MAP
"""

import sys
import json

# 导入 zhihang-cmdb 的 API 封装
sys.path.insert(0, '/Users/deenheao/.workbuddy/skills/zhihang-cmdb/scripts')
from zhihang_api import ZhiHangCMDB


def fetch_and_match_obj_ids():
    """
    获取所有模型并匹配 ref_id -> objId
    """
    # 使用外网地址
    print("=" * 80)
    print("获取智航CMDB所有设备模型")
    print("=" * 80)
    
    client = ZhiHangCMDB(use_internal=False)
    
    # 获取所有模型
    print("\n[1] 调用接口获取所有模型...")
    try:
        models = client.get_all_models()
        print(f"✓ 成功获取 {len(models)} 个模型")
    except Exception as e:
        print(f"✗ 获取失败: {e}")
        return {}
    
    # 提取 objStandardId -> objId 映射
    print("\n[2] 解析模型数据...")
    mapping = {}
    unmatched = []
    
    for model in models:
        obj_id = model.get('objId')
        obj_name = model.get('objName')
        obj_standard_id = model.get('objStandardId')
        
        if obj_standard_id and obj_id:
            # objStandardId 格式通常是 "1.1.5.2" 这样的 ref_id
            mapping[obj_standard_id] = {
                'objId': obj_id,
                'objName': obj_name
            }
    
    print(f"✓ 提取到 {len(mapping)} 个有效映射")
    
    # 显示几个示例
    print("\n[3] 映射示例:")
    for i, (ref_id, info) in enumerate(list(mapping.items())[:10]):
        print(f"  {ref_id} -> {info['objId']} ({info['objName']})")
    
    return mapping


def generate_config_code(mapping):
    """
    生成填充好的配置代码
    """
    print("\n[4] 生成配置代码...")
    
    # 从 datacenter_config.py 导入现有的 GLOBAL_OBJ_ID_MAP 结构
    sys.path.insert(0, '/Users/deenheao/.workbuddy/skills/zhihang-std-models/scripts')
    from datacenter_config import GLOBAL_OBJ_ID_MAP
    
    filled_count = 0
    empty_count = 0
    
    lines = ["GLOBAL_OBJ_ID_MAP = {"]
    
    for ref_id, obj_id in GLOBAL_OBJ_ID_MAP.items():
        if ref_id in mapping:
            obj_id_value = mapping[ref_id]['objId']
            obj_name = mapping[ref_id]['objName']
            lines.append(f'    "{ref_id}": "{obj_id_value}",  # {obj_name}')
            filled_count += 1
        else:
            lines.append(f'    "{ref_id}": "",  # 未匹配到')
            empty_count += 1
    
    lines.append("}")
    
    print(f"✓ 已填充: {filled_count} 个")
    print(f"  未匹配: {empty_count} 个")
    
    return '\n'.join(lines)


def save_mapping_to_file(mapping, filename='obj_id_mapping.json'):
    """
    保存映射到 JSON 文件
    """
    output_path = f'/Users/deenheao/.workbuddy/skills/zhihang-std-models/scripts/{filename}'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    print(f"\n[5] 映射已保存到: {output_path}")


if __name__ == '__main__':
    # 获取映射
    mapping = fetch_and_match_obj_ids()
    
    if mapping:
        # 保存完整映射
        save_mapping_to_file(mapping)
        
        # 生成配置代码
        config_code = generate_config_code(mapping)
        
        # 保存配置代码
        config_path = '/Users/deenheao/.workbuddy/skills/zhihang-std-models/scripts/GLOBAL_OBJ_ID_MAP_filled.py'
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(config_code)
        print(f"[6] 配置代码已保存到: {config_path}")
        
        # 显示完整配置代码
        print("\n" + "=" * 80)
        print("生成的 GLOBAL_OBJ_ID_MAP 配置:")
        print("=" * 80)
        print(config_code)
    else:
        print("\n✗ 未能获取模型数据")
