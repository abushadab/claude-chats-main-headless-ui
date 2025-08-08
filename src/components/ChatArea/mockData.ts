// Mock data for ChatArea component

export const mockUsers = [
  { id: '1', name: 'Abu Shadab', avatar: 'AS', type: 'current_user' as const },
  { id: '2', name: 'Claude Assistant', avatar: 'CA', type: 'ai-agent' as const, subType: 'claude' },
  { id: '3', name: 'John Doe', avatar: 'JD', type: 'human' as const },
  { id: '4', name: 'Jane Smith', avatar: 'JS', type: 'human' as const },
];

export const availableAgents = [
  { id: 'agent1', name: 'Monitoring Agent', avatar: 'MA', type: 'ai-agent', subType: 'claude' },
  { id: 'agent2', name: 'DevOps Agent', avatar: 'DA', type: 'ai-agent', subType: 'claude' },
  { id: 'agent3', name: 'Security Agent', avatar: 'SA', type: 'ai-agent', subType: 'claude' },
  { id: 'agent4', name: 'Code Review Agent', avatar: 'CR', type: 'ai-agent', subType: 'claude' },
];

export const mockEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '😊',
  '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙',
  '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎',
  '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁',
  '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
  '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥',
  '👍', '👎', '👌', '🤝', '👏', '🙌', '👋', '🤚', '🖐️', '✋',
  '🖖', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👈',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'
];

export const motivationalQuotes = [
  {
    quote: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs"
  },
  {
    quote: "Your most unhappy customers are your greatest source of learning.",
    author: "Bill Gates"
  },
  {
    quote: "The first step is to establish that something is possible; then probability will occur.",
    author: "Elon Musk"
  },
  {
    quote: "If you don't give up, you still have a chance.",
    author: "Jack Ma"
  },
  {
    quote: "I am not afraid of an army of lions led by a sheep; I am afraid of an army of sheep led by a lion.",
    author: "Alexander the Great"
  },
  {
    quote: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney"
  },
  {
    quote: "Don't be afraid to give up the good to go for the great.",
    author: "John D. Rockefeller"
  },
  {
    quote: "I have not failed. I've just found 10,000 ways that won't work.",
    author: "Thomas Edison"
  },
  {
    quote: "Every master was once a disaster.",
    author: "T. Harv Eker"
  },
  {
    quote: "Chess is mental torture.",
    author: "Garry Kasparov"
  },
  {
    quote: "I prefer to lose a really good game than to win a bad one.",
    author: "Magnus Carlsen"
  },
  {
    quote: "Tactics flow from a superior position.",
    author: "Bobby Fischer"
  },
  {
    quote: "The best revenge is massive success.",
    author: "Frank Sinatra"
  },
  {
    quote: "Life is what happens to you while you're busy making other plans.",
    author: "John Lennon"
  },
  {
    quote: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt"
  },
  {
    quote: "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle"
  },
  {
    quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  },
  {
    quote: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    quote: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein"
  },
  {
    quote: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt"
  }
];

export const sharedImages = [
  { id: '1', url: 'https://picsum.photos/150/100?random=1', name: 'Screenshot 2024.png', date: '2 days ago', author: 'John Doe' },
  { id: '2', url: 'https://picsum.photos/150/100?random=2', name: 'Design mockup.jpg', date: '3 days ago', author: 'Sarah Chen' },
  { id: '3', url: 'https://picsum.photos/150/100?random=3', name: 'Graph chart.png', date: '1 week ago', author: 'Mike Ross' },
  { id: '4', url: 'https://picsum.photos/150/100?random=4', name: 'Dashboard UI.png', date: '2 weeks ago', author: 'Alex Rodriguez' },
  { id: '5', url: 'https://picsum.photos/150/100?random=5', name: 'Meeting notes.jpg', date: '3 weeks ago', author: 'Emma Wilson' },
  { id: '6', url: 'https://picsum.photos/150/100?random=6', name: 'Architecture.png', date: '1 month ago', author: 'Tom Chen' }
];

export const sharedFiles = [
  { id: '1', name: 'Project_Brief.pdf', size: '2.3 MB', date: '1 day ago', author: 'Alex Rodriguez', type: 'pdf' },
  { id: '2', name: 'Requirements.docx', size: '1.8 MB', date: '3 days ago', author: 'Emma Wilson', type: 'doc' },
  { id: '3', name: 'Budget.xlsx', size: '956 KB', date: '1 week ago', author: 'Tom Chen', type: 'excel' },
  { id: '4', name: 'Technical_Spec.pdf', size: '3.1 MB', date: '2 weeks ago', author: 'John Doe', type: 'pdf' },
  { id: '5', name: 'Presentation.pptx', size: '4.5 MB', date: '3 weeks ago', author: 'Sarah Chen', type: 'ppt' },
  { id: '6', name: 'Database_Schema.sql', size: '125 KB', date: '1 month ago', author: 'Mike Ross', type: 'code' }
];

export const channelMembers = [
  { id: '1', name: 'Abu Shadab', avatar: 'AS', status: 'online', role: 'Admin' },
  { id: '2', name: 'Sarah Chen', avatar: 'SC', status: 'online', role: 'Member' },
  { id: '3', name: 'John Doe', avatar: 'JD', status: 'away', role: 'Member' },
  { id: '4', name: 'Emma Wilson', avatar: 'EW', status: 'offline', role: 'Member' }
];