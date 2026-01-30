interface ModsErrorAlertProps {
  message: string;
}

export const ModsErrorAlert = ({ message }: ModsErrorAlertProps) => (
  <div className="p-3 rounded-md bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200 border border-red-200 dark:border-red-700">
    {message}
  </div>
);
