export type Confidence = 'high' | 'medium' | 'low' | null

export function getFieldBadge(confidence: Confidence): {
  label: string
  className: string
} | null {
  if (!confidence) return null
  if (confidence === 'high') {
    return {
      label: 'AI filled',
      className:
        'rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700',
    }
  }
  if (confidence === 'medium') {
    return {
      label: 'Please verify',
      className:
        'rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700',
    }
  }
  return {
    label: 'Check this',
    className:
      'rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600',
  }
}

export function getBorderClass(confidence: Confidence): string {
  if (confidence === 'high') return 'border-green-300 bg-green-50/30'
  if (confidence === 'medium') return 'border-amber-300 bg-amber-50/30'
  if (confidence === 'low') return 'border-red-300 bg-red-50/30'
  return 'border-gray-200'
}
