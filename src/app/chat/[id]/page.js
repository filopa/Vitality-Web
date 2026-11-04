import ConversationView from "../_components/ConversationView";

export const instant = false;

export const metadata = {
  title: { absolute: "Chat | Vitality" },
  robots: { index: false, follow: false },
};

export default async function ChatConversationPage({ params }) {
  const { id } = await params;
  return <ConversationView conversationId={id} />;
}
