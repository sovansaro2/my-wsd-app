const fs = require('fs');
let content = fs.readFileSync('src/components/AccountProfile.tsx', 'utf8');

const pinMethods = `
  const handlePinSetupComplete = async (pin: string) => {
    if (pinSetupStep === 'verify_current') {
      try {
        setIsPinSettingLoading(true);
        setPinSetupError('');
        await api.verifyBalancePin(pin);
        setCurrentPin(pin);
        setPinSetupStep('enter_new');
      } catch (err: any) {
        setPinSetupError(err.message || 'PIN បច្ចុប្បន្នមិនត្រឹមត្រូវ');
      } finally {
        setIsPinSettingLoading(false);
      }
    } else if (pinSetupStep === 'enter_new') {
      setTempNewPin(pin);
      setPinSetupStep('confirm_new');
    } else if (pinSetupStep === 'confirm_new') {
      if (pin !== tempNewPin) {
        setPinSetupError('PIN មិនដូចគ្នា');
        setPinSetupStep('enter_new');
        setTempNewPin('');
        return;
      }
      
      try {
        setIsPinSettingLoading(true);
        setPinSetupError('');
        
        if (currentPin) {
          await api.updateBalancePin(pin, currentPin);
        } else if (authPassword) {
          await api.resetBalancePin(pin, authPassword);
        } else {
          await api.updateBalancePin(pin);
        }
        
        setHasBalancePin(true);
        setShowPinSetup(false);
        setMessage({ type: 'success', text: 'បានកំណត់ PIN ដោយជោគជ័យ' });
        setAuthPassword('');
        setCurrentPin('');
      } catch (err: any) {
        setPinSetupError(err.message || 'មានបញ្ហាក្នុងការកំណត់ PIN');
      } finally {
        setIsPinSettingLoading(false);
      }
    }
  };
`;

content = content.replace(
  `const fetchProfile = async () => {`,
  `${pinMethods}\n\n  const fetchProfile = async () => {`
);

fs.writeFileSync('src/components/AccountProfile.tsx', content);
