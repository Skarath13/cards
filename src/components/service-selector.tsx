'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Edit3 } from 'lucide-react'

interface ServiceSelection {
  tier1?: string
  tier2?: string
  tier3?: string
}

interface ServiceSelectorProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ServiceSelector({ value, onChange, disabled }: ServiceSelectorProps) {
  const [selection, setSelection] = useState<ServiceSelection>({})
  const [currentTier, setCurrentTier] = useState<1 | 2 | 3>(1)
  const [isSelecting, setIsSelecting] = useState(false)

  // Parse value on mount and when value changes
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value)
        setSelection(parsed)
        setCurrentTier(1)
      } catch {
        // If not JSON, treat as legacy text
        setSelection({})
        setCurrentTier(1)
      }
    } else {
      setSelection({})
      setCurrentTier(1)
    }
  }, [value])

  const tier1Options = ['Full Set', 'Refill', 'Other']
  const tier2Options = {
    'Full Set': ['Natural', 'Elegant', 'Mega'],
    'Refill': ['Natural', 'Elegant', 'Mega'],
    'Other': ['Removal', 'Bottom Set', 'Demi Set']
  }
  const tier3Options = ['1-7', '7-14', '15-28']

  const handleTier1Select = (option: string) => {
    const newSelection = { tier1: option }
    setSelection(newSelection)
    setCurrentTier(2)
  }

  const handleTier2Select = (option: string) => {
    const newSelection = { ...selection, tier2: option }
    setSelection(newSelection)

    // If refill path, show tier 3, otherwise finalize
    if (selection.tier1 === 'Refill') {
      setCurrentTier(3)
    } else {
      finalizeSelection(newSelection)
    }
  }

  const handleTier3Select = (option: string) => {
    const newSelection = { ...selection, tier3: option }
    setSelection(newSelection)
    finalizeSelection(newSelection)
  }

  const finalizeSelection = (finalSelection: ServiceSelection) => {
    onChange(JSON.stringify(finalSelection))
    setIsSelecting(false)
    setCurrentTier(1)
  }

  const handleUntoggle = () => {
    if (currentTier === 3) {
      setSelection({ ...selection, tier3: undefined })
      setCurrentTier(3)
    } else if (currentTier === 2) {
      setSelection({ tier1: selection.tier1 })
      setCurrentTier(2)
    } else {
      setSelection({})
      setCurrentTier(1)
    }
  }

  const resetSelection = () => {
    setSelection({})
    setCurrentTier(1)
    setIsSelecting(true)
  }

  const getDisplayText = () => {
    if (!selection.tier1) return ''

    const parts = [selection.tier1]
    if (selection.tier2) parts.push(selection.tier2)
    if (selection.tier3) parts.push(selection.tier3)

    return parts.join(' → ')
  }

  const getColorClass = (tier: number) => {
    switch (tier) {
      case 1: return 'bg-blue-100 text-blue-800 border-blue-200'
      case 2: return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 3: return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (disabled) {
    return (
      <div className="min-h-[44px] flex items-center">
        {selection.tier1 ? (
          <div className="flex flex-wrap gap-1">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getColorClass(1)}`}>
              {selection.tier1}
            </span>
            {selection.tier2 && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getColorClass(2)}`}>
                {selection.tier2}
              </span>
            )}
            {selection.tier3 && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getColorClass(3)}`}>
                {selection.tier3}
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">Service</span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Current Selection Display */}
      <div
        className="min-h-[44px] border rounded-md p-2 cursor-pointer hover:bg-gray-50 flex items-center"
        onClick={() => setIsSelecting(true)}
      >
        {selection.tier1 ? (
          <div className="flex flex-wrap gap-1 w-full">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getColorClass(1)}`}>
              {selection.tier1}
            </span>
            {selection.tier2 && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getColorClass(2)}`}>
                {selection.tier2}
              </span>
            )}
            {selection.tier3 && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getColorClass(3)}`}>
                {selection.tier3}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                resetSelection()
              }}
              className="text-gray-500 hover:text-gray-700 ml-auto p-1 hover:bg-gray-100 rounded"
            >
              <Edit3 className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">Select Service</span>
        )}
      </div>

      {/* Selection Interface */}
      {isSelecting && (
        <div className="border rounded-md p-3 bg-white shadow-sm">
          {currentTier === 1 && (
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Select Service Type:</div>
              <div className="flex gap-2 flex-wrap">
                {tier1Options.map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTier1Select(option)}
                    className={`${getColorClass(1)} hover:opacity-80`}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {currentTier === 2 && selection.tier1 && (
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">
                Select {selection.tier1} Type:
              </div>
              <div className="flex gap-2 flex-wrap mb-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getColorClass(1)}`}>
                  {selection.tier1}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {tier2Options[selection.tier1 as keyof typeof tier2Options]?.map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTier2Select(option)}
                    className={`${getColorClass(2)} hover:opacity-80`}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUntoggle}
                className="mt-2 text-xs text-gray-500"
              >
                ← Back
              </Button>
            </div>
          )}

          {currentTier === 3 && selection.tier1 === 'Refill' && selection.tier2 && (
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">
                Select Timeline:
              </div>
              <div className="flex gap-2 flex-wrap mb-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getColorClass(1)}`}>
                  {selection.tier1}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getColorClass(2)}`}>
                  {selection.tier2}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {tier3Options.map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTier3Select(option)}
                    className={`${getColorClass(3)} hover:opacity-80`}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUntoggle}
                className="mt-2 text-xs text-gray-500"
              >
                ← Back
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSelecting(false)}
            className="mt-2 text-xs text-gray-500"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}