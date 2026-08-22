import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Restore imports
content = re.sub(
    r"import \{ TrendingUp, TrendingDown, DollarSign, Wallet, Eye, EyeOff, X, Key, Trophy, ChevronDown, ChevronUp, Printer, Star \} from 'lucide-react';",
    "import {\n  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,\n  PieChart, Pie, Cell\n} from 'recharts';\nimport { TrendingUp, TrendingDown, DollarSign, Wallet, Eye, EyeOff, X, Key } from 'lucide-react';",
    content
)

# Remove TopDonor interface
content = re.sub(r"interface TopDonor \{.*?\n\}\n", "", content, flags=re.DOTALL)

# Revert state and functions
pattern_state = r"  const \[topDonors.*?const handleToggleVisibility"
replacement_state = "  const handleToggleVisibility"
content = re.sub(pattern_state, replacement_state, content, flags=re.DOTALL)

# Revert fetchData
pattern_fetch = r"      const \[seilData, finData, donorsData\] = await Promise\.all\(\[\n        api\.getSeilPeriods\(\),\n        api\.getFinancialRecords\(''\),\n        api\.getTopDonors\(\)\n      \]\);\n      setSeils\(seilData\);\n      setFinancials\(finData\);\n      setTopDonors\(donorsData \|\| \[\]\);"
replacement_fetch = """      const [seilData, finData] = await Promise.all([
        api.getSeilPeriods(),
        // Pass empty string or handle fetch all in backend
        api.getFinancialRecords('')
      ]);
      setSeils(seilData);
      setFinancials(finData);"""
content = re.sub(pattern_fetch, replacement_fetch, content)

# Revert UI
pattern_ui = r"      \{\/\* Top Donors Section \*\/\}.*?      \{\/\* Password Modal \*\/\}"
replacement_ui = """      {/* Bar Chart */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none border border-gray-100 dark:border-slate-800 transition-colors">
        <h3 className="text-md font-bold text-gray-800 dark:text-slate-200 mb-4">{t('dashboard_chart_title')}</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={60} tickFormatter={(value) => `៛${value/1000}k`} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey={t('dashboard_income')} fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey={t('dashboard_expense')} fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none border border-gray-100 dark:border-slate-800 transition-colors">
        <h3 className="text-md font-bold text-gray-800 dark:text-slate-200 mb-2">{t('dashboard_pie_title')}</h3>
        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`៛ ${value.toLocaleString()}`, t('dashboard_amount')]}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      </div>
      
      {/* Password Modal */}"""
content = re.sub(pattern_ui, replacement_ui, content, flags=re.DOTALL)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)

