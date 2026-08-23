const fs = require('fs');
let content = fs.readFileSync('src/components/Records.tsx', 'utf8');

const targetLogic = `          let roofCategory = categories.find((c: any) => c.name === 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ');
          if (!roofCategory) {
            roofCategory = await api.createNameListCategory({
              name: 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ',
              description: 'បញ្ជីសប្បុរសជនចូលកសាងដំបូលព្រះវិហារ'
            });
          }`;

const replacementLogic = `          let roofCategory = categories.find((c: any) => c.name.includes('បញ្ជីឈ្មោះសប្បុរសជនចូលរួមកសាងដំបូលព្រះវិហារ'));
          if (!roofCategory) {
            roofCategory = await api.createNameListCategory({
              name: 'បញ្ជីឈ្មោះសប្បុរសជនចូលរួមកសាងដំបូលព្រះវិហារ',
              description: 'បញ្ជីសប្បុរសជនចូលកសាងដំបូលព្រះវិហារ'
            });
          }`;

const targetUI = `                  {/* High Level Budget Checkbox */}
                  {newRecordType === 'income' && (
                    <div className="flex items-center gap-3 p-4 mt-2 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                      <input 
                        type="checkbox" 
                        id="isHighLevel" 
                        checked={isHighLevel}
                        onChange={(e) => setIsHighLevel(e.target.checked)}
                        className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer"
                      />
                      <label htmlFor="isHighLevel" className="text-[14px] font-battambang font-bold text-orange-800 dark:text-orange-300 select-none cursor-pointer">
                        ✅ ថវិកាកម្រិតខ្ពស់
                      </label>
                    </div>
                  )}`;

const replacementUI = `                  {/* High Level Budget Checkbox */}
                  {newRecordType === 'income' && (
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                        <input 
                          type="checkbox" 
                          id="isHighLevel" 
                          checked={isHighLevel}
                          onChange={(e) => setIsHighLevel(e.target.checked)}
                          className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer"
                        />
                        <label htmlFor="isHighLevel" className="text-[14px] font-battambang font-bold text-orange-800 dark:text-orange-300 select-none cursor-pointer">
                          ✅ ថវិកាកម្រិតខ្ពស់
                        </label>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                        <input 
                          type="checkbox" 
                          id="addToRoofFund" 
                          checked={addToRoofFund}
                          onChange={(e) => setAddToRoofFund(e.target.checked)}
                          className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer"
                        />
                        <label htmlFor="addToRoofFund" className="text-[14px] font-battambang font-bold text-blue-800 dark:text-blue-300 select-none cursor-pointer">
                          ⛩️ បន្ថែមចូលបញ្ជីកសាងដំបូលព្រះវិហារ
                        </label>
                      </div>
                    </div>
                  )}`;

content = content.replace(targetLogic, replacementLogic);
content = content.replace(targetUI, replacementUI);

fs.writeFileSync('src/components/Records.tsx', content);
