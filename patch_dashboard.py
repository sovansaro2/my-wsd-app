import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Interface
content = re.sub(
    r"interface SeilPeriod \{.*?\n\}",
    "interface SeilPeriod {\n  id: string;\n  name: string;\n  start_date: string;\n  end_date: string;\n  previous_balance?: number;\n}\n\ninterface HundredKDonor {\n  id: string;\n  name: string;\n  amount: number;\n  category_name: string;\n}",
    content,
    flags=re.DOTALL
)

# State
content = re.sub(
    r"  const \[financials, setFinancials\] = useState<FinancialRecord\[\]>\(\[\]\);\n  const \[seils, setSeils\] = useState<SeilPeriod\[\]>\(\[\]\);",
    "  const [financials, setFinancials] = useState<FinancialRecord[]>([]);\n  const [seils, setSeils] = useState<SeilPeriod[]>([]);\n  const [hundredKDonors, setHundredKDonors] = useState<HundredKDonor[]>([]);",
    content
)

# FetchData
content = re.sub(
    r"      const \[seilData, finData\] = await Promise\.all\(\[\n        api\.getSeilPeriods\(\),\n        \/\/ Pass empty string or handle fetch all in backend\n        api\.getFinancialRecords\(''\)\n      \]\);\n      setSeils\(seilData\);\n      setFinancials\(finData\);",
    "      const [seilData, finData, hundredKData] = await Promise.all([\n        api.getSeilPeriods(),\n        api.getFinancialRecords(''),\n        api.get100kDonors()\n      ]);\n      setSeils(seilData);\n      setFinancials(finData);\n      setHundredKDonors(hundredKData || []);",
    content
)

ui_section = """
      {/* 100k+ Donors Section */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none border border-gray-100 dark:border-slate-800 transition-colors mt-8 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-md font-bold text-gray-800 dark:text-slate-200">សប្បុរសជន (១០០,០០០៛ ឡើង)</h3>
          </div>
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
            {hundredKDonors.length} រូប
          </span>
        </div>
        
        <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
          {hundredKDonors.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">
              មិនទាន់មានទិន្នន័យនៅឡើយទេ
            </div>
          ) : (
            hundredKDonors.map((donor, index) => (
              <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {index + 1}
                  </span>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white text-left block leading-tight">{donor.name}</span>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      {donor.category_name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {isAmountVisible ? `៛ ${donor.amount.toLocaleString()}` : '៛ ***'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
"""

content = re.sub(
    r"      \{\/\* Pie Chart \*\/\}.*?<\/div>.*?<\/div>.*?<\/div>",
    "      {/* Pie Chart */}" + re.search(r"      \{\/\* Pie Chart \*\/\}.*?<\/div>.*?<\/div>.*?<\/div>", content, flags=re.DOTALL).group(0)[22:] + "\n" + ui_section + "\n      </div>",
    content,
    flags=re.DOTALL
)

# Ensure Award is imported from lucide-react
content = re.sub(
    r"import \{ TrendingUp, TrendingDown, DollarSign, Wallet, Eye, EyeOff, X, Key \} from 'lucide-react';",
    "import { TrendingUp, TrendingDown, DollarSign, Wallet, Eye, EyeOff, X, Key, Award } from 'lucide-react';",
    content
)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
