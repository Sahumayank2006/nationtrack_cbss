'use client';

import { ArrowRight, Bot, Car, Filter, MessageSquare, Send, Sparkles, User } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { type ChatAnswer, queryAgentKnowledge } from '@/lib/agent/orchestrator';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  answerData?: ChatAnswer;
  timestamp: string;
}

interface AgentChatAssistantProps {
  onSelectVehicle: (vehicleNo: string) => void;
}

const SUGGESTED_QUERIES = [
  'Which Gwalior vehicles are overdue under BNSS 497?',
  'Which vehicles are eligible for auction?',
  'Show all NDPS seized vehicles',
  'Show vehicles under MP Excise Act',
  'Which vehicles are rusted or valued under 10k?',
  'Show abandoned vehicles without known owners',
];

export const AgentChatAssistant: React.FC<AgentChatAssistantProps> = ({ onSelectVehicle }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: 'Hello, I am your Seized Vehicles Legal Agent. I am indexed on the CCTNS database and governing BNSS 2023 / Special Law rules. Ask me anything about vehicle deadlines, auction eligibility, or specific cases.',
      timestamp: 'Now',
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (queryToSend?: string) => {
    const q = (queryToSend || input).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: 'Just now',
    };

    const answer = queryAgentKnowledge(q);

    const agentMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      sender: 'agent',
      text: answer.reply,
      answerData: answer,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg, agentMsg]);
    setInput('');
  };

  return (
    <div className="flex h-[650px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="shadow-xs flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              Legal Knowledge Assistant
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                Simulated CCTNS
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Natural language cross-referencing against BNSS 2023, MP Excise, and NDPS statutes
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Queries */}
      <div className="overflow-x-auto border-b border-border/40 bg-muted/20 px-6 py-2.5">
        <div className="flex min-w-max items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Suggestions:
          </span>
          {SUGGESTED_QUERIES.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSend(sq)}
              className="cursor-pointer rounded-full border border-border/80 bg-background px-3 py-1 text-[11px] font-medium text-foreground/80 transition-colors hover:border-primary hover:text-primary"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((m) => {
          const isAgent = m.sender === 'agent';

          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isAgent ? 'items-start' : 'flex-row-reverse items-start'}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isAgent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {isAgent ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              <div className={`max-w-[85%] space-y-2.5 ${isAgent ? 'text-left' : 'text-right'}`}>
                <div
                  className={`inline-block rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isAgent
                      ? 'border border-border/60 bg-muted/50 text-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>

                {/* If answer matched vehicles, display a clean mini-table */}
                {isAgent &&
                  m.answerData?.matchedVehicles &&
                  m.answerData.matchedVehicles.length > 0 && (
                    <div className="shadow-xs space-y-2 rounded-xl border border-border/80 bg-background p-3.5">
                      <div className="flex items-center justify-between border-b border-border/40 pb-2 text-[11px] font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1 text-primary">
                          <Car className="h-3.5 w-3.5" />
                          Matched Vehicles ({m.answerData.matchedVehicles.length})
                        </span>
                        <span>Click to open investigation</span>
                      </div>

                      <div className="max-h-52 space-y-1.5 divide-y divide-border/20 overflow-y-auto">
                        {m.answerData.matchedVehicles.slice(0, 8).map((veh) => (
                          <div
                            key={veh.vehicle_no}
                            onClick={() => onSelectVehicle(veh.vehicle_no)}
                            className="flex cursor-pointer items-center justify-between rounded px-2 pb-1 pt-1.5 transition-colors hover:bg-muted/40"
                          >
                            <div>
                              <div className="font-mono text-xs font-bold text-foreground">
                                {veh.vehicle_no}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {veh.make_model} &bull; {veh.police_station}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-semibold text-foreground">
                                ₹{veh.est_value.toLocaleString('en-IN')}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-primary"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input box */}
      <div className="border-t border-border/60 bg-muted/20 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question (e.g. Which vehicles are overdue under BNSS 497?)..."
            className="flex-1 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button
            type="submit"
            size="sm"
            className="gap-1.5 bg-primary font-semibold text-primary-foreground"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};
