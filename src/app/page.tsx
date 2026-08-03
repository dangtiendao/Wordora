import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sparkles, Flame, Play, Layers, Info } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Trang tổng quan"
        description="Chào mừng bạn trở lại với Wordora. Sẵn sàng cho phiên học hôm nay!"
        action={
          <Link href="/study">
            <Button size="lg" className="w-full sm:w-auto">
              <Play className="w-4 h-4 fill-current mr-1" /> Bắt đầu học ngay
            </Button>
          </Link>
        }
      />

      {/* Demo Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-sky-800/40 bg-sky-950/30 text-sky-200 text-xs">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-sky-300">Thông báo Phase 1:</span> Đây là giao diện khung hiển thị mẫu (presentation placeholder). Dữ liệu thật sẽ được kết nối với IndexedDB ở các phase tiếp theo.
        </div>
      </div>

      {/* Stats Quick Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" className="relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-400">Mục cần ôn tập</span>
            <RefreshCw className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">12</div>
            <p className="text-[11px] text-slate-400 mt-1">Cần ôn trong hôm nay</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-400">Từ mới hôm nay</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">5 / 10</div>
            <p className="text-[11px] text-slate-400 mt-1">Đạt 50% chỉ tiêu hàng ngày</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-rose-500/10 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-400">Chuỗi ngày học</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">7 ngày</div>
            <p className="text-[11px] text-slate-400 mt-1">Giữ vững phong độ!</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Decks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> Bộ học gần đây
          </h2>
          <Link href="/decks" className="text-xs text-emerald-400 hover:underline">
            Xem tất cả bộ học →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="interactive">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded-md">
                  Tiếng Anh
                </span>
                <span className="text-xs text-slate-400">45 từ vựng</span>
              </div>
              <CardTitle className="text-base mt-2">English Oxford 3000 - Phase 1</CardTitle>
              <CardDescription>Các từ vựng thông dụng hàng ngày dành cho giao tiếp cơ bản.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-3 mt-2">
                <span>Cần ôn: <strong className="text-amber-400">8 từ</strong></span>
                <Link href="/study">
                  <Button size="sm" variant="outline">Học bộ này</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card variant="interactive">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60 rounded-md">
                  Tiếng Nhật
                </span>
                <span className="text-xs text-slate-400">30 mẫu câu</span>
              </div>
              <CardTitle className="text-base mt-2">Mẫu câu giao tiếp JLPT N4</CardTitle>
              <CardDescription>Cụm từ và mẫu câu ngữ pháp thường dùng trong bài thi N4.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-3 mt-2">
                <span>Cần ôn: <strong className="text-amber-400">4 câu</strong></span>
                <Link href="/study">
                  <Button size="sm" variant="outline">Học bộ này</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
