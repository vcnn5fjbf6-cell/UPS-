# -*- coding: utf-8 -*-
"""
智航标准模型库
提供设备模型名称到智航CMDB接口参数的映射
"""

import sqlite3
import os
from typing import List, Dict, Optional, Any

# 数据库路径
DB_PATH = os.path.join(os.path.dirname(__file__), 'standard_db.sqlite')

# 从 datacenter_config 导入配置
from datacenter_config import DATACENTER_CONFIG, get_domain_code, get_obj_id

# 兼容旧代码的映射表引用
DATACENTER_DOMAIN_MAP = DATACENTER_CONFIG


def get_db_connection() -> sqlite3.Connection:
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_device_model(device_name: str) -> Optional[Dict[str, Any]]:
    """
    根据设备名称获取设备模型信息
    
    Args:
        device_name: 设备模型名称，如 "三相UPS"
    
    Returns:
        设备模型信息字典，未找到返回 None
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            dsc.id,
            dsc.name as device_name,
            dsc.ref_id,
            dsc.subclass_code,
            dc.name as class_name,
            dc.class_code,
            s.name as subject_name
        FROM device_subclasses dsc
        JOIN device_classes dc ON dsc.class_id = dc.id
        JOIN subjects s ON dc.subject_id = s.id
        WHERE dsc.name = ?
    """, (device_name,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "id": row["id"],
            "name": row["device_name"],
            "ref_id": row["ref_id"],
            "subclass_code": row["subclass_code"],
            "class_name": row["class_name"],
            "class_code": row["class_code"],
            "subject_name": row["subject_name"]
        }
    return None


def list_device_models(subject: str = None, class_name: str = None) -> List[Dict[str, Any]]:
    """
    列出所有设备模型
    
    Args:
        subject: 按专业筛选，如 "电气"
        class_name: 按分类筛选，如 "不间断电源"
    
    Returns:
        设备模型列表
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT 
            dsc.id,
            dsc.name as device_name,
            dsc.ref_id,
            dc.name as class_name,
            s.name as subject_name
        FROM device_subclasses dsc
        JOIN device_classes dc ON dsc.class_id = dc.id
        JOIN subjects s ON dc.subject_id = s.id
        WHERE 1=1
    """
    params = []
    
    if subject:
        query += " AND s.name = ?"
        params.append(subject)
    
    if class_name:
        query += " AND dc.name = ?"
        params.append(class_name)
    
    query += " ORDER BY s.sort_order, dc.sort_order, dsc.sort_order"
    
    cursor.execute(query, params)
    
    results = []
    for row in cursor.fetchall():
        results.append({
            "id": row["id"],
            "name": row["device_name"],
            "ref_id": row["ref_id"],
            "class_name": row["class_name"],
            "subject_name": row["subject_name"]
        })
    
    conn.close()
    return results


def search_device_models(keyword: str) -> List[Dict[str, Any]]:
    """
    搜索设备模型
    
    Args:
        keyword: 搜索关键词
    
    Returns:
        匹配的设备模型列表
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            dsc.id,
            dsc.name as device_name,
            dsc.ref_id,
            dc.name as class_name,
            s.name as subject_name
        FROM device_subclasses dsc
        JOIN device_classes dc ON dsc.class_id = dc.id
        JOIN subjects s ON dc.subject_id = s.id
        WHERE dsc.name LIKE ? OR dsc.ref_id LIKE ?
        ORDER BY s.sort_order, dc.sort_order, dsc.sort_order
    """, (f"%{keyword}%", f"%{keyword}%"))
    
    results = []
    for row in cursor.fetchall():
        results.append({
            "id": row["id"],
            "name": row["device_name"],
            "ref_id": row["ref_id"],
            "class_name": row["class_name"],
            "subject_name": row["subject_name"]
        })
    
    conn.close()
    return results


def get_device_points(device_name: str, point_type: str = None) -> List[Dict[str, Any]]:
    """
    获取设备类型的标准测点列表
    
    Args:
        device_name: 设备模型名称
        point_type: 测点类型筛选 (AI/DI/AO/DO)
    
    Returns:
        测点标准列表
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 先获取设备的 ref_id
    cursor.execute("""
        SELECT ref_id FROM device_subclasses WHERE name = ?
    """, (device_name,))
    
    row = cursor.fetchone()
    if not row:
        conn.close()
        return []
    
    ref_id = row["ref_id"]
    
    # 查询测点标准
    query = """
        SELECT 
            ps.id,
            ps.device_ref_id,
            ps.point_type,
            ps.point_seq_id,
            ps.standard_name,
            ps.unit_text,
            ps.alert_level,
            ps.biz_attr,
            ps.remark
        FROM point_standards ps
        WHERE ps.device_ref_id = ? AND ps.is_deleted = 0
    """
    params = [ref_id]
    
    if point_type:
        query += " AND ps.point_type = ?"
        params.append(point_type)
    
    query += " ORDER BY ps.point_type, ps.point_seq_id"
    
    cursor.execute(query, params)
    
    results = []
    for row in cursor.fetchall():
        results.append({
            "id": row["id"],
            "device_ref_id": row["device_ref_id"],
            "point_type": row["point_type"],
            "point_seq_id": row["point_seq_id"],
            "standard_name": row["standard_name"],
            "unit": row["unit_text"],
            "alert_level": row["alert_level"],
            "biz_attr": row["biz_attr"],
            "description": row["remark"],
            "standard_point_id": f"{row['device_ref_id']}.{row['point_seq_id']}.1" if row['point_seq_id'] != 9999 else None
        })
    
    conn.close()
    return results


def generate_point_id(ref_id: str, point_type: str, seq_id: int) -> str:
    """
    生成标准测点ID
    
    Args:
        ref_id: 设备标识，如 "1.1.5.2"
        point_type: 测点类型 (AI/DI/AO/DO)
        seq_id: 测点序号
    
    Returns:
        标准测点ID，如 "1.1.5.2.1.1.1"
    """
    type_map = {"AI": "1", "DI": "2", "AO": "3", "DO": "4"}
    type_code = type_map.get(point_type.upper(), "1")
    return f"{ref_id}.{type_code}.{seq_id}.1"


def parse_point_id(point_id: str) -> Dict[str, Any]:
    """
    解析标准测点ID
    
    Args:
        point_id: 标准测点ID，如 "1.1.5.2.1.1.1"
    
    Returns:
        解析结果字典
    """
    parts = point_id.split(".")
    if len(parts) < 7:
        return None
    
    type_map = {"1": "AI", "2": "DI", "3": "AO", "4": "DO"}
    
    return {
        "ref_id": ".".join(parts[:4]),
        "point_type": type_map.get(parts[4], "UNKNOWN"),
        "seq_id": parts[5],
        "suffix": parts[6]
    }


def get_cmdb_query_params(datacenter: str, device_model: str, building: str = None) -> Dict[str, Any]:
    """
    获取智航CMDB查询参数
    
    Args:
        datacenter: 数据中心名称
        device_model: 设备模型名称
        building: 楼栋名称（可选，多楼栋数据中心需要指定）
    
    Returns:
        查询参数字典
    """
    # 获取设备模型信息
    device = get_device_model(device_model)
    if not device:
        raise ValueError(f"未找到设备模型: {device_model}")
    
    # 获取数据中心域号
    domain_code = get_domain_code(datacenter, building)
    if not domain_code:
        raise ValueError(f"未找到数据中心配置: {datacenter}，请检查数据中心名称是否正确")
    
    # 获取 obj_id 映射（全局模型ID，与数据中心无关）
    ref_id = device["ref_id"]
    obj_id = get_obj_id(ref_id)
    
    return {
        "domain_code": domain_code,
        "obj_ids": [obj_id] if obj_id else [],
        "ref_id": ref_id,
        "device_name": device["name"],
        "class_name": device["class_name"],
        "subject_name": device["subject_name"],
        "datacenter": datacenter,
        "building": building
    }


def add_datacenter_config(
    name: str, 
    domain_code: str, 
    obj_id_map: Dict[str, str] = None
) -> None:
    """
    添加数据中心配置
    
    Args:
        name: 数据中心名称
        domain_code: 域号
        obj_id_map: ref_id 到智航 objId 的映射表
    """
    DATACENTER_DOMAIN_MAP[name] = {
        "domain_code": domain_code,
        "obj_id_map": obj_id_map or {}
    }


def list_subjects() -> List[Dict[str, Any]]:
    """获取所有专业列表"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM subjects ORDER BY sort_order")
    
    results = []
    for row in cursor.fetchall():
        results.append({
            "id": row["id"],
            "name": row["name"],
            "name_en": row["name_en"]
        })
    
    conn.close()
    return results


def list_classes(subject_id: int = None) -> List[Dict[str, Any]]:
    """
    获取分类列表
    
    Args:
        subject_id: 专业ID筛选
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if subject_id:
        cursor.execute("""
            SELECT dc.*, s.name as subject_name 
            FROM device_classes dc
            JOIN subjects s ON dc.subject_id = s.id
            WHERE dc.subject_id = ?
            ORDER BY dc.sort_order
        """, (subject_id,))
    else:
        cursor.execute("""
            SELECT dc.*, s.name as subject_name 
            FROM device_classes dc
            JOIN subjects s ON dc.subject_id = s.id
            ORDER BY s.sort_order, dc.sort_order
        """)
    
    results = []
    for row in cursor.fetchall():
        results.append({
            "id": row["id"],
            "name": row["name"],
            "code": row["class_code"],
            "subject_name": row["subject_name"]
        })
    
    conn.close()
    return results


# ==================== 便捷函数 ====================

def get_all_models() -> List[Dict[str, Any]]:
    """获取所有设备模型（便捷函数）"""
    return list_device_models()


def get_models_by_subject(subject: str) -> List[Dict[str, Any]]:
    """按专业获取设备模型"""
    return list_device_models(subject=subject)


def get_model_ref_id(device_name: str) -> Optional[str]:
    """获取设备模型的 ref_id"""
    model = get_device_model(device_name)
    return model["ref_id"] if model else None


if __name__ == "__main__":
    # 测试代码
    print("=" * 60)
    print("智航标准模型库 - 测试")
    print("=" * 60)
    
    # 1. 列出所有专业
    print("\n[1] 所有专业:")
    for subject in list_subjects():
        print(f"  - {subject['name']}")
    
    # 2. 查询设备模型
    print("\n[2] 查询设备模型 '三相UPS':")
    model = get_device_model("三相UPS")
    if model:
        print(f"  名称: {model['name']}")
        print(f"  RefID: {model['ref_id']}")
        print(f"  分类: {model['class_name']}")
        print(f"  专业: {model['subject_name']}")
    
    # 3. 搜索设备
    print("\n[3] 搜索关键词 '空调':")
    for m in search_device_models("空调"):
        print(f"  - {m['name']} ({m['ref_id']})")
    
    # 4. 获取测点标准
    print("\n[4] 三相UPS的AI测点:")
    points = get_device_points("三相UPS", "AI")
    for p in points[:5]:
        print(f"  - {p['standard_name']} ({p['standard_point_id']})")
    
    # 5. 生成测点ID
    print("\n[5] 生成测点ID:")
    point_id = generate_point_id("1.1.5.2", "AI", 1)
    print(f"  1.1.5.2 + AI + 1 = {point_id}")
    
    # 6. 解析测点ID
    print("\n[6] 解析测点ID '1.1.5.2.1.1.1':")
    parsed = parse_point_id("1.1.5.2.1.1.1")
    print(f"  RefID: {parsed['ref_id']}")
    print(f"  类型: {parsed['point_type']}")
    print(f"  序号: {parsed['seq_id']}")
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)
