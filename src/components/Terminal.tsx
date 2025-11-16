import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Terminal as TerminalIcon, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TerminalProps {
  onExecute?: (command: string) => void;
  output?: string[];
  isExecuting?: boolean;
}

export const Terminal = ({ onExecute, output = [], isExecuting = false }: TerminalProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  const handleExecute = () => {
    if (input.trim() && onExecute) {
      onExecute(input);
      setInput('');
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: '250px' }}
          exit={{ height: 0 }}
          className="border-t border-border bg-terminal-bg flex flex-col"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <div className="flex items-center gap-2">
              <TerminalIcon className="w-4 h-4" />
              <span className="text-sm font-semibold">Terminal</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsVisible(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="p-3 font-mono text-xs space-y-1">
              {output.map((line, i) => (
                <div key={i} className="text-terminal-foreground">
                  {line}
                </div>
              ))}
              {isExecuting && (
                <div className="flex items-center gap-2 text-primary animate-pulse">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  Executing...
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-2 border-t border-border flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
              placeholder="Run code..."
              className="flex-1 bg-background px-3 py-1.5 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={isExecuting}
            />
            <Button
              size="sm"
              onClick={handleExecute}
              disabled={isExecuting || !input.trim()}
              className="gap-2"
            >
              <Play className="w-3 h-3" />
              Run
            </Button>
          </div>
        </motion.div>
      )}
      {!isVisible && (
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 gap-2"
          onClick={() => setIsVisible(true)}
        >
          <TerminalIcon className="w-4 h-4" />
          Show Terminal
        </Button>
      )}
    </AnimatePresence>
  );
};
