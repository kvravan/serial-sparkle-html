import { Badge } from "@/components/ui/badge";
import { SerialStatus } from "@/types";

interface StatusBadgeProps {
  status: SerialStatus;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getVariant = (status: SerialStatus) => {
    switch (status) {
      case 'unassigned':
        return 'secondary';
      case 'blocked':
        return 'warning';
      case 'assigned':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getLabel = (status: SerialStatus) => {
    switch (status) {
      case 'unassigned':
        return 'Unassigned';
      case 'blocked':
        return 'Blocked';
      case 'assigned':
        return 'Assigned';
      default:
        return status;
    }
  };

  return (
    <Badge variant={getVariant(status)} className={className}>
      {getLabel(status)}
    </Badge>
  );
};