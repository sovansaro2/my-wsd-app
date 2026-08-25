const fs = require('fs');
let content = fs.readFileSync('src/components/PinPad.tsx', 'utf8');

content = content.replace(
  `onCancel?: () => void;`,
  `onCancel?: () => void;
  onForgotPin?: () => void;`
);

content = content.replace(
  `export default function PinPad({ title, subtitle, error, onComplete, onCancel, isLoading }: PinPadProps) {`,
  `export default function PinPad({ title, subtitle, error, onComplete, onCancel, onForgotPin, isLoading }: PinPadProps) {`
);

content = content.replace(
  `<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-battambang">{title}</h2>`,
  `<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-battambang">{title}</h2>
        {onForgotPin && (
          <button 
            onClick={onForgotPin}
            className="absolute top-4 right-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline font-battambang"
          >
            ភ្លេច PIN?
          </button>
        )}`
);

content = content.replace(
  `<div className="text-center mb-8">`,
  `<div className="text-center mb-8 relative w-full flex flex-col items-center">`
);

fs.writeFileSync('src/components/PinPad.tsx', content);
