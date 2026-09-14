const KHMER_DIGITS = ['', 'មួយ', 'ពីរ', 'បី', 'បួន', 'ប្រាំ', 'ប្រាំមួយ', 'ប្រាំពីរ', 'ប្រាំបី', 'ប្រាំបួន'];
const KHMER_TENS = ['', 'ដប់', 'ម្ភៃ', 'សាមសិប', 'សែសិប', 'ហាសិប', 'ហុកសិប', 'ចិតសិប', 'ប៉ែតសិប', 'កៅសិប'];

export function khmerNumberToWords(num: number): string {
  if (num === 0) return 'សូន្យរៀលគត់';
  if (num < 0) return 'ដក ' + khmerNumberToWords(Math.abs(num));

  const n = Math.floor(num);

  function convertGroup(val: number): string {
    let res = '';
    const hundred = Math.floor(val / 100);
    const remainder = val % 100;

    if (hundred > 0) {
      res += KHMER_DIGITS[hundred] + 'រយ';
    }

    if (remainder > 0) {
      const ten = Math.floor(remainder / 10);
      const unit = remainder % 10;
      if (ten > 0) {
        res += KHMER_TENS[ten];
      }
      if (unit > 0) {
        res += KHMER_DIGITS[unit];
      }
    }
    return res;
  }

  let result = '';
  const billion = Math.floor(n / 1000000000);
  let rem = n % 1000000000;

  const million = Math.floor(rem / 1000000);
  rem = rem % 1000000;

  const hundredThousand = Math.floor(rem / 100000);
  rem = rem % 100000;

  const tenThousand = Math.floor(rem / 10000);
  rem = rem % 10000;

  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  if (billion > 0) {
    result += convertGroup(billion) + 'ពាន់លាន';
  }

  if (million > 0) {
    result += convertGroup(million) + 'លាន';
  }

  if (hundredThousand > 0) {
    result += KHMER_DIGITS[hundredThousand] + 'សែន';
  }

  if (tenThousand > 0) {
    result += KHMER_DIGITS[tenThousand] + 'ម៉ឺន';
  }

  if (thousand > 0) {
    result += KHMER_DIGITS[thousand] + 'ពាន់';
  }

  if (rem > 0) {
    result += convertGroup(rem);
  }

  return (result + 'រៀលគត់').trim();
}
