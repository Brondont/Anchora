import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { FeedbackStatus } from "./components/feedbackAlert/FeedbackAlert";

interface FeedbackContextProps {
  feedback: string;
  status: FeedbackStatus;
  alertIsOn: boolean;
  showFeedback: (message: string, status: FeedbackStatus) => void;
  hideFeedback: () => void;
}

const FeedbackAlertContext = createContext<FeedbackContextProps | undefined>(
  undefined
);

interface FeedbackProviderProps {
  children: ReactNode;
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({
  children,
}) => {
  const [feedback, setFeedback] = useState<string>("");
  const [status, setStatus] = useState<FeedbackStatus>(true);
  const [alertIsOn, setAlertIsOn] = useState<boolean>(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const hideFeedback = useCallback(() => {
    setAlertIsOn(false);
    if (timer) {
      clearTimeout(timer);
    }
  }, [timer]);

  const showFeedback = useCallback(
    (message: string, newStatus: FeedbackStatus) => {
      // Clear any existing timer
      if (timer) {
        clearTimeout(timer);
      }

      // Set feedback message and status
      setFeedback(message);
      setStatus(newStatus);
      setAlertIsOn(true);

      // Auto-hide after a delay unless it's a pending status
      if (newStatus !== "pending") {
        const newTimer = setTimeout(() => {
          setAlertIsOn(false);
        }, 5000);
        setTimer(newTimer);
      }
    },
    [timer]
  );

  return (
    <FeedbackAlertContext.Provider
      value={{ feedback, status, alertIsOn, showFeedback, hideFeedback }}
    >
      {children}
    </FeedbackAlertContext.Provider>
  );
};

export const useFeedback = (): FeedbackContextProps => {
  const context = useContext(FeedbackAlertContext);
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
};
