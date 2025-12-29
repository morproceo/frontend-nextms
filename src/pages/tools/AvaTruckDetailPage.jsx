/**
 * AVA Truck Detail Page
 * Shows diagnostics for a specific truck with AI analysis
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import * as avaApi from '../../api/ava.api';
import {
  ArrowLeft,
  Zap,
  Truck,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Clock,
  DollarSign,
  Wrench,
  Send,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Activity,
  Gauge
} from 'lucide-react';

// Severity badge configs
const SeverityConfig = {
  critical: { label: 'Critical', variant: 'red', icon: AlertTriangle, color: 'error' },
  warning: { label: 'Warning', variant: 'yellow', icon: AlertCircle, color: 'warning' },
  info: { label: 'Info', variant: 'blue', icon: Activity, color: 'blue-500' }
};

export function AvaTruckDetailPage() {
  const { truckId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const chatEndRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState({});
  const [error, setError] = useState(null);
  const [truck, setTruck] = useState(null);
  const [diagnostics, setDiagnostics] = useState([]);
  const [expandedCodes, setExpandedCodes] = useState({});
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch truck data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [diagRes, histRes] = await Promise.all([
        avaApi.getTruckDiagnostics(truckId),
        avaApi.getDiagnosticHistory(truckId, 20)
      ]);

      setDiagnostics(diagRes.data?.diagnostics || []);
      setHistory(histRes.data?.history || []);

      // Get truck info from first diagnostic
      if (diagRes.data?.diagnostics?.[0]?.truck) {
        setTruck(diagRes.data.diagnostics[0].truck);
      }
    } catch (err) {
      console.error('Error fetching truck data:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [truckId]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Analyze a diagnostic code
  const handleAnalyze = async (diagnostic) => {
    try {
      setAnalyzing(prev => ({ ...prev, [diagnostic.id]: true }));

      const result = await avaApi.analyzeCode(null, null, diagnostic.id);

      // Update diagnostic with analysis
      setDiagnostics(prev => prev.map(d =>
        d.id === diagnostic.id
          ? { ...d, ai_analysis: result.data?.analysis }
          : d
      ));

      // Expand the code to show analysis
      setExpandedCodes(prev => ({ ...prev, [diagnostic.id]: true }));
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(prev => ({ ...prev, [diagnostic.id]: false }));
    }
  };

  // Resolve a diagnostic
  const handleResolve = async (diagnosticId) => {
    try {
      await avaApi.resolveDiagnostic(diagnosticId);
      setDiagnostics(prev => prev.filter(d => d.id !== diagnosticId));
    } catch (err) {
      console.error('Resolve error:', err);
    }
  };

  // Send chat message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const messages = [...chatMessages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const result = await avaApi.chat(messages, truckId);

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: result.data?.message || 'Sorry, I could not process your request.'
      }]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Toggle code expansion
  const toggleCode = (id) => {
    setExpandedCodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(orgUrl('/tools/ava'))}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-title text-text-primary flex items-center gap-2">
            <Zap className="w-6 h-6 text-accent" />
            {truck ? `Unit #${truck.unit_number}` : 'Truck Diagnostics'}
          </h1>
          {truck && (
            <p className="text-body-sm text-text-secondary mt-1">
              {truck.year} {truck.make} {truck.model}
            </p>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-error" />
            <div className="flex-1">
              <p className="text-body-sm font-medium text-error">Error loading data</p>
              <p className="text-small text-text-secondary">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchData}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Diagnostics */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Diagnostics */}
          <Card padding="none">
            <div className="px-4 py-3 border-b border-surface-tertiary flex items-center justify-between">
              <h2 className="text-body font-medium text-text-primary">Active Diagnostics</h2>
              <Badge variant={diagnostics.length > 0 ? 'red' : 'green'}>
                {diagnostics.length} Active
              </Badge>
            </div>

            {diagnostics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-body font-medium text-text-primary">No Active Issues</h3>
                <p className="text-body-sm text-text-secondary">This truck is running healthy</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-tertiary">
                {diagnostics.map((diag) => {
                  const config = SeverityConfig[diag.severity] || SeverityConfig.info;
                  const Icon = config.icon;
                  const isExpanded = expandedCodes[diag.id];
                  const isAnalyzing = analyzing[diag.id];
                  const analysis = diag.ai_analysis;

                  return (
                    <div key={diag.id} className="p-4">
                      {/* Code Header */}
                      <div
                        className="flex items-start gap-3 cursor-pointer"
                        onClick={() => toggleCode(diag.id)}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-${config.color}/10`}>
                          <Icon className={`w-5 h-5 text-${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant={config.variant}>{diag.code}</Badge>
                            <span className="text-small text-text-tertiary">{diag.system}</span>
                          </div>
                          <p className="text-body-sm text-text-secondary mt-1">
                            {diag.description || 'No description available'}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-small text-text-tertiary">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(diag.first_seen_at).toLocaleDateString()}
                            </span>
                            {diag.odometer_at_detection && (
                              <span className="flex items-center gap-1">
                                <Gauge className="w-3 h-3" />
                                {diag.odometer_at_detection.toLocaleString()} mi
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!analysis && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAnalyze(diag);
                              }}
                              disabled={isAnalyzing}
                            >
                              {isAnalyzing ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Zap className="w-4 h-4 mr-1" />
                                  Analyze
                                </>
                              )}
                            </Button>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-text-tertiary" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-text-tertiary" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Analysis */}
                      {isExpanded && analysis && (
                        <div className="mt-4 ml-13 p-4 bg-surface-secondary rounded-lg space-y-4">
                          <div>
                            <h4 className="text-small font-medium text-text-primary mb-1">AI Analysis</h4>
                            <p className="text-body-sm text-text-secondary">{analysis.explanation}</p>
                          </div>

                          {analysis.possibleCauses?.length > 0 && (
                            <div>
                              <h4 className="text-small font-medium text-text-primary mb-2">Possible Causes</h4>
                              <ul className="space-y-1">
                                {analysis.possibleCauses.map((cause, i) => (
                                  <li key={i} className="text-body-sm text-text-secondary flex items-start gap-2">
                                    <span className="text-text-tertiary">•</span>
                                    {cause}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {analysis.recommendedFixes?.length > 0 && (
                            <div>
                              <h4 className="text-small font-medium text-text-primary mb-2">Recommended Fixes</h4>
                              <ol className="space-y-1 list-decimal list-inside">
                                {analysis.recommendedFixes.map((fix, i) => (
                                  <li key={i} className="text-body-sm text-text-secondary">
                                    {fix}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-surface-tertiary">
                            {analysis.estimatedCost && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-text-tertiary" />
                                <span className="text-body-sm text-text-primary font-medium">
                                  ${analysis.estimatedCost.min} - ${analysis.estimatedCost.max}
                                </span>
                              </div>
                            )}
                            {analysis.urgency && (
                              <Badge variant={
                                analysis.urgency === 'immediate' ? 'red' :
                                analysis.urgency === 'soon' ? 'yellow' : 'green'
                              }>
                                {analysis.urgency === 'immediate' ? 'Fix Immediately' :
                                 analysis.urgency === 'soon' ? 'Fix Soon' : 'Routine'}
                              </Badge>
                            )}
                            {analysis.canDrive !== undefined && (
                              <Badge variant={analysis.canDrive ? 'green' : 'red'}>
                                {analysis.canDrive ? 'Safe to Drive' : 'Do Not Drive'}
                              </Badge>
                            )}
                          </div>

                          <div className="flex justify-end pt-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleResolve(diag.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Resolved
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* History */}
          {history.length > 0 && (
            <Card padding="none">
              <div
                className="px-4 py-3 border-b border-surface-tertiary flex items-center justify-between cursor-pointer"
                onClick={() => setShowHistory(!showHistory)}
              >
                <h2 className="text-body font-medium text-text-primary">Diagnostic History</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="gray">{history.length} past issues</Badge>
                  {showHistory ? (
                    <ChevronUp className="w-5 h-5 text-text-tertiary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-tertiary" />
                  )}
                </div>
              </div>

              {showHistory && (
                <div className="divide-y divide-surface-tertiary">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-4">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="gray" size="sm">{item.code}</Badge>
                          <span className="text-small text-text-tertiary">{item.system}</span>
                        </div>
                        <p className="text-small text-text-secondary mt-1 line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                      <div className="text-small text-text-tertiary">
                        Resolved {new Date(item.resolved_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar - AI Chat */}
        <div className="space-y-4">
          <Card padding="none" className="flex flex-col h-[500px]">
            <div className="px-4 py-3 border-b border-surface-tertiary flex items-center gap-2">
              <Bot className="w-5 h-5 text-accent" />
              <h2 className="text-body font-medium text-text-primary">Ask AVA</h2>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-accent" />
                  </div>
                  <p className="text-body-sm text-text-secondary">
                    Ask me anything about this truck's diagnostics, repairs, or maintenance.
                  </p>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-accent" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-accent text-white'
                      : 'bg-surface-secondary text-text-primary'
                  }`}>
                    <p className="text-body-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-surface-secondary rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-text-secondary" />
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-accent" />
                  </div>
                  <div className="bg-surface-secondary rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-surface-tertiary">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about repairs, costs, parts..."
                  className="flex-1 px-3 py-2 bg-surface-secondary rounded-input text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  disabled={chatLoading}
                />
                <Button type="submit" disabled={!chatInput.trim() || chatLoading}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Card>

          {/* Quick Questions */}
          <Card padding="compact">
            <h3 className="text-small font-medium text-text-primary mb-2">Quick Questions</h3>
            <div className="flex flex-wrap gap-2">
              {[
                'How urgent is this?',
                'Can I keep driving?',
                'What parts do I need?',
                'Estimated repair cost?'
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setChatInput(q);
                  }}
                  className="px-3 py-1.5 bg-surface-secondary rounded-full text-small text-text-secondary hover:bg-surface-tertiary transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AvaTruckDetailPage;
