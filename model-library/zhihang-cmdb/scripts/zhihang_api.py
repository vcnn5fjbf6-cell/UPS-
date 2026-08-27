# -*- coding: utf-8 -*-
"""
智航CMDB API 封装
用于查询测点数据、设备实例、历史数据等
"""

import requests
from requests.auth import HTTPBasicAuth
from typing import List, Dict, Any, Optional
import json


class ZhiHangCMDB:
    """智航CMDB数据查询客户端"""
    
    # 内网地址
    INTERNAL_BASE_URL = 'http://gateway.meta42.indc.vnet.com'
    # 外网地址
    EXTERNAL_BASE_URL = 'https://digitaltwin.meta42.indc.vnet.com/openapi'
    
    def __init__(self, username: str = 'root', password: str = 'taosdata', use_internal: bool = True):
        """
        初始化智航CMDB客户端
        
        Args:
            username: 用户名，默认 root
            password: 密码，默认 taosdata
            use_internal: 是否使用内网，默认 True
        """
        self.base_url = self.INTERNAL_BASE_URL if use_internal else self.EXTERNAL_BASE_URL
        self.auth = HTTPBasicAuth(username, password)
        self.session = requests.Session()
        self.session.auth = self.auth
    
    def _post(self, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """发送POST请求"""
        url = f'{self.base_url}{path}'
        response = self.session.post(url, json=data, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    
    def _get(self, path: str, params: Dict = None) -> Dict:
        """发送GET请求"""
        url = f'{self.base_url}{path}'
        response = self.session.get(url, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    
    # ========== CMDB相关接口 ==========
    
    def get_all_models(self) -> List[Dict]:
        """
        获取所有模型
        
        Returns:
            模型列表
        """
        return self._get('/cmdb/objRemote/getObjList')
    
    def get_devices_by_domain_and_obj(self, domain_code: str, obj_ids: List[str], 
                                       page: int = 1, size: int = 999999,
                                       is_query_properties: bool = False, 
                                       is_query_point_data: bool = False) -> List[Dict]:
        """
        根据域号和模型ID查询设备
        
        Args:
            domain_code: 域编号，如 "32"
            obj_ids: 模型ID列表，如 ["OBJ-17"]
            page: 页码
            size: 每页数量
            is_query_properties: 是否查询属性
            is_query_point_data: 是否查询测点数据
        
        Returns:
            设备实例列表
        """
        payload = {
            "page": page,
            "size": size,
            "objIds": obj_ids,
            "domainCode": domain_code,
            "isQueryProperties": is_query_properties,
            "isQueryPointData": is_query_point_data
        }
        return self._post('/cmdb/insRemote/getInsByDomainCodeAndObjIds', payload)
    
    def get_instances_list(self, current: int = 1, size: int = 10, 
                          query_filter: Dict = None) -> Dict:
        """
        查询实例列表
        
        Args:
            current: 当前页
            size: 每页数量
            query_filter: 查询条件
        
        Returns:
            分页结果
        """
        payload = {
            "current": current,
            "size": size,
            "queryFilter": query_filter or {}
        }
        return self._post('/cmdb/insRemote/list', payload)
    
    def get_point_list_by_instance(self, ins_standard_ids: List[str]) -> List[Dict]:
        """
        查询测点列表
        
        注意: 此接口参数为数组格式，直接传入ID列表即可
        
        Args:
            ins_standard_ids: 实例标准ID列表，如 ["29.0.1.2.3.4", "2.1.1.2.3.4"]
        
        Returns:
            测点列表（数组）
        """
        # 直接传数组，不需要包装成对象
        return self._post('/cmdb/insRemote/getPointDataByInsStandardIds', ins_standard_ids)
    
    def get_down_instances(self, ins_id: str, asst_id: str = None) -> Dict:
        """
        根据源实例查询目标实例
        
        Args:
            ins_id: 源实例ID
            asst_id: 关联关系ID
        
        Returns:
            目标实例列表
        """
        payload = {
            "insId": ins_id,
            "asstId": asst_id
        }
        return self._post('/cmdb/insAsstRemote/getDownInsByAsstIdBatch', payload)
    
    # ========== 时序数据相关接口 ==========
    
    def get_realtime_data(self, point_ids: List[str]) -> Dict:
        """
        查询测点实时数据
        
        Args:
            point_ids: 测点ID列表
        
        Returns:
            实时数据字典
        """
        return self._post('/device_twin/reported/list', point_ids)
    
    def get_history_data(self, start_time: int, end_time: int, 
                          point_list: List[str], 
                          interval: str = None,
                          function: str = None,
                          strict_range: bool = True) -> Dict:
        """
        测点历史数据明细查询
        
        Args:
            start_time: 开始时间（毫秒时间戳）
            end_time: 结束时间（毫秒时间戳）
            point_list: 测点ID列表
            interval: 时间间隔（秒），可选
            function: 聚合函数（MIN/MAX/AVG），可选
            strict_range: 是否严格范围，可选
        
        Returns:
            历史数据
        """
        payload = {
            "startTime": start_time,
            "endTime": end_time,
            "strictRange": strict_range,
            "pointList": point_list
        }
        if interval:
            payload["interval"] = interval
        if function:
            payload["function"] = function.upper()
        
        return self._post('/tsdb/point_data/v2/search', payload)
    
    def query_by_sql(self, domain_key: str, sql: str) -> Dict:
        """
        通过SQL查询测点历史数据
        
        Args:
            domain_key: 域key
            sql: SQL语句
        
        Returns:
            查询结果
        """
        payload = {
            "domainKey": domain_key,
            "sql": sql
        }
        return self._post('/tsdb/point_data/v2/sql/search', payload)


# ========== 便捷函数 ==========

def get_all_models(use_internal: bool = True) -> List[Dict]:
    """获取所有模型"""
    client = ZhiHangCMDB(use_internal=use_internal)
    return client.get_all_models()


def get_devices(domain_code: str, obj_ids: List[str], 
               use_internal: bool = True) -> List[Dict]:
    """根据域号和模型ID查询设备"""
    client = ZhiHangCMDB(use_internal=use_internal)
    return client.get_devices_by_domain_and_obj(domain_code, obj_ids)


def get_realtime_data(point_ids: List[str], use_internal: bool = True) -> Dict:
    """查询测点实时数据"""
    client = ZhiHangCMDB(use_internal=use_internal)
    return client.get_realtime_data(point_ids)


def get_history_data(start_time: int, end_time: int, point_list: List[str],
                    use_internal: bool = True, **kwargs) -> Dict:
    """查询测点历史数据"""
    client = ZhiHangCMDB(use_internal=use_internal)
    return client.get_history_data(start_time, end_time, point_list, **kwargs)


if __name__ == '__main__':
    # 示例用法
    import time
    
    # 创建客户端
    client = ZhiHangCMDB(use_internal=True)
    
    print("=" * 50)
    print("智航CMDB API 测试")
    print("=" * 50)
    
    # 1. 获取所有模型
    print("\n[1] 获取所有模型...")
    models = client.get_all_models()
    print(f"共获取 {len(models)} 个模型")
    if models:
        print(f"示例: {models[0].get('objName')}")
    
    # 2. 查询实时数据
    print("\n[2] 查询实时数据...")
    realtime = client.get_realtime_data(["5.5.1.2.2.1.1.1.5.1"])
    print(f"结果: {realtime}")
    
    # 3. 查询历史数据
    print("\n[3] 查询历史数据...")
    end_time = int(time.time() * 1000)
    start_time = end_time - 3600000  # 最近1小时
    history = client.get_history_data(start_time, end_time, ["2.2.2.2.2.2.2.2.2.2"])
    print(f"结果: {history}")
    
    # 4. 根据域号和模型ID查询设备
    print("\n[4] 根据域号和模型ID查询设备...")
    devices = client.get_devices_by_domain_and_obj("32", ["OBJ-17"])
    print(f"共获取 {len(devices)} 个设备")
    if devices:
        print(f"示例: {devices[0].get('insName')}")
    
    print("\n" + "=" * 50)
    print("测试完成")
    print("=" * 50)
