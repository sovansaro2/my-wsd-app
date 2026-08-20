const fs = require('fs');
let code = fs.readFileSync('src/components/ManageFinancialRecords.tsx', 'utf8');

const editLogic = `
  const openEditSeilModal = () => {
    if (!selectedPeriod) return;
    setEditingSeil(selectedPeriod);
    setSeilName(selectedPeriod.name);
    setSeilDateRange(selectedPeriod.date_range_text || '');
    setSeilPreviousBalance(selectedPeriod.previous_balance.toString());
    setIsEditSeilModalOpen(true);
  };

  const handleUpdateSeil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeil || !seilName) return;
    setIsSaving(true);
    try {
      const data = await api.updateSeilPeriod(editingSeil.id, {
        name: seilName,
        date_range_text: seilDateRange || null,
        previous_balance: parseFloat(seilPreviousBalance || '0')
      });
      setIsEditSeilModalOpen(false);
      await fetchPeriods();
      if (data) setSelectedPeriod(data);
    } catch (err) {
      console.error('Error updating seil:', err);
    } finally {
      setIsSaving(false);
    }
  };
`;

code = code.replace(
  "const saveSeil = async (e: React.FormEvent) => {",
  editLogic + "\n  const saveSeil = async (e: React.FormEvent) => {"
);

fs.writeFileSync('src/components/ManageFinancialRecords.tsx', code);
