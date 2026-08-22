import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Add state for roofFundTotal
state_pattern = r"  const \[hundredKDonors, setHundredKDonors\] = useState<HundredKDonor\[\]>\(\[\]\);"
state_replacement = """  const [hundredKDonors, setHundredKDonors] = useState<HundredKDonor[]>([]);
  const [roofFundTotal, setRoofFundTotal] = useState<number>(0);"""
content = re.sub(state_pattern, state_replacement, content)

# Modify fetchData to fetch roof fund
fetch_pattern = r"        api\.get100kDonors\(\)\n      \]\);"
fetch_replacement = """        api.get100kDonors(),
        api.getNameListCategories()
      ]);"""
content = re.sub(fetch_pattern, fetch_replacement, content)

fetch_process_pattern = r"      const \[seilData, finData, hundredKData\] = await Promise\.all\(\[[\s\S]*?\]\);\n\n      setSeils\(seilData\);\n      setFinancials\(finData\);\n      setHundredKDonors\(hundredKData \|\| \[\]\);"
fetch_process_replacement = """      const [seilData, finData, hundredKData, categoriesData] = await Promise.all([
        api.getSeilPeriods(),
        api.getFinancialRecords(''),
        api.get100kDonors(),
        api.getNameListCategories()
      ]);

      setSeils(seilData);
      setFinancials(finData);
      setHundredKDonors(hundredKData || []);
      
      let rft = 0;
      if (categoriesData && categoriesData.length > 0) {
        const roofCat = categoriesData.find((c: any) => c.name === 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ');
        if (roofCat) {
          const roofRecords = await api.getNameListRecords(roofCat.id);
          rft = roofRecords.reduce((sum: number, r: any) => sum + r.amount, 0);
        }
      }
      setRoofFundTotal(rft);"""
content = re.sub(fetch_process_pattern, fetch_process_replacement, content)

# Inject the prominent card before KPI grid
kpi_grid_pattern = r"      \{\/\* KPI Grid \*\/\}\n      <div className=\"grid grid-cols-2 gap-3\">"
kpi_grid_replacement = """      {/* Prominent Roof Fund Card */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-xl shadow-orange-500/20 p-5 mb-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute left-0 bottom-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-10 -mb-10"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-orange-50 mb-1">
              <span className="text-xl">🏗️</span>
              <h3 className="text-sm font-bold opacity-90">ថវិកាកសាងដំបូលព្រះវិហារសរុប</h3>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-1">
              {isAmountVisible ? `៛ ${roofFundTotal.toLocaleString()}` : '៛ ***'}
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
            <span className="text-xs font-bold text-white uppercase tracking-wider">គម្រោងធំ</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">"""
content = re.sub(kpi_grid_pattern, kpi_grid_replacement, content)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
