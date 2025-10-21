import { Check, X } from "lucide-react";
import { useEffect } from "react";

interface AddSuccessToastProps {
  productName: string;
  onClose: () => void;
}

export function AddSuccessToast({ productName, onClose }: AddSuccessToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 z-50">
      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
        <Check className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-medium">添加成功</p>
        <p className="text-xs text-gray-500">已将 {productName} 添加到采购清单</p>
      </div>
      <button 
        className="ml-2 text-gray-400 hover:text-gray-500"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
} 