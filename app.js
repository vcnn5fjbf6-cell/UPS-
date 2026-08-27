const AUTH_USERS_KEY = 'upsMonitorUsers';
    const DEFAULT_USERS = [
      { username: 'admin', password: 'admin123', role: '系统管理员', createdAt: 'default' }
    ];

    const state = {
      mainsOn: true,
      fault: false,
      lowBattery: false,
      battery: 96,
      load: 32,
      temp: 34.2,
      inputV: 220,
      outputV: 220,
      runtime: 47,
      bus: 384,
      freq: 50,
      response: 18,
      dataSource: '智航模拟数据',
      eventId: 0,
      settings: {
        autoAi: true,
        aiInterval: 8,
        tempWarn: 45,
        tempBad: 55,
        batteryWarn: 30,
        batteryBad: 15
      },
      trend: Array.from({ length: 60 }, (_, i) => ({
        load: 30 + Math.sin(i / 5) * 4,
        battery: 96 - i * 0.02,
        temp: 34 + Math.cos(i / 7) * 0.6
      }))
    };

    const els = {
      loginScreen: document.querySelector('.login-screen'),
      loginTab: document.getElementById('loginTab'),
      registerTab: document.getElementById('registerTab'),
      loginForm: document.getElementById('loginForm'),
      registerForm: document.getElementById('registerForm'),
      loginUsername: document.getElementById('loginUsername'),
      loginPassword: document.getElementById('loginPassword'),
      registerUsername: document.getElementById('registerUsername'),
      registerPassword: document.getElementById('registerPassword'),
      registerConfirm: document.getElementById('registerConfirm'),
      authMessage: document.getElementById('authMessage'),
      mainsDot: document.getElementById('mainsDot'),
      mainsText: document.getElementById('mainsText'),
      modeDot: document.getElementById('modeDot'),
      modeText: document.getElementById('modeText'),
      faultDot: document.getElementById('faultDot'),
      faultText: document.getElementById('faultText'),
      batteryDot: document.getElementById('batteryDot'),
      batteryText: document.getElementById('batteryText'),
      clockTime: document.getElementById('clockTime'),
      clockDate: document.getElementById('clockDate'),
      deviceHealth: document.getElementById('deviceHealth'),
      deviceName: document.getElementById('deviceName'),
      deviceState: document.getElementById('deviceState'),
      deviceStdModel: document.getElementById('deviceStdModel'),
      snapshotLabel: document.getElementById('snapshotLabel'),
      lampRun: document.getElementById('lampRun'),
      lampCharge: document.getElementById('lampCharge'),
      lampFault: document.getElementById('lampFault'),
      lampBypass: document.getElementById('lampBypass'),
      batteryPercent: document.getElementById('batteryPercent'),
      batteryCaption: document.getElementById('batteryCaption'),
      batteryDial: document.getElementById('batteryDial'),
      loadValue: document.getElementById('loadValue'),
      loadBar: document.getElementById('loadBar'),
      inputValue: document.getElementById('inputValue'),
      inputBar: document.getElementById('inputBar'),
      outputValue: document.getElementById('outputValue'),
      outputBar: document.getElementById('outputBar'),
      tempValue: document.getElementById('tempValue'),
      tempBar: document.getElementById('tempBar'),
      runtimeValue: document.getElementById('runtimeValue'),
      runtimeBar: document.getElementById('runtimeBar'),
      currentValue: document.getElementById('currentValue'),
      currentBar: document.getElementById('currentBar'),
      gridState: document.getElementById('gridState'),
      gridDetail: document.getElementById('gridDetail'),
      outputState: document.getElementById('outputState'),
      outputDetail: document.getElementById('outputDetail'),
      capacityState: document.getElementById('capacityState'),
      capacityDetail: document.getElementById('capacityDetail'),
      heatState: document.getElementById('heatState'),
      heatDetail: document.getElementById('heatDetail'),
      loadState: document.getElementById('loadState'),
      loadDetail: document.getElementById('loadDetail'),
      alarmState: document.getElementById('alarmState'),
      alarmDetail: document.getElementById('alarmDetail'),
      alarmSummary: document.getElementById('alarmSummary'),
      summaryMode: document.getElementById('summaryMode'),
      summaryAi: document.getElementById('summaryAi'),
      summaryAlarm: document.getElementById('summaryAlarm'),
      summaryBattery: document.getElementById('summaryBattery'),
      alarmList: document.getElementById('alarmList'),
      busValue: document.getElementById('busValue'),
      freqValue: document.getElementById('freqValue'),
      dodValue: document.getElementById('dodValue'),
      respValue: document.getElementById('respValue'),
      trendChart: document.getElementById('trendChart'),
      aiStatus: document.getElementById('aiStatus'),
      aiRing: document.getElementById('aiRing'),
      aiScore: document.getElementById('aiScore'),
      aiVerdict: document.getElementById('aiVerdict'),
      aiRisk: document.getElementById('aiRisk'),
      aiCoverage: document.getElementById('aiCoverage'),
      aiTime: document.getElementById('aiTime'),
      aiInputText: document.getElementById('aiInputText'),
      aiBatteryText: document.getElementById('aiBatteryText'),
      aiFaultText: document.getElementById('aiFaultText'),
      aiInputTag: document.getElementById('aiInputTag'),
      aiBatteryTag: document.getElementById('aiBatteryTag'),
      aiFaultTag: document.getElementById('aiFaultTag'),
      sidebarMode: document.getElementById('sidebarMode'),
      sidebarAiScore: document.getElementById('sidebarAiScore'),
      sidebarAlarmCount: document.getElementById('sidebarAlarmCount'),
      settingsFold: document.getElementById('settingsFold'),
      settingsPanel: document.getElementById('settingsPanel'),
      autoAi: document.getElementById('autoAi'),
      aiInterval: document.getElementById('aiInterval'),
      tempWarn: document.getElementById('tempWarn'),
      tempBad: document.getElementById('tempBad'),
      batteryWarn: document.getElementById('batteryWarn'),
      batteryBad: document.getElementById('batteryBad'),
      sidebarLogoutBtn: document.getElementById('sidebarLogoutBtn'),
      topologyBadge: document.getElementById('topologyBadge'),
      routeTitle: document.getElementById('routeTitle'),
      routePath: document.getElementById('routePath'),
      routeStatus: document.getElementById('routeStatus'),
      routeLoad: document.getElementById('routeLoad'),
      routeSteps: document.getElementById('routeSteps'),
      routeModal: document.getElementById('routeModal'),
      routeModalClose: document.getElementById('routeModalClose'),
      routeModalTitle: document.getElementById('routeModalTitle'),
      routeModalPath: document.getElementById('routeModalPath'),
      routeModalStatus: document.getElementById('routeModalStatus'),
      routeModalLoad: document.getElementById('routeModalLoad'),
      routeModalZone: document.getElementById('routeModalZone'),
      routeModalSteps: document.getElementById('routeModalSteps'),
      transformerButtons: document.getElementById('transformerButtons'),
      distributionMap: document.getElementById('distributionMap'),
      powerStage: document.getElementById('powerStage'),
      powerScene: document.getElementById('powerScene'),
      unitMains: document.getElementById('unitMains'),
      unitTrans: document.getElementById('unitTrans'),
      unitAts: document.getElementById('unitAts'),
      unitUps: document.getElementById('unitUps'),
      unitBus: document.getElementById('unitBus'),
      unitLoad: document.getElementById('unitLoad'),
      unitBattery: document.getElementById('unitBattery'),
      unitBypass: document.getElementById('unitBypass'),
      unitMetrics: document.getElementById('unitMetrics'),
      streamMains: document.getElementById('streamMains'),
      streamTrans: document.getElementById('streamTrans'),
      streamAts: document.getElementById('streamAts'),
      streamUps: document.getElementById('streamUps'),
      streamBus: document.getElementById('streamBus'),
      streamLoad: document.getElementById('streamLoad'),
      streamBattery: document.getElementById('streamBattery'),
      streamBypass: document.getElementById('streamBypass'),
      mainsUnitState: document.getElementById('mainsUnitState'),
      mainsUnitValue: document.getElementById('mainsUnitValue'),
      transUnitState: document.getElementById('transUnitState'),
      transUnitValue: document.getElementById('transUnitValue'),
      atsUnitState: document.getElementById('atsUnitState'),
      atsUnitValue: document.getElementById('atsUnitValue'),
      upsUnitState: document.getElementById('upsUnitState'),
      upsUnitValue: document.getElementById('upsUnitValue'),
      busUnitState: document.getElementById('busUnitState'),
      busUnitValue: document.getElementById('busUnitValue'),
      loadUnitState: document.getElementById('loadUnitState'),
      loadUnitValue: document.getElementById('loadUnitValue'),
      batteryUnitState: document.getElementById('batteryUnitState'),
      batteryUnitValue: document.getElementById('batteryUnitValue'),
      bypassUnitState: document.getElementById('bypassUnitState'),
      bypassUnitValue: document.getElementById('bypassUnitValue'),
      metricsUnitState: document.getElementById('metricsUnitState'),
      metricsUnitValue: document.getElementById('metricsUnitValue')
    };

    const alarms = [];
    const logs = [];
    const aiHistory = [];
    let aiRuns = 0;
    let aiTimer = null;

    function readJson(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (error) {
        return fallback;
      }
    }

    function loadUsers() {
      const users = readJson(AUTH_USERS_KEY, null);
      if (Array.isArray(users) && users.length) return users;
      localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return [...DEFAULT_USERS];
    }

    function saveUsers(users) {
      localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
    }

    function setAuthMessage(text, level = 'warn') {
      if (!els.authMessage) return;
      els.authMessage.textContent = text;
      els.authMessage.style.color = level === 'ok' ? 'var(--green)' : level === 'bad' ? 'var(--red)' : 'var(--amber)';
    }

    function setAuthMode(mode) {
      const isLogin = mode === 'login';
      els.loginTab.classList.toggle('active', isLogin);
      els.registerTab.classList.toggle('active', !isLogin);
      els.loginTab.setAttribute('aria-selected', String(isLogin));
      els.registerTab.setAttribute('aria-selected', String(!isLogin));
      els.loginForm.classList.toggle('active', isLogin);
      els.registerForm.classList.toggle('active', !isLogin);
      setAuthMessage('');
      setTimeout(() => {
        const input = isLogin ? els.loginUsername : els.registerUsername;
        if (document.body.classList.contains('auth-locked')) input.focus();
      }, 0);
    }

    function unlockSystem(username) {
      document.body.classList.remove('auth-locked');
      setAuthMessage('');
      pushLog('info', '账号登录', `${username} 已进入 UPS 监控管理平台。`);
    }

    function lockSystem(message = '') {
      document.body.classList.add('auth-locked');
      setAuthMode('login');
      els.loginPassword.value = '';
      els.loginUsername.focus();
      setAuthMessage(message);
    }

    function loginAccount(username, password) {
      const name = username.trim();
      const users = loadUsers();
      const user = users.find(item => item.username.toLowerCase() === name.toLowerCase());
      if (!user || user.password !== password) {
        setAuthMessage('用户名或密码不正确，请重新输入。', 'bad');
        return;
      }
      unlockSystem(user.username);
    }

    function registerAccount(username, password, confirm) {
      const name = username.trim();
      const users = loadUsers();
      if (name.length < 3) {
        setAuthMessage('用户名至少 3 个字符。', 'bad');
        return;
      }
      if (password.length < 6) {
        setAuthMessage('密码至少 6 个字符。', 'bad');
        return;
      }
      if (password !== confirm) {
        setAuthMessage('两次输入的密码不一致。', 'bad');
        return;
      }
      if (users.some(item => item.username.toLowerCase() === name.toLowerCase())) {
        setAuthMessage('该用户名已存在，请更换一个。', 'bad');
        return;
      }
      users.push({ username: name, password, role: '值班人员', createdAt: new Date().toISOString() });
      saveUsers(users);
      unlockSystem(name);
    }

    function initAuth() {
      loadUsers();
      localStorage.removeItem('upsMonitorSession');
      document.body.classList.add('auth-locked');
      setAuthMode('login');
      setAuthMessage('请登录后访问 UPS 监控系统，刷新页面后需要重新登录。');
    }
    let selectedRouteId = '1';
    let selectedUpsDevice = null;

    const transformerRoutes = [
      {
        id: '1',
        code: '1#变',
        title: '1#变（2000KVA）',
        path: '市电进线 / 补偿 / ATS / 1#UPS',
        status: '主路',
        loadTag: '1#UPS集中旁路',
        focus: ['unitMains', 'unitTrans', 'unitAts', 'unitUps'],
        steps: [
          { code: '1AA1', name: '市电进线', note: '1#变前端入口' },
          { code: '1AA2', name: '补偿', note: '无功补偿与稳压' },
          { code: '1AA3', name: 'ATS', note: '油机 / 市电切换' },
          { code: '1AA5', name: '1#UPS集中旁路', note: '1#UPS 组旁路汇流' },
          { code: '1AU1-1/2', name: '1#UPS1-4输出', note: '机房和冷源分路' }
        ]
      },
      {
        id: '2',
        code: '2#变',
        title: '2#变（2000KVA）',
        path: '市电进线 / 母联 / 补偿 / ATS / 2#UPS',
        status: '母联',
        loadTag: '2#UPS集中旁路',
        focus: ['unitMains', 'unitTrans', 'unitBus', 'unitUps'],
        steps: [
          { code: '2AA1', name: '市电进线', note: '2#变前端入口' },
          { code: '2AA2', name: '母联', note: '两路母联切换' },
          { code: '2AA3', name: '补偿', note: '补偿与稳压' },
          { code: '2AA4', name: 'ATS', note: '市电 / 油机切换' },
          { code: '2AA6-1/2', name: '2#UPS1-4输出', note: '机房与冷源备用' }
        ]
      },
      {
        id: '3',
        code: '3#变',
        title: '3#变（1000KVA）',
        path: '市电进线 / 补偿柜 / ATS / 3#UPS',
        status: 'UPS',
        loadTag: '3UPS / 11UPS / 12UPS',
        focus: ['unitMains', 'unitAts', 'unitUps', 'unitLoad'],
        steps: [
          { code: '3AA1', name: '市电进线', note: '3#变前端入口' },
          { code: '3AA2', name: '补偿柜', note: '补偿与滤波' },
          { code: '3AA3', name: 'ATS', note: '自动切换' },
          { code: '3AA5/3AA6', name: '3UPS1-3', note: '3#UPS 输出链路' },
          { code: '3AA7-6', name: '11UPS/12UPS', note: '网络设备与维修旁路' }
        ]
      },
      {
        id: '4',
        code: '4#变',
        title: '4#变（1000KVA）',
        path: '市电进线 / 母联 / 电容柜 / ATS / 4#UPS',
        status: '负载',
        loadTag: '4UPS / 13UPS',
        focus: ['unitMains', 'unitTrans', 'unitBus', 'unitLoad'],
        steps: [
          { code: '4AA1', name: '市电进线', note: '4#变前端入口' },
          { code: '4AA2', name: '母联', note: '双路联络' },
          { code: '4AA3', name: '电容柜', note: '无功补偿' },
          { code: '4AA4', name: 'ATS', note: '切换控制' },
          { code: '4AA5-6', name: '4UPS1-3 / 13UPS', note: '楼控与监控链路' }
        ]
      },
      {
        id: '5',
        code: '5#变',
        title: '5#变（1600KVA）',
        path: '市电进线 / 电容柜 / ATS / 5#UPS',
        status: '冷源',
        loadTag: '5#UPS / 4#冷机',
        focus: ['unitTrans', 'unitBus', 'unitLoad'],
        steps: [
          { code: '5AA1', name: '市电进线', note: '5#变入口' },
          { code: '5AA3', name: '电容柜', note: '补偿控制' },
          { code: '5AA4', name: 'ATS', note: '自动切换' },
          { code: '5AA5/5AA6', name: '5UPS1-3', note: 'UPS 主输出' },
          { code: '5AA8', name: '4#冷机 / 5#冷源系统备用', note: '冷站负载' }
        ]
      },
      {
        id: '6',
        code: '6#变',
        title: '6#变（1600KVA）',
        path: '市电进线 / 电容柜 / ATS / 6#UPS',
        status: '冷站',
        loadTag: '3#冷冻 / 冷却泵 / 冷塔风机',
        focus: ['unitTrans', 'unitBus', 'unitLoad', 'unitBattery'],
        steps: [
          { code: '6AA1', name: '市电进线', note: '6#变入口' },
          { code: '6AA2、3', name: '电容柜', note: '补偿与滤波' },
          { code: '6AA4', name: 'ATS', note: '切换控制' },
          { code: '6AA5/6AA6', name: '6UPS1-3', note: 'UPS 输出链路' },
          { code: '6AA8-4', name: '3#冷冻、冷却泵、冷塔风机', note: '冷站三联负载' }
        ]
      },
      {
        id: '7',
        code: '7#变',
        title: '7#变（1600KVA）',
        path: '市电进线 / 电容柜 / ATS / 7#UPS',
        status: '空调',
        loadTag: '机房奇数空调',
        focus: ['unitBus', 'unitLoad'],
        steps: [
          { code: '7-501 / 7-601', name: '油机 / 市电进线', note: '7#变前端输入' },
          { code: '7AA3、4', name: '电容柜', note: '补偿配置' },
          { code: '7AA5', name: 'ATS', note: '自动切换' },
          { code: '7AA8', name: '7UPS集中旁路', note: '7#UPS 旁路总汇' },
          { code: '7AA9 / 7AU5', name: '机房6-10奇数空调', note: '奇数空调支路' }
        ]
      },
      {
        id: '8',
        code: '8#变',
        title: '8#变（1600KVA）',
        path: '市电进线 / 电容柜 / ATS / 8#UPS',
        status: '空调',
        loadTag: '机房偶数空调 / 插座',
        focus: ['unitBus', 'unitLoad'],
        steps: [
          { code: '8-501 / 8-601', name: '油机 / 市电进线', note: '8#变前端输入' },
          { code: '8AA2、3', name: '电容柜', note: '补偿配置' },
          { code: '8AA4', name: 'ATS', note: '切换控制' },
          { code: '8AA7', name: '8UPS集中旁路', note: '8#UPS 旁路总汇' },
          { code: '8AA5/8AA6', name: '8UPS1-4', note: '机房偶数空调与插座' }
        ]
      },
      {
        id: '9',
        code: '9#变',
        title: '9#变（1600KVA）',
        path: '市电进线 / 电容柜 / ATS / 9#UPS',
        status: '冷机',
        loadTag: 'CH3 / 5#冷机备用',
        focus: ['unitBus', 'unitLoad', 'unitBattery'],
        steps: [
          { code: '9AA1', name: '市电进线', note: '9#变前端入口' },
          { code: '9AA2、3', name: '电容柜', note: '补偿配置' },
          { code: '9AA4', name: 'ATS', note: '自动切换' },
          { code: '9AA6/9AA7', name: '9UPS1-3', note: 'UPS 输出链路' },
          { code: '9AA9', name: 'CH3 / 5#冷机备用', note: '冷站备用链路' }
        ]
      },
      {
        id: '10',
        code: '10#变',
        title: '10#变（1600KVA）',
        path: '市电进线 / 电容柜 / ATS / 10#UPS',
        status: '监控',
        loadTag: '楼控 / 大屏 / 环控',
        focus: ['unitBus', 'unitLoad', 'unitMetrics'],
        steps: [
          { code: '10AA1', name: '市电进线', note: '10#变前端入口' },
          { code: '10AA2-3', name: '电容柜', note: '补偿配置' },
          { code: '10AA4', name: 'ATS', note: '自动切换' },
          { code: '10AA7', name: '10UPS集中旁路', note: '10#UPS 旁路总汇' },
          { code: '10AA8', name: '楼控DDC / 大屏 / 环控', note: '综合弱电与监控负载' }
        ]
      }
    ];
    window.upsMonitorRoutes = transformerRoutes;

    const UPS_COUNTS = {
      '1': 4,
      '2': 4,
      '3': 5,
      '4': 5,
      '5': 5,
      '6': 5,
      '7': 5,
      '8': 5,
      '9': 4,
      '10': 4
    };

    transformerRoutes.forEach(route => {
      route.upsCount = UPS_COUNTS[route.id] || 1;
    });

    const UPS_ROUTE_META = {
      '1': { input: '1AA5 / 1AA6 / 1AA7', output: '1AU1 - 1AU6', load: '1#UPS集中旁路 / 机房与新风机房' },
      '2': { input: '2AA4 / 2AA6', output: '2#UPS输出柜', load: '2#UPS集中旁路 / 冷源备用' },
      '3': { input: '3AA5 / 3AA6', output: '3UPS / 11UPS / 12UPS', load: '网络设备 / 维修旁路' },
      '4': { input: '4AA5 / 4AA6', output: '4UPS / 13UPS', load: '楼控与监控链路' },
      '5': { input: '5AA5 / 5AA6', output: '5UPS输出', load: '4#冷机 / 5#冷源系统备用' },
      '6': { input: '6AA5 / 6AA6', output: '6UPS输出', load: '3#冷冻 / 冷却泵 / 冷塔风机' },
      '7': { input: '7AA8', output: '7AA9 / 7AU5', load: '机房6-10奇数空调' },
      '8': { input: '8AA7', output: '8AA5 / 8AA6', load: '机房偶数空调 / 插座' },
      '9': { input: '9AA6 / 9AA7', output: '9UPS输出', load: 'CH3 / 5#冷机备用' },
      '10': { input: '10AA7', output: '10AA8', load: '楼控DDC / 大屏 / 环控' }
    };

    const ZHIHANG_MODELS = {
      ups: { name: '三相UPS', refId: '1.1.5.2', objId: 'OBJ-356', className: '不间断电源', subject: '电气' },
      transformer: { name: '变压器', refId: '1.1.2.1', objId: 'OBJ-342', className: '电力变压器', subject: '电气' },
      ats: { name: '三相ATS/STS', refId: '1.1.3.3', objId: 'OBJ-346', className: '切换装置', subject: '电气' },
      battery: { name: '铅酸阀控蓄电池组', refId: '1.1.6.1', objId: 'OBJ-360', className: '电池', subject: '电气' },
      switchboard: { name: '低压配电柜', refId: '1.1.3.1', objId: 'OBJ-343', className: '低压配电', subject: '电气' },
      pdu: { name: '交流PDU', refId: '1.1.8.1', objId: 'OBJ-366', className: 'PDU', subject: '电气' },
      switchModule: { name: '开关模块', refId: '1.1.3.6', objId: 'OBJ-349', className: '低压配电', subject: '电气' }
    };
    window.zhihangStdModels = ZHIHANG_MODELS;

    transformerRoutes.forEach(route => {
      route.stdModel = ZHIHANG_MODELS.transformer;
      route.atsModel = ZHIHANG_MODELS.ats;
      route.upsModel = ZHIHANG_MODELS.ups;
      route.outputModel = ZHIHANG_MODELS.switchboard;
      route.loadModel = ZHIHANG_MODELS.pdu;
    });

    const ZHIHANG_POINTS = {
      inputV: '1.1.5.2.4.1',
      outputV: '1.1.5.2.32.1',
      load: '1.1.5.2.54.1',
      battery: '1.1.5.2.58.1',
      temp: '1.1.5.2.59.1',
      runtime: '1.1.5.2.57.1',
      current: '1.1.5.2.56.1',
      freq: '1.1.5.2.38.1',
      bus: '1.1.5.2.29.1',
      mains: '1.1.5.2.2.1',
      fault: '1.1.5.2.9998.1'
    };
    window.zhihangPoints = ZHIHANG_POINTS;

    const upsDevices = [];
    Object.entries(UPS_COUNTS).forEach(([routeId, count]) => {
      const meta = UPS_ROUTE_META[routeId];
      const model = Number(routeId) <= 5 ? 'UPS5000E' : 'UPS5000H';
      for (let unit = 1; unit <= count; unit += 1) {
        upsDevices.push({
          id: `${routeId}-${unit}`,
          name: `${routeId}#UPS${unit}`,
          model,
          routeId,
          transformer: `${routeId}#变`,
          input: meta.input,
          output: meta.output,
          load: meta.load,
          stdModel: ZHIHANG_MODELS.ups
        });
      }
    });
    window.upsMonitorDevices = upsDevices;

    function nowLabel() {
      const d = new Date();
      return d.toLocaleTimeString('zh-CN', { hour12: false });
    }

    function pushLog(level, title, detail) {
      const item = { id: ++state.eventId, time: nowLabel(), level, title, detail };
      logs.unshift(item);
      if (logs.length > 8) logs.pop();
      renderLogs();
    }

    function setAlarm(key, title, detail, level) {
      const exists = alarms.findIndex(a => a.key === key);
      const item = { key, title, detail, level };
      if (exists >= 0) {
        alarms[exists] = item;
      } else {
        alarms.unshift(item);
      }
      renderAlarms();
    }

    function clearAlarm(key) {
      const idx = alarms.findIndex(a => a.key === key);
      if (idx >= 0) alarms.splice(idx, 1);
      renderAlarms();
    }

    function renderAlarms() {
      els.alarmList.innerHTML = '';
      if (!alarms.length) {
        const empty = document.createElement('li');
        empty.className = 'alarm-item';
        empty.innerHTML = '<div><strong>无活动告警</strong><p>系统处于监控状态，所有关键指标正常。</p></div><div class="alarm-tag ok">正常</div>';
        els.alarmList.appendChild(empty);
      } else {
        alarms.forEach(alarm => {
          const li = document.createElement('li');
          li.className = 'alarm-item';
          li.innerHTML = `<div><strong>${alarm.title}</strong><p>${alarm.detail}</p></div><div class="alarm-tag ${alarm.level}">${alarm.level === 'bad' ? '紧急' : '预警'}</div>`;
          els.alarmList.appendChild(li);
        });
      }
      els.alarmState.textContent = alarms.length ? String(alarms.length) : '0';
      els.alarmDetail.textContent = alarms.length ? alarms[0].title : '当前无紧急告警';
      els.alarmSummary.textContent = alarms.length ? '发现 ' + alarms.length + ' 条告警' : '在线监测中';
      syncSidebar();
    }

    function renderLogs() {
      if (!els.logList || !els.eventCount) return;
      els.logList.innerHTML = '';
      logs.forEach(log => {
        const li = document.createElement('li');
        li.className = 'log-item';
        li.innerHTML = `<div><strong>${log.title}</strong><p>${log.detail}</p></div><div style="text-align:right"><strong>${log.time}</strong><p>${log.level.toUpperCase()}</p></div>`;
        els.logList.appendChild(li);
      });
      els.eventCount.textContent = `${state.eventId} 条记录`;
    }

    function renderStdModels() {
      const grid = document.getElementById('stdModelGrid');
      if (!grid || !window.zhihangStdModels) return;
      const models = window.zhihangStdModels;
      const rows = [
        { kind: 'UPS', model: models.ups, count: upsDevices.length },
        { kind: '变压器', model: models.transformer, count: transformerRoutes.length },
        { kind: 'ATS', model: models.ats, count: transformerRoutes.length },
        { kind: '电池组', model: models.battery, count: 3 },
        { kind: '配电柜', model: models.switchboard, count: 20 }
      ];
      grid.innerHTML = rows.map(item => `
        <div class="std-model-card">
          <span class="kind">${item.kind} · ${item.count}</span>
          <b>${item.model.name}</b>
          <code>${item.model.refId} · ${item.model.objId}</code>
          <small>${item.model.className} / ${item.model.subject}</small>
        </div>
      `).join('');
    }

    function pointValue(payload, id, fallback) {
      const entry = payload && payload[id];
      if (entry && entry.reported_value !== undefined) {
        const value = Number(entry.reported_value);
        return Number.isFinite(value) ? value : fallback;
      }
      return fallback;
    }

    function updateDataSourceBadges() {
      if (els.snapshotLabel) {
        els.snapshotLabel.textContent = `${state.dataSource} · 1s刷新`;
      }
    }

    function applyZhihangRealtimeValues(payload) {
      state.inputV = pointValue(payload, window.zhihangPoints.inputV, state.inputV);
      state.outputV = pointValue(payload, window.zhihangPoints.outputV, state.outputV);
      state.load = pointValue(payload, window.zhihangPoints.load, state.load);
      state.battery = pointValue(payload, window.zhihangPoints.battery, state.battery);
      state.temp = pointValue(payload, window.zhihangPoints.temp, state.temp);
      state.runtime = pointValue(payload, window.zhihangPoints.runtime, state.runtime);
      state.current = pointValue(payload, window.zhihangPoints.current, state.current);
      state.freq = pointValue(payload, window.zhihangPoints.freq, state.freq);
      state.bus = pointValue(payload, window.zhihangPoints.bus, state.bus);
      state.mainsOn = pointValue(payload, window.zhihangPoints.mains, state.mainsOn ? 1 : 0) !== 0;
      state.fault = pointValue(payload, window.zhihangPoints.fault, state.fault ? 1 : 0) !== 0;
      state.dataSource = '智航实时数据';
    }

    async function syncZhihangRealtime() {
      const resultEl = document.getElementById('zhihangSyncResult');
      const points = Object.values(window.zhihangPoints || {});
      if (!points.length) {
        state.dataSource = '智航模拟数据';
        if (resultEl) resultEl.textContent = '未配置智航测点，当前使用模拟数据';
        updateDataSourceBadges();
        return;
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      try {
        const response = await fetch('/api/zhihang/realtime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ points }),
          signal: controller.signal
        });
        clearTimeout(timer);
        const data = await response.json();
        if (data.ok && data.data) {
          const payload = data.data;
          applyZhihangRealtimeValues(payload);
          if (resultEl) resultEl.textContent = '同步成功：当前运行数据来自智航 CMDB';
        } else {
          state.dataSource = '智航模拟数据';
          if (resultEl) resultEl.textContent = `同步失败：${data.error || '无数据'}，当前使用模拟数据`;
        }
      } catch (error) {
        state.dataSource = '智航模拟数据';
        if (resultEl) resultEl.textContent = '智航接口不可达，当前使用模拟数据';
      }
      updateDataSourceBadges();
      updateMetrics(true);
      updateTopology();
      runAiInspection(false);
    }

    function zhihangSidebarResult(text, isError = false) {
      const el = document.getElementById('zhihangSidebarResult');
      if (!el) return;
      el.textContent = text;
      el.style.color = isError ? '#ff9d9d' : 'var(--muted)';
    }

    function splitZhihangIds(value) {
      return String(value || '').split(',').map(item => item.trim()).filter(Boolean);
    }

    async function queryZhihangDevices() {
      const domain = document.getElementById('zhihangDomain').value.trim();
      const objIds = splitZhihangIds(document.getElementById('zhihangObjIds').value);
      if (!domain || !objIds.length) {
        zhihangSidebarResult('请输入数据中心域号和模型 OBJ ID。', true);
        return;
      }
      zhihangSidebarResult('正在查询智航设备实例...');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      try {
        const response = await fetch('/api/zhihang/devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domainCode: domain, objIds }),
          signal: controller.signal
        });
        clearTimeout(timer);
        const data = await response.json();
        if (data.ok) {
          const list = Array.isArray(data.data) ? data.data : [];
          const lines = list.slice(0, 25).map(item => `${item.insName || item.name || '-'}  (${item.insId || item.id || ''})`);
          zhihangSidebarResult(`查询成功：${list.length} 个设备实例\n\n${lines.join('\n')}`);
        } else {
          zhihangSidebarResult(`查询失败：${data.error || '未知错误'}`, true);
        }
      } catch (error) {
        clearTimeout(timer);
        zhihangSidebarResult(error.name === 'AbortError' ? '查询超时：智航接口不可达，请检查网络后重试。' : `查询失败：${error.message}`, true);
      }
    }

    async function queryZhihangRealtime() {
      const ids = splitZhihangIds(document.getElementById('zhihangPointIds').value);
      if (!ids.length) {
        zhihangSidebarResult('请输入实时测点 ID。', true);
        return;
      }
      zhihangSidebarResult('正在查询智航实时数据...');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      try {
        const response = await fetch('/api/zhihang/realtime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ points: ids }),
          signal: controller.signal
        });
        clearTimeout(timer);
        const data = await response.json();
        if (data.ok && data.data) {
          applyZhihangRealtimeValues(data.data);
          updateDataSourceBadges();
          updateMetrics(true);
          updateTopology();
          runAiInspection(false);
          const entries = Object.entries(data.data).map(([id, value]) => `${id} = ${value && value.reported_value !== undefined ? value.reported_value : '--'}`);
          zhihangSidebarResult(`实时数据同步成功\n\n${entries.join('\n')}`);
        } else {
          state.dataSource = '智航模拟数据';
          updateDataSourceBadges();
          zhihangSidebarResult(`查询失败：${data.error || '无数据'}`, true);
        }
      } catch (error) {
        clearTimeout(timer);
        state.dataSource = '智航模拟数据';
        updateDataSourceBadges();
        zhihangSidebarResult(error.name === 'AbortError' ? '查询超时：智航接口不可达，已切换为模拟数据。' : `查询失败，已使用模拟数据：${error.message}`, true);
      }
    }

    function runZhihangAiAnalysis() {
      const result = runAiInspection(true);
      if (result) {
        const lines = [
          `AI 评分：${result.score}`,
          `结论：${result.verdict}`,
          `风险等级：${result.risk}`,
          `数据源：${state.dataSource}`,
          '检查项：市电 / 电池 / 逆变 / 温度'
        ];
        zhihangSidebarResult(lines.join('\n'));
      } else {
        zhihangSidebarResult('AI 分析完成，请查看右侧 AI 巡检面板。');
      }
    }

    function syncSidebar() {
      const modeText = state.fault ? '故障旁路' : state.mainsOn ? '在线供电' : '电池供电';
      const scoreText = String(aiHistory[0]?.score ?? 96);
      const alarmText = String(alarms.length);
      const batteryText = Math.round(state.battery) + '%';

      els.sidebarMode.textContent = modeText;
      els.sidebarAiScore.textContent = scoreText;
      els.sidebarAlarmCount.textContent = alarmText;

      els.summaryMode.textContent = modeText;
      els.summaryAi.textContent = scoreText;
      els.summaryAlarm.textContent = alarmText;
      els.summaryBattery.textContent = batteryText;
    }

    function downloadText(filename, content, mime = 'text/plain;charset=utf-8') {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    function exportInspectionData() {
      const payload = {
        device: '华为 UPS5000E / UPS5000H',
        exportedAt: new Date().toISOString(),
        selectedRoute: currentRoute(),
        settings: state.settings,
        aiHistory,
        alarms,
        recentLogs: logs
      };
      downloadText(`UPS巡检数据-${Date.now()}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
      pushLog('info', '巡检数据导出', '巡检数据已生成并下载。');
    }

    function applySettings() {
      state.settings.autoAi = els.autoAi.checked;
      state.settings.aiInterval = Number(els.aiInterval.value) || 8;
      state.settings.tempWarn = Number(els.tempWarn.value) || 45;
      state.settings.tempBad = Number(els.tempBad.value) || 55;
      state.settings.batteryWarn = Number(els.batteryWarn.value) || 30;
      state.settings.batteryBad = Number(els.batteryBad.value) || 15;

      clearInterval(aiTimer);
      if (state.settings.autoAi) {
        aiTimer = setInterval(() => runAiInspection(false), Math.max(3, state.settings.aiInterval) * 1000);
      }
      pushLog('info', '系统设置', '巡检阈值和自动巡检策略已更新。');
    }

    function toggleSettingsPanel() {
      if (els.settingsFold) {
        els.settingsFold.open = !els.settingsFold.open;
      }
    }

    function scrollToSection(id) {
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function cabinetMarkup(kind, label, channel) {
      const vents = Array.from({ length: 12 }, () => '<span></span>').join('');
      return `
        <div class="cabinet-model cabinet-type-${kind}" aria-hidden="true">
          <div class="cabinet-head">
            <span>${label}</span>
            <span class="cabinet-leds"><span></span><span></span><span></span></span>
          </div>
          <div class="cabinet-screen"></div>
          <div class="cabinet-vents">${vents}</div>
          <div class="cabinet-plate"></div>
          <div class="cabinet-base"><span>${channel}</span><span>3D</span></div>
        </div>
      `;
    }

    function decoratePowerUnits() {
      const models = [
        [els.unitMains, 'mains', 'GRID', 'AC-IN'],
        [els.unitTrans, 'transformer', 'TRANSFORMER', '10kV/380V'],
        [els.unitAts, 'ats', 'ATS', 'AUTO'],
        [els.unitUps, 'ups', 'HUAWEI UPS', 'INV'],
        [els.unitBus, 'bus', 'PDU BUS', 'OUT'],
        [els.unitLoad, 'load', 'LOAD', 'IT/HVAC'],
        [els.unitBattery, 'battery', 'BATTERY', 'DC'],
        [els.unitBypass, 'bypass', 'BYPASS', 'MAINT'],
        [els.unitMetrics, 'metrics', 'MONITOR', 'AI']
      ];
      models.forEach(([el, kind, label, channel]) => {
        if (el && !el.querySelector('.cabinet-model')) {
          el.insertAdjacentHTML('afterbegin', cabinetMarkup(kind, label, channel));
        }
      });
    }

    function bindPowerSceneCamera() {
      if (!els.powerStage || !els.powerScene) return;
      els.powerStage.addEventListener('pointermove', event => {
        const rect = els.powerStage.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        els.powerScene.style.setProperty('--tilt-y', `${-16 + x * 10}deg`);
        els.powerScene.style.setProperty('--tilt-x', `${18 - y * 6}deg`);
      });
      els.powerStage.addEventListener('pointerleave', () => {
        els.powerScene.style.setProperty('--tilt-y', '-16deg');
        els.powerScene.style.setProperty('--tilt-x', '18deg');
      });
    }

    function currentRoute() {
      return transformerRoutes.find(item => item.id === selectedRouteId) || transformerRoutes[0];
    }

    function routeLiveStatus() {
      return state.fault ? '故障旁路' : state.mainsOn ? '在线供电' : '电池供电';
    }

    function openRouteModal(route = currentRoute()) {
      if (!route || !els.routeModal) return;
      const liveStatus = routeLiveStatus();
      els.routeModalTitle.textContent = route.title;
      els.routeModalPath.textContent = route.path;
      els.routeModalStatus.textContent = `${route.status} / ${liveStatus}`;
      els.routeModalLoad.textContent = `${route.loadTag} · ${route.stdModel.name} / ${route.atsModel.name} / ${route.upsCount || 1}台${route.upsModel.name}`;
      els.routeModalZone.textContent = `${route.code} 配电图走向（${route.upsCount || 1}台${route.upsModel.name}）`;
      els.routeModalSteps.innerHTML = '';
      route.steps.forEach((step, index) => {
        const stepEl = document.createElement('div');
        stepEl.className = 'route-step';
        stepEl.innerHTML = `
          <div class="step-index">STEP ${index + 1}</div>
          <div class="step-name">${step.code} ${step.name}</div>
          <div class="step-note">${step.note}</div>
        `;
        els.routeModalSteps.appendChild(stepEl);
      });
      els.routeModal.classList.add('open');
      els.routeModal.setAttribute('aria-hidden', 'false');
      if (els.routeModalClose) els.routeModalClose.focus();
    }

    function closeRouteModal() {
      if (!els.routeModal) return;
      els.routeModal.classList.remove('open');
      els.routeModal.setAttribute('aria-hidden', 'true');
    }

    function showUpsStatus(device) {
      if (!device) return;
      const route = transformerRoutes.find(item => item.id === device.routeId);
      const liveStatus = routeLiveStatus();
      const batteryStatus = state.lowBattery ? '低压预警' : state.mainsOn ? '浮充待机' : '放电供电';
      const health = state.fault ? '逆变异常' : state.lowBattery ? '需关注' : '运行正常';

      selectedUpsDevice = device;
      if (window.UPSFleet3D) window.UPSFleet3D.setDevice(device.id);

      if (els.deviceName) els.deviceName.textContent = `华为 三相UPS · ${device.name}（${device.model || 'UPS5000E'}）`;
      if (els.deviceHealth) els.deviceHealth.textContent = `${device.transformer} / ${health} / ${state.dataSource}`;
      if (els.deviceStdModel && device.stdModel) {
        els.deviceStdModel.textContent = `智航模型：${device.stdModel.name} · ${device.stdModel.refId} · ${device.stdModel.objId}`;
      }
      if (els.deviceState) {
        els.deviceState.textContent = `${liveStatus}，${batteryStatus}，输入 ${device.input}，输出 ${device.output}，负载：${device.load}`;
      }
    }

    function refreshSelectedUpsStatus() {
      if (!selectedUpsDevice) return;
      const device = selectedUpsDevice;
      const liveStatus = routeLiveStatus();
      const batteryStatus = state.lowBattery ? '低压预警' : state.mainsOn ? '浮充待机' : '放电供电';
      const health = state.fault ? '逆变异常' : state.lowBattery ? '需关注' : '运行正常';
      if (els.deviceName) els.deviceName.textContent = `华为 三相UPS · ${device.name}（${device.model || 'UPS5000E'}）`;
      if (els.deviceHealth) els.deviceHealth.textContent = `${device.transformer} / ${health} / ${state.dataSource}`;
      if (els.deviceStdModel && device.stdModel) {
        els.deviceStdModel.textContent = `智航模型：${device.stdModel.name} · ${device.stdModel.refId} · ${device.stdModel.objId}`;
      }
      if (els.deviceState) {
        els.deviceState.textContent = `${liveStatus}，${batteryStatus}，输入 ${device.input}，输出 ${device.output}，负载：${device.load}`;
      }
    }

    function bindUpsStatusCards() {
      const fleetCards = document.querySelectorAll('.ups-fleet-grid .cabinet-model');
      fleetCards.forEach((card, index) => {
        const device = upsDevices[index];
        if (!device) return;
        card.classList.add('ups-selectable');
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `${device.name} 运行状态`);
        card.addEventListener('click', () => {
          document.querySelectorAll('.cabinet-model.ups-selectable').forEach(el => el.classList.remove('active'));
          card.classList.add('active');
          showUpsStatus(device);
        });
        card.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            card.click();
          }
        });
      });

      const bayCards = document.querySelectorAll('.architecture-bay .cabinet-type-ups');
      bayCards.forEach((card, index) => {
        const device = upsDevices[index];
        if (!device) return;
        card.classList.add('ups-selectable');
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `${device.name} 运行状态`);
        card.addEventListener('click', () => showUpsStatus(device));
        card.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            card.click();
          }
        });
      });
    }

    function renderDistributionMap() {
      if (!els.distributionMap) return;
      const rowGroups = [
        { label: '一层主配电区', ids: ['1', '2'] },
        { label: '三层 / 四层 UPS 与空调动力区', ids: ['3', '4'] },
        { label: '冷源与动力区', ids: ['5', '6'] },
        { label: '机房空调、插座及末端动力区', ids: ['7', '8'] },
        { label: '冷机备用与楼控监控区', ids: ['9', '10'] }
      ];

      els.distributionMap.innerHTML = '';
      rowGroups.forEach(group => {
        const row = document.createElement('div');
        row.className = 'distribution-row';

        const label = document.createElement('div');
        label.className = 'distribution-row-label';
        label.textContent = group.label;
        row.appendChild(label);

        group.ids.forEach(id => {
          const route = transformerRoutes.find(item => item.id === id);
          if (!route) return;
          const card = document.createElement('button');
          card.type = 'button';
          card.className = `transformer-card${route.id === selectedRouteId ? ' active' : ''}`;
          const firstSteps = route.steps.slice(0, 4).map(step => `<span>${step.code}</span>`).join('<span>→</span>');
          const tags = route.steps.slice(0, 5).map(step => `<span>${step.name}</span>`).join('');
          card.innerHTML = `
            <div class="card-top">
              <div>
                <div class="card-title">${route.title}</div>
                <div class="card-meta">${route.path}</div>
              </div>
              <span class="card-tag">${route.status}</span>
            </div>
            <div class="card-route">
              <div class="route-path-line">${firstSteps}</div>
              <div class="route-tags">${tags}</div>
            </div>
            <div class="route-footer"><span>${route.loadTag}</span><span>${route.id === selectedRouteId ? '当前查看' : '点击查看'}</span></div>
          `;
          card.addEventListener('click', () => selectRoute(route));
          row.appendChild(card);
        });

        els.distributionMap.appendChild(row);
      });
    }

    function renderTransformerButtons() {
      if (!els.transformerButtons) return;
      els.transformerButtons.innerHTML = '';
      transformerRoutes.forEach(route => {
        const btn = document.createElement('button');
        btn.className = `transformer-btn${route.id === selectedRouteId ? ' active' : ''}`;
        btn.type = 'button';
        btn.innerHTML = `<span class="code">${route.code}</span><span class="name">${route.title}</span>`;
        btn.addEventListener('click', () => selectRoute(route));
        els.transformerButtons.appendChild(btn);
      });
    }

    function renderRoutePanel(refreshSteps = false) {
      const route = currentRoute();
      if (!route) return;

      const liveStatus = state.fault ? '故障旁路' : state.mainsOn ? '在线供电' : '电池供电';
      if (els.routeTitle) els.routeTitle.textContent = route.title;
      if (els.routePath) els.routePath.textContent = route.path;
      if (els.routeStatus) els.routeStatus.textContent = route.status;
      if (els.routeLoad) els.routeLoad.textContent = `${route.loadTag} · ${route.stdModel.name} → ${route.atsModel.name} → ${route.upsCount || 1}台${route.upsModel.name} / ${liveStatus}`;
      if (refreshSteps && els.routeSteps) {
        els.routeSteps.innerHTML = '';
        route.steps.forEach((step, index) => {
          const stepEl = document.createElement('div');
          stepEl.className = 'route-step';
          stepEl.innerHTML = `
            <div class="step-index">STEP ${index + 1}</div>
            <div class="step-name">${step.code} ${step.name}</div>
            <div class="step-note">${step.note}</div>
          `;
          els.routeSteps.appendChild(stepEl);
        });
      }
      if (els.topologyBadge) {
        els.topologyBadge.textContent = `${route.code} 走向 / ${liveStatus} / ${state.dataSource}`;
      }
      if (window.UPS3D) window.UPS3D.setRoute(route.id);
    }

    function selectRoute(route) {
      selectedRouteId = route.id;
      renderTransformerButtons();
      renderDistributionMap();
      renderRoutePanel(true);
      updateTopology();
      openRouteModal(route);
      if (window.UPS3D) window.UPS3D.setRoute(route.id);
    }

    function applyRouteFocus() {
      const route = currentRoute();
      const units = [
        'unitMains',
        'unitTrans',
        'unitAts',
        'unitUps',
        'unitBus',
        'unitLoad',
        'unitBattery',
        'unitBypass',
        'unitMetrics'
      ];
      units.forEach(key => {
        if (els[key]) els[key].classList.remove('route-focus');
      });
      route.focus.forEach(key => {
        if (els[key]) els[key].classList.add('route-focus');
      });
    }

    function runAiInspection(manual = false) {
      aiRuns += 1;
      const findings = [];
      let score = 100;

      if (!state.mainsOn) {
        score -= 12;
        findings.push({ title: '市电中断已识别', detail: '系统确认当前处于电池逆变供电模式，建议持续观察续航。', level: 'warn' });
      } else {
        findings.push({ title: '市电输入稳定', detail: 'AI 判断输入电压波动正常，未见明显跌落或漂移。', level: 'ok' });
      }

      if (state.battery < state.settings.batteryWarn) {
        score -= 18;
        findings.push({ title: '电池容量偏低', detail: `容量已进入预警区间（${state.settings.batteryWarn}%），建议安排充电恢复或现场核查。`, level: state.battery < state.settings.batteryBad ? 'bad' : 'warn' });
      } else {
        findings.push({ title: '电池健康正常', detail: '容量与续航曲线平稳，未发现明显衰减拐点。', level: 'ok' });
      }

      if (state.fault) {
        score -= 30;
        findings.push({ title: '逆变器异常', detail: 'AI 已识别输出波动与故障特征，当前属于高风险状态。', level: 'bad' });
      } else {
        findings.push({ title: '输出链路正常', detail: '未检测到旁路切换失败、输出失稳或频率偏移。', level: 'ok' });
      }

      if (state.temp >= state.settings.tempWarn) {
        score -= 15;
        findings.push({ title: '温升偏高', detail: `温度已超过预警线（${state.settings.tempWarn}℃），需要关注散热条件。`, level: state.temp >= state.settings.tempBad ? 'bad' : 'warn' });
      } else {
        findings.push({ title: '温度正常', detail: '当前机柜温升在安全范围内。', level: 'ok' });
      }

      score = Math.max(42, Math.min(99, Math.round(score)));
      const risk = score >= 90 ? '低' : score >= 75 ? '中' : '高';
      const verdict = score >= 85 ? '健康' : score >= 70 ? '关注' : '告警';
      const angle = Math.max(18, Math.min(356, score * 3.6));

      els.aiScore.textContent = score;
      els.aiVerdict.textContent = verdict;
      els.aiRisk.textContent = risk;
      els.aiCoverage.textContent = state.fault ? '电源 / 电池 / 逆变' : state.mainsOn ? '电源 / 电池 / 温度' : '电池 / 负载 / 温度';
      els.aiTime.textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false });
      els.aiRing.style.setProperty('--score-angle', angle + 'deg');
      els.aiStatus.textContent = `${manual ? '已巡检' : '自动巡检'} · ${state.dataSource}`;
      els.aiInputText.textContent = state.mainsOn ? '市电波动在容差内' : '已切换为电池供电';
      els.aiBatteryText.textContent = state.battery < state.settings.batteryWarn ? '电池容量偏低，需关注续航' : '电池容量稳定，充放电曲线平滑';
      els.aiFaultText.textContent = state.fault ? '已识别逆变器异常特征' : '未检测到逆变器或旁路异常';

      els.aiInputTag.textContent = state.mainsOn ? '正常' : '中断';
      els.aiBatteryTag.textContent = state.battery < state.settings.batteryWarn ? '关注' : '正常';
      els.aiFaultTag.textContent = state.fault ? '异常' : '正常';

      aiHistory.unshift({ score, verdict, risk, time: els.aiTime.textContent });
      if (aiHistory.length > 10) aiHistory.pop();

      pushLog(score >= 85 ? 'info' : score >= 70 ? 'warn' : 'bad', 'AI 巡检完成', `巡检评分 ${score}，结论：${verdict}，风险等级：${risk}。`);
      syncSidebar();
      return { score, verdict, risk, findings };
    }

    function setMains(on) {
      state.mainsOn = on;
      if (on) {
        state.inputV = 220 + rand(-3, 3);
        state.outputV = 220 + rand(-1, 1);
        state.response = 18 + rand(-2, 2);
        pushLog('info', '市电恢复', '输入电源已恢复，系统返回在线供电。');
        clearAlarm('mains');
      } else {
        state.inputV = 0;
        state.outputV = 220;
        state.response = 26 + rand(-1, 3);
        pushLog('warn', '市电中断', '监测到输入电压跌落，UPS 已切换至电池模式。');
        setAlarm('mains', '市电中断', '输入电压为 0V，当前由电池逆变供电。', 'warn');
      }
      updateTopology();
    }

    function setFault(on) {
      state.fault = on;
      if (on) {
        pushLog('bad', '逆变器故障', '检测到逆变异常与输出波动，已上报维护。');
        setAlarm('fault', '逆变器故障', '输出电压波动异常，请立即检查逆变模块。', 'bad');
      } else {
        pushLog('info', '故障解除', '逆变模块恢复正常输出。');
        clearAlarm('fault');
      }
      updateTopology();
    }

    function setLowBattery(on) {
      state.lowBattery = on;
      if (on) {
        state.battery = Math.min(state.battery, Math.max(10, state.settings.batteryWarn - 2));
        pushLog('warn', '电池低压预警', '电池容量下降到预警线，建议尽快恢复市电。');
        setAlarm('battery', '电池低压', `剩余容量低于 ${state.settings.batteryWarn}%，系统处于续航紧张状态。`, 'warn');
      } else {
        pushLog('info', '电池恢复', '电池状态回到安全区间。');
        clearAlarm('battery');
      }
      updateTopology();
    }

    function resetAll() {
      state.mainsOn = true;
      state.fault = false;
      state.lowBattery = false;
      state.battery = 96;
      state.load = 32;
      state.temp = 34.2;
      state.inputV = 220;
      state.outputV = 220;
      state.runtime = 47;
      state.bus = 384;
      state.freq = 50;
      state.response = 18;
      alarms.length = 0;
      pushLog('info', '系统恢复', '所有监控项恢复到正常状态。');
      renderAlarms();
      syncSidebar();
      updateTopology();
    }

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function updateClock() {
      const d = new Date();
      els.clockTime.textContent = d.toLocaleTimeString('zh-CN', { hour12: false });
      els.clockDate.textContent = d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    }

    function statusClass(value, warnAt, badAt) {
      if (value >= badAt) return 'bad';
      if (value >= warnAt) return 'warn';
      return 'ok';
    }

    function setLamp(el, stateName) {
      el.className = `lamp ${stateName ? 'on ' + stateName : ''}`.trim();
    }

    function setUnitClass(el, stateName) {
      if (!el) return;
      el.classList.remove('active', 'warn', 'bad', 'info');
      if (stateName) el.classList.add(stateName);
    }

    function setStreamClass(el, stateName, visible = false) {
      if (!el) return;
      const vertical = el.dataset.vertical === '1';
      el.className = 'power-stream';
      if (vertical) el.classList.add('vertical');
      if (stateName) el.classList.add(stateName);
      if (visible) el.classList.add('active');
    }

    function updateTopology() {
      const online = state.mainsOn && !state.fault;
      const onBattery = !state.mainsOn && !state.fault;
      const faultPath = state.fault;

      if (els.topologyBadge) {
        if (faultPath) {
          els.topologyBadge.textContent = `故障旁路路径 / ${state.dataSource}`;
        } else if (onBattery) {
          els.topologyBadge.textContent = `电池供电路径 / ${state.dataSource}`;
        } else if (state.lowBattery) {
          els.topologyBadge.textContent = `电池预警运行 / ${state.dataSource}`;
        } else {
          els.topologyBadge.textContent = `在线供电路径 / ${state.dataSource}`;
        }
      }
      applyRouteFocus();
      renderRoutePanel(false);
      refreshSelectedUpsStatus();
    }

    function drawTrend() {
      const c = els.trendChart;
      const ctx = c.getContext('2d');
      const w = c.width, h = c.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#0c131b';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 8; i++) {
        const y = (h / 8) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const series = {
        load: state.trend.map((p, i) => ({ x: i, y: p.load })),
        battery: state.trend.map((p, i) => ({ x: i, y: p.battery })),
        temp: state.trend.map((p, i) => ({ x: i, y: p.temp }))
      };

      function path(points, scaleY, offsetY = 0) {
        ctx.beginPath();
        points.forEach((p, index) => {
          const x = (p.x / 59) * (w - 40) + 20;
          const y = h - 20 - ((p.y - scaleY.min) / (scaleY.max - scaleY.min)) * (h - 50) + offsetY;
          if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      const loadScale = { min: 10, max: 70 };
      const battScale = { min: 20, max: 100 };
      const tempScale = { min: 28, max: 50 };

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#63b3ff';
      path(series.load, loadScale);
      ctx.strokeStyle = '#49d17d';
      path(series.battery, battScale);
      ctx.strokeStyle = '#f2b84c';
      path(series.temp, tempScale);

      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = '#8fa2b8';
      ctx.fillText('负载率', 22, 20);
      ctx.fillStyle = '#63b3ff';
      ctx.fillRect(70, 11, 12, 12);
      ctx.fillStyle = '#8fa2b8';
      ctx.fillText('电池容量', 100, 20);
      ctx.fillStyle = '#49d17d';
      ctx.fillRect(174, 11, 12, 12);
      ctx.fillStyle = '#8fa2b8';
      ctx.fillText('机温', 204, 20);
      ctx.fillStyle = '#f2b84c';
      ctx.fillRect(246, 11, 12, 12);
    }

    function updateMetrics(skipSimulation = false) {
      if (els.snapshotLabel) {
        els.snapshotLabel.textContent = `${state.dataSource} · 1s刷新`;
      }
      if (!skipSimulation && state.dataSource !== '智航实时数据') {
      const loadDelta = state.mainsOn ? rand(-2, 2) : rand(-1, 2);
      state.load = Math.max(18, Math.min(88, state.load + loadDelta * 0.15));
      state.temp = Math.max(30, Math.min(58, state.temp + (state.fault ? 0.12 : 0.03) + (state.mainsOn ? 0.01 : 0.04)));

      if (state.mainsOn && !state.fault) {
        state.battery = Math.min(100, state.battery + 0.08);
        state.runtime = Math.min(180, state.runtime + 0.2);
        state.bus = 384 + rand(-2, 2);
        state.freq = 50 + rand(-0.03, 0.03);
        state.response = 18 + rand(-2, 2);
      } else if (!state.mainsOn && !state.fault) {
        state.battery = Math.max(0, state.battery - 0.22);
        state.runtime = Math.max(2, state.runtime - 0.35);
        state.bus = 378 + rand(-2, 2);
        state.freq = 49.9 + rand(-0.05, 0.05);
        state.response = 24 + rand(-2, 2);
      } else if (state.fault) {
        state.battery = Math.max(0, state.battery - 0.1);
        state.runtime = Math.max(1, state.runtime - 0.2);
        state.bus = 372 + rand(-4, 4);
        state.freq = 49.3 + rand(-0.12, 0.12);
        state.response = 44 + rand(-5, 8);
      }
      }

      if (!state.mainsOn && state.battery <= state.settings.batteryBad && !alarms.some(a => a.key === 'batteryCritical')) {
        setAlarm('batteryCritical', '电池临界', `剩余容量低于 ${state.settings.batteryBad}%，建议立即处理市电恢复。`, 'bad');
        pushLog('bad', '电池临界', '电池容量已降至临界值。');
      }

      if (state.mainsOn && state.battery > state.settings.batteryWarn + 5) {
        clearAlarm('batteryCritical');
      }

      const loadClass = statusClass(state.load, 70, 85);
      const tempClass = statusClass(state.temp, state.settings.tempWarn, state.settings.tempBad);
      const inputClass = state.mainsOn ? 'ok' : 'bad';
      const outputClass = state.fault ? 'bad' : (state.mainsOn ? 'ok' : 'warn');
      const batteryClass = state.battery < state.settings.batteryBad ? 'bad' : state.battery < state.settings.batteryWarn ? 'warn' : 'ok';

      els.mainsDot.className = `dot ${state.mainsOn ? 'ok' : 'bad'}`;
      els.mainsText.textContent = state.mainsOn ? '正常' : '已断电';
      els.modeDot.className = `dot ${state.fault ? 'bad' : state.mainsOn ? 'info' : 'warn'}`;
      els.modeText.textContent = state.fault ? '故障旁路' : state.mainsOn ? '在线供电' : '电池供电';
      els.faultDot.className = `dot ${state.fault ? 'bad' : 'ok'}`;
      els.faultText.textContent = state.fault ? '存在故障' : '无故障';
      els.batteryDot.className = `dot ${batteryClass}`;
      els.batteryText.textContent = state.lowBattery ? '低压预警' : state.mainsOn ? '待机充电' : '放电中';

      els.deviceHealth.textContent = `${state.fault ? '设备告警中' : state.mainsOn ? '设备自检通过' : '电池切换运行'} / ${state.dataSource}`;
      els.deviceState.textContent = state.fault
        ? '逆变器异常，输出波动，需要维护处理'
        : state.mainsOn
          ? '市电正常，逆变器在线，电池充电待机'
          : '市电中断，UPS 已切换到电池逆变供电';

      setLamp(els.lampRun, state.fault ? 'warn' : 'ok');
      setLamp(els.lampCharge, state.mainsOn && !state.fault ? 'ok' : state.mainsOn ? 'warn' : '');
      setLamp(els.lampFault, state.fault ? 'bad' : '');
      setLamp(els.lampBypass, state.fault ? 'warn' : (!state.mainsOn ? 'info' : ''));

      const batteryAngle = Math.max(10, Math.min(360, state.battery * 3.6));
      els.batteryDial.style.setProperty('--angle', batteryAngle + 'deg');
      els.batteryPercent.textContent = Math.round(state.battery) + '%';
      els.batteryCaption.textContent = state.fault
        ? '故障运行中，关注输出与温升'
        : state.mainsOn
          ? '电池健康稳定，维持浮充状态'
          : '电池处于放电模式，持续提供后备电源';
      refreshSelectedUpsStatus();

      els.loadValue.textContent = Math.round(state.load) + '%';
      els.loadBar.style.setProperty('--value', Math.round(state.load) + '%');
      els.loadBar.parentElement.className = `status-bar ${loadClass}`;

      els.inputValue.textContent = state.inputV <= 0 ? '0V' : Math.round(state.inputV) + 'V';
      els.inputBar.style.setProperty('--value', Math.max(0, Math.min(100, state.inputV / 240 * 100)) + '%');
      els.inputBar.parentElement.className = `status-bar ${inputClass}`;

      els.outputValue.textContent = Math.round(state.outputV) + 'V';
      els.outputBar.style.setProperty('--value', Math.max(0, Math.min(100, state.outputV / 240 * 100)) + '%');
      els.outputBar.parentElement.className = `status-bar ${outputClass}`;

      els.tempValue.textContent = state.temp.toFixed(1) + '℃';
      els.tempBar.style.setProperty('--value', Math.min(100, state.temp) + '%');
      els.tempBar.parentElement.className = `status-bar ${tempClass}`;

      els.runtimeValue.textContent = Math.round(state.runtime) + ' min';
      els.runtimeBar.style.setProperty('--value', Math.max(0, Math.min(100, state.runtime / 60 * 100)) + '%');
      els.runtimeBar.parentElement.className = `status-bar ${batteryClass}`;

      els.currentValue.textContent = state.fault ? '6.8A' : state.mainsOn ? '1.8A' : '2.4A';
      els.currentBar.style.setProperty('--value', state.fault ? '74%' : state.mainsOn ? '18%' : '28%');
      els.currentBar.parentElement.className = `status-bar ${state.fault ? 'warn' : 'ok'}`;

      els.gridState.textContent = state.mainsOn ? '正常' : '中断';
      els.gridDetail.textContent = state.mainsOn ? '输入稳定，波动 0.8%' : '已触发断电检测，自动切入电池';
      els.outputState.textContent = state.fault ? '异常' : Math.round(state.outputV) + 'V';
      els.outputDetail.textContent = state.fault ? '逆变输出波动' : state.mainsOn ? '逆变输出正常' : '后备供电稳定';
      els.capacityState.textContent = Math.round(state.battery) + '%';
      els.capacityDetail.textContent = state.mainsOn ? '浮充 / 放电 0.0A' : '放电中 / 电流上升';
      els.heatState.textContent = '+' + (state.temp - 30).toFixed(1) + '℃';
      els.heatDetail.textContent = tempClass === 'bad' ? '温度过高，建议检查风道' : tempClass === 'warn' ? '温度偏高，请关注负载' : '机柜通风正常';
      els.loadState.textContent = Math.round(state.load) + '%';
      els.loadDetail.textContent = `${(state.load * 0.12).toFixed(1)} kW`;
      els.busValue.textContent = Math.round(state.bus) + 'V';
      els.freqValue.textContent = state.freq.toFixed(1) + 'Hz';
      els.dodValue.textContent = Math.round(100 - state.battery) + '%';
      els.respValue.textContent = Math.round(state.response) + 'ms';

      state.trend.push({ load: state.load, battery: state.battery, temp: state.temp });
      if (state.trend.length > 60) state.trend.shift();
      drawTrend();

      if (state.mainsOn) {
        clearAlarm('mains');
      }

      if (state.fault) {
        setAlarm('fault', '逆变器故障', '输出波动持续存在，建议检查逆变模块。', 'bad');
      } else {
        clearAlarm('fault');
      }

      if (state.lowBattery && state.battery < state.settings.batteryWarn) {
        setAlarm('battery', '电池低压', `剩余容量低于 ${state.settings.batteryWarn}%，系统处于续航紧张状态。`, 'warn');
      } else if (!state.lowBattery) {
        clearAlarm('battery');
      }

      els.alarmState.textContent = String(alarms.length);
      els.alarmSummary.textContent = alarms.length ? '发现 ' + alarms.length + ' 条告警' : '在线监测中';
      syncSidebar();
      updateTopology();
      if (window.UPS3D) window.UPS3D.update(state);
      if (window.UPSFleet3D) window.UPSFleet3D.update(state);
    }

    els.loginTab.addEventListener('click', () => setAuthMode('login'));
    els.registerTab.addEventListener('click', () => setAuthMode('register'));
    els.loginForm.addEventListener('submit', event => {
      event.preventDefault();
      loginAccount(els.loginUsername.value, els.loginPassword.value);
    });
    els.registerForm.addEventListener('submit', event => {
      event.preventDefault();
      registerAccount(els.registerUsername.value, els.registerPassword.value, els.registerConfirm.value);
    });

    document.getElementById('toggleMainsBtn').addEventListener('click', () => {
      setMains(!state.mainsOn);
    });

    document.getElementById('faultBtn').addEventListener('click', () => {
      setFault(!state.fault);
    });

    document.getElementById('lowBatteryBtn').addEventListener('click', () => {
      setLowBattery(!state.lowBattery);
    });

    document.getElementById('resetBtn').addEventListener('click', resetAll);
    document.getElementById('runAiBtn').addEventListener('click', () => runAiInspection(true));
    document.getElementById('exportAiBtn').addEventListener('click', () => {
      exportInspectionData();
    });
    document.getElementById('sidebarAiBtn').addEventListener('click', () => runAiInspection(true));
    document.getElementById('sidebarExportBtn').addEventListener('click', exportInspectionData);
    document.getElementById('sidebarSettingsBtn').addEventListener('click', toggleSettingsPanel);
    document.getElementById('sidebarResetBtn').addEventListener('click', resetAll);
    els.sidebarLogoutBtn.addEventListener('click', () => lockSystem('已退出登录，请重新输入账号。'));
    const zhihangTestBtn = document.getElementById('zhihangTestBtn');
    const zhihangQueryResult = document.getElementById('zhihangQueryResult');
    const zhihangQueryBadge = document.getElementById('zhihangQueryBadge');
    if (zhihangTestBtn) {
      zhihangTestBtn.addEventListener('click', async () => {
        if (zhihangQueryResult) zhihangQueryResult.textContent = '正在检查智航接口状态...';
        try {
          const response = await fetch('/api/zhihang/status');
          const data = await response.json();
          if (zhihangQueryResult) {
            zhihangQueryResult.textContent = data.ok
              ? `接口已接入：${data.endpoints.length} 个核心接口`
              : `查询失败：${data.error || '未知错误'}`;
          }
          if (zhihangQueryBadge) {
            zhihangQueryBadge.textContent = data.ok ? '接口连通正常' : '接口待配置';
          }
        } catch (error) {
          if (zhihangQueryResult) zhihangQueryResult.textContent = `查询失败：${error.message}`;
          if (zhihangQueryBadge) zhihangQueryBadge.textContent = '接口待配置';
        }
      });
    }
    const zhihangSyncBtn = document.getElementById('zhihangSyncBtn');
    if (zhihangSyncBtn) {
      zhihangSyncBtn.addEventListener('click', async () => {
        const resultEl = document.getElementById('zhihangSyncResult');
        if (resultEl) resultEl.textContent = '正在同步智航实时数据...';
        await syncZhihangRealtime();
      });
    }
    const zhihangDeviceBtn = document.getElementById('zhihangDeviceBtn');
    const zhihangRealtimeBtn = document.getElementById('zhihangRealtimeBtn');
    const zhihangAiBtn = document.getElementById('zhihangAiBtn');
    if (zhihangDeviceBtn) zhihangDeviceBtn.addEventListener('click', queryZhihangDevices);
    if (zhihangRealtimeBtn) zhihangRealtimeBtn.addEventListener('click', queryZhihangRealtime);
    if (zhihangAiBtn) zhihangAiBtn.addEventListener('click', runZhihangAiAnalysis);
    const zhihangPointIds = document.getElementById('zhihangPointIds');
    if (zhihangPointIds && window.zhihangPoints) {
      zhihangPointIds.value = Object.values(window.zhihangPoints).join(',');
    }
    document.getElementById('saveSettingsBtn').addEventListener('click', applySettings);
    if (els.routeModalClose) {
      els.routeModalClose.addEventListener('click', closeRouteModal);
    }
    if (els.routeModal) {
      els.routeModal.addEventListener('click', event => {
        if (event.target === els.routeModal) closeRouteModal();
      });
    }
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeRouteModal();
    });
    document.querySelectorAll('[data-scroll]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-btn[data-scroll]').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
        scrollToSection(btn.dataset.scroll);
      });
    });

    initAuth();
    els.autoAi.checked = state.settings.autoAi;
    els.aiInterval.value = state.settings.aiInterval;
    els.tempWarn.value = state.settings.tempWarn;
    els.tempBad.value = state.settings.tempBad;
    els.batteryWarn.value = state.settings.batteryWarn;
    els.batteryBad.value = state.settings.batteryBad;

    decoratePowerUnits();
    bindPowerSceneCamera();
    bindUpsStatusCards();
    renderTransformerButtons();
    renderDistributionMap();
    updateClock();
    renderAlarms();
    renderLogs();
    renderStdModels();
    syncZhihangRealtime();
    drawTrend();
    updateTopology();
    runAiInspection(false);
    setInterval(updateClock, 1000);
    setInterval(updateMetrics, 1000);
    aiTimer = state.settings.autoAi ? setInterval(() => runAiInspection(false), Math.max(3, state.settings.aiInterval) * 1000) : null;
    pushLog('info', '平台启动', 'UPS 监控管理平台已上线，开始实时采样。');
    window.selectUpsRoute = selectRoute;
    window.selectUpsDevice = showUpsStatus;
