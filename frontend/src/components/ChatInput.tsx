import React, { useState } from 'react';
import './ChatInput.css';

interface ChatInputProps {
  onSubmit: (input: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit }) => {
  const [input, setInput] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input-container">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask anything"
        className="chat-input"
      />
      <button type="submit" className="chat-submit-button">
        <span className="send-icon">➔</span>
      </button>
    </form>
  );
};

export default ChatInput;
