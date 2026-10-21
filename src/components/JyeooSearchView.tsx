import React, { useState, useEffect } from 'react';
import {
  Question,
  QuestionSnapshot,
  Student,
  SubjectKey,
  SUBJECT_MAP,
  PRIMARY_GRADES,
  JUNIOR_GRADES,
  SENIOR_GRADES,
  ALL_GRADES,
  JyeooExamPaper,
  GeneratedPaper,
} from '../types';
import {
  Search,
  Plus,
  Check,
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Sparkles,
  ShoppingBag,
  FileText,
  Link as LinkIcon,
  Download,
  Printer,
  Calendar,
  Layers,
  Award,
  ArrowRight,
  Eye,
  CheckCircle2,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  readJyeooQuestion,
  searchJyeooPapers,
  getJyeooPaperDetail,
  addToQuestionBasket,
  addBatchToBasket,
} from '../services/jyeooService';

interface JyeooSearchViewProps {
  questions: Question[];
  students: Student[];
  onImportToBank: (q: Omit<Question, 'id' | 'addedAt'>) => void;
  onAssignToStudentWrong: (studentId: string, q: QuestionSnapshot) => void;
  onSavePaper?: (paper: Omit<GeneratedPaper, 'id' | 'createdAt' | 'totalScore'>) => void;
  onNavigateToAssemble?: () => void;
}

export const JyeooSearchView: React.FC<JyeooSearchViewProps> = ({
  questions,
  students,
  onImportToBank,
  onAssignToStudentWrong,
  onSavePaper,
  onNavigateToAssemble,
}) => {
  // 主功能视图切换：'papers' (试卷检索) | 'questions' (题库检索) | 'reader' (试题快速读取)
  const [activeMode, setActiveMode] = useState<'papers' | 'questions' | 'reader'>('papers');

  // 学科与检索共用状态
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey>('math');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 试卷检索专属状态
  const [selectedTermType, setSelectedTermType] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [jyeooPapers, setJyeooPapers] = useState<JyeooExamPaper[]>([]);
  const [isSearchingPapers, setIsSearchingPapers] = useState(false);
  const [viewingPaper, setViewingPaper] = useState<JyeooExamPaper | null>(null);

  // 试卷导入与组卷篮反馈
  const [importedPaperIds, setImportedPaperIds] = useState<Set<string>>(new Set());
  const [basketToast, setBasketToast] = useState<string | null>(null);

  // 题目折叠与指派状态
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assigningQ, setAssigningQ] = useState<QuestionSnapshot | null>(null);
  const [selectedStudentForAssign, setSelectedStudentForAssign] = useState<string>(students[0]?.id || '');
  const [importedQIds, setImportedQIds] = useState<Set<string>>(new Set());

  // 试题读取器状态
  const [readerInput, setReaderInput] = useState('');
  const [isReadingQ, setIsReadingQ] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [readQuestionResult, setReadQuestionResult] = useState<QuestionSnapshot | null>(null);

  const subjects: SubjectKey[] = [
    'math',
    'physics',
    'chemistry',
    'biology',
    'history',
    'geography',
    'chinese',
    'english',
    'politics',
    'science',
  ];

  // 自动触发试卷检索
  const loadPapers = async () => {
    setIsSearchingPapers(true);
    const res = await searchJyeooPapers({
      subject: selectedSubject,
      grade: selectedGrade === 'all' ? undefined : selectedGrade,
      termType: selectedTermType === 'all' ? undefined : selectedTermType,
      year: selectedYear === 'all' ? undefined : selectedYear,
      keyword: searchKeyword,
    });
    setJyeooPapers(res.papers);
    setIsSearchingPapers(false);
  };

  useEffect(() => {
    if (activeMode === 'papers') {
      loadPapers();
    }
  }, [activeMode, selectedSubject, selectedGrade, selectedTermType, selectedYear]);

  // 显示操作反馈
  const showToast = (msg: string) => {
    setBasketToast(msg);
    setTimeout(() => setBasketToast(null), 3000);
  };

  // 1. 试题加入组卷篮
  const handleAddToBasket = (q: QuestionSnapshot) => {
    const res = addToQuestionBasket(q, 'jyeoo');
    showToast(res.message);
  };

  // 2. 批量将整份试卷试题加入组卷篮
  const handleAddPaperToBasket = (paper: JyeooExamPaper) => {
    const count = addBatchToBasket(paper.questions || [], 'jyeoo');
    showToast(`已成功将《${paper.title}》的 ${count} 道题目加入组卷篮！`);
  };

  // 3. 整卷一键导入我的试卷库
  const handleImportFullPaper = (paper: JyeooExamPaper) => {
    if (onSavePaper) {
      onSavePaper({
        title: paper.title,
        subtitle: `${paper.year}年 · ${paper.source || '菁优网真题卷'} · 标准分 ${paper.totalScore}分`,
        mode: 'bank',
        items: paper.questions || [],
        settings: {
          title: paper.title,
          subtitle: `${paper.province} · ${paper.termType}诊断测验`,
          header: '注意事项：请在答题卡规定区域内作答，超出黑色边框区域的答案无效。',
          footer: '菁优网智能教学工作台 · 标准试卷',
          perScore: Math.round(paper.totalScore / (paper.questions?.length || 1)),
          showAnswer: true,
          layoutMode: 'double',
          showAnswerSheet: true,
          showScoreTable: true,
          showSealingLine: true,
          duration: paper.duration || 90,
          examDate: new Date().toISOString().slice(0, 10),
        },
      });
      setImportedPaperIds(prev => new Set(prev).add(paper.id));
      showToast(`试卷《${paper.title}》已完整导入至您的试卷库！`);
    }
  };

  // 4. 试题读取
  const handleReadQuestion = async () => {
    if (!readerInput.trim()) {
      setReadError('请输入有效的试题链接、试题ID或试题题干内容');
      return;
    }
    setIsReadingQ(true);
    setReadError(null);
    setReadQuestionResult(null);

    const res = await readJyeooQuestion(
      readerInput.trim(),
      selectedSubject,
      selectedGrade === 'all' ? '初二（八年级）' : selectedGrade
    );

    setIsReadingQ(false);
    if (res.ok && res.question) {
      setReadQuestionResult(res.question);
    } else {
      setReadError(res.error || '未能提取到试题，请检查链接或文本格式');
    }
  };

  // 5. 题库题目筛选
  const filteredQuestions = questions.filter(q => {
    const matchesSubject = q.subject === selectedSubject;
    const matchesGrade =
      selectedGrade === 'all' ||
      q.grade === selectedGrade ||
      q.grade.includes(selectedGrade) ||
      selectedGrade.includes(q.grade);
    const matchesKeyword =
      !searchKeyword.trim() ||
      q.stem.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      q.source.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      q.kp.some(k => k.toLowerCase().includes(searchKeyword.toLowerCase()));

    return matchesSubject && matchesGrade && matchesKeyword;
  });

  const handleImportQuestion = (q: QuestionSnapshot) => {
    onImportToBank({
      subject: q.subject,
      grade: q.grade,
      stem: q.stem,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      source: q.source,
      kp: q.kp,
      hasImage: q.hasImage,
      origin: 'jyeoo',
    });
    setImportedQIds(prev => new Set(prev).add((q as any).id || q.stem));
    showToast('试题已成功加入您的本地题库！');
  };

  const handleConfirmAssign = () => {
    if (!assigningQ || !selectedStudentForAssign) return;
    onAssignToStudentWrong(selectedStudentForAssign, assigningQ);
    setAssigningQ(null);
    showToast('已录入为该学生的错题攻克记录！');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* 顶部通知条 */}
      {basketToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{basketToast}</span>
        </div>
      )}

      {/* 顶栏与核心三大功能切换 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>菁优网题库与试卷中心</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
              直连官方题库
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            全面接入菁优真题试卷检索、题目链接一键读取与双栏组卷篮协同
          </p>
        </div>

        {/* 核心模式切换器 */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveMode('papers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeMode === 'papers'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>菁优试卷库检索</span>
          </button>
          <button
            onClick={() => setActiveMode('questions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeMode === 'questions'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>学科精选题库</span>
          </button>
          <button
            onClick={() => setActiveMode('reader')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeMode === 'reader'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>试题链接/文本读取</span>
          </button>
        </div>
      </div>

      {/* 学科选择标签栏 */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs text-xs">
        {subjects.map(s => (
          <button
            key={s}
            onClick={() => setSelectedSubject(s)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-semibold ${
              selectedSubject === s
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {SUBJECT_MAP[s]}
          </button>
        ))}
      </div>

      {/* 模式一：菁优试卷库检索 */}
      {activeMode === 'papers' && (
        <div className="space-y-4">
          {/* 试卷多维筛选条 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* 年级学段 */}
              <div>
                <label className="block text-slate-500 mb-1 font-medium">学段年级：</label>
                <select
                  value={selectedGrade}
                  onChange={e => setSelectedGrade(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                >
                  <option value="all">全部年级 (小学至高三)</option>
                  <optgroup label="小学阶段 (1~6年级)">
                    {PRIMARY_GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </optgroup>
                  <optgroup label="初中阶段 (7~9年级)">
                    {JUNIOR_GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </optgroup>
                  <optgroup label="高中阶段 (高一~高三)">
                    {SENIOR_GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* 考试类型 */}
              <div>
                <label className="block text-slate-500 mb-1 font-medium">试卷类型：</label>
                <select
                  value={selectedTermType}
                  onChange={e => setSelectedTermType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                >
                  <option value="all">全部类型 (期中期末/模考/中高真题)</option>
                  <option value="期末">期末考试试卷</option>
                  <option value="期中">期中考试试卷</option>
                  <option value="一模">一模统考试卷</option>
                  <option value="二模">二模调研试卷</option>
                  <option value="中考真题">中考真题卷</option>
                  <option value="高考真题">高考真题预测卷</option>
                </select>
              </div>

              {/* 年份 */}
              <div>
                <label className="block text-slate-500 mb-1 font-medium">考试年份：</label>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                >
                  <option value="all">全部年份</option>
                  <option value="2026">2026年最新模拟与真题</option>
                  <option value="2025">2025学年</option>
                  <option value="2024">2024学年</option>
                </select>
              </div>

              {/* 搜索框 */}
              <div>
                <label className="block text-slate-500 mb-1 font-medium">搜索地区或考点：</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadPapers()}
                    placeholder="输入如 海淀、黄冈、西城、函数..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 试卷列表 */}
          {isSearchingPapers ? (
            <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>正在从菁优网试卷库检索匹配试卷...</span>
            </div>
          ) : jyeooPapers.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              暂无匹配试卷，可尝试调整学科、年级或清除关键词再次检索
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jyeooPapers.map(paper => {
                const isImported = importedPaperIds.has(paper.id);
                return (
                  <div
                    key={paper.id}
                    className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 p-5 shadow-xs transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* 试卷标签元数据 */}
                      <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {paper.termType}
                          </span>
                          <span>·</span>
                          <span>{paper.grade}</span>
                          <span>·</span>
                          <span>{paper.year}年</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {paper.downloadCount ? `${paper.downloadCount} 次使用` : '官方推荐'}
                        </span>
                      </div>

                      {/* 试卷大标题 */}
                      <h3 className="text-sm font-bold text-slate-900 mt-2 leading-relaxed">
                        {paper.title}
                      </h3>

                      {/* 试卷参数 */}
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                        <span>满分：<strong className="text-slate-800">{paper.totalScore}分</strong></span>
                        <span>时长：<strong className="text-slate-800">{paper.duration}分钟</strong></span>
                        <span>题量：<strong className="text-slate-800">{paper.questions?.length || paper.questionCount}题</strong></span>
                        <span className="text-amber-700">难度：{'★'.repeat(Number(paper.difficulty) || 3)}</span>
                      </div>
                    </div>

                    {/* 操作按钮组 */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setViewingPaper(paper)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>预览全卷试题</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddPaperToBasket(paper)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="将整份试卷的所有题目加入我的组卷篮"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>加入组卷篮</span>
                        </button>

                        <button
                          onClick={() => handleImportFullPaper(paper)}
                          disabled={isImported}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                            isImported
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                          }`}
                        >
                          {isImported ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                          <span>{isImported ? '已入我的试卷' : '一键导入试卷'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 模式二：学科精选题库 */}
      {activeMode === 'questions' && (
        <div className="space-y-4">
          {/* 筛选与搜索 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 shrink-0">年级筛选：</span>
              <select
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
              >
                <option value="all">全部年级</option>
                <optgroup label="小学阶段">
                  {PRIMARY_GRADES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </optgroup>
                <optgroup label="初中阶段">
                  {JUNIOR_GRADES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </optgroup>
                <optgroup label="高中阶段">
                  {SENIOR_GRADES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="relative flex-1 sm:max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="搜索考点、题干关键词（如 勾股定理、反比例函数）..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
              />
            </div>
          </div>

          {/* 试题列表 */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
                该分类下暂无试题，可尝试切换年级或输入其他关键词检索
              </div>
            ) : (
              filteredQuestions.map((q, idx) => {
                const isExpanded = expandedId === q.id;
                const isImported = importedQIds.has(q.id);

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs transition-colors space-y-3"
                  >
                    {/* 题目头部 */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{q.source}</span>
                        <span>·</span>
                        <span>{q.grade}</span>
                        <span>·</span>
                        <span className="text-amber-700">难度：{'★'.repeat(Number(q.difficulty) || 2)}</span>
                        {q.kp && q.kp.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-slate-600">考点：{q.kp.join(' / ')}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 加入组卷篮 */}
                        <button
                          onClick={() => handleAddToBasket(q)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          title="加入菁优组卷篮"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>加入组卷篮</span>
                        </button>

                        {/* 指派错题 */}
                        <button
                          onClick={() => setAssigningQ(q)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>录为学生错题</span>
                        </button>

                        {/* 入库保存 */}
                        <button
                          onClick={() => handleImportQuestion(q)}
                          disabled={isImported}
                          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                            isImported
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isImported ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          <span>{isImported ? '已入库' : '入库'}</span>
                        </button>
                      </div>
                    </div>

                    {/* 题干内容 */}
                    <div className="py-2 text-sm text-slate-900 leading-relaxed font-normal">
                      <span className="font-bold mr-1.5">{idx + 1}.</span>
                      {q.stem}
                    </div>

                    {/* 选项 */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 text-xs">
                        {q.options.map(opt => (
                          <div
                            key={opt.pos}
                            className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-start gap-2"
                          >
                            <span className="font-bold text-slate-700">{opt.pos}.</span>
                            <span className="text-slate-800">{opt.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 解析展开折叠 */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        <span>{isExpanded ? '收起权威解析与答案' : '查看权威解析与标准答案'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-4 bg-slate-50 rounded-lg text-xs space-y-2 border border-slate-200/60 animate-in fade-in duration-150">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700">【正确答案】</span>
                            <span className="font-bold text-emerald-700 text-sm font-mono">{q.answer}</span>
                          </div>
                          {q.explanation && (
                            <div>
                              <span className="font-bold text-slate-700 block mb-1">【试题权威解析】</span>
                              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 模式三：菁优试题快速读取 (链接/ID/文本) */}
      {activeMode === 'reader' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="max-w-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-rose-600" />
              <span>菁优网试题一键读取与解析</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              只需输入菁优网试题详情 URL、试题唯一编号或直接粘贴复制的试题文本，系统即可秒级完成结构化提取、考点标注与答案解析。
            </p>
          </div>

          {/* 输入表单 */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <span className="font-semibold text-slate-700">输入试题链接 / 题目编号 / 文本内容：</span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-400">快速填入测试：</span>
                <button
                  type="button"
                  onClick={() => {
                    setReaderInput(
                      'https://www.jyeoo.com/math/ques/detail/761e05d0-9d0d-4009-bc36-c0c169ee385c'
                    );
                  }}
                  className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors"
                >
                  📐 中考数学真题
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReaderInput(
                      '如图所示，将一个重为 6N 的实心物体浸没在盛满水的溢水杯中，从溢水杯中溢出了 4N 的水，若将该物体从水中取出后放入足量酒精中 (ρ酒精 = 0.8 × 10³ kg/m³)，静止时物体受到的浮力是（g取10N/kg）（　　）\nA. 6N\nB. 4N\nC. 3.2N\nD. 4.8N\n【答案】C\n【解析】利用阿基米德原理计算得出。'
                    );
                  }}
                  className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium transition-colors"
                >
                  ⚡ 初二物理期末
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReaderInput(
                      '下列物质在氧气中燃烧，产生大量白烟的是（　　）\nA. 木炭\nB. 红磷\nC. 铁丝\nD. 硫磺\n【答案】B\n【解析】红磷在氧气中燃烧生成五氧化二磷白色固体小颗粒，产生大量白烟。'
                    );
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors"
                >
                  🧪 初三化学一模
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={readerInput}
              onChange={e => setReaderInput(e.target.value)}
              placeholder="例如：https://www.jyeoo.com/math/ques/detail/761e05d0-9d0d-4009-bc36-c0c169ee385c 或粘贴整道题目内容..."
              className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
            />

            {readError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                {readError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleReadQuestion}
                disabled={isReadingQ}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                {isReadingQ ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>正在从菁优网读取试题并解析...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>立即读取试题详情</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 读取结果卡片 */}
          {readQuestionResult && (
            <div className="p-5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    读取成功
                  </span>
                  <span>·</span>
                  <span>{readQuestionResult.source || '菁优网'}</span>
                  <span>·</span>
                  <span className="text-amber-700">难度：{'★'.repeat(Number(readQuestionResult.difficulty) || 3)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddToBasket(readQuestionResult)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>加入组卷篮</span>
                  </button>

                  <button
                    onClick={() => setAssigningQ(readQuestionResult)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>录入错题本</span>
                  </button>

                  <button
                    onClick={() => handleImportQuestion(readQuestionResult)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>保存至我的题库</span>
                  </button>
                </div>
              </div>

              {/* 题干 */}
              <div className="text-sm text-slate-900 leading-relaxed font-normal">
                {readQuestionResult.stem}
              </div>

              {/* 选项 */}
              {readQuestionResult.options && readQuestionResult.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 text-xs">
                  {readQuestionResult.options.map(opt => (
                    <div
                      key={opt.pos}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-start gap-2"
                    >
                      <span className="font-bold text-slate-700">{opt.pos}.</span>
                      <span className="text-slate-800">{opt.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 答案与解析 */}
              <div className="p-4 bg-white rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">【标准参考答案】:</span>
                  <span className="font-bold text-emerald-700 text-sm font-mono">
                    {readQuestionResult.answer}
                  </span>
                </div>
                {readQuestionResult.explanation && (
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">【试题权威解析】:</span>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {readQuestionResult.explanation}
                    </p>
                  </div>
                )}
                {readQuestionResult.kp && readQuestionResult.kp.length > 0 && (
                  <div className="pt-1 text-slate-500">
                    <span className="font-semibold text-slate-700">考察考点：</span>
                    {readQuestionResult.kp.join(' / ')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 试卷全卷预览弹窗 */}
      {viewingPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* 试卷头部 */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">{viewingPaper.title}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>科目：{SUBJECT_MAP[viewingPaper.subject as SubjectKey] || viewingPaper.subject}</span>
                  <span>·</span>
                  <span>年级：{viewingPaper.grade}</span>
                  <span>·</span>
                  <span>满分：{viewingPaper.totalScore}分</span>
                  <span>·</span>
                  <span>考试时长：{viewingPaper.duration}分钟</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddPaperToBasket(viewingPaper)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>整卷加入组卷篮</span>
                </button>
                <button
                  onClick={() => handleImportFullPaper(viewingPaper)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>一键入库试卷</span>
                </button>
                <button
                  onClick={() => setViewingPaper(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 试卷试题列表 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {viewingPaper.questions && viewingPaper.questions.length > 0 ? (
                viewingPaper.questions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold text-slate-800">第 {idx + 1} 题</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddToBasket(q)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          + 入组卷篮
                        </button>
                        <button
                          onClick={() => setAssigningQ(q)}
                          className="text-xs text-slate-600 hover:text-slate-800 font-medium"
                        >
                          录入错题
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-900 leading-relaxed font-normal">
                      {q.stem}
                    </div>

                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        {q.options.map(o => (
                          <div key={o.pos} className="p-2 bg-white rounded border border-slate-100">
                            <strong>{o.pos}.</strong> {o.text}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 text-xs text-slate-600 flex items-center justify-between border-t border-slate-200/60">
                      <span>标准答案：<strong className="text-emerald-700 font-mono">{q.answer}</strong></span>
                      <span className="text-slate-400">考点: {q.kp?.join(' / ') || '基础概念'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">试卷题目加载中...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 录入错题弹窗 */}
      {assigningQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              录入为学生或自家小孩错题
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2">
              题目：{assigningQ.stem}
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                选择指派对象（支持自家小孩与班级在校生）
              </label>
              <select
                value={selectedStudentForAssign}
                onChange={e => setSelectedStudentForAssign(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium"
              >
                <optgroup label="🏠 我家小孩专属专档">
                  {students.filter(s => s.isFamilyChild).map(s => (
                    <option key={s.id} value={s.id}>
                      ★ {s.familyRelation || '我家孩子'} · {s.name} ({s.grade})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="👥 班级在校学生">
                  {students.filter(s => !s.isFamilyChild).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.className})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setAssigningQ(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAssign}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                确认录入错题本
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
