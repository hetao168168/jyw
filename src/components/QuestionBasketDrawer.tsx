import React, { useState, useEffect } from 'react';
import { QuestionBasketItem, QuestionSnapshot } from '../types';
import {
  getQuestionBasket,
  removeFromBasket,
  clearBasket,
} from '../services/jyeooService';
import {
  ShoppingBag,
  X,
  Trash2,
  FileText,
  ChevronRight,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface QuestionBasketDrawerProps {
  onGoToAssemble: () => void;
}

export const QuestionBasketDrawer: React.FC<QuestionBasketDrawerProps> = ({
  onGoToAssemble,
}) => {
  const [basketItems, setBasketItems] = useState<QuestionBasketItem[]>(getQuestionBasket());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setBasketItems(getQuestionBasket());
    };
    window.addEventListener('jyeoo-basket-updated', handleUpdate);
    return () => window.removeEventListener('jyeoo-basket-updated', handleUpdate);
  }, []);

  const totalCount = basketItems.length;

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeFromBasket(id);
    setBasketItems(updated);
  };

  const handleClear = () => {
    if (confirm('确认清空组卷篮中的所有试题吗？')) {
      clearBasket();
      setBasketItems([]);
    }
  };

  return (
    <>
      {/* 右下角常驻悬浮试题篮药丸按钮 */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs shadow-lg transition-all transform hover:scale-105 ${
            totalCount > 0
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 ring-2 ring-blue-400/50'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
          title="点击查看菁优网组卷篮"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>菁优组卷篮</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono ${
              totalCount > 0 ? 'bg-white text-blue-700 font-extrabold' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {totalCount}
          </span>
        </button>
      </div>

      {/* 组卷篮抽屉弹窗 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* 抽屉头部 */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">菁优网组卷篮</h3>
                  <p className="text-[11px] text-slate-500">
                    已挑选 {totalCount} 道试题 · 随时一键双栏排版组卷
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {totalCount > 0 && (
                  <button
                    onClick={handleClear}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white text-xs flex items-center gap-1"
                    title="清空"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>清空</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 试题列表内容 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {totalCount === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-semibold text-slate-700">组卷篮暂无试题</div>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    您可以在【菁优题库与试卷】、【自家小孩错题本】中点击“加入组卷篮”快速收集题目。
                  </p>
                </div>
              ) : (
                basketItems.map((item, index) => {
                  const q = item.question;
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-50/80 hover:bg-slate-50 rounded-xl border border-slate-200/80 transition-colors space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-bold text-blue-700">
                          第 {index + 1} 题 · {q.grade || '初中'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{q.source || '精选题'}</span>
                          <button
                            onClick={e => handleRemove(item.id, e)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                            title="移除此题"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-800 line-clamp-3 leading-relaxed font-normal">
                        {q.stem}
                      </div>

                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 pt-1">
                          {q.options.slice(0, 2).map(o => (
                            <span key={o.pos} className="truncate">
                              {o.pos}. {o.text}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>参考答案：<strong className="text-emerald-700 font-mono">{q.answer}</strong></span>
                        <span className="text-slate-400">考点: {q.kp?.join(' / ') || '基础'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 抽屉底部操作区 */}
            {totalCount > 0 && (
              <div className="p-4 border-t border-slate-200 bg-white space-y-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onGoToAssemble();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>立即按菁优标准双栏排版组卷 ({totalCount} 题)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="text-center text-[10px] text-slate-400">
                  支持导出 Word (.doc) 格式、打印 PDF、标准密封线与客观题答题卡
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
