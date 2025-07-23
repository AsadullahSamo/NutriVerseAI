import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export function CustomSelect({ value, onValueChange, placeholder, children, className = "" }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState("")
  const selectRef = useRef(null)

  // Find the selected option's label
  useEffect(() => {
    if (value && children) {
      const options = React.Children.toArray(children)
      const selectedOption = options.find(child => child.props.value === value)
      if (selectedOption) {
        setSelectedLabel(selectedOption.props.children)
      }
    }
  }, [value, children])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleOptionClick = (optionValue, optionLabel) => {
    onValueChange(optionValue)
    setSelectedLabel(optionLabel)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent flex items-center justify-between hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <span className={selectedLabel ? "" : "text-muted-foreground"}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-input rounded-md shadow-lg">
          <div className="py-1 max-h-60 overflow-auto">
            {React.Children.map(children, (child) => (
              <button
                key={child.props.value}
                type="button"
                onClick={() => handleOptionClick(child.props.value, child.props.children)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer focus:outline-none focus:bg-accent focus:text-accent-foreground"
              >
                {child.props.children}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function CustomSelectItem({ value, children }) {
  // This is just a placeholder component for the children
  return null
}
