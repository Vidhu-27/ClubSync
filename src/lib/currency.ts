export const RUPEE_SYMBOL = '₹‎'

export const formatInr = (value: number) => {
  const isNegative = value < 0
  const abs = Math.abs(value)
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(abs)
  // Ensure minus sign precedes the currency symbol and avoid double symbols
  return `${isNegative ? '-' : ''}${RUPEE_SYMBOL} ${formatted}`
}
