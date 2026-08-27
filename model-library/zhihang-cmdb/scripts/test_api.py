# -*- coding: utf-8 -*-
import sys
sys.path.insert(0, 'c:/Users/deng.hao3/.workbuddy/skills/zhihang-cmdb/scripts')
from zhihang_api import ZhiHangCMDB

client = ZhiHangCMDB(use_internal=True)

# 测试查询测点列表
result = client.get_point_list_by_instance(['29.0.1.2.3.4'])

print(f'成功! 返回 {len(result)} 个测点')
print(f'第一个测点: {result[0].get("name")} ({result[0].get("unit")})')
