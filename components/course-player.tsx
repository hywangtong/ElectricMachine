'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Home,
  Maximize,
  Minimize,
  Play,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { chapters, slides } from '@/content/course';
import { ChapterGalaxy } from '@/components/chapter-galaxy';
import { ElectrificationTrend } from '@/components/electrification-trend';
import { EvLesson } from '@/components/ev-roadmap';
import { ShipPodExplainer } from '@/components/ship-pod-explainer';
import { DistributedPropulsion } from '@/components/distributed-propulsion';
const number = (n: number) => String(n).padStart(2, '0');

export default function CoursePlayer() {
  const [index, setIndex] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [catalog, setCatalog] = useState(false);
  const [notice, setNotice] = useState('');
  const viewport = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [scale, setScale] = useState(0);
  const slide = slides[index];
  const chapter =
    slide.kind === 'home'
      ? undefined
      : chapters.find((c) => c.id === slide.chapterId);
  const chapterIndex = chapter ? chapters.indexOf(chapter) : -1;
  const chapterSlides = chapter
    ? slides.filter((s) => s.kind !== 'home' && s.chapterId === chapter.id)
    : [slides[0]];
  const localIndex = chapterSlides.findIndex((s) => s.id === slide.id);
  const navigate = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, next));
    setIndex(clamped);
    window.location.hash = slides[clamped].id;
  }, []);
  const jump = (id: string) => {
    navigate(slides.findIndex((s) => s.id === id));
    setCatalog(false);
  };
  const togglePresentation = useCallback(async () => {
    if (presenting) {
      if (document.fullscreenElement)
        await document.exitFullscreen().catch(() => {});
      setPresenting(false);
      setNotice('');
    } else {
      setPresenting(true);
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        setNotice(
          '已进入课堂模式。此浏览器未允许全屏，可使用浏览器的全屏功能。',
        );
      }
    }
  }, [presenting]);
  useEffect(() => {
    const sync = () => {
      const next = slides.findIndex(
        (s) => s.id === window.location.hash.slice(1),
      );
      setIndex(next < 0 ? 0 : next);
    };
    sync();
    window.addEventListener('hashchange', sync);
    const fullscreen = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    document.addEventListener('fullscreenchange', fullscreen);
    return () => {
      window.removeEventListener('hashchange', sync);
      document.removeEventListener('fullscreenchange', fullscreen);
    };
  }, []);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setScale(
        Math.min(
          entry.contentRect.width / 1600,
          entry.contentRect.height / 900,
        ),
      ),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    document.title = `${slide.title} · 电机与拖动`;
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        catalog ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        target.closest('input, textarea, select, [contenteditable="true"]')
      )
        return;
      if (event.key === 'Escape' && presenting) {
        setPresenting(false);
        setNotice('');
        return;
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        void togglePresentation();
        return;
      }
      if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        setCatalog(true);
        return;
      }
      if (event.key === ' ' && target.closest('button, a')) return;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) {
        event.preventDefault();
        navigate(index + 1);
      }
      if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        navigate(index - 1);
      }
      if (event.key === 'Home') {
        event.preventDefault();
        navigate(0);
      }
      if (event.key === 'End') {
        event.preventDefault();
        navigate(slides.length - 1);
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [catalog, index, navigate, presenting, slide.title, togglePresentation]);

  return (
    <div className={`course-app ${presenting ? 'presenting' : ''}`}>
      <aside className="sidebar">
        <a className="brand" href="#home">
          <span className="brand-icon">
            <Zap size={23} />
          </span>
          <span>
            电机与拖动<small>ELECTRIC MACHINES & DRIVES</small>
          </span>
        </a>
        <div className="sidebar-label">
          教学讲义 <span>COURSE NOTES</span>
        </div>
        <button
          className={`nav-home ${index === 0 ? 'active' : ''}`}
          onClick={() => jump('home')}
          aria-current={index === 0 ? 'page' : undefined}
        >
          <Home size={18} />
          课程封面
          <ChevronRight size={15} />
        </button>
        <nav className="chapter-nav" aria-label="课程章节">
          {chapters.map((c, i) => (
            <div key={c.id}>
              {(i === 0 || chapters[i - 1].category !== c.category) && (
                <div className="nav-group">{c.category}</div>
              )}
              <button
                className={`chapter-link ${chapter?.id === c.id ? 'active' : ''}`}
                onClick={() => jump(c.id)}
                aria-current={chapter?.id === c.id ? 'location' : undefined}
              >
                <span className="nav-number">{number(i + 1)}</span>
                <span>{c.title}</span>
                {chapter?.id === c.id && <span className="active-dot" />}
              </button>
              {chapter?.id === c.id && (
                <div className="subpages">
                  {chapterSlides.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => jump(s.id)}
                      className={s.id === slide.id ? 'selected' : ''}
                      aria-current={s.id === slide.id ? 'page' : undefined}
                    >
                      {s.kind === 'chapter'
                        ? c.teacher
                          ? '教师简介'
                          : '章节导入'
                        : s.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <BookOpen size={18} />
          <div>
            从原理到应用<small>7 个章节 · 课堂演示讲义</small>
          </div>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <BookOpen size={17} />
            <span>电机与拖动</span>
            <span className="crumb-slash">/</span>
            <strong>{chapter?.title || '课程封面'}</strong>
          </div>
          <div className="top-actions">
            <Button
              variant="ghost"
              className="toolbar-button"
              onClick={() => setCatalog(true)}
              title="课程目录（M）"
            >
              <Grid2X2 />
              <span>课程目录</span>
            </Button>
            <Button
              className="present-button"
              onClick={togglePresentation}
              title="全屏演示（F）"
            >
              <Play />
              <span>开始演示</span>
            </Button>
          </div>
        </header>
        <div className="stage-area">
          <div className="stage-meta">
            <span>
              <span className="status-dot" />
              课堂讲义 <span className="meta-divider">/</span>{' '}
              {chapter
                ? `CHAPTER ${number(chapterIndex + 1)}`
                : 'COURSE OVERVIEW'}
            </span>
            <span>
              16:9 <span className="meta-divider">·</span>{' '}
              {slide.kind === 'home'
                ? '课程封面'
                : slide.kind === 'chapter'
                  ? chapter?.teacher
                    ? '教师简介'
                    : '章节导入'
                  : slide.kind === 'video'
                    ? '视频导入'
                    : slide.kind === 'embed'
                      ? '互动图解'
                    : slide.kind === 'assessment'
                      ? '考核方案'
                      : slide.kind === 'question'
                        ? '课堂思考'
                        : slide.kind === 'trend'
                          ? '趋势示意'
                          : slide.kind === 'outline'
                            ? '内容提纲'
                            : '课堂讲义'}
            </span>
          </div>
          <div
            className="slide-viewport"
            ref={viewport}
            onTouchStart={(e) => {
              const t = e.touches[0];
              touchStart.current = { x: t.clientX, y: t.clientY };
            }}
            onTouchEnd={(e) => {
              const start = touchStart.current;
              touchStart.current = null;
              if (
                !start ||
                catalog ||
                (e.target as HTMLElement).closest('button, a')
              )
                return;
              const dx = e.changedTouches[0].clientX - start.x;
              const dy = e.changedTouches[0].clientY - start.y;
              if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5)
                navigate(index + (dx < 0 ? 1 : -1));
            }}
          >
            <article
              className={`slide slide-${slide.kind}`}
              aria-label={`第 ${index + 1} 页：${slide.title}`}
              style={{
                transform: `translate(-50%, -50%) scale(${scale})`,
                visibility: scale ? 'visible' : 'hidden',
              }}
            >
              <div className="slide-top">
                <span>
                  <span className="tiny-mark" />
                  电机与拖动
                </span>
                <span>
                  {chapter ? chapter.english : 'ELECTRIC MACHINES & DRIVES'}
                </span>
              </div>
              {slide.kind === 'home' ? (
                <>
                  <div className="cover-body">
                    <section className="cover-copy">
                      <div className="eyebrow">
                        <span />
                        电气工程 · 专业基础课程
                      </div>
                      <h1>
                        电机与拖动
                        <span>
                          Electric Machines
                          <br />& Drives
                        </span>
                      </h1>
                      <p className="cover-description">
                        理解电磁能量转换
                        <br />
                        掌握电机运行与电力拖动的基本规律
                      </p>
                      <div className="cover-actions">
                        <Button
                          className="slide-primary"
                          onClick={() => jump(chapters[0].id)}
                        >
                          进入课程
                          <ArrowRight />
                        </Button>
                        <button
                          className="text-action"
                          onClick={() => setCatalog(true)}
                        >
                          浏览章节 <span>↗</span>
                        </button>
                      </div>
                    </section>
                    <ChapterGalaxy onNavigate={jump} />
                  </div>
                  <div className="course-strip">
                    <span className="strip-label">学习路径</span>
                    <span>磁路基础</span>
                    <ArrowRight />
                    <span>电机原理</span>
                    <ArrowRight />
                    <span>运行分析</span>
                    <ArrowRight />
                    <span>电力拖动</span>
                    <span className="strip-count">
                      07 <small>CHAPTERS</small>
                    </span>
                  </div>
                </>
              ) : (
                chapter && (
                  <>
                    {slide.kind === 'chapter' ? (
                      <div className="chapter-body">
                        <div className="chapter-copy">
                          <div className="eyebrow">
                            <span />
                            {chapter.teacher
                              ? 'COURSE INSTRUCTOR'
                              : `CHAPTER ${number(chapterIndex + 1)}`}{' '}
                            <b>
                              {chapter.teacher ? '授课教师' : chapter.category}
                            </b>
                          </div>
                          <h1>
                            {chapter.teacher
                              ? chapter.teacher.name
                              : chapter.title}
                          </h1>
                          <p className="chapter-question">
                            {chapter.teacher
                              ? chapter.teacher.role
                              : chapter.question}
                          </p>
                          <Button
                            className="slide-primary"
                            onClick={() => navigate(index + 1)}
                          >
                            {chapter.teacher ? '查看考核方案' : '本章内容'}
                            <ArrowRight />
                          </Button>
                        </div>
                        <section className="objectives">
                          <span className="giant-number">
                            {number(chapterIndex + 1)}
                          </span>
                          <h2>
                            {chapter.teacher ? '教师简介' : '学习目标'}{' '}
                            <small>
                              {chapter.teacher
                                ? 'EDUCATION · EXPERIENCE · RESEARCH'
                                : 'LEARNING OBJECTIVES'}
                            </small>
                          </h2>
                          {chapter.teacher ? (
                            <>
                              <p>
                                <span>学历</span>
                                {chapter.teacher.education}
                              </p>
                              <p>
                                <span>经历</span>
                                {chapter.teacher.experience}
                              </p>
                              <p>
                                <span>方向</span>
                                {chapter.teacher.research}
                              </p>
                              <p>
                                <span>联系</span>
                                <span className="teacher-contact-details">
                                  <span>电话：{chapter.teacher.phone}</span>
                                  <span>邮箱：{chapter.teacher.email}</span>
                                  <span>
                                    办公地点：{chapter.teacher.office}
                                  </span>
                                </span>
                              </p>
                            </>
                          ) : (
                            chapter.objectives.map((goal, i) => (
                              <p key={goal}>
                                <span>{number(i + 1)}</span>
                                {goal}
                              </p>
                            ))
                          )}
                        </section>
                      </div>
                    ) : slide.kind === 'ev' ? (
                      <EvLesson
                        key={slide.id}
                        page={slide.page}
                        onNavigate={jump}
                      />
                    ) : slide.kind === 'pod' ? (
                      <ShipPodExplainer view={slide.view} />
                    ) : slide.kind === 'assessment' ? (
                      <div className="assessment-body">
                        <div className="eyebrow">
                          <span />
                          COURSE ASSESSMENT <b>考核方案</b>
                        </div>
                        <div className="assessment-heading">
                          <div>
                            <h1>{slide.title}</h1>
                            <p>过程性评价与期末考核相结合</p>
                          </div>
                          <span>总评构成 · 100%</span>
                        </div>
                        <div className="assessment-layout">
                          <section className="assessment-table-card">
                            <table>
                              <thead>
                                <tr>
                                  <th>考核环节</th>
                                  <th>考核要求</th>
                                  <th>成绩占比</th>
                                </tr>
                              </thead>
                              <tbody>
                                {slide.rows.map((row) => (
                                  <tr
                                    key={row.stage}
                                    className={
                                      row.stage === '合计'
                                        ? 'assessment-total'
                                        : undefined
                                    }
                                  >
                                    <th scope="row">{row.stage}</th>
                                    <td>{row.requirement}</td>
                                    <td className="assessment-weight">
                                      {row.weight}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </section>
                          <section className="online-learning-card">
                            <div className="online-learning-heading">
                              <div>
                                <span>平时作业 · 15%</span>
                                <h2>智慧树在线学习</h2>
                              </div>
                              <strong>共享课</strong>
                            </div>
                            <div className="learning-paths">
                              <a
                                href={slide.platform.webUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <span>01</span>
                                <div>
                                  <small>网页端</small>
                                  www.zhihuishu.com
                                </div>
                                <ArrowRight />
                              </a>
                              <div>
                                <span>02</span>
                                <div>
                                  <small>APP 端</small>
                                  {slide.platform.appName}
                                </div>
                              </div>
                            </div>
                            <div className="learning-login">
                              <p>
                                <span>登录</span>
                                {slide.platform.loginGuide}
                              </p>
                              <p>
                                <span>首次密码</span>
                                <code>{slide.platform.firstPassword}</code>
                              </p>
                              <p>
                                <span>加入学习</span>
                                {slide.platform.courseGuide}
                              </p>
                            </div>
                            <div className="learning-alert">
                              <strong>特别提醒</strong>
                              必须通过弹屏推送课程，点击确认课程，
                              <b>不可以自己搜索！</b>
                            </div>
                            <p className="shared-course-note">
                              正确的课程角标：
                              <strong>共享课！共享课！共享课！</strong>
                            </p>
                            <p className="returning-note">
                              <strong>已登录过？</strong>
                              {slide.platform.returningGuide}
                            </p>
                          </section>
                        </div>
                      </div>
                    ) : slide.kind === 'embed' ? (
                      <div className="embed-body">
                        <iframe
                          src={slide.embedUrl}
                          title={slide.title}
                          className="embed-frame"
                        />
                      </div>
                    ) : slide.kind === 'video' ? (
                      <div className="video-body">
                        <div className="eyebrow">
                          <span />
                          INTRODUCTION <b>为什么要学习电机？</b>
                        </div>
                        <div className="video-heading">
                          <div>
                            <h1>{slide.title}</h1>
                            <p>{slide.lead}</p>
                          </div>
                          <a
                            href={slide.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            无法播放？在 Bilibili 打开
                            <ArrowRight />
                          </a>
                        </div>
                        <div className="video-frame">
                          <iframe
                            src={slide.videoUrl}
                            title="如果这个世界上没有电，所有东西都烧油"

                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                        </div>
                      </div>
                    ) : slide.kind === 'question' ? (
                      <div className="question-body">
                        <div className="eyebrow">
                          <span />
                          THINK ABOUT IT <b>课堂思考</b>
                        </div>
                        <div className="question-mark" aria-hidden="true">
                          ?
                        </div>
                        <p className="question-kicker">
                          看完视频，先别急着翻页
                        </p>
                        <h1>{slide.prompt}</h1>
                        <div className="question-rule">
                          <span />
                          从你身边正在运动的事物开始找
                          <span />
                        </div>
                      </div>
                    ) : slide.kind === 'trend' ? (
                      <ElectrificationTrend />
                    ) : (
                      <div
                        className={`outline-body${slide.kind === 'content' && slide.explainer ? ' propulsion-content' : ''}`}
                      >
                        <div className="eyebrow">
                          <span />
                          CHAPTER {number(chapterIndex + 1)}{' '}
                          <b>{chapter.title}</b>
                        </div>
                        <h1>
                          {slide.kind === 'content' ? slide.title : '本章内容'}
                        </h1>
                        <p className="outline-lead">
                          {slide.kind === 'content'
                            ? slide.lead
                            : chapter.question}
                        </p>
                        {slide.kind === 'content' && slide.explainer ? (
                          <DistributedPropulsion points={slide.points} />
                        ) : (
                          <div className="topic-grid">
                            {(slide.kind === 'content'
                              ? slide.points
                              : chapter.topics
                            ).map((topic, i) => (
                              <section className="topic" key={topic.title}>
                                <span>{number(i + 1)}</span>
                                <div>
                                  <h2>{topic.title}</h2>
                                  <p>{topic.description}</p>
                                </div>
                              </section>
                            ))}
                          </div>
                        )}
                        {slide.kind === 'content' && slide.links && (
                          <nav
                            className="content-links"
                            aria-label="视频与参考资料"
                          >
                            {slide.links.map((link) => (
                              <a
                                key={link.url}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {link.kind === 'video' ? (
                                  <Play />
                                ) : (
                                  <BookOpen />
                                )}
                                <span>{link.title}</span>
                                <ArrowRight />
                              </a>
                            ))}
                          </nav>
                        )}
                        {slide.kind === 'content' && slide.note && (
                          <p className="content-note">{slide.note}</p>
                        )}
                        {slide.kind === 'outline' && (
                          <div className="outline-note">
                            <span />
                            章节提纲 · 详细教学内容将陆续补充
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )
              )}
              <footer className="slide-footer">
                <span>
                  {chapter
                    ? `${number(chapterIndex + 1)} / ${chapter.title}`
                    : '课程讲义 / COURSE NOTES'}
                </span>
                <span>
                  {slide.kind === 'home'
                    ? '电磁 · 能量 · 运动'
                    : `${number(localIndex + 1)} / ${number(chapterSlides.length)}`}
                </span>
              </footer>
            </article>
          </div>
          <footer className="player-controls">
            <div className="key-hint">
              <kbd>←</kbd>
              <kbd>→</kbd>
              <span>翻页</span>
              <span className="hint-divider" />
              <kbd>F</kbd>
              <span>全屏</span>
            </div>
            <div className="paging">
              <Button
                variant="ghost"
                size="icon"
                aria-label="上一页"
                disabled={index === 0}
                onClick={() => navigate(index - 1)}
              >
                <ChevronLeft />
              </Button>
              <span>
                <b>{number(index + 1)}</b> / {number(slides.length)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="下一页"
                disabled={index === slides.length - 1}
                onClick={() => navigate(index + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
            <button
              className="next-label"
              onClick={() => navigate(index + 1)}
              disabled={index === slides.length - 1}
            >
              {index === slides.length - 1
                ? '已到最后一页'
                : `下一页 · ${slides[index + 1].title}`}
              <ArrowRight size={16} />
            </button>
          </footer>
        </div>
        <progress
          className="progress-track"
          aria-label="课程页数"
          max={slides.length}
          value={index + 1}
        />
      </main>
      {presenting && (
        <div className="presentation-dock">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(index - 1)}
            disabled={index === 0}
            aria-label="上一页"
          >
            <ArrowLeft />
          </Button>
          <span>
            {index + 1} / {slides.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(index + 1)}
            disabled={index === slides.length - 1}
            aria-label="下一页"
          >
            <ArrowRight />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCatalog(true)}
            aria-label="课程目录"
          >
            <Grid2X2 />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePresentation}
            aria-label="退出演示"
          >
            <Minimize />
          </Button>
        </div>
      )}
      {notice && (
        <output className="notice">
          {notice}
          <button onClick={() => setNotice('')} aria-label="关闭提示">
            <X size={16} />
          </button>
        </output>
      )}
      <span className="sr-only" aria-live="polite">
        第 {index + 1} 页，共 {slides.length} 页，{slide.title}
      </span>
      <Dialog open={catalog} onOpenChange={setCatalog}>
        <DialogContent className="catalog-dialog">
          <DialogTitle>课程目录</DialogTitle>
          <DialogDescription>
            电机与拖动 · 选择章节进入课堂讲义
          </DialogDescription>
          <button className="catalog-home" onClick={() => jump('home')}>
            <Home size={18} />
            课程封面
            <ArrowRight size={18} />
          </button>
          <div className="catalog-list">
            {chapters.map((c, i) => (
              <button key={c.id} onClick={() => jump(c.id)}>
                <span>{number(i + 1)}</span>
                <div>
                  <strong>{c.title}</strong>
                  <small>{c.english}</small>
                </div>
                {chapter?.id === c.id ? (
                  <Check size={18} />
                ) : (
                  <ArrowRight size={18} />
                )}
              </button>
            ))}
          </div>
          <p className="catalog-tip">
            <Maximize size={15} />按 F 全屏演示，按 M 打开目录
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
