# 4极 / 8槽 / 8片 / 8复合线圈 有刷直流电枢方案
## 非退化 Frog-Leg + Simplex Progressive Lap 可重构设计

> **用途定位**：本方案用于小型原理样机、绕组拓扑验证和 Frog-Leg / Simplex 对比实验。  
> **重要限制**：8 槽、8 换向片对于 4 极直流电机属于非常低的槽数/片数，换向纹波、转矩脉动和片间电压压力都会比工程化高槽数设计明显。因此本方案强调“拓扑正确、容易验证”，不应未经进一步电磁/热/换向设计直接作为高速或大功率量产方案。

---

## 1. 设计目标

要求同一转子机械结构满足：

- 4 极；
- 8 个电枢槽；
- 8 片换向器；
- 8 个**复合 Frog-Leg 线圈**；
- Frog-Leg 模式必须是**非退化**：
  - Lap 部分：simplex progressive lap；
  - Wave 部分：duplex retrogressive wave；
- 能改接为普通 Simplex progressive lap；
- 尽量让两种模式共用同一套铜线和槽内结构，便于实验比较。

本方案采用 EASA 对 Frog-Leg 的基本规则：

1. Frog-Leg = Lap winding + Wave winding；
2. Lap 与 Wave 部分必须具有相同并联支路数；
3. 4 极 simplex lap 有 4 条并联支路，因此 Wave 必须为 **duplex wave**，也有 4 条并联支路；
4. Lap 与 Wave section 使用相同线径、相同匝数；
5. 通常采用 **Lap progressive + Wave retrogressive**；
6. 当 `slots / poles` 为整数时，Lap 和 Wave 可以采用相同线圈跨距。

---

## 2. 基本参数

| 参数 | 符号 | 数值 |
|---|---:|---:|
| 极数 | \(P\) | 4 |
| 极对数 | \(p=P/2\) | 2 |
| 槽数 | \(S\) | 8 |
| 换向片数 | \(K\) | 8 |
| 复合线圈数 | \(F\) | 8 |
| Lap sections |  | 8 |
| Wave sections |  | 8 |
| 总独立 winding sections |  | 16 |
| 每极槽数 | \(S/P\) | 2 |
| 整距线圈跨距 |  | 2 槽 |
| Lap multiplicity |  | simplex = 1 |
| Wave multiplicity | \(m_W\) | duplex = 2 |
| Lap 并联支路 | \(A_L\) | 4 |
| Wave 并联支路 | \(A_W\) | 4 |
| Frog-Leg 总导电支路数（按两组绕组计） |  | 8 |

槽间机械角：

\[
360^\circ/8=45^\circ
\]

极距：

\[
360^\circ/4=90^\circ=2\text{槽}
\]

所以 Lap 与 Wave 的有效线圈跨距均取：

\[
\boxed{Y_s=2\text{槽}}
\]

---

## 3. 换向器节距校核

### 3.1 Simplex Lap

Simplex progressive lap：

\[
\boxed{Y_{cL}=+1}
\]

即 Lap section 的两端接相邻换向片。

### 3.2 Duplex Wave

4 极 Frog-Leg 为了使 Wave 与 Lap 都具有 4 条并联支路：

\[
m_W=P/2=2
\]

采用 retrogressive wave：

\[
Y_{cW}
=
\frac{K-m_W}{P/2}
=
\frac{8-2}{2}
=
\boxed{3}
\]

因此：

\[
\boxed{Y_{cW}=3\neq1}
\]

这已经不是 2 极方案中 \(+1/-1\) 的退化情况。

> **编号方向说明**：本文把换向片 C1→C2→…→C8 定义为正编号方向。  
> Wave 使用 EASA 公式中的“减 plex”得到 3，因此属于 **retrogressive duplex wave**。在编号表里会表现为 `Cj → C(j+3)`；不要因为数字上是 “+3” 就把它误叫 progressive。

---

# 4. 编号约定

从**换向器端看转子**：

- 槽按圆周依次编号：`S1 ... S8`
- 换向片按同一参考方向编号：`C1 ... C8`
- 所有编号均按 **mod 8** 循环：
  - `S9 = S1`
  - `C9 = C1`
  - `C0 = C8`

定义：

- `Lx-S`：Lap section Lx 的起头；
- `Lx-F`：Lap section Lx 的尾端；
- `Wx-S`：Wave section Wx 的起头；
- `Wx-F`：Wave section Wx 的尾端；
- `Fx`：第 x 个物理复合线圈。

所有 L/W section：

- 匝数均为 `N`；
- 线径相同；
- 同一复合线圈内 Lap 与 Wave section **物理绕向相同**；
- 在同一槽对中具有相同感应电势极性。

---

# 5. 最关键的物理配对：不要使用 `Fx=Lx+Wx`

为了得到真正的 Frog-Leg 自均压关系，Wave section 必须相对 Lap section 错开一个编号。

采用：

\[
\boxed{F_x=L_x+W_{x-1}}
\]

其中编号按 mod 8。

因此实际 8 个复合线圈是：

| 复合线圈 | Lap section | Wave section | 共同槽跨距 |
|---|---|---|---|
| F1 | L1 | W8 | S1 → S3 |
| F2 | L2 | W1 | S2 → S4 |
| F3 | L3 | W2 | S3 → S5 |
| F4 | L4 | W3 | S4 → S6 |
| F5 | L5 | W4 | S5 → S7 |
| F6 | L6 | W5 | S6 → S8 |
| F7 | L7 | W6 | S7 → S1 |
| F8 | L8 | W7 | S8 → S2 |

即：

```text
F1 = [ L1 || W8 ] : S1 —— S3
F2 = [ L2 || W1 ] : S2 —— S4
F3 = [ L3 || W2 ] : S3 —— S5
F4 = [ L4 || W3 ] : S4 —— S6
F5 = [ L5 || W4 ] : S5 —— S7
F6 = [ L6 || W5 ] : S6 —— S8
F7 = [ L7 || W6 ] : S7 —— S1
F8 = [ L8 || W7 ] : S8 —— S2
```

这里的 `||` 仅表示“物理上组成一个复合线圈并占用相同槽对”，**不是说在 Frog-Leg 模式下电气并联**。

---

# 6. 槽内排布

标准普通双层电枢每槽通常只有两个有效 coil sides；Frog-Leg 每槽实际上需要 **4 个电气 coil sides**。

对于本方案，可以把机械槽理解成：

- 上部复合层：一个 Lap side + 一个 Wave side；
- 下部复合层：另一个 Lap side + 一个 Wave side。

一种明确的电气排布为：

| 槽 | 上部复合层 | 下部复合层 |
|---|---|---|
| S1 | L1 + W8 | L7 + W6 |
| S2 | L2 + W1 | L8 + W7 |
| S3 | L3 + W2 | L1 + W8 |
| S4 | L4 + W3 | L2 + W1 |
| S5 | L5 + W4 | L3 + W2 |
| S6 | L6 + W5 | L4 + W3 |
| S7 | L7 + W6 | L5 + W4 |
| S8 | L8 + W7 | L6 + W5 |

推荐在一个复合层内部仍对 Lap 与 Wave 加独立层间绝缘。

如果槽深允许，可采用类似：

```text
槽口
 ┌───────────┐
 │ Wave 上边 │
 │ Lap  上边 │
 │-----------│
 │ Wave 下边 │
 │ Lap  下边 │
 └───────────┘
槽底
```

实际径向先后顺序可根据端部成形和绝缘工艺调整，但必须满足：

- Lap 与 Wave 不能因为“同一复合线圈”而裸铜直接接触；
- 所有 16 个 section 在接线前均保持独立可测；
- 端部绑扎必须承受转速产生的离心力。

---

# 7. Lap section 固定接法

Lap 部分在 **Frog-Leg 模式和 Simplex 模式中都不需要改变**。

统一连接：

\[
\boxed{L_x:\ C_x\rightarrow C_{x+1}}
\]

具体：

| Lap | 槽跨距 | 起头 | 尾端 |
|---|---|---|---|
| L1 | S1–S3 | C1 | C2 |
| L2 | S2–S4 | C2 | C3 |
| L3 | S3–S5 | C3 | C4 |
| L4 | S4–S6 | C4 | C5 |
| L5 | S5–S7 | C5 | C6 |
| L6 | S6–S8 | C6 | C7 |
| L7 | S7–S1 | C7 | C8 |
| L8 | S8–S2 | C8 | C1 |

Lap tracing：

```text
C1 -L1- C2 -L2- C3 -L3- C4 -L4- C5
   -L5- C6 -L6- C7 -L7- C8 -L8- C1
```

---

# 8. Frog-Leg 模式：Wave 具体接法

Wave 采用 duplex retrogressive，换向器节距：

\[
Y_{cW}=3
\]

因此定义：

\[
\boxed{W_j:\ C_j\rightarrow C_{j+3}}
\]

同时 Wj 的**物理位置**并不是 Sj–S(j+2)，而是：

\[
\boxed{W_j:\ S_{j+1}\rightarrow S_{j+3}}
\]

因为它属于复合线圈：

\[
F_{j+1}=L_{j+1}+W_j
\]

完整表：

| Wave | 所属复合线圈 | 物理槽跨距 | Frog-Leg 起头 | Frog-Leg 尾端 |
|---|---|---|---|---|
| W1 | F2 | S2–S4 | C1 | C4 |
| W2 | F3 | S3–S5 | C2 | C5 |
| W3 | F4 | S4–S6 | C3 | C6 |
| W4 | F5 | S5–S7 | C4 | C7 |
| W5 | F6 | S6–S8 | C5 | C8 |
| W6 | F7 | S7–S1 | C6 | C1 |
| W7 | F8 | S8–S2 | C7 | C2 |
| W8 | F1 | S1–S3 | C8 | C3 |

Wave tracing：

```text
C1 → C4 → C7 → C2 → C5 → C8 → C3 → C6 → C1
```

对应 section：

```text
C1 -W1- C4 -W4- C7 -W7- C2 -W2-
C5 -W5- C8 -W8- C3 -W3- C6 -W6- C1
```

---

# 9. Frog-Leg 模式：每片换向片最终焊线表

在 Frog-Leg 模式，每个换向片应有：

- 2 个 Lap leads；
- 2 个 Wave leads；

共 4 个 section leads。

| 换向片 | Lap leads | Wave leads | 总计 |
|---|---|---|---:|
| C1 | L1-S + L8-F | W1-S + W6-F | 4 |
| C2 | L2-S + L1-F | W2-S + W7-F | 4 |
| C3 | L3-S + L2-F | W3-S + W8-F | 4 |
| C4 | L4-S + L3-F | W4-S + W1-F | 4 |
| C5 | L5-S + L4-F | W5-S + W2-F | 4 |
| C6 | L6-S + L5-F | W6-S + W3-F | 4 |
| C7 | L7-S + L6-F | W7-S + W4-F | 4 |
| C8 | L8-S + L7-F | W8-S + W5-F | 4 |

---

# 10. 为什么这是真正的 Frog-Leg：自均压关系验证

4 极、8 片时，两极距在换向器上对应：

\[
\frac{K}{P/2}
=
\frac{8}{2}
=
\boxed{4\text{片}}
\]

因此理论等电位换向片对为：

```text
C1 ↔ C5
C2 ↔ C6
C3 ↔ C7
C4 ↔ C8
```

检查任意 Wave + Lap 串联组合。

例如：

```text
W1 : C1 → C4
L4 : C4 → C5
```

所以：

```text
C1 ── W1 ── C4 ── L4 ── C5
```

正好跨：

\[
C1\rightarrow C5=4\text{片}=2\text{极距}
\]

而在空间上：

```text
W1 : S2 → S4
L4 : S4 → S6
```

它们：

- 共享 S4；
- 另外两个 coil sides 位于 S2 与 S6；
- S2 与 S6 相差 4 槽，也就是两极距。

因此 W1 与 L4 的感应电势大小相等、方向相反，其串联组合近似为一个天然 equalizer。

完整的 8 组关系：

| Wave + Lap 串联对 | 换向片等电位连接 | 共享槽 |
|---|---|---|
| W1 + L4 | C1 ↔ C5 | S4 |
| W2 + L5 | C2 ↔ C6 | S5 |
| W3 + L6 | C3 ↔ C7 | S6 |
| W4 + L7 | C4 ↔ C8 | S7 |
| W5 + L8 | C5 ↔ C1 | S8 |
| W6 + L1 | C6 ↔ C2 | S1 |
| W7 + L2 | C7 ↔ C3 | S2 |
| W8 + L3 | C8 ↔ C4 | S3 |

这正是本方案中 Wave 相对 Lap **错开一个编号**的原因。

---

# 11. 电刷配置

4 极设计建议使用 4 个刷臂，圆周机械间隔约：

\[
360^\circ/4=90^\circ
\]

在本文的一个参考相位中，可取：

```text
B+ : C1、C5
B- : C3、C7
```

即：

```text
C1 (+)
C3 (-)
C5 (+)
C7 (-)
```

两只正刷并接，两只负刷并接。

> 换向片编号只是拓扑参考。实际刷架必须整体旋转到磁中性轴附近，不能机械地认为“刷子永远正对 C1/C3/C5/C7 中心”就是正确位置。最终位置以低火花、低环流和换向测试结果为准。

---

# 12. Frog-Leg 的 8 条电流支路校核

以：

- 正刷：C1、C5
- 负刷：C3、C7

为例。

## 12.1 Lap 的 4 条支路

```text
C1 → L1 → C2 → L2 → C3
C1 → L8(reverse) → C8 → L7(reverse) → C7

C5 → L4(reverse) → C4 → L3(reverse) → C3
C5 → L5 → C6 → L6 → C7
```

每支路均为 2 个 Lap coils。

## 12.2 Wave 的 4 条支路

```text
C1 → W1 → C4 → W4 → C7
C1 → W6(reverse) → C6 → W3(reverse) → C3

C5 → W5 → C8 → W8 → C3
C5 → W2(reverse) → C2 → W7(reverse) → C7
```

每支路均为 2 个 Wave coils。

因此：

\[
A_L=4,\qquad A_W=4
\]

并且每个 Lap/Wave branch 都包含 2 个等匝 section，因此两部分的 branch EMF 可以匹配。

---

# 13. Simplex 模式有两种实现

## 13.1 Simplex-A：严格的“单套普通 simplex lap”

最纯粹的普通 simplex progressive lap：

- 仅 L1...L8 接换向器；
- W1...W8 全部悬空并分别绝缘；
- Lap 连接保持第 7 节的 `Cx → C(x+1)`。

优点：

- 拓扑最标准；
- 最适合作为教科书式 simplex lap 参考。

缺点：

- 只有一半铜线参与工作；
- 与 Frog-Leg 比较时，总铜截面积和损耗条件不完全公平。

---

## 13.2 Simplex-B：推荐的“全铜利用 simplex”

为了让同一个样机在 Simplex 模式也使用全部铜，可以把每个复合线圈的两个 section **同相并联**。

因为：

```text
F1 = L1 + W8  （都在 S1–S3）
F2 = L2 + W1  （都在 S2–S4）
...
```

它们具有相同槽位置、相同匝数、相同线径和相同绕向，所以可作为两根并绕支路。

Simplex-B 连接规则：

\[
\boxed{W_j:\ C_{j+1}\rightarrow C_{j+2}}
\]

此时：

```text
L1 || W8 : C1 → C2
L2 || W1 : C2 → C3
L3 || W2 : C3 → C4
L4 || W3 : C4 → C5
L5 || W4 : C5 → C6
L6 || W5 : C6 → C7
L7 || W6 : C7 → C8
L8 || W7 : C8 → C1
```

外部拓扑仍是：

\[
\boxed{\text{simplex progressive lap}}
\]

只是每个线圈位置由两根完全相同的 section 并联，等效铜截面积加倍。

### Simplex-B 每片换向片焊线表

| 换向片 | Lap leads | Wave leads（改接后） |
|---|---|---|
| C1 | L1-S + L8-F | W8-S + W7-F |
| C2 | L2-S + L1-F | W1-S + W8-F |
| C3 | L3-S + L2-F | W2-S + W1-F |
| C4 | L4-S + L3-F | W3-S + W2-F |
| C5 | L5-S + L4-F | W4-S + W3-F |
| C6 | L6-S + L5-F | W5-S + W4-F |
| C7 | L7-S + L6-F | W6-S + W5-F |
| C8 | L8-S + L7-F | W7-S + W6-F |

---

# 14. Frog-Leg ↔ Simplex-B 改接表

Lap 连接永久不动。

只改 Wave 的 16 个端头即可。

| Wave | 物理槽 | Frog-Leg 模式 | Simplex-B 模式 |
|---|---|---|---|
| W1 | S2–S4 | C1 → C4 | C2 → C3 |
| W2 | S3–S5 | C2 → C5 | C3 → C4 |
| W3 | S4–S6 | C3 → C6 | C4 → C5 |
| W4 | S5–S7 | C4 → C7 | C5 → C6 |
| W5 | S6–S8 | C5 → C8 | C6 → C7 |
| W6 | S7–S1 | C6 → C1 | C7 → C8 |
| W7 | S8–S2 | C7 → C2 | C8 → C1 |
| W8 | S1–S3 | C8 → C3 | C1 → C2 |

推荐在转子换向器端增加一个**机械可靠的可改接焊盘/桥接环**：

- 8 个 Lap section 可永久焊接；
- 16 个 Wave leads 独立引到编号焊盘；
- 通过可拆焊铜桥选择 Frog-Leg 或 Simplex-B；
- 任何改接必须在**停机、断电、转子静止**时进行；
- 焊盘、桥片和线头必须做离心力固定和动平衡校正。

不要尝试在旋转中用普通小型开关切换这些连接。

---

# 15. 复合线圈实际制作表

每个 F 线圈均做两个彼此绝缘的 winding sections：

- 一个 Lap section；
- 一个 Wave section；
- 两者相同匝数 `N`；
- 相同导线截面积；
- 相同物理绕向；
- 四个端头分别标识。

| 复合线圈 | 端头标记 |
|---|---|
| F1 | L1-S, L1-F, W8-S, W8-F |
| F2 | L2-S, L2-F, W1-S, W1-F |
| F3 | L3-S, L3-F, W2-S, W2-F |
| F4 | L4-S, L4-F, W3-S, W3-F |
| F5 | L5-S, L5-F, W4-S, W4-F |
| F6 | L6-S, L6-F, W5-S, W5-F |
| F7 | L7-S, L7-F, W6-S, W6-F |
| F8 | L8-S, L8-F, W7-S, W7-F |

**不要在绕线时把同一 F 内的 L/W 两个 section 直接串联或并联。**

先保持 16 个 section 全部独立，最后在换向器端按工作模式连接。

---

# 16. 线圈极性检查

这是实际制作中最容易造成严重错误的一步。

在永久焊接前，对每个复合线圈检查：

\[
E(L_x)\approx E(W_{x-1})
\]

并且同一参考端定义下极性相同。

例如 F2：

```text
L2 : S2–S4
W1 : S2–S4
```

以低速旋转转子或使用低压脉冲/磁极性测试方法，确认：

```text
L2-S 与 W1-S 为同名端
L2-F 与 W1-F 为同名端
```

在 Simplex-B 模式直接并联前尤其必须确认：

\[
V_{L2}-V_{W1}\approx0
\]

如果两者电势方向相反而直接并联，会形成只受铜阻限制的巨大环流。

---

# 17. 电势公式和匝数关系

每一套 Lap 或 Wave 绕组都有：

- 8 个 section；
- 每 section `N` 匝；
- 每匝 2 个有效导体；

所以单独一套绕组的总有效导体数：

\[
Z=8\times2N=16N
\]

对于 4 极、4 并联支路：

\[
E=
\frac{P\Phi Zn}{60A}
\]

代入：

\[
E
=
\frac{4\Phi(16N)n}{60\times4}
=
\boxed{\frac{4\Phi Nn}{15}}
\]

因此如果目标反电势为 \(E\)：

\[
\boxed{N=\frac{15E}{4\Phi n}}
\]

其中：

- \(E\)：电枢反电势，V；
- \(\Phi\)：每极磁通，Wb；
- \(n\)：转速，rpm；
- \(N\)：每个 Lap 或 Wave section 的匝数。

> 只有在已知磁钢/励磁、电枢尺寸、气隙、工作转速和目标电压后，才能正式确定 `N` 和线径。

---

# 18. 定子磁极布置

四极磁场必须沿圆周：

```text
N → S → N → S
```

相邻磁极中心相差：

\[
90^\circ\text{ mechanical}
\]

8 槽时，每槽：

\[
45^\circ\text{ mechanical}
\]

为了让本方案的连续两只 Lap coils 大致处在同一极区，可把磁极中心的参考相位设计在相邻槽中心之间；最终仍需结合实际极弧、气隙磁密和刷架位置做电磁校准。

---

# 19. 建议的实验顺序

## 第一步：只绕、不接换向器

完成 F1...F8 后：

- 测量所有 16 个 section 的直流电阻；
- 同类 section 电阻应高度一致；
- 检查所有 section 之间绝缘；
- 检查 section 对铁芯绝缘。

## 第二步：先做 Simplex-A

仅接 L1...L8：

```text
Lx : Cx → C(x+1)
```

W 全部绝缘悬空。

低压运行，确认：

- 旋转方向；
- 电刷中性位置；
- 基本换向；
- 反电势一致性。

## 第三步：做 Simplex-B

将 W 按：

```text
Wj : C(j+1) → C(j+2)
```

与对应 L 物理线圈同相并联。

先手转测量片间电势，再低压上电。

## 第四步：改成 Frog-Leg

保持 L 不动，把 W 改成：

```text
Wj : Cj → C(j+3)
```

再次检查：

- C1/C5、C2/C6、C3/C7、C4/C8 的动态等电位趋势；
- 四刷电流分配；
- 换向火花；
- 空载电流；
- 负载温升。

---

# 20. 上电前最低检查清单

- [ ] 4 个磁极按 N-S-N-S 排列；
- [ ] 槽号 S1...S8 与换向片 C1...C8 的参考方向已永久标记；
- [ ] 8 个复合线圈均跨 2 槽；
- [ ] F1=L1+W8；
- [ ] F2=L2+W1；
- [ ] F3=L3+W2；
- [ ] F4=L4+W3；
- [ ] F5=L5+W4；
- [ ] F6=L6+W5；
- [ ] F7=L7+W6；
- [ ] F8=L8+W7；
- [ ] 所有 L/W 匝数相同；
- [ ] 所有 L/W 线径相同；
- [ ] 同一 F 内 L/W 极性已核对；
- [ ] Lap 永久连接为 `Cx → C(x+1)`；
- [ ] Frog-Leg 时 Wave 为 `Cj → C(j+3)`；
- [ ] Simplex-B 时 Wave 为 `C(j+1) → C(j+2)`；
- [ ] Frog-Leg 每片换向片有 4 个 section leads；
- [ ] 四个刷臂机械间隔约 90°；
- [ ] 正刷两只并接、负刷两只并接；
- [ ] 首次通电使用限流低压电源；
- [ ] 首次试车前完成转子动平衡和端部绑扎检查。

---

# 21. 设计的拓扑摘要

## Frog-Leg

```text
P = 4
S = 8
K = 8

Lap:
simplex progressive
YcL = 1
A_L = 4

Wave:
duplex retrogressive
YcW = (8 - 2) / 2 = 3
A_W = 4

Physical composite:
Fx = Lx + W(x-1)

Lap electrical:
Lx = Cx → C(x+1)

Wave electrical:
Wj = Cj → C(j+3)

Natural equalizer:
Wj + L(j+3)
= Cj → C(j+3) → C(j+4)
= two pole pitches
```

## Simplex-B

```text
Lap:
Lx = Cx → C(x+1)

Wave section re-used as parallel conductor:
Wj = C(j+1) → C(j+2)

Therefore:
Lx || W(x-1)
= Cx → C(x+1)
```

---

# 22. 工程风险说明

这个方案的最大优点是：

- 用很少的线圈实现非退化 Frog-Leg；
- 数学关系整齐；
- 可以清楚展示天然均压机制；
- 可以用同一转子改接成 simplex。

但必须认识到它的局限：

1. **8 片换向器太少**  
   片间电压和换向纹波大，不适合直接推到高电压、高转速。

2. **每极只有 2 槽**  
   MMF 和转矩空间谐波明显。

3. **Frog-Leg 每槽有 4 个电气 coil sides**  
   槽满率、端部拥挤和绝缘比普通双层 simplex 更困难。

4. **可重构接线增加转子端部质量**  
   所有焊盘、桥片和端头都必须机械锁定并重新动平衡。

5. **不要仅凭静态万用表判断 Frog-Leg 极性正确**  
   最终必须结合旋转感应电势、四刷电流分配和换向火花测试。

如果目标从“拓扑样机”升级为“高性能电机”，应优先增加槽数和换向片数，而不是继续放大这个 8 槽原型。

---

# 23. 参考资料

1. **EASA Technical Manual — DC Machines, Section 3.9: Frog-Leg Windings for DC Machines**  
   https://www.hillsindustrial.com/pdfs/DC_MOTORS.pdf

   关键规则包括：
   - Frog-Leg 由 lap 与 wave winding 组合；
   - simplex lap 的 commutator pitch 为 1；
   - wave commutator pitch：
     \[
     Y_c=(\text{Bars}\pm\text{Plex})/(\text{Poles}/2)
     \]
   - 4 极 Frog-Leg 使用 simplex lap + duplex wave；
   - 两组 winding 的并联支路数、线径和每线圈匝数应相同；
   - 常用 progressive lap + retrogressive wave；
   - Frog-Leg 的 wave/lap series pair 可形成天然 equalizer。

2. **ANSYS Maxwell / RMxprt — Frog-Leg Winding**  
   https://ansyshelp.ansys.com/public/Views/Secured/Electronics/v242/en/Subsystems/Maxwell/Content/FroglegWinding.htm

---

## 版本说明

- 方案版本：v1.0
- 目标拓扑：4P / 8S / 8C / 8 composite frog-leg coils
- 本文重点：绕组拓扑、槽位、换向片和可重构连接
- 尚未确定：具体匝数、导线直径、磁极尺寸、极弧、气隙、额定电压、额定转速、额定电流及热设计
