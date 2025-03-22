import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import ChatInput from '../components/ChatInput';
import './Project.css';

interface Column {
  name: string;
  type: string;
}

interface Table {
  name: string;
  columns: Column[];
}

interface ChatMessage {
  sender: 'ai' | 'user';
  message: string;
}

interface ProjectProps {
  onPromptSent?: () => void;
}

const Project: React.FC<ProjectProps> = ({ onPromptSent }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const [schema, setSchema] = useState<Table[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (projectId) {
      axios
        .get(`http://localhost:8080/api/projects/${projectId}`)
        .then((res) => {
          const schemaLines = res.data
            .split('\n')
            .filter((line: string) => line.trim());
          const tables: Table[] = [];
          let currentTable: Table | null = null;

          schemaLines.forEach((line: string) => {
            if (line.startsWith('CREATE TABLE')) {
              const tableName = line.match(/CREATE TABLE (\w+)/)?.[1];
              if (tableName) {
                currentTable = { name: tableName, columns: [] };
                tables.push(currentTable);
              }
            } else if (line.trim().startsWith('id') && currentTable) {
              currentTable.columns.push({ name: 'id', type: 'int' });
            } else if (line.trim().includes('varchar') && currentTable) {
              const [name, type] = line.trim().split(/\s+/);
              currentTable.columns.push({ name, type });
            } else if (line.trim().includes('TIMESTAMP') && currentTable) {
              const [name] = line.trim().split(/\s+/);
              currentTable.columns.push({ name, type: 'TIMESTAMP' });
            }
          });

          setSchema(tables);
          setChatHistory([
            {
              sender: 'ai',
              message: 'Welcome, User. What are we building today?',
            },
          ]);
        })
        .catch((err) => console.error(err));
    }
  }, [projectId]);

  const handleSubmit = async (input: string) => {
    const newChatHistory = [
      ...chatHistory,
      { sender: 'user', message: input } as ChatMessage,
    ];
    setChatHistory(newChatHistory);
    if (onPromptSent) {
      onPromptSent();
    }
    const prompt = `
      You are helping a user design a database schema. The current schema is:
      ${schema
        .map(
          (table) =>
            `Table ${table.name}: ${table.columns
              .map((col) => `${col.name} ${col.type}`)
              .join(', ')}`
        )
        .join('\n')}
      The user says: "${input}"
      Respond with a suggestion or modification to the schema, and provide the updated schema in SQL format.
    `;

    try {
      const response = await axios.post(
        'http://localhost:8080/api/projects/start',
        {
          step: 999,
          responses: [prompt],
        }
      );

      const aiResponse = response.data.schema;
      setChatHistory([
        ...newChatHistory,
        { sender: 'ai', message: aiResponse },
      ]);

      const schemaLines = aiResponse
        .split('\n')
        .filter((line: string) => line.trim());
      const tables: Table[] = [];
      let currentTable: Table | null = null;

      schemaLines.forEach((line: string) => {
        if (line.startsWith('CREATE TABLE')) {
          const tableName = line.match(/CREATE TABLE (\w+)/)?.[1];
          if (tableName) {
            currentTable = { name: tableName, columns: [] };
            tables.push(currentTable);
          }
        } else if (line.trim().startsWith('id') && currentTable) {
          currentTable.columns.push({ name: 'id', type: 'int' });
        } else if (line.trim().includes('varchar') && currentTable) {
          const [name, type] = line.trim().split(/\s+/);
          currentTable.columns.push({ name, type });
        } else if (line.trim().includes('TIMESTAMP') && currentTable) {
          const [name] = line.trim().split(/\s+/);
          currentTable.columns.push({ name, type: 'TIMESTAMP' });
        }
      });

      setSchema(tables);

      await axios.post('http://localhost:8080/api/projects/update', {
        projectId,
        schema: aiResponse,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const displayedChat = chatHistory.slice(-2);
  const hasPrompt = chatHistory.length > 1;

  return (
    <div className="project-container">
      <div className="content">
        {hasPrompt ? (
          <>
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
            <div className="chat-container">
              <div className="chat-messages">
                {displayedChat.map((msg, index) => (
                  <div
                    key={index}
                    className={`message ${
                      msg.sender === 'ai' ? 'ai-message' : 'user-message'
                    }`}
                  >
                    <p>{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="welcome-container">
            <div className="welcome-message">
              <p>
                Welcome, <span className="user-italic">User</span>.
              </p>
              <p>What are we building today?</p>
            </div>
          </div>
        )}
      </div>
      <div className="chat-input-wrapper">
        <ChatInput onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default Project;
