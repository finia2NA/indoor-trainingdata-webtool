import React, { useState, useRef, useCallback } from 'react';

// Define the type for the props
type DraggableNumberInputProps = {
  value: number;
  // eslint-disable-next-line no-unused-vars
  setValue: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
};

// Apply the type to the component's props
const DraggableNumberInput: React.FC<DraggableNumberInputProps> = ({ value, setValue, step = 1, min, max }) => {
  // Check input values
  min = min ?? 0;
  max = max ?? 100;
  step = step ?? 1;

  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  // -------------------------
  // MOUSE EVENTS
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;
  }, [value]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const diff = startY.current - e.clientY;
      let newValue = startValue.current + diff * step;

      if (min !== undefined) newValue = Math.max(min, newValue);
      if (max !== undefined) newValue = Math.min(max, newValue);

      setValue(newValue);
    }
  }, [isDragging, setValue, step, min, max]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // -------------------------
  // RENDER
  return (
    <div className="relative w-24">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full px-2 py-1
        border rounded
        text-right
        focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div
        className="absolute inset-0 cursor-ns-resize select-none"
        onMouseDown={handleMouseDown}
      ></div>
    </div>
  );
};

export default DraggableNumberInput;