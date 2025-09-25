import React, { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Input } from './input';
import { Resizable } from 're-resizable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Calculator as CalculatorIcon } from 'lucide-react';

interface CalculatorProps {
  onClose: () => void;
}

const Calculator = forwardRef<HTMLDivElement, CalculatorProps>(({ onClose }, ref) => {
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
    <motion.div ref={ref} drag>
      <Resizable
        defaultSize={{
          width: 280,
          height: 420,
        }}
        minWidth={240}
        minHeight={380}
        className="bg-gray-100 rounded-lg shadow-lg flex flex-col"
      >
        <DialogHeader className="bg-blue-600 text-white p-2 rounded-t-lg flex justify-between items-center cursor-move">
          <DialogTitle>Calculator</DialogTitle>
          <Button variant="ghost" size="icon" className="text-white" onClick={onClose}>
            &times;
          </Button>
        </DialogHeader>
        <div className="p-2 bg-white flex-grow">
          <Input type="text" readOnly value={display} className="text-right text-2xl mb-2" />
          <Input type="text" readOnly value={currentValue !== null ? `${currentValue} ${operator || ''}` : ''} className="text-right text-gray-500" />
        </div>
        <div className="grid grid-cols-5 gap-2 p-2 bg-gray-200">
          <Button onClick={handleMemoryClear}>MC</Button>
          <Button onClick={handleMemoryRecall}>MR</Button>
          <Button onClick={handleMemoryStore}>MS</Button>
          <Button onClick={handleMemoryAdd}>M+</Button>
          <Button onClick={handleMemorySubtract}>M-</Button>

          <Button onClick={() => setDisplay(display.slice(0, -1) || '0')} variant="destructive">
            &larr;
          </Button>
          <Button onClick={handleClearClick} variant="destructive">C</Button>
          <Button onClick={() => handleSpecialFunction('+/-')} variant="destructive">+/-</Button>
          <Button onClick={() => handleSpecialFunction('sqrt')}>√</Button>
          <Button onClick={() => handleDigitClick('7')}>7</Button>
          <Button onClick={() => handleDigitClick('8')}>8</Button>
          <Button onClick={() => handleDigitClick('9')}>9</Button>
          <Button onClick={() => handleOperatorClick('/')}>/</Button>
          <Button onClick={() => handleSpecialFunction('%')}>%</Button>
          <Button onClick={() => handleDigitClick('4')}>4</Button>
          <Button onClick={() => handleDigitClick('5')}>5</Button>
          <Button onClick={() => handleDigitClick('6')}>6</Button>
          <Button onClick={() => handleOperatorClick('*')}>*</Button>
          <Button onClick={() => handleSpecialFunction('1/x')}>1/x</Button>
          <Button onClick={() => handleDigitClick('1')}>1</Button>
          <Button onClick={() => handleDigitClick('2')}>2</Button>
          <Button onClick={() => handleDigitClick('3')}>3</Button>
          <Button onClick={() => handleOperatorClick('-')}>-</Button>
          <Button onClick={handleEqualsClick} className="row-span-2 bg-green-500 hover:bg-green-600">
            =
          </Button>
          <Button onClick={() => handleDigitClick('0')} className="col-span-2">0</Button>
          <Button onClick={() => setDisplay(display.includes('.') ? display : display + '.')}>.</Button>
          <Button onClick={() => handleOperatorClick('+')}>+</Button>
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
      <DialogContent className="p-0 bg-transparent border-0">
        <Calculator onClose={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default Calculator;