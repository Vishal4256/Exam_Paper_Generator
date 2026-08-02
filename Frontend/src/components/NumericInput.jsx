import React, { useState, useEffect } from 'react';

const NumericInput = ({
    value,
    onChange,
    onBlur,
    allowDecimal = false,
    min,
    max,
    placeholder,
    className,
    required = false,
    id,
    name
}) => {
    // We maintain internal state as a string to allow free typing (e.g. backspace to empty)
    const [localValue, setLocalValue] = useState(value === 0 || value === undefined ? '' : String(value));

    // Sync from props if value changes externally
    useEffect(() => {
        if (value === 0 && localValue === '') return; // Don't override if user cleared it
        if (value !== undefined && String(value) !== localValue && String(value) !== String(parseFloat(localValue || '0'))) {
            setLocalValue(value === 0 ? '' : String(value));
        }
    }, [value]);

    const handleKeyDown = (e) => {
        // Prevent negative numbers
        if (e.key === '-') {
            e.preventDefault();
        }
        // Prevent scientific notation characters
        if (e.key === 'e' || e.key === 'E' || e.key === '+') {
            e.preventDefault();
        }
        // Prevent decimal point if not allowed
        if (!allowDecimal && e.key === '.') {
            e.preventDefault();
        }
    };

    const handleChange = (e) => {
        const val = e.target.value;
        setLocalValue(val);
        
        // Pass the string value up, let parent decide how to handle it
        // If parent expects a number, they should handle '' correctly
        if (val === '') {
            onChange('');
        } else {
            const numVal = allowDecimal ? parseFloat(val) : parseInt(val, 10);
            if (!isNaN(numVal)) {
                onChange(numVal);
            } else {
                onChange('');
            }
        }
    };

    const handleBlur = (e) => {
        let val = localValue;
        if (val !== '') {
            let numVal = allowDecimal ? parseFloat(val) : parseInt(val, 10);
            if (!isNaN(numVal)) {
                if (min !== undefined && numVal < min) numVal = min;
                if (max !== undefined && numVal > max) numVal = max;
                setLocalValue(String(numVal));
                onChange(numVal);
            }
        }
        if (onBlur) {
            onBlur(e);
        }
    };

    return (
        <input
            id={id}
            name={name}
            type="number"
            inputMode={allowDecimal ? "decimal" : "numeric"}
            value={localValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder || (min !== undefined ? String(min) : "0")}
            min={min}
            max={max}
            className={className}
            required={required}
            onWheel={(e) => e.target.blur()} // Prevent scrolling from changing value unexpectedly
        />
    );
};

export default NumericInput;
