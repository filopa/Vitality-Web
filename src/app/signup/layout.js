import { SignupFlowProvider } from "./SignupFlowProvider";

export default function SignupLayout({ children }) {
  return <SignupFlowProvider>{children}</SignupFlowProvider>;
}
