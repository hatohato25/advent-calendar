"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface AllowedDatesSelectorProps {
  dates: number[];
  onChange: (dates: number[]) => void;
}

/**
 * 許可日程選択コンポーネント
 * 1-25日のチェックボックスを5列グリッドで表示
 */
export function AllowedDatesSelector({ dates, onChange }: AllowedDatesSelectorProps) {
  const handleSelectAll = () => {
    onChange(Array.from({ length: 25 }, (_, i) => i + 1));
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  const handleToggle = (date: number) => {
    if (dates.includes(date)) {
      onChange(dates.filter((d) => d !== date));
    } else {
      onChange([...dates, date].sort((a, b) => a - b));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
          全選択
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll}>
          全解除
        </Button>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 25 }, (_, i) => i + 1).map((date) => (
          <div key={date} className="flex items-center space-x-2">
            <Checkbox
              id={`date-${date}`}
              checked={dates.includes(date)}
              onCheckedChange={() => handleToggle(date)}
            />
            <Label htmlFor={`date-${date}`} className="cursor-pointer text-sm">
              {date}日
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
