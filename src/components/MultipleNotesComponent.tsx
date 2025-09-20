// Multiple Notes Component
import React, { useState } from 'react';
import { Card, Form, Input, Button, List, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface Props {
  meeting: any;
  onSaveNotes: (notes: string[]) => void;
}

const MultipleNotesComponent: React.FC<Props> = ({ meeting, onSaveNotes }) => {
  const [notes, setNotes] = useState(meeting?.notes ? [meeting.notes] : []);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const addNote = () => {
    if (newNote.trim()) {
      const updatedNotes = [...notes, newNote.trim()];
      setNotes(updatedNotes);
      setNewNote('');
      saveNotes(updatedNotes);
    }
  };

  const deleteNote = (index: number) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
  };

  const saveNotes = async (notesToSave: string[]) => {
    if (!meeting) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/meetings/${meeting.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: notesToSave.join('\n---\n') // Join multiple notes with separator
        })
      });

      if (response.ok) {
        message.success("Notes saved successfully!");
        if (onSaveNotes) onSaveNotes(notesToSave);
      } else {
        message.error("Failed to save notes");
      }
    } catch (error) {
      message.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Meeting Notes" extra={
      <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        size="small"
        onClick={addNote}
        disabled={!newNote.trim()}
      >
        Add Note
      </Button>
    }>
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Add new note */}
        <TextArea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a new note..."
          rows={3}
          onPressEnter={(e) => {
            e.preventDefault();
            addNote();
          }}
        />
        
        {/* Display existing notes */}
        <List
          dataSource={notes}
          renderItem={(note, index) => (
            <List.Item
              actions={[
                <Popconfirm
                  title="Delete this note?"
                  onConfirm={() => deleteNote(index)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    size="small"
                  />
                </Popconfirm>
              ]}
            >
              <div style={{ 
                padding: '8px 12px', 
                background: '#f5f5f5', 
                borderRadius: '6px',
                width: '100%',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                {note}
              </div>
            </List.Item>
          )}
          locale={{ emptyText: 'No notes yet. Add your first note above.' }}
        />
      </Space>
    </Card>
  );
};

export default MultipleNotesComponent;
