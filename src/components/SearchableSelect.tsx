import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X, Loader2 } from "lucide-react";

export interface SearchableOption {
  value: string | number;
  label: string;
  sublabel?: string;
  code?: string;
  badge?: string;
  badgeColor?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string | number;
  onChange: (val: any, selectedOption?: SearchableOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  loading?: boolean;
  noDataText?: string;
  icon?: React.ReactNode;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "-- เลือกรายการ --",
  searchPlaceholder = "พิมพ์เพื่อค้นหา...",
  disabled = false,
  required = false,
  className = "",
  loading = false,
  noDataText = "ไม่พบข้อมูลที่ค้นหา",
  icon
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const filteredOptions = options.filter((opt) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.code && opt.code.toLowerCase().includes(q)) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
      (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        const opt = filteredOptions[highlightedIndex];
        onChange(opt.value, opt);
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl border transition-all text-left bg-white cursor-pointer select-none shadow-2xs ${
          disabled
            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            : isOpen
            ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-sm"
            : "border-slate-300 hover:border-slate-400 text-slate-800"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden mr-1">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          {selectedOption ? (
            <div className="flex items-center gap-1.5 truncate">
              {selectedOption.code && (
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                  {selectedOption.code}
                </span>
              )}
              <span className="font-bold text-slate-800 truncate">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-slate-400 text-[11px] truncate hidden sm:inline">
                  ({selectedOption.sublabel})
                </span>
              )}
              {selectedOption.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${
                    selectedOption.badgeColor || "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 italic">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedOption && !required && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="ล้างค่าที่เลือก"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isOpen ? "rotate-180 text-emerald-600" : ""}`} />
        </div>
      </button>

      {/* Hidden input for HTML form validation */}
      {required && (
        <input
          type="text"
          value={value ? String(value) : ""}
          onChange={() => {}}
          required
          tabIndex={-1}
          className="opacity-0 absolute inset-0 h-full w-full -z-10 pointer-events-none"
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-[9999] overflow-hidden animate-in fade-in duration-100 flex flex-col max-h-[300px]">
          {/* Search Box Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400 py-1"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto p-1 divide-y divide-slate-50 flex-1">
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>กำลังโหลดข้อมูล...</span>
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    onClick={() => {
                      onChange(opt.value, opt);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer border ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200 font-bold"
                        : isHighlighted
                        ? "bg-slate-100/90 text-slate-900 border-slate-200"
                        : "text-slate-700 hover:bg-slate-50 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {opt.code && (
                        <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                          {opt.code}
                        </span>
                      )}
                      <div className="truncate">
                        <div className="font-semibold text-slate-800 truncate">{opt.label}</div>
                        {opt.sublabel && (
                          <div className="text-[10px] text-slate-400 truncate">{opt.sublabel}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                            opt.badgeColor || "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 italic">
                {noDataText}
              </div>
            )}
          </div>

          {/* Footer count indicator */}
          <div className="px-3 py-1 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center font-mono">
            <span>ผลลัพธ์: {filteredOptions.length} รายการ</span>
            <span>กด Enter เพื่อเลือก</span>
          </div>
        </div>
      )}
    </div>
  );
}
