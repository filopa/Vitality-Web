import ChatListView from "./_components/ChatListView";

export const metadata = {
  title: { absolute: "Chats | Vitality" },
  robots: { index: false, follow: false },
};

export default function ChatPage() {
  return <ChatListView />;
}
