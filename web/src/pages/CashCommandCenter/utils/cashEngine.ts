export const denominations = {
  notes: [500, 200, 100, 50, 20, 10],
  coins: [20, 10, 5, 2, 1],
};

export const calculateDenominationTotals = (
  notes: Record<number, number | string>,
  coins: Record<number, number | string>
) => {
  let notesTotal = 0;
  let notesCount = 0;
  for (const [val, qty] of Object.entries(notes)) {
    const numQty = qty === '' ? 0 : Number(qty);
    if (numQty > 0) {
      notesTotal += Number(val) * numQty;
      notesCount += numQty;
    }
  }

  let coinsTotal = 0;
  let coinsCount = 0;
  for (const [val, qty] of Object.entries(coins)) {
    const numQty = qty === '' ? 0 : Number(qty);
    if (numQty > 0) {
      coinsTotal += Number(val) * numQty;
      coinsCount += numQty;
    }
  }

  return { notesTotal, notesCount, coinsTotal, coinsCount, cashTotal: notesTotal + coinsTotal, totalPieces: notesCount + coinsCount };
};

export const calculateGrandTotal = (
  cashTotal: number,
  onlineAmount: number,
  manualAddition: number,
  manualDeduction: number
) => {
  return cashTotal + onlineAmount + manualAddition - manualDeduction;
};

// Simple Number to Indian Words converter
export const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero Rupees Only';
  if (num < 0) return 'Negative Amount';

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else {
      str += a[n];
    }
    return str.trim();
  };

  let word = '';
  let crore = Math.floor(num / 10000000);
  num %= 10000000;
  let lakh = Math.floor(num / 100000);
  num %= 100000;
  let thousand = Math.floor(num / 1000);
  num %= 1000;
  let hundred = Math.floor(num / 100);
  num %= 100;

  if (crore > 0) word += inWords(crore) + ' Crore ';
  if (lakh > 0) word += inWords(lakh) + ' Lakh ';
  if (thousand > 0) word += inWords(thousand) + ' Thousand ';
  if (hundred > 0) word += inWords(hundred) + ' Hundred ';
  
  if (num > 0) {
    if (word !== '') word += 'and ';
    word += inWords(num);
  }

  return word.trim() + ' Rupees Only';
};

export const formatIndianCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};
