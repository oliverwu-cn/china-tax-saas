import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { jsPDF } from 'jspdf';
import { ShieldCheck, Sparkles, Wallet, Building2, Coins, PiggyBank, Landmark, TrendingUp, CreditCard } from 'lucide-react';

export default function ChinaTaxSaaS() {
  const [year, setYear] = useState('2026');
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  const taxTable = [
    { min: 0, max: 36000, rate: 0.03, quick: 0 },
    { min: 36000, max: 144000, rate: 0.1, quick: 2520 },
    { min: 144000, max: 300000, rate: 0.2, quick: 16920 },
    { min: 300000, max: 420000, rate: 0.25, quick: 31920 },
    { min: 420000, max: 660000, rate: 0.3, quick: 52920 },
    { min: 660000, max: 960000, rate: 0.35, quick: 85920 },
    { min: 960000, max: Infinity, rate: 0.45, quick: 181920 },
  ];

  const shanghaiSocialRate = { pension: 0.08, medical: 0.02, unemployment: 0.005, housing: 0.07 };

  const [months, setMonths] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('china-tax-saas');
      if (saved) return JSON.parse(saved);
    }
    return Array.from({ length: 12 }, () => ({ salary: '', socialBase: '', deduction: '' }));
  });

  const [results, setResults] = useState([]);

  useEffect(() => {
    localStorage.setItem('china-tax-saas', JSON.stringify(months));
  }, [months]);

  const handleChange = (index, field, value) => {
    const updated = [...months];
    updated[index] = { ...updated[index], [field]: value };
    setMonths(updated);
  };

  const calculateTax = () => {
    let cumulativeTaxable = 0;
    let cumulativePaid = 0;

    const calculated = months.map((m, index) => {
      const salary = parseFloat(m.salary) || 0;
      const socialBase = parseFloat(m.socialBase) || salary;

      const pension = socialBase * shanghaiSocialRate.pension;
      const medical = socialBase * shanghaiSocialRate.medical;
      const unemployment = socialBase * shanghaiSocialRate.unemployment;
      const housingFund = socialBase * shanghaiSocialRate.housing;

      const social = pension + medical + unemployment + housingFund;

      const deduction = parseFloat(m.deduction) || 0;
      const taxable = Math.max(0, salary - social - deduction - 5000);

      cumulativeTaxable += taxable;
      const bracket = taxTable.find(item => cumulativeTaxable <= item.max);
      const cumulativeTax = cumulativeTaxable * bracket.rate - bracket.quick;
      const currentTax = Math.max(0, cumulativeTax - cumulativePaid);
      cumulativePaid += currentTax;

      return {
        month: monthNames[index],
        taxable,
        currentTax,
        cumulativeTax: cumulativePaid,
        rate: bracket.rate,
        takeHome: salary - social - currentTax,
        social,
      };
    });

    setResults(calculated);
  };

  const summary = useMemo(() => {
    const totalSalary = months.reduce((sum, m) => sum + (parseFloat(m.salary) || 0), 0);
    const totalSocial = results.reduce((sum, r) => sum + r.social, 0);
    const totalTax = results.reduce((sum, r) => sum + r.currentTax, 0);
    const takeHome = totalSalary - totalSocial - totalTax;
    const averageTakeHome = takeHome / 12;
    return { totalSalary, totalSocial, totalTax, takeHome, averageTakeHome };
  }, [months, results]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('中国个人所得税报告', 10, 10);
    results.forEach((r, i) => {
      doc.text(`${r.month}: 到手 ¥${r.takeHome.toFixed(2)}, 个税 ¥${r.currentTax.toFixed(2)}, 社保 ¥${r.social.toFixed(2)}`, 10, 20 + i * 10);
    });
    doc.save('tax-report.pdf');
  };

  const cardColors = ['bg-cyan-600', 'bg-pink-600', 'bg-yellow-500', 'bg-emerald-500', 'bg-purple-500', 'bg-indigo-500'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-6">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
            <Wallet className="w-10 h-10 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/20 px-4 py-1 rounded-full">
                China Tax AI
              </Badge>

              <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/20 px-4 py-1 rounded-full">
                SaaS Platform
              </Badge>
            </div>

            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
              中国个人所得税 SaaS
            </h1>

            <p className="text-slate-400 mt-2 text-base max-w-2xl">
              支持累计预扣法 · 上海社保估算 · PDF 导出 · Dashboard 可视化 · 年度税率动态计算
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-300">数据本地存储</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm text-slate-300">智能税率计算</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <Building2 className="w-4 h-4 text-cyan-300" />
            <span className="text-sm text-slate-300">上海社保模型</span>
          </div>

          <Select value={year} onValueChange={setYear} className="w-28">
            <SelectTrigger className="bg-white/10 border-white/10 rounded-2xl text-white">
              <SelectValue placeholder="年份" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {[
          {
            title: '全年收入',
            value: `¥${summary.totalSalary.toLocaleString()}`,
            icon: <Coins className="w-7 h-7 text-white" />,
            bg: 'from-cyan-500 to-blue-600'
          },
          {
            title: '全年个税',
            value: `¥${summary.totalTax.toFixed(2)}`,
            icon: <Landmark className="w-7 h-7 text-white" />,
            bg: 'from-pink-500 to-rose-600'
          },
          {
            title: '五险一金',
            value: `¥${summary.totalSocial.toFixed(2)}`,
            icon: <CreditCard className="w-7 h-7 text-white" />,
            bg: 'from-yellow-400 to-orange-500'
          },
          {
            title: '预计到手',
            value: `¥${summary.takeHome.toFixed(2)}`,
            icon: <TrendingUp className="w-7 h-7 text-white" />,
            bg: 'from-emerald-400 to-green-600'
          },
          {
            title: '月均到手',
            value: `¥${summary.averageTakeHome.toFixed(0)}`,
            icon: <PiggyBank className="w-7 h-7 text-white" />,
            bg: 'from-purple-500 to-indigo-600'
          }
        ].map((card, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card className={`bg-gradient-to-br ${card.bg} rounded-[30px] border-none shadow-2xl overflow-hidden`}>
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-lg">
                    {card.icon}
                  </div>

                  <Badge className="bg-white/20 text-white border border-white/10 px-4 py-1 rounded-full backdrop-blur-xl">
                    {card.title}
                  </Badge>
                </div>

                <div className="relative z-10">
                  <div className="text-4xl font-black tracking-tight text-white drop-shadow-lg">
                    {card.value}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-4 mb-6">
        <Button onClick={calculateTax}>开始计算</Button>
        <Button onClick={exportPDF} className="bg-green-500 hover:bg-green-600">导出 PDF</Button>
      </div>

      <div className="w-full h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={results} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <CartesianGrid stroke="#444" strokeDasharray="5 5" />
            <Line type="monotone" dataKey="takeHome" stroke="#00FFAA" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {months.map((m, i) => (
          <motion.div key={i} whileHover={{ scale: 1.015 }}>
            <Card className="bg-gradient-to-r from-indigo-700 to-purple-700 rounded-3xl shadow-xl overflow-hidden text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-bold">{monthNames[i]}</h3>
                  <Badge className="bg-indigo-500 rounded-full px-4">Month {i + 1}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input type="number" placeholder="税前工资" value={m.salary} onChange={(e) => handleChange(i, 'salary', e.target.value)} className="bg-white/10 border-white/20 rounded-2xl h-12 placeholder:text-slate-400 text-white" />

                  <Input type="number" placeholder="社保缴费基数" value={m.socialBase} onChange={(e) => handleChange(i, 'socialBase', e.target.value)} className="bg-white/10 border-white/20 rounded-2xl h-12 placeholder:text-slate-400 text-white" />

                  <Input type="number" placeholder="专项附加扣除" value={m.deduction} onChange={(e) => handleChange(i, 'deduction', e.target.value)} className="bg-white/10 border-white/20 rounded-2xl h-12 placeholder:text-slate-400 text-white" />
                </div>

                <div className="mt-4 rounded-2xl bg-black/30 border border-white/20 px-4 py-2 flex items-center justify-between">
                  <span className="text-slate-300 text-sm">五险一金总额</span>
                  <span className="font-semibold text-cyan-300">¥{((parseFloat(m.socialBase) || 0) * 0.175).toFixed(2)}</span>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
