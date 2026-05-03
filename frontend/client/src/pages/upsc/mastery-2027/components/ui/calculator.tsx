import React, { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Input } from './input';
import { Resizable } from 're-resizable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Calculator as CalculatorIcon } from 'lucide-react';

interface CalculatorProps {
  onClose?: () => void;
}

export const Calculator = forwardRef<HTMLDivElement, CalculatorProps>(({ onClose }, ref) => {
  const [display, setDisplay] = useState('0');
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [memory, setMemory] = useState<number>(0);

  const handleDigitClick = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const handleOperatorClick = (op: string) => {
    const inputValue = parseFloat(display);
    if (currentValue === null) {
      setCurrentValue(inputValue);
    } else if (operator) {
      const result = performCalculation();
      setCurrentValue(result);
      setDisplay(String(result));
    }
    setWaitingForOperand(true);
    setOperator(op);
  };

  const performCalculation = (): number => {
    const inputValue = parseFloat(display);
    if (currentValue === null || !operator) return inputValue;

    switch (operator) {
      case '+':
        return currentValue + inputValue;
      case '-':
        return currentValue - inputValue;
      case '*':
        return currentValue * inputValue;
      case '/':
        return currentValue / inputValue;
      default:
        return inputValue;
    }
  };

  const handleEqualsClick = () => {
    if (!operator) return;
    const result = performCalculation();
    setDisplay(String(result));
    setCurrentValue(result);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleClearClick = () => {
    setDisplay('0');
    setCurrentValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleMemoryClear = () => setMemory(0);
  const handleMemoryRecall = () => setDisplay(String(memory));
  const handleMemoryStore = () => setMemory(parseFloat(display));
  const handleMemoryAdd = () => setMemory(memory + parseFloat(display));
  const handleMemorySubtract = () => setMemory(memory - parseFloat(display));

  const handleSpecialFunction = (func: string) => {
    const value = parseFloat(display);
    switch (func) {
      case 'sqrt':
        setDisplay(String(Math.sqrt(value)));
        break;
      case '+/-':
        setDisplay(String(value * -1));
        break;
      case '%':
        setDisplay(String(value / 100));
        break;
      case '1/x':
        setDisplay(String(1 / value));
        break;
    }
  };

  return (
    <motion.div ref={ref} drag whileDrag={{ scale: 1.02 }} dragMomentum={false} className="fixed bottom-24 right-5 z-50">
      <Resizable
        defaultSize={{
          width: 280,
          height: 'auto',
        }}
        minWidth={240}
        className="bg-card rounded-lg shadow-lg flex flex-col border border-border"
      >
        <div className="bg-muted/50 p-2 rounded-t-lg flex justify-between items-center cursor-move">
          <h3 className="text-sm font-semibold text-foreground">Calculator</h3>
          {onClose && (
            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={onClose}>
              &times;
            </Button>
          )}
        </div>
        <div className="p-2 flex-grow">
          <Input type="text" readOnly value={display} className="text-right text-2xl mb-2 h-12" />
          <Input type="text" readOnly value={currentValue !== null ? `${currentValue} ${operator || ''}` : ''} className="text-right text-muted-foreground h-8" />
        </div>
        <div className="p-2 bg-muted/20">
          <div className="grid grid-cols-5 gap-1 mb-2">
            <Button variant="outline" onClick={handleMemoryClear}>MC</Button>
            <Button variant="outline" onClick={handleMemoryRecall}>MR</Button>
            <Button variant="outline" onClick={handleMemoryStore}>MS</Button>
            <Button variant="outline" onClick={handleMemoryAdd}>M+</Button>
            <Button variant="outline" onClick={handleMemorySubtract}>M-</Button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            <Button onClick={() => handleSpecialFunction('%')} variant="secondary">%</Button>
            <Button onClick={() => setDisplay('0')} variant="secondary">CE</Button>
            <Button onClick={handleClearClick} variant="destructive">C</Button>
            <Button onClick={() => setDisplay(display.slice(0, -1) || '0')} variant="secondary">&larr;</Button>

            <Button onClick={() => handleSpecialFunction('1/x')} variant="secondary">1/x</Button>
            <Button onClick={() => handleSpecialFunction('sqrt')} variant="secondary">√</Button>
            <Button onClick={() => handleSpecialFunction('+/-')} variant="secondary">+/-</Button>
            <Button onClick={() => handleOperatorClick('/')} variant="secondary">/</Button>

            <Button onClick={() => handleDigitClick('7')}>7</Button>
            <Button onClick={() => handleDigitClick('8')}>8</Button>
            <Button onClick={() => handleDigitClick('9')}>9</Button>
            <Button onClick={() => handleOperatorClick('*')} variant="secondary">*</Button>

            <Button onClick={() => handleDigitClick('4')}>4</Button>
            <Button onClick={() => handleDigitClick('5')}>5</Button>
            <Button onClick={() => handleDigitClick('6')}>6</Button>
            <Button onClick={() => handleOperatorClick('-')} variant="secondary">-</Button>

            <Button onClick={() => handleDigitClick('1')}>1</Button>
            <Button onClick={() => handleDigitClick('2')}>2</Button>
            <Button onClick={() => handleDigitClick('3')}>3</Button>
            <Button onClick={() => handleOperatorClick('+')} variant="secondary">+</Button>

            <Button onClick={() => handleDigitClick('0')} className="col-span-2">0</Button>
            <Button onClick={() => setDisplay(display.includes('.') ? display : display + '.')}>.</Button>
            <Button onClick={handleEqualsClick} className="bg-primary text-primary-foreground hover:bg-primary/90">=</Button>
          </div>
        </div>
      </Resizable>
    </motion.div>
  );
});

export const CalculatorDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <CalculatorIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 bg-transparent border-0 w-auto">
        <Calculator onClose={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};
