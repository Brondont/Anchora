import React, {
  createContext,
  useState,
  useCallback,
  ReactNode,
  useMemo,
  useRef,
  useContext,
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
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<FeedbackStatus>(true);
  const [alertIsOn, setAlertIsOn] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hideFeedback = useCallback(() => {
    setAlertIsOn(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showFeedback = useCallback(
    (message: string, newStatus: FeedbackStatus) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      setFeedback(message);
      setStatus(newStatus);
      setAlertIsOn(true);

      if (newStatus !== "pending") {
        timerRef.current = setTimeout(() => {
          setAlertIsOn(false);
          timerRef.current = null;
        }, 5000);
      }
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      feedback,
      status,
      alertIsOn,
      showFeedback,
      hideFeedback,
    }),
    [feedback, status, alertIsOn, showFeedback, hideFeedback]
  );

  return (
    <FeedbackAlertContext.Provider value={contextValue}>
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
