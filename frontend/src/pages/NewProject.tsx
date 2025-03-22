import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ChatInput from '../components/ChatInput';
import './NewProject.css';

interface NewProjectProps {
  onPromptSent?: () => void;
}

interface Table {
  name: string;
  columns: { name: string; type: string }[];
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const NewProject: React.FC<NewProjectProps> = ({ onPromptSent }) => {
  const [step, setStep] = useState<number>(0);
  const [schema, setSchema] = useState<Table[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const navigate = useNavigate();

  const parseSchema = (schemaText: string): Table[] => {
    const tables: Table[] = [];
    let currentTable: Table | null = null;
    let currentTableLines: string[] = [];

    const lines = schemaText.split('\n').filter((line) => line.trim());
    lines.forEach((line, index) => {
      const trimmedLine = line.trim().replace(/,$/, '');

      if (trimmedLine.startsWith('CREATE TABLE')) {
        if (currentTable) {
          currentTable.columns = currentTableLines
            .filter((l) => !l.startsWith(')') && !l.startsWith('FOREIGN KEY'))
            .map((l) => {
              const columnMatch = l.match(/^(\w+)\s+(.+)$/);
              if (columnMatch) {
                const name = columnMatch[1];
                const typeWithConstraints = columnMatch[2];
                const typeMatch =
                  typeWithConstraints.match(/^[A-Z]+\b(?:\(\d+\))?/)?.[0] ||
                  typeWithConstraints;
                return { name, type: typeMatch };
              }
              return null;
            })
            .filter(
              (col): col is { name: string; type: string } => col !== null
            );
          tables.push(currentTable);
        }

        const tableName = trimmedLine.match(/CREATE TABLE (\w+)/)?.[1];
        if (tableName) {
          currentTable = { name: tableName, columns: [] };
          currentTableLines = [];
        }
      } else if (currentTable) {
        currentTableLines.push(trimmedLine);
      }

      if (index === lines.length - 1 && currentTable) {
        currentTable.columns = currentTableLines
          .filter((l) => !l.startsWith(')') && !l.startsWith('FOREIGN KEY'))
          .map((l) => {
            const columnMatch = l.match(/^(\w+)\s+(.+)$/);
            if (columnMatch) {
              const name = columnMatch[1];
              const typeWithConstraints = columnMatch[2];
              const typeMatch =
                typeWithConstraints.match(/^[A-Z]+\b(?:\(\d+\))?/)?.[0] ||
                typeWithConstraints;
              return { name, type: typeMatch };
            }
            return null;
          })
          .filter((col): col is { name: string; type: string } => col !== null);
        tables.push(currentTable);
      }
    });

    return tables;
  };

  const handleSubmit = async (input: string) => {
    try {
      if (step === 0) {
        const res = await axios.post(
          'http://localhost:8080/api/projects/start',
          {
            step: 0,
            responses: [input],
          }
        );
        console.log('API Response:', res.data);
        const parsed = parseSchema(res.data.schema);
        console.log('Parsed Schema:', parsed);
        setSchema(parsed);
        setChatHistory(res.data.messages.slice(-2)); // Only the most recent 2 messages
        setStep(res.data.step);
        if (onPromptSent) onPromptSent();
      } else if (step === 1) {
        const res = await axios.post(
          'http://localhost:8080/api/projects/start',
          {
            step: 1,
            responses: [
              ...chatHistory
                .filter((m) => m.sender === 'user')
                .map((m) => m.text),
              input,
            ],
          }
        );
        console.log('API Response:', res.data);
        if (res.data.completed) {
          navigate(`/${res.data.projectId}`);
        } else {
          const parsed = parseSchema(res.data.schema);
          console.log('Parsed Schema:', parsed);
          setSchema(parsed);
          setChatHistory(res.data.messages.slice(-2)); // Only the most recent 2 messages
          setStep(res.data.step);
        }
      }
    } catch (err) {
      console.error('Frontend Error:', err);
      setChatHistory(
        [
          ...chatHistory,
          { sender: 'ai', text: 'Something went wrong.' } as const,
        ].slice(-2)
      );
    }
  };

  return (
    <div className="new-project-container">
      <div className={`chat-container ${step > 0 ? 'chat-started' : ''}`}>
        {step === 0 ? (
          <div className="welcome-container">
            <div className="welcome-message">
              <p>
                Welcome, <span className="user-italic">User</span>.
              </p>
              <p>What are we doing today?</p>
            </div>
          </div>
        ) : (
          <>
            {schema.length > 0 && (
              <div className="schema-tables">
                {schema.map((table, index) => (
                  <div key={index} className="table">
                    <h3 className="table-name">{table.name}</h3>
                    {table.columns.map((col, colIndex) => (
                      <div key={colIndex} className="table-column">
                        <span>{col.name}</span>
                        <span>{col.type}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div className="chat-messages">
              {chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${
                    msg.sender === 'ai' ? 'ai-message' : 'user-message'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="chat-input-wrapper">
        <ChatInput onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default NewProject;
