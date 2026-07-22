'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { tokens } from '@atelier/design-system';
import { DiscoveryResponse, DiscoveryQuestion, LivingBrief } from '@atelier/agents';
import { motion, AnimatePresence } from 'framer-motion';

import OnboardingView from './components/OnboardingView';
import DiscoveryLoopView from './components/DiscoveryLoopView';
import DivergenceView from './components/DivergenceView';
import ArchitectureBlueprintView from './components/ArchitectureBlueprintView';
import CodingCanvasView from './components/CodingCanvasView';
import QADashboardView from './components/QADashboardView';
import DeploymentBannerView from './components/DeploymentBannerView';
import ExperimentsPanel from './components/ExperimentsPanel';

const ACCEPTED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4', 'video/quicktime',
];

const ACCEPT_STRING = '.jpg,.jpeg,.png,.webp,.pdf,.pptx,.docx,.mp4,.mov';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const FIELDS: (keyof LivingBrief)[] = [
  'targetAudience',
  'platforms',
  'coreUserFlow',
  'has3DApplicability',
  'visualTone',
  'mustHaveFeatures',
  'niceToHaveFeatures'
];

const FIELD_OPTIONS: Record<string, string[]> = {
  mustHaveFeatures: ["Interactive 3D Hero Canvas", "Product Search & Filter Grid", "Shopping Cart & Pre-Order Checkout", "Admin Process Logs Console", "Figma Design Token Importer"],
  niceToHaveFeatures: ["User Profiles & Saved Wishlist", "Stripe Payment Gateway", "Live Chat Support", "Analytics Dashboard"],
  visualTone: ["Bold & Rebellious Street", "Minimalist & Clean", "Dark Cyberpunk", "Classic Serif Editorial"]
};

export default function DiscoveryWorkspacePage() {
  // Discovery State
  const [initialPrompt, setInitialPrompt] = useState('');
  const [project, setProject] = useState<DiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Q&A Conversation History (Q&A Logs)
  const [conversation, setConversation] = useState<{ type: 'pm' | 'user'; text: string; fields?: string[] }[]>([]);

  // Current batch input answers state
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Inline editing in right-hand brief panel
  const [editingField, setEditingField] = useState<keyof LivingBrief | null>(null);
  const [editValue, setEditValue] = useState<any>(null);

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [ingestionInfo, setIngestionInfo] = useState<{ fieldsPreFilled: number; results: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stage B State
  const [designDirections, setDesignDirections] = useState<any[] | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<any | null>(null);

  // Stage C State
  const [blueprint, setBlueprint] = useState<any | null>(null);
  const [activeNegotiation, setActiveNegotiation] = useState<any | null>(null);
  const [usabilityReport, setUsabilityReport] = useState<any | null>(null);
  const [previewUrlInput, setPreviewUrlInput] = useState('http://localhost:3000/preview');


  // Stage D: Code Execution & Real-time Canvas State
  const [isCodingView, setIsCodingView] = useState(false);
  const [executionTasks, setExecutionTasks] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);

  // Stage E State: QA Dashboard, Deployment Celebration & Growth Experiments
  const [isQAView, setIsQAView] = useState(false);
  const [qaReports, setQaReports] = useState<any[]>([]);
  const [deploymentInfo, setDeploymentInfo] = useState<any | null>(null);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [growthLogs, setGrowthLogs] = useState<string[]>([]);
  const [injectFailureTaskId, setInjectFailureTaskId] = useState<string>('');
  const [isGrowthRunning, setIsGrowthRunning] = useState(false);

  // Stage F State: Pitch Video Generation
  const [pitchVideo, setPitchVideo] = useState<any | null>(null);
  const [isPitchGenerating, setIsPitchGenerating] = useState(false);
  const [pitchLogs, setPitchLogs] = useState<string[]>([]);

  // Poll execution status and auto-transition to QA/Deployment
  useEffect(() => {
    let interval: any = null;
    if (isCodingView && project?.projectId) {
      const fetchStatus = async () => {
        try {
          const res = await fetch(`/api/execute?projectId=${project.projectId}`);
          if (res.ok) {
            const data = await res.json();
            const tasks = data.tasks || [];
            setExecutionTasks(tasks);
            
            // Check if all tasks have finished executing (COMPLETED or FAILED)
            const allFinished = tasks.length > 0 && tasks.every((t: any) => t.status === 'COMPLETED' || t.status === 'FAILED');
            if (allFinished) {
              if (interval) clearInterval(interval);
              setIsQAView(true);

              // Automatically deploy if all tasks completed QA successfully
              const allPassedQA = tasks.every((t: any) => t.status === 'COMPLETED');
              if (allPassedQA && !deploymentInfo) {
                const deployRes = await fetch('/api/deploy', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ projectId: project.projectId })
                });
                if (deployRes.ok) {
                  const deployData = await deployRes.json();
                  if (deployData.success) {
                    setDeploymentInfo(deployData.deployment);
                    // Fetch A/B testing experiments
                    const expRes = await fetch(`/api/experiments?projectId=${project.projectId}`);
                    if (expRes.ok) {
                      const expData = await expRes.json();
                      setExperiments(expData.experiments || []);
                    }
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error('Failed to poll task status:', err);
        }
      };

      // Initial fetch
      fetchStatus();
      
      interval = setInterval(fetchStatus, 1500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCodingView, project?.projectId, deploymentInfo]);

  // Sync QA reports and experiments when entering QA view
  useEffect(() => {
    if (isQAView && project?.projectId) {
      const fetchQAAndExperiments = async () => {
        try {
          const qaRes = await fetch(`/api/qa?projectId=${project.projectId}`);
          if (qaRes.ok) {
            const qaData = await qaRes.json();
            setQaReports(qaData.qaReports || []);
          }

          const expRes = await fetch(`/api/experiments?projectId=${project.projectId}`);
          if (expRes.ok) {
            const expData = await expRes.json();
            setExperiments(expData.experiments || []);
          }
        } catch (err) {
          console.error('Error fetching QA/Experiment info:', err);
        }
      };

      fetchQAAndExperiments();
      const interval = setInterval(fetchQAAndExperiments, 2000);
      return () => clearInterval(interval);
    }
  }, [isQAView, project?.projectId]);

  // Auto-select first generated file
  useEffect(() => {
    if (!selectedFile && executionTasks.length > 0) {
      const firstTaskWithFiles = executionTasks.find(t => t.status === 'COMPLETED' && t.result?.files?.length > 0);
      if (firstTaskWithFiles) {
        setSelectedFile(firstTaskWithFiles.result.files[0]);
      }
    }
  }, [executionTasks, selectedFile]);

  // Desktop sidebar collapse/expand state
  const [isBriefExpanded, setIsBriefExpanded] = useState(true);

  // Suggested prompt templates for fast onboarding
  const onboardingPrompts = [
    "a vintage sneaker store with 3D product view and checkout",
    "a premium mechanical keyboard builder with custom keycap design tokens",
    "a minimalism portfolio for an architectural designer with projects grid",
  ];

  // File handling
  const handleFilesSelected = useCallback((newFiles: FileList | File[]) => {
    const validFiles: File[] = [];
    for (const file of Array.from(newFiles)) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds 20 MB limit`);
        continue;
      }
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        setError(`File "${file.name}" is not a supported type`);
        continue;
      }
      // Deduplicate by name
      if (!uploadedFiles.some(f => f.name === file.name)) {
        validFiles.push(file);
      }
    }
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
    }
  }, [uploadedFiles]);

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const getFileIcon = (type: string): string => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('presentation')) return '📊';
    if (type.includes('word')) return '📝';
    if (type.startsWith('video/')) return '🎬';
    return '📎';
  };

  // Initialize discovery from prompt (with optional file uploads)
  const handleStartDiscovery = async (promptText: string) => {
    if (!promptText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let data: DiscoveryResponse & { fieldsPreFilled?: number; ingestionResults?: any[] };

      if (uploadedFiles.length > 0) {
        // Upload files alongside prompt via /api/ingest
        const formData = new FormData();
        formData.append('prompt', promptText);
        uploadedFiles.forEach(f => formData.append('files', f));

        const res = await fetch('/api/ingest', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(errBody.error || 'Failed to ingest files');
        }
        data = await res.json();

        // Store ingestion info for display
        if (data.fieldsPreFilled || data.ingestionResults) {
          setIngestionInfo({
            fieldsPreFilled: data.fieldsPreFilled || 0,
            results: data.ingestionResults || [],
          });
        }
      } else {
        // No files — standard discovery flow
        const res = await fetch('/api/discovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptText }),
        });
        if (!res.ok) {
          throw new Error(await res.text() || 'Failed to start project');
        }
        data = await res.json();
      }

      setProject(data);

      const filesSummary = uploadedFiles.length > 0
        ? ` I also analyzed ${uploadedFiles.length} uploaded file(s) and pre-filled ${(data as any).fieldsPreFilled || 0} brief field(s).`
        : '';

      setConversation([
        { type: 'user', text: promptText + (uploadedFiles.length > 0 ? ` [+ ${uploadedFiles.length} file(s)]` : '') },
        { 
          type: 'pm', 
          text: `Hi! I'm your PM Discovery Agent. I've parsed your prompt and auto-filled some initial details.${filesSummary} Let's clarify the remaining points to finalize your Living Brief.`,
        }
      ]);
      
      // Initialize answer holders for new questions
      const initialAnswers: Record<string, any> = {};
      data.questions.forEach(q => {
        initialAnswers[q.field] = q.type === 'closed-multi' ? [] : '';
      });
      setAnswers(initialAnswers);
      setUploadedFiles([]); // Clear files after successful submission
    } catch (err: any) {
      setError(err.message || 'Error occurred starting discovery');
    } finally {
      setLoading(false);
    }
  };

  // Generate design directions
  const handleGenerateDirections = async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/divergence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.projectId }),
      });
      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to generate design directions');
      }
      const data = await res.json();
      setDesignDirections(data.directions || []);
    } catch (err: any) {
      setError(err.message || 'Error occurred generating directions');
    } finally {
      setLoading(false);
    }
  };

  // Select design direction
  const handleSelectDirection = async (variantId: string) => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/divergence', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.projectId, variantId }),
      });
      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to select design direction');
      }
      const data = await res.json();
      const chosen = designDirections?.find(d => d.id === variantId);
      setSelectedDirection(chosen || null);
    } catch (err: any) {
      setError(err.message || 'Error selecting design direction');
    } finally {
      setLoading(false);
    }
  };

  // Generate technical blueprint
  const handleGenerateBlueprint = async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.projectId }),
      });
      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to generate technical blueprint');
      }
      const data = await res.json();
      setBlueprint(data);
      
      // Auto check if there are any active negotiations/conflicts
      await handleCheckNegotiations(project.projectId);
    } catch (err: any) {
      setError(err.message || 'Error occurred generating technical blueprint');
    } finally {
      setLoading(false);
    }
  };

  // Check active negotiations
  const handleCheckNegotiations = async (projId: string) => {
    try {
      const res = await fetch(`/api/negotiation?projectId=${projId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setActiveNegotiation(data[0]);
        } else {
          setActiveNegotiation(null);
        }
      }
    } catch (err) {
      console.warn('Failed to check negotiations:', err);
    }
  };

  // Resolve active negotiation conflict
  const handleResolveNegotiation = async (decision: string) => {
    if (!activeNegotiation || !project) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/negotiation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negotiationId: activeNegotiation.id, userDecision: decision }),
      });
      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to resolve negotiation');
      }
      setActiveNegotiation(null);
      // Re-trigger planning with new decision
      await handleGenerateBlueprint();
    } catch (err: any) {
      setError(err.message || 'Error resolving conflict');
      setLoading(false);
    }
  };

  // Trigger a mock conflict for testing/demo purposes
  const handleTriggerMockConflict = async () => {
    if (!project) return;
    setLoading(true);
    try {
      const res = await fetch('/api/negotiation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.projectId }),
      });
      if (res.ok) {
        const conflict = await res.json();
        setActiveNegotiation(conflict);
      }
    } catch (err) {
      console.warn('Failed to trigger mock conflict:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run synthetic usability test
  const handleRunUsabilityTest = async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/testing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.projectId, previewUrl: previewUrlInput }),
      });
      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to run synthetic test');
      }
      const report = await res.json();
      setUsabilityReport(report);
    } catch (err: any) {
      setError(err.message || 'Error running usability test');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndBeginCoding = async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.projectId })
      });

      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to start execution');
      }

      setIsCodingView(true);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.message || 'Error initializing execution');
    } finally {
      setLoading(false);
    }
  };

  // Stage E: QA & Deployment Action Handlers
  const handleRestartPipeline = async (failTaskId?: string) => {
    if (!project) return;
    setLoading(true);
    setError(null);
    setDeploymentInfo(null);
    setIsQAView(false);
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.projectId,
          injectFailureTaskId: failTaskId || ''
        })
      });

      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to restart execution');
      }

      setIsCodingView(true);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.message || 'Error restarting pipeline');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerGrowth = async () => {
    if (!project) return;
    setIsGrowthRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.projectId })
      });
      if (res.ok) {
        const data = await res.json();
        setGrowthLogs(prev => [...prev, ...data.logs]);
        // Refresh experiments list
        const expRes = await fetch(`/api/experiments?projectId=${project.projectId}`);
        if (expRes.ok) {
          const expData = await expRes.json();
          setExperiments(expData.experiments || []);
        }
      } else {
        throw new Error(await res.text() || 'Failed to run Growth Agent sweep');
      }
    } catch (err: any) {
      setError(err.message || 'Growth Agent error');
    } finally {
      setIsGrowthRunning(false);
    }
  };

  const handleActionExperiment = async (id: string, action: string) => {
    setError(null);
    try {
      const res = await fetch('/api/experiments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId: id, action })
      });
      if (res.ok) {
        // Refresh experiments list
        const expRes = await fetch(`/api/experiments?projectId=${project?.projectId}`);
        if (expRes.ok) {
          const expData = await expRes.json();
          setExperiments(expData.experiments || []);
        }
        setGrowthLogs(prev => [...prev, `[Action: ${action}] Executed on experiment ${id.substring(0,8)}.`]);
      } else {
        throw new Error(await res.text() || 'Failed to update experiment');
      }
    } catch (err: any) {
      setError(err.message || 'Experiment update error');
    }
  };

  const handleDownloadCode = () => {
    if (executionTasks.length === 0) return;
    
    // Aggregate all generated files into a single text document representing the source bundle
    let bundleText = `Atelier Generated Project Source Code Bundle\n`;
    bundleText += `Project ID: ${project?.projectId}\n`;
    bundleText += `Created At: ${new Date().toISOString()}\n`;
    bundleText += `========================================================\n\n`;

    executionTasks
      .filter(t => t.status === 'COMPLETED' && t.result?.files)
      .forEach(t => {
        t.result.files.forEach((file: any) => {
          bundleText += `/// FILE: ${file.path}\n`;
          bundleText += `/// ====================================================\n`;
          bundleText += `${file.content}\n\n`;
        });
      });

    const blob = new Blob([bundleText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `atelier-project-${project?.projectId?.substring(0, 8) || 'source'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Stage F: Generate Pitch Video
  const handleGeneratePitch = async () => {
    if (!project) return;
    setIsPitchGenerating(true);
    setError(null);
    setPitchLogs([]);
    try {
      const res = await fetch('/api/pitch-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.projectId })
      });
      if (res.ok) {
        const data = await res.json();
        setPitchVideo(data.pitchVideo);
        setPitchLogs(data.logs || []);
      } else {
        throw new Error(await res.text() || 'Failed to generate pitch video');
      }
    } catch (err: any) {
      setError(err.message || 'Pitch video generation failed');
    } finally {
      setIsPitchGenerating(false);
    }
  };

  // Submit batch of answers
  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/discovery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.projectId,
          answers
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to submit answers');
      }

      const data: DiscoveryResponse = await res.json();
      
      const newLogs: typeof conversation = [];
      project.questions.forEach(q => {
        const val = answers[q.field];
        const formattedVal = Array.isArray(val) ? val.join(', ') : String(val);
        newLogs.push({
          type: 'pm',
          text: q.text,
          fields: [q.field]
        });
        newLogs.push({
          type: 'user',
          text: formattedVal || '[Skipped / Empty]'
        });
      });

      setConversation(prev => [...prev, ...newLogs]);
      setProject(data);

      const initialAnswers: Record<string, any> = {};
      data.questions.forEach(q => {
        initialAnswers[q.field] = q.type === 'closed-multi' ? [] : '';
      });
      setAnswers(initialAnswers);
    } catch (err: any) {
      setError(err.message || 'Error occurred submitting answers');
    } finally {
      setLoading(false);
    }
  };

  // Save inline edit from sidebar brief
  const handleSaveInlineEdit = async (field: keyof LivingBrief) => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/brief', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.projectId,
          brief: { [field]: editValue }
        })
      });
      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to save brief edit');
      }
      const data: DiscoveryResponse = await res.json();
      setProject(data);
      setEditingField(null);
      setEditValue(null);

      const initialAnswers: Record<string, any> = {};
      data.questions.forEach(q => {
        initialAnswers[q.field] = q.type === 'closed-multi' ? [] : '';
      });
      setAnswers(initialAnswers);
    } catch (err: any) {
      setError(err.message || 'Error saving brief edit');
    } finally {
      setLoading(false);
    }
  };

  // Handle chip select inside question forms
  const toggleChipSelection = (field: string, option: string, isMulti: boolean) => {
    if (isMulti) {
      const currentList = (answers[field] as string[]) || [];
      if (currentList.includes(option)) {
        setAnswers(prev => ({
          ...prev,
          [field]: currentList.filter(item => item !== option)
        }));
      } else {
        setAnswers(prev => ({
          ...prev,
          [field]: [...currentList, option]
        }));
      }
    } else {
      setAnswers(prev => ({
        ...prev,
        [field]: option
      }));
    }
  };

  const toggleInlineChipSelection = (option: string, isMulti: boolean) => {
    if (isMulti) {
      const currentList = (editValue as string[]) || [];
      if (currentList.includes(option)) {
        setEditValue(currentList.filter(item => item !== option));
      } else {
        setEditValue([...currentList, option]);
      }
    } else {
      setEditValue(option);
    }
  };

  const FIELD_LABELS: Record<keyof LivingBrief, string> = {
    targetAudience: "Target Audience",
    platforms: "Target Platforms",
    coreUserFlow: "Core User Flow",
    has3DApplicability: "Immersive 3D Features",
    visualTone: "Brand Visual Tone",
    mustHaveFeatures: "Must-Have features",
    niceToHaveFeatures: "Nice-To-Have features"
  };

  const getBriefValue = (field: keyof LivingBrief) => {
    if (!project || !project.brief) return null;
    return project.brief[field];
  };

  const isFieldFilled = (field: keyof LivingBrief) => {
    const val = getBriefValue(field);
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  };

  return (
    <main 
      className="flex h-screen w-screen overflow-hidden text-sm relative bg-[#0B0D12] text-[#F2F0EC] font-sans selection:bg-[#C9A227]/30 selection:text-[#F2F0EC]"
    >
      {/* LEFT SIDE: Onboarding Workspace & Active Q&A Stream */}
      <div 
        className="flex-1 flex flex-col h-full border-r border-white/10 relative overflow-hidden transition-all duration-500"
      >
        {/* Workspace Brand Header */}
        <div 
          className="flex items-center justify-between p-6 border-b border-white/10 bg-[#14171F]"
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs bg-[#C9A227] text-[#0B0D12] font-serif shadow-md"
            >
              A
            </div>
            <div>
              <span 
                className="font-serif tracking-wider uppercase text-xs block text-[#F2F0EC]"
              >
                ATELIER STUDIO
              </span>
              <span className="text-[10px] text-[#7E7A72] font-mono">NOCTURNE MULTI-AGENT PLATFORM</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span 
              className="px-2.5 py-1 rounded-lg text-[10px] uppercase font-mono tracking-wider bg-[#C9A227]/15 border border-[#C9A227]/30 text-[#C9A227]"
            >
              {isQAView ? 'Phase 3 // QA & Deploy' : isCodingView ? 'Phase 2 // Code Synthesis' : project ? 'Phase 1 // Discovery' : 'Phase 0 // Intake'}
            </span>
          </div>
        </div>

        {/* Left Side Body Content */}
        <div className="flex-1 flex flex-col overflow-y-auto p-8 relative">
          
          {/* Spec Annotations for Left Panel */}
          <div className="absolute top-10 right-10 hidden xl:flex items-center gap-2 pointer-events-none font-mono text-[9px] text-zinc-400 select-none">
            <span>SPEC_01 // Q_STREAM_ANCHOR</span>
            <svg width="45" height="15" className="opacity-40">
              <line x1="0" y1="7" x2="35" y2="7" stroke="#8A93A3" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="35" cy="7" r="2" fill="#8A93A3" />
            </svg>
          </div>

          <AnimatePresence mode="wait">
            {!project ? (
              <motion.div 
                key="prompt-stage"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3 }}
              >
                <OnboardingView
                  initialPrompt={initialPrompt}
                  setInitialPrompt={setInitialPrompt}
                  loading={loading}
                  uploadedFiles={uploadedFiles}
                  isDragging={isDragging}
                  setIsDragging={setIsDragging}
                  handleFilesSelected={handleFilesSelected}
                  removeFile={removeFile}
                  getFileIcon={getFileIcon}
                  fileInputRef={fileInputRef}
                  handleStartDiscovery={handleStartDiscovery}
                  onboardingPrompts={onboardingPrompts}
                  tokens={tokens}
                />
              </motion.div>
            ) : isQAView ? (
              <motion.div
                key="qa-stage"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col space-y-6 max-w-6xl mx-auto w-full pb-10 select-text"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-4 border-zinc-200">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      Stage E — Quality Assurance &amp; Deployment Engine
                    </span>
                    <h2 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">
                      QA Specialist &amp; Deployment Dashboard
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsQAView(false)}
                      className="px-3 py-1.5 border rounded font-mono text-[9px] uppercase hover:bg-zinc-50 border-zinc-300 text-zinc-600 font-bold"
                    >
                      View Generated Code
                    </button>
                    {deploymentInfo ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-mono text-[9px] uppercase font-bold animate-pulse">
                        🚀 Deployed Live
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded font-mono text-[9px] uppercase font-bold">
                        Running QA Checks
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  {/* Left Column: Live Test Runner and Statuses */}
                  <div className="col-span-12 md:col-span-5 space-y-6">
                    <QADashboardView
                      qaReports={qaReports}
                      handleRestartPipeline={handleRestartPipeline}
                      tokens={tokens}
                    />

                    {/* Console Logs */}
                    <div className="bg-zinc-950 text-zinc-200 p-5 rounded border border-zinc-800 font-mono text-xs shadow-lg space-y-3 relative overflow-hidden h-72">
                      <div className="absolute top-1 left-2 text-[8px] text-zinc-500 uppercase tracking-widest pointer-events-none select-none">
                        CONSOLE_OUTPUT // QA_TELEMETRY
                      </div>
                      <div className="h-full overflow-y-auto pt-4 space-y-1.5 leading-relaxed text-[11px] select-text">
                        <div className="text-zinc-500">[{new Date().toISOString()}] Launching QA evaluation runner...</div>
                        {qaReports.flatMap(t => {
                          const resLogs = t.qaReport?.logs || [];
                          return resLogs.map((log: string) => (
                            <div key={log} className={log.includes('[FAILED]') ? 'text-red-400' : 'text-emerald-400'}>
                              🖳 {log}
                            </div>
                          ));
                        })}
                        {qaReports.every(t => t.status === 'COMPLETED') && (
                          <div className="text-teal-400 font-bold">✓ ALL QA TESTS PASSED. Initiating release packaging...</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Celebratory Banner & Production Sandbox Preview */}
                  <div className="col-span-12 md:col-span-7 space-y-6">
                    {deploymentInfo ? (
                      <>
                        <DeploymentBannerView
                          deploymentInfo={deploymentInfo}
                          selectedDirection={selectedDirection}
                          experiments={experiments}
                          handleDownloadCode={handleDownloadCode}
                          handleGeneratePitch={handleGeneratePitch}
                          isPitchGenerating={isPitchGenerating}
                          pitchVideo={pitchVideo}
                          pitchLogs={pitchLogs}
                          tokens={tokens}
                        />

                        <ExperimentsPanel
                          experiments={experiments}
                          handleTriggerGrowth={handleTriggerGrowth}
                          isGrowthRunning={isGrowthRunning}
                          handleActionExperiment={handleActionExperiment}
                          growthLogs={growthLogs}
                        />
                      </>
                    ) : (
                      <div className="p-8 rounded border border-dashed border-zinc-300 bg-white text-center py-20 font-mono text-zinc-400 text-xs">
                        {qaReports.some(t => t.status === 'FAILED') ? (
                          <div className="space-y-3">
                            <div className="text-xl">⚠️ Deployment Gated</div>
                            <p className="max-w-md mx-auto leading-relaxed">
                              One or more tasks failed our Nemotron test compliance specifications. Fix the errors using self-healing above to resume automated staging.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="w-8 h-8 rounded-full border-2 border-zinc-400 border-t-zinc-700 animate-spin mx-auto" />
                            <div>Compiling production bundles &amp; mapping static routes...</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : isCodingView ? (
              <motion.div
                key="coding-stage"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col space-y-6 max-w-6xl mx-auto w-full pb-10 select-text"
              >
                <div className="flex items-center justify-between border-b pb-4 border-zinc-200">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#28456B] bg-[#28456B]/10 px-2 py-0.5 rounded">
                      Stage D — Multi-Agent Assembly Line
                    </span>
                    <h2 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">
                      Code Execution Canvas
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsCodingView(false)}
                      className="px-3 py-1.5 border rounded font-mono text-[9px] uppercase hover:bg-zinc-50 border-zinc-300 text-zinc-600 font-bold"
                    >
                      View Blueprint
                    </button>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono text-[9px] uppercase font-bold animate-pulse">
                      Sandbox Running
                    </span>
                  </div>
                </div>

                <CodingCanvasView
                  executionTasks={executionTasks}
                  selectedFile={selectedFile}
                  setSelectedFile={setSelectedFile}
                  tokens={tokens}
                />
              </motion.div>
            ) : blueprint ? (
              <ArchitectureBlueprintView
                blueprint={blueprint}
                setBlueprint={setBlueprint}
                activeNegotiation={activeNegotiation}
                handleResolveNegotiation={handleResolveNegotiation}
                handleTriggerMockConflict={handleTriggerMockConflict}
                previewUrlInput={previewUrlInput}
                setPreviewUrlInput={setPreviewUrlInput}
                handleRunUsabilityTest={handleRunUsabilityTest}
                usabilityReport={usabilityReport}
                handleApproveAndBeginCoding={handleApproveAndBeginCoding}
                loading={loading}
                tokens={tokens}
              />
            ) : selectedDirection || designDirections ? (
              <DivergenceView
                designDirections={designDirections || []}
                selectedDirection={selectedDirection}
                setSelectedDirection={setSelectedDirection}
                handleSelectDirection={handleSelectDirection}
                setDesignDirections={setDesignDirections}
                handleGenerateBlueprint={handleGenerateBlueprint}
                loading={loading}
                tokens={tokens}
              />
            ) : (
              <DiscoveryLoopView
                project={project}
                conversation={conversation}
                answers={answers}
                setAnswers={setAnswers}
                handleSubmitBatch={handleSubmitBatch}
                toggleChipSelection={toggleChipSelection}
                handleGenerateDirections={handleGenerateDirections}
                resetWorkspace={() => {
                  setProject(null);
                  setConversation([]);
                  setInitialPrompt('');
                }}
                loading={loading}
                tokens={tokens}
                initialPrompt={initialPrompt}
              />
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div 
            className="absolute bottom-6 left-6 right-6 p-4 rounded border text-xs flex items-center justify-between z-55 bg-white shadow-lg"
            style={{ 
              backgroundColor: tokens.colors.status.danger + '15',
              borderColor: tokens.colors.status.danger,
              color: tokens.colors.status.danger 
            }}
          >
            <span><strong>Error:</strong> {error}</span>
            <button onClick={() => setError(null)} className="font-bold underline uppercase text-[10px] ml-4">Dismiss</button>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: Collapsible Persistent 'Living Brief' Panel */}
      <div 
        className={`h-full flex flex-col bg-[#14171F] transition-all duration-500 overflow-hidden relative border-l border-white/10 ${
          isBriefExpanded ? 'w-[420px]' : 'w-12 cursor-pointer hover:bg-[#1E2330]'
        }`}
        onClick={() => {
          if (!isBriefExpanded) setIsBriefExpanded(true);
        }}
      >
        {/* Expanded Mode View */}
        {isBriefExpanded ? (
          <div className="flex flex-col h-full w-full bg-[#14171F]">
            {/* Header with Title and Collapse Toggle */}
            <div 
              className="p-6 border-b border-white/10 flex items-center justify-between bg-[#14171F]"
            >
              <div className="flex items-center gap-2">
                <span 
                  className="font-mono font-bold text-xs tracking-widest uppercase text-[#C9A227]"
                >
                  LIVING BRIEF
                </span>
                <span className="font-mono text-[9px] bg-[#0B0D12] text-[#7E7A72] px-2 py-0.5 rounded border border-white/10">v1.0</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBriefExpanded(false);
                }}
                className="px-2.5 py-1 rounded-lg border border-white/10 bg-[#0B0D12] hover:border-[#C9A227]/40 font-mono text-[10px] uppercase text-[#C4C0B6] transition-all hover:text-[#F2F0EC]"
              >
                Collapse ❯
              </button>
            </div>

            {/* Progress Bar Panel */}
            <div 
              className="p-6 border-b border-white/10 space-y-2 bg-[#0B0D12]/60"
            >
              <div className="flex items-center justify-between font-mono text-[10px] text-[#C4C0B6]">
                <span className="uppercase text-[#C9A227]">BRIEF RESOLVED COMPLETENESS</span>
                <span className="font-bold text-[#F2F0EC]">{project ? `${project.completeness}%` : '0%'}</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden bg-[#0B0D12] border border-white/10">
                <div 
                  className="h-full rounded-full transition-all duration-500 ease-out bg-[#C9A227]"
                  style={{
                    width: project ? `${project.completeness}%` : '0%',
                  }}
                />
              </div>

              {/* Ingestion Pre-Fill Indicator */}
              {ingestionInfo && ingestionInfo.fieldsPreFilled > 0 && (
                <div 
                  className="flex items-center gap-2 mt-2 px-2.5 py-1.5 rounded-lg text-[10px] font-mono border border-[#52B788]/30 bg-[#2D6A4F]/20 text-[#52B788]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#52B788]" />
                  <span>{ingestionInfo.fieldsPreFilled} field(s) pre-filled from {ingestionInfo.results.length} uploaded file(s)</span>
                </div>
              )}
            </div>

            {/* Brief Fields List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {FIELDS.map((field) => {
                const label = FIELD_LABELS[field];
                const filled = project ? isFieldFilled(field) : false;
                const value = project ? getBriefValue(field) : null;
                const isEditing = editingField === field;

                return (
                  <div 
                    key={field}
                    className="group relative flex flex-col p-4 bg-[#0B0D12] rounded-xl border border-white/10 shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#C9A227]">
                        {label}
                      </span>
                      
                      {project && !isEditing && (
                        <button 
                          onClick={() => {
                            setEditingField(field);
                            let safeValue = value;
                            if (field === 'platforms' || field === 'mustHaveFeatures' || field === 'niceToHaveFeatures') {
                              if (Array.isArray(value)) {
                                safeValue = value;
                              } else if (typeof value === 'string' && value.trim()) {
                                safeValue = value.split(',').map(s => s.trim()).filter(Boolean);
                              } else {
                                safeValue = [];
                              }
                            } else if (typeof value === 'boolean') {
                              safeValue = value;
                            } else {
                              safeValue = value === null || value === undefined ? '' : String(value);
                            }
                            setEditValue(safeValue);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-all font-mono text-[10px] uppercase text-[#7E7A72] hover:text-[#F2F0EC] flex items-center gap-1"
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </div>

                    {/* Inline Editing Form */}
                    {isEditing ? (
                      <div className="space-y-3 pt-1">
                        {field === 'has3DApplicability' && (
                          <div className="flex gap-2">
                            {[true, false].map((opt) => {
                              const isSelected = editValue === opt;
                              return (
                                <button
                                  type="button"
                                  key={String(opt)}
                                  onClick={() => setEditValue(opt)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-mono ${
                                    isSelected 
                                      ? 'bg-[#C9A227] text-[#0B0D12] font-bold' 
                                      : 'bg-[#14171F] border border-white/10 text-[#C4C0B6]'
                                  }`}
                                >
                                  {opt ? 'Yes (3D Active)' : 'No (2D Only)'}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {field === 'platforms' && (() => {
                          const selectedList = Array.isArray(editValue) 
                            ? editValue.map(String) 
                            : (typeof editValue === 'string' && editValue.trim() ? editValue.split(',').map(s => s.trim()).filter(Boolean) : []);
                          return (
                            <div className="flex gap-2">
                              {['web', 'mobile'].map((opt) => {
                                const isSelected = selectedList.includes(opt);
                                return (
                                  <button
                                    type="button"
                                    key={opt}
                                    onClick={() => {
                                      if (isSelected) {
                                        setEditValue(selectedList.filter(i => i !== opt));
                                      } else {
                                        setEditValue([...selectedList, opt]);
                                      }
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase ${
                                      isSelected 
                                        ? 'bg-[#C9A227] text-[#0B0D12] font-bold' 
                                        : 'bg-[#14171F] border border-white/10 text-[#C4C0B6]'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}

                        {(field === 'mustHaveFeatures' || field === 'niceToHaveFeatures') && (() => {
                          const featureList = Array.isArray(editValue) 
                            ? editValue.map(String) 
                            : (typeof editValue === 'string' && editValue.trim() ? editValue.split(',').map(s => s.trim()).filter(Boolean) : []);
                          return (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1.5">
                                {featureList.map((item, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono bg-[#2B4C7E]/30 text-[#9BB8E5] border border-[#2B4C7E]">
                                    <span>{item}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditValue(featureList.filter((_, i) => i !== idx));
                                      }}
                                      className="hover:text-white font-bold ml-1"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <input
                                type="text"
                                placeholder="Type option and press Enter..."
                                className="w-full p-2 border border-white/10 rounded-lg outline-none text-xs bg-[#14171F] text-[#F2F0EC]"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const inputVal = e.currentTarget.value.trim();
                                    if (inputVal) {
                                      if (!featureList.includes(inputVal)) {
                                        setEditValue([...featureList, inputVal]);
                                      }
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                            </div>
                          );
                        })()}

                        {field === 'visualTone' && (
                          <div className="flex flex-wrap gap-1.5">
                            {FIELD_OPTIONS.visualTone.map((opt) => {
                              const isSelected = editValue === opt;
                              return (
                                <button
                                  type="button"
                                  key={opt}
                                  onClick={() => setEditValue(opt)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-mono ${
                                    isSelected 
                                      ? 'bg-[#C9A227] text-[#0B0D12] font-bold' 
                                      : 'bg-[#14171F] border border-white/10 text-[#C4C0B6]'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {(field === 'targetAudience' || field === 'coreUserFlow') && (
                          <textarea
                            rows={2}
                            className="w-full p-2.5 border border-white/10 rounded-lg outline-none text-xs bg-[#14171F] text-[#F2F0EC] resize-none"
                            value={Array.isArray(editValue) ? editValue.join(', ') : (editValue || '')}
                            onChange={(e) => setEditValue(e.target.value)}
                          />
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => {
                              setEditingField(null);
                              setEditValue(null);
                            }}
                            className="px-3 py-1 rounded-lg border border-white/10 text-[10px] uppercase font-mono text-[#C4C0B6] bg-[#14171F] hover:bg-[#1E2330]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveInlineEdit(field)}
                            className="px-3 py-1 rounded-lg text-[#0B0D12] text-[10px] uppercase font-mono font-bold bg-[#C9A227] hover:bg-[#A6841C]"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Read-Only Field State
                      <div>
                        {filled ? (
                          <div className="text-xs leading-relaxed text-[#F2F0EC]">
                            {field === 'has3DApplicability' ? (
                              <div className="flex items-center gap-2">
                                <span 
                                  className="w-2 h-2 rounded-full bg-[#C9A227] animate-pulse" 
                                />
                                <span>{value ? 'Yes, interactive 3D rendering activated' : 'No, 2D assets only'}</span>
                              </div>
                            ) : Array.isArray(value) ? (
                              <div className="flex flex-wrap gap-1.5">
                                {value.map((v, i) => (
                                  <span 
                                    key={i} 
                                    className="px-2.5 py-1 rounded-md text-[10px] font-mono border border-[#2B4C7E] bg-[#2B4C7E]/20 text-[#9BB8E5]"
                                  >
                                    {v}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="font-serif text-sm text-[#F2F0EC]">{String(value)}</span>
                            )}
                          </div>
                        ) : (
                          <div 
                            className="text-[11px] font-mono italic p-2.5 border border-dashed border-white/10 rounded-lg text-center text-[#7E7A72]"
                          >
                            [Pending Discovery - Interview Queue]
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Collapsed Mode View (Narrow Ribbon)
          <div className="flex flex-col h-full w-full items-center py-6 select-none justify-between bg-[#14171F]">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsBriefExpanded(true);
              }}
              className="w-8 h-8 rounded-lg border border-white/10 bg-[#0B0D12] hover:border-[#C9A227]/40 flex items-center justify-center font-bold text-[#C9A227]"
            >
              ❮
            </button>

            <div 
              className="font-mono text-[#C9A227] font-bold uppercase tracking-[0.2em] text-xs leading-none select-none my-auto"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed'
              }}
            >
              LIVING BRIEF
            </div>

            <div 
              className="w-8 h-8 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 flex items-center justify-center font-mono text-[9px] font-bold text-[#C9A227]"
            >
              {project ? `${project.completeness}%` : '0%'}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
