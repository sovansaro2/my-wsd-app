const fs = require('fs');
let content = fs.readFileSync('src/components/AccountProfile.tsx', 'utf8');

if (!content.includes("import PinPad from './PinPad';")) {
  content = content.replace("import { api }", "import PinPad from './PinPad';\nimport { api }");
}

const pinModalCode = `
      <>
        {showPinSetup && (
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowPinSetup(false);
                setPinSetupStep('enter_new');
                setTempNewPin('');
                setCurrentPin('');
                setPinSetupError('');
              }}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl pt-8 pb-10 px-4"
            >
              <PinPad
                title={pinSetupStep === 'verify_current' ? 'បញ្ជាក់ PIN ចាស់' : pinSetupStep === 'enter_new' ? 'កំណត់ PIN ថ្មី' : 'បញ្ជាក់ PIN ថ្មី'}
                subtitle={pinSetupStep === 'verify_current' ? 'សូមបញ្ចូល PIN ចាស់របស់អ្នក' : pinSetupStep === 'enter_new' ? 'សូមបញ្ចូល PIN ថ្មី ៤ ខ្ទង់' : 'សូមបញ្ចូល PIN ថ្មីម្ដងទៀត ដើម្បីបញ្ជាក់'}
                error={pinSetupError}
                onComplete={handlePinSetupComplete}
                onCancel={() => {
                  setShowPinSetup(false);
                  setPinSetupStep('enter_new');
                  setTempNewPin('');
                  setCurrentPin('');
                  setPinSetupError('');
                }}
                isLoading={isPinSettingLoading}
              />
            </motion.div>
          </div>
        )}
      </>
`;

if (!content.includes('showPinSetup &&')) {
  // Replace the last `    </div>\n  );\n}` with the modal and the closing tags
  content = content.replace(/    <\/div>\n  \);\n}\s*$/, pinModalCode + '    </div>\n  );\n}\n');
  fs.writeFileSync('src/components/AccountProfile.tsx', content);
  console.log("Patched AccountProfile.tsx successfully.");
} else {
  console.log("Already has showPinSetup modal.");
}
