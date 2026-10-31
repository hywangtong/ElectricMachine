import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parameters as p,
  characteristicParameters,
  speedAtTorque,
  operatingPoint,
  tabConfigs,
  brakingConfigs,
  fourQuadrantConfigs,
  brakingOperatingPoint,
  getBrakingCurveDefinitions,
} from '../public/dc-motor-four-quadrant-motoring-model.mjs';

const close = (a, b, eps = 1e-4) =>
  assert.ok(
    Math.abs(a - b) < eps,
    `${a} not close to ${b} (diff ${Math.abs(a - b)})`,
  );

await test('base parameters and inherent characteristics in Quadrant I & III', () => {
  close(p.n0N, 1100);
  close(p.kePhiN, 0.2);
  close(p.ktPhiN, 1.909859);
  close(p.betaN, 2.61799387799);

  // Inherent forward (Quadrant I)
  const fwd = characteristicParameters({ direction: 1 });
  close(fwd.n0, 1100);
  close(fwd.beta, p.betaN);
  const ptFwd = operatingPoint(40, { direction: 1 });
  assert.equal(ptFwd.quadrant, 'I');
  assert.equal(ptFwd.direction, 1);
  assert.ok(ptFwd.torque > 0);
  assert.ok(ptFwd.speed > 0);
  assert.ok(ptFwd.terminalVoltage > 0);
  assert.ok(ptFwd.current > 0);
  assert.ok(ptFwd.emf > 0);
  assert.ok(ptFwd.pElectrical > 0);
  assert.ok(ptFwd.pMechanical > 0);
  assert.equal(ptFwd.isMotoring, true);
  close(ptFwd.speed, 1100 - p.betaN * 40); // approx 995.28 r/min
  close(speedAtTorque(40, { direction: 1 }), ptFwd.speed);

  // Inherent reverse (Quadrant III)
  const rev = characteristicParameters({ direction: -1 });
  close(rev.n0, -1100);
  close(rev.beta, p.betaN);
  const ptRev = operatingPoint(40, { direction: -1 });
  assert.equal(ptRev.quadrant, 'III');
  assert.equal(ptRev.direction, -1);
  assert.ok(ptRev.torque < 0);
  assert.ok(ptRev.speed < 0);
  assert.ok(ptRev.terminalVoltage < 0);
  assert.ok(ptRev.current < 0);
  assert.ok(ptRev.emf < 0);
  assert.ok(
    ptRev.pElectrical > 0,
    'Reversed voltage and current still absorb electrical power',
  );
  assert.ok(
    ptRev.pMechanical > 0,
    'Negative torque and speed still produce positive mechanical power',
  );
  assert.equal(ptRev.isMotoring, true);
  close(ptRev.speed, -1100 + p.betaN * 40); // approx -995.28 r/min

  // Origin point symmetry
  close(ptFwd.speed, -ptRev.speed);
  close(ptFwd.torque, -ptRev.torque);
  close(ptFwd.pMechanical, ptRev.pMechanical);
});

await test('adding armature resistance Ra keeps intercept and increases slope', () => {
  const rExt = 2.0;
  const cfgFwd = tabConfigs.resistance.getConfig(rExt, 1);
  const paramsFwd = characteristicParameters(cfgFwd);
  close(paramsFwd.n0, 1100, 1e-4); // intercept unchanged
  assert.ok(paramsFwd.beta > p.betaN);
  close(paramsFwd.beta, p.betaN * (1 + rExt)); // 3 times steeper

  const cfgRev = tabConfigs.resistance.getConfig(rExt, -1);
  const paramsRev = characteristicParameters(cfgRev);
  close(paramsRev.n0, -1100, 1e-4); // reverse intercept unchanged
  assert.ok(paramsRev.beta > p.betaN);

  const ptFwd = operatingPoint(40, cfgFwd);
  const ptRev = operatingPoint(40, cfgRev);
  assert.equal(ptFwd.isMotoring, true);
  assert.equal(ptRev.isMotoring, true);
  // Speed drop is larger due to higher resistance
  assert.ok(ptFwd.speed < 1100 - p.betaN * 40);
  assert.ok(ptRev.speed > -1100 + p.betaN * 40); // closer to 0
});

await test('decreasing armature voltage Ua shifts curves parallel without changing slope', () => {
  const v = 140;
  const cfgFwd = tabConfigs.voltage.getConfig(v, 1);
  const paramsFwd = characteristicParameters(cfgFwd);
  close(paramsFwd.n0, 140 / 0.2); // 700 r/min < 1100
  close(paramsFwd.beta, p.betaN); // exactly parallel

  const cfgRev = tabConfigs.voltage.getConfig(v, -1);
  const paramsRev = characteristicParameters(cfgRev);
  close(paramsRev.n0, -140 / 0.2); // -700 r/min > -1100 (closer to 0)
  close(paramsRev.beta, p.betaN); // exactly parallel

  const ptFwd = operatingPoint(40, cfgFwd);
  const ptRev = operatingPoint(40, cfgRev);
  assert.equal(ptFwd.isMotoring, true);
  assert.equal(ptRev.isMotoring, true);
});

await test('field weakening If / flux raises ideal no-load speed and steepens slope', () => {
  const fluxRatio = 0.8;
  const cfgFwd = tabConfigs.field.getConfig(fluxRatio, 1);
  const paramsFwd = characteristicParameters(cfgFwd);
  assert.ok(paramsFwd.n0 > 1100);
  close(paramsFwd.n0, 220 / (0.2 * 0.8)); // 1375 r/min
  assert.ok(paramsFwd.beta > p.betaN);
  close(paramsFwd.beta, p.betaN / (fluxRatio * fluxRatio)); // beta proportional to 1/Phi^2

  const cfgRev = tabConfigs.field.getConfig(fluxRatio, -1);
  const paramsRev = characteristicParameters(cfgRev);
  assert.ok(paramsRev.n0 < -1100); // more negative (-1375 r/min)
  assert.ok(paramsRev.beta > p.betaN);

  const ptFwd = operatingPoint(40, cfgFwd);
  const ptRev = operatingPoint(40, cfgRev);
  assert.equal(ptFwd.isMotoring, true);
  assert.equal(ptRev.isMotoring, true);
});

await test('energy conservation Pa = Pmech + Pcu holds in both Quadrants I & III', () => {
  for (const dir of [1, -1]) {
    for (const key of ['natural', 'resistance', 'voltage', 'field']) {
      const tab = tabConfigs[key];
      const cfg = tab.getConfig(tab.defaultParam, dir);
      const pt = operatingPoint(40, cfg);
      const pCu = pt.current * pt.current * pt.resistance;
      const pTotal = pt.pMechanical + pCu;
      close(pt.pElectrical, pTotal, 1e-2);
      assert.equal(pt.isMotoring, true);
    }
  }
});

await test('braking state in Quadrant II & IV satisfies T*n < 0 and Pmech < 0', () => {
  // 1. Dynamic braking (能耗制动): Pa = 0, Pmech < 0
  const dynQ2 = brakingOperatingPoint('dynamic', 'II', { param: 4.0 });
  assert.equal(dynQ2.isBraking, true);
  assert.ok(dynQ2.torque < 0, 'Quadrant II dynamic torque < 0');
  assert.ok(dynQ2.speed > 0, 'Quadrant II dynamic speed > 0');
  close(dynQ2.terminalVoltage, 0);
  close(dynQ2.pElectrical, 0);
  assert.ok(dynQ2.pMechanical < 0);

  // Dynamic braking with specific loadTorque from slider:
  // Operating point in Quad II has speed equal to steady-state speed nA before braking on inherent curve,
  // and torque determined by the intersection of n = nA with the dynamic braking curve.
  const dynQ2Custom = brakingOperatingPoint('dynamic', 'II', {
    param: 4.0,
    loadTorque: 50,
  });
  const nA_expected = p.n0N - p.betaN * 50;
  const betaDyn_expected = (p.ra + 4.0) / (p.kePhiN * p.ktPhiN);
  close(dynQ2Custom.speed, nA_expected);
  close(dynQ2Custom.torque, -nA_expected / betaDyn_expected);
  close(dynQ2Custom.pointA.torque, 50);
  close(dynQ2Custom.pointA.speed, nA_expected);
  assert.ok(dynQ2Custom.torque < 0, 'Quadrant II dynamic torque < 0');
  assert.ok(dynQ2Custom.speed > 0, 'Quadrant II dynamic speed > 0');

  const dynQ4 = brakingOperatingPoint('dynamic', 'IV', { param: 4.0 });
  assert.equal(dynQ4.isBraking, true);
  assert.ok(dynQ4.torque > 0, 'Quadrant IV dynamic torque > 0');
  assert.ok(dynQ4.speed < 0, 'Quadrant IV dynamic speed < 0');
  close(dynQ4.terminalVoltage, 0);
  close(dynQ4.pElectrical, 0);
  assert.ok(dynQ4.pMechanical < 0);

  // 2. Reverse voltage plugging (电压反向反接制动, Quad II): Pa > 0, Pmech < 0
  const plugQ2 = brakingOperatingPoint('plugging', 'II', {
    param: 10.5,
    loadTorque: 40,
  });
  assert.equal(plugQ2.isBraking, true);
  assert.ok(plugQ2.torque < 0);
  close(plugQ2.speed, p.n0N - p.betaN * 40);
  assert.ok(
    plugQ2.pElectrical > 0,
    'Plugging absorbs electrical power from grid',
  );
  assert.ok(plugQ2.pMechanical < 0, 'Plugging absorbs mechanical power');

  // 3. Reverse EMF plugging (电动势反向反接制动, Quad IV): Pa > 0, Pmech < 0
  const plugQ4 = brakingOperatingPoint('plugging', 'IV', { param: 10.5 });
  assert.equal(plugQ4.isBraking, true);
  assert.ok(plugQ4.torque > 0);
  assert.ok(plugQ4.speed < 0);
  assert.ok(plugQ4.pElectrical > 0);
  assert.ok(plugQ4.pMechanical < 0);

  // 4. Forward regenerative braking (正向回馈制动, Quad II): Pa < 0, Pmech < 0
  const regenQ2 = brakingOperatingPoint('regenerative', 'II', { param: 1250 });
  assert.equal(regenQ2.isBraking, true);
  assert.ok(regenQ2.torque < 0);
  assert.ok(regenQ2.speed > p.n0N, 'Speed exceeds no-load speed in Quad II');
  assert.ok(
    regenQ2.pElectrical < 0,
    'Regenerative delivers power back to grid',
  );
  assert.ok(regenQ2.pMechanical < 0);

  // 5. Reverse regenerative braking (反向回馈制动, Quad IV): Pa < 0, Pmech < 0
  const regenQ4 = brakingOperatingPoint('regenerative', 'IV', { param: 1250 });
  assert.equal(regenQ4.isBraking, true);
  assert.ok(regenQ4.torque > 0);
  assert.ok(
    regenQ4.speed < -p.n0N,
    'Speed exceeds reverse no-load speed in Quad IV',
  );
  assert.ok(regenQ4.pElectrical < 0, 'Power fed back to grid');
  assert.ok(regenQ4.pMechanical < 0);
});

await test('braking curve definitions match textbook diagram and uploaded image', () => {
  assert.ok(brakingConfigs.all);
  assert.ok(brakingConfigs.dynamic);
  assert.ok(brakingConfigs.plugging);
  assert.ok(brakingConfigs.regenerative);

  const curves = getBrakingCurveDefinitions();
  assert.equal(curves.length, 6, 'Contains all 6 curves in the image');

  const names = curves.map((c) => c.name);
  assert.deepEqual(names, [
    '正向回馈制动',
    '能耗制动过程',
    '电压反向反接制动',
    '反向回馈制动',
    '能耗制动运行',
    '电动势反向反接制动',
  ]);

  // Check Quadrants
  const q2Curves = curves.filter((c) => c.quadrant === 'II');
  const q4Curves = curves.filter((c) => c.quadrant === 'IV');
  assert.equal(q2Curves.length, 3);
  assert.equal(q4Curves.length, 3);

  // Dynamic curves must pass through origin (0, 0)
  const dynProc = curves.find((c) => c.id === 'dynamic-process');
  const dynRun = curves.find((c) => c.id === 'dynamic-running');
  close(dynProc.start.torque, 0);
  close(dynProc.start.speed, 0);
  close(dynRun.start.torque, 0);
  close(dynRun.start.speed, 0);

  // Regenerative curves must start at (0, ±n0)
  const fwdReg = curves.find((c) => c.id === 'fwd-regenerative');
  const revReg = curves.find((c) => c.id === 'rev-regenerative');
  close(fwdReg.start.torque, 0);
  close(fwdReg.start.speed, 1100);
  close(revReg.start.torque, 0);
  close(revReg.start.speed, -1100);

  // Plugging curves must intersect the horizontal torque axis at speed = 0
  const vPlug = curves.find((c) => c.id === 'voltage-plugging');
  const emfPlug = curves.find((c) => c.id === 'emf-plugging');
  close(vPlug.start.speed, 0);
  assert.ok(
    vPlug.start.torque < 0,
    'Voltage plugging starts on negative T-axis',
  );
  close(emfPlug.start.speed, 0);
  assert.ok(emfPlug.start.torque > 0, 'EMF plugging starts on positive T-axis');
});

await test('four quadrant configurations and title validation', async () => {
  assert.ok(fourQuadrantConfigs.all);
  assert.ok(fourQuadrantConfigs.motoring);
  assert.ok(fourQuadrantConfigs.braking);
  assert.ok(fourQuadrantConfigs.compare);

  // Read HTML file to ensure page title does not contain '一、电动状态'
  const fs = await import('node:fs/promises');
  const htmlContent = await fs.readFile(
    new URL('../public/dc-motor-four-quadrant-motoring.html', import.meta.url),
    'utf-8',
  );
  assert.ok(
    !htmlContent.includes('8.5 他励电动机在四象限中的运行状态 · 一、电动状态'),
    'Page title must not contain 一、电动状态',
  );
  assert.ok(
    htmlContent.includes(
      '<h1 id="page-title">\n          8.5 他励电动机在四象限中的运行状态\n        </h1>',
    ) || htmlContent.includes('8.5 他励电动机在四象限中的运行状态'),
    'Page title must match 8.5 他励电动机在四象限中的运行状态',
  );
  assert.ok(
    htmlContent.includes('id="mode-tab-four-quadrant"'),
    'Contains four quadrant mode tab button',
  );
  assert.ok(
    htmlContent.includes('🌐 四象限'),
    'Contains button labeled 四象限',
  );

  // Validate mode tab button order: 1. motoring, 2. braking, 3. four-quadrant (排在第三)
  const idxMotoring = htmlContent.indexOf('id="mode-tab-motoring"');
  const idxBraking = htmlContent.indexOf('id="mode-tab-braking"');
  const idxFourQuadrant = htmlContent.indexOf('id="mode-tab-four-quadrant"');
  assert.ok(idxMotoring !== -1 && idxBraking !== -1 && idxFourQuadrant !== -1);
  assert.ok(
    idxMotoring < idxBraking && idxBraking < idxFourQuadrant,
    'Four quadrant button must be 3rd in mode switch group (motoring -> braking -> four-quadrant)',
  );

  // Validate default mode in HTML is braking active (默认进入制动状态/能耗制动)
  assert.ok(
    htmlContent.includes(
      'id="mode-tab-braking"\n            aria-selected="true"\n            class="mode-pill active"',
    ),
    'Mode tab braking is active by default in HTML',
  );

  // Validate default mode in JS defaults to braking
  const jsContent = await fs.readFile(
    new URL('../public/dc-motor-four-quadrant-motoring.js', import.meta.url),
    'utf-8',
  );
  assert.ok(
    jsContent.includes(
      "initialMode === 'motoring' || initialMode === 'four-quadrant'\n      ? initialMode\n      : 'braking'",
    ),
    'JS state defaults to braking mode',
  );
});

await test('resistive constant torque load curve and aligned rotor arrows validation', async () => {
  const fs = await import('node:fs/promises');
  const htmlContent = await fs.readFile(
    new URL('../public/dc-motor-four-quadrant-motoring.html', import.meta.url),
    'utf-8',
  );
  const jsContent = await fs.readFile(
    new URL('../public/dc-motor-four-quadrant-motoring.js', import.meta.url),
    'utf-8',
  );

  // Check SVG contains curves-load-group
  assert.ok(
    htmlContent.includes('id="curves-load-group"'),
    'HTML contains curves-load-group for resistive load curve',
  );

  // Check JS contains renderLoadCharacteristicCurve function and calls it in renderCurves
  assert.ok(
    jsContent.includes('renderLoadCharacteristicCurve()'),
    'JS calls renderLoadCharacteristicCurve in renderCurves',
  );
  assert.ok(
    jsContent.includes(
      "curvesLoadGroup: document.getElementById('curves-load-group')",
    ),
    'JS references curvesLoadGroup element',
  );
  assert.ok(
    jsContent.includes('+T_L 反抗性负载'),
    'JS contains resistive load curve positive label',
  );
  assert.ok(
    jsContent.includes('-T_L 反抗性负载'),
    'JS contains resistive load curve negative label',
  );
  assert.ok(
    jsContent.includes('+T_L 位能型负载'),
    'JS contains potential load curve label in braking state',
  );
  assert.ok(
    jsContent.includes('等速度虚线'),
    'JS draws constant-speed line in stopping braking quadrant',
  );

  // Check rotor alignment: arrows must be concentric with rotor center at x=70
  // Speed arrow top arc: (48, 21) -> (92, 21) with radius 34 centered at x=70
  assert.ok(
    jsContent.includes('M 48 21 A 34 34 0 0 1 92 21'),
    'CW speed arrow concentric with rotor at x=70',
  );
  assert.ok(
    jsContent.includes('M 92 21 A 34 34 0 0 0 48 21'),
    'CCW speed arrow concentric with rotor at x=70',
  );
  // Torque arrow bottom arc: (92, 73) -> (48, 73) with radius 34 centered at x=70
  assert.ok(
    jsContent.includes('M 92 73 A 34 34 0 0 1 48 73'),
    'CW torque arrow concentric with rotor at x=70',
  );
  assert.ok(
    jsContent.includes('M 48 73 A 34 34 0 0 0 92 73'),
    'CCW torque arrow concentric with rotor at x=70',
  );

  // Verify brakingOperatingPoint with custom loadTorque:
  // Speed equals nA before braking, torque equals intersection with braking curve
  const ptQ2_custom = brakingOperatingPoint('dynamic', 'II', {
    param: 4.0,
    loadTorque: 50,
  });
  const nA_custom = p.n0N - p.betaN * 50;
  const betaDyn = (p.ra + 4.0) / (p.kePhiN * p.ktPhiN);
  close(ptQ2_custom.speed, nA_custom);
  close(ptQ2_custom.torque, -nA_custom / betaDyn);
  close(ptQ2_custom.pointA.torque, 50);
  close(ptQ2_custom.pointA.speed, nA_custom);
});

await test('braking state uses potential load and stopping quadrant operating point is determined by equal-speed line from inherent characteristic', async () => {
  const fs = await import('node:fs/promises');
  const jsContent = await fs.readFile(
    new URL('../public/dc-motor-four-quadrant-motoring.js', import.meta.url),
    'utf-8',
  );

  // 1. In braking state, potential load is displayed instead of resistive load
  assert.ok(
    jsContent.includes("state.mode === 'braking'"),
    'Checks state.mode === braking for load curve selection',
  );
  assert.ok(
    jsContent.includes('+T_L 位能型负载'),
    'Contains potential load label: +T_L 位能型负载',
  );

  // 2. In stopping quadrant (Quadrant II), operating point is NOT set directly by load torque (-TL),
  // but rather by the intersection of potential load and inherent curve (pointA),
  // and a horizontal equal-speed line (等速度虚线) intersecting the braking curve.
  assert.ok(
    jsContent.includes('等速度虚线'),
    'Contains horizontal equal-speed line for stopping braking',
  );
  assert.ok(
    jsContent.includes('ptQ2.pointA'),
    'References inherent curve intersection point A in braking points',
  );
  assert.ok(
    jsContent.includes('正向固有特性（制动前基准）'),
    'Draws forward inherent characteristic in Quadrant I as base reference when observing stopping braking',
  );

  // 3. Mathematical validation of dynamic braking in stopping quadrant
  const tl = 40;
  const ptDynQ2 = brakingOperatingPoint('dynamic', 'II', {
    param: 4.0,
    loadTorque: tl,
  });
  const nA = p.n0N - p.betaN * tl;
  const betaDyn = (p.ra + 4.0) / (p.kePhiN * p.ktPhiN);
  close(ptDynQ2.pointA.torque, tl);
  close(ptDynQ2.pointA.speed, nA);
  close(ptDynQ2.speed, nA); // Speed does not drop instantaneously at t = 0+
  close(ptDynQ2.torque, -nA / betaDyn); // Intersects dynamic braking curve
  assert.ok(
    ptDynQ2.torque < -tl,
    'Initial braking torque magnitude is larger than load torque',
  );

  // 4. Mathematical validation of reverse voltage plugging in stopping quadrant
  const ptPlugQ2 = brakingOperatingPoint('plugging', 'II', {
    param: 10.5,
    loadTorque: tl,
  });
  const betaPlug = (p.ra + 10.5) / (p.kePhiN * p.ktPhiN);
  close(ptPlugQ2.pointA.torque, tl);
  close(ptPlugQ2.pointA.speed, nA);
  close(ptPlugQ2.speed, nA);
  close(ptPlugQ2.torque, -(p.n0N + nA) / betaPlug);
  assert.ok(
    ptPlugQ2.torque < 0,
    'Plugging braking torque in Quadrant II is negative',
  );

  // 5. Mathematical validation of lowering in Quadrant IV
  const ptDynQ4 = brakingOperatingPoint('dynamic', 'IV', {
    param: 4.0,
    loadTorque: tl,
  });
  close(ptDynQ4.torque, tl); // Balances potential load
  close(ptDynQ4.speed, -betaDyn * tl); // Negative speed in Quadrant IV
  assert.ok(ptDynQ4.speed < 0);
});

await test('braking mode relies on 附图全貌 subtab and removes redundant 叠加全部制动 button', async () => {
  const fs = await import('node:fs/promises');
  const jsContent = await fs.readFile(
    'public/dc-motor-four-quadrant-motoring.js',
    'utf-8',
  );
  const htmlContent = await fs.readFile(
    'public/dc-motor-four-quadrant-motoring.html',
    'utf-8',
  );

  // 1. In braking mode, el.btnShowAll is hidden to avoid duplicate with 附图全貌
  assert.ok(
    jsContent.includes("el.btnShowAll.style.display = 'none';"),
    'btnShowAll is hidden in braking mode',
  );

  // 2. Button text "叠加全部制动" is removed
  assert.equal(
    jsContent.includes("el.btnShowAll.textContent = '👁 叠加全部制动'"),
    false,
    'Redundant "叠加全部制动" button text is removed',
  );

  // 3. 附图全貌 subtab exists and is placed fourth in brakingConfigs and HTML subtabs
  const brakingKeys = Object.keys(brakingConfigs);
  assert.equal(brakingKeys[0], 'dynamic', 'dynamic braking is first');
  assert.equal(brakingKeys[1], 'plugging', 'plugging braking is second');
  assert.equal(brakingKeys[2], 'regenerative', 'regenerative braking is third');
  assert.equal(brakingKeys[3], 'all', '附图全貌 is placed fourth');
  assert.equal(brakingConfigs.all.shortName, '附图全貌');

  // 4. Default state enters dynamic braking
  assert.ok(
    jsContent.includes("activeBrakingTab: 'dynamic'"),
    'activeBrakingTab defaults to dynamic',
  );

  // 5. HTML button subtab order: dynamic is first and active, all is fourth
  const brakingSubtabsHtml = htmlContent.slice(
    htmlContent.indexOf('id="braking-subtabs"'),
    htmlContent.indexOf('id="four-quadrant-subtabs"'),
  );
  const dynIndex = brakingSubtabsHtml.indexOf('data-tab="dynamic"');
  const plugIndex = brakingSubtabsHtml.indexOf('data-tab="plugging"');
  const regenIndex = brakingSubtabsHtml.indexOf('data-tab="regenerative"');
  const allIndex = brakingSubtabsHtml.indexOf('data-tab="all"');
  assert.ok(dynIndex < plugIndex, 'dynamic before plugging');
  assert.ok(plugIndex < regenIndex, 'plugging before regenerative');
  assert.ok(regenIndex < allIndex, 'regenerative before all (附图全貌 is fourth)');
  assert.ok(
    brakingSubtabsHtml.includes('<b>04</b> 附图全貌'),
    '附图全貌 labeled as 04',
  );
});

await test('equations are rendered as HTML and eliminate raw LaTeX syntax', () => {
  // Regenerative braking formula must have clean HTML with no unparsed LaTeX tokens
  const regen = brakingConfigs.regenerative;
  assert.ok(regen.formulaHtml, 'formulaHtml exists for regenerative braking');
  assert.ok(
    !regen.formulaHtml.includes('\\frac'),
    'formulaHtml does not contain raw \\frac',
  );
  assert.ok(
    !regen.formulaHtml.includes('\\pm'),
    'formulaHtml does not contain raw \\pm',
  );
  assert.ok(
    !regen.formulaHtml.includes('\\Phi_N'),
    'formulaHtml does not contain raw \\Phi_N',
  );
  assert.ok(
    !regen.formulaHtml.includes('\\quad'),
    'formulaHtml does not contain raw \\quad',
  );
  assert.ok(
    regen.formulaHtml.includes('class="fraction"'),
    'formulaHtml renders fractions with .fraction span',
  );
  assert.ok(
    regen.formulaHtml.includes('<i>U</i><sub>a</sub>'),
    'formulaHtml renders subscript variables',
  );

  // All braking and motoring configs have formulaHtml defined
  Object.values(brakingConfigs).forEach((cfg) => {
    assert.ok(cfg.formulaHtml, `${cfg.id} has formulaHtml`);
    assert.ok(
      !cfg.formulaHtml.includes('\\frac'),
      `${cfg.id} formulaHtml does not leak \\frac`,
    );
  });
});
