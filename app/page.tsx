'use client';

import { useMemo, useState } from 'react';
import {
  Calculator,
  Wallet,
  Landmark,
  PiggyBank,
  Percent,
  Download,
} from 'lucide-react';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

import jsPDF from 'jspdf';

export default function ChinaTaxSaaS() {
  const monthNames = [
    '1月','2月','3月','4月','5月','6月',
    '7月','8月','9月','10月','11月','12月'
  ];

  const [months, setMonths] = useState(
    Array.from({ length: 12 }, () => ({
      salary: '',
      base: '',
      deduction: '',
    }))
  );

  const taxTable = [
    { max: 36000, rate: 0.03, quick: 0 },
    { max: 144000, rate: 0.1, quick: 2520 },
    { max: 300000, rate: 0.2, quick: 16920 },
    { max: 420000, rate: 0.25, quick: 31920 },
    { max: 660000, rate: 0.3, quick: 52920 },
    { max: 960000, rate: 0.35, quick: 85920 },
    { max: Infinity, rate: 0.45, quick: 181920 },
  ];

  const handleChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...months];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setMonths(updated);
  };

  const calculateShanghaiSocial = (base: number) => {
    const pension = base * 0.08;
    const medical = base * 0.02 + 3;
    const unemployment = base * 0.005;
    const fund = base * 0.07;

    return pension + medical + unemployment + fund;
  };

  const results = useMemo(() => {
    let cumulativeTaxable = 0;
    let cumulativePaid = 0;

    return months.map((m, index) => {
      const salary = parseFloat(m.salary) || 0;
      const base = parseFloat(m.base) || salary;
      const deduction = parseFloat(m.deduction) || 0;

      const social = calculateShanghaiSocial(base);

      const taxable =
        salary -
        social -
        deduction -
        5000;

      cumulativeTaxable += Math.max(0, taxable);

      const bracket = taxTable.find(
        item => cumulativeTaxable <= item.max
      )!;

      const cumulativeTax =
        cumulativeTaxable * bracket.rate -
        bracket.quick;

      const currentTax = Math.max(
        0,
        cumulativeTax - cumulativePaid
      );

      cumulativePaid += currentTax;

      const takeHome =
        salary - social - currentTax;

      return {
        month: monthNames[index],
        salary,
        social,
        taxable,
        tax: currentTax,
        takeHome,
      };
    });
  }, [months]);

  const summary = useMemo(() => {
    const totalSalary = results.reduce(
      (s, i) => s + i.salary,
      0
    );

    const totalTax = results.reduce(
      (s, i) => s + i.tax,
      0
    );

    const totalSocial = results.reduce(
      (s, i) => s + i.social,
      0
    );

    const takeHome =
      totalSalary - totalTax - totalSocial;

    return {
      totalSalary,
      totalTax,
      totalSocial,
      takeHome,
      avg:
        takeHome > 0
          ? takeHome / 12
          : 0,
      rate:
        totalSalary > 0
          ? (totalTax / totalSalary) * 100
          : 0,
    };
  }, [results]);

  const exportPDF = () => {
    const pdf = new jsPDF();

    pdf.setFontSize(20);
    pdf.text('China Tax SaaS Report', 20, 20);

    pdf.setFontSize(12);

    pdf.text(
      `Annual Salary: ¥${summary.totalSalary.toFixed(2)}`,
      20,
      40
    );

    pdf.text(
      `Annual Tax: ¥${summary.totalTax.toFixed(2)}`,
      20,
      50
    );

    pdf.text(
      `Take Home: ¥${summary.takeHome.toFixed(2)}`,
      20,
      60
    );

    pdf.save('china-tax-report.pdf');
  };

  const cards = [
    {
      title: '全年收入',
      value: `¥${summary.totalSalary.toLocaleString()}`,
      icon: Wallet,
      color: 'from-cyan-400 to-blue-500',
    },
    {
      title: '全年个税',
      value: `¥${summary.totalTax.toFixed(2)}`,
      icon: Landmark,
      color: 'from-pink-500 to-rose-500',
    },
    {
      title: '五险一金',
      value: `¥${summary.totalSocial.toFixed(2)}`,
      icon: Calculator,
      color: 'from-yellow-400 to-orange-500',
    },
    {
      title: '预计到手',
      value: `¥${summary.takeHome.toFixed(2)}`,
      icon: PiggyBank,
      color: 'from-emerald-400 to-green-600',
    },
    {
      title: '实际税率',
      value: `${summary.rate.toFixed(2)}%`,
      icon: Percent,
      color: 'from-violet-500 to-purple-600',
    },
    {
      title: '月均到手',
      value: `¥${summary.avg.toFixed(0)}`,
      icon: Wallet,
      color: 'from-sky-400 to-cyan-500',
    },
  ];

  return (
    <div className="min-h-screen bg-[#071029] text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8">

        <div className="rounded-[36px] p-8 bg-gradient-to-br from-[#1d2340] to-[#2b2f5a] border border-white/10 shadow-2xl mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl">
                <Calculator className="w-10 h-10" />
              </div>

              <div>
                <h1 className="text-4xl md:text-5xl font-black">
                  中国个人所得税 SaaS
                </h1>

                <p className="text-slate-300 mt-3 text-lg">
                  Shanghai Social Insurance · Dashboard · PDF Export
                </p>
              </div>
            </div>

            <button
              onClick={exportPDF}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-105 transition-all flex items-center gap-3 shadow-xl"
            >
              <Download className="w-5 h-5" />
              导出 PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-6 gap-5 mb-8">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <div
                key={index}
                className="rounded-3xl p-5 bg-[#1b2442] border border-white/10 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>

                  <div
                    className={`px-3 py-1 rounded-full text-sm bg-gradient-to-r ${card.color}`}
                  >
                    {card.title}
                  </div>
                </div>

                <div className="text-2xl font-black">
                  {card.value}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-[32px] bg-[#131c36] border border-white/10 p-6 mb-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              年度收入 Dashboard
            </h2>

            <div className="text-slate-400">
              实时累计收入趋势
            </div>
          </div>

          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={results}>
                <CartesianGrid strokeDasharray="4 4" stroke="#334155" />

                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                />

                <YAxis stroke="#94a3b8" />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="takeHome"
                  stroke="#22d3ee"
                  strokeWidth={4}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {months.map((month, index) => (
            <div
              key={index}
              className="rounded-[32px] bg-[#1b2442] border border-white/10 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-black">
                  {monthNames[index]}
                </h3>

                <div className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500">
                  Month {index + 1}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <input
                  type="number"
                  placeholder="税前工资"
                  value={month.salary}
                  onChange={(e) =>
                    handleChange(
                      index,
                      'salary',
                      e.target.value
                    )
                  }
                  className="bg-[#29324d] border border-white/10 rounded-2xl px-5 py-4 outline-none"
                />

                <input
                  type="number"
                  placeholder="社保缴费基数"
                  value={month.base}
                  onChange={(e) =>
                    handleChange(
                      index,
                      'base',
                      e.target.value
                    )
                  }
                  className="bg-[#29324d] border border-white/10 rounded-2xl px-5 py-4 outline-none"
                />

                <input
                  type="number"
                  placeholder="专项附加扣除"
                  value={month.deduction}
                  onChange={(e) =>
                    handleChange(
                      index,
                      'deduction',
                      e.target.value
                    )
                  }
                  className="bg-[#29324d] border border-white/10 rounded-2xl px-5 py-4 outline-none"
                />
              </div>

              <div className="rounded-2xl bg-[#111827] border border-white/10 p-5 flex items-center justify-between">
                <div className="text-slate-400">
                  上海社保估算
                </div>

                <div className="text-3xl font-black text-cyan-300">
                  ¥{results[index]?.social.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
