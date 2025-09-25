import { CheckCircle, Clock } from "lucide-react";

export const getStatusIcon = (status: string,
  finished?: boolean) => {
    if (finished) return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <Clock className="w-5 h-5 text-orange-600" />;
};