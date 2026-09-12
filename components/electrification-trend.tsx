function CombustionEngine() {
  return (
    <svg viewBox="0 0 160 110" aria-label="内燃机示意图">
      <path className="sketch-fill" d="M24 34h77v56H24z" />
      <path className="sketch-line" d="M24 34h77v56H24zM101 47h18v31h-18" />
      <path className="sketch-line" d="M40 34V20h28v14M49 20V9h46l12 12" />
      <circle className="sketch-fill" cx="43" cy="90" r="12" />
      <circle className="sketch-fill" cx="84" cy="90" r="12" />
      <path
        className="sketch-accent"
        d="M129 43c12-8 21-1 18 8 12 3 12 16 1 19"
      />
      <path className="sketch-accent" d="M136 28c7-5 13-1 11 6" />
      <path className="sketch-detail" d="M41 50h43M41 63h28" />
    </svg>
  );
}

function HydraulicDrive() {
  return (
    <svg viewBox="0 0 160 110" aria-label="液压传动示意图">
      <rect
        className="sketch-fill"
        x="18"
        y="34"
        width="86"
        height="45"
        rx="8"
      />
      <path className="sketch-line" d="M104 47h36v20h-36M123 47v20" />
      <path
        className="sketch-detail"
        d="M33 34V20h25M33 79v14h25M58 20v15M58 78v15"
      />
      <path className="sketch-accent" d="M46 48c-12 14-9 24 0 24s12-10 0-24Z" />
      <path className="sketch-line" d="M72 56h19" />
      <path className="sketch-arrow" d="m86 51 7 5-7 5" />
    </svg>
  );
}

function PneumaticDrive() {
  return (
    <svg viewBox="0 0 160 110" aria-label="气动传动示意图">
      <rect
        className="sketch-fill"
        x="23"
        y="35"
        width="74"
        height="43"
        rx="21"
      />
      <path className="sketch-line" d="M97 47h38v19H97M116 47v19" />
      <path className="sketch-detail" d="M35 35V22h15M35 78v12h15" />
      <path
        className="sketch-accent"
        d="M42 54c11-8 21-8 32 0M46 65c8-5 16-5 24 0"
      />
      <path className="sketch-arrow" d="m70 49 7 5-8 4" />
    </svg>
  );
}

function ElectricMotor() {
  return (
    <svg viewBox="0 0 210 150" aria-label="电机示意图">
      <rect
        className="motor-shell"
        x="35"
        y="39"
        width="111"
        height="76"
        rx="18"
      />
      <path className="motor-line" d="M146 55h24v44h-24M170 66h22v22h-22" />
      <path className="motor-line" d="M35 54H21v46h14M57 39V25h67v14" />
      <circle className="motor-ring" cx="91" cy="77" r="25" />
      <path className="motor-bolt" d="m95 48-23 32h18l-8 29 27-37H91Z" />
      <path className="motor-speed" d="M18 121h52M8 134h78M126 129h50" />
    </svg>
  );
}

function ElectricCar() {
  return (
    <svg viewBox="0 0 260 145" aria-label="新能源汽车示意图">
      <path className="future-fill" d="m43 89 25-42h113l36 42 19 6v20H25V97Z" />
      <path className="future-line" d="m68 47 27 42m86-42-8 42M43 89h174" />
      <path className="future-window" d="m78 57 18 30h67l7-30Z" />
      <circle className="future-wheel" cx="70" cy="115" r="17" />
      <circle className="future-wheel" cx="197" cy="115" r="17" />
      <path className="future-bolt" d="m135 91-16 14h13l-6 19 19-23h-13Z" />
    </svg>
  );
}

function Evtol() {
  return (
    <svg viewBox="0 0 260 145" aria-label="多电飞机 eVTOL 示意图">
      <path className="future-fill" d="M101 66h59l21 21-22 18h-61L78 87Z" />
      <path
        className="future-line"
        d="M109 66 95 35h70l-14 31M105 104l-18 23h83l-16-23"
      />
      <path
        className="future-line"
        d="M78 78H31M181 78h48M54 78v20m151-20v20"
      />
      <ellipse className="future-rotor" cx="54" cy="70" rx="42" ry="8" />
      <ellipse className="future-rotor" cx="205" cy="70" rx="42" ry="8" />
      <circle className="future-hub" cx="54" cy="70" r="6" />
      <circle className="future-hub" cx="205" cy="70" r="6" />
      <path className="future-window" d="m116 74-13 12h49l-13-12Z" />
    </svg>
  );
}

function ShipPod() {
  return (
    <svg viewBox="0 0 260 145" aria-label="轮船电气推进吊舱示意图">
      <path className="future-fill" d="M24 49h192l-25 51H57Z" />
      <path className="future-line" d="M70 49V26h89v23M93 26V14h39v12" />
      <path
        className="future-wave"
        d="M26 112c17-11 32 11 49 0s32 11 49 0 32 11 49 0 32 11 49 0"
      />
      <path className="future-line" d="M135 99v17c0 10 8 18 18 18h25" />
      <ellipse className="future-pod" cx="196" cy="128" rx="27" ry="11" />
      <path className="future-line" d="M223 128h16" />
      <path
        className="future-prop"
        d="M240 128c13-18 15 1 0 0m0 0c13 18 15-1 0 0"
      />
    </svg>
  );
}

const legacyDrives = [
  { name: '内燃机', detail: '燃烧 → 转动', Graphic: CombustionEngine },
  { name: '液压', detail: '油压 → 推动', Graphic: HydraulicDrive },
  { name: '气动', detail: '气压 → 推动', Graphic: PneumaticDrive },
];

const electricFields = [
  { name: '新能源汽车', detail: '车轮由电机驱动', Graphic: ElectricCar },
  { name: '多电飞机 · eVTOL', detail: '旋翼由电机驱动', Graphic: Evtol },
  { name: '轮船电气推进吊舱', detail: '螺旋桨由电机驱动', Graphic: ShipPod },
];

export function ElectrificationTrend() {
  return (
    <div className="trend-body">
      <div className="eyebrow">
        <span />
        ELECTRIFICATION <b>电动化浪潮</b>
      </div>
      <div className="trend-heading">
        <h1>
          电机正在<span>加速进入</span>更多动力领域
        </h1>
        <p>同一件事：更高效、更安静、更容易精确控制</p>
      </div>
      <div className="trend-story">
        <section className="legacy-panel" aria-label="传统动力与传动方式">
          <header>
            <span>过去常见</span>
            <strong>传统动力方式</strong>
          </header>
          <div className="legacy-grid">
            {legacyDrives.map(({ name, detail, Graphic }) => (
              <div className="legacy-item" key={name}>
                <Graphic />
                <div>
                  <strong>{name}</strong>
                  <span>{detail}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="trend-bridge" aria-label="电机正在加速替代传统动力方式">
          <div className="speed-arrow" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="motor-badge">
            <ElectricMotor />
            <strong>电机</strong>
            <span>电能 → 运动</span>
          </div>
          <div className="acceleration-label">
            <b>加速替代</b>
            <span>FASTER &amp; FASTER</span>
          </div>
        </div>

        <section className="future-panel" aria-label="正在快速电动化的领域">
          <header>
            <span>现在与未来</span>
            <strong>快速电动化</strong>
          </header>
          <div className="future-grid">
            {electricFields.map(({ name, detail, Graphic }, index) => (
              <div className="future-item" key={name}>
                <span className="future-number">0{index + 1}</span>
                <Graphic />
                <strong>{name}</strong>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="trend-takeaway">
        <span>一台车</span>
        <i>→</i>
        <span>一架飞机</span>
        <i>→</i>
        <span>一艘巨轮</span>
        <strong>电机，把电变成无处不在的运动</strong>
      </div>
    </div>
  );
}
