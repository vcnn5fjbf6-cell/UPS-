# -*- coding: utf-8 -*-
"""
数据中心配置
包含所有数据中心的域号映射和楼栋性质
数据来源：数据中心空间主数据清洗(1).xlsx
更新日期：2026-04-13
"""

from typing import Dict, Any

# ============================================================
# 全局设备模型 objId 映射
# ============================================================
GLOBAL_OBJ_ID_MAP = {
    "1.1.1.1": "OBJ-341",  # 高压配电柜
    "1.1.1.2": "OBJ-448",  # 中压备自投PLC
    "1.1.2.1": "OBJ-342",  # 变压器
    "1.1.3.1": "OBJ-343",  # 低压配电柜
    "1.1.3.2": "OBJ-345",  # ATMT
    "1.1.3.3": "OBJ-346",  # 三相ATS_STS
    "1.1.3.4": "OBJ-347",  # 单相ATS
    "1.1.3.5": "OBJ-348",  # 变频器
    "1.1.3.6": "OBJ-349",  # 开关模块
    "1.1.3.7": "OBJ-350",  # 电流模块
    "1.1.3.8": "OBJ-449",  # 低压备自投PLC
    "1.1.3.9": "OBJ-467",  # 低压无功补偿装置
    "1.1.4.1": "OBJ-351",  # 低压柴油发电机
    "1.1.4.2": "OBJ-352",  # 高压柴油发电机
    "1.1.4.3": "OBJ-353",  # 供油控制柜
    "1.1.4.6": "OBJ-354",  # 柴发并机控制柜
    "1.1.5.1": "OBJ-355",  # 单相UPS
    "1.1.5.2": "OBJ-356",  # 三相UPS
    "1.1.5.3": "OBJ-357",  # HVDC
    "1.1.5.4": "OBJ-358",  # EPS
    "1.1.5.5": "OBJ-359",  # 直流屏
    "1.1.5.6": "OBJ-442",  # 巴拿马电源
    "1.1.5.7": "OBJ-462",  # 48V直流柜
    "1.1.6.1": "OBJ-360",  # 铅酸阀控蓄电池
    "1.1.6.2": "OBJ-430",  # 锂电池组
    "1.1.7.1": "OBJ-361",  # 交流列头柜
    "1.1.7.2": "OBJ-362",  # 直流列头柜
    "1.1.7.3": "OBJ-363",  # 始端箱
    "1.1.7.4": "OBJ-364",  # 交流支路空开
    "1.1.7.5": "OBJ-365",  # 直流支路空开
    "1.1.8.1": "OBJ-366",  # 交流PDU
    "1.1.8.2": "OBJ-367",  # 直流PDU
    "1.1.88.1": "OBJ-466",  # 测试用交流PDU
    "1.10.1.1": "OBJ-421",  # 通用设备
    "1.2.1.1": "OBJ-368",  # 水冷型精密空调
    "1.2.1.10": "OBJ-453",  # 风冷氟泵空调
    "1.2.1.11": "OBJ-454",  # 水冷氟泵相变多联内机
    "1.2.1.12": "OBJ-437",  # 热回收机组
    "1.2.1.2": "OBJ-369",  # 风冷型精密空调
    "1.2.1.3": "OBJ-370",  # 水冷型AHU
    "1.2.1.4": "OBJ-371",  # 风冷型AHU
    "1.2.1.5": "OBJ-372",  # 新风机
    "1.2.1.6": "OBJ-373",  # 除湿机
    "1.2.1.7": "OBJ-374",  # 湿膜加湿器
    "1.2.1.8": "OBJ-375",  # 恒湿机
    "1.2.1.9": "OBJ-376",  # 送风地板
    "1.2.2.1": "OBJ-377",  # 水冷冷水机组
    "1.2.2.10": "OBJ-386",  # 水池（箱）
    "1.2.2.11": "OBJ-387",  # 板式换热器
    "1.2.2.12": "OBJ-388",  # 补水系统
    "1.2.2.13": "OBJ-389",  # 冷冻泵
    "1.2.2.14": "OBJ-390",  # 冷却泵
    "1.2.2.15": "OBJ-391",  # 其他水泵
    "1.2.2.17": "OBJ-443",  # CDU
    "1.2.2.18": "OBJ-445",  # 远传水表
    "1.2.2.19": "OBJ-450",  # 氟泵外机
    "1.2.2.2": "OBJ-378",  # 风冷冷水机组
    "1.2.2.20": "OBJ-469",  # 干冷器
    "1.2.2.3": "OBJ-379",  # 开式冷却塔
    "1.2.2.4": "OBJ-380",  # 闭式冷却塔
    "1.2.2.5": "OBJ-381",  # 电加热
    "1.2.2.6": "OBJ-382",  # 开式蓄冷罐
    "1.2.2.7": "OBJ-383",  # 闭式蓄冷罐
    "1.2.2.8": "OBJ-384",  # 加药装置
    "1.2.2.9": "OBJ-385",  # 定压装置
    "1.2.3.1": "OBJ-393",  # 开关阀门
    "1.2.3.2": "OBJ-394",  # 调节阀门
    "1.2.3.3": "OBJ-395",  # 冷冻总管
    "1.2.3.4": "OBJ-396",  # 冷却总管
    "1.2.3.5": "OBJ-397",  # 电伴热
    "1.2.3.6": "OBJ-398",  # 机组支管
    "1.2.3.7": "OBJ-399",  # 末端管路及室外
    "1.2.3.8": "OBJ-418",  # 分水器
    "1.2.3.9": "OBJ-419",  # 集水器
    "1.3.1.1": "OBJ-400",  # 温湿度传感器
    "1.3.1.2": "OBJ-401",  # 温度传感器
    "1.3.1.3": "OBJ-402",  # 定位漏液检测器
    "1.3.1.4": "OBJ-403",  # 区域漏液检测器
    "1.3.1.5": "OBJ-404",  # 气体浓度检测器
    "1.3.1.6": "OBJ-405",  # 压力传感器
    "1.3.1.7": "OBJ-406",  # 流量传感器
    "1.3.1.8": "OBJ-407",  # 液位传感器
    "1.3.2.1": "OBJ-439",  # 服务器
    "1.3.2.3": "OBJ-440",  # 采集器
    "1.3.2.5": "OBJ-435",  # 串口服务器
    "1.3.2.6": "OBJ-468",  # 液冷机柜设备
    "1.3.3.1": "OBJ-424",  # 动环监控系统
    "1.3.3.2": "OBJ-441",  # 虚拟串口
    "1.3.3.3": "OBJ-447",  # BA监控系统
    "1.4.1.1": "OBJ-408",  # 消防主机
    "1.4.1.10": "OBJ-417",  # 空气采样
    "1.4.1.9": "OBJ-416",  # 消防设备
    "1.8.8.8": "OBJ-438",  # 电池测试模型
    "2.1.1.1": "OBJ-2",  # 区域
    "2.2.1.1": "OBJ-3",  # 数据中心
    "2.3.1.1": "OBJ-4",  # 楼栋
    "2.4.1.1": "OBJ-5",  # 楼层
    "2.5.1.1": "OBJ-16",  # 设施房间
    "2.5.1.2": "OBJ-17",  # IT房间
    "2.6.1.1": "OBJ-8",  # 机列
    "2.7.1.1": "OBJ-9",  # 机柜
    "2.8.1.1": "OBJ-321",  # 冷通道
    "2.9.1.1": "OBJ-340",  # 热通道
    "3.1.1.2": "OBJ-432",  # 高压配电柜组
    "3.1.2.2": "OBJ-463",  # 电力模组
    "3.1.3.3": "OBJ-426",  # UPS组
    "3.1.3.4": "OBJ-428",  # UPS输出开关组
    "3.1.3.5": "OBJ-425",  # PDU组
}

# ============================================================
# 数据中心配置
# ============================================================
# 每个数据中心包含：
#   - domain_code: 主域号
#   - instance: 智航实例编码
#   - region: 所属区域
#   - buildings: {楼栋名: 域号}
#   - building_natures: {楼栋名: 性质}，性质为"自建"/"代维"/"自营"
#   - obj_id_map: 设备模型映射（引用 GLOBAL_OBJ_ID_MAP）

DATACENTER_CONFIG = {
    # ========== 华北一区 ==========
    "北京B28数据中心": {
        "domain_code": "13",
        "instance": "HB1",
        "region": "华北一区",
        "buildings": {
            "B28数据中心A": "13",
        },
        "building_natures": {
            "B28数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "北京M3数据中心": {
        "domain_code": "1",
        "instance": "HB5",
        "region": "华北一区",
        "buildings": {
            "M3数据中心A": "1",
        },
        "building_natures": {
            "M3数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "北京M5数据中心": {
        "domain_code": "68",
        "instance": "HBDW1",
        "region": "华北一区",
        "buildings": {
            "M5": "68",
        },
        "building_natures": {
            "M5": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "北京M6V数据中心": {
        "domain_code": "14",
        "instance": "HB4",
        "region": "华北一区",
        "buildings": {
            "M5二三期": "14",
            "M6V数据中心": "23",
        },
        "building_natures": {
            "M5二三期": "自建",
            "M6V数据中心": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "北京M6数据中心": {
        "domain_code": "32",
        "instance": "HB3",
        "region": "华北一区",
        "buildings": {
            "M6数据中心A": "32",
        },
        "building_natures": {
            "M6数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "北京海淀联通五棵松数据中心": {
        "domain_code": "82",
        "instance": "HBDW2",
        "region": "华北一区",
        "buildings": {
            "北京联通五棵松数据中心A": "82",
        },
        "building_natures": {
            "北京联通五棵松数据中心A": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "北京顺义腾仁数据中心": {
        "domain_code": "40",
        "instance": "HB6",
        "region": "华北一区",
        "buildings": {
            "顺义腾仁数据中心A": "40",
            "顺义腾仁数据中心D": "89",
        },
        "building_natures": {
            "顺义腾仁数据中心A": "自建",
            "顺义腾仁数据中心D": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "河北怀来基地数据中心": {
        "domain_code": "90",
        "instance": "HB25",
        "region": "华北一区",
        "buildings": {
            "河北怀来基地数据中心1#楼": "90",
            "河北怀来基地数据中心2#楼": "136",
        },
        "building_natures": {
            "河北怀来基地数据中心1#楼": "自建",
            "河北怀来基地数据中心2#楼": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "泰康保险数据中心": {
        "domain_code": "900",
        "instance": "HBDW3",
        "region": "华北一区",
        "buildings": {
            "泰康保险数据中心A": "900",
        },
        "building_natures": {
            "泰康保险数据中心A": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "陕西西安凤竹数据中心": {
        "domain_code": "79",
        "instance": "HB22",
        "region": "华北一区",
        "buildings": {
            "西安凤竹数据中心A": "79",
        },
        "building_natures": {
            "西安凤竹数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "陕西西安经开数据中心": {
        "domain_code": "18",
        "instance": "HB7",
        "region": "华北一区",
        "buildings": {
            "西安经开数据中心A": "18",
        },
        "building_natures": {
            "西安经开数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },

    # ========== 香山 ==========
    "北京香山数据中心": {
        "domain_code": "22",
        "instance": "XS1",
        "region": "香山",
        "buildings": {
            "香山数据中心A": "22",
        },
        "building_natures": {
            "香山数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },

    # ========== 华北二区 ==========
    "三河铭泰数据中心": {
        "domain_code": "71",
        "instance": "HB15",
        "region": "华北二区",
        "buildings": {
            "三河铭泰数据中心3": "71",
            "三河铭泰数据中心4": "19",
            "三河铭泰数据中心6": "20",
            "三河铭泰数据中心7": "41",
            "三河铭泰数据中心8": "21",
            "三河铭泰数据中心9": "3",
            "三河铭泰数据中心C3": "92",
        },
        "building_natures": {
            "三河铭泰数据中心3": "自建",
            "三河铭泰数据中心4": "自建",
            "三河铭泰数据中心6": "自建",
            "三河铭泰数据中心7": "自建",
            "三河铭泰数据中心8": "自建",
            "三河铭泰数据中心9": "自建",
            "三河铭泰数据中心C3": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "北京东部数据中心": {
        "domain_code": "42",
        "instance": "HB21",
        "region": "华北二区",
        "buildings": {
            "北京东部数据中心A": "42",
            "北京东部数据中心B": "74",
            "北京东部数据中心C": "70",
            "北京东部数据中心D": "75",
        },
        "building_natures": {
            "北京东部数据中心A": "自建",
            "北京东部数据中心B": "自建",
            "北京东部数据中心C": "自建",
            "北京东部数据中心D": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "北京亦庄博兴数据中心": {
        "domain_code": "27",
        "instance": "HB11",
        "region": "华北二区",
        "buildings": {
            "北京博兴数据中心": "27",
        },
        "building_natures": {
            "北京博兴数据中心": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "北京亦庄同济中路数据中心": {
        "domain_code": "17",
        "instance": "HB10",
        "region": "华北二区",
        "buildings": {
            "同济数据中心A": "17",
        },
        "building_natures": {
            "同济数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "北京大兴星光影视城数据中心": {
        "domain_code": "24",
        "instance": "HB12",
        "region": "华北二区",
        "buildings": {
            "大兴星光数据中心A": "24",
            "大兴星光数据中心B": "25",
            "大兴星光数据中心C": "26",
        },
        "building_natures": {
            "大兴星光数据中心A": "自建",
            "大兴星光数据中心B": "自建",
            "大兴星光数据中心C": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "北京通州马驹桥数据中心": {
        "domain_code": "16",
        "instance": "HB13",
        "region": "华北二区",
        "buildings": {
            "通州一号数据中心A": "16",
            "通州一号数据中心B": "33",
            "通州一号数据中心C": "78",
        },
        "building_natures": {
            "通州一号数据中心A": "自建",
            "通州一号数据中心B": "自建",
            "通州一号数据中心C": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "河北廊坊高新互联数据中心": {
        "domain_code": "125",
        "instance": "HBDW4",
        "region": "华北二区",
        "buildings": {
            "河北廊坊高新互联数据中心A": "125",
            "河北廊坊高新互联数据中心B": "126",
        },
        "building_natures": {
            "河北廊坊高新互联数据中心A": "代维",
            "河北廊坊高新互联数据中心B": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },

    # ========== 华北三区 ==========
    "乌兰1号基地数据中心": {
        "domain_code": "59",
        "instance": "HBDW5",
        "region": "华北三区",
        "buildings": {
            "乌兰1号数据中心A": "59",
            "乌兰1号数据中心B": "80",
        },
        "building_natures": {
            "乌兰1号数据中心A": "代维",
            "乌兰1号数据中心B": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "乌兰2号基地数据中心": {
        "domain_code": "60",
        "instance": "HBDW6",
        "region": "华北三区",
        "buildings": {
            "乌兰2号数据中心A": "60",
            "乌兰2号数据中心B": "81",
        },
        "building_natures": {
            "乌兰2号数据中心A": "代维",
            "乌兰2号数据中心B": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "乌兰3号基地数据中心": {
        "domain_code": "43",
        "instance": "HB19",
        "region": "华北三区",
        "buildings": {
            "乌兰3号数据中心A1": "43",
            "乌兰3号数据中心A2": "44",
            "乌兰3号数据中心B1": "45",
            "乌兰3号数据中心B2": "46",
            "乌兰3号数据中心C1": "47",
            "乌兰3号数据中心C2": "48",
        },
        "building_natures": {
            "乌兰3号数据中心A1": "自建",
            "乌兰3号数据中心A2": "自建",
            "乌兰3号数据中心B1": "自建",
            "乌兰3号数据中心B2": "自建",
            "乌兰3号数据中心C1": "自建",
            "乌兰3号数据中心C2": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "乌兰4号基地数据中心": {
        "domain_code": "49",
        "instance": "HB20",
        "region": "华北三区",
        "buildings": {
            "乌兰4号数据中心A1": "49",
            "乌兰4号数据中心A2": "50",
            "乌兰4号数据中心B1": "51",
            "乌兰4号数据中心B2": "52",
            "乌兰4号数据中心C1": "53",
            "乌兰4号数据中心C2": "54",
        },
        "building_natures": {
            "乌兰4号数据中心A1": "自建",
            "乌兰4号数据中心A2": "自建",
            "乌兰4号数据中心B1": "自建",
            "乌兰4号数据中心B2": "自建",
            "乌兰4号数据中心C1": "自建",
            "乌兰4号数据中心C2": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "乌兰5号基地数据中心": {
        "domain_code": "98",
        "instance": "HBDW7",
        "region": "华北三区",
        "buildings": {
            "乌兰5号数据中心A": "98",
        },
        "building_natures": {
            "乌兰5号数据中心A": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "乌兰6号基地数据中心": {
        "domain_code": "84",
        "instance": "HB24",
        "region": "华北三区",
        "buildings": {
            "乌兰6号基地数据中心1#楼": "84",
            "乌兰6号基地数据中心2#楼": "85",
            "乌兰6号基地数据中心3#楼": "86",
            "乌兰6号基地数据中心4#楼": "87",
            "乌兰6号基地数据中心5#楼": "88",
            "乌兰6号基地数据中心6#楼": "132",
            "乌兰6号基地数据中心7#楼": "133",
            "乌兰6号基地数据中心8#楼": "134",
            "乌兰6号基地数据中心9#楼": "135",
        },
        "building_natures": {
            "乌兰6号基地数据中心1#楼": "自建",
            "乌兰6号基地数据中心2#楼": "自建",
            "乌兰6号基地数据中心3#楼": "自建",
            "乌兰6号基地数据中心4#楼": "自建",
            "乌兰6号基地数据中心5#楼": "自建",
            "乌兰6号基地数据中心6#楼": "自建",
            "乌兰6号基地数据中心7#楼": "自建",
            "乌兰6号基地数据中心8#楼": "自建",
            "乌兰6号基地数据中心9#楼": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },

    # ========== 华东一区 ==========
    "上海外高桥数据中心": {
        "domain_code": "2",
        "instance": "HD4",
        "region": "华东一区",
        "buildings": {
            "外高桥数据中心A": "2",
        },
        "building_natures": {
            "外高桥数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "上海松江数据中心": {
        "domain_code": "15",
        "instance": "HD3",
        "region": "华东一区",
        "buildings": {
            "松江数据中心A": "15",
        },
        "building_natures": {
            "松江数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "上海磐石智算数据中心": {
        "domain_code": "127",
        "instance": "HDDW1",
        "region": "华东一区",
        "buildings": {
            "上海磐石智算数据中心A": "127",
        },
        "building_natures": {
            "上海磐石智算数据中心A": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "上海纪蕴数据中心": {
        "domain_code": "12",
        "instance": "HD1",
        "region": "华东一区",
        "buildings": {
            "上海纪蕴数据中心A": "12",
        },
        "building_natures": {
            "上海纪蕴数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "上海荷丹数据中心": {
        "domain_code": "36",
        "instance": "HD6",
        "region": "华东一区",
        "buildings": {
            "荷丹数据中心A": "36",
        },
        "building_natures": {
            "荷丹数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "上海金港数据中心": {
        "domain_code": "39",
        "instance": "HD5",
        "region": "华东一区",
        "buildings": {
            "金港数据中心A": "39",
        },
        "building_natures": {
            "金港数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "安徽宿州高新区数据中心": {
        "domain_code": "28",
        "instance": "HD9",
        "region": "华东一区",
        "buildings": {
            "宿州数据中心A": "28",
        },
        "building_natures": {
            "宿州数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "江苏南通保税区数据中心": {
        "domain_code": "5",
        "instance": "HD8",
        "region": "华东一区",
        "buildings": {
            "南通数据中心A": "5",
            "南通数据中心B": "6",
            "南通数据中心C": "7",
            "南通数据中心D": "8",
            "南通数据中心E": "9",
        },
        "building_natures": {
            "南通数据中心A": "自建",
            "南通数据中心B": "自建",
            "南通数据中心C": "自建",
            "南通数据中心D": "代维",
            "南通数据中心E": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "江苏昆山数据中心": {
        "domain_code": "69",
        "instance": "HD15",
        "region": "华东一区",
        "buildings": {
            "江苏昆山数据中心": "69",
        },
        "building_natures": {
            "江苏昆山数据中心": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "浙江杭州下沙数据中心": {
        "domain_code": "29",
        "instance": "HD11",
        "region": "华东一区",
        "buildings": {
            "下沙数据中心A": "29",
        },
        "building_natures": {
            "下沙数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "浙江杭州央广云数据中心": {
        "domain_code": "37",
        "instance": "HD13",
        "region": "华东一区",
        "buildings": {
            "央广云数据中心A": "37",
        },
        "building_natures": {
            "央广云数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },

    # ========== 华东二区 ==========
    "江苏太仓基地数据中心": {
        "domain_code": "4",
        "instance": "HD7",
        "region": "华东二区",
        "buildings": {
            "太仓数据中心12#": "137",
            "太仓数据中心16#": "93",
            "太仓数据中心17#": "138",
            "太仓数据中心A": "4",
            "太仓数据中心B": "55",
            "太仓数据中心C": "56",
            "太仓数据中心D": "136",
            "太仓数据中心F": "73",
            "太仓数据中心G": "72",
            "太仓数据中心H": "76",
            "太仓数据中心J": "77",
            "太仓数据中心K": "83",
        },
        "building_natures": {
            "太仓数据中心12#": "",
            "太仓数据中心16#": "自建",
            "太仓数据中心17#": "",
            "太仓数据中心A": "自建",
            "太仓数据中心B": "自建",
            "太仓数据中心C": "自建",
            "太仓数据中心D": "",
            "太仓数据中心F": "自建",
            "太仓数据中心G": "自建",
            "太仓数据中心H": "自建",
            "太仓数据中心J": "自建",
            "太仓数据中心K": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },

    # ========== 华南区 ==========
    "四川广元电信数据中心": {
        "domain_code": "10",
        "instance": "HN6",
        "region": "华南区",
        "buildings": {
            "四川广元数据中心A": "10",
        },
        "building_natures": {
            "四川广元数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "四川成都双流算力平台数据中心": {
        "domain_code": "91",
        "instance": "HN8",
        "region": "华南区",
        "buildings": {
            "成都双流数据中心A": "91",
        },
        "building_natures": {
            "成都双流数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "四川成都天府联通数据中心": {
        "domain_code": "97",
        "instance": "HNDW5",
        "region": "华南区",
        "buildings": {
            "四川成都天府联通数据中心-A": "97",
        },
        "building_natures": {
            "四川成都天府联通数据中心-A": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "四川成都棕树数据中心": {
        "domain_code": "31",
        "instance": "HN5",
        "region": "华南区",
        "buildings": {
            "成都棕树数据中心A": "31",
        },
        "building_natures": {
            "成都棕树数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "广东佛山智慧城市数据中心": {
        "domain_code": "35",
        "instance": "HN4",
        "region": "华南区",
        "buildings": {
            "佛山数据中心A": "35",
        },
        "building_natures": {
            "佛山数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "广东广州亚太信息引擎数据中心": {
        "domain_code": "95",
        "instance": "HNDW3",
        "region": "华南区",
        "buildings": {
            "广东广州亚太信息引擎数据中心-A": "95",
        },
        "building_natures": {
            "广东广州亚太信息引擎数据中心-A": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "广东广州化龙数据中心": {
        "domain_code": "62",
        "instance": "HNDW1",
        "region": "华南区",
        "buildings": {
            "化龙数据中心A": "62",
        },
        "building_natures": {
            "化龙数据中心A": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "广东广州科学城连云数据中心": {
        "domain_code": "57",
        "instance": "HN3",
        "region": "华南区",
        "buildings": {
            "科学城数据中心A": "57",
            "科学城数据中心B": "58",
        },
        "building_natures": {
            "科学城数据中心A": "自建",
            "科学城数据中心B": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "广东深圳盐田明珠数据中心": {
        "domain_code": "96",
        "instance": "HNDW4",
        "region": "华南区",
        "buildings": {
            "广东深圳盐田明珠数据中心-A": "96",
        },
        "building_natures": {
            "广东深圳盐田明珠数据中心-A": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "广东深圳盐田武浩数据中心": {
        "domain_code": "63",
        "instance": "HNDW2",
        "region": "华南区",
        "buildings": {
            "盐田武浩数据中心A": "63",
        },
        "building_natures": {
            "盐田武浩数据中心A": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "广东深圳花园城数据中心": {
        "domain_code": "11",
        "instance": "HN1",
        "region": "华南区",
        "buildings": {
            "花园城数据中心A": "11",
        },
        "building_natures": {
            "花园城数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "广东深圳软件基地数据中心": {
        "domain_code": "34",
        "instance": "HN2",
        "region": "华南区",
        "buildings": {
            "软件园数据中心A": "34",
        },
        "building_natures": {
            "软件园数据中心A": "自建",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },

    # ========== 杭钢 ==========
    "浙江杭州杭钢云计算数据中心": {
        "domain_code": "65",
        "instance": "HGDW1",
        "region": "杭钢",
        "buildings": {
            "杭钢数据中心A": "65",
            "杭钢数据中心B": "66",
            "杭钢数据中心C": "67",
        },
        "building_natures": {
            "杭钢数据中心A": "代维",
            "杭钢数据中心B": "代维",
            "杭钢数据中心C": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },

    # ========== 其他区域 ==========
    "Equinix SG2 新加坡机房": {
        "domain_code": "115",
        "instance": "QT12",
        "region": "其他区域",
        "buildings": {
            "Equinix SG2 新加坡机房A": "115",
        },
        "building_natures": {
            "Equinix SG2 新加坡机房A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "上海静安数据中心": {
        "domain_code": "114",
        "instance": "QT11",
        "region": "其他区域",
        "buildings": {
            "上海静安数据中心A": "114",
        },
        "building_natures": {
            "上海静安数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "云南曲靖盘江路中国移动机房": {
        "domain_code": "113",
        "instance": "QT10",
        "region": "其他区域",
        "buildings": {
            "云南曲靖盘江路中国移动机房A": "113",
        },
        "building_natures": {
            "云南曲靖盘江路中国移动机房A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "内蒙古海拉尔大数据中心": {
        "domain_code": "102",
        "instance": "QT24",
        "region": "其他区域",
        "buildings": {
            "内蒙古海拉尔大数据中心A": "102",
        },
        "building_natures": {
            "内蒙古海拉尔大数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "北京亦庄联通数据中心": {
        "domain_code": "109",
        "instance": "QT06",
        "region": "其他区域",
        "buildings": {
            "北京亦庄联通数据中心A": "109",
        },
        "building_natures": {
            "北京亦庄联通数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "北京兆维数据中心": {
        "domain_code": "106",
        "instance": "QT03",
        "region": "其他区域",
        "buildings": {
            "北京兆维数据中心A": "106",
        },
        "building_natures": {
            "北京兆维数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "北京南苑数据中心": {
        "domain_code": "110",
        "instance": "QT07",
        "region": "其他区域",
        "buildings": {
            "北京南苑数据中心A": "110",
        },
        "building_natures": {
            "北京南苑数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "北京朝阳酒仙桥百度M1数据中心": {
        "domain_code": "101",
        "instance": "QT23",
        "region": "其他区域",
        "buildings": {
            "北京朝阳酒仙桥百度M1数据中心A": "101",
        },
        "building_natures": {
            "北京朝阳酒仙桥百度M1数据中心A": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "天津卓朗数据中心": {
        "domain_code": "119",
        "instance": "QT16",
        "region": "其他区域",
        "buildings": {
            "天津卓朗数据中心A": "119",
        },
        "building_natures": {
            "天津卓朗数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "天津塘沽数据中心": {
        "domain_code": "118",
        "instance": "QT15",
        "region": "其他区域",
        "buildings": {
            "天津塘沽数据中心A": "118",
        },
        "building_natures": {
            "天津塘沽数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "天津移动空港数据中心": {
        "domain_code": "130",
        "instance": "QT27",
        "region": "其他区域",
        "buildings": {
            "天津移动空港数据中心-A": "130",
        },
        "building_natures": {
            "天津移动空港数据中心-A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "山西吕梁离石区永宁中路数据中心": {
        "domain_code": "122",
        "instance": "QT19",
        "region": "其他区域",
        "buildings": {
            "山西吕梁离石区永宁中路数据中心A": "122",
        },
        "building_natures": {
            "山西吕梁离石区永宁中路数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "广东广州南方基地移动数据中心": {
        "domain_code": "105",
        "instance": "QT02",
        "region": "其他区域",
        "buildings": {
            "广东广州南方基地移动数据中心A": "105",
        },
        "building_natures": {
            "广东广州南方基地移动数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "广东广州科技企业加速器园区电通数据中心": {
        "domain_code": "131",
        "instance": "QT28",
        "region": "其他区域",
        "buildings": {
            "广东广州科技企业加速器园区电通数据中心-A": "131",
        },
        "building_natures": {
            "广东广州科技企业加速器园区电通数据中心-A": "代维",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "广东深圳宝观数据中心": {
        "domain_code": "107",
        "instance": "QT04",
        "region": "其他区域",
        "buildings": {
            "广东深圳宝观数据中心A": "107",
        },
        "building_natures": {
            "广东深圳宝观数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "广西南宁五象远洋大数据中心": {
        "domain_code": "108",
        "instance": "QT05",
        "region": "其他区域",
        "buildings": {
            "广西南宁五象远洋大数据中心A": "108",
        },
        "building_natures": {
            "广西南宁五象远洋大数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "江苏苏州国科数据中心": {
        "domain_code": "94",
        "instance": "QT27",
        "region": "其他区域",
        "buildings": {
            "江苏苏州国科数据中心-A": "94",
        },
        "building_natures": {
            "江苏苏州国科数据中心-A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "河北廊坊云基地数据中心": {
        "domain_code": "104",
        "instance": "QT01",
        "region": "其他区域",
        "buildings": {
            "河北廊坊云基地数据中心A": "104",
        },
        "building_natures": {
            "河北廊坊云基地数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "浙江宁波浙东移动信息产业园数据中心": {
        "domain_code": "128",
        "instance": "QT26",
        "region": "其他区域",
        "buildings": {
            "浙江宁波移动浙东移动信息产业园数据中心-D02": "128",
        },
        "building_natures": {
            "浙江宁波移动浙东移动信息产业园数据中心-D02": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "浙江宁波移动鄞州云计算数据中心": {
        "domain_code": "129",
        "instance": "QT25",
        "region": "其他区域",
        "buildings": {
            "浙江宁波移动鄞州云计算数据中心-A": "129",
            "浙江宁波移动鄞州云计算数据中心-B": "125",
        },
        "building_natures": {
            "浙江宁波移动鄞州云计算数据中心-A": "自营",
            "浙江宁波移动鄞州云计算数据中心-B": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "浙江杭州滨安路数据中心": {
        "domain_code": "120",
        "instance": "QT17",
        "region": "其他区域",
        "buildings": {
            "浙江杭州滨安路数据中心A": "120",
        },
        "building_natures": {
            "浙江杭州滨安路数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "浙江杭州滨江数据中心": {
        "domain_code": "123",
        "instance": "QT20",
        "region": "其他区域",
        "buildings": {
            "浙江杭州滨江数据中心A": "123",
        },
        "building_natures": {
            "浙江杭州滨江数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "浙江杭州石桥数据中心": {
        "domain_code": "121",
        "instance": "QT18",
        "region": "其他区域",
        "buildings": {
            "浙江杭州石桥数据中心A": "121",
        },
        "building_natures": {
            "浙江杭州石桥数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "浙江湖州凤凰数据中心": {
        "domain_code": "116",
        "instance": "QT13",
        "region": "其他区域",
        "buildings": {
            "浙江湖州凤凰数据中心A": "116",
        },
        "building_natures": {
            "浙江湖州凤凰数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "海南儋州恒大海花岛数据中心": {
        "domain_code": "103",
        "instance": "QT22",
        "region": "其他区域",
        "buildings": {
            "海南儋州恒大海花岛数据中心A": "103",
        },
        "building_natures": {
            "海南儋州恒大海花岛数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "深圳有孚云引擎机房": {
        "domain_code": "124",
        "instance": "QT21",
        "region": "其他区域",
        "buildings": {
            "深圳有孚云引擎机房A": "124",
        },
        "building_natures": {
            "深圳有孚云引擎机房A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "湖北武汉光谷华师园数据中心": {
        "domain_code": "111",
        "instance": "QT08",
        "region": "其他区域",
        "buildings": {
            "湖北武汉光谷华师园数据中心A": "111",
        },
        "building_natures": {
            "湖北武汉光谷华师园数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "湖南长沙证通云谷数据中心": {
        "domain_code": "112",
        "instance": "QT09",
        "region": "其他区域",
        "buildings": {
            "湖南长沙证通云谷数据中心A": "112",
        },
        "building_natures": {
            "湖南长沙证通云谷数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
    "黑龙江哈尔滨名气通数据中心": {
        "domain_code": "117",
        "instance": "QT14",
        "region": "其他区域",
        "buildings": {
            "黑龙江哈尔滨名气通数据中心A": "117",
        },
        "building_natures": {
            "黑龙江哈尔滨名气通数据中心A": "自营",
        },
        "obj_id_map": GLOBAL_OBJ_ID_MAP,
    },
}

# ============================================================
# 区域列表（按 Excel 中的顺序）
# ============================================================
REGIONS = [
    "华北一区",
    "香山",
    "华北二区",
    "华北三区",
    "华东一区",
    "华东二区",
    "华南区",
    "杭钢",
    "其他区域",
]

# ============================================================
# 统计信息
# ============================================================
TOTAL_DATACENTERS = len(DATACENTER_CONFIG)
TOTAL_BUILDINGS = sum(len(cfg.get("buildings", {})) for cfg in DATACENTER_CONFIG.values())

# ============================================================
# 工具函数
# ============================================================

def get_obj_id(ref_id: str, datacenter: str = None) -> str:
    global_obj_id = GLOBAL_OBJ_ID_MAP.get(ref_id)
    if global_obj_id:
        return global_obj_id
    if datacenter:
        config = DATACENTER_CONFIG.get(datacenter)
        if config:
            return config.get("obj_id_map", {}).get(ref_id)
    return None

def get_domain_code(datacenter: str, building: str = None) -> str:
    config = DATACENTER_CONFIG.get(datacenter)
    if not config:
        return None
    if building and building in config.get("buildings", {}):
        return config["buildings"][building]
    return config.get("domain_code")

def get_building_nature(datacenter: str, building: str) -> str:
    config = DATACENTER_CONFIG.get(datacenter)
    if not config:
        return None
    return config.get("building_natures", {}).get(building, "")

def search_datacenter(keyword: str) -> list:
    results = []
    keyword_lower = keyword.lower()
    for name in DATACENTER_CONFIG.keys():
        if keyword_lower in name.lower():
            results.append(name)
    return results

def get_datacenters_by_region(region: str) -> list:
    results = []
    for dc_name, cfg in DATACENTER_CONFIG.items():
        if cfg.get("region") == region:
            results.append(dc_name)
    return results

def list_buildings(datacenter: str) -> dict:
    config = DATACENTER_CONFIG.get(datacenter)
    if not config:
        return {}
    buildings = config.get("buildings", {})
    natures = config.get("building_natures", {})
    result = {}
    for name, domain in buildings.items():
        result[name] = {"domain": domain, "nature": natures.get(name, "")}
    return result

if __name__ == "__main__":
    print("=" * 80)
    print("数据中心配置")
    print("=" * 80)
    print(f"\n[已配置的数据中心数量: {TOTAL_DATACENTERS}]")
    print(f"[已配置的楼栋数量: {TOTAL_BUILDINGS}]")
    for region in REGIONS:
        dcs = get_datacenters_by_region(region)
        building_count = sum(len(DATACENTER_CONFIG[dc]["buildings"]) for dc in dcs)
        print(f"  【{region}】{len(dcs)}个数据中心，{building_count}个楼栋")