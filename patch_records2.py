import re

with open('src/components/Records.tsx', 'r') as f:
    content = f.read()

new_funcs = """  const openAddSeilModal = () => {
    setSeilName('');
    setSeilDateRange('');
    setSeilPreviousBalance('');
    setEditingSeil(null);
    setIsSeilModalOpen(true);
  };

  const openEditSeilModal = (seil: SeilPeriod, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSeil(seil);
    setSeilName(seil.name);
    setSeilDateRange(seil.date_range_text || '');
    setSeilPreviousBalance(seil.previous_balance ? seil.previous_balance.toString() : '');
    setIsEditSeilModalOpen(true);
  };

  const saveSeil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seilName) return;
    setIsSavingSeil(true);
    try {
      const data = await api.createSeilPeriod({ name: seilName, date_range_text: seilDateRange || null, previous_balance: parseFloat(seilPreviousBalance || '0') });
      setIsSeilModalOpen(false);
      await fetchPeriods();
      if (data) setSelectedPeriod(data);
    } catch (error) {
      console.error('Error saving seil:', error);
    } finally {
      setIsSavingSeil(false);
    }
  };

  const handleUpdateSeil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeil || !seilName) return;
    setIsSavingSeil(true);
    try {
      const data = await api.updateSeilPeriod(editingSeil.id, { 
        name: seilName, 
        date_range_text: seilDateRange || null, 
        previous_balance: parseFloat(seilPreviousBalance || '0') 
      });
      setIsEditSeilModalOpen(false);
      await fetchPeriods();
      if (data && selectedPeriod?.id === editingSeil.id) {
         setSelectedPeriod(data);
      }
    } catch (err) {
      console.error('Error updating seil:', err);
    } finally {
      setIsSavingSeil(false);
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {"""

content = content.replace("  const handleSaveRecord = async (e: React.FormEvent) => {", new_funcs, 1)

with open('src/components/Records.tsx', 'w') as f:
    f.write(content)

