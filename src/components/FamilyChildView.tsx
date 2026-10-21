import React, { useState } from 'react';
import { Student, WrongQuestion, Question, ALL_GRADES, SUBJECT_MAP, SubjectKey, ErrorReason } from '../types';
import {
  Heart,
  Home,
  Plus,
  Edit2,
  FileText,
  Sparkles,
  Bot,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Calendar,
  Award,
  ChevronRight,
  TrendingUp,
  Target,
  ArrowRight,
  Printer,
  Trash2,
  UserPlus,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { StudentRadarChart } from './StudentRadarChart';
import { DoubaoDiagnoseModal } from './DoubaoDiagnoseModal';

interface FamilyChildViewProps {
  students: Student[];
  wrongQuestions: WrongQuestion[];
  onAddStudent: (data: Omit<Student, 'id' | 'createdAt'>) => void;
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  onNavigateToWrong: (studentId: string) => void;
  onNavigateToPaper: (studentId: string) => void;
  onToggleWrongMastered: (id: string) => void;
  onAddWrongQuestion: (data: any) => void;
  onAddToBasket?: (q: any) => void;
  onOpenDoubaoAssistant?: () => void;
}

export const FamilyChildView: React.FC<FamilyChildViewProps> = ({
  students,
  wrongQuestions,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onNavigateToWrong,
  onNavigateToPaper,
  onToggleWrongMastered,
  onAddWrongQuestion,
  onAddToBasket,
  onOpenDoubaoAssistant,
}) => {
  // 严格只筛选自家小孩
  const familyChildren = students.filter(s => s.isFamilyChild);

  // 默认选中第一个自家孩子
  const [selectedChildId, setSelectedChildId] = useState<string>(
    familyChildren[0]?.id || ''
  );

  // 当前选中的孩子
  const currentChild = familyChildren.find(s => s.id === selectedChildId) || familyChildren[0];

  // 当前孩子的专属错题
  const childWrongs = wrongQuestions.filter(
    w => currentChild && w.studentId === currentChild.id
  );

  // 错题筛选状态
  const [wrongStatusFilter, setWrongStatusFilter] = useState<'all' | 'open' | 'mastered'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // 模态框状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [isQuickAddWrongOpen, setIsQuickAddWrongOpen] = useState(false);
  const [diagnoseTargetWrong, setDiagnoseTargetWrong] = useState<WrongQuestion | null>(null);

  // 亲子表单状态
  const [formData, setFormData] = useState({
    name: '',
    familyRelation: '我家大宝',
    grade: '初二（八年级）',
    school: '北京实验中学',
    className: '初二(3)班',
    tags: '数理逻辑强, 运算粗心, 周末督促',
    note: '孩子平时思维活跃，但做题容易跳步漏掉隐含条件，需重点督促书写规范。',
  });

  // 快速录入错题表单
  const [quickWrongData, setQuickWrongData] = useState({
    stem: '',
    subject: 'math',
    grade: currentChild?.grade || '初二（八年级）',
    myAnswer: 'B',
    correctAnswer: 'D',
    errorReason: '计算失误' as ErrorReason,
    note: '家庭作业中出现的错题，周末重点重做。',
    explanation: '根据定理分析已知条件...',
    options: [
      { pos: 'A', text: '选项 A' },
      { pos: 'B', text: '选项 B (错选)' },
      { pos: 'C', text: '选项 C' },
      { pos: 'D', text: '选项 D (正确)' },
    ],
  });

  // 统计指标
  const totalWrongsCount = childWrongs.length;
  const openWrongsCount = childWrongs.filter(w => !w.mastered).length;
  const masteredCount = totalWrongsCount - openWrongsCount;
  const masteryRate = totalWrongsCount > 0 ? Math.round((masteredCount / totalWrongsCount) * 100) : 100;

  // 错题筛选
  const filteredWrongs = childWrongs.filter(w => {
    if (wrongStatusFilter === 'open' && w.mastered) return false;
    if (wrongStatusFilter === 'mastered' && !w.mastered) return false;
    if (selectedSubject !== 'all' && w.subject !== selectedSubject) return false;
    return true;
  });

  // 打开编辑
  const handleOpenEdit = () => {
    if (!currentChild) return;
    setFormData({
      name: currentChild.name,
      familyRelation: currentChild.familyRelation || '我家孩子',
      grade: currentChild.grade,
      school: currentChild.school,
      className: currentChild.className,
      tags: currentChild.tags.join(', '),
      note: currentChild.note || '',
    });
    setIsEditModalOpen(true);
  };

  // 打开添加新孩子
  const handleOpenAddChild = () => {
    setFormData({
      name: '',
      familyRelation: familyChildren.length === 1 ? '我家小宝' : '我家宝贝',
      grade: '初一（七年级）',
      school: '北京实验中学',
      className: '初一(2)班',
      tags: '学习自觉, 语文阅读, 重点陪伴',
      note: '平时作业认真，周末多陪伴巩固薄弱学科。',
    });
    setIsAddChildModalOpen(true);
  };

  // 保存编辑
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChild || !formData.name.trim()) return;
    onUpdateStudent(currentChild.id, {
      name: formData.name.trim(),
      familyRelation: formData.familyRelation.trim(),
      grade: formData.grade,
      school: formData.school.trim(),
      className: formData.className.trim(),
      tags: formData.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
      note: formData.note.trim(),
    });
    setIsEditModalOpen(false);
  };

  // 保存新建孩子
  const handleSaveNewChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onAddStudent({
      name: formData.name.trim(),
      familyRelation: formData.familyRelation.trim(),
      grade: formData.grade,
      school: formData.school.trim(),
      className: formData.className.trim(),
      tags: formData.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
      note: formData.note.trim(),
      isFamilyChild: true,
    });
    setIsAddChildModalOpen(false);
  };

  // 快速录入家庭错题
  const handleSaveQuickWrong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChild || !quickWrongData.stem.trim()) return;

    onAddWrongQuestion({
      studentId: currentChild.id,
      studentName: currentChild.name,
      snap: {
        subject: quickWrongData.subject,
        grade: quickWrongData.grade,
        stem: quickWrongData.stem.trim(),
        options: quickWrongData.options,
        answer: quickWrongData.correctAnswer,
        explanation: quickWrongData.explanation,
        difficulty: 3,
        source: `${currentChild.familyRelation || '家庭'}作业错题`,
        kp: ['易错核心考点'],
      },
      myAnswer: quickWrongData.myAnswer,
      errorReason: quickWrongData.errorReason,
      note: quickWrongData.note,
      subject: quickWrongData.subject,
      grade: quickWrongData.grade,
      tags: ['家庭作业', '周末巩固', quickWrongData.errorReason],
    });

    setIsQuickAddWrongOpen(false);
    setQuickWrongData(prev => ({ ...prev, stem: '', note: '' }));
  };

  if (familyChildren.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8 fill-rose-100" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">暂无自家小孩专属档案</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          将自家孩子的档案与学校班级学生完全分开管理。记录专属错题、学情六维雷达、专属周末练习卷与亲子提分指导。
        </p>
        <button
          onClick={handleOpenAddChild}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>立即创建我家孩子档案</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* 顶部专栏横幅 */}
      <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border border-rose-200/70 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">自家小孩专属档案专栏</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  亲子专区 · 独立归档
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                此专栏仅收录您自己家的小孩，与学校班级在校生完全隔开，专属跟踪孩子作业错题、查漏补缺与周末提分测验
              </p>
            </div>
          </div>

          {/* 孩子切换器与添加按钮 */}
          <div className="flex items-center gap-2 flex-wrap">
            {familyChildren.map(child => {
              const isSelected = child.id === currentChild?.id;
              return (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-xs scale-102'
                      : 'bg-white/90 text-slate-700 hover:bg-white border border-rose-200/60'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isSelected ? 'fill-white text-white' : 'text-rose-500'}`} />
                  <span>{child.familyRelation || child.name}</span>
                  <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-rose-700 text-rose-100' : 'bg-slate-100 text-slate-600'}`}>
                    {child.grade}
                  </span>
                </button>
              );
            })}

            <button
              onClick={handleOpenAddChild}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-rose-50 border border-dashed border-rose-300 text-rose-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加二宝/其他孩子</span>
            </button>
          </div>
        </div>
      </div>

      {currentChild && (
        <>
          {/* 孩子核心档案卡 & 关键数据指标 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：孩子档案卡片 */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                    {currentChild.name.slice(0, 1)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-xl font-bold text-slate-900">{currentChild.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                        {currentChild.familyRelation || '自家孩子'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {currentChild.grade} · {currentChild.school} · {currentChild.className}
                      </span>
                    </div>

                    {/* 家长备忘与督促策略 */}
                    <div className="pt-2 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-semibold text-rose-700 mr-1.5">【家长辅导备忘】</span>
                      {currentChild.note || '暂未添加辅导备忘，点击编辑按钮记录孩子日常错题习惯与薄弱点。'}
                    </div>

                    {/* 专属标签 */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {currentChild.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start shrink-0">
                  <button
                    onClick={handleOpenEdit}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    title="编辑档案"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`确认删除【${currentChild.name}】的档案吗？`)) {
                        onDeleteStudent(currentChild.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="删除档案"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 核心快捷操作条 */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateToPaper(currentChild.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>一键生成专属周末巩固卷</span>
                  </button>

                  <button
                    onClick={() => setIsQuickAddWrongOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>快速录入作业错题</span>
                  </button>
                </div>

                {onOpenDoubaoAssistant && (
                  <button
                    onClick={onOpenDoubaoAssistant}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
                  >
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                    <span>豆包 AI 亲子辅导分析</span>
                  </button>
                )}
              </div>
            </div>

            {/* 右侧：统计概览与攻克率 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">错题攻克总览</span>
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  专属进度
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xl font-bold text-slate-900">{totalWrongsCount}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">累计错题</div>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                  <div className="text-xl font-bold text-amber-700">{openWrongsCount}</div>
                  <div className="text-[11px] text-amber-700 mt-0.5">待周末攻坚</div>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <div className="text-xl font-bold text-emerald-700">{masteredCount}</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">已完全掌握</div>
                </div>
              </div>

              {/* 掌握度进度条 */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">知识掌握攻克率</span>
                  <span className="text-rose-600 font-mono">{masteryRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-rose-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${masteryRate}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed">
                建议每个周末带领孩子将【待周末攻坚】的错题重新演算一遍，并用豆包AI生成变式题举一反三。
              </div>
            </div>
          </div>

          {/* 六维雷达能力图专栏 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                  <span>{currentChild.name} · 六维学情能力雷达诊断</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  基于自家小孩错因分布、审题习惯、公式记忆与运算规范生成的直观能力模型
                </p>
              </div>
            </div>

            <StudentRadarChart
              student={currentChild}
              allWrongQuestions={wrongQuestions}
              onNavigateToPaper={onNavigateToPaper}
              onNavigateToWrong={onNavigateToWrong}
            />
          </div>

          {/* 专属错题攻坚本 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-rose-500" />
                <h4 className="text-sm font-bold text-slate-900">
                  {currentChild.name} 的错题攻坚本 ({filteredWrongs.length} 题)
                </h4>
              </div>

              {/* 筛选控制器 */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* 状态筛选 */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setWrongStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      wrongStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    全部 ({totalWrongsCount})
                  </button>
                  <button
                    onClick={() => setWrongStatusFilter('open')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      wrongStatusFilter === 'open' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    待突破 ({openWrongsCount})
                  </button>
                  <button
                    onClick={() => setWrongStatusFilter('mastered')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      wrongStatusFilter === 'mastered' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    已掌握 ({masteredCount})
                  </button>
                </div>

                {/* 学科筛选 */}
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden font-medium"
                >
                  <option value="all">全部学科</option>
                  {Object.entries(SUBJECT_MAP).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 错题卡片流 */}
            {filteredWrongs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                当前筛选条件下没有错题，孩子表现很棒！
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWrongs.map((item, idx) => {
                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-xl border transition-all ${
                        item.mastered
                          ? 'bg-emerald-50/20 border-emerald-200/80'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* 题目头部信息 */}
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            第 {idx + 1} 题 · {SUBJECT_MAP[item.subject as SubjectKey] || item.subject}
                          </span>
                          <span>·</span>
                          <span className="text-slate-600">{item.snap.source || '日常作业'}</span>
                          <span>·</span>
                          <span className="text-rose-600 font-medium">错因：{item.errorReason}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* 掌握标记 */}
                          <button
                            onClick={() => onToggleWrongMastered(item.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                              item.mastered
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{item.mastered ? '我家孩子已掌握' : '标记已掌握'}</span>
                          </button>

                          {/* 豆包 AI 举一反三变式题 */}
                          <button
                            onClick={() => setDiagnoseTargetWrong(item)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <Bot className="w-3.5 h-3.5" />
                            <span>豆包举一反三</span>
                          </button>

                          {/* 组卷篮 */}
                          {onAddToBasket && (
                            <button
                              onClick={() => onAddToBasket(item.snap)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 rounded-md hover:bg-slate-100"
                              title="加入组卷篮"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 题干 */}
                      <div className="py-3 text-sm text-slate-900 leading-relaxed font-normal">
                        {item.snap.stem}
                      </div>

                      {/* 选项 */}
                      {item.snap.options && item.snap.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 text-xs">
                          {item.snap.options.map(opt => (
                            <div
                              key={opt.pos}
                              className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                                opt.pos === item.snap.answer
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-medium'
                                  : opt.pos === item.myAnswer
                                  ? 'bg-rose-50/80 border-rose-300 text-rose-900'
                                  : 'bg-slate-50/50 border-slate-100 text-slate-700'
                              }`}
                            >
                              <span className="font-bold">{opt.pos}.</span>
                              <span>{opt.text}</span>
                              {opt.pos === item.myAnswer && (
                                <span className="ml-auto text-[10px] text-rose-600 font-bold bg-white px-1.5 py-0.5 rounded">
                                  孩子错选
                                </span>
                              )}
                              {opt.pos === item.snap.answer && (
                                <span className="ml-auto text-[10px] text-emerald-700 font-bold bg-white px-1.5 py-0.5 rounded">
                                  正确答案
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 家长备忘与解析 */}
                      <div className="mt-3 pt-2 text-xs space-y-1.5 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">【正确答案】:</span>
                          <span className="font-bold text-emerald-700 font-mono text-sm">{item.snap.answer}</span>
                          <span className="text-slate-400">|</span>
                          <span className="font-bold text-rose-700">【孩子答案】:</span>
                          <span className="font-bold text-rose-700 font-mono">{item.myAnswer}</span>
                        </div>
                        {item.note && (
                          <div>
                            <span className="font-semibold text-rose-800">【亲子辅导心得】: </span>
                            <span>{item.note}</span>
                          </div>
                        )}
                        {item.snap.explanation && (
                          <div className="text-slate-500 pt-1 line-clamp-2 hover:line-clamp-none transition-all">
                            <span className="font-semibold text-slate-700">【解题分析】: </span>
                            {item.snap.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* 编辑孩子档案弹窗 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>编辑我家小孩档案</span>
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">孩子称谓 / 关系</label>
                <input
                  type="text"
                  value={formData.familyRelation}
                  onChange={e => setFormData({ ...formData, familyRelation: e.target.value })}
                  placeholder="如：我家大宝、我家小宝、儿子、闺女"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">孩子姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">所在年级</label>
                  <select
                    value={formData.grade}
                    onChange={e => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {ALL_GRADES.map(g => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">班级</label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={e => setFormData({ ...formData, className: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">就读学校</label>
                <input
                  type="text"
                  value={formData.school}
                  onChange={e => setFormData({ ...formData, school: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">专注标签（逗号隔开）</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">家长辅导备忘与关注重点</label>
                <textarea
                  rows={3}
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
                >
                  保存更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 添加新孩子档案弹窗 */}
      {isAddChildModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-rose-500" />
              <span>新建自家小孩独立档案</span>
            </h3>

            <form onSubmit={handleSaveNewChild} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">关系称谓</label>
                <input
                  type="text"
                  value={formData.familyRelation}
                  onChange={e => setFormData({ ...formData, familyRelation: e.target.value })}
                  placeholder="如：我家二宝、我家闺女、我家儿子"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">孩子姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="输入孩子名字"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">年级</label>
                  <select
                    value={formData.grade}
                    onChange={e => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    {ALL_GRADES.map(g => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">班级</label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={e => setFormData({ ...formData, className: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">辅导备忘</label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddChildModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
                >
                  确认创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 快速录入错题弹窗 */}
      {isQuickAddWrongOpen && currentChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-rose-500" />
              <span>给【{currentChild.name}】录入作业错题</span>
            </h3>

            <form onSubmit={handleSaveQuickWrong} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">学科</label>
                  <select
                    value={quickWrongData.subject}
                    onChange={e => setQuickWrongData({ ...quickWrongData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    {Object.entries(SUBJECT_MAP).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">错因归类</label>
                  <select
                    value={quickWrongData.errorReason}
                    onChange={e => setQuickWrongData({ ...quickWrongData, errorReason: e.target.value as ErrorReason })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-rose-700"
                  >
                    <option value="审题不清">审题不清</option>
                    <option value="概念混淆">概念混淆</option>
                    <option value="计算失误">计算失误</option>
                    <option value="综合应用薄弱">综合应用薄弱</option>
                    <option value="公式记忆错误">公式记忆错误</option>
                    <option value="解题步骤不规范">解题步骤不规范</option>
                    <option value="其他原因">其他原因</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">错题题干内容</label>
                <textarea
                  rows={3}
                  required
                  value={quickWrongData.stem}
                  onChange={e => setQuickWrongData({ ...quickWrongData, stem: e.target.value })}
                  placeholder="在此输入错题题目内容（支持粘贴公式文字或作业题干）..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">孩子做错的答案</label>
                  <input
                    type="text"
                    value={quickWrongData.myAnswer}
                    onChange={e => setQuickWrongData({ ...quickWrongData, myAnswer: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-rose-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">标准正确答案</label>
                  <input
                    type="text"
                    value={quickWrongData.correctAnswer}
                    onChange={e => setQuickWrongData({ ...quickWrongData, correctAnswer: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-emerald-700 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">辅导心得 / 错题备注</label>
                <input
                  type="text"
                  value={quickWrongData.note}
                  onChange={e => setQuickWrongData({ ...quickWrongData, note: e.target.value })}
                  placeholder="如：粗心看错负号，周末重算一遍"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickAddWrongOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
                >
                  存入小孩错题本
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 豆包 AI 举一反三变式题弹窗 */}
      {diagnoseTargetWrong && (
        <DoubaoDiagnoseModal
          wrongQuestion={diagnoseTargetWrong}
          isOpen={Boolean(diagnoseTargetWrong)}
          onClose={() => setDiagnoseTargetWrong(null)}
          onImportToBank={q => {
            if (onAddToBasket) onAddToBasket(q);
          }}
          onAssignToStudent={(_stuId, q) => {
            onAddWrongQuestion({
              studentId: currentChild.id,
              studentName: currentChild.name,
              snap: q,
              myAnswer: '',
              errorReason: '其他原因',
              note: '豆包AI举一反三变式练习题',
              subject: q.subject,
              grade: q.grade,
            });
          }}
        />
      )}
    </div>
  );
};
