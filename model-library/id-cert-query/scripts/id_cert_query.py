#!/usr/bin/env python3
"""
身份证号查证件 — 输入身份证号，查询本人证件信息

用法:
  python id_cert_query.py --id 152625199710300012
  python id_cert_query.py --id 152625199710300012 --json
  python id_cert_query.py --id 152625199710300012 --server http://localhost:8765

参数:
  --id       18位身份证号（必填）
  --json     JSON格式输出（可选）
  --server   服务地址（默认连接云端服务，也可指定本地 http://localhost:8765）
  --key      API Key（默认从环境变量 CERT_API_KEY 读取，或使用内置默认值）

返回字段:
  姓名、工号、组织归属、区域、机房、岗位类型
  持证情况、证书合规状态、缺少证书、上岗要求
  各证书（高压/低压/制冷/登高）的: 是否有效、到期日期、应复审日期
"""

import argparse
import json
import os
import re
import sys
import urllib.request
import urllib.error


# 默认服务配置（阿里云 ECS）
DEFAULT_SERVER = "http://47.114.92.186:8765"
DEFAULT_API_KEY = "cert-query-2026-key"


def validate_id_card(id_card):
    """验证身份证号格式"""
    # 去除首尾空格
    id_card = id_card.strip()

    # 基本格式验证：18位，前17位数字，末位数字或X/x
    pattern = r'^\d{17}[\dXx]$'
    if not re.match(pattern, id_card):
        return False, "身份证号格式不正确，应为18位（前17位数字，末位数字或X）"

    # 加权因子
    factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    check_codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

    # 计算校验码
    total = 0
    for i in range(17):
        try:
            total += int(id_card[i]) * factors[i]
        except ValueError:
            return False, "身份证号前17位必须为数字"

    expected_code = check_codes[total % 11]
    actual_code = id_card[17].upper()

    if actual_code != expected_code:
        return False, f"身份证号校验位不正确（期望{expected_code}，实际{actual_code}）"

    return True, ""


def mask_id_card(id_card):
    """对身份证号做脱敏处理"""
    if len(id_card) >= 8:
        return id_card[:4] + "****" + id_card[-4:]
    return "****"


def query_by_id(id_card, server, api_key):
    """调用服务端接口查询身份证号"""
    url = f"{server}/api/query"
    payload = json.dumps({"id_card": id_card}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, method="POST", headers={
        "Content-Type": "application/json; charset=utf-8",
        "X-API-Key": api_key,
    })
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            err = json.loads(body)
            print(f"查询失败: {err.get('error', body)}")
        except json.JSONDecodeError:
            print(f"查询失败(HTTP {e.code}): {body}")
        sys.exit(1)
    except urllib.error.URLError as e:
        # 服务未启动的友好提示
        if "Connection refused" in str(e) or "连接被拒绝" in str(e):
            print(f"服务未启动，请先运行 start_cert_api.bat 启动证件查询服务")
        else:
            print(f"无法连接服务: {e}")
        sys.exit(1)

    if data.get("error"):
        print(f"查询失败: {data['error']}")
        sys.exit(1)

    return data.get("results", [])


def format_result(data, id_card):
    """格式化查询结果为可读文本"""
    if not data:
        return f"🔍 查询条件: 身份证号「{mask_id_card(id_card)}」\n未找到匹配的人员记录，请确认身份证号是否正确"

    lines = []
    person = data[0] if isinstance(data, list) else data

    name = person.get("姓名", "")
    emp_id = person.get("工号", "")
    org = person.get("组织归属", "")
    region = person.get("区域（部门）", "")

    # 如果是列表格式，需要 extract_text
    if isinstance(region, list):
        region = ", ".join(
            item.get("text", "") if isinstance(item, dict) else str(item)
            for item in region
        )

    team_field = person.get("机房（团队）", "")
    if isinstance(team_field, list):
        team = ", ".join(
            item.get("text", "") if isinstance(item, dict) else str(item)
            for item in team_field
        )
    else:
        team = str(team_field) if team_field else ""

    position = person.get("岗位类型", "")
    certs = person.get("持证情况", "")
    compliance = person.get("证书是否合规", "")
    missing = person.get("缺少证书", "")
    req_certs = person.get("上岗证件要求", "")

    def extract_text(val):
        if not val:
            return ""
        if isinstance(val, list):
            texts = []
            for item in val:
                if isinstance(item, dict):
                    texts.append(item.get("text", ""))
                else:
                    texts.append(str(item))
            return ", ".join(t for t in texts if t and t.strip())
        return str(val)

    compliance_text = extract_text(compliance)
    certs_text = extract_text(certs)
    missing_text = extract_text(missing)
    req_text = extract_text(req_certs)
    position_text = extract_text(position)

    # 姓名和工号
    lines.append(f"📋 {name}（工号: {emp_id}）")
    lines.append(f"  身份证: {mask_id_card(id_card)}")

    if org:
        lines.append(f"  组织归属: {org}")
    if region:
        lines.append(f"  区域: {region}")
    if team:
        lines.append(f"  机房: {team}")
    if position_text:
        lines.append(f"  岗位: {position_text}")

    lines.append(f"  证书合规: {compliance_text if compliance_text else '未确定'}")

    if certs_text:
        lines.append(f"  持证情况: {certs_text}")
    if missing_text and missing_text != "无":
        lines.append(f"  缺少证书: {missing_text}")
    if req_text:
        lines.append(f"  上岗要求: {req_text}")

    # 各证书详情
    for cert_name, cert_key in [
        ("高压电工证", "高压证"),
        ("低压电工证", "低压证"),
        ("制冷操作证", "制冷证"),
        ("登高证", "登高证"),
    ]:
        valid = person.get(f"{cert_key}-是否有效", "")
        expire = person.get(f"{cert_key}-到期日期", "")
        review = person.get(f"{cert_key}-应复审日期", "")
        expire_days_raw = person.get(f"{cert_key}-有效期到期（日）", "")
        review_days_raw = person.get(f"{cert_key}-应复审到期（日）", "")
        # 字段可能是列表（飞书返回格式），取第一个数值
        def to_num(v):
            if isinstance(v, list):
                v = v[0] if v else ""
            try:
                return int(v)
            except (ValueError, TypeError):
                return None
        expire_days = to_num(expire_days_raw)
        review_days = to_num(review_days_raw)

        # 转换时间戳
        def ts_to_date(ts):
            if not ts:
                return ""
            try:
                from datetime import datetime, timezone, timedelta
                dt = datetime.fromtimestamp(ts / 1000, tz=timezone(timedelta(hours=8)))
                return dt.strftime("%Y-%m-%d")
            except (ValueError, TypeError):
                return str(ts)

        expire_date = ts_to_date(expire)
        review_date = ts_to_date(review)

        has_valid = False
        valid_text = ""
        if valid:
            if isinstance(valid, list):
                valid_str = "".join(
                    item.get("text", "") if isinstance(item, dict) else str(item)
                    for item in valid
                )
            else:
                valid_str = str(valid)
            if valid_str:
                has_valid = True
                valid_text = "✅ 有效" if "✔" in valid_str else "❌ 无效"

        if has_valid or expire_date or review_date:
            parts = [f"  {cert_name}:"]
            if valid_text:
                parts.append(valid_text)
            if expire_date:
                days_str = f"（{expire_days}天后）" if expire_days is not None else ""
                parts.append(f"到期: {expire_date} {days_str}".strip())
            if review_date:
                days_str = f"（{review_days}天后）" if review_days is not None else ""
                parts.append(f"应复审: {review_date} {days_str}".strip())
            lines.append(" ".join(parts))

    # 如果没有显示任何证书，但持证情况有内容
    has_cert_details = any(
        person.get(f"{k}-是否有效", "") or person.get(f"{k}-到期日期", "")
        for k in ["高压证", "低压证", "制冷证", "登高证"]
    )
    if not has_cert_details and certs_text:
        lines.append("  （证书详情数据暂无，请以持证情况为准）")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="身份证号查证件")
    parser.add_argument("--id", dest="id_card", required=True, help="18位身份证号")
    parser.add_argument("--json", action="store_true", help="JSON格式输出")
    parser.add_argument("--server", default=DEFAULT_SERVER, help=f"服务地址（默认 {DEFAULT_SERVER}）")
    parser.add_argument("--key", dest="api_key", default=None, help="API Key（默认从 CERT_API_KEY 环境变量读取）")
    args = parser.parse_args()

    # API Key 优先级: 命令行 > 环境变量 > 默认值
    api_key = args.api_key or os.environ.get("CERT_API_KEY") or DEFAULT_API_KEY

    # 验证身份证号
    valid, msg = validate_id_card(args.id_card)
    if not valid:
        print(f"❌ {msg}")
        print("请重新输入正确的18位身份证号")
        sys.exit(1)

    id_card = args.id_card.upper()

    # 查询
    try:
        data = query_by_id(id_card, args.server, api_key)
    except Exception as e:
        print(f"❌ 查询出错: {e}")
        sys.exit(1)

    if args.json:
        output = {
            "id_card_masked": mask_id_card(id_card),
            "query_time": __import__("datetime").datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "results": data if data else [],
            "found": len(data) > 0 if isinstance(data, list) else bool(data),
        }
        print(json.dumps(output, ensure_ascii=False, default=str))
    else:
        print(f"🔍 查询条件: 身份证号「{mask_id_card(id_card)}」")
        print(f"共找到 {len(data) if isinstance(data, list) else 1} 条结果\n")
        print(format_result(data, id_card))


if __name__ == "__main__":
    main()