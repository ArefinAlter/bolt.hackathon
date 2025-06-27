import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

export function StatCard({
  title,
  value,
  description,
  trend,
  icon,
  className,
  isLoading = false,
}: StatCardProps) {
  return (
    <Card className={cn("border-0 shadow-md overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {isLoading ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-bold mt-1">{value}</p>
            )}
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
            {trend && !isLoading && (
              <div className="flex items-center mt-2">
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  )}
                >
                  {trend.isPositive ? "↑" : "↓"} {trend.value}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}