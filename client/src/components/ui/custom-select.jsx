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
      {/* Trigger - Using navbar-consistent styling */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="navbar-dropdown-trigger"
      >
        <span className={selectedLabel ? "" : "text-muted-foreground"}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown - Using navbar-consistent styling */}
      {isOpen && (
        <div className="navbar-dropdown-content">
          <div className="py-1">
            {React.Children.map(children, (child) => (
              <button
                key={child.props.value}
                type="button"
                onClick={() => handleOptionClick(child.props.value, child.props.children)}
                className="navbar-dropdown-item"
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
