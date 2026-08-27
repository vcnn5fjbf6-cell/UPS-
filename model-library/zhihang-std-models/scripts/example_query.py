# -*- coding: utf-8 -*-
"""
智航标准模型库 + CMDB 查询示例
展示如何通过数据中心名称和设备模型名称快速查询设备实例
"""

import sys
import os

# 添加技能路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from std_models import (
    get_device_model,
    get_device_points,
    generate_point_id,
    get_cmdb_query_params,
    search_device_models,
    list_device_models
)
from datacenter_config import (
    list_datacenters,
    search_datacenter,
    get_domain_code
)


def print_header(title):
    """打印标题"""
    print("\n" + "=" * 80)
    print(f" {title}")
    print("=" * 80)


def example_1_basic_query():
    """示例1: 基础查询 - 获取设备模型信息"""
    print_header("示例1: 获取设备模型信息")
    
    device_model = "三相UPS"
    model = get_device_model(device_model)
    
    if model:
        print(f"设备名称: {model['name']}")
        print(f"RefID: {model['ref_id']}")
        print(f"所属分类: {model['class_name']}")
        print(f"所属专业: {model['subject_name']}")
    else:
        print(f"未找到设备模型: {device_model}")


def example_2_list_datacenters():
    """示例2: 列出所有数据中心"""
    print_header("示例2: 数据中心列表")
    
    datacenters = list_datacenters()
    print(f"总计 {len(datacenters)} 个数据中心\n")
    
    # 显示前10个
    for i, dc in enumerate(datacenters[:10], 1):
        domain_code = get_domain_code(dc)
        print(f"{i}. {dc} (域号: {domain_code})")
    
    if len(datacenters) > 10:
        print(f"... 还有 {len(datacenters) - 10} 个数据中心")


def example_3_search_datacenter():
    """示例3: 搜索数据中心"""
    print_header("示例3: 搜索数据中心")
    
    keyword = "北京"
    results = search_datacenter(keyword)
    
    print(f"搜索关键词: '{keyword}'")
    print(f"找到 {len(results)} 个数据中心:\n")
    
    for dc in results[:10]:
        domain_code = get_domain_code(dc)
        print(f"  - {dc} (域号: {domain_code})")


def example_4_get_cmdb_params():
    """示例4: 获取CMDB查询参数"""
    print_header("示例4: 获取CMDB查询参数")
    
    datacenter = "北京M6数据中心"
    device_model = "三相UPS"
    
    try:
        params = get_cmdb_query_params(datacenter, device_model)
        
        print(f"数据中心: {params['datacenter']}")
        print(f"设备模型: {params['device_name']}")
        print(f"域号: {params['domain_code']}")
        print(f"RefID: {params['ref_id']}")
        print(f"分类: {params['class_name']}")
        print(f"专业: {params['subject_name']}")
        
        if params['obj_ids']:
            print(f"智航ObjID: {params['obj_ids']}")
        else:
            print("智航ObjID: 未配置（需要在 datacenter_config.py 中设置 obj_id_map）")
        
        print("\n生成的查询参数可直接用于 zhihang-cmdb 技能:")
        print(f"  domain_code: {params['domain_code']}")
        print(f"  obj_ids: {params['obj_ids']}")
        
    except ValueError as e:
        print(f"错误: {e}")


def example_5_device_points():
    """示例5: 获取设备测点标准"""
    print_header("示例5: 获取设备测点标准")
    
    device_model = "三相UPS"
    points = get_device_points(device_model, point_type="AI")
    
    print(f"设备: {device_model}")
    print(f"AI测点数量: {len(points)}\n")
    
    print("前5个测点:")
    for p in points[:5]:
        print(f"  - {p['standard_name']}")
        print(f"    测点ID: {p['standard_point_id']}")
        print(f"    单位: {p['unit'] or '无'}")
        print()


def example_6_generate_point_id():
    """示例6: 生成测点ID"""
    print_header("示例6: 生成测点ID")
    
    # 获取设备模型
    model = get_device_model("三相UPS")
    ref_id = model['ref_id']
    
    print(f"设备: 三相UPS")
    print(f"RefID: {ref_id}\n")
    
    # 生成不同类型测点的ID
    point_types = [
        ("AI", 1, "AB线电压"),
        ("AI", 2, "BC线电压"),
        ("DI", 1, "开关状态"),
    ]
    
    print("生成的测点ID:")
    for pt_type, seq_id, desc in point_types:
        point_id = generate_point_id(ref_id, pt_type, seq_id)
        print(f"  - {desc} ({pt_type}): {point_id}")


def example_7_search_devices():
    """示例7: 搜索设备模型"""
    print_header("示例7: 搜索设备模型")
    
    keyword = "空调"
    results = search_device_models(keyword)
    
    print(f"搜索关键词: '{keyword}'")
    print(f"找到 {len(results)} 个设备模型:\n")
    
    for model in results:
        print(f"  - {model['name']}")
        print(f"    RefID: {model['ref_id']}")
        print(f"    分类: {model['class_name']}")
        print()


def example_8_full_workflow():
    """示例8: 完整工作流程"""
    print_header("示例8: 完整工作流程")
    
    print("场景: 查询北京M6数据中心所有三相UPS设备\n")
    
    # 步骤1: 获取查询参数
    datacenter = "北京M6数据中心"
    device_model = "三相UPS"
    
    print("步骤1: 获取CMDB查询参数")
    try:
        params = get_cmdb_query_params(datacenter, device_model)
        print(f"  ✓ 域号: {params['domain_code']}")
        print(f"  ✓ RefID: {params['ref_id']}")
        
        if params['obj_ids']:
            print(f"  ✓ ObjID: {params['obj_ids'][0]}")
        else:
            print(f"  ⚠ ObjID: 未配置")
        
        # 步骤2: 获取测点标准
        print("\n步骤2: 获取三相UPS测点标准")
        points = get_device_points(device_model, "AI")
        print(f"  ✓ 共 {len(points)} 个AI测点")
        
        # 步骤3: 生成示例测点ID
        print("\n步骤3: 生成示例测点ID")
        example_point = points[0]
        point_id = generate_point_id(
            params['ref_id'],
            example_point['point_type'],
            example_point['point_seq_id']
        )
        print(f"  ✓ {example_point['standard_name']}: {point_id}")
        
        # 步骤4: 显示最终查询参数
        print("\n步骤4: 最终查询参数（可用于 zhihang-cmdb）")
        print("  {")
        print(f"    'domain_code': '{params['domain_code']}',")
        print(f"    'obj_ids': {params['obj_ids']},")
        print(f"    'point_id': '{point_id}'")
        print("  }")
        
        print("\n✅ 工作流程完成!")
        print("\n下一步: 使用 zhihang-cmdb 技能查询设备实例和实时数据")
        
    except ValueError as e:
        print(f"  ✗ 错误: {e}")


if __name__ == "__main__":
    print("\n" + "=" * 80)
    print(" 智航标准模型库 + CMDB 查询示例")
    print("=" * 80)
    
    # 运行所有示例
    example_1_basic_query()
    example_2_list_datacenters()
    example_3_search_datacenter()
    example_4_get_cmdb_params()
    example_5_device_points()
    example_6_generate_point_id()
    example_7_search_devices()
    example_8_full_workflow()
    
    print("\n" + "=" * 80)
    print(" 所有示例运行完成")
    print("=" * 80)
