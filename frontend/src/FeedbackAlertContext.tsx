import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

// Define the shape of the context
interface FeedbackContextType {
  feedback: string;
  showFeedback: (message: string, success: boolean) => void;
  success: boolean;
  alertIsOn: boolean;
}

// Create the context with a default value
const FeedbackContext = createContext<FeedbackContextType | undefined>(
  undefined
);

// Custom hook to use the feedback context
export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
};

// Define the props for the FeedbackProvider component
interface FeedbackProviderProps {
  children: ReactNode;
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({
  children,
}) => {
  const [alertIsOn, setAlertIsOn] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  const showFeedback = useCallback((message: string, success: boolean) => {
    setAlertIsOn(true);
    setFeedback(message);
    setSuccess(success);
    const timeoutID = setTimeout(() => setAlertIsOn(false), 2500); // allows slide out animation to play

    return () => clearTimeout(timeoutID); // Cleanup timeout on unmount
  }, []);

  return (
    <FeedbackContext.Provider
      value={{ feedback, showFeedback, success, alertIsOn }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};
