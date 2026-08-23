import re

with open('src/components/Records.tsx', 'r') as f:
    content = f.read()

# Make sure we reset states when opening the Add Modal
open_modal_hook = """                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-10 h-10 flex items-center justify-center bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors shadow-sm focus:outline-none\""""

new_open_modal = """                <button 
                  onClick={() => {
                    setNewRecordType('income');
                    setNewDescription('');
                    setNewAmount('');
                    setNewNote('');
                    setNewDate(new Date().toISOString().split('T')[0]);
                    setNewNotifyPublic(false);
                    setAddToRoofFund(false);
                    setIsHighLevel(false);
                    setIsAddModalOpen(true);
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors shadow-sm focus:outline-none\""""

content = content.replace(open_modal_hook, new_open_modal)

with open('src/components/Records.tsx', 'w') as f:
    f.write(content)
